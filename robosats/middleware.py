import hashlib
from pathlib import Path

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.conf import settings
from django.contrib.auth.models import AnonymousUser, User, update_last_login
from django.db import IntegrityError
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import AuthenticationFailed
from robohash import Robohash

from api.nick_generator.nick_generator import NickGenerator
from api.utils import base91_to_hex, hex_to_base91, is_valid_token, validate_pgp_keys

NickGen = NickGenerator(
    lang="English", use_adv=False, use_adj=True, use_noun=True, max_num=999
)

avatar_path = Path(settings.AVATAR_ROOT)
avatar_path.mkdir(parents=True, exist_ok=True)


class DisableCSRFMiddleware(object):
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        setattr(request, "_dont_enforce_csrf_checks", True)
        response = self.get_response(request)
        return response


class RobotTokenSHA256AuthenticationMiddleWare:
    """
    Builds on django-rest-framework Token Authentication.

    The robot token SHA256 is taken from the header. The token SHA256 must
    be encoded as Base91 of 39 or 40 characters in length. This is the max length of
    django DRF token keys.

    If the token exists, the requests passes through. If the token is valid and new,
    a new user/robot is created (PGP keys are required in the request body).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        token_sha256_b91 = request.META.get("HTTP_AUTHORIZATION", "").replace(
            "Token ", ""
        )

        if not token_sha256_b91:
            # Unauthenticated request
            response = self.get_response(request)
            return response

        if not is_valid_token(token_sha256_b91):
            raise AuthenticationFailed(
                "Robot token SHA256 was provided in the header. However it is not a valid 39 or 40 characters Base91 string."
            )

        # Check if it is an existing robot.
        try:
            token = Token.objects.get(key=token_sha256_b91)
            update_last_login(None, token.user)

        except Token.DoesNotExist:
            # If we get here the user does not have a robot on this coordinator
            # Let's create a new user & robot on-the-fly.

            # The first ever request to a coordinator must include cookies for the public key (and encrypted priv key as of now).
            public_key = request.COOKIES.get("public_key")
            encrypted_private_key = request.COOKIES.get("encrypted_private_key", "")

            if not public_key or not encrypted_private_key:
                raise AuthenticationFailed(
                    "On the first request to a RoboSats coordinator, you must provide as well a valid public and encrypted private PGP keys"
                )

            (
                valid,
                bad_keys_context,
                public_key,
                encrypted_private_key,
            ) = validate_pgp_keys(public_key, encrypted_private_key)
            if not valid:
                raise AuthenticationFailed(bad_keys_context)

            # Hash the token_sha256, only 1 iteration.
            # This is the second SHA256 of the user token, aka RoboSats ID
            token_sha256 = base91_to_hex(token_sha256_b91)
            hash = hashlib.sha256(token_sha256.encode("utf-8")).hexdigest()

            # Generate nickname deterministically
            nickname = NickGen.short_from_SHA256(hash, max_length=18)[0]

            # DEPRECATE. Using Try and Except only as a temporary measure.
            # This will allow existing robots to be added upgraded with a token.key
            # After v0.5.0, only the following should remain
            # `user = User.objects.create_user(username=nickname, password=None)`
            try:
                user = User.objects.create_user(username=nickname, password=None)
            except IntegrityError:
                # UNIQUE constrain failed, user exist. Get it.
                user = User.objects.get(username=nickname)

            # Django rest_framework authtokens are limited to 40 characters.
            # We use base91 so we can store the full entropy in the field.
            Token.objects.create(key=token_sha256_b91, user=user)

            # Add PGP keys to the new user
            if not user.robot.public_key:
                user.robot.public_key = public_key
            if not user.robot.encrypted_private_key:
                user.robot.encrypted_private_key = encrypted_private_key

            # Generate avatar. Does not replace if existing.
            image_path = avatar_path.joinpath(nickname + ".webp")
            if not image_path.exists():

                rh = Robohash(hash)
                rh.assemble(roboset="set1", bgset="any")  # for backgrounds ON
                with open(image_path, "wb") as f:
                    rh.img.save(f, format="WEBP", quality=80)

                image_small_path = avatar_path.joinpath(nickname + ".small.webp")
                with open(image_small_path, "wb") as f:
                    resized_img = rh.img.resize((80, 80))
                    resized_img.save(f, format="WEBP", quality=80)

            user.robot.avatar = "static/assets/avatars/" + nickname + ".webp"
            user.save()

        response = self.get_response(request)
        return response


# Authenticate WebSockets connections using DRF tokens


@database_sync_to_async
def get_user(token_key):
    try:
        token = Token.objects.get(key=token_key)
        return token.user
    except Token.DoesNotExist:
        return AnonymousUser()


class TokenAuthMiddleware(BaseMiddleware):
    def __init__(self, inner):
        super().__init__(inner)

    async def __call__(self, scope, receive, send):
        try:
            token_key = (
                dict((x.split("=") for x in scope["query_string"].decode().split("&")))
            ).get("token_sha256_hex", None)
            token_key = hex_to_base91(token_key)
            print(token_key)
        except ValueError:
            token_key = None
        scope["user"] = (
            AnonymousUser() if token_key is None else await get_user(token_key)
        )
        return await super().__call__(scope, receive, send)
