import textwrap

from decouple import config
from drf_spectacular.utils import OpenApiExample, OpenApiParameter

from api.serializers import (
    ListOrderSerializer,
    OrderDetailSerializer,
    StealthSerializer,
)

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
        "summary": "Get order details",
        "description": textwrap.dedent(
            """
            Get the order details. Details include/exclude attributes according to what is the status of the order

            The following fields are available irrespective of whether you are a participant or not (A participant is either a taker or a maker of an order)
            All the other fields are only available when you are either the taker or the maker of the order:

            - `id`
            - `status`
            - `created_at`
            - `expires_at`
            - `type`
            - `currency`
            - `amount`
            - `has_range`
            - `min_amount`
            - `max_amount`
            - `payment_method`
            - `is_explicit`
            - `premium`
            - `satoshis`
            - `maker`
            - `taker`
            - `escrow_duration`
            - `total_secs_exp`
            - `penalty`
            - `is_maker`
            - `is_taker`
            - `is_participant`
            - `maker_status`
            - `taker_status`
            - `price_now`

            ### Order Status

            The response of this route changes according to the status of the order. Some fields are documented below (check the 'Responses' section)
            with the status code of when they are available and some or not. With v1 API we aim to simplify this
            route to make it easier to understand which fields are available on which order status codes.

            `status` specifies the status of the order. Below is a list of possible values (status codes) and what they mean:
            - `0` "Waiting for maker bond"
            - `1` "Public"
            - `2` "Paused"
            - `3` "Waiting for taker bond"
            - `4` "Cancelled"
            - `5` "Expired"
            - `6` "Waiting for trade collateral and buyer invoice"
            - `7` "Waiting only for seller trade collateral"
            - `8` "Waiting only for buyer invoice"
            - `9` "Sending fiat - In chatroom"
            - `10` "Fiat sent - In chatroom"
            - `11` "In dispute"
            - `12` "Collaboratively cancelled"
            - `13` "Sending satoshis to buyer"
            - `14` "Sucessful trade"
            - `15` "Failed lightning network routing"
            - `16` "Wait for dispute resolution"
            - `17` "Maker lost dispute"
            - `18` "Taker lost dispute"


            Notes:
            - both `price_now` and `premium_now` are always calculated irrespective of whether `is_explicit` = true or false

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
            200: OrderDetailSerializer,
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
        },
        "examples": [
            OpenApiExample(
                "Order cancelled",
                value={"bad_request": "This order has been cancelled by the maker"},
                status_codes=[400],
            ),
            OpenApiExample(
                "When the order is not public and you neither the taker nor maker",
                value={"bad_request": "This order is not available"},
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
        "summary": "Update order",
        "description": textwrap.dedent(
            """
            Update an order

            `action` field is required and determines what is to be done. Below
            is an explaination of what each action does:

            - `take`
              - If the order has not expired and is still public, on a
                successful take, you get the same response as if `GET /order`
                was called and the status of the order was `3` (waiting for
                taker bond) which means `bond_satoshis` and `bond_invoice` are
                present in the response as well. Once the `bond_invoice` is
                paid, you successfully become the taker of the order and the
                status of the order changes.
            - `pause`
              - Toggle the status of an order from `1` to `2` and vice versa. Allowed only if status is `1` (Public) or `2` (Paused)
            - `update_invoice`
              - This action only is valid if you are the buyer. The `invoice`
                field needs to be present in the body and the value must be a
                valid LN invoice. Make sure to perform this action only when
                both the bonds are locked. i.e The status of your order is
                atleast `6` (Waiting for trade collateral and buyer invoice)
            - `update_address`
              - This action is only valid if you are the buyer. This action is
                used to set an on-chain payout address if you wish to have your
                payout be recieved on-chain. This enables on-chain swap for the
                order, so even if you earlier had submitted a LN invoice, it
                will be ignored. You get to choose the `mining_fee_rate` as
                well. Mining fee rate is specified in sats/vbyte.
            - `cancel`
              - This action is used to cancel an existing order. You cannot cancel an order if it's in one of the following states:
                - `1` - Cancelled
                - `5` - Expired
                - `11` - In dispute
                - `12` - Collaboratively cancelled
                - `13` - Sending satoshis to buyer
                - `14` - Sucessful trade
                - `15` - Failed lightning network routing
                - `17` - Maker lost dispute
                - `18` - Taker lost dispute

                Note that there are penalties involved for cancelling a order
                mid-trade so use this action carefully:

                - As a maker if you cancel an order after you have locked your
                  maker bond, you are returend your bond. This may change in
                  the future to prevent DDoSing the LN node and you won't be
                  returend the maker bond.
                - As a taker there is a time penalty involved if you `take` an
                  order and cancel it without locking the taker bond.
                - For both taker or maker, if you cancel the order when both
                  have locked thier bonds (status = `6` or `7`), you loose your
                  bond and a percent of it goes as "rewards" to your
                  counterparty and some of it the platform keeps. This is to
                  discourage wasting time and DDoSing the platform.
                - For both taker or maker, if you cancel the order when the
                  escrow is locked (status = `8` or `9`), you trigger a
                  collaborative cancel request. This sets
                  `(m|t)aker_asked_cancel` field to `true` depending on whether
                  you are the maker or the taker respectively, so that your
                  counterparty is informed that you asked for a cancel.
                - For both taker or maker, and your counterparty asked for a
                  cancel (i.e `(m|t)aker_asked_cancel` is true), and you cancel
                  as well, a collaborative cancel takes place which returns
                  both the bonds and escrow to the respective parties. Note
                  that in the future there will be a cost for even
                  collaborativelly cancelling orders for both parties.
            - `confirm`
              - This is a **crucial** action. This confirms the sending and
                receiving of fiat depending on whether you are a buyer or
                seller. There is not much RoboSats can do to actually confirm
                and verify the fiat payment channel. It is up to you to make
                sure of the correct amount was received before you confirm.
                This action is only allowed when status is either `9` (Sending
                fiat - In chatroom) or `10` (Fiat sent - In chatroom)
                - If you are the buyer, it simply sets `fiat_sent` to `true`
                  which means that you have sent the fiat using the payment
                  method selected by the seller and signals the seller that the
                  fiat payment was done.
                - If you are the seller, be very careful and double check
                  before performing this action. Check that your fiat payment
                  method was successful in receiving the funds and whether it
                  was the correct amount. This action settles the escrow and
                  pays the buyer and sets the the order status to `13` (Sending
                  satohis to buyer) and eventually to `14` (successful trade).
            - `undo_confirm`
              - This action will undo the fiat_sent confirmation by the buyer
                it is allowed only once the fiat is confirmed as sent and can
                enable the collaborative cancellation option if an off-robosats
                payment cannot be completed or is blocked.
            - `dispute`
              - This action is allowed only if status is `9` or `10`. It sets
                the order status to `11` (In dispute) and sets `is_disputed` to
                `true`. Both the bonds and the escrow are settled (i.e RoboSats
                takes custody of the funds). Disputes can take long to resolve,
                it might trigger force closure for unresolved HTLCs). Dispute
                winner will have to submit a new invoice for value of escrow +
                bond.
            - `submit_statement`
              - This action updates the dispute statement. Allowed only when
                status is `11` (In dispute). `statement` must be sent in the
                request body and should be a string. 100 chars < length of
                `statement` < 5000 chars. You need to describe the reason for
                raising a dispute. The `(m|t)aker_statement` field is set
                respectively. Only when both parties have submitted their
                dispute statement, the order status changes to `16` (Waiting
                for dispute resolution)
            - `rate_platform`
              - Let us know how much you love (or hate 😢) RoboSats.
                You can rate the platform from `1-5` using the `rate` field in the request body

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
            200: {
                "type": "object",
                "additionalProperties": {
                    "oneOf": [
                        {"type": "str"},
                        {"type": "number"},
                        {"type": "object"},
                        {"type": "boolean"},
                    ],
                },
            },
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
        "examples": [
            OpenApiExample(
                "User not authenticated",
                value={
                    "bad_request": "Woops! It seems you do not have a robot avatar",
                },
                status_codes=[400],
            ),
        ],
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
                    "(https://github.com/RoboSats/robosats/blob/main/frontend/static/assets/currencies.json). "
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


class RobotViewSchema:
    get = {
        "summary": "Get robot info",
        "description": textwrap.dedent(
            """
            Get robot info 🤖

            An authenticated request (has the token's sha256 hash encoded as base 91 in the Authorization header) will be
            returned the information about the state of a robot.

            Make sure you generate your token using cryptographically secure methods. [Here's]() the function the Javascript
            client uses to generate the tokens. Since the server only receives the hash of the
            token, it is responsibility of the client to create a strong token. Check
            [here](https://github.com/RoboSats/robosats/blob/main/frontend/src/utils/token.js)
            to see how the Javascript client creates a random strong token and how it validates entropy is optimal for tokens
            created by the user at will.

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
            200: {
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
                    "wants_stealth": {
                        "type": "boolean",
                        "default": False,
                        "description": "Whether the user prefers stealth invoices",
                    },
                    "found": {
                        "type": "boolean",
                        "description": "Robot had been created in the past. Only if the robot was created +5 mins ago.",
                    },
                    "tg_enabled": {
                        "type": "boolean",
                        "description": "The robot has telegram notifications enabled",
                    },
                    "tg_token": {
                        "type": "string",
                        "description": "Token to enable telegram with /start <tg_token>",
                    },
                    "tg_bot_name": {
                        "type": "string",
                        "description": "Name of the coordinator's telegram bot",
                    },
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
        },
        "examples": [
            OpenApiExample(
                "Successfully retrieved robot",
                value={
                    "nickname": "SatoshiNakamoto21",
                    "public_key": "-----BEGIN PGP PUBLIC KEY BLOCK-----\n\n......\n......",
                    "encrypted_private_key": "-----BEGIN PGP PRIVATE KEY BLOCK-----\n\n......\n......",
                    "wants_stealth": True,
                },
                status_codes=[200],
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
        "parameters": [
            OpenApiParameter(
                name="start",
                location=OpenApiParameter.QUERY,
                description="Start date formatted as DD-MM-YYYY",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="end",
                location=OpenApiParameter.QUERY,
                description="End date formatted as DD-MM-YYYY",
                required=False,
                type=str,
            ),
        ],
        "examples": [
            OpenApiExample(
                "Too many ticks",
                value={
                    "bad_request": "More than 5000 market ticks have been found. Try narrowing the date range."
                },
                status_codes=[400],
            )
        ],
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
                    },
                },
                status_codes=[200],
            )
        ],
    }


class StealthViewSchema:
    post = {
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
