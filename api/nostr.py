import pygeohash
import hashlib
import uuid

from secp256k1 import PrivateKey
from asgiref.sync import sync_to_async
from nostr_sdk import Keys, Client, EventBuilder, NostrSigner, Kind, Tag, PublicKey
from api.models import Order
from decouple import config


class Nostr:
    """Simple nostr events manager to be used as a cache system for clients"""

    async def send_order_event(self, order):
        """Creates the event and sends it to the coordinator relay"""

        # Publish only public orders
        if order.password is not None:
            return

        if config("NOSTR_NSEC", cast=str, default="") == "":
            return

        print("Sending nostr ORDER event")

        keys = Keys.parse(config("NOSTR_NSEC", cast=str))
        client = await self.initialize_client(keys)

        robot_name = await self.get_user_name(order)
        robot_hash_id = await self.get_robot_hash_id(order)
        currency = await self.get_robot_currency(order)

        content = order.description if order.description is not None else ""

        event = (
            EventBuilder(Kind(38383), content)
            .tags(self.generate_tags(order, robot_name, robot_hash_id, currency))
            .sign_with_keys(keys)
        )
        await client.send_event(event)
        print(f"Nostr ORDER event sent: {event.as_json()}")

    async def send_notification_event(self, robot, order, text):
        """Creates the notification event and sends it to the coordinator relay"""
        if config("NOSTR_NSEC", cast=str, default="") == "":
            return

        print("Sending nostr NOTIFICATION event")

        keys = Keys.parse(config("NOSTR_NSEC", cast=str))
        client = await self.initialize_client(keys)

        tags = [
            Tag.parse(
                [
                    "order_id",
                    f"{config('COORDINATOR_ALIAS', cast=str).lower()}/{order.id}",
                ]
            ),
            Tag.parse(["status", str(order.status)]),
        ]

        await client.send_private_msg(PublicKey.parse(robot.nostr_pubkey), text, tags)
        print("Nostr NOTIFICATION event sent")

    async def initialize_client(self, keys):
        # Initialize with coordinator Keys
        signer = NostrSigner.keys(keys)
        client = Client(signer)

        # Add relays and connect
        await client.add_relay("ws://localhost:7777")
        strfry_port = config("STRFRY_PORT", cast=str, default="7778")
        await client.add_relay(f"ws://localhost:{strfry_port}")
        await client.connect()

        return client

    @sync_to_async
    def get_user_name(self, order):
        return order.maker.username

    @sync_to_async
    def get_robot_hash_id(self, order):
        return order.maker.robot.hash_id

    @sync_to_async
    def get_robot_currency(self, order):
        return str(order.currency)

    def generate_tags(self, order, robot_name, robot_hash_id, currency):
        hashed_id = hashlib.md5(
            f"{config('COORDINATOR_ALIAS', cast=str)}{order.id}".encode("utf-8")
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
                    f"http://{config('HOST_NAME')}/order/{config('COORDINATOR_ALIAS', cast=str).lower()}/{order.id}",
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
            Tag.parse(["layer", "lightning"]),
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

    def sign_message(text: str) -> str:
        try:
            keys = Keys.parse(config("NOSTR_NSEC", cast=str))
            secret_key_hex = keys.secret_key().to_hex()
            private_key = PrivateKey(bytes.fromhex(secret_key_hex))
            signature = private_key.schnorr_sign(
                text.encode("utf-8"), bip340tag=None, raw=True
            )

            return signature.hex()
        except Exception:
            return ""
