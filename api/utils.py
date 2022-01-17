
import requests, ring, os
from decouple import config
import numpy as np

market_cache = {}

@ring.dict(market_cache, expire=5) #keeps in cache for 5 seconds
def get_exchange_rates(currencies):
    '''
    Params: list of currency codes.
    Checks for exchange rates in several public APIs.
    Returns the median price list.
    '''

    APIS = config('MARKET_PRICE_APIS', cast=lambda v: [s.strip() for s in v.split(',')])

    api_rates = []
    for api_url in APIS:
        try: # If one API is unavailable pass
            if 'blockchain.info' in api_url:
                blockchain_prices = requests.get(api_url).json()
                blockchain_rates = []
                for currency in currencies:
                    try: # If a currency is missing place a None
                        blockchain_rates.append(float(blockchain_prices[currency]['last']))
                    except:
                        blockchain_rates.append(np.nan)
                api_rates.append(blockchain_rates)

            elif 'yadio.io' in api_url:
                yadio_prices = requests.get(api_url).json()
                yadio_rates = []
                for currency in currencies:
                    try:
                        yadio_rates.append(float(yadio_prices['BTC'][currency]))
                    except:
                        yadio_rates.append(np.nan)
                api_rates.append(yadio_rates)
        except:
            pass

    if len(api_rates) == 0:
        return None # Wops there is not API available!

    exchange_rates = np.array(api_rates)
    median_rates = np.nanmedian(exchange_rates, axis=0)

    return median_rates.tolist()

lnd_v_cache = {}

@ring.dict(lnd_v_cache, expire=3600) #keeps in cache for 3600 seconds
def get_lnd_version():

    stream = os.popen('lnd --version')
    lnd_version = stream.read()[:-1]

    return lnd_version

robosats_commit_cache = {}

@ring.dict(robosats_commit_cache, expire=3600)
def get_commit_robosats():

    stream = os.popen('git log -n 1 --pretty=format:"%H"')
    lnd_version = stream.read()

    return lnd_version
    
