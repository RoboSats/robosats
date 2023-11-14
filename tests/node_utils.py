import codecs
import sys
import time

import requests
from requests.auth import HTTPBasicAuth
from requests.exceptions import ReadTimeout

wait_step = 0.2


def get_node(name="robot"):
    """
    We have two regtest LND nodes: "coordinator" (the robosats backend) and "robot" (the robosats user)
    """
    if name == "robot":
        macaroon = codecs.encode(
            open("/lndrobot/data/chain/bitcoin/regtest/admin.macaroon", "rb").read(),
            "hex",
        )
        port = 8080

    elif name == "coordinator":
        macaroon = codecs.encode(
            open("/lnd/data/chain/bitcoin/regtest/admin.macaroon", "rb").read(), "hex"
        )
        port = 8081

    return {"port": port, "headers": {"Grpc-Metadata-macaroon": macaroon}}


def get_lnd_node_id(node_name):
    node = get_node(node_name)
    response = requests.get(
        f'http://localhost:{node["port"]}/v1/getinfo', headers=node["headers"]
    )
    data = response.json()
    return data["identity_pubkey"]


def get_cln_node_id():
    from api.lightning.cln import CLNNode

    response = CLNNode.get_info()
    return response.id.hex()


def wait_for_lnd_node_sync(node_name):
    node = get_node(node_name)
    waited = 0
    while True:
        response = requests.get(
            f'http://localhost:{node["port"]}/v1/getinfo', headers=node["headers"]
        )
        if response.json()["synced_to_chain"]:
            return
        else:
            sys.stdout.write(
                f"\rWaiting for {node_name} node chain sync {round(waited,1)}s"
            )
            sys.stdout.flush()
            waited += wait_step
            time.sleep(wait_step)


def LND_has_active_channels(node_name):
    node = get_node(node_name)
    response = requests.get(
        f'http://localhost:{node["port"]}/v1/getinfo', headers=node["headers"]
    )
    return True if response.json()["num_active_channels"] > 0 else False


def CLN_has_active_channels():
    from api.lightning.cln import CLNNode

    response = CLNNode.get_info()
    return True if response.num_active_channels > 0 else False


def wait_for_active_channels(lnvendor, node_name="coordinator"):
    waited = 0
    while True:
        if lnvendor == "LND":
            if LND_has_active_channels(node_name):
                return
            else:
                sys.stdout.write(
                    f"\rWaiting for {node_name} LND node channel to be active {round(waited,1)}s"
                )
        elif lnvendor == "CLN":
            if CLN_has_active_channels():
                return
            else:
                sys.stdout.write(
                    f"\rWaiting for {node_name} CLN node channel to be active {round(waited,1)}s"
                )

        sys.stdout.flush()
        waited += wait_step
        time.sleep(wait_step)


def wait_for_cln_node_sync():
    from api.lightning.cln import CLNNode

    waited = 0
    while True:
        response = CLNNode.get_info()
        if response.warning_bitcoind_sync or response.warning_lightningd_sync:
            sys.stdout.write(
                f"\rWaiting for coordinator CLN node sync {round(waited,1)}s"
            )
            sys.stdout.flush()
            waited += wait_step
            time.sleep(wait_step)
        else:
            return


def wait_for_cln_active_channels():
    from api.lightning.cln import CLNNode

    waited = 0
    while True:
        response = CLNNode.get_info()
        if response.num_active_channels > 0:
            return
        else:
            sys.stdout.write(
                f"\rWaiting for coordinator CLN node channels to be active {round(waited,1)}s"
            )
            sys.stdout.flush()
            waited += wait_step
            time.sleep(wait_step)


def connect_to_node(node_name, node_id, ip_port):
    node = get_node(node_name)
    data = {"addr": {"pubkey": node_id, "host": ip_port}}
    while True:
        response = requests.post(
            f'http://localhost:{node["port"]}/v1/peers',
            json=data,
            headers=node["headers"],
        )
        if response.json() == {}:
            print("Peered robot node to coordinator node!")
            return response.json()
        else:
            if "already connected to peer" in response.json()["message"]:
                return response.json()
            print(f"Could not peer coordinator node: {response.json()}")
            time.sleep(wait_step)


def open_channel(node_name, node_id, local_funding_amount, push_sat):
    node = get_node(node_name)
    data = {
        "node_pubkey_string": node_id,
        "local_funding_amount": local_funding_amount,
        "push_sat": push_sat,
    }
    response = requests.post(
        f'http://localhost:{node["port"]}/v1/channels',
        json=data,
        headers=node["headers"],
    )
    return response.json()


def create_address(node_name):
    node = get_node(node_name)
    response = requests.get(
        f'http://localhost:{node["port"]}/v1/newaddress', headers=node["headers"]
    )
    return response.json()["address"]


def generate_blocks(address, num_blocks):
    print(f"Mining {num_blocks} blocks")
    data = {
        "jsonrpc": "1.0",
        "id": "curltest",
        "method": "generatetoaddress",
        "params": [num_blocks, address],
    }
    response = requests.post(
        "http://localhost:18443", json=data, auth=HTTPBasicAuth("test", "test")
    )
    return response.json()


def pay_invoice(node_name, invoice):
    node = get_node(node_name)
    data = {"payment_request": invoice}
    try:
        requests.post(
            f'http://localhost:{node["port"]}/v1/channels/transactions',
            json=data,
            headers=node["headers"],
            timeout=1,
        )
    except ReadTimeout:
        # Request to pay hodl invoice has timed out: that's good!
        return


def add_invoice(node_name, amount):
    node = get_node(node_name)
    data = {"value": amount}
    response = requests.post(
        f'http://localhost:{node["port"]}/v1/invoices',
        json=data,
        headers=node["headers"],
    )
    return response.json()["payment_request"]
