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
        await client.add_relay("ws://localhost:7777")
        await client.connect()

        robot_name = await self.get_robot_name(order)
        robot_hash_id = await self.get_robot_hash_id(order)
        currency = await self.get_robot_currency(order)

        event = EventBuilder(
            Kind(38383),
            "",
            self.generate_tags(order, robot_name, robot_hash_id, currency),
        ).to_event(keys)
        await client.send_event(event)
        print(f"Nostr event sent: {event.as_json()}")

    @sync_to_async
    def get_robot_name(self, order):
        return order.maker.username

    @sync_to_async
    def get_robot_hash_id(self, order):
        return order.maker.robot.hash_id

    @sync_to_async
    def get_robot_currency(self, order):
        return str(order.currency)

    def generate_tags(self, order, robot_name, robot_hash_id, currency):
        hashed_id = hashlib.md5(
            f"{config("COORDINATOR_ALIAS", cast=str)}{order.id}".encode("utf-8")
        ).hexdigest()

        tags = [
            Tag.parse(["d", str(uuid.UUID(hashed_id))]),
            Tag.parse(["name", robot_name, robot_hash_id]),
            Tag.parse(["k", "sell" if order.type == Order.Types.SELL else "buy"]),
            Tag.parse(["f", currency]),
            Tag.parse(["s", self.get_status_tag(order)]),
            Tag.parse(["amt", "0"]),
            Tag.parse(
                ["fa"]
                + (
                    [str(order.amount)]
                    if not order.has_range
                    else [str(order.min_amount), str(order.max_amount)]
                )
            ),
            Tag.parse(["pm"] + order.payment_method.split(" ")),
            Tag.parse(["premium", str(order.premium)]),
            Tag.parse(
                [
                    "source",
                    f"http://{config("HOST_NAME")}/order/{config("COORDINATOR_ALIAS", cast=str).lower()}/{order.id}",
                ]
            ),
            Tag.parse(
                [
                    "expiration",
                    str(int(order.expires_at.timestamp())),
                    str(order.escrow_duration),
                ]
            ),
            Tag.parse(["y", "robosats", config("COORDINATOR_ALIAS", cast=str).lower()]),
            Tag.parse(["network", str(config("NETWORK"))]),
            Tag.parse(["layer"] + self.get_layer_tag(order)),
            Tag.parse(["bond", str(order.bond_size)]),
            Tag.parse(["z", "order"]),
        ]

        if order.latitude and order.longitude:
            tags.extend(
                [Tag.parse(["g", pygeohash.encode(order.latitude, order.longitude)])]
            )

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
