"""
Vendor-agnostic decoded invoice data.

``LNDNode.decode_payreq`` and ``CLNNode.decode_payreq`` both return a
``DecodedPayReq`` instance so every caller in ``api/`` (``utils.py``,
``tasks.py``, the node implementations themselves) can access invoice fields
through a stable, vendor-independent interface.

Fields
------
num_satoshis            int   – invoice amount in satoshis (0 = no amount)
payment_hash            str   – hex-encoded payment hash
created_at              int   – unix timestamp of invoice creation
expiry                  int   – validity window in seconds from created_at
description             str   – invoice memo / description
route_hints             list  – list of hinted routes; each route is a list of
                                ``HopHint`` objects (may be empty)
"""

from dataclasses import dataclass, field


@dataclass
class HopHint:
    """A single hop inside a private route hint."""

    fee_base_msat: int
    fee_proportional_millionths: int


@dataclass
class DecodedPayReq:
    """Normalised invoice representation returned by both LNDNode and CLNNode."""

    num_satoshis: int
    payment_hash: str
    created_at: int
    expiry: int
    description: str
    route_hints: list = field(default_factory=list)  # list[list[HopHint]]
