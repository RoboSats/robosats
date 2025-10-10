import os
import json
import requests
import base64
from datetime import datetime

devfund_data_path = os.path.normpath(os.path.join("..", "devfund_pubkey.json"))

with open(devfund_data_path, "r") as f:
    devfund_data = json.load(f)

macaroon = devfund_data["mainnet_invoices_readonly_macaroon_hex"]
url = f"https://{devfund_data['mainnet_rpcserver']}:8080"
headers = {"Grpc-Metadata-macaroon": macaroon}
method = "/v1/invoices"

r = requests.get(url + method, headers=headers)

response_data = r.json()

for invoice in response_data["invoices"]:
    if invoice["is_keysend"] and invoice["htlcs"][0]["custom_records"]["34349334"]:
        dt = datetime.fromtimestamp(int(invoice["creation_date"]))
        print(f"Index {invoice['add_index']}")
        print(f"Timestamp {dt.strftime('%Y-%m-%d %H:%M:%S')}")
        print(
            f"{base64.b64decode(invoice['htlcs'][0]['custom_records']['34349334']).decode('utf-8')}"
        )
        print(f"Amount {invoice['amt_paid_sat']} Sats")
        print("----------------------")
