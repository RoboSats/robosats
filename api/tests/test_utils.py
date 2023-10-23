from unittest.mock import MagicMock, Mock, mock_open, patch

import numpy as np
from django.test import TestCase

from api.models import Order
from api.utils import (
    base91_to_hex,
    bitcoind_rpc,
    compute_premium_percentile,
    get_cln_version,
    get_exchange_rates,
    get_lnd_version,
    get_robosats_commit,
    get_session,
    hex_to_base91,
    is_valid_token,
    objects_to_hyperlinks,
    validate_onchain_address,
    validate_pgp_keys,
    verify_signed_message,
    weighted_median,
)


class TestUtils(TestCase):
    @patch("api.utils.config")
    @patch("api.utils.requests.session")
    def test_get_session(self, mock_session, mock_config):
        mock_config.return_value = True
        session = get_session()
        self.assertEqual(session, mock_session.return_value)

    @patch("api.utils.config")
    @patch("api.utils.requests.post")
    def test_bitcoind_rpc(self, mock_post, mock_config):
        mock_config.side_effect = ["url", "user", "password"]
        mock_post.return_value.json.return_value = {"result": "response"}
        response = bitcoind_rpc("method", ["params"])
        self.assertEqual(response, "response")

    @patch("api.utils.bitcoind_rpc")
    def test_validate_onchain_address(self, mock_bitcoind_rpc):
        mock_bitcoind_rpc.return_value = {"isvalid": True}
        result, error = validate_onchain_address("address")
        self.assertTrue(result)
        self.assertIsNone(error)

    @patch("api.utils.config")
    @patch("api.utils.get_session")
    def test_get_exchange_rates(self, mock_get_session, mock_config):
        # Mock the config function to return the list of API URLs
        mock_config.return_value = [
            "https://api.yadio.io/exrates/BTC",
            "https://blockchain.info/ticker",
        ]

        # Mock the get_session function to return a mock session object
        mock_session = mock_get_session.return_value

        # Mock the get method of the session object to return a mock response
        mock_response_blockchain = Mock()
        mock_response_yadio = Mock()
        mock_session.get.side_effect = [mock_response_yadio, mock_response_blockchain]

        # Mock the json method of the response object to return a dictionary of exchange rates
        mock_response_blockchain.json.return_value = {
            "USD": {
                "15m": 10001,
                "last": 10001,
                "buy": 10001,
                "sell": 10001,
                "symbol": "USD",
            }
        }
        mock_response_yadio.json.return_value = {"BTC": {"USD": 10000}}

        # Call the get_exchange_rates function with a list of currencies
        currencies = ["USD"]
        rates = get_exchange_rates(currencies)

        # Assert that the function returns a list of exchange rates
        self.assertIsInstance(rates, list)
        self.assertEqual(len(rates), len(currencies))
        self.assertEqual(
            rates[0], np.median([10000, 10001])
        )  # Check if the median is correctly calculated

        # Assert that the get method of the session object was called with the correct arguments
        mock_session.get.assert_any_call("https://blockchain.info/ticker")
        mock_session.get.assert_any_call("https://api.yadio.io/exrates/BTC")

        # Assert that the json method of the response object was called
        mock_response_blockchain.json.assert_called_once()
        mock_response_yadio.json.assert_called_once()

    @patch("api.lightning.lnd.LNDNode.get_version")
    def test_get_lnd_version(self, mock_get_version):
        mock_get_version.return_value = "v0.17.0-beta"
        version = get_lnd_version()
        self.assertEqual(version, "v0.17.0-beta")

    @patch("api.lightning.cln.CLNNode.get_version")
    def test_get_cln_version(self, mock_get_version):
        mock_get_version.return_value = "v23.08.1"
        version = get_cln_version()
        self.assertEqual(version, "v23.08.1")

    @patch("builtins.open", new_callable=mock_open, read_data="test_commit_hash")
    def test_get_robosats_commit(self, mock_file):
        # Call the get_robosats_commit function
        commit_hash = get_robosats_commit()

        # Assert that the function returns a string
        self.assertIsInstance(commit_hash, str)

        # Assert that the open function was called with the correct arguments
        mock_file.assert_called_once_with("commit_sha")

        # Assert that the read method of the file object was called
        mock_file().read.assert_called_once()

    @patch("api.utils.Order.objects.filter")
    def test_compute_premium_percentile(self, mock_filter):
        # Mock the filter method to return a mock queryset
        mock_queryset = MagicMock()
        mock_filter.return_value = mock_queryset

        # Mock the exclude method of the queryset to return the same mock queryset
        mock_queryset.exclude.return_value = mock_queryset

        # Mock the count method of the queryset to return a specific number
        mock_queryset.count.return_value = 2

        # Mock the order object
        order = MagicMock()
        order.currency = "USD"
        order.status = Order.Status.PUB
        order.type = "type"
        order.id = 1
        order.amount = 1000
        order.has_range = False
        order.max_amount = 2000
        order.last_satoshis = 10000

        # Call the compute_premium_percentile function with the mock order object
        percentile = compute_premium_percentile(order)

        # Assert that the function returns a float
        self.assertIsInstance(percentile, float)

        # Assert that the filter method of the queryset was called with the correct arguments
        mock_filter.assert_called_once_with(
            currency=order.currency, status=Order.Status.PUB, type=order.type
        )

        # Assert that the exclude method of the queryset was called with the correct arguments
        mock_queryset.exclude.assert_called_once_with(id=order.id)

    def test_weighted_median(self):
        values = [1, 2, 3, 4, 5]
        weights = [1, 1, 1, 1, 1]
        median = weighted_median(values, sample_weight=weights)
        self.assertEqual(median, 3)

    def test_validate_pgp_keys(self):
        # Example test client generated GPG keys
        client_pub_key = r"-----BEGIN PGP PUBLIC KEY BLOCK-----\\xjMEZTWJ1xYJKwYBBAHaRw8BAQdAsfdKb90BurKniu+pBPBDHCkzg08S51W0\mUR0SKqLmdjNTFJvYm9TYXRzIElEIDU1MmRkMWE2NjFhN2FjYTRhNDFmODg5\MTBmZjM0YWMzYjFhYzgwYmI3Nzk0ZWQ5ZmQ1NWQ4Yjc2Yjk3YWFkOTfCjAQQ\FgoAPgWCZTWJ1wQLCQcICZA3N7au4gi/zgMVCAoEFgACAQIZAQKbAwIeARYh\BO5iBLnj0J/E6sntEDc3tq7iCL/OAADkVwEA/tBt9FPqrxLHOPFtyUypppr0\/t6vrl3RrLzCLqqE1nUA/0fmhir2F88KcsxmCJwADo/FglwXGFkjrV4sP6Fj\YBEBzjgEZTWJ1xIKKwYBBAGXVQEFAQEHQCyUIe3sQTaYa/IFNKGNmXz/+hrH\ukcot4TOvi2bD9p8AwEIB8J4BBgWCAAqBYJlNYnXCZA3N7au4gi/zgKbDBYh\BO5iBLnj0J/E6sntEDc3tq7iCL/OAACaFAD7BG3E7TkUoWKtJe5OPzTwX+bM\Xy7hbPSQw0zM9Re8KP0BAIeTG8d280dTK63h/seQAKeMj0zf7AYXr0CscvS7\f38D\=h03E\-----END PGP PUBLIC KEY BLOCK-----"
        client_enc_priv_key = r"-----BEGIN PGP PRIVATE KEY BLOCK-----\\xYYEZTWJ1xYJKwYBBAHaRw8BAQdAsfdKb90BurKniu+pBPBDHCkzg08S51W0\mUR0SKqLmdj+CQMICrS3TNCA/LHgxckC+iTUMxkqQJ9GpXWCDacx1rBQCztu\PDgUHNvWdcvW1wWVxU/aJaQLqBTtRVYkJTz332jrKvsSl/LnrfwmUfKgN4nG\Oc1MUm9ib1NhdHMgSUQgNTUyZGQxYTY2MWE3YWNhNGE0MWY4ODkxMGZmMzRh\YzNiMWFjODBiYjc3OTRlZDlmZDU1ZDhiNzZiOTdhYWQ5N8KMBBAWCgA+BYJl\NYnXBAsJBwgJkDc3tq7iCL/OAxUICgQWAAIBAhkBApsDAh4BFiEE7mIEuePQ\n8Tqye0QNze2ruIIv84AAORXAQD+0G30U+qvEsc48W3JTKmmmvT+3q+uXdGs\vMIuqoTWdQD/R+aGKvYXzwpyzGYInAAOj8WCXBcYWSOtXiw/oWNgEQHHiwRl\NYnXEgorBgEEAZdVAQUBAQdALJQh7exBNphr8gU0oY2ZfP/6Gse6Ryi3hM6+\LZsP2nwDAQgH/gkDCPPoYWyzm4mT4N/TDBF11GVq0xSEEcubFqjArFKyibRy\TDnB8+o8BlkRuGClcfRyKkR5/Rp1v5B0n1BuMsc8nY4Yg4BJv4KhsPfXRp4m\31zCeAQYFggAKgWCZTWJ1wmQNze2ruIIv84CmwwWIQTuYgS549CfxOrJ7RA3\N7au4gi/zgAAmhQA+wRtxO05FKFirSXuTj808F/mzF8u4Wz0kMNMzPUXvCj9\AQCHkxvHdvNHUyut4f7HkACnjI9M3+wGF69ArHL0u39/Aw==\=1hCT\-----END PGP PRIVATE KEY BLOCK-----"

        # Example valid formatted GPG keys
        with open("api/tests/test_pub_key", "r") as file:
            # Read the contents of the file
            pub_key = file.read()
        with open("api/tests/test_enc_priv_key", "r") as file:
            # Read the contents of the file
            enc_priv_key = file.read()

        # Test for success
        is_valid, error, returned_pub_key, returned_enc_priv_key = validate_pgp_keys(
            client_pub_key, client_enc_priv_key
        )
        self.assertTrue(is_valid)
        self.assertIsNone(error)
        self.assertEqual(returned_pub_key, pub_key)
        self.assertEqual(returned_enc_priv_key, enc_priv_key)

        # Test for failure
        is_valid, error, returned_pub_key, returned_enc_priv_key = validate_pgp_keys(
            client_pub_key[:50], client_enc_priv_key + "invalid"
        )
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
        self.assertIsNone(returned_pub_key)
        self.assertIsNone(returned_enc_priv_key)

    def test_verify_signed_message(self):
        # Call the verify_signed_message function with a mock public key and a mock signed message
        with open("api/tests/test_pub_key", "r") as file:
            # Read the contents of the file
            pub_key = file.read()
        with open("api/tests/test_signed_message", "r") as file:
            # Read the contents of the file
            signed_message = file.read()

        valid, message = verify_signed_message(pub_key, signed_message)

        # Assert that the function returns True and a string
        self.assertTrue(valid)
        self.assertIsInstance(message, str)

        unsigned_message = "This message is unsigned cleartext"
        valid, message = verify_signed_message(pub_key, unsigned_message)

        # Assert that the function returns False and None tuple of a boolean and a string
        self.assertFalse(valid)
        self.assertIsNone(message)

    def test_base91_to_hex(self):
        base91_str = "base91_string"
        with patch("api.utils.decode") as mock_decode:
            mock_decode.return_value = b"hex_string"
            hex_str = base91_to_hex(base91_str)
            self.assertEqual(hex_str, "6865785f737472696e67")  # 'hex_string' in hex

    def test_hex_to_base91(self):
        hex_str = "6865785f737472696e67"  # 'hex_string' in hex
        with patch("api.utils.encode") as mock_encode:
            mock_encode.return_value = "base91_string"
            base91_str = hex_to_base91(hex_str)
            self.assertEqual(base91_str, "base91_string")

    def test_is_valid_token(self):
        valid_token_1 = "Tl1S(#SvZ&I$sF9w=qQ|lG<8!JAqT8d}~jnVXX4E"
        valid_token_2 = '8Wo`Vy*<DiJ"kGO2v1xhJkVW]b{NPITio:s2<JkC'
        valid_token_3 = "c3g{U#M(.:OIEt)(hj6<Zk3/z`5MMMxu:v,V^R[C"

        self.assertTrue(is_valid_token(valid_token_1))
        self.assertTrue(is_valid_token(valid_token_2))
        self.assertTrue(is_valid_token(valid_token_3))

        invalid_token_1 = "Tl1S(#SvZ&I$sF9w=qQ|lG<8!JAqT8d}~jnVXX4EA"
        invalid_token_2 = "Tl1S(#SvZ&I$sF9w=qQ|lG<8!JAqT8d}~jnVXX"
        invalid_token_3 = "	,B,,NU|(_Ba"

        self.assertFalse(is_valid_token(invalid_token_1))
        self.assertFalse(is_valid_token(invalid_token_2))
        self.assertFalse(is_valid_token(invalid_token_3))

    def test_objects_to_hyperlinks(self):
        logs = "Robot(1, robot_name)"
        linked_logs = objects_to_hyperlinks(logs)
        self.assertEqual(
            linked_logs, '<b><a href="/coordinator/api/robot/1">robot_name</a></b>'
        )
