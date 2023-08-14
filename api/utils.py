import json
import logging
import re

import gnupg
import numpy as np
import requests
import ring
from base91 import decode, encode
from decouple import config

from api.models import Order

logger = logging.getLogger("api.utils")

TOR_PROXY = config("TOR_PROXY", default="127.0.0.1:9050")
USE_TOR = config("USE_TOR", cast=bool, default=True)
LNVENDOR = config("LNVENDOR", cast=str, default="LND")


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


@ring.dict(market_cache, expire=30)  # keeps in cache for 30 seconds
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
                    except Exception:
                        blockchain_rates.append(np.nan)
                api_rates.append(blockchain_rates)

            elif "yadio.io" in api_url:
                yadio_prices = session.get(api_url).json()
                yadio_rates = []
                for currency in currencies:
                    try:
                        yadio_rates.append(float(yadio_prices["BTC"][currency]))
                    except Exception:
                        yadio_rates.append(np.nan)
                api_rates.append(yadio_rates)

            # Tor proxied requests to bitpay.com will fail. Skip if USE_TOR is enabled.
            elif "bitpay.com" in api_url and not USE_TOR:
                headers = {
                    "X-Accept-Version": "2.0.0",
                    "Content-type": "application/json",
                }
                bitpay_prices = session.get(api_url, headers=headers).json()
                bitpay_prices = {
                    item["code"]: item["rate"] for item in bitpay_prices["data"]
                }
                bitpay_rates = []
                for currency in currencies:
                    try:
                        bitpay_rates.append(float(bitpay_prices[currency]))
                    except Exception:
                        bitpay_rates.append(np.nan)
                api_rates.append(bitpay_rates)

            # Tor proxied requests to criptoya.com will fail. Skip if USE_TOR is enabled.
            elif "criptoya.com" in api_url and not USE_TOR:
                criptoya_supported_currencies = [
                    "ARS",
                    "COP",
                    "MXN",
                    "BRL",
                    "PEN",
                    "CLP",
                    "USD",
                    "VES",
                ]
                criptoya_rates = []
                for currency in currencies:
                    if currency in criptoya_supported_currencies:
                        criptoya_exchanges = session.get(f"{api_url}/{currency}").json()
                        exchange_medians = [
                            np.median([exchange["ask"], exchange["ask"]])
                            for exchange in criptoya_exchanges.values()
                            if exchange["ask"] > 0 and exchange["bid"] > 0
                        ]
                        criptoya_rates.append(round(np.median(exchange_medians), 2))
                    else:
                        criptoya_rates.append(np.nan)
                api_rates.append(criptoya_rates)

        except Exception as e:
            print(f"Could not fetch BTC prices from {api_url}: {str(e)}")
            pass

    if len(api_rates) == 0:
        return None  # Wops there is not API available!

    exchange_rates = np.array(api_rates)
    median_rates = np.nanmedian(exchange_rates, axis=0)

    return median_rates.tolist()


lnd_version_cache = {}


@ring.dict(lnd_version_cache, expire=3600)
def get_lnd_version():
    try:
        from api.lightning.lnd import LNDNode

        return LNDNode.get_version()
    except Exception:
        return None


cln_version_cache = {}


@ring.dict(cln_version_cache, expire=3600)
def get_cln_version():
    try:
        from api.lightning.cln import CLNNode

        return CLNNode.get_version()
    except Exception:
        return None


robosats_commit_cache = {}


@ring.dict(robosats_commit_cache, expire=99999)
def get_robosats_commit():
    # .git folder is included in .dockerignore. The build workflow will drop the commit_sha file in root
    with open("commit_sha") as f:
        commit_hash = f.read()

    return commit_hash


premium_percentile = {}


@ring.dict(premium_percentile, expire=300)
def compute_premium_percentile(order):
    queryset = Order.objects.filter(
        currency=order.currency, status=Order.Status.PUB, type=order.type
    ).exclude(id=order.id)

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


def validate_pgp_keys(pub_key, enc_priv_key):
    """Validates PGP valid keys. Formats them in a way understandable by the frontend"""
    gpg = gnupg.GPG()

    # Standardize format with linux linebreaks '\n'. Windows users submitting their own keys have '\r\n' breaking communication.
    enc_priv_key = enc_priv_key.replace("\r\n", "\n").replace("\\", "\n")
    pub_key = pub_key.replace("\r\n", "\n").replace("\\", "\n")

    # Try to import the public key
    import_pub_result = gpg.import_keys(pub_key)
    if not import_pub_result.imported == 1:
        # If a robot is deleted and it is rebuilt with the same pubKey, the key will not be imported again
        # so we assert that the import error is "Not actually changed"
        if "Not actually changed" not in import_pub_result.results[0]["text"]:
            return (
                False,
                {
                    "bad_request": "Your PGP public key does not seem valid.\n"
                    + f"Stderr: {str(import_pub_result.stderr)}\n"
                    + f"ReturnCode: {str(import_pub_result.returncode)}\n"
                    + f"Summary: {str(import_pub_result.summary)}\n"
                    + f"Results: {str(import_pub_result.results)}\n"
                    + f"Imported: {str(import_pub_result.imported)}\n"
                },
                None,
                None,
            )
    # Exports the public key again for uniform formatting.
    pub_key = gpg.export_keys(import_pub_result.fingerprints[0])

    # Try to import the encrypted private key (without passphrase)
    import_priv_result = gpg.import_keys(enc_priv_key)
    if not import_priv_result.sec_imported == 1:
        if "Not actually changed" not in import_priv_result.results[0]["text"]:
            return (
                False,
                {
                    "bad_request": "Your PGP encrypted private key does not seem valid.\n"
                    + f"Stderr: {str(import_priv_result.stderr)}\n"
                    + f"ReturnCode: {str(import_priv_result.returncode)}\n"
                    + f"Summary: {str(import_priv_result.summary)}\n"
                    + f"Results: {str(import_priv_result.results)}\n"
                    + f"Sec Imported: {str(import_priv_result.sec_imported)}\n"
                },
                None,
                None,
            )

    return True, None, pub_key, enc_priv_key


def verify_signed_message(pub_key, signed_message):
    """
    Verifies a signed cleartext PGP message. Returns whether the signature
    is valid (was made by the given pub_key) and the content of the message.
    """
    gpg = gnupg.GPG()

    # import the public key
    import_result = gpg.import_keys(pub_key)

    # verify the signed message
    verified = gpg.verify(signed_message)

    if verified.fingerprint == import_result.fingerprints[0]:
        header = "-----BEGIN PGP SIGNED MESSAGE-----\nHash: SHA512\n\n"
        footer = "-----BEGIN PGP SIGNATURE-----"
        cleartext_message = signed_message.split(header)[1].split(footer)[0].strip()

        return True, cleartext_message
    else:
        return False, None


def base91_to_hex(base91_str: str) -> str:
    bytes_data = decode(base91_str)
    return bytes_data.hex()


def hex_to_base91(hex_str: str) -> str:
    hex_bytes = bytes.fromhex(hex_str)
    base91_str = encode(hex_bytes)
    return base91_str


def is_valid_token(token: str) -> bool:
    num_chars = len(token)

    if not 38 < num_chars < 41:
        return False

    charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"'
    return all(c in charset for c in token)


def objects_to_hyperlinks(logs: str) -> str:
    """
    Parses strings that have Object(ID,NAME) that match API models.
    For example Robot(ID,NAME) will be parsed into
    <b><a href="/coordinator/api/robot/ID/change}">NAME</a></b>

    Used to format pretty logs for the Order admin panel.
    """
    objects = ["LNPayment", "Robot", "Order", "OnchainPayment", "MarketTick"]
    for obj in objects:
        logs = re.sub(
            rf"{obj}\(([0-9a-fA-F\-A-F]+),\s*([^)]+)\)",
            lambda m: f'<b><a href="/coordinator/api/{obj.lower()}/{m.group(1)}">{m.group(2)}</a></b>',
            logs,
            flags=re.DOTALL,
        )
    return logs
