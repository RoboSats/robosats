import time

from decouple import config
from django.core.management.base import BaseCommand
from django.db import transaction
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
        offset = 0
        while True:
            time.sleep(self.rest)
            params = {"offset": offset + 1, "timeout": 5}
            try:
                response = self.session.get(self.updates_url, params=params)
                if response.status_code != 200:
                    with open('error.log', 'a') as f:
                        f.write(f"Error getting updates, status code: {response.status_code}\n")
                    continue
                response = response.json()
                response = self.session.get(self.updates_url, params=params).json()
            except Exception as e:
                with open('error.log', 'a') as f:
                    f.write(f"Error getting updates: {e}\n{traceback.format_exc()}\n")
                continue

            if not response["result"]:
                continue
            for result in response["result"]:
                if not result.get("message") or not result.get("message").get("text"):
                    continue
                message = result["message"]["text"]
                if not message or not message.startswith("/start"):
                    continue
                parts = message.split(" ")
                if len(parts) < 2:
                    self.telegram.send_message(chat_id=result["message"]["from"]["id"],
                                                text="Invalid format. It should be: /start <token>")
                    self.telegram.send_message(chat_id=result["message"]["from"]["id"],
                                                text="Remember that you can find your token after activating Telegram notifications. It is in the Tor address after start=<OnlythisistheToken>")
                    continue
                token = parts[-1]
                profile = Profile.objects.filter(telegram_token=token).first()
                if not profile:
                    self.telegram.send_message(chat_id=result["message"]["from"]["id"],
                                                text=f"No profile with token {token}")
                    continue

                attempts = 5
                while attempts >= 0:
                    try:
                        with transaction.atomic():
                            profile.telegram_chat_id = result["message"]["from"]["id"]
                            profile.telegram_lang_code = result["message"]["from"]["language_code"]
                            self.telegram.welcome(profile.user)
                            profile.telegram_enabled = True
                            profile.save()
                    except Exception:
                        time.sleep(5)
                        attempts -= 1
            offset = response["result"][-1]["update_id"]
