
import requests, ring, os
from decouple import config
from statistics import median
market_cache = {}

@ring.dict(market_cache, expire=30) #keeps in cache for 30 seconds
def get_exchange_rate(currency):
    '''
    Checks for exchange rates in several public APIs.
    Returns the median price.
    '''

    APIS = config('MARKET_PRICE_APIS', cast=lambda v: [s.strip() for s in v.split(',')])
    exchange_rates = []

    for api_url in APIS:
        try:
            if 'blockchain.info' in api_url:
                blockchain_prices = requests.get(api_url).json()
                exchange_rates.append(float(blockchain_prices[currency]['last']))
            elif 'yadio.io' in api_url:
                yadio_prices = requests.get(api_url).json()
                exchange_rates.append(float(yadio_prices['BTC'][currency]))
        except:
            pass

    return median(exchange_rates)

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
    
