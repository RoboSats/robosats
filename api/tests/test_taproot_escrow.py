"""
test_taproot_escrow.py — Unit tests for the Taproot/MAST escrow module.

Tests cover:
- Tagged hash computations (TapLeaf, TapBranch, TapTweak)
- MuSig2 key aggregation (deterministic, commutative)
- MuSig2 nonce aggregation (length validation, composition)
- Tapscript leaf construction (2-of-2, timelock variants)
- TaprootEscrowBuilder (MAST root, output key, descriptor, control blocks)
- EscrowPSBTBuilder (payout PSBT construction)
- BondValidator (valid/invalid bond TX detection)
- TaprootPayment model properties (is_fully_signed, has_both_nonces, etc.)
"""

import hashlib

from django.test import TestCase

from api.taproot_escrow import (
    tagged_hash,
    tapleaf_hash,
    tapbranch_hash,
    RESCUE_TIMELOCK_BLOCKS,
    PROTECTION_TIMELOCK_BLOCKS,
    MuSig2Coordinator,
    TaprootEscrowBuilder,
    EscrowPSBTBuilder,
    BondValidator,
    build_2of2_script,
    build_2of2_timelock_script,
    build_single_timelock_script,
)


# ── Deterministic test keys ─────────────────────────────────────────
# These are valid secp256k1 key pairs generated for testing purposes only.
# NEVER use these in production — private keys are exposed here.

# Test key 1 (Maker)
MAKER_PRIVKEY = bytes.fromhex(
    "0000000000000000000000000000000000000000000000000000000000000001"
)
MAKER_COMPRESSED_PUBKEY = (
    "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
)
MAKER_XONLY_PUBKEY = bytes.fromhex(
    "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
)

# Test key 2 (Taker)
TAKER_PRIVKEY = bytes.fromhex(
    "0000000000000000000000000000000000000000000000000000000000000002"
)
TAKER_COMPRESSED_PUBKEY = (
    "02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5"
)
TAKER_XONLY_PUBKEY = bytes.fromhex(
    "c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5"
)

# Test key 3 (Coordinator)
COORDINATOR_XONLY_PUBKEY = bytes.fromhex(
    "f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9"
)
COORDINATOR_COMPRESSED_PUBKEY = (
    "02f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9"
)


class TestTaggedHash(TestCase):
    """Test BIP-340 tagged hash implementation."""

    def test_tagged_hash_deterministic(self):
        """Same input always produces same output."""
        result1 = tagged_hash(b"TestTag", b"test message")
        result2 = tagged_hash(b"TestTag", b"test message")
        self.assertEqual(result1, result2)

    def test_tagged_hash_length(self):
        """Output is always 32 bytes (SHA256)."""
        result = tagged_hash(b"Tag", b"msg")
        self.assertEqual(len(result), 32)

    def test_tagged_hash_different_tags(self):
        """Different tags produce different hashes for same message."""
        h1 = tagged_hash(b"Tag1", b"msg")
        h2 = tagged_hash(b"Tag2", b"msg")
        self.assertNotEqual(h1, h2)

    def test_tagged_hash_different_messages(self):
        """Different messages produce different hashes for same tag."""
        h1 = tagged_hash(b"Tag", b"msg1")
        h2 = tagged_hash(b"Tag", b"msg2")
        self.assertNotEqual(h1, h2)

    def test_tagged_hash_known_vector(self):
        """Verify against manually computed tagged hash."""
        tag = b"BIP0340/challenge"
        tag_hash = hashlib.sha256(tag).digest()
        expected = hashlib.sha256(tag_hash + tag_hash + b"").digest()
        result = tagged_hash(tag, b"")
        self.assertEqual(result, expected)


class TestTapleafHash(TestCase):
    """Test TapLeaf hash computation (BIP-341)."""

    def test_tapleaf_deterministic(self):
        """Same script always produces same leaf hash."""
        script = b"\x20" + MAKER_XONLY_PUBKEY + b"\xac"  # <pk> OP_CHECKSIG
        h1 = tapleaf_hash(script)
        h2 = tapleaf_hash(script)
        self.assertEqual(h1, h2)

    def test_tapleaf_length(self):
        """Leaf hash is 32 bytes."""
        script = b"\xac"  # OP_CHECKSIG
        self.assertEqual(len(tapleaf_hash(script)), 32)

    def test_different_scripts_different_hashes(self):
        """Different scripts produce different leaf hashes."""
        script1 = b"\x20" + MAKER_XONLY_PUBKEY + b"\xac"
        script2 = b"\x20" + TAKER_XONLY_PUBKEY + b"\xac"
        self.assertNotEqual(tapleaf_hash(script1), tapleaf_hash(script2))


class TestTapbranchHash(TestCase):
    """Test TapBranch hash computation (BIP-341)."""

    def test_tapbranch_commutative(self):
        """Branch hash is order-independent (canonical sorting)."""
        a = b"\x01" * 32
        b_val = b"\x02" * 32
        self.assertEqual(tapbranch_hash(a, b_val), tapbranch_hash(b_val, a))

    def test_tapbranch_length(self):
        """Branch hash is 32 bytes."""
        self.assertEqual(len(tapbranch_hash(b"\x00" * 32, b"\x01" * 32)), 32)


class TestMuSig2Coordinator(TestCase):
    """Test MuSig2 key and nonce aggregation."""

    def test_aggregate_pubkeys_deterministic(self):
        """Same inputs always produce same aggregated key."""
        agg1 = MuSig2Coordinator.aggregate_pubkeys(
            MAKER_COMPRESSED_PUBKEY, TAKER_COMPRESSED_PUBKEY
        )
        agg2 = MuSig2Coordinator.aggregate_pubkeys(
            MAKER_COMPRESSED_PUBKEY, TAKER_COMPRESSED_PUBKEY
        )
        self.assertEqual(agg1, agg2)

    def test_aggregate_pubkeys_length(self):
        """Aggregated key is 32 bytes (x-only)."""
        agg = MuSig2Coordinator.aggregate_pubkeys(
            MAKER_COMPRESSED_PUBKEY, TAKER_COMPRESSED_PUBKEY
        )
        self.assertEqual(len(agg), 32)

    def test_aggregate_pubkeys_different_from_inputs(self):
        """Aggregated key differs from both input keys."""
        agg = MuSig2Coordinator.aggregate_pubkeys(
            MAKER_COMPRESSED_PUBKEY, TAKER_COMPRESSED_PUBKEY
        )
        self.assertNotEqual(agg, MAKER_XONLY_PUBKEY)
        self.assertNotEqual(agg, TAKER_XONLY_PUBKEY)

    def test_aggregate_nonces_valid(self):
        """Aggregating two 66-byte nonces produces a 66-byte result."""
        import secp256k1

        # Generate two random-ish public keys as nonce components
        pk1 = secp256k1.PublicKey(bytes.fromhex(MAKER_COMPRESSED_PUBKEY), raw=True)
        pk2 = secp256k1.PublicKey(bytes.fromhex(TAKER_COMPRESSED_PUBKEY), raw=True)

        # Each nonce = R1 (33 bytes) || R2 (33 bytes)
        nonce1 = pk1.serialize(compressed=True) + pk2.serialize(compressed=True)
        nonce2 = pk2.serialize(compressed=True) + pk1.serialize(compressed=True)

        agg = MuSig2Coordinator.aggregate_nonces(nonce1.hex(), nonce2.hex())
        self.assertEqual(len(agg), 66)

    def test_aggregate_nonces_invalid_length(self):
        """Nonces with wrong length raise ValueError."""
        with self.assertRaises(ValueError):
            MuSig2Coordinator.aggregate_nonces("aa" * 30, "bb" * 30)

    def test_aggregate_partial_sigs_deterministic(self):
        """Partial sig aggregation is deterministic."""
        # Two dummy 32-byte scalars
        s1 = "0000000000000000000000000000000000000000000000000000000000000001"
        s2 = "0000000000000000000000000000000000000000000000000000000000000002"

        import secp256k1

        pk1 = secp256k1.PublicKey(bytes.fromhex(MAKER_COMPRESSED_PUBKEY), raw=True)
        pk2 = secp256k1.PublicKey(bytes.fromhex(TAKER_COMPRESSED_PUBKEY), raw=True)
        agg_nonce = pk1.serialize(compressed=True) + pk2.serialize(compressed=True)

        sig1 = MuSig2Coordinator.aggregate_partial_signatures(
            s1, s2, agg_nonce, MAKER_XONLY_PUBKEY, b"\x00" * 32
        )
        sig2 = MuSig2Coordinator.aggregate_partial_signatures(
            s1, s2, agg_nonce, MAKER_XONLY_PUBKEY, b"\x00" * 32
        )
        self.assertEqual(sig1, sig2)
        self.assertEqual(len(sig1), 64)


class TestTapscriptLeaves(TestCase):
    """Test individual leaf script builders."""

    def test_2of2_script_length(self):
        """2-of-2 script has expected structure."""
        script = build_2of2_script(MAKER_XONLY_PUBKEY, COORDINATOR_XONLY_PUBKEY)
        self.assertIsInstance(bytes(script), bytes)
        self.assertGreater(len(script), 64)  # At least 2 keys

    def test_2of2_timelock_script_includes_csv(self):
        """Timelock script includes OP_CHECKSEQUENCEVERIFY."""
        script = build_2of2_timelock_script(
            MAKER_XONLY_PUBKEY, TAKER_XONLY_PUBKEY, RESCUE_TIMELOCK_BLOCKS
        )
        script_bytes = bytes(script)
        # OP_CHECKSEQUENCEVERIFY = 0xb2
        self.assertIn(b"\xb2", script_bytes)

    def test_single_timelock_script_includes_csv(self):
        """Protection script includes OP_CHECKSEQUENCEVERIFY."""
        script = build_single_timelock_script(
            MAKER_XONLY_PUBKEY, PROTECTION_TIMELOCK_BLOCKS
        )
        script_bytes = bytes(script)
        self.assertIn(b"\xb2", script_bytes)


class TestTaprootEscrowBuilder(TestCase):
    """Test the full Taproot escrow address/descriptor builder."""

    def setUp(self):
        self.builder = TaprootEscrowBuilder(
            maker_taproot_pk=MAKER_XONLY_PUBKEY,
            taker_taproot_pk=TAKER_XONLY_PUBKEY,
            coordinator_pk=COORDINATOR_XONLY_PUBKEY,
            maker_musig_pk=MAKER_COMPRESSED_PUBKEY,
            taker_musig_pk=TAKER_COMPRESSED_PUBKEY,
        )

    def test_internal_key_is_32_bytes(self):
        """Internal key (MuSig2 aggregate) is 32 bytes x-only."""
        self.assertEqual(len(self.builder.internal_key), 32)

    def test_mast_root_is_32_bytes(self):
        """MAST root hash is 32 bytes."""
        root = self.builder.build_taptree_root()
        self.assertEqual(len(root), 32)

    def test_mast_root_deterministic(self):
        """MAST root is deterministic for same keys."""
        root1 = self.builder.build_taptree_root()
        root2 = self.builder.build_taptree_root()
        self.assertEqual(root1, root2)

    def test_output_key_is_32_bytes(self):
        """Output key is 32 bytes."""
        output_key = self.builder.compute_output_key()
        self.assertEqual(len(output_key), 32)

    def test_output_key_differs_from_internal(self):
        """Output key differs from internal key (tweak applied)."""
        output_key = self.builder.compute_output_key()
        self.assertNotEqual(output_key, self.builder.internal_key)

    def test_descriptor_string_format(self):
        """Descriptor string has expected tr() format."""
        desc = self.builder.build_descriptor_string()
        self.assertTrue(desc.startswith("tr("))
        self.assertTrue(desc.endswith(")"))
        self.assertIn("and_v", desc)
        self.assertIn(str(PROTECTION_TIMELOCK_BLOCKS), desc)
        self.assertIn(str(RESCUE_TIMELOCK_BLOCKS), desc)

    def test_control_block_dispute_maker(self):
        """Control block for dispute_maker has correct length (1 + 32 + 64)."""
        cb = self.builder.get_control_block("dispute_maker")
        # 1 byte header + 32 byte internal key + 32*2 byte proof = 97 bytes
        self.assertEqual(len(cb), 97)

    def test_control_block_dispute_taker(self):
        """Control block for dispute_taker has correct length."""
        cb = self.builder.get_control_block("dispute_taker")
        self.assertEqual(len(cb), 97)

    def test_control_block_protection(self):
        """Control block for protection has correct length."""
        cb = self.builder.get_control_block("protection")
        self.assertEqual(len(cb), 97)

    def test_control_block_rescue(self):
        """Control block for rescue has correct length."""
        cb = self.builder.get_control_block("rescue")
        self.assertEqual(len(cb), 97)

    def test_control_block_invalid_leaf(self):
        """Invalid leaf name raises ValueError."""
        with self.assertRaises(ValueError):
            self.builder.get_control_block("nonexistent")

    def test_control_blocks_differ_per_leaf(self):
        """Each leaf's control block is unique."""
        cb_a = self.builder.get_control_block("dispute_maker")
        cb_b = self.builder.get_control_block("dispute_taker")
        cb_c = self.builder.get_control_block("protection")
        cb_d = self.builder.get_control_block("rescue")
        self.assertEqual(len({cb_a, cb_b, cb_c, cb_d}), 4)


class TestEscrowPSBTBuilder(TestCase):
    """Test PSBT construction helpers."""

    def test_keyspend_payout_psbt_generates_hex(self):
        """Payout PSBT returns a valid hex string."""
        # Use a dummy escrow txid (real format)
        dummy_txid = "a" * 64

        result = EscrowPSBTBuilder.create_keyspend_payout_psbt(
            escrow_txid=dummy_txid,
            escrow_vout=0,
            escrow_amount_sat=1_000_000,
            maker_payout_address="tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
            maker_payout_amount=500_000,
            taker_payout_address="tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
            taker_payout_amount=500_000,
            network="testnet",
        )
        self.assertIsInstance(result, str)
        # Should be valid hex
        bytes.fromhex(result)


class TestBondValidator(TestCase):
    """Test bond transaction validation."""

    def test_invalid_hex_rejected(self):
        """Garbage hex is rejected."""
        valid, error = BondValidator.validate_bond_tx(
            "not_valid_hex",
            required_amount_sat=10000,
            coordinator_bond_address="tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
        )
        self.assertFalse(valid)
        self.assertIn("Invalid", error)

    def test_empty_tx_rejected(self):
        """An empty string is rejected."""
        valid, error = BondValidator.validate_bond_tx(
            "",
            required_amount_sat=10000,
            coordinator_bond_address="tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
        )
        self.assertFalse(valid)


class TestTaprootPaymentModel(TestCase):
    """Test TaprootPayment model properties."""

    def test_is_fully_signed_false_when_missing(self):
        """is_fully_signed is False when PSBTs are missing."""
        from api.models import TaprootPayment

        tp = TaprootPayment(
            concept=TaprootPayment.Concepts.TRADE_ESCROW,
            status=TaprootPayment.Status.CREATED,
        )
        self.assertFalse(tp.is_fully_signed)

    def test_is_fully_signed_true_when_both_present(self):
        """is_fully_signed is True when both PSBTs are present."""
        from api.models import TaprootPayment

        tp = TaprootPayment(
            concept=TaprootPayment.Concepts.TRADE_ESCROW,
            status=TaprootPayment.Status.CREATED,
            maker_signed_escrow_psbt="aabb",
            taker_signed_escrow_psbt="ccdd",
        )
        self.assertTrue(tp.is_fully_signed)

    def test_has_both_nonces(self):
        """has_both_nonces is True only when both nonces are set."""
        from api.models import TaprootPayment

        tp = TaprootPayment(
            concept=TaprootPayment.Concepts.TRADE_ESCROW,
            status=TaprootPayment.Status.CREATED,
        )
        self.assertFalse(tp.has_both_nonces)

        tp.maker_musig_pubnonce = "aa" * 66
        self.assertFalse(tp.has_both_nonces)

        tp.taker_musig_pubnonce = "bb" * 66
        self.assertTrue(tp.has_both_nonces)

    def test_has_both_partial_sigs(self):
        """has_both_partial_sigs is True only when both sigs are set."""
        from api.models import TaprootPayment

        tp = TaprootPayment(
            concept=TaprootPayment.Concepts.TRADE_ESCROW,
            status=TaprootPayment.Status.CREATED,
        )
        self.assertFalse(tp.has_both_partial_sigs)

        tp.maker_partial_sig = "aa" * 32
        tp.taker_partial_sig = "bb" * 32
        self.assertTrue(tp.has_both_partial_sigs)


class TestOrderTaprootStatuses(TestCase):
    """Test that new TAP_* statuses are properly added to Order."""

    def test_tap_statuses_exist(self):
        """All TAP_* statuses have correct integer values."""
        from api.models import Order

        self.assertEqual(Order.Status.TAP_WFB, 19)
        self.assertEqual(Order.Status.TAP_PUB, 20)
        self.assertEqual(Order.Status.TAP_TAK, 21)
        self.assertEqual(Order.Status.TAP_WFE, 22)
        self.assertEqual(Order.Status.TAP_ESC, 23)
        self.assertEqual(Order.Status.TAP_FSE, 24)
        self.assertEqual(Order.Status.TAP_DIS, 25)
        self.assertEqual(Order.Status.TAP_PAY, 26)
        self.assertEqual(Order.Status.TAP_SUC, 27)
        self.assertEqual(Order.Status.TAP_FAI, 28)

    def test_tap_statuses_have_labels(self):
        """TAP_* statuses have human-readable labels."""
        from api.models import Order

        self.assertIn("taproot", Order.Status.TAP_WFB.label.lower())
        self.assertIn("taproot", Order.Status.TAP_SUC.label.lower())
