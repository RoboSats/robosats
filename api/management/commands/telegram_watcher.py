import time

from decouple import config
from django.core.management.base import BaseCommand
from api.messages import Telegram
from api.models import Profile
from api.utils import get_session
import traceback


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
            try:
                response = self.session.get(self.updates_url, params=params).json()
            except Exception as e:
                with open('error.log', 'a') as f:
                    f.write(f"Error getting updates: {e}\n{traceback.format_exc()}\n")
                continue

            params = {"offset": offset + 1, "timeout": 5}
            response = self.session.get(self.updates_url, params=params).json()
            if not response["result"]:
                continue
            for result in response["result"]:
                if not result.get("message")("text"):
                    continue
                if not result["message"].get("text") or not result["message"]["text"].startswith("/start"):
                    if result["message"]["text"] == "/start":
                        token = input("Please enter your token: ")
                        profile = Profile.objects.filter(telegram_token=token).first()
                        if not profile:
                            print(f"No profile with token {token}")
                            continue
                if len(result["message"]["text"].split(" ")) < 2:
                    print("Invalid format. It should be: /start <token>")
                    print("Remember that you can find your token after activate Telegram notifications. It is in the Tor address after start=<OnlythisistheToken>")
                    continue
                    token = result["message"]["text"].split(" ")[-1]
                    profile = Profile.objects.filter(telegram_token=token).first()
                    if not profile:
                        print(f"No profile with token {token}")
                        continue

                    attempts = 5
                    while attempts >= 0:
                        try:
                            profile.telegram_chat_id = result["message"]["from"]["id"]
                            profile.telegram_lang_code = result["message"]["from"]["language_code"]
                            self.telegram.welcome(profile.user)
                            profile.telegram_enabled = True
                            profile.save()
                            break
                        except Exception:
                            time.sleep(5)
                            attempts -= 1
            offset = response["result"][-1]["update_id"]
