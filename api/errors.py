ERRORS = {
    # 1000 - Bad request
    1000: "You are already maker of an active order",
    1001: "You are already taker of an active order",
    1002: "You are already taking an active order",
    1003: "You are still pending a payment from a recent order",
    1004: "Your order is too big. It is worth {order_amount} Sats now, but the limit is {max_order_size} Sats",
    1005: "Your order is too small. It is worth {order_amount} Sats now, but the limit is {min_order_size} Sats",
    1006: "Maximum range amount must be at least 50 percent higher than the minimum amount",
    1007: "Your order maximum amount is too big. It is worth {max_sats} Sats now, but the limit is {max_order_size} Sats",
    1008: "Your order minimum amount is too small. It is worth {min_sats} Sats now, but the limit is {min_order_size} Sats",
    1009: "Your order amount range is too large. Max amount can only be 15 times bigger than min amount",
    1010: "The coordinator does not support orders in {country}",
    1011: "The amount specified is outside the range specified by the maker",
    1012: "You need to wait {time_out} seconds to take an order",
    1013: "You cannot open a dispute of this order at this stage",
    1014: "Only orders in dispute accept dispute statements",
    1015: "Only the buyer of this order can provide a payout address.",
    1016: "You cannot submit an address now.",
    1017: "Only the buyer of this order can provide a buyer invoice.",
    1018: "Wait for your order to be taken.",
    1019: "You cannot submit an invoice while bonds are not locked.",
    1020: "Current order status is {order_status}, not {cancel_status}.",
    1021: "You cannot cancel this order",
    1022: "Invoice expired. You did not confirm publishing the order in time. Make a new order.",
    1023: "The lightning node is down. Write in the Telegram group to make sure the staff is aware.",
    1024: "This is weird, RoboSats' lightning wallet is locked. Check in the Telegram group, maybe the staff has died.",
    1025: "Order expired. You did not confirm taking the order in time.",
    1026: "Invoice expired. You did not send the escrow in time.",
    1027: "You cannot confirm to have received the fiat before it is confirmed to be sent by the buyer.",
    1028: "Woah, something broke badly. Report in the public channels, or open a Github Issue.",
    1029: "You cannot confirm the fiat payment at this stage",
    1030: "Only the buyer can undo the fiat sent confirmation.",
    1031: "Only orders in Chat and with fiat sent confirmed can be reverted.",
    1032: "You cannot pause or unpause an order you did not make",
    1033: "You can only pause/unpause an order that is either public or paused",
    1034: "Your PGP public key does not seem valid.\nStderr: {import_pub_result_stderr}\n"
    + "ReturnCode: {import_pub_result_returncode}\nSummary: {import_pub_result_summary}\n"
    + "Results: {import_pub_result_results}\nImported: {import_pub_result_imported}\n",
    1035: "Your PGP encrypted private key does not seem valid.\nStderr: {import_priv_result_stderr}\n"
    + "ReturnCode: {import_priv_result_returncode}\nSummary: {import_priv_result_summary}\n"
    + "Results: {import_priv_result.results}\nSec Imported: {import_priv_result_sec_imported}\n",
    1036: "Woops! It seems you do not have a robot avatar",
    1037: "The RoboSats {coordinator_alias} coordinator book is at full capacity! Current limit is {max_public_orders} orders",
    1038: "You must specify min_amount and max_amount for a range order",
    1039: "You must specify an order amount",
    1040: "You must have a robot avatar to see the order details",
    1041: "Order ID parameter not found in request",
    1042: "Invalid Order Id",
    1043: "This order has been cancelled",
    1044: "This order is not available",
    1045: "Wrong password",
    1046: "This order is not public anymore.",
    1047: "You are not a participant in this order",
    1048: "The PGP signed cleartext message is not valid.",
    1049: "The Robotic Satoshis working in the warehouse did not understand you. "
    + "Please, fill a Bug Issue in Github https://github.com/RoboSats/robosats/issues",
    1050: "Invalid date format",
    1051: "More than 5000 market ticks have been found. Please, narrow the date range",
    1052: "Robot has no finished order",
    1053: "Wrong hex pubkey",
    1054: "For sell orders, price limit must be below current exchange rate",
    1055: "For buy orders, price limit must be above current exchange rate",
    1056: "Cannot unpause: current exchange rate ({exchange_rate:.2f}) exceeds your limit ({price_limit})",
    # 2000 - Bad statement
    2000: "The statement and chat logs are longer than 50,000 characters",
    2001: "The statement is too short. Make sure to be thorough.",
    # 3000 - Bad invoice
    3000: "You submitted an empty invoice",
    3001: "You can only submit an invoice after expiration or 3 failed attempts",
    3002: "You must submit a NEW invoice",
    3003: "You have not earned rewards",
    3004: "Give me a new invoice",
    3005: "Invoice payment failure: {failure_reason}",
    # 4000 - Bad address
    4000: "You submitted an empty address",
    4001: "The mining fee is too low. Must be higher than {min_mining_fee_rate} Sat/vbyte",
    4002: "The mining fee is too high, must be less than 500 Sats/vbyte",
    4003: "The amount remaining after subtracting mining fee is close to dust limit.",
    4004: "Invalid address",
    4005: "Unable to validate address, check bitcoind backend",
    # 5000 - Bad summary
    5000: "Order has not finished yet",
    # 6000 - Chat bad request
    6000: "Order ID does not exist",
    6001: "You are not participant in this order",
    6002: "Order is not in chat status",
    6003: "Invalid serializer",
    # 7000 - Middlewares bad request
    7000: "Robot token SHA256 was provided in the header. However it is not a valid 39 or 40 characters Base91 string.",
    7001: "On the first request to a RoboSats coordinator, you must provide as well a valid public and encrypted private PGP keys and a nostr pubkey",
    7002: "Invalid keys: {bad_keys_context}",
    7003: "Authentication credentials were not provided.",
}


def new_error(code: int, parameters: dict = None) -> dict:
    message = ERRORS[code]
    if parameters is not None:
        message = message.format(**parameters)

    message_field_name = "bad_request"
    if 2000 <= code < 3000:
        message_field_name = "bad_statement"
    if 3000 <= code < 4000:
        message_field_name = "bad_invoice"
    if 4000 <= code < 5000:
        message_field_name = "bad_address"
    if 5000 <= code < 6000:
        message_field_name = "bad_summary"

    return {
        "error_code": code,
        message_field_name: message,
    }
