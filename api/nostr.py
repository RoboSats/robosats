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

        if config("NOSTR_NSEC", cast=str, default="") == "":
            return

        print("Sending nostr event")

        # Initialize with coordinator Keys
        keys = Keys.parse(config("NOSTR_NSEC", cast=str))
        signer = NostrSigner.keys(keys)
        client = Client(signer)

        # Add relays and connect
        await client.add_relays(["ws://localhost:7777"])
        await client.connect()

        event = EventBuilder(38383, "", self.generate_tags(order)).to_event(keys)
        event.custom_created_at(order.created_at.timestamp())
        output = await client.send_event(event)
        print(f"Nostr event sent: {output}")

    def generate_tags(self, order):
        hashed_id = hashlib.md5(
            f"{config("COORDINATOR_ALIAS", cast=str)}{order.id}".encode("utf-8")
        ).hexdigest()

        tags = [
            ["d", uuid.UUID(hashed_id)],
            ["name", order.maker.robot_name],
            ["k", order.type.lower()],
            ["f", order.currency],
            ["s", self.get_status_tag(order)],
            ["amt", "0"],
            ["fa", order.amount],
            ["pm", order.payment_method.split(" ")],
            ["premium", order.premium_percentile * 100],
            [
                "source",
                f"{config("HOST_NAME")}/{config("COORDINATOR_ALIAS")}/order/{order.id}",
            ],
            ["expiration", order.expires_at.timestamp()],
            ["y", "robosats", config("COORDINATOR_ALIAS", cast=str)],
            ["n", order.network],
            ["layer", self.get_layer_tag(order)],
            ["bond", order.bond],
            ["z", "order"],
        ]

        if order.latitude and order.longitude:
            tags.extend([["g", pygeohash.encode(order.latitude, order.longitude)]])

        return tags

    def get_status_tag(self, order):
        if order.status == Order.Status.PUB:
            return "pending"
        else:
            return "success"

    def get_layer_tag(self, order):
        if order.type == Order.Types.SELL:
            return ["onchain", "lightning"]
        else:
            return ["lightning"]
