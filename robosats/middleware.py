import hashlib
from datetime import timedelta

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser, User, update_last_login
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from rest_framework.authtoken.models import Token

from api.nick_generator.nick_generator import NickGenerator
from api.utils import base91_to_hex, hex_to_base91, is_valid_token, validate_pgp_keys

NickGen = NickGenerator(
    lang="English", use_adv=False, use_adj=True, use_noun=True, max_num=999
)


class DisableCSRFMiddleware(object):
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        setattr(request, "_dont_enforce_csrf_checks", True)
        response = self.get_response(request)
        return response


class SplitAuthorizationHeaderMiddleware(MiddlewareMixin):
    """
    This middleware splits the HTTP_AUTHORIZATION, leaves on it only the `Token ` and creates
    two new META headers for both PGP keys.
    Given that API calls to a RoboSats API might be made from other host origin,
    there is a high chance browsers will not attach cookies and other sensitive information.
    Therefore, we are using the `HTTP_AUTHORIZATION` header to also embed the needed robot
    pubKey and encPrivKey to create a new robot in the coordinator on the first request.
    """

    def process_request(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        split_auth = auth_header.split(" | ")

        if len(split_auth) == 3:
            request.META["HTTP_AUTHORIZATION"] = split_auth[0]
            request.META["PUBLIC_KEY"] = split_auth[1]
            request.META["ENCRYPTED_PRIVATE_KEY"] = split_auth[2]


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
            return JsonResponse(
                {
                    "bad_request": "Robot token SHA256 was provided in the header. However it is not a valid 39 or 40 characters Base91 string."
                },
                status=400,
            )

        # Check if it is an existing robot.
        try:
            token = Token.objects.get(key=token_sha256_b91)
            # Update last login every 2 minutes (avoid too many DB writes)
            try:
                if token.user.last_login < timezone.now() - timedelta(minutes=2):
                    update_last_login(None, token.user)

                    # START deprecate after v0.6.0
                    # Add the hash_id to robots created before hash_ids were introduced
                    if not token.user.robot.hash_id:
                        token_sha256 = base91_to_hex(token_sha256_b91)
                        hash = hashlib.sha256(token_sha256.encode("utf-8")).hexdigest()
                        token.user.robot.hash_id = hash
                        token.user.robot.save(update_fields=["hash_id"])
                    # END deprecate after v0.6.0

            except Exception:
                update_last_login(None, token.user)

        except Token.DoesNotExist:
            # If we get here the user does not have a robot on this coordinator
            # Let's create a new user & robot on-the-fly.

            # The first ever request to a coordinator must public key (and encrypted priv key as of now). Either on the
            # Authorization header or in the Cookies.
            public_key = ""
            encrypted_private_key = ""

            public_key = request.META.get("PUBLIC_KEY", "").replace("Public ", "")
            encrypted_private_key = request.META.get(
                "ENCRYPTED_PRIVATE_KEY", ""
            ).replace("Private ", "")

            # Some legacy (pre-federation) clients will still send keys as cookies
            if public_key == "" or encrypted_private_key == "":
                public_key = request.COOKIES.get("public_key")
                encrypted_private_key = request.COOKIES.get("encrypted_private_key", "")

            if not public_key or not encrypted_private_key:
                return JsonResponse(
                    {
                        "bad_request": "On the first request to a RoboSats coordinator, you must provide as well a valid public and encrypted private PGP keys"
                    },
                    status=400,
                )
            (
                valid,
                bad_keys_context,
                public_key,
                encrypted_private_key,
            ) = validate_pgp_keys(public_key, encrypted_private_key)
            if not valid:
                return JsonResponse({"bad_request": bad_keys_context}, status=400)

            # Hash the token_sha256, only 1 iteration.
            # This is the second SHA256 of the user token, aka RoboSats ID
            token_sha256 = base91_to_hex(token_sha256_b91)
            hash = hashlib.sha256(token_sha256.encode("utf-8")).hexdigest()

            # Generate nickname deterministically
            nickname = NickGen.short_from_SHA256(hash, max_length=18)[0]

            user = User.objects.create_user(username=nickname, password=None)

            # Store hash_id
            user.robot.hash_id = hash

            # Django rest_framework authtokens are limited to 40 characters.
            # We use base91 so we can store the full entropy in the field.
            Token.objects.create(key=token_sha256_b91, user=user)

            # Add PGP keys to the new user
            if not user.robot.public_key:
                user.robot.public_key = public_key
            if not user.robot.encrypted_private_key:
                user.robot.encrypted_private_key = encrypted_private_key

            update_last_login(None, user)
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
        except ValueError:
            token_key = None

        scope["user"] = (
            scope["user"] if token_key is None else await get_user(token_key)
        )
        return await super().__call__(scope, receive, send)


# This is a practical replacement to SplitAuthorizationHeaderMiddleware
# class HeadersRefactorMiddleware:
#     def __init__(self, get_response):
#         self.get_response = get_response

#     def __call__(self, request):
#         auth_header = request.META.get("HTTP_AUTHORIZATION", "")
#         auth_parts = auth_header.split(" | ")
#         if len(auth_parts) == 3:
#             request.META["HTTP_AUTHORIZATION"] = auth_parts[0]
#             request.META["Public_key"] = auth_parts[1]
#             request.META["Encrypted_private_key"] = auth_parts[2]

#             print("HEADERS HAVE BEEN REFACTORED!")

#         response = self.get_response(request)
#         return response
