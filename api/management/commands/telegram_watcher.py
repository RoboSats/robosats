from django.core.management.base import BaseCommand, CommandError

from api.models import Profile
from api.messages import Telegram
from api.utils import get_session
from decouple import config
import requests
import time


class Command(BaseCommand):

    help = "Polls telegram /getUpdates method"
    rest = 3  # seconds between consecutive polls

    bot_token = config("TELEGRAM_TOKEN")
    updates_url = f"https://api.telegram.org/bot{bot_token}/getUpdates"

    session = get_session()
    telegram = Telegram()

    def handle(self, *args, **options):
        """Infinite loop to check for telegram updates.
        If it finds a new user (/start), enables it's taker found
        notification and sends a 'Hey {username} {order_id}' message back"""

        offset = 0
        while True:
            time.sleep(self.rest)

            params = {"offset": offset + 1, "timeout": 5}
            response = self.session.get(self.updates_url, params=params).json()
            if len(list(response["result"])) == 0:
                continue
            for result in response["result"]:

                try:  # if there is no key message, skips this result.
                    text = result["message"]["text"]
                except:
                    continue

                splitted_text = text.split(" ")
                if splitted_text[0] == "/start":
                    token = splitted_text[-1]
                    try:
                        profile = Profile.objects.get(telegram_token=token)
                    except:
                        print(f"No profile with token {token}")
                        continue

                    attempts = 5
                    while attempts >= 0:
                        try:
                            profile.telegram_chat_id = result["message"]["from"]["id"]
                            profile.telegram_lang_code = result["message"]["from"][
                                "language_code"
                            ]
                            self.telegram.welcome(profile.user)
                            profile.telegram_enabled = True
                            profile.save()
                            break
                        except:
                            time.sleep(5)
                            attempts = attempts - 1

            offset = response["result"][-1]["update_id"]
