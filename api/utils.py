import json
import os

import numpy as np
import requests, ring, logging
from decouple import config

from api.models import Order

logger = logging.getLogger("api.utils")

TOR_PROXY = config("TOR_PROXY", default="127.0.0.1:9050")
USE_TOR = config("USE_TOR", cast=bool, default=True)


def get_session():
    session = requests.session()
    # Tor uses the 9050 port as the default socks port
    if USE_TOR:
        session.proxies = {
            "http": "socks5://" + TOR_PROXY,
            "https": "socks5://" + TOR_PROXY,
        }
    return session


def bitcoind_rpc(method, params=None):
    """
    Makes a RPC call to bitcoin core daemon
    :param method: RPC method to call
    :param params: list of params required by the calling RPC method
    :return:
    """

    BITCOIND_RPCURL = config("BITCOIND_RPCURL")
    BITCOIND_RPCUSER = config("BITCOIND_RPCUSER")
    BITCOIND_RPCPASSWORD = config("BITCOIND_RPCPASSWORD")

    if params is None:
        params = []

    payload = json.dumps(
        {"jsonrpc": "2.0", "id": "robosats", "method": method, "params": params}
    )
    return requests.post(
        BITCOIND_RPCURL, auth=(BITCOIND_RPCUSER, BITCOIND_RPCPASSWORD), data=payload
    ).json()["result"]


def validate_onchain_address(address):
    """
    Validates an onchain address
    """

    try:
        validation = bitcoind_rpc("validateaddress", [address])
        if not validation["isvalid"]:
            return False, {"bad_address": "Invalid address"}
    except Exception as e:
        logger.error(e)
        return False, {
            "bad_address": "Unable to validate address, check bitcoind backend"
        }

    return True, None


market_cache = {}


@ring.dict(market_cache, expire=3)  # keeps in cache for 3 seconds
def get_exchange_rates(currencies):
    """
    Params: list of currency codes.
    Checks for exchange rates in several public APIs.
    Returns the median price list.
    """

    session = get_session()

    APIS = config("MARKET_PRICE_APIS", cast=lambda v: [s.strip() for s in v.split(",")])

    api_rates = []
    for api_url in APIS:
        try:  # If one API is unavailable pass
            if "blockchain.info" in api_url:
                blockchain_prices = session.get(api_url).json()
                blockchain_rates = []
                for currency in currencies:
                    try:  # If a currency is missing place a None
                        blockchain_rates.append(
                            float(blockchain_prices[currency]["last"])
                        )
                    except:
                        blockchain_rates.append(np.nan)
                api_rates.append(blockchain_rates)

            elif "yadio.io" in api_url:
                yadio_prices = session.get(api_url).json()
                yadio_rates = []
                for currency in currencies:
                    try:
                        yadio_rates.append(float(yadio_prices["BTC"][currency]))
                    except:
                        yadio_rates.append(np.nan)
                api_rates.append(yadio_rates)
        except:
            pass

    if len(api_rates) == 0:
        return None  # Wops there is not API available!

    exchange_rates = np.array(api_rates)
    median_rates = np.nanmedian(exchange_rates, axis=0)

    return median_rates.tolist()


def get_lnd_version():

    # If dockerized, return LND_VERSION envvar used for docker image.
    # Otherwise it would require LND's version.grpc libraries...
    try:
        lnd_version = config("LND_VERSION")
        return lnd_version
    except:
        pass

    # If not dockerized and LND is local, read from CLI
    try:
        stream = os.popen("lnd --version")
        lnd_version = stream.read()[:-1]
        return lnd_version
    except:
        return ""


robosats_commit_cache = {}


@ring.dict(robosats_commit_cache, expire=3600)
def get_robosats_commit():

    commit = os.popen('git log -n 1 --pretty=format:"%H"')
    commit_hash = commit.read()

    # .git folder is included in .dockerignore. But automatic build will drop in a commit_sha.txt file on root
    if commit_hash == None or commit_hash == "":
        with open("commit_sha.txt") as f:
            commit_hash = f.read()

    return commit_hash


robosats_version_cache = {}


@ring.dict(robosats_commit_cache, expire=99999)
def get_robosats_version():

    with open("version.json") as f:
        version_dict = json.load(f)

    print(version_dict)
    return version_dict


premium_percentile = {}


@ring.dict(premium_percentile, expire=300)
def compute_premium_percentile(order):

    queryset = Order.objects.filter(
        currency=order.currency, status=Order.Status.PUB, type=order.type
    ).exclude(id=order.id)

    print(len(queryset))
    if len(queryset) <= 1:
        return 0.5

    amount = order.amount if not order.has_range else order.max_amount
    order_rate = float(order.last_satoshis) / float(amount)
    rates = []
    for similar_order in queryset:
        similar_order_amount = (
            similar_order.amount
            if not similar_order.has_range
            else similar_order.max_amount
        )
        rates.append(float(similar_order.last_satoshis) / float(similar_order_amount))

    rates = np.array(rates)
    return round(np.sum(rates < order_rate) / len(rates), 2)


def weighted_median(values, sample_weight=None, quantiles=0.5, values_sorted=False):
    """Very close to numpy.percentile, but it supports weights.
    NOTE: quantiles should be in [0, 1]!
    :param values: numpy.array with data
    :param quantiles: array-like with many quantiles needed. For weighted median 0.5
    :param sample_weight: array-like of the same length as `array`
    :param values_sorted: bool, if True, then will avoid sorting of
        initial array assuming array is already sorted
    :return: numpy.array with computed quantiles.
    """
    values = np.array(values)
    quantiles = np.array(quantiles)
    if sample_weight is None:
        sample_weight = np.ones(len(values))
    sample_weight = np.array(sample_weight)
    assert np.all(quantiles >= 0) and np.all(
        quantiles <= 1
    ), "quantiles should be in [0, 1]"

    if not values_sorted:
        sorter = np.argsort(values)
        values = values[sorter]
        sample_weight = sample_weight[sorter]

    weighted_quantiles = np.cumsum(sample_weight) - 0.5 * sample_weight
    weighted_quantiles -= weighted_quantiles[0]
    weighted_quantiles /= weighted_quantiles[-1]

    return np.interp(quantiles, weighted_quantiles, values)


def compute_avg_premium(queryset):
    premiums = []
    volumes = []

    # We exclude BTC, as LN <-> BTC swap premiums should not be  mixed with FIAT.

    for tick in queryset.exclude(currency=1000):
        premiums.append(float(tick.premium))
        volumes.append(float(tick.volume))

    total_volume = sum(volumes)

    # weighted_median_premium is the weighted median of the premiums by volume
    if len(premiums) > 0 and len(volumes) > 0:
        weighted_median_premium = weighted_median(
            values=premiums, sample_weight=volumes, quantiles=0.5, values_sorted=False
        )
    else:
        weighted_median_premium = 0.0
    return weighted_median_premium, total_volume
