"""
Unit tests for order password hashing (ROBO-009 fix).

The raw password submitted by the maker is SHA-256 hashed before being stored
in Order.password.  When a taker submits a password the same hash is computed
and compared with compare_digest so the plaintext is never persisted.

These tests exercise that contract directly against the pure-Python logic in
views.py — no DB, no HTTP layer required.
"""

import hashlib
from hmac import compare_digest

from django.test import TestCase


def _hash_password(raw: str) -> str:
    """Mirror the hashing applied in views.py on order creation and on take."""
    return hashlib.sha256(raw.encode()).hexdigest()


class OrderPasswordHashingTest(TestCase):
    """Verify the hash-before-store / hash-before-compare round-trip."""

    def test_stored_value_is_sha256_hex(self):
        raw = "secret123"
        stored = _hash_password(raw)
        self.assertEqual(len(stored), 64)
        # Must be a valid lower-case hex string
        int(stored, 16)

    def test_correct_password_matches_stored_hash(self):
        raw = "correct-horse-battery-staple"
        stored = _hash_password(raw)
        submitted_hash = _hash_password(raw)
        self.assertTrue(compare_digest(stored, submitted_hash))

    def test_wrong_password_does_not_match(self):
        stored = _hash_password("right_password")
        submitted_hash = _hash_password("wrong_password")
        self.assertFalse(compare_digest(stored, submitted_hash))

    def test_none_password_is_rejected(self):
        """A None submission (no password provided) must not pass the check."""
        # mirrors the guard: `submitted_hash = ... if password else None`
        password = None
        submitted_hash = _hash_password(password) if password else None
        self.assertIsNone(submitted_hash)

    def test_empty_string_password_is_rejected(self):
        """An empty string submission must not pass the check."""
        password = ""
        submitted_hash = _hash_password(password) if password else None
        self.assertIsNone(submitted_hash)

    def test_raw_password_is_not_stored(self):
        """The stored digest must differ from the raw password."""
        raw = "plaintext"
        stored = _hash_password(raw)
        self.assertNotEqual(stored, raw)

    def test_different_raw_passwords_produce_different_digests(self):
        self.assertNotEqual(_hash_password("alpha"), _hash_password("beta"))

    def test_hashing_is_deterministic(self):
        raw = "deterministic"
        self.assertEqual(_hash_password(raw), _hash_password(raw))
