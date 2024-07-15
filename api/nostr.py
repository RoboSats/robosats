import pygeohash
import hashlib
import uuid
from nostr_sdk import Keys, Client, EventBuilder, NostrSigner
from api.models import Order
from decouple import config


class Nostr:
    """Simple nostr events manager to be used as a cache system for clients"""

    async def send_order_event(self, order):
        """Creates the event and sends it to the coordinator relay"""
        # Initialize with coordinator Keys
        keys = Keys.generate()
        signer = NostrSigner.keys(keys)
        client = Client(signer)

        # Add relays and connect
        await client.add_relays(["ws://localhost:7777"])
        await client.connect()

        event = EventBuilder(38383, "", self.generate_tags(order)).to_event(keys)
        output = await client.send_event(event)
        print(f"Nostr event sent: {output}")

    def generate_tags(self, order):
        hashed_id = hashlib.md5(
            f"{config("COORDINATOR_ALIAS", cast=str)}{order.id}".encode("utf-8")
        ).hexdigest()

        return [
            ["d", uuid.UUID(hashed_id)],
            ["name", order.maker.robot_name],
            ["k", order.type.lower()],
            ["f", order.currency],
            ["s", self.get_status_tag(order)],
            ["amt", order.last_satoshis],
            ["fa", order.amount],
            ["pm", order.payment_method.split(" ")],
            ["premium", order.premium_percentile],
            [
                "source",
                f"{config("HOST_NAME")}/{config("COORDINATOR_ALIAS")}/order/{order.id}",
            ],
            ["expiration", order.expires_at.timestamp()],
            ["y", "robosats"],
            ["n", order.network],
            ["layer", "lightning"],
            ["g", pygeohash.encode(order.latitude, order.longitude)],
            ["bond", order.bond],
            ["z", "order"],
            ["coordinator", config("COORDINATOR_ALIAS", cast=str)],
        ]

    def get_status_tag(self, order):
        if order.status == Order.Status.PUB:
            return "pending"
        else:
            return "canceled"
