
import requests, ring, os
from decouple import config

market_cache = {}

@ring.dict(market_cache, expire=30) #keeps in cache for 30 seconds
def get_exchange_rate(currency):
    # TODO Add fallback Public APIs and error handling
    # Think about polling price data in a different way (e.g. store locally every t seconds)

    market_prices = requests.get(config('MARKET_PRICE_API')).json()
    exchange_rate = float(market_prices[currency]['last'])

    return exchange_rate

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
    
