import multiprocessing
import queue

import requests
from decouple import config

TOR_PROXY = config("TOR_PROXY", default="127.0.0.1:9050")
USE_TOR = config("USE_TOR", cast=bool, default=True)
MEMPOOL_TIMEOUT = config("MEMPOOL_TIMEOUT", cast=float, default=10.0)
MEMPOOL_API_URL = config("MEMPOOL_API_URL", default="https://mempool.space")


def get_session():
    session = requests.session()
    # Tor uses the 9050 port as the default socks port
    if USE_TOR:
        session.proxies = {
            "http": "socks5h://" + TOR_PROXY,
            "https": "socks5h://" + TOR_PROXY,
        }
    return session


def _fetch_mempool_fees() -> dict:
    """
    Fetches recommended fee rates from mempool.space.

    mempool.space response object:
    {
        fastestFee: 1,
        halfHourFee: 1,
        hourFee: 1,
        economyFee: 1,
        minimumFee: 1
    }
    """
    session = get_session()
    url = f"{MEMPOOL_API_URL.rstrip('/')}/api/v1/fees/recommended"
    response = session.get(
        url,
        timeout=(MEMPOOL_TIMEOUT, MEMPOOL_TIMEOUT),
    )
    response.raise_for_status()  # Raises stored HTTPError, if one occurred
    return response.json()


def _put_mempool_fees_to_queue(q: multiprocessing.Queue) -> None:
    try:
        q.put(_fetch_mempool_fees())
    except Exception:
        return


def _mempool_fees_with_hard_timeout() -> dict:
    """
    Runs the mempool.space fetch in a child process and enforces a hard deadline.
    PySocks/urllib3 may block indefinitely during the SOCKS5 handshake despite
    requests' own timeout, so the only guaranteed way to interrupt is to kill
    the child process once MEMPOOL_TIMEOUT expires.

    Kept in this Django-free module so the spawned child does not import
    Django models (which requires the app registry to be loaded).
    """
    ctx = multiprocessing.get_context("spawn")
    q = ctx.Queue()
    p = ctx.Process(target=_put_mempool_fees_to_queue, args=(q,))
    p.start()
    try:
        return q.get(timeout=MEMPOOL_TIMEOUT)
    except queue.Empty:
        raise TimeoutError("mempool.space fetch timed out")
    finally:
        p.join(timeout=1.0)
        if p.is_alive():
            p.terminate()
            p.join()
