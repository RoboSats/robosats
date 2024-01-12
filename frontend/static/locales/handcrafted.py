from collections import OrderedDict

# Some of the phrases that are directly returned by the coordinator API (bad requests)
# or need the use of tags <></>.
phrases = OrderedDict(
    [
        (
            "unsafe_alert",
            "To fully enable RoboSats and protect your data and privacy, use <1>Tor Browser</1> and visit the federation hosted <3>Onion</3> site or <5>host your own app.</5>",
        ),
        (
            "let_us_know_hot_to_improve",
            "Let us know how the platform could improve (<1>Telegram</1> / <3>Github</3>)",
        ),
        ("open_dispute", "To open a dispute you need to wait <1><1/>"),
        ("Waiting for maker bond", "Waiting for maker bond"),
        ("Public", "Public"),
        ("Waiting for taker bond", "Waiting for taker bond"),
        ("Cancelled", "Cancelled"),
        ("Expired", "Expired"),
        (
            "Waiting for trade collateral and buyer invoice",
            "Waiting for trade collateral and buyer invoice",
        ),
        (
            "Waiting only for seller trade collateral",
            "Waiting only for seller trade collateral",
        ),
        ("Waiting only for buyer invoice", "Waiting only for buyer invoice"),
        ("Sending fiat - In chatroom", "Sending fiat - In chatroom"),
        ("Fiat sent - In chatroom", "Fiat sent - In chatroom"),
        ("In dispute", "In dispute"),
        ("Collaboratively cancelled", "Collaboratively cancelled"),
        ("Sending satoshis to buyer", "Sending satoshis to buyer"),
        ("Sucessful trade", "Successful trade"),
        ("Failed lightning network routing", "Failed lightning network routing"),
        ("Wait for dispute resolution", "Wait for dispute resolution"),
        ("Maker lost dispute", "Maker lost dispute"),
        ("Taker lost dispute", "Taker lost dispute"),
        (
            "Invoice expired. You did not confirm publishing the order in time. Make a new order.",
            "Invoice expired. You did not confirm publishing the order in time. Make a new order.",
        ),
        (
            "This order has been cancelled by the maker",
            "This order has been cancelled by the maker",
        ),
        (
            "Invoice expired. You did not confirm taking the order in time.",
            "Invoice expired. You did not confirm taking the order in time.",
        ),
        ("Invalid Order Id", "Invalid Order Id"),
        (
            "Invoice expired. You did not confirm taking the order in time.",
            "Invoice expired. You did not confirm taking the order in time.",
        ),
        (
            "You must have a robot avatar to see the order details",
            "You must have a robot avatar to see the order details",
        ),
        (
            "This order has been cancelled collaborativelly",
            "This order has been cancelled collaboratively",
        ),
        ("This order is not available", "This order is not available"),
        (
            "The Robotic Satoshis working in the warehouse did not understand you. Please, fill a Bug Issue in Github https://github.com/RoboSats/robosats/issues",
            "The Robotic Satoshis working in the warehouse did not understand you. Please, fill a Bug Issue in Github https://github.com/RoboSats/robosats/issues",
        ),
    ]
)
