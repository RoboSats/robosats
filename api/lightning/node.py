from decouple import config

LN_vendor = config("LNVENDOR", cast=str, default="LND")

if LN_vendor == "LND":
    from api.lightning.lnd import LNDNode

    LNNode = LNDNode
elif LN_vendor == "CLN":
    from api.lightning.cln import CLNNode

    LNNode = CLNNode
else:
    raise ValueError(
        f'Invalid Lightning Node vendor: {LN_vendor}. Must be either "LND" or "CLN"'
    )
