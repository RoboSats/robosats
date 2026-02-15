from decouple import config

LNVENDOR = config("LNVENDOR", cast=str, default="LND").strip("'\"")

if LNVENDOR == "LND":
    from api.lightning.lnd import LNDNode

    LNNode = LNDNode
elif LNVENDOR == "CLN":
    from api.lightning.cln import CLNNode

    LNNode = CLNNode
else:
    raise ValueError(
        f'Invalid Lightning Node vendor: {LNVENDOR}. Must be either "LND" or "CLN"'
    )
