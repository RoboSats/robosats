"""
Tests for GET /api/federation/ and the federation_hash field on GET /api/info/

Mirrors the pattern of api/tests/test_utils.py: plain Django TestCase,
all external calls (filesystem, cache, config) mocked via unittest.mock.
"""

import hashlib
import json
import os
import tempfile
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse

# Minimal valid federation document used across all tests.
_VALID_DOC = {
    "temple": {
        "shortAlias": "temple",
        "longAlias": "Temple of Sats",
        "nostrHexPubkey": "74001620297035daa61475c069f90b6950087fea0d0134b795fac758c34e7191",
        "established": "2023-12-02",
        "federated": True,
        "mainnetNodesPubkeys": [
            "0226f31c5f3a8b48bbbb7aaa97a10effcfb445b5972a676955d5c095383d35a428"
        ],
        "testnetNodesPubkeys": [
            "028e7a019180a664b84edf77ba656e96f2eb84f67f56d93020341caf4109e0dbc7"
        ],
        "mainnet": {
            "onion": "http://ngdk7ocdzmz5kzsysa3om6du7ycj2evxp2f2olfkyq37htx3gllwp2yd.onion",
            "clearnet": "https://unsafe.templeofsats.org",
            "i2p": "",
        },
        "testnet": {
            "onion": "http://jpp3w5tpxtyg6lifonisdszpriiapszzem4wod2zsdweyfenlsxeoxid.onion",
            "clearnet": "",
            "i2p": "",
        },
        "description": "A description.",
        "motto": "Privacy and Integrity.",
        "color": "#000",
        "policies": {"Rule 1": "Be nice."},
        "badges": {"isFounder": True, "donatesToDevFund": 30},
        "contact": {"email": "coord@example.org"},
    }
}

# Document with explicit null net attrs (mirrors real federation.json entries
# such as 'bazaar', 'freedomsats', 'alice').  The normalization layer MUST
# coerce these to "" so the hash matches what the frontend computes.
_NULL_ATTRS_DOC = {
    "bazaar": {
        "shortAlias": "bazaar",
        "nostrHexPubkey": "aabbcc",
        "established": "2024-01-01",
        "federated": True,
        "mainnetNodesPubkeys": [],
        "testnetNodesPubkeys": [],
        "mainnet": {
            "onion": "http://bazaar.onion",
            "clearnet": None,  # explicitly null
            "i2p": None,  # explicitly null
        },
        "testnet": {
            "onion": None,  # explicitly null
            "clearnet": None,
            "i2p": None,
        },
    }
}


def _canonical_hash(obj: dict) -> str:
    canonical = json.dumps(
        obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _normalize(doc: dict) -> dict:
    """Mirror of views._normalize_federation — keep in sync."""
    KEY_ATTRS = (
        "shortAlias",
        "nostrHexPubkey",
        "established",
        "federated",
        "mainnetNodesPubkeys",
        "testnetNodesPubkeys",
    )
    NET_ATTRS = ("onion", "clearnet", "i2p")
    out = {}
    for alias, entry in doc.items():
        n = {k: entry.get(k) for k in KEY_ATTRS}
        for net in ("mainnet", "testnet"):
            # null → "" (aligned with frontend's `netObj[k] ?? ''`)
            n[net] = {k: (entry.get(net) or {}).get(k) or "" for k in NET_ATTRS}
        out[alias] = n
    return out


# ---------------------------------------------------------------------------
# Golden cross-stack hash vector
# ---------------------------------------------------------------------------
# This constant is the SHA-256 of the canonical normalized form of the real
# shipped frontend/static/federation.json.  It is asserted in this test file
# AND in frontend/src/services/FederationDiscovery/__tests__/index.test.ts.
# If either side changes normalization the constant changes — update both.
#
# Recompute with:
#   python3 -c "
#   import json,hashlib
#   KEY=('shortAlias','nostrHexPubkey','established','federated',
#        'mainnetNodesPubkeys','testnetNodesPubkeys')
#   NET=('onion','clearnet','i2p')
#   doc=json.load(open('frontend/static/federation.json'))
#   def norm(d):
#       out={}
#       for a,e in d.items():
#           n={k:e.get(k) for k in KEY}
#           for net in ('mainnet','testnet'):
#               n[net]={k:(e.get(net) or {}).get(k) or '' for k in NET}
#           out[a]=n
#       return out
#   h=lambda o:hashlib.sha256(json.dumps(o,sort_keys=True,
#       separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
#   print(h(norm(doc)))
#   "
GOLDEN_SEED_HASH = "d1d5c8c215074b9d163a691082a5fa3f41f82f83bb72760ed7c028960c3caad3"


class FederationViewTest(TestCase):
    def _get(self):
        url = reverse("federation")
        return self.client.get(url)

    def setUp(self):
        # Patch the in-process cache so every test starts cold
        cache_patcher = patch("api.views.cache")
        self.mock_cache = cache_patcher.start()
        self.mock_cache.get.return_value = None
        self.addCleanup(cache_patcher.stop)

    # 1. Happy path: bundled file is returned as-is (no extra fields injected)
    @patch("api.views.config", return_value="")
    def test_returns_200_with_bundled_doc(self, _mock_cfg):
        resp = self._get()
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        # Response must be a plain federation document — no injected metadata fields.
        self.assertNotIn("coordinatorHash", data)
        self.assertNotIn("federation_hash", data)
        # Must contain at least one coordinator entry.
        self.assertTrue(len(data) > 0)

    # 2. Response is a valid federation document (federation_hash lives on /api/info/)
    @patch("api.views.config", return_value="")
    def test_response_is_valid_federation_doc(self, _mock_cfg):
        resp = self._get()
        data = resp.json()
        for alias, entry in data.items():
            self.assertIsInstance(entry, dict, f"Entry '{alias}' should be a dict")
            self.assertEqual(entry.get("shortAlias"), alias)
            onion = (entry.get("mainnet") or {}).get("onion", "")
            self.assertIn(
                ".onion", onion, f"Entry '{alias}' must have a mainnet onion address"
            )

    # 3. FEDERATION_JSON_PATH — valid custom file is served
    def test_custom_federation_json_path_served(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as tf:
            json.dump(_VALID_DOC, tf)
            tf_path = tf.name
        try:

            def cfg_side(key, **kwargs):
                return (
                    tf_path
                    if key == "FEDERATION_JSON_PATH"
                    else kwargs.get("default", "")
                )

            with patch("api.views.config", side_effect=cfg_side):
                resp = self._get()
            self.assertEqual(resp.status_code, 200)
            self.assertIn("temple", resp.json())
        finally:
            os.unlink(tf_path)

    # 4. Malformed custom file falls back to bundled copy
    def test_malformed_custom_file_falls_back_to_bundled(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as tf:
            tf.write("{invalid json")
            tf_path = tf.name
        try:

            def cfg_side(key, **kwargs):
                return (
                    tf_path
                    if key == "FEDERATION_JSON_PATH"
                    else kwargs.get("default", "")
                )

            with patch("api.views.config", side_effect=cfg_side):
                resp = self._get()
            self.assertEqual(resp.status_code, 200)
            # Fallback to bundled copy — response is a valid federation doc, no extra fields.
            self.assertNotIn("coordinatorHash", resp.json())
            self.assertTrue(len(resp.json()) > 0)
        finally:
            os.unlink(tf_path)

    # 5. Entry without a valid onion is rejected; bundled fallback served
    def test_entry_without_onion_rejected(self):
        bad_doc = {
            "badcoord": {
                "shortAlias": "badcoord",
                "mainnet": {"onion": "", "clearnet": "https://x.com", "i2p": ""},
                "testnet": {"onion": "", "clearnet": "", "i2p": ""},
            }
        }
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as tf:
            json.dump(bad_doc, tf)
            tf_path = tf.name
        try:

            def cfg_side(key, **kwargs):
                return (
                    tf_path
                    if key == "FEDERATION_JSON_PATH"
                    else kwargs.get("default", "")
                )

            with patch("api.views.config", side_effect=cfg_side):
                resp = self._get()
            self.assertEqual(resp.status_code, 200)
            self.assertNotIn("badcoord", resp.json())
        finally:
            os.unlink(tf_path)

    # 6. Cosmetic edits do NOT change the normalized hash (used by /api/info/ federation_hash)
    def test_cosmetic_edits_do_not_change_hash(self):
        import copy

        edited = copy.deepcopy(_VALID_DOC)
        edited["temple"]["motto"] = "Completely different motto!"
        edited["temple"]["description"] = "New description."
        edited["temple"]["color"] = "#ffffff"
        edited["temple"]["policies"] = {"Rule 99": "Changed."}
        edited["temple"]["badges"]["donatesToDevFund"] = 99
        edited["temple"]["contact"]["email"] = "other@example.org"
        self.assertEqual(
            _canonical_hash(_normalize(edited)),
            _canonical_hash(_normalize(_VALID_DOC)),
            "Cosmetic edits must not change the normalized hash",
        )

    # 7. Identity edits DO change the normalized hash
    def test_identity_edit_changes_hash(self):
        import copy

        base = _canonical_hash(_normalize(_VALID_DOC))
        edits = [
            (
                "mainnet.onion",
                lambda d: d["temple"]["mainnet"].__setitem__(
                    "onion", "http://evil.onion"
                ),
            ),
            (
                "nostrHexPubkey",
                lambda d: d["temple"].__setitem__("nostrHexPubkey", "deadbeef"),
            ),
            (
                "established",
                lambda d: d["temple"].__setitem__("established", "2026-01-01"),
            ),
            ("remove coord", lambda d: d.pop("temple")),
        ]
        for label, mutate in edits:
            edited = copy.deepcopy(_VALID_DOC)
            mutate(edited)
            self.assertNotEqual(
                _canonical_hash(_normalize(edited)),
                base,
                f"Identity edit '{label}' should change the hash",
            )

    # 8. Cache is populated on first call
    @patch("api.views.config", return_value="")
    def test_result_is_cached(self, _mock_cfg):
        self._get()
        self.mock_cache.set.assert_called_once()
        args = self.mock_cache.set.call_args[0]
        self.assertEqual(args[0], "federation_doc")
        self.assertEqual(args[2], 300)  # 5-minute TTL

    # 9. Cache hit skips filesystem read
    def test_cache_hit_skips_filesystem(self):
        self.mock_cache.get.return_value = _VALID_DOC  # warm cache
        with patch("builtins.open") as mock_open:
            resp = self._get()
            mock_open.assert_not_called()
        self.assertEqual(resp.status_code, 200)
        self.assertIn("temple", resp.json())

    # 10. null net attrs are coerced to "" so backend hash == frontend hash
    def test_null_net_attrs_normalized_to_empty_string(self):
        """
        Real federation.json entries (bazaar, freedomsats, alice) have explicit
        null values for clearnet/i2p/testnet.onion.  _normalize_federation must
        coerce those to "" so its SHA-256 matches what the frontend computes with
        the `?? ''` operator.
        """
        from api.views import _canonical_hash, _normalize_federation

        normalized = _normalize_federation(_NULL_ATTRS_DOC)
        bazaar_net = normalized["bazaar"]
        for net in ("mainnet", "testnet"):
            for attr in ("onion", "clearnet", "i2p"):
                val = bazaar_net[net][attr]
                self.assertIsInstance(
                    val,
                    str,
                    f"{net}.{attr} must be str after normalization, got {type(val)}",
                )
        h = _canonical_hash(normalized)
        self.assertEqual(len(h), 64)
        self.assertRegex(h, r"^[0-9a-f]{64}$")

    # 11. Golden cross-stack hash: bundled federation.json produces the expected hash
    @patch("api.views.config", return_value="")
    def test_golden_seed_hash_matches_bundled_federation(self, _mock_cfg):
        """
        GOLDEN_SEED_HASH is the single source of truth shared with the frontend
        test in frontend/src/services/FederationDiscovery/__tests__/index.test.ts.
        If normalization or federation.json content changes, update it in both files.
        """
        import json as _json
        from api.views import (
            _canonical_hash,
            _normalize_federation,
            _BUNDLED_FEDERATION_PATH,
        )

        with open(_BUNDLED_FEDERATION_PATH, "r", encoding="utf-8") as fh:
            doc = _json.load(fh)
        actual = _canonical_hash(_normalize_federation(doc))
        self.assertEqual(
            actual,
            GOLDEN_SEED_HASH,
            "Bundled federation.json hash changed — update GOLDEN_SEED_HASH in "
            "both api/tests/test_federation.py and "
            "frontend/src/services/FederationDiscovery/__tests__/index.test.ts",
        )

    # 12. /api/info/ exposes federation_hash as a 64-char hex string
    @patch("api.views.config", return_value="")
    def test_info_exposes_federation_hash(self, _mock_cfg):
        url = reverse("info")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn(
            "federation_hash",
            data,
            "/api/info/ must include federation_hash for client-side voting",
        )
        h = data["federation_hash"]
        self.assertIsInstance(h, str)
        self.assertRegex(
            h,
            r"^[0-9a-f]{64}$",
            "federation_hash must be a 64-char lowercase hex string",
        )

    # 13. Validator rejects shortAlias mismatch (aligned with frontend isValidDoc)
    def test_validator_rejects_shortalias_mismatch(self):
        bad_doc = {
            "temple": {
                "shortAlias": "differentalias",  # key != shortAlias value
                "mainnet": {
                    "onion": "http://ngdk7ocdzmz5kzsysa3om6du7ycj2evxp2f2olfkyq37htx3gllwp2yd.onion",
                    "clearnet": "",
                    "i2p": "",
                },
                "testnet": {"onion": "", "clearnet": "", "i2p": ""},
            }
        }
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as tf:
            import json as _json

            _json.dump(bad_doc, tf)
            tf_path = tf.name
        try:

            def cfg_side(key, **kwargs):
                return (
                    tf_path
                    if key == "FEDERATION_JSON_PATH"
                    else kwargs.get("default", "")
                )

            with patch("api.views.config", side_effect=cfg_side):
                resp = self._get()
            self.assertEqual(resp.status_code, 200)
            # Falls back to bundled — which has real aliases, not our bad one
            self.assertNotIn("differentalias", resp.json())
        finally:
            import os as _os

            _os.unlink(tf_path)

    # 14. Validator rejects alias not matching /^[a-z0-9]{1,20}$/ (aligned with frontend)
    def test_validator_rejects_invalid_alias_format(self):
        bad_doc = {
            "Temple-of-Sats": {  # uppercase + hyphens — invalid alias format
                "shortAlias": "Temple-of-Sats",
                "mainnet": {
                    "onion": "http://ngdk7ocdzmz5kzsysa3om6du7ycj2evxp2f2olfkyq37htx3gllwp2yd.onion",
                    "clearnet": "",
                    "i2p": "",
                },
                "testnet": {"onion": "", "clearnet": "", "i2p": ""},
            }
        }
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as tf:
            import json as _json

            _json.dump(bad_doc, tf)
            tf_path = tf.name
        try:

            def cfg_side(key, **kwargs):
                return (
                    tf_path
                    if key == "FEDERATION_JSON_PATH"
                    else kwargs.get("default", "")
                )

            with patch("api.views.config", side_effect=cfg_side):
                resp = self._get()
            self.assertEqual(resp.status_code, 200)
            self.assertNotIn("Temple-of-Sats", resp.json())
        finally:
            import os as _os

            _os.unlink(tf_path)
