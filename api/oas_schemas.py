import textwrap

from decouple import config
from drf_spectacular.utils import OpenApiExample, OpenApiParameter

from api.serializers import ListOrderSerializer, StealthSerializer

EXP_MAKER_BOND_INVOICE = int(config("EXP_MAKER_BOND_INVOICE"))
RETRY_TIME = int(config("RETRY_TIME"))
PUBLIC_DURATION = 60 * 60 * int(config("DEFAULT_PUBLIC_ORDER_DURATION")) - 1
ESCROW_DURATION = 60 * int(config("INVOICE_AND_ESCROW_DURATION"))
BOND_SIZE = int(config("DEFAULT_BOND_SIZE"))


class MakerViewSchema:
    post = {
        "summary": "Create a maker order",
        "description": textwrap.dedent(
            f"""
            Create a new order as a maker.

            
            Default values for the following fields if not specified:
            - `public_duration` - **{PUBLIC_DURATION}**
            - `escrow_duration` - **{ESCROW_DURATION}**
            - `bond_size` -  **{BOND_SIZE}**
            - `bondless_taker` - **false**
            - `has_range` - **false**
            - `premium` - **0**
            """
        ),
        "responses": {
            201: ListOrderSerializer,
            400: {
                "type": "object",
                "properties": {
                    "bad_request": {
                        "type": "string",
                        "description": "Reason for the failure",
                    },
                },
            },
            409: {
                "type": "object",
                "properties": {
                    "bad_request": {
                        "type": "string",
                        "description": "Reason for the failure",
                    },
                },
            },
        },
    }


class OrderViewSchema:

    get = {
        "summary": "[WIP] Get order",
        "description": textwrap.dedent(
            """
            **NOT COMPLETE**
            """
        ),
        "parameters": [
            OpenApiParameter(
                name="order_id",
                location=OpenApiParameter.QUERY,
                required=True,
                type=int,
            ),
        ],
        "responses": {
            #     201: ListOrderSerializer,
            400: {
                "type": "object",
                "properties": {
                    "bad_request": {
                        "type": "string",
                        "description": "Reason for the failure",
                    },
                },
            },
            403: {
                "type": "object",
                "properties": {
                    "bad_request": {
                        "type": "string",
                        "description": "Reason for the failure",
                        "default": "This order is not available",
                    },
                },
            },
            404: {
                "type": "object",
                "properties": {
                    "bad_request": {
                        "type": "string",
                        "description": "Reason for the failure",
                        "default": "Invalid order Id",
                    },
                },
            },
            #     409: {
            #         'type': 'object',
            #         'properties': {
            #             'bad_request': {
            #                 'type': 'string',
            #                 'description': 'Reason for the failure',
            #             },
            #         },
            #     }
        },
        "examples": [
            OpenApiExample(
                "Order cancelled",
                value={"bad_request": "This order has been cancelled by the maker"},
                status_codes=[400],
            ),
            OpenApiExample(
                "Order cancelled",
                value={"bad_request": "This order has been cancelled collaborativelly"},
                status_codes=[400],
            ),
            OpenApiExample(
                "When maker bond expires (as maker)",
                value={
                    "bad_request": "Invoice expired. You did not confirm publishing the order in time. Make a new order."
                },
                status_codes=[400],
            ),
            OpenApiExample(
                "When Robosats node is down",
                value={
                    "bad_request": "The Lightning Network Daemon (LND) is down. Write in the Telegram group to make sure the staff is aware."
                },
                status_codes=[400],
            ),
        ],
    }

    take_update_confirm_dispute_cancel = {
        "summary": "[WIP] Update order",
        "description": textwrap.dedent(
            """
            **NOT COMPLETE**
            """
        ),
        "parameters": [
            OpenApiParameter(
                name="order_id",
                location=OpenApiParameter.QUERY,
                required=True,
                type=int,
            ),
        ],
        "responses": {
            #     201: ListOrderSerializer,
            400: {
                "type": "object",
                "properties": {
                    "bad_request": {
                        "type": "string",
                        "description": "Reason for the failure",
                    },
                },
            },
            403: {
                "type": "object",
                "properties": {
                    "bad_request": {
                        "type": "string",
                        "description": "Reason for the failure",
                        "default": "This order is not available",
                    },
                },
            },
            #     409: {
            #         'type': 'object',
            #         'properties': {
            #             'bad_request': {
            #                 'type': 'string',
            #                 'description': 'Reason for the failure',
            #             },
            #         },
            #     }
        },
    }


class UserViewSchema:
    post = {
        "summary": "Create user",
        "description": textwrap.dedent(
            """
            Create a new Robot 🤖

            `token_sha256` is the SHA256 hash of your token. Make sure you generate your token
            using cryptographically secure methods. [Here's]() the function the Javascript
            client uses to generate the tokens. Since the server only recieves the hash of the
            token, it trusts the client with computing `length`, `counts` and `unique_values`
            correctly. Check [here](https://github.com/Reckless-Satoshi/robosats/blob/main/frontend/src/utils/token.js#L13)
            to see how the Javascript client copmutes these values. These values are optional,
            but if provided, the api computes the entropy of the token adds two additional
            fields to the response JSON - `token_shannon_entropy` and `token_bits_entropy`.

            **Note: It is entirely the clients responsibilty to generate high entropy tokens, and the optional
            parameters are provided to act as an aid to help determine sufficient entropy, but the server is happy
            with just any sha256 hash you provide it**

            `public_key` - PGP key associated with the user (Armored ASCII format)
            `encrypted_private_key` - Private PGP key. This is only stored on the backend for later fetching by
            the frontend and the key can't really be used by the server since it's protected by the token
            that only the client knows. Will be made an optional parameter in a future release.
            On the Javascript client, It's passphrase is set to be the secret token generated.

            A gpg key can be created by:

            ```shell
            gpg --full-gen-key
            ```

            it's public key can be exported in ascii armored format with:

            ```shell
            gpg --export --armor <key-id | email | name>
            ```

            and it's private key can be exported in ascii armored format with:

            ```shell
            gpg --export-secret-keys --armor <key-id | email | name>
            ```

            """
        ),
        "responses": {
            201: {
                "type": "object",
                "properties": {
                    "encrypted_private_key": {
                        "type": "string",
                        "description": "Armored ASCII PGP private key block",
                    },
                    "nickname": {
                        "type": "string",
                        "description": "Username generated (Robot name)",
                    },
                    "public_key": {
                        "type": "string",
                        "description": "Armored ASCII PGP public key block",
                    },
                    "referral_code": {
                        "type": "string",
                        "description": "User's referral code",
                    },
                    "token_bits_entropy": {"type": "integer"},
                    "token_shannon_entropy": {"type": "integer"},
                    "wants_stealth": {
                        "type": "boolean",
                        "default": False,
                        "description": "Whether the user prefers stealth invoices",
                    },
                },
            },
            202: {
                "type": "object",
                "properties": {
                    "encrypted_private_key": {
                        "type": "string",
                        "description": "Armored ASCII PGP private key block",
                    },
                    "nickname": {
                        "type": "string",
                        "description": "Username generated (Robot name)",
                    },
                    "public_key": {
                        "type": "string",
                        "description": "Armored ASCII PGP public key block",
                    },
                    "referral_code": {
                        "type": "string",
                        "description": "User's referral code",
                    },
                    "token_bits_entropy": {"type": "integer"},
                    "token_shannon_entropy": {"type": "integer"},
                    "wants_stealth": {
                        "type": "boolean",
                        "default": False,
                        "description": "Whether the user prefers stealth invoices",
                    },
                    "found": {"type": "string", "description": "Welcome back message"},
                    "active_order_id": {
                        "type": "integer",
                        "description": "Active order id if present",
                    },
                    "last_order_id": {
                        "type": "integer",
                        "description": "Last order id if present",
                    },
                },
            },
            400: {
                "oneOf": [
                    {
                        "type": "object",
                        "properties": {
                            "active_order_id": {
                                "type": "string",
                                "description": "Order id the robot is a maker/taker of",
                            },
                            "nickname": {
                                "type": "string",
                                "description": "Username (Robot name)",
                            },
                            "bad_request": {
                                "type": "string",
                                "description": "Reason for the failure",
                                "default": "You are already logged in as {nickname} and have an active order",
                            },
                        },
                        "description": "Response when you already authenticated and have an order",
                    },
                    {
                        "type": "object",
                        "properties": {
                            "bad_request": {
                                "type": "string",
                                "description": "Reason for the failure",
                            },
                        },
                    },
                ]
            },
            403: {
                "type": "object",
                "properties": {
                    "bad_request": {
                        "type": "string",
                        "description": "Reason for the failure",
                        "default": "Enter a different token",
                    },
                    "found": {
                        "type": "string",
                        "default": "Bad luck, this nickname is taken",
                    },
                },
            },
        },
        "examples": [
            OpenApiExample(
                "Successfuly created user",
                value={
                    "token_shannon_entropy": 0.7714559798089662,
                    "token_bits_entropy": 169.21582985307933,
                    "nickname": "StackerMan420",
                    "referral_code": "lfvv4-ppNi1",
                    "public_key": "-----BEGIN PGP PUBLIC KEY BLOCK-----\n\n......\n......",
                    "encrypted_private_key": "-----BEGIN PGP PRIVATE KEY BLOCK-----\n\n......\n......",
                    "wants_stealth": False,
                },
                status_codes=[201],
            ),
            OpenApiExample(
                "Already authenticated and have an order",
                value={
                    "active_order_id": "42069",
                    "nickname": "StackerMan210",
                    "bad_request": "You are already logged in as {nickname} and have an active order",
                },
                status_codes=[400],
            ),
            OpenApiExample(
                "When required token entropy not met",
                value={"bad_request": "The token does not have enough entropy"},
                status_codes=[400],
            ),
            OpenApiExample(
                "Invalid PGP public key provided",
                value={"bad_request": "Your PGP public key does not seem valid"},
                status_codes=[400],
            ),
        ],
    }

    delete = {
        "summary": "Delete user",
        "description": textwrap.dedent(
            """
            Delete a Robot. Deleting a robot is not allowed if the robot has an active order, has had completed trades or was created more than 30 mins ago.
            Mainly used on the frontend to "Generate new Robot" without flooding the DB with discarded robots.
            """
        ),
        "responses": {
            403: {},
            400: {
                "type": "object",
                "properties": {
                    "bad_request": {
                        "type": "string",
                        "description": "Reason for the failure",
                    },
                },
            },
            301: {
                "type": "object",
                "properties": {
                    "user_deleted": {
                        "type": "string",
                        "default": "User deleted permanently",
                    },
                },
            },
        },
    }


class BookViewSchema:
    get = {
        "summary": "Get public orders",
        "description": "Get public orders in the book.",
        "parameters": [
            OpenApiParameter(
                name="currency",
                location=OpenApiParameter.QUERY,
                description=(
                    "The currency id to filter by. Currency IDs can be found [here]"
                    "(https://github.com/Reckless-Satoshi/robosats/blob/main/frontend/static/assets/currencies.json). "
                    "Value of `0` means ANY currency"
                ),
                type=int,
            ),
            OpenApiParameter(
                name="type",
                location=OpenApiParameter.QUERY,
                description=(
                    "Order type to filter by\n"
                    "- `0` - BUY\n"
                    "- `1` - SELL\n"
                    "- `2` - ALL"
                ),
                type=int,
                enum=[0, 1, 2],
            ),
        ],
    }


class InfoViewSchema:
    get = {
        "summary": "Get info",
        "description": textwrap.dedent(
            """
            Get general info (overview) about the exchange.

            **Info**:
            - Current market data
              - num. of orders
              - book liquidity
              - 24h active robots 
              - 24h non-KYC premium
              - 24h volume
              - all time volume
            - Node info 
              - lnd version
              - node id
              - node alias
              - network
            - Fees
              - maker and taker fees
              - on-chain swap fees
            - Robot (If autheticated)
              - nickname
              - referral code
              - earned rewards
            """
        ),
    }


class RewardViewSchema:
    post = {
        "summary": "Withdraw reward",
        "description": "Withdraw user reward by submitting an invoice",
        "responses": {
            200: {
                "type": "object",
                "properties": {
                    "successful_withdrawal": {"type": "boolean", "default": True}
                },
            },
            400: {
                "oneOf": [
                    {
                        "type": "object",
                        "properties": {
                            "successful_withdrawal": {
                                "type": "boolean",
                                "default": False,
                            },
                            "bad_invoice": {
                                "type": "string",
                                "description": "More context for the reason of the failure",
                            },
                        },
                    },
                    {
                        "type": "object",
                        "properties": {
                            "successful_withdrawal": {
                                "type": "boolean",
                                "default": False,
                            },
                            "bad_request": {
                                "type": "string",
                                "description": "More context for the reason of the failure",
                            },
                        },
                    },
                ]
            },
        },
        "examples": [
            OpenApiExample(
                "User not authenticated",
                value={
                    "bad_request": "Woops! It seems you do not have a robot avatar",
                },
                status_codes=[400],
            ),
            OpenApiExample(
                "When no rewards earned",
                value={
                    "successful_withdrawal": False,
                    "bad_invoice": "You have not earned rewards",
                },
                status_codes=[400],
            ),
            OpenApiExample(
                "Bad invoice or in case of payment failure",
                value={
                    "successful_withdrawal": False,
                    "bad_invoice": "Does not look like a valid lightning invoice",
                },
                status_codes=[400],
            ),
        ],
    }


class PriceViewSchema:
    get = {
        "summary": "Get last market prices",
        "description": "Get the last market price for each currency. Also, returns some more info about the last trade in each currency.",
        "responses": {
            200: {
                "type": "object",
                "additionalProperties": {
                    "type": "object",
                    "properties": {
                        "price": {"type": "integer"},
                        "volume": {"type": "integer"},
                        "premium": {"type": "integer"},
                        "timestamp": {"type": "string", "format": "date-time"},
                    },
                },
            },
        },
        "examples": [
            OpenApiExample(
                "Truncated example. Real response contains all the currencies",
                value={
                    "<currency symbol>": {
                        "price": 21948.89,
                        "volume": 0.01366812,
                        "premium": 3.5,
                        "timestamp": "2022-09-13T14:32:40.591774Z",
                    },
                },
                status_codes=[200],
            )
        ],
    }


class TickViewSchema:
    get = {
        "summary": "Get market ticks",
        "description": "Get all market ticks. Returns a list of all the market ticks since inception.\n"
        "CEX price is also recorded for useful insight on the historical premium of Non-KYC BTC. "
        "Price is set when taker bond is locked.",
    }


class LimitViewSchema:
    get = {
        "summary": "List order limits",
        "description": "Get a list of order limits for every currency pair available.",
        "responses": {
            200: {
                "type": "object",
                "additionalProperties": {
                    "type": "object",
                    "properties": {
                        "code": {
                            "type": "string",
                            "description": "Three letter currency symbol",
                        },
                        "price": {"type": "integer"},
                        "min_amount": {
                            "type": "integer",
                            "description": "Minimum amount allowed in an order in the particular currency",
                        },
                        "max_amount": {
                            "type": "integer",
                            "description": "Maximum amount allowed in an order in the particular currency",
                        },
                        "max_bondless_amount": {
                            "type": "integer",
                            "description": "Maximum amount allowed in a bondless order",
                        },
                    },
                },
            },
        },
        "examples": [
            OpenApiExample(
                "Truncated example. Real response contains all the currencies",
                value={
                    "<currency number>": {
                        "code": "USD",
                        "price": "42069.69",
                        "min_amount": "4.2",
                        "max_amount": "420.69",
                        "max_bondless_amount": "10.1",
                    },
                },
                status_codes=[200],
            )
        ],
    }


class HistoricalViewSchema:
    get = {
        "summary": "Get historical exchange activity",
        "description": "Get historical exchange activity. Currently, it lists each day's total contracts and their volume in BTC since inception.",
        "responses": {
            200: {
                "type": "object",
                "additionalProperties": {
                    "type": "object",
                    "properties": {
                        "volume": {
                            "type": "integer",
                            "description": "Total Volume traded on that particular date",
                        },
                        "num_contracts": {
                            "type": "number",
                            "description": "Number of successful trades on that particular date",
                        },
                    },
                },
            },
        },
        "examples": [
            OpenApiExample(
                "Truncated example",
                value={
                    "<date>": {
                        "code": "USD",
                        "price": "42069.69",
                        "min_amount": "4.2",
                        "max_amount": "420.69",
                        "max_bondless_amount": "10.1",
                    },
                },
                status_codes=[200],
            )
        ],
    }


class StealthViewSchema:
    put = {
        "summary": "Update stealth option",
        "description": "Update stealth invoice option for the user",
        "responses": {
            200: StealthSerializer,
            400: {
                "type": "object",
                "properties": {
                    "bad_request": {
                        "type": "string",
                        "description": "Reason for the failure",
                    },
                },
            },
        },
    }
