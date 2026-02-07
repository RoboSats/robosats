import codecs
import sys
import time
import json

import requests
from decouple import config
from requests.auth import HTTPBasicAuth
from requests.exceptions import ReadTimeout

LNVENDOR = config("LNVENDOR", cast=str, default="LND")
WAIT_STEP = 0.2


def get_node(name="robot"):
    """
    We have two regtest LND nodes: "coordinator" (the robosats backend) and "robot" (the robosats user)
    """
    if name == "robot":
        admin_macaroon_file = config(
            "LND_TEST_USER_MACAROON_PATH",
            cast=str,
            default="/lndrobot/data/chain/bitcoin/regtest/admin.macaroon",
        )
        macaroon = codecs.encode(
            open(admin_macaroon_file, "rb").read(),
            "hex",
        )
        port = config("LND_TEST_USER_REST_PORT", cast=int, default=8080)

    elif name == "coordinator":
        admin_macaroon_file = config(
            "LND_TEST_COORD_MACAROON_PATH",
            cast=str,
            default="/lnd/data/chain/bitcoin/regtest/admin.macaroon",
        )
        macaroon = codecs.encode(open(admin_macaroon_file, "rb").read(), "hex")
        port = config("LND_TEST_COORD_REST_PORT", cast=int, default=8081)

    return {"port": port, "headers": {"Grpc-Metadata-macaroon": macaroon}}


def get_lnd_node_id(node_name):
    node = get_node(node_name)
    response = requests.get(
        f"http://localhost:{node['port']}/v1/getinfo", headers=node["headers"]
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
            f"http://localhost:{node['port']}/v1/getinfo", headers=node["headers"]
        )
        if response.json()["synced_to_chain"]:
            return
        else:
            sys.stdout.write(
                f"\rWaiting for {node_name} node chain sync {round(waited, 1)}s"
            )
            sys.stdout.flush()
            waited += WAIT_STEP
            time.sleep(WAIT_STEP)


def LND_has_active_channels(node_name):
    node = get_node(node_name)
    response = requests.get(
        f"http://localhost:{node['port']}/v1/getinfo", headers=node["headers"]
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
                    f"\rWaiting for {node_name} LND node channel to be active {round(waited, 1)}s"
                )
        elif lnvendor == "CLN":
            if CLN_has_active_channels():
                return
            else:
                sys.stdout.write(
                    f"\rWaiting for {node_name} CLN node channel to be active {round(waited, 1)}s"
                )

        sys.stdout.flush()
        waited += WAIT_STEP
        time.sleep(WAIT_STEP)


def wait_for_cln_node_sync():
    from api.lightning.cln import CLNNode

    waited = 0
    while True:
        response = CLNNode.get_info()
        if response.warning_bitcoind_sync or response.warning_lightningd_sync:
            sys.stdout.write(
                f"\rWaiting for coordinator CLN node sync {round(waited, 1)}s"
            )
            sys.stdout.flush()
            waited += WAIT_STEP
            time.sleep(WAIT_STEP)
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
                f"\rWaiting for coordinator CLN node channels to be active {round(waited, 1)}s"
            )
            sys.stdout.flush()
            waited += WAIT_STEP
            time.sleep(WAIT_STEP)


def wait_nodes_sync():
    wait_for_lnd_node_sync("robot")
    if LNVENDOR == "LND":
        wait_for_lnd_node_sync("coordinator")
    elif LNVENDOR == "CLN":
        wait_for_cln_node_sync()


def wait_channels():
    wait_for_active_channels(LNVENDOR, "coordinator")
    wait_for_active_channels("LND", "robot")


def send_coins(node_name, address, amount=0, send_all=False, spend_unconfirmed=False):
    node = get_node(node_name)
    data = {
        "addr": address,
        "amount": amount,
        "send_all": send_all,
        "spend_unconfirmed": spend_unconfirmed,
    }

    response = requests.post(
        f'http://localhost:{node["port"]}/v1/transactions',
        headers=node["headers"],
        data=json.dumps(data),
    )
    return response.json()


def send_all_coins_to_self(node_name):
    address = create_address(node_name)
    send_coins(node_name, address, send_all=True)


def gen_blocks_to_confirm_pending(node_name):
    address = create_address(node_name)
    generate_blocks(address, 10)


def set_up_regtest_network():
    if channel_is_active():
        print("Regtest network was already ready. Skipping initalization.")
        return
    # Fund two LN nodes in regtest and open channels
    # Coordinator is either LND or CLN. Robot user is always LND.
    if LNVENDOR == "LND":
        coordinator_node_id = get_lnd_node_id("coordinator")
        coordinator_port = config("LND_TEST_COORD_LISTEN_PORT", cast=int, default=9735)
    elif LNVENDOR == "CLN":
        coordinator_node_id = get_cln_node_id()
        coordinator_port = config("CLN_TEST_COORD_LISTEN_PORT", cast=int, default=9737)

    print("Coordinator Node ID: ", coordinator_node_id)

    # Fund both robot and coordinator nodes
    robot_funding_address = create_address("robot")
    coordinator_funding_address = create_address("coordinator")
    generate_blocks(coordinator_funding_address, 1)
    generate_blocks(robot_funding_address, 101)
    wait_nodes_sync()

    # Open channel between Robot user and coordinator
    print(f"\nOpening channel from Robot user node to coordinator {LNVENDOR} node")
    connect_to_node("robot", coordinator_node_id, f"localhost:{coordinator_port}")
    open_channel("robot", coordinator_node_id, 100_000_000, 50_000_000)

    # Generate 10 blocks so the channel becomes active and wait for sync
    generate_blocks(robot_funding_address, 10)

    # Wait a tiny bit so payments can be done in the new channel
    wait_nodes_sync()
    wait_channels()
    time.sleep(1)


def channel_is_active():
    robot_channel_active = LND_has_active_channels("robot")
    if LNVENDOR == "LND":
        coordinator_channel_active = LND_has_active_channels("coordinator")
    elif LNVENDOR == "CLN":
        coordinator_channel_active = CLN_has_active_channels()
    return robot_channel_active and coordinator_channel_active


def connect_to_node(node_name, node_id, ip_port):
    node = get_node(node_name)
    data = {"addr": {"pubkey": node_id, "host": ip_port}}
    while True:
        response = requests.post(
            f"http://localhost:{node['port']}/v1/peers",
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
            time.sleep(WAIT_STEP)


def open_channel(node_name, node_id, local_funding_amount, push_sat):
    node = get_node(node_name)
    data = {
        "node_pubkey_string": node_id,
        "local_funding_amount": local_funding_amount,
        "push_sat": push_sat,
    }
    response = requests.post(
        f"http://localhost:{node['port']}/v1/channels",
        json=data,
        headers=node["headers"],
    )
    return response.json()


def create_address_LND(node_name):
    node = get_node(node_name)
    response = requests.get(
        f"http://localhost:{node['port']}/v1/newaddress", headers=node["headers"]
    )
    return response.json()["address"]


def create_address_CLN():
    from api.lightning.cln import CLNNode

    return CLNNode.newaddress()


def create_address(node_name):
    if node_name == "coordinator" and LNVENDOR == "CLN":
        return create_address_CLN()
    else:
        return create_address_LND(node_name)


def generate_blocks(address, num_blocks):
    print(f"Mining {num_blocks} blocks")
    data = {
        "jsonrpc": "1.0",
        "id": "curltest",
        "method": "generatetoaddress",
        "params": [num_blocks, address],
    }
    # set in docker-tests.yml
    rpc_url = config("BITCOIND_RPCURL", cast=str, default="http://localhost:18443")
    rpc_user = config("BITCOIND_RPCUSER", cast=str, default="test")
    rpc_pass = config("BITCOIND_RPCPASSWORD", cast=str, default="test")
    response = requests.post(rpc_url, json=data, auth=HTTPBasicAuth(rpc_user, rpc_pass))
    return response.json()


def pay_invoice(node_name, invoice):
    reset_mission_control(node_name)
    node = get_node(node_name)
    data = {"payment_request": invoice}
    try:
        requests.post(
            f"http://localhost:{node['port']}/v1/channels/transactions",
            json=data,
            headers=node["headers"],
            # 0.15s is enough for LND to LND hodl ACCEPT
            # 0.4s is enough for LND to CLN hodl ACCEPT
            timeout=0.2 if LNVENDOR == "LND" else 1,
        )
    except ReadTimeout:
        # Request to pay hodl invoice has timed out: that's good!
        return


def reset_mission_control(node_name):
    node = get_node(node_name)
    requests.post(
        f"http://localhost:{node['port']}//v2/router/resetmissioncontrol",
        headers=node["headers"],
    )


def add_invoice(node_name, amount):
    node = get_node(node_name)
    data = {"value": amount}
    response = requests.post(
        f"http://localhost:{node['port']}/v1/invoices",
        json=data,
        headers=node["headers"],
    )
    return response.json()["payment_request"]
