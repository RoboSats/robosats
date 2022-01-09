
from decouple import config
import requests

def get_exchange_rate(currency):
    # TODO Add fallback Public APIs and error handling
    # Think about polling price data in a different way (e.g. store locally every t seconds)

    market_prices = requests.get(config('MARKET_PRICE_API')).json()
    exchange_rate = float(market_prices[currency]['last'])

    return exchange_rate