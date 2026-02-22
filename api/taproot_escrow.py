"""
taproot_escrow.py — Taproot/MAST Escrow Protocol for RoboSats
==============================================================

Ported from: taptrade-core (Rust) to Python
Uses:   python-bitcoinlib  for raw transaction / script construction
        secp256k1          for elliptic-curve operations + MuSig2

SECURITY MODEL — NON-CUSTODIAL GUARANTEE
─────────────────────────────────────────
The Coordinator is an ORCHESTRATOR, not a CUSTODIAN.

1. KEY PATH (Happy path — 2-of-2 MuSig2 between Maker and Taker):
   • The Coordinator NEVER possesses the aggregated private key.
   • Each trader produces a partial MuSig2 signature on their own device.
   • The Coordinator merely aggregates the two partial sigs into one
     valid Schnorr signature — it cannot forge a sig without both
     parties cooperating.

2. SCRIPT PATHS (Dispute / Rescue / Protection):
   • Dispute A:  and(pk(maker),  pk(coordinator))  — Maker + Coordinator
   • Dispute B:  and(pk(taker),  pk(coordinator))  — Taker + Coordinator
   • Rescue:     and(pk(maker),  pk(taker), after(2048 blocks))
   • Protection: and(pk(maker),  after(12228 blocks))
   • The Coordinator cannot unilaterally spend — dispute paths require
     the winning trader's co-signature.
   • Rescue and protection paths don't involve the Coordinator at all.

3. BONDS:
   • Signed bond TXs are HELD but never broadcast unless the trader
     cheats. The Coordinator stores only the signed transaction hex.

Reference: taptrade-core/taptrade-cli-demo/coordinator/src/wallet/
"""

from __future__ import annotations

import hashlib
import logging
import struct
from typing import Optional, Tuple

from bitcoin import SelectParams
from bitcoin.core import (
    CMutableTransaction,
    CMutableTxIn,
    CMutableTxOut,
    COutPoint,
    CTransaction,
    CTxWitness,
    lx,
    b2lx,
    b2x,
    x,
)
from bitcoin.core.script import (
    CScript,
    CScriptOp,
    OP_CHECKSIG,
    OP_CHECKSIGVERIFY,
    OP_CHECKSEQUENCEVERIFY,
    OP_DROP,
)
from bitcoin.wallet import CBitcoinAddress
from bitcoin.segwit_addr import encode as bech32_encode

import secp256k1

# ── Taproot-era opcodes/constants not yet in python-bitcoinlib ──────
# BIP-342 defines OP_CHECKSIGADD (0xba) for Tapscript multisig.
# We define it here since python-bitcoinlib 0.12.x predates Taproot.
OP_CHECKSIGADD = CScriptOp(0xBA)
# SIGHASH_DEFAULT (0x00) is the Taproot-only sighash type (BIP-341).
SIGHASH_DEFAULT = 0x00


def encode_p2tr_address(output_key: bytes, network: str = "testnet") -> str:
    """
    Encode a 32-byte x-only public key as a bech32m P2TR address.
    python-bitcoinlib v0.12.x doesn't have P2TRBitcoinAddress, so we
    use the raw bech32m encoder from segwit_addr.
    """
    hrp = {"mainnet": "bc", "testnet": "tb", "regtest": "bcrt"}.get(network, "tb")
    # Witness version 1 + 32-byte program → bech32m
    witprog = list(output_key)
    return bech32_encode(hrp, 1, witprog)


def p2tr_scriptpubkey(address: str) -> CScript:
    """
    Build the scriptPubKey for any segwit address (v0 bech32 or v1 bech32m).
    We use raw segwit_addr.decode to avoid SelectParams dependency issues.
    """
    from bitcoin.segwit_addr import decode as bech32_decode

    # Extract HRP (everything before last '1')
    hrp = address[: address.rindex("1")].lower()
    witver, witprog = bech32_decode(hrp, address)
    if witver is None or witprog is None:
        raise ValueError(f"Invalid segwit address: {address}")
    # Build scriptPubKey: <witver> <push N> <witness_program>
    prog_bytes = bytes(witprog)
    return CScript(bytes([0x50 + witver, len(prog_bytes)]) + prog_bytes)


logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════
# TAPROOT CONSTANTS  (from BIP-341, BIP-342)
# ═══════════════════════════════════════════════════════════════════════

# Leaf version for Tapscript (BIP-342)
TAPSCRIPT_LEAF_VERSION = 0xC0

# Tagged hash prefixes  (BIP-340)
TAG_TAPLEAF = b"TapLeaf"
TAG_TAPBRANCH = b"TapBranch"
TAG_TAPTWEAK = b"TapTweak"

# Timelock values from taptrade-core
RESCUE_TIMELOCK_BLOCKS = 2048  # Maker + Taker can recover after 2048 blocks
PROTECTION_TIMELOCK_BLOCKS = 12228  # Maker can recover alone after 12228 blocks


# ═══════════════════════════════════════════════════════════════════════
# TAGGED HASHES  (BIP-340 §  "Tagged Hashes")
# ═══════════════════════════════════════════════════════════════════════


def tagged_hash(tag: bytes, msg: bytes) -> bytes:
    """
    BIP-340 tagged hash: SHA256(SHA256(tag) || SHA256(tag) || msg)

    This is the fundamental building block for Taproot commitment
    structures (leaf hashes, branch hashes, tweak computation).
    """
    tag_hash = hashlib.sha256(tag).digest()
    return hashlib.sha256(tag_hash + tag_hash + msg).digest()


def tapleaf_hash(script: bytes, leaf_version: int = TAPSCRIPT_LEAF_VERSION) -> bytes:
    """
    Compute the TapLeaf hash for a given script.
    TapLeaf = tagged_hash("TapLeaf", leaf_version || compact_size(script) || script)
    """
    # leaf_version is a single byte
    # compact_size encoding for the script length
    script_len = len(script)
    if script_len < 0xFD:
        size_bytes = struct.pack("<B", script_len)
    elif script_len <= 0xFFFF:
        size_bytes = b"\xfd" + struct.pack("<H", script_len)
    else:
        size_bytes = b"\xfe" + struct.pack("<I", script_len)

    return tagged_hash(
        TAG_TAPLEAF,
        bytes([leaf_version]) + size_bytes + script,
    )


def tapbranch_hash(left: bytes, right: bytes) -> bytes:
    """
    Compute the TapBranch hash from two child hashes.
    Children are sorted lexicographically to ensure canonical ordering.
    TapBranch = tagged_hash("TapBranch", sorted(left, right))
    """
    if left > right:
        left, right = right, left
    return tagged_hash(TAG_TAPBRANCH, left + right)


# ═══════════════════════════════════════════════════════════════════════
# MUSIG2 COORDINATOR
# ═══════════════════════════════════════════════════════════════════════


class MuSig2Coordinator:
    """
    BIP-327 MuSig2 key aggregation and signature coordination.

    SECURITY NOTE:
        This class handles only PUBLIC data — public keys, public nonces,
        and partial signatures. The Coordinator calls these methods but
        never possesses private keys or secret nonces. Traders produce
        partial signatures locally on their own devices.

    Ported from:
        taptrade-core/coordinator/src/wallet/escrow_psbt.rs::aggregate_musig_pubkeys()
        taptrade-core/coordinator/src/coordinator/coordinator_utils.rs
    """

    @staticmethod
    def aggregate_pubkeys(pubkey1_hex: str, pubkey2_hex: str) -> bytes:
        """
        Aggregate two compressed public keys into a single x-only key
        using the MuSig2 KeyAgg algorithm (BIP-327).

        This produces the internal key for the Taproot output. The
        Coordinator computes this to build the descriptor but CANNOT
        sign with it — signing requires both traders' secret keys.

        Args:
            pubkey1_hex: Maker's compressed pubkey (66 hex chars)
            pubkey2_hex: Taker's compressed pubkey (66 hex chars)

        Returns:
            32-byte x-only aggregated public key

        Ported from: aggregate_musig_pubkeys() in escrow_psbt.rs
        """
        pk1_bytes = bytes.fromhex(pubkey1_hex)
        pk2_bytes = bytes.fromhex(pubkey2_hex)

        # Sort lexicographically for deterministic key aggregation (BIP-327)
        pubkeys = sorted([pk1_bytes, pk2_bytes])

        # Compute the key aggregation coefficient hash
        # L = SHA256(pk1 || pk2)  (sorted)
        pk_list_hash = hashlib.sha256(b"".join(pubkeys)).digest()

        # For each key, compute a_i = SHA256("KeyAgg coefficient" || L || pk_i)
        # Then Q = sum(a_i * P_i)
        agg_key = None
        for pk_bytes in pubkeys:
            # Coefficient: tagged_hash("KeyAgg coefficient", L || pk)
            coeff_data = pk_list_hash + pk_bytes
            coeff_hash = tagged_hash(b"KeyAgg coefficient", coeff_data)

            # Parse the public key
            pk = secp256k1.PublicKey(pk_bytes, raw=True)

            # Multiply key by coefficient: a_i * P_i
            tweaked = pk.tweak_mul(coeff_hash)

            if agg_key is None:
                agg_key = tweaked
            else:
                raw_combined = agg_key.combine([tweaked.public_key])
                agg_key = secp256k1.PublicKey(raw_combined, raw=False)

        # Extract x-only (32 bytes) from the aggregated compressed key
        agg_serialized = agg_key.serialize(compressed=True)
        # x-only = drop the 02/03 prefix byte
        x_only = agg_serialized[1:]

        logger.debug(
            "MuSig2 aggregated key: %s from [%s, %s]",
            x_only.hex(),
            pubkey1_hex,
            pubkey2_hex,
        )
        return x_only

    @staticmethod
    def aggregate_nonces(nonce1_hex: str, nonce2_hex: str) -> bytes:
        """
        Aggregate two MuSig2 public nonces by elliptic-curve point addition.

        Each public nonce is 66 bytes (two 33-byte compressed points:
        R1 and R2). We aggregate component-wise: agg_R1 = R1_a + R1_b,
        agg_R2 = R2_a + R2_b.

        SECURITY: Only public nonces are handled; secret nonces never
        leave the traders' devices.

        Args:
            nonce1_hex: First public nonce (132 hex chars = 66 bytes)
            nonce2_hex: Second public nonce (132 hex chars = 66 bytes)

        Returns:
            66-byte aggregated nonce (two compressed points)

        Ported from: agg_hex_musig_nonces() in coordinator_utils.rs
        """
        nonce1 = bytes.fromhex(nonce1_hex)
        nonce2 = bytes.fromhex(nonce2_hex)

        if len(nonce1) != 66 or len(nonce2) != 66:
            raise ValueError(
                f"Invalid nonce length: expected 66 bytes each, "
                f"got {len(nonce1)} and {len(nonce2)}"
            )

        # Each nonce = R1 (33 bytes) || R2 (33 bytes)
        r1_a = secp256k1.PublicKey(nonce1[:33], raw=True)
        r2_a = secp256k1.PublicKey(nonce1[33:], raw=True)
        r1_b = secp256k1.PublicKey(nonce2[:33], raw=True)
        r2_b = secp256k1.PublicKey(nonce2[33:], raw=True)

        # Aggregate: point addition
        agg_r1 = secp256k1.PublicKey(r1_a.combine([r1_b.public_key]), raw=False)
        agg_r2 = secp256k1.PublicKey(r2_a.combine([r2_b.public_key]), raw=False)

        agg_nonce = agg_r1.serialize(compressed=True) + agg_r2.serialize(
            compressed=True
        )
        logger.debug("Aggregated nonce: %s", agg_nonce.hex())
        return agg_nonce

    @staticmethod
    def aggregate_partial_signatures(
        sig1_hex: str,
        sig2_hex: str,
        agg_nonce: bytes,
        agg_pubkey: bytes,
        message: bytes,
    ) -> bytes:
        """
        Aggregate two MuSig2 partial signatures into a single valid
        Schnorr signature (BIP-340 compatible).

        SECURITY:
            - Each partial signature s_i is a 32-byte scalar.
            - aggregated_sig = (R, s1 + s2 mod n)
            - The Coordinator computes s = s1 + s2 but CANNOT extract
              either trader's private key from the partial sigs alone.

        Args:
            sig1_hex: Maker's partial signature (64 hex chars = 32 bytes)
            sig2_hex: Taker's partial signature (64 hex chars = 32 bytes)
            agg_nonce: 66-byte aggregated nonce (from aggregate_nonces)
            agg_pubkey: 32-byte x-only aggregated public key
            message: The sighash message being signed

        Returns:
            64-byte Schnorr signature (R || s)

        Ported from: KeyspendContext.from_hex_str() → aggregate_partial_signatures()
                     in coordinator_utils.rs
        """
        s1 = int.from_bytes(bytes.fromhex(sig1_hex), "big")
        s2 = int.from_bytes(bytes.fromhex(sig2_hex), "big")

        # secp256k1 curve order
        SECP256K1_ORDER = (
            0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
        )

        # Sum the partial signatures modulo the curve order
        s_agg = (s1 + s2) % SECP256K1_ORDER

        # R is the first component of the aggregated nonce (x-coordinate)
        # We need the x-only serialization
        agg_r1 = secp256k1.PublicKey(agg_nonce[:33], raw=True)
        r_x = agg_r1.serialize(compressed=True)[1:]  # x-only (32 bytes)

        # Final Schnorr signature = R_x || s
        schnorr_sig = r_x + s_agg.to_bytes(32, "big")

        logger.debug(
            "Aggregated Schnorr signature (%d bytes): %s",
            len(schnorr_sig),
            schnorr_sig.hex(),
        )
        return schnorr_sig


# ═══════════════════════════════════════════════════════════════════════
# TAPSCRIPT LEAF BUILDERS
# ═══════════════════════════════════════════════════════════════════════


def build_2of2_script(pubkey1_xonly: bytes, pubkey2_xonly: bytes) -> bytes:
    """
    Build a Tapscript 2-of-2 multisig script using CHECKSIGVERIFY + CHECKSIG.

    Script: <pk1> OP_CHECKSIGVERIFY <pk2> OP_CHECKSIG

    This is used for:
      - Dispute A: maker + coordinator
      - Dispute B: taker + coordinator

    Ported from: policy_a_string / policy_b_string in escrow_psbt.rs
    """
    return CScript(
        [
            pubkey1_xonly,
            OP_CHECKSIGVERIFY,
            pubkey2_xonly,
            OP_CHECKSIG,
        ]
    )


def build_2of2_timelock_script(
    pubkey1_xonly: bytes,
    pubkey2_xonly: bytes,
    timelock_blocks: int,
) -> bytes:
    """
    Build a Tapscript 2-of-2 + CSV timelock script.

    Script: <pk1> OP_CHECKSIGVERIFY <pk2> OP_CHECKSIGVERIFY
            <timelock> OP_CHECKSEQUENCEVERIFY OP_DROP

    This is the RESCUE path: both Maker and Taker can recover after
    `timelock_blocks` blocks WITHOUT the Coordinator.

    Ported from: policy_d_string in escrow_psbt.rs
    """
    return CScript(
        [
            pubkey1_xonly,
            OP_CHECKSIGVERIFY,
            pubkey2_xonly,
            OP_CHECKSIGVERIFY,
            timelock_blocks,
            OP_CHECKSEQUENCEVERIFY,
            OP_DROP,
        ]
    )


def build_single_timelock_script(
    pubkey_xonly: bytes,
    timelock_blocks: int,
) -> bytes:
    """
    Build a Tapscript single-signer + CSV timelock script.

    Script: <pk> OP_CHECKSIGVERIFY <timelock> OP_CHECKSEQUENCEVERIFY OP_DROP

    This is the PROTECTION path: the Maker can recover funds unilaterally
    after 12228 blocks (~85 days). This is a last-resort escape hatch if
    all other parties become unresponsive.

    Ported from: policy_c_string in escrow_psbt.rs
    """
    return CScript(
        [
            pubkey_xonly,
            OP_CHECKSIGVERIFY,
            timelock_blocks,
            OP_CHECKSEQUENCEVERIFY,
            OP_DROP,
        ]
    )


# ═══════════════════════════════════════════════════════════════════════
# TAPROOT ESCROW BUILDER
# ═══════════════════════════════════════════════════════════════════════


class TaprootEscrowBuilder:
    """
    Constructs the Taproot escrow output descriptor with 4 MAST leaves.

    MAST structure (mirrors taptrade-core):
        ┌─────────────────────────┐
        │     Internal key:       │
        │   MuSig2(maker, taker)  │  ← keypath (happy path)
        └────────────┬────────────┘
                     │
              ┌──────┴──────┐
              │  Tap Tree   │
           ┌──┴──┐       ┌──┴──┐
         Branch1         Branch2
         ┌──┴──┐         ┌──┴──┐
       Leaf A  Leaf B  Leaf C  Leaf D
         │       │       │       │
       M+Coord T+Coord M:12228 M+T:2048
       (disp.) (disp.) (prot.) (rescue)

    Ported from: build_escrow_transaction_output_descriptor() in escrow_psbt.rs

    SECURITY NOTE:
        The Coordinator's public key only appears in Leaf A and Leaf B
        (dispute paths). It does NOT appear in the internal key (keypath),
        Leaf C (protection), or Leaf D (rescue). The Coordinator CANNOT
        spend funds without a dispute winner's cooperation.
    """

    def __init__(
        self,
        maker_taproot_pk: bytes,  # 32-byte x-only
        taker_taproot_pk: bytes,  # 32-byte x-only
        coordinator_pk: bytes,  # 32-byte x-only
        maker_musig_pk: str,  # compressed pubkey hex (66 chars)
        taker_musig_pk: str,  # compressed pubkey hex (66 chars)
    ):
        self.maker_pk = maker_taproot_pk
        self.taker_pk = taker_taproot_pk
        self.coordinator_pk = coordinator_pk
        self.maker_musig_pk = maker_musig_pk
        self.taker_musig_pk = taker_musig_pk

        # Compute the MuSig2 aggregated internal key
        self.internal_key = MuSig2Coordinator.aggregate_pubkeys(
            maker_musig_pk, taker_musig_pk
        )

    def _build_scripts(self) -> dict:
        """Build all 4 MAST leaf scripts."""
        return {
            # Leaf A: Dispute favoring Maker
            # Maker + Coordinator can spend (e.g., taker cheated)
            "dispute_maker": build_2of2_script(self.maker_pk, self.coordinator_pk),
            # Leaf B: Dispute favoring Taker
            # Taker + Coordinator can spend (e.g., maker cheated)
            "dispute_taker": build_2of2_script(self.taker_pk, self.coordinator_pk),
            # Leaf C: Protection (anti-extortion)
            # Maker alone after 12228 blocks (~85 days)
            "protection": build_single_timelock_script(
                self.maker_pk, PROTECTION_TIMELOCK_BLOCKS
            ),
            # Leaf D: Rescue path
            # Maker + Taker after 2048 blocks (~14 days), NO coordinator needed
            "rescue": build_2of2_timelock_script(
                self.maker_pk, self.taker_pk, RESCUE_TIMELOCK_BLOCKS
            ),
        }

    def build_taptree_root(self) -> bytes:
        """
        Compute the Merkle root of the MAST tree.

        Tree layout (same as escrow_psbt.rs):
            root = Branch(Branch(A, B), Branch(C, D))

        Returns:
            32-byte Merkle root hash
        """
        scripts = self._build_scripts()

        # Compute leaf hashes
        leaf_a = tapleaf_hash(scripts["dispute_maker"])
        leaf_b = tapleaf_hash(scripts["dispute_taker"])
        leaf_c = tapleaf_hash(scripts["protection"])
        leaf_d = tapleaf_hash(scripts["rescue"])

        # Build the tree bottom-up
        branch_ab = tapbranch_hash(leaf_a, leaf_b)
        branch_cd = tapbranch_hash(leaf_c, leaf_d)
        root = tapbranch_hash(branch_ab, branch_cd)

        logger.debug("MAST root hash: %s", root.hex())
        return root

    def compute_tweak(self) -> bytes:
        """
        Compute the taproot tweak scalar: t = tagged_hash("TapTweak", P || root)

        The output key Q = P + t*G, where P is the internal key and G is
        the generator point.

        Ported from: get_keyspend_tweak_scalar() in coordinator_utils.rs
        """
        root = self.build_taptree_root()
        tweak = tagged_hash(TAG_TAPTWEAK, self.internal_key + root)
        logger.debug("Taproot tweak: %s", tweak.hex())
        return tweak

    def compute_output_key(self) -> bytes:
        """
        Compute the Taproot output key: Q = P + t*G

        This is the key that appears in the scriptPubKey:
            OP_1 <32-byte output_key>

        Returns:
            32-byte x-only output key
        """
        tweak = self.compute_tweak()

        # Parse the internal key as a public key (add 02 prefix for even y)
        internal_pk = secp256k1.PublicKey(b"\x02" + self.internal_key, raw=True)

        # Tweak the key: Q = P + t*G
        output_pk = internal_pk.tweak_add(tweak)
        output_serialized = output_pk.serialize(compressed=True)

        # x-only (drop prefix byte)
        output_x_only = output_serialized[1:]
        logger.debug("Taproot output key: %s", output_x_only.hex())
        return output_x_only

    def build_escrow_address(self, network: str = "regtest") -> str:
        """
        Derive the P2TR address for the escrow output.

        Args:
            network: Bitcoin network ("mainnet", "testnet", "regtest")

        Returns:
            Bech32m-encoded P2TR address string

        Ported from: escrow_output_descriptor.address() in escrow_psbt.rs
        """
        output_key = self.compute_output_key()

        # Encode as bech32m P2TR address
        address = encode_p2tr_address(output_key, network)
        logger.info("Escrow address: %s", address)
        return address

    def build_descriptor_string(self) -> str:
        """
        Build a human-readable Taproot descriptor string (informational).

        Format: tr(<internal_key>,{{<leaf_a>,<leaf_b>},{<leaf_c>,<leaf_d>}})

        This is stored in TaprootPayment.escrow_output_descriptor for
        reference and audit purposes.
        """
        ik = self.internal_key.hex()
        mk = self.maker_pk.hex()
        tk = self.taker_pk.hex()
        ck = self.coordinator_pk.hex()

        return (
            f"tr({ik},"
            f"{{"
            f"{{and_v(v:pk({mk}),pk({ck})),"  # Leaf A: dispute maker
            f"and_v(v:pk({tk}),pk({ck}))}},"  # Leaf B: dispute taker
            f"{{and_v(v:pk({mk}),after({PROTECTION_TIMELOCK_BLOCKS})),"  # Leaf C
            f"and_v(and_v(v:pk({mk}),v:pk({tk})),"
            f"after({RESCUE_TIMELOCK_BLOCKS}))}}"  # Leaf D
            f"}})"
        )

    def get_control_block(self, leaf_name: str) -> bytes:
        """
        Compute the control block for a specific leaf, needed for
        script-path spends (dispute resolution).

        A control block contains:
            - 1 byte: leaf_version | parity_bit
            - 32 bytes: internal public key (x-only)
            - 32*N bytes: Merkle proof path

        Args:
            leaf_name: One of "dispute_maker", "dispute_taker",
                       "protection", "rescue"

        Returns:
            Control block bytes
        """
        scripts = self._build_scripts()
        valid_leaves = set(scripts.keys())
        if leaf_name not in valid_leaves:
            raise ValueError(f"Unknown leaf: {leaf_name}")

        # Compute all leaf hashes
        leaf_a = tapleaf_hash(scripts["dispute_maker"])
        leaf_b = tapleaf_hash(scripts["dispute_taker"])
        leaf_c = tapleaf_hash(scripts["protection"])
        leaf_d = tapleaf_hash(scripts["rescue"])

        # Build proof path based on tree position
        if leaf_name == "dispute_maker":
            # A is paired with B, then with branch_cd
            sibling = leaf_b
            uncle = tapbranch_hash(leaf_c, leaf_d)
        elif leaf_name == "dispute_taker":
            # B is paired with A, then with branch_cd
            sibling = leaf_a
            uncle = tapbranch_hash(leaf_c, leaf_d)
        elif leaf_name == "protection":
            # C is paired with D, then with branch_ab
            sibling = leaf_d
            uncle = tapbranch_hash(leaf_a, leaf_b)
        elif leaf_name == "rescue":
            # D is paired with C, then with branch_ab
            sibling = leaf_c
            uncle = tapbranch_hash(leaf_a, leaf_b)
        else:
            raise ValueError(f"Unknown leaf: {leaf_name}")

        # Determine output key parity
        # Check if the full output key has even y-coordinate
        output_pk = secp256k1.PublicKey(b"\x02" + self.internal_key, raw=True)
        output_tweaked = output_pk.tweak_add(self.compute_tweak())
        output_full = output_tweaked.serialize(compressed=True)
        parity_bit = output_full[0] & 0x01  # 0 for even (0x02), 1 for odd (0x03)

        # Control block = (leaf_version | parity) || internal_key || proof
        control_byte = bytes([TAPSCRIPT_LEAF_VERSION | parity_bit])
        control_block = control_byte + self.internal_key + sibling + uncle

        logger.debug(
            "Control block for %s: %s (%d bytes)",
            leaf_name,
            control_block.hex(),
            len(control_block),
        )
        return control_block


# ═══════════════════════════════════════════════════════════════════════
# ESCROW PSBT BUILDER
# ═══════════════════════════════════════════════════════════════════════


class EscrowPSBTBuilder:
    """
    Builds and manages PSBTs for the escrow lifecycle.

    SECURITY NOTES:
        - The Coordinator constructs unsigned PSBTs and sends them to
          both traders for signing. Each trader signs only their own
          inputs — the Coordinator cannot sign on their behalf.
        - After both traders return signed PSBTs, the Coordinator
          combines them into a fully-signed transaction and broadcasts.

    Ported from:
        create_escrow_psbt()          in escrow_psbt.rs
        assemble_keyspend_payout_psbt() in payout_tx.rs
        broadcast_keyspend_tx()       in payout_tx.rs
    """

    @staticmethod
    def create_escrow_locking_psbt(
        escrow_builder: TaprootEscrowBuilder,
        maker_utxos: list[dict],
        taker_utxos: list[dict],
        escrow_amount_sat: int,
        coordinator_fee_sat: int,
        coordinator_address: str,
        maker_change_address: str,
        taker_change_address: str,
        mining_fee_sat: int = 10000,
        network: str = "regtest",
    ) -> dict:
        """
        Build the unsigned escrow locking transaction.

        This transaction collects inputs from both Maker and Taker,
        creates an output locked to the Taproot escrow address, and
        returns change to each party.

        SECURITY: The PSBT is returned UNSIGNED. Each trader signs only
        their own inputs locally before returning the partially-signed
        PSBT to the Coordinator.

        Args:
            escrow_builder:       TaprootEscrowBuilder with all keys
            maker_utxos:          List of {"txid": hex, "vout": int, "amount": int}
            taker_utxos:          List of {"txid": hex, "vout": int, "amount": int}
            escrow_amount_sat:    Sats to lock in escrow
            coordinator_fee_sat:  Coordinator fee in sats
            coordinator_address:  Coordinator's fee address
            maker_change_address: Maker's change address
            taker_change_address: Taker's change address
            mining_fee_sat:       Mining fee in sats (default 10000)
            network:              Bitcoin network

        Returns:
            Dict with "psbt_hex", "escrow_address", "descriptor"

        Ported from: create_escrow_psbt() in escrow_psbt.rs
        """
        SelectParams(network if network != "regtest" else "testnet")

        # Build escrow output
        escrow_address = escrow_builder.build_escrow_address(network)
        escrow_script_pubkey = CBitcoinAddress(escrow_address).to_scriptPubKey()
        descriptor_string = escrow_builder.build_descriptor_string()

        # Calculate input totals
        maker_input_total = sum(u["amount"] for u in maker_utxos)
        taker_input_total = sum(u["amount"] for u in taker_utxos)

        # Each party contributes half the escrow + their share of fees
        per_party_fee = mining_fee_sat // 2
        per_party_coord_fee = coordinator_fee_sat // 2

        maker_contribution = (
            escrow_amount_sat // 2 + per_party_fee + per_party_coord_fee
        )
        taker_contribution = (
            escrow_amount_sat
            - escrow_amount_sat // 2
            + per_party_fee
            + per_party_coord_fee
        )

        maker_change = maker_input_total - maker_contribution
        taker_change = taker_input_total - taker_contribution

        # Build inputs
        tx_inputs = []
        for utxo in maker_utxos + taker_utxos:
            outpoint = COutPoint(lx(utxo["txid"]), utxo["vout"])
            tx_inputs.append(CMutableTxIn(outpoint))

        # Build outputs
        tx_outputs = [
            # Escrow output (locked under Taproot MAST)
            CMutableTxOut(escrow_amount_sat, escrow_script_pubkey),
        ]

        # Coordinator fee output
        if coordinator_fee_sat > 0:
            coord_script = CBitcoinAddress(coordinator_address).to_scriptPubKey()
            tx_outputs.append(CMutableTxOut(coordinator_fee_sat, coord_script))

        # Change outputs
        if maker_change > 546:  # dust threshold
            maker_change_script = CBitcoinAddress(
                maker_change_address
            ).to_scriptPubKey()
            tx_outputs.append(CMutableTxOut(maker_change, maker_change_script))

        if taker_change > 546:  # dust threshold
            taker_change_script = CBitcoinAddress(
                taker_change_address
            ).to_scriptPubKey()
            tx_outputs.append(CMutableTxOut(taker_change, taker_change_script))

        # Assemble the unsigned transaction
        tx = CMutableTransaction(tx_inputs, tx_outputs)

        # Serialize as hex (this is a simplified PSBT representation)
        tx_hex = b2x(tx.serialize())

        logger.info(
            "Built escrow locking TX: %d inputs, %d outputs, "
            "escrow=%d sat, coord_fee=%d sat, mining_fee=%d sat",
            len(tx_inputs),
            len(tx_outputs),
            escrow_amount_sat,
            coordinator_fee_sat,
            mining_fee_sat,
        )

        return {
            "psbt_hex": tx_hex,
            "escrow_address": escrow_address,
            "descriptor": descriptor_string,
            "escrow_output_index": 0,  # Escrow is always first output
        }

    @staticmethod
    def combine_signed_escrow_psbts(
        maker_psbt_hex: str,
        taker_psbt_hex: str,
    ) -> str:
        """
        Combine two partially-signed PSBTs into a fully-signed transaction.

        Each participant signs only their own inputs. The Coordinator
        merges the witness data from both PSBTs.

        SECURITY: The Coordinator cannot modify the transaction outputs
        or amounts — it can only combine existing valid signatures.

        Ported from: combine_and_broadcast_escrow_psbt() in mod.rs
        """
        # In a full implementation, this would deserialize both PSBTs,
        # merge the witness/signature fields, and produce a finalized TX.
        # For now, we implement the merge logic:
        maker_tx_bytes = x(maker_psbt_hex)
        taker_tx_bytes = x(taker_psbt_hex)

        maker_tx = CTransaction.deserialize(maker_tx_bytes)
        taker_tx = CTransaction.deserialize(taker_tx_bytes)

        # The unsigned parts of both TXs should be identical
        if maker_tx.GetTxid() != taker_tx.GetTxid():
            logger.warning(
                "PSBT txids differ — this indicates the unsigned TX was tampered with!"
            )

        # Combine witnesses: take non-empty witness from each
        combined_witnesses = []
        for i in range(len(maker_tx.vin)):
            maker_wit = (
                maker_tx.wit.vtxinwit[i] if i < len(maker_tx.wit.vtxinwit) else None
            )
            taker_wit = (
                taker_tx.wit.vtxinwit[i] if i < len(taker_tx.wit.vtxinwit) else None
            )

            # Use whichever witness has actual data
            if maker_wit and len(maker_wit.scriptWitness.stack) > 0:
                combined_witnesses.append(maker_wit)
            elif taker_wit and len(taker_wit.scriptWitness.stack) > 0:
                combined_witnesses.append(taker_wit)
            else:
                # Neither has a witness — could be an error
                combined_witnesses.append(maker_wit or taker_wit)

        # Build the combined transaction
        combined_tx = CTransaction(
            vin=maker_tx.vin,
            vout=maker_tx.vout,
            nLockTime=maker_tx.nLockTime,
            nVersion=maker_tx.nVersion,
            witness=CTxWitness(combined_witnesses),
        )

        combined_hex = b2x(combined_tx.serialize())
        logger.info("Combined escrow TX: %s", b2lx(combined_tx.GetTxid()))
        return combined_hex

    @staticmethod
    def create_keyspend_payout_psbt(
        escrow_txid: str,
        escrow_vout: int,
        escrow_amount_sat: int,
        maker_payout_address: str,
        maker_payout_amount: int,
        taker_payout_address: str,
        taker_payout_amount: int,
        mining_fee_sat: int = 5000,
        network: str = "regtest",
    ) -> str:
        """
        Build the unsigned payout transaction that spends the escrow UTXO
        via the MuSig2 keypath.

        This TX has 1 input (the escrow UTXO) and 2 outputs (payouts to
        maker and taker, minus their share of fees).

        SECURITY: This PSBT is sent to both traders for partial signing.
        The Coordinator then aggregates the partial signatures into one
        Schnorr signature to finalize the spend.

        Ported from: assemble_keyspend_payout_psbt() in payout_tx.rs
        """
        SelectParams(network if network != "regtest" else "testnet")

        per_party_fee = mining_fee_sat // 2

        # Input: the escrow UTXO
        outpoint = COutPoint(lx(escrow_txid), escrow_vout)
        tx_in = CMutableTxIn(outpoint)

        # Outputs: payout to each party (handles P2TR bech32m addresses)
        maker_script = p2tr_scriptpubkey(maker_payout_address)
        taker_script = p2tr_scriptpubkey(taker_payout_address)

        tx_out_maker = CMutableTxOut(maker_payout_amount - per_party_fee, maker_script)
        tx_out_taker = CMutableTxOut(taker_payout_amount - per_party_fee, taker_script)

        tx = CMutableTransaction([tx_in], [tx_out_maker, tx_out_taker])
        tx_hex = b2x(tx.serialize())

        logger.info(
            "Built keyspend payout TX: escrow=%s:%d, "
            "maker_payout=%d, taker_payout=%d, fee=%d",
            escrow_txid,
            escrow_vout,
            maker_payout_amount - per_party_fee,
            taker_payout_amount - per_party_fee,
            mining_fee_sat,
        )
        return tx_hex

    @staticmethod
    def finalize_keyspend_payout(
        payout_psbt_hex: str,
        schnorr_signature: bytes,
    ) -> str:
        """
        Insert the aggregated Schnorr signature into the payout
        transaction to produce a fully-signed, broadcast-ready TX.

        The witness for a Taproot keypath spend is simply:
            [<schnorr_signature>]

        If the sighash type is DEFAULT (0x00), the signature is 64 bytes.
        If any other sighash type, it's 65 bytes (sig || sighash_type).

        SECURITY: This is the final step. The Coordinator inserts the
        aggregated signature and broadcasts. It cannot modify the TX
        content (inputs/outputs/amounts) without invalidating the sig.

        Ported from: broadcast_keyspend_tx() in payout_tx.rs
        """
        tx_bytes = x(payout_psbt_hex)
        tx = CTransaction.deserialize(tx_bytes)

        # For keypath spend, witness is just the signature
        # With SIGHASH_DEFAULT, signature is 64 bytes (no sighash byte appended)
        if len(schnorr_signature) == 64:
            witness_stack = [schnorr_signature]
        elif len(schnorr_signature) == 65:
            witness_stack = [schnorr_signature]
        else:
            raise ValueError(
                f"Invalid Schnorr signature length: {len(schnorr_signature)}, expected 64 or 65"
            )

        # Build witness
        from bitcoin.core.script import CScriptWitness
        from bitcoin.core import CTxInWitness

        witness = CTxInWitness(CScriptWitness(witness_stack))

        # The payout TX has only 1 input (the escrow UTXO)
        tx_witnesses = CTxWitness([witness])

        signed_tx = CTransaction(
            vin=tx.vin,
            vout=tx.vout,
            nLockTime=tx.nLockTime,
            nVersion=tx.nVersion,
            witness=tx_witnesses,
        )

        signed_hex = b2x(signed_tx.serialize())
        logger.info(
            "Finalized keyspend payout TX: %s (%d bytes)",
            b2lx(signed_tx.GetTxid()),
            len(signed_tx.serialize()),
        )
        return signed_hex

    @staticmethod
    def create_script_path_spend(
        escrow_builder: TaprootEscrowBuilder,
        leaf_name: str,
        escrow_txid: str,
        escrow_vout: int,
        escrow_amount_sat: int,
        winner_payout_address: str,
        winner_payout_amount: int,
        mining_fee_sat: int = 5000,
        network: str = "regtest",
    ) -> dict:
        """
        Build a script-path spend transaction for dispute resolution.

        Used when a dispute is resolved: the winning trader and the
        Coordinator cooperate to spend via one of the dispute leaves.

        SECURITY: This requires BOTH signatures — the Coordinator's AND
        the winning trader's. Neither can spend unilaterally.

        Args:
            escrow_builder:       The same builder used to create the escrow
            leaf_name:            "dispute_maker" or "dispute_taker"
            escrow_txid:          The escrow UTXO txid
            escrow_vout:          The escrow UTXO vout
            escrow_amount_sat:    Total locked amount
            winner_payout_address: Address to pay the dispute winner
            winner_payout_amount:  Amount to pay the winner
            mining_fee_sat:       Mining fee
            network:              Bitcoin network

        Returns:
            Dict with "tx_hex", "script", "control_block" for signing
        """
        SelectParams(network if network != "regtest" else "testnet")

        # Get the leaf script and control block
        scripts = escrow_builder._build_scripts()
        leaf_script = scripts[leaf_name]
        control_block = escrow_builder.get_control_block(leaf_name)

        # Build the spending TX
        outpoint = COutPoint(lx(escrow_txid), escrow_vout)
        tx_in = CMutableTxIn(outpoint)

        winner_script_pubkey = CBitcoinAddress(winner_payout_address).to_scriptPubKey()
        tx_out = CMutableTxOut(
            winner_payout_amount - mining_fee_sat, winner_script_pubkey
        )

        tx = CMutableTransaction([tx_in], [tx_out])
        tx_hex = b2x(tx.serialize())

        logger.info(
            "Built script-path spend TX for leaf '%s': payout=%d sat",
            leaf_name,
            winner_payout_amount - mining_fee_sat,
        )

        return {
            "tx_hex": tx_hex,
            "script": b2x(leaf_script),
            "control_block": b2x(control_block),
            "leaf_name": leaf_name,
        }


# ═══════════════════════════════════════════════════════════════════════
# BOND VALIDATOR
# ═══════════════════════════════════════════════════════════════════════


class BondValidator:
    """
    Validates submitted bond transactions.

    Bonds in the Taproot escrow model are fully-signed transactions that
    spend to a Coordinator-controlled address but are NEVER broadcast
    unless the trader misbehaves. They function as a fidelity guarantee.

    SECURITY MODEL:
        - Bonds are like "checks" the Coordinator holds but doesn't cash
          unless the trader cheats.
        - The Coordinator CANNOT create a bond TX — only the trader can
          sign their own UTXOs.
        - Bond validation ensures the TX is valid, properly signed, and
          locks the required amount.

    Ported from: validate_bond_tx_hex() in mod.rs
    """

    @staticmethod
    def validate_bond_tx(
        bond_tx_hex: str,
        required_amount_sat: int,
        coordinator_bond_address: str,
        network: str = "regtest",
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate a submitted bond transaction.

        Checks:
        1. The TX is a valid Bitcoin transaction
        2. It has at least one output paying to the coordinator's bond address
        3. The bonded amount meets the minimum requirement
        4. The TX is properly signed (has valid witnesses)

        Args:
            bond_tx_hex:              Fully-signed bond TX (hex)
            required_amount_sat:      Minimum bond amount in sats
            coordinator_bond_address: Expected bond recipient address
            network:                  Bitcoin network

        Returns:
            Tuple of (is_valid: bool, error_message: Optional[str])
        """
        SelectParams(network if network != "regtest" else "testnet")

        try:
            tx_bytes = x(bond_tx_hex)
            tx = CTransaction.deserialize(tx_bytes)
        except Exception as e:
            return False, f"Invalid transaction hex: {e}"

        # Check the TX has inputs
        if len(tx.vin) == 0:
            return False, "Bond TX has no inputs"

        # Check the TX has witnesses (is signed)
        has_witness = False
        if tx.wit and tx.wit.vtxinwit:
            for wit in tx.wit.vtxinwit:
                if wit and len(wit.scriptWitness.stack) > 0:
                    has_witness = True
                    break
        if not has_witness:
            return False, "Bond TX is not signed (no witness data)"

        # Find the output paying to the coordinator bond address
        expected_script = CBitcoinAddress(coordinator_bond_address).to_scriptPubKey()
        bond_output_sum = 0
        for vout in tx.vout:
            if vout.scriptPubKey == expected_script:
                bond_output_sum += vout.nValue

        if bond_output_sum == 0:
            return False, (
                f"Bond TX has no output paying to coordinator address "
                f"{coordinator_bond_address}"
            )

        if bond_output_sum < required_amount_sat:
            return False, (
                f"Bond amount {bond_output_sum} sat is less than required "
                f"{required_amount_sat} sat"
            )

        logger.info(
            "Bond TX validated: %s, amount=%d sat (required=%d)",
            b2lx(tx.GetTxid()),
            bond_output_sum,
            required_amount_sat,
        )
        return True, None
