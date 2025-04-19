import time
import traceback

from decouple import config
from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import Robot
from api.notifications import Notifications
from api.utils import get_session


class Command(BaseCommand):
    help = "Polls telegram /getUpdates method"
    rest = 3  # seconds between consecutive polls

    bot_token = config("TELEGRAM_TOKEN")
    updates_url = f"https://api.telegram.org/bot{bot_token}/getUpdates"
    session = get_session()
    notifications = Notifications()

    def handle(self, *args, **options):
        offset = 0
        while True:
            time.sleep(self.rest)
            params = {"offset": offset + 1, "timeout": 5}
            try:
                response = self.session.get(self.updates_url, params=params)
                if response.status_code != 200:
                    with open("error.log", "a") as f:
                        f.write(
                            f"Error getting updates, status code: {response.status_code}\n"
                        )
                    continue
                response = response.json()
                response = self.session.get(self.updates_url, params=params).json()
            except Exception as e:
                with open("error.log", "a") as f:
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
                    self.notifications.send_telegram_message(
                        result["message"]["from"]["id"],
                        'You must enable the notifications bot using the RoboSats client. Click on your "Robot robot" -> "Enable Telegram" and follow the link or scan the QR code.',
                    )
                    continue
                token = parts[-1]
                robot = Robot.objects.filter(telegram_token=token).first()
                if not robot:
                    self.notifications.send_telegram_message(
                        result["message"]["from"]["id"],
                        f'Wops, invalid token! There is no Robot with telegram chat token "{token}"',
                    )
                    continue

                attempts = 5
                while attempts >= 0:
                    try:
                        with transaction.atomic():
                            robot.telegram_chat_id = result["message"]["from"]["id"]
                            robot.telegram_lang_code = result["message"]["from"][
                                "language_code"
                            ]
                            self.notifications.welcome(robot.user)
                            robot.telegram_enabled = True
                            robot.save(
                                update_fields=[
                                    "telegram_lang_code",
                                    "telegram_chat_id",
                                    "telegram_enabled",
                                ]
                            )
                            break
                    except Exception:
                        time.sleep(5)
                        attempts -= 1
            offset = response["result"][-1]["update_id"]
