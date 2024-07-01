import time
import pygeohash
from nostr_sdk import Keys, Client, EventBuilder, NostrSigner, Filter
from api.models import Order
from decouple import config


class Nostr:
    """Simple nostr events manager to be used as a cache system for clients"""

    async def send_new_order_event(self, order):
        """Creates the event and sends it to the coordinator relay"""
        # Initialize with coordinator Keys
        keys = Keys.generate()
        signer = NostrSigner.keys(keys)
        client = Client(signer)

        # Add relays and connect
        await client.add_relays(["ws://localhost:888"])
        await client.connect()
    
        event = EventBuilder(38383, "", generate_tags(order)).to_event(keys)
        output = await client.send_event(event)

        print(f"Nostr event sent: {output}")

    def generate_tags(self, order):
        return [
            ["d", order.id],
            ["name", order.maker.robot_name],
            ["k", order.type.lower()],
            ["f", order.currency],
            ["s", Order.Status(order.status).label],
            ["amt", order.last_satoshis],
            ["fa", order.amount],
            ["pm", order.payment_method.split(" ")],
            ["premium", order.premium_percentile],
            ["source", f"{config("HOST_NAME")}/{config("COORDINATOR_ALIAS")}/order/{order.id}"],
            ["expiration", order.expires_at.timestamp()],
            ["y", "robosats"],
            ["coordinator", config("COORDINATOR_ALIAS", cast=str)]
            ["z", "order"],
            ["n", order.network],
            ["layer", "lightning"],
            ["g", pygeohash.encode(order.latitude, order.longitude)],
            ["bond", order.bond]
        ]
