import pygeohash
import hashlib
import uuid

from asgiref.sync import sync_to_async
from nostr_sdk import Keys, Client, EventBuilder, NostrSigner, Kind, Tag
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

        robot_name = await self.get_robot_name(order)
        currency = await self.get_robot_currency(order)

        event = (
            EventBuilder(
                Kind(38383),
                "",
                Tag.parse(self.generate_tags(order, robot_name, currency)),
            )
            .custom_created_at(order.created_at.timestamp())
            .to_event(keys)
        )
        output = await client.send_event(event)
        print(f"Nostr event sent: {output}")

    @sync_to_async
    def get_robot_name(self, order):
        return order.maker.username

    @sync_to_async
    def get_robot_currency(self, order):
        return str(order.currency)

    def generate_tags(self, order, robot_name, currency):
        hashed_id = hashlib.md5(
            f"{config("COORDINATOR_ALIAS", cast=str)}{order.id}".encode("utf-8")
        ).hexdigest()

        tags = [
            ["d", str(uuid.UUID(hashed_id))],
            ["name", robot_name],
            ["k", "sell" if order.type == Order.Types.SELL else "buy"],
            ["f", currency],
            ["s", self.get_status_tag(order)],
            ["amt", "0"],
            ["fa", str(order.amount)],
            ["pm"] + order.payment_method.split(" "),
            ["premium", str(order.premium)],
            [
                "source",
                f"http://{config("HOST_NAME")}/{config("COORDINATOR_ALIAS")}/order/{order.id}",
            ],
            ["expiration", int(order.expires_at.timestamp())],
            ["y", "robosats", config("COORDINATOR_ALIAS", cast=str)],
            ["n", str(config("NETWORK"))],
            ["layer"] + self.get_layer_tag(order),
            ["bond", str(order.bond_size)],
            ["z", "order"],
        ]
        print(tags)
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
