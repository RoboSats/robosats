#!/usr/bin/env python3
"""
RoboSats Order Creation PoC Script

Demonstrates programmatic order creation on a RoboSats coordinator
by generating robot credentials and submitting an order via the API.

Usage:
    python3 poc_order.py [--tor] [--url URL]

Author: Daksh Pathak
"""

import argparse
import json
import os
import secrets
import shutil
import sys
from dataclasses import dataclass
from typing import Tuple

import base91
import gnupg
import requests

# =============================================================================
# Configuration
# =============================================================================

DEFAULT_BASE_URL = "http://127.0.0.1:8000"
TOR_PROXY = "socks5h://127.0.0.1:9050"

# Base91 token constraints (from RoboSats middleware)
TOKEN_MIN_LENGTH = 39
TOKEN_MAX_LENGTH = 40
TOKEN_ENTROPY_BYTES = 32

# Valid Base91 character set
BASE91_CHARSET = (
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    '0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"'
)


# =============================================================================
# Data Classes
# =============================================================================


@dataclass
class RobotCredentials:
    """Robot identity credentials for RoboSats authentication."""

    token: str
    public_key: str
    encrypted_private_key: str
    nostr_pubkey: str


@dataclass
class OrderParams:
    """Parameters for creating a RoboSats order."""

    type: int  # 0=Buy, 1=Sell
    currency: int  # Currency ID (1=USD, 2=EUR, etc.)
    amount: float
    payment_method: str
    premium: float
    bond_size: float = 3.0
    escrow_duration: int = 3600


# =============================================================================
# Credential Generation
# =============================================================================


def generate_base91_token(max_attempts: int = 100) -> str:
    """
    Generate a cryptographically secure Base91 token.

    RoboSats requires tokens to be 39-40 characters of valid Base91.

    Returns:
        A valid Base91 token string.

    Raises:
        RuntimeError: If unable to generate a valid token.
    """

    def is_valid(token: str) -> bool:
        return TOKEN_MIN_LENGTH <= len(token) <= TOKEN_MAX_LENGTH and all(
            c in BASE91_CHARSET for c in token
        )

    for _ in range(max_attempts):
        token_bytes = secrets.token_bytes(TOKEN_ENTROPY_BYTES)
        token = base91.encode(token_bytes)
        if is_valid(token):
            return token

    raise RuntimeError(f"Failed to generate valid token after {max_attempts} attempts")


def generate_pgp_keypair(
    name: str = "RoboSats Robot",
    email: str = "robot@robosats.local",
    passphrase: str = "robosats",
) -> Tuple[str, str]:
    """
    Generate an ephemeral PGP key pair for robot authentication.

    Args:
        name: Identity name for the key.
        email: Identity email for the key.
        passphrase: Passphrase for key protection.

    Returns:
        Tuple of (public_key, encrypted_private_key) as ASCII-armored strings.
    """
    gpg_home = ".gpg_temp"
    os.makedirs(gpg_home, exist_ok=True)

    try:
        gpg = gnupg.GPG(gnupghome=gpg_home)

        key_input = gpg.gen_key_input(
            key_type="RSA",
            key_length=2048,
            name_real=name,
            name_email=email,
            passphrase=passphrase,
        )

        key = gpg.gen_key(key_input)
        if not key.fingerprint:
            raise RuntimeError("PGP key generation failed")

        public_key = gpg.export_keys(key.fingerprint)
        private_key = gpg.export_keys(key.fingerprint, True, passphrase=passphrase)

        return public_key, private_key
    finally:
        shutil.rmtree(gpg_home, ignore_errors=True)


def create_robot_credentials() -> RobotCredentials:
    """Create a complete set of robot credentials."""
    token = generate_base91_token()
    public_key, private_key = generate_pgp_keypair()
    nostr_pubkey = secrets.token_hex(32)

    return RobotCredentials(
        token=token,
        public_key=public_key,
        encrypted_private_key=private_key,
        nostr_pubkey=nostr_pubkey,
    )


# =============================================================================
# API Client
# =============================================================================


class RoboSatsClient:
    """Client for interacting with RoboSats coordinator API."""

    def __init__(self, base_url: str, use_tor: bool = False):
        self.base_url = base_url.rstrip("/")
        self.proxies = {"http": TOR_PROXY, "https": TOR_PROXY} if use_tor else None

    def _build_auth_header(self, credentials: RobotCredentials) -> str:
        """
        Build the Authorization header in RoboSats format.

        Format: Token <token> | Public <key> | Private <key> | Nostr <pubkey>
        Note: Newlines in PGP keys are escaped as backslashes.
        """

        def escape_key(key: str) -> str:
            return key.strip().replace("\n", "\\")

        return (
            f"Token {credentials.token} | "
            f"Public {escape_key(credentials.public_key)} | "
            f"Private {escape_key(credentials.encrypted_private_key)} | "
            f"Nostr {credentials.nostr_pubkey}"
        )

    def create_order(self, credentials: RobotCredentials, params: OrderParams) -> dict:
        """
        Create a new order on the RoboSats coordinator.

        Args:
            credentials: Robot authentication credentials.
            params: Order parameters.

        Returns:
            Order response data from the API.

        Raises:
            requests.HTTPError: If the API request fails.
        """
        url = f"{self.base_url}/api/make/"

        headers = {
            "Authorization": self._build_auth_header(credentials),
            "Content-Type": "application/json",
        }

        payload = {
            "type": params.type,
            "currency": params.currency,
            "amount": params.amount,
            "payment_method": params.payment_method,
            "premium": params.premium,
            "bond_size": params.bond_size,
            "escrow_duration": params.escrow_duration,
        }

        response = requests.post(
            url,
            json=payload,
            headers=headers,
            proxies=self.proxies,
            timeout=30,
        )
        response.raise_for_status()
        return response.json()


# =============================================================================
# Main Entry Point
# =============================================================================


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create a test order on RoboSats coordinator"
    )
    parser.add_argument(
        "--url",
        default=DEFAULT_BASE_URL,
        help=f"Coordinator URL (default: {DEFAULT_BASE_URL})",
    )
    parser.add_argument("--tor", action="store_true", help="Use Tor SOCKS5 proxy")
    args = parser.parse_args()

    print("=" * 60)
    print("RoboSats Order Creation PoC")
    print("=" * 60)

    # Generate credentials
    print("\n[1/3] Generating robot credentials...")
    try:
        credentials = create_robot_credentials()
        print(f"      Token: {credentials.token[:20]}...")
    except Exception as e:
        print(f"      ERROR: {e}", file=sys.stderr)
        return 1

    # Configure client
    print(f"\n[2/3] Connecting to {args.url}...")
    client = RoboSatsClient(args.url, use_tor=args.tor)

    # Create order
    print("\n[3/3] Creating order...")
    order_params = OrderParams(
        type=1,  # Sell
        currency=1,  # USD
        amount=20,
        payment_method="Revolut",
        premium=1.0,
    )

    try:
        result = client.create_order(credentials, order_params)
        print("\n" + "=" * 60)
        print("ORDER CREATED SUCCESSFULLY")
        print("=" * 60)
        print(json.dumps(result, indent=2))
        return 0
    except requests.HTTPError as e:
        print(f"\n      ERROR: API returned {e.response.status_code}", file=sys.stderr)
        print(f"      {e.response.text}", file=sys.stderr)
        return 1
    except requests.RequestException as e:
        print(f"\n      ERROR: Connection failed: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
