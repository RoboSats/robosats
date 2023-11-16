import gnupg


def sign_message(message, private_key_path, passphrase_path):
    gpg = gnupg.GPG()

    with open(private_key_path, "r") as f:
        private_key = f.read()

    with open(passphrase_path, "r") as f:
        passphrase = f.read()

    gpg.import_keys(private_key, passphrase=passphrase)

    # keyid=import_result.fingerprints[0]
    signed_message = gpg.sign(
        message, passphrase=passphrase, extra_args=["--digest-algo", "SHA512"]
    )

    # [print(name, getattr(signed_message, name)) for name in dir(signed_message) if not callable(getattr(signed_message, name))]

    return signed_message.data.decode(encoding="UTF-8", errors="strict")
