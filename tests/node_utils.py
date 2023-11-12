import requests
from requests.auth import HTTPBasicAuth
from requests.exceptions import ReadTimeout


def get_node(name="robot"):
    """
    We have two regtest LND nodes: "coordinator" (the robosats backend) and "robot" (the robosats user)
    """
    if name == "robot":
        with open("/lndrobot/data/chain/bitcoin/regtest/admin.macaroon", "rb") as f:
            macaroon = f.read()
            return {"port": 8080, "headers": {"Grpc-Metadata-macaroon": macaroon.hex()}}

    elif name == "coordinator":
        with open("/lnd/data/chain/bitcoin/regtest/admin.macaroon", "rb") as f:
            macaroon = f.read()
            return {"port": 8081, "headers": {"Grpc-Metadata-macaroon": macaroon.hex()}}


def get_node_id(node_name):
    node = get_node(node_name)
    response = requests.get(
        f'http://localhost:{node["port"]}/v1/getinfo', headers=node["headers"]
    )
    data = response.json()
    return data["identity_pubkey"]


def connect_to_node(node_name, node_id, ip_port):
    node = get_node(node_name)
    data = {"addr": {"pubkey": node_id, "host": ip_port}}
    response = requests.post(
        f'http://localhost:{node["port"]}/v1/peers', json=data, headers=node["headers"]
    )
    return response.json()


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
