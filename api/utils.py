
from decouple import config
import requests
import ring

storage = {}

@ring.dict(storage, expire=30) #keeps in cache for 30 seconds
def get_exchange_rate(currency):
    # TODO Add fallback Public APIs and error handling
    # Think about polling price data in a different way (e.g. store locally every t seconds)

    market_prices = requests.get(config('MARKET_PRICE_API')).json()
    exchange_rate = float(market_prices[currency]['last'])

    return exchange_rate