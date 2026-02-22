"""
TaprootPayment model — tracks UTXO-based Taproot escrow state for onchain
P2P trades (Issue #230).

This model mirrors the existing LNPayment / OnchainPayment models but is
designed for the Taproot/MAST escrow pipeline where both traders lock funds
into a collaborative transaction that can only be spent by:

1. Happy Path  — 2-of-2 MuSig2 keyspend (Maker + Taker)
2. Dispute A   — Script path: Maker + Coordinator
3. Dispute B   — Script path: Taker + Coordinator
4. Rescue      — Script path: Maker + Taker after 2048 blocks
5. Protection  — Script path: Maker after 12228 blocks

SECURITY MODEL (Non-Custodial Guarantee):
    The Coordinator NEVER possesses the full private keys for the escrow.
    - In the happy path, only Maker and Taker produce partial MuSig2
      signatures; the Coordinator merely aggregates them.
    - In dispute paths, the Coordinator holds ONE key but needs the winning
      party's co-signature — it cannot unilaterally steal funds.
    - The protection/rescue timelocks ensure funds are always recoverable
      even if the Coordinator disappears.
"""

from django.conf import settings
from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.template.defaultfilters import truncatechars
from django.utils import timezone


class TaprootPayment(models.Model):
    """Tracks a single Taproot escrow UTXO through its lifecycle."""

    # ── Enums ──────────────────────────────────────────────────────────

    class Concepts(models.IntegerChoices):
        MAKER_BOND = 0, "Maker bond"
        TAKER_BOND = 1, "Taker bond"
        TRADE_ESCROW = 2, "Trade escrow"
        PAYOUT = 3, "Payout"

    class Status(models.IntegerChoices):
        CREATED = 0, "Created"  # Initial: waiting for inputs
        FUNDED = 1, "Funded"  # Bonds / escrow TX built (unsigned or partially signed)
        CONFIRMED = 2, "Confirmed"  # Escrow TX mined + N confirmations
        SPENT = 3, "Spent"  # Payout TX broadcast (happy or dispute)
        CANCELLED = 4, "Cancelled"  # Aborted before confirmation
        DISPUTED = 5, "Disputed"  # Dispute opened, awaiting coordinator resolution

    # ── Payment metadata ──────────────────────────────────────────────

    concept = models.PositiveSmallIntegerField(
        choices=Concepts.choices,
        null=False,
        default=Concepts.TRADE_ESCROW,
    )
    status = models.PositiveSmallIntegerField(
        choices=Status.choices,
        null=False,
        default=Status.CREATED,
    )

    # ── Descriptor & Transaction IDs ──────────────────────────────────

    escrow_output_descriptor = models.TextField(
        null=True,
        default=None,
        blank=True,
        help_text="Full Taproot output descriptor string, e.g. tr(musig_agg_pk,{{leaf_a,leaf_b},{leaf_c,leaf_d}})",
    )
    escrow_txid = models.CharField(
        max_length=64,
        unique=True,
        null=True,
        default=None,
        blank=True,
        help_text="Escrow locking transaction ID (hex)",
    )
    escrow_vout = models.PositiveSmallIntegerField(
        null=True,
        default=None,
        blank=True,
        help_text="Output index of the escrow UTXO in the locking TX",
    )
    escrow_amount_sat = models.PositiveBigIntegerField(
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(10 * settings.MAX_TRADE)],
        help_text="Total satoshis locked in the escrow output",
    )
    payout_txid = models.CharField(
        max_length=64,
        unique=True,
        null=True,
        default=None,
        blank=True,
        help_text="Payout transaction ID once the escrow is spent (hex)",
    )

    # ── Taproot Public Keys (x-only, 32-byte hex) ────────────────────
    # These are the keys used IN the Taproot descriptor / MAST leaves.
    # The Coordinator key is used only in dispute script leaves — never
    # for the keypath, preserving non-custodial guarantees.

    maker_taproot_pubkey = models.CharField(
        max_length=64,
        null=True,
        default=None,
        blank=True,
        help_text="Maker x-only Taproot pubkey (hex, 64 chars)",
    )
    taker_taproot_pubkey = models.CharField(
        max_length=64,
        null=True,
        default=None,
        blank=True,
        help_text="Taker x-only Taproot pubkey (hex, 64 chars)",
    )
    coordinator_taproot_pubkey = models.CharField(
        max_length=64,
        null=True,
        default=None,
        blank=True,
        help_text="Coordinator x-only Taproot pubkey (hex, 64 chars)",
    )

    # ── MuSig2 Session Data ──────────────────────────────────────────
    # These fields store the compressed MuSig2 public keys, nonces, and
    # partial signatures needed for the 2-of-2 keypath spend.
    #
    # SECURITY: The Coordinator stores ONLY the public nonces and partial
    # signatures. Secret nonces and private keys remain on the traders'
    # devices. The Coordinator aggregates partial sigs into a single
    # Schnorr signature but never possesses signing authority on its own.

    maker_musig_pubkey = models.CharField(
        max_length=66,
        null=True,
        default=None,
        blank=True,
        help_text="Maker compressed MuSig2 pubkey (hex, 66 chars)",
    )
    taker_musig_pubkey = models.CharField(
        max_length=66,
        null=True,
        default=None,
        blank=True,
        help_text="Taker compressed MuSig2 pubkey (hex, 66 chars)",
    )
    maker_musig_pubnonce = models.CharField(
        max_length=132,
        null=True,
        default=None,
        blank=True,
        help_text="Maker MuSig2 public nonce (hex, 132 chars)",
    )
    taker_musig_pubnonce = models.CharField(
        max_length=132,
        null=True,
        default=None,
        blank=True,
        help_text="Taker MuSig2 public nonce (hex, 132 chars)",
    )
    maker_partial_sig = models.CharField(
        max_length=64,
        null=True,
        default=None,
        blank=True,
        help_text="Maker partial MuSig2 signature for keyspend (hex)",
    )
    taker_partial_sig = models.CharField(
        max_length=64,
        null=True,
        default=None,
        blank=True,
        help_text="Taker partial MuSig2 signature for keyspend (hex)",
    )

    # ── Aggregated MuSig2 context (stored after key aggregation) ─────

    aggregated_musig_pubkey_ctx = models.TextField(
        null=True,
        default=None,
        blank=True,
        help_text="Serialized KeyAggContext (hex) for MuSig2 verification",
    )

    # ── PSBTs ─────────────────────────────────────────────────────────
    # PSBTs are exchanged between traders and coordinator to build the
    # escrow locking TX and the payout TX without any party ever seeing
    # the other's private keys.

    escrow_psbt_hex = models.TextField(
        null=True,
        default=None,
        blank=True,
        help_text="Unsigned escrow locking PSBT (hex)",
    )
    payout_psbt_hex = models.TextField(
        null=True,
        default=None,
        blank=True,
        help_text="Unsigned payout PSBT (hex)",
    )
    maker_signed_escrow_psbt = models.TextField(
        null=True,
        default=None,
        blank=True,
        help_text="Maker's partially-signed escrow PSBT (hex)",
    )
    taker_signed_escrow_psbt = models.TextField(
        null=True,
        default=None,
        blank=True,
        help_text="Taker's partially-signed escrow PSBT (hex)",
    )

    # ── Bond transactions ─────────────────────────────────────────────
    # Bonds are fully-signed TXs that spend to the coordinator but are
    # NEVER broadcast unless the trader misbehaves. The coordinator holds
    # them as a deterrent (same model as taptrade-core).

    bond_tx_hex_maker = models.TextField(
        null=True,
        default=None,
        blank=True,
        help_text="Maker's signed bond TX (held, not broadcast unless cheating)",
    )
    bond_tx_hex_taker = models.TextField(
        null=True,
        default=None,
        blank=True,
        help_text="Taker's signed bond TX (held, not broadcast unless cheating)",
    )

    # ── Amounts & Fees ────────────────────────────────────────────────

    bond_amount_sat = models.PositiveBigIntegerField(
        null=True,
        default=None,
        blank=True,
        help_text="Bond amount in satoshis",
    )
    coordinator_fee_sat = models.PositiveBigIntegerField(
        null=True,
        default=None,
        blank=True,
        help_text="Coordinator service fee in satoshis",
    )
    mining_fee_sat = models.PositiveBigIntegerField(
        default=0,
        null=False,
        blank=False,
        help_text="Estimated mining fee for the escrow TX in satoshis",
    )

    # ── Timestamps ────────────────────────────────────────────────────

    created_at = models.DateTimeField(default=timezone.now)
    confirmed_at = models.DateTimeField(
        null=True,
        default=None,
        blank=True,
        help_text="Timestamp when the escrow TX reached sufficient confirmations",
    )

    # ── Participants ──────────────────────────────────────────────────

    maker = models.ForeignKey(
        User,
        related_name="taproot_maker",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
    )
    taker = models.ForeignKey(
        User,
        related_name="taproot_taker",
        on_delete=models.SET_NULL,
        null=True,
        default=None,
    )

    # ── Dispute resolution ────────────────────────────────────────────

    dispute_winner = models.CharField(
        max_length=10,
        choices=[("maker", "Maker"), ("taker", "Taker")],
        null=True,
        default=None,
        blank=True,
        help_text="Set by coordinator after dispute resolution",
    )
    dispute_payout_psbt_hex = models.TextField(
        null=True,
        default=None,
        blank=True,
        help_text="Script-path spend PSBT for dispute payout (hex)",
    )

    # ── String representation ─────────────────────────────────────────

    def __str__(self):
        return (
            f"TaprootEscrow-{self.id}: "
            f"{self.Concepts(self.concept).label} - "
            f"{self.Status(self.status).label}"
        )

    class Meta:
        verbose_name = "Taproot payment"
        verbose_name_plural = "Taproot payments"

    @property
    def hash(self):
        """Truncated escrow txid for admin panel display."""
        return truncatechars(self.escrow_txid, 10)

    @property
    def is_fully_signed(self):
        """True when both traders have submitted signed escrow PSBTs."""
        return bool(self.maker_signed_escrow_psbt and self.taker_signed_escrow_psbt)

    @property
    def has_both_partial_sigs(self):
        """True when both partial MuSig2 signatures are available for aggregation."""
        return bool(self.maker_partial_sig and self.taker_partial_sig)

    @property
    def has_both_nonces(self):
        """True when both MuSig2 public nonces are available."""
        return bool(self.maker_musig_pubnonce and self.taker_musig_pubnonce)
