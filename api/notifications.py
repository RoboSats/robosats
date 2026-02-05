import json
import logging
import uuid
from datetime import datetime, timezone
from secrets import token_urlsafe

from decouple import config
from api.models import (
    Order,
    Notification,
)
from api.utils import get_session
from api.tasks import nostr_send_notification_event

logger = logging.getLogger("api.notifications")


class Notifications:
    """Simple telegram messages using TG's API"""

    session = get_session()
    site = config("HOST_NAME")

    def get_context(user):
        """returns context needed to enable TG and webhook notifications"""
        context = {}
        if user.robot.telegram_enabled:
            context["tg_enabled"] = True
        else:
            context["tg_enabled"] = False

        if user.robot.telegram_token is None:
            user.robot.telegram_token = token_urlsafe()[:15]
            user.robot.save(update_fields=["telegram_token"])

        context["tg_token"] = user.robot.telegram_token
        context["tg_bot_name"] = config("TELEGRAM_BOT_NAME")

        context["webhook_enabled"] = user.robot.webhook_enabled
        context["webhook_url"] = user.robot.webhook_url or ""

        context["nostr_forward_enabled"] = user.robot.nostr_forward_enabled
        context["nostr_forward_relay"] = user.robot.nostr_forward_relay or ""
        context["nostr_forward_pubkey"] = user.robot.nostr_forward_pubkey or ""

        return context

    def send_message(
        self, order, robot, title, description="", event_type="notification"
    ):
        """Save a message for a user and sends it to Telegram, Nostr, and/or Webhook"""
        self.save_message(order, robot, title, description)
        if robot.nostr_pubkey:
            nostr_send_notification_event.delay(
                robot_id=robot.id, order_id=order.id, text=title
            )
        if robot.telegram_enabled:
            self.send_telegram_message(robot.telegram_chat_id, title, description)
        if robot.webhook_enabled:
            self.send_webhook_message(order, robot, title, description, event_type)

    def save_message(self, order, robot, title, description=""):
        """Save a message for a user"""
        Notification.objects.create(
            title=title, description=description, robot=robot, order=order
        )

    def send_telegram_message(self, chat_id, title, description=""):
        """sends a message to a user with telegram notifications enabled"""

        bot_token = config("TELEGRAM_TOKEN")
        text = f"{title} {description}"
        message_url = f"https://api.telegram.org/bot{bot_token}/sendMessage?chat_id={chat_id}&text={text}"
        # if it fails, it should keep trying
        while True:
            try:
                self.session.get(message_url).json()
                return
            except Exception:
                pass

    def send_webhook_message(
        self, order, robot, title, description="", event_type="notification"
    ):
        """Sends a webhook notification to the user's custom HTTP endpoint (Tor .onion only)"""
        from api.models import Robot

        webhook_url = robot.webhook_url
        if not Robot.is_valid_onion_url(webhook_url):
            logger.warning(
                f"Webhook URL rejected: not a .onion address for robot {robot.id}"
            )
            return
        payload = {
            "event_type": event_type,
            "event_id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "robot_hash_id": robot.hash_id,
            "order": {
                "id": order.id,
                "type": "BUY" if order.type == Order.Types.BUY else "SELL",
                "status": order.status,
            },
            "message": {
                "title": title,
                "description": description,
            },
            "metadata": {
                "coordinator": config("COORDINATOR_ALIAS", cast=str, default="Unknown"),
                "platform_version": config("VERSION", cast=str, default="Unknown"),
            },
        }

        headers = {
            "Content-Type": "application/json",
        }

        if robot.webhook_api_key:
            headers["X-API-Key"] = robot.webhook_api_key

        try:
            response = self.session.post(
                webhook_url,
                data=json.dumps(payload),
                headers=headers,
                timeout=60,
            )
            response.raise_for_status()
            logger.info(f"Webhook sent successfully to robot {robot.id}")
        except Exception as e:
            logger.error(f"Webhook failed for robot {robot.id}: {e}")

    def send_webhook_test(self, robot):
        """Sends a test webhook notification when webhook is first configured"""
        from api.models import Robot

        webhook_url = robot.webhook_url
        if not Robot.is_valid_onion_url(webhook_url):
            logger.warning(
                f"Webhook test rejected: not a .onion address for robot {robot.id}"
            )
            return False

        payload = {
            "event_type": "webhook_test",
            "event_id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "robot_hash_id": robot.hash_id,
            "message": {
                "title": f"🔔 Hey {robot.user.username}, your webhook is configured!",
                "description": "You will receive notifications about your RoboSats orders.",
            },
            "metadata": {
                "coordinator": config("COORDINATOR_ALIAS", cast=str, default="Unknown"),
                "platform_version": config("VERSION", cast=str, default="Unknown"),
            },
        }

        headers = {
            "Content-Type": "application/json",
        }

        if robot.webhook_api_key:
            headers["X-API-Key"] = robot.webhook_api_key

        try:
            response = self.session.post(
                webhook_url,
                data=json.dumps(payload),
                headers=headers,
                timeout=60,
            )
            response.raise_for_status()
            logger.info(f"Webhook test sent successfully to robot {robot.id}")
            return True
        except Exception as e:
            logger.error(f"Webhook test failed for robot {robot.id}: {e}")
            return False

    def send_nostr_forward_test(self, robot):
        """Sends a test nostr notification to user's main account via their .onion relay"""
        from api.models import Robot
        from api.tasks import nostr_send_forward_test

        relay_url = robot.nostr_forward_relay
        pubkey = robot.nostr_forward_pubkey

        if not relay_url or not pubkey:
            logger.warning(
                f"Nostr forward test rejected: missing relay or pubkey for robot {robot.id}"
            )
            return False

        if not Robot.is_valid_onion_url(relay_url):
            logger.warning(
                f"Nostr forward test rejected: not a .onion address for robot {robot.id}"
            )
            return False

        nostr_send_forward_test.delay(robot_id=robot.id)
        logger.info(f"Nostr forward test queued for robot {robot.id}")
        return True

    def welcome(self, user):
        """User enabled Telegram Notifications"""
        lang = user.robot.telegram_lang_code

        if lang == "es":
            title = f"🔔 Hola {user.username}, te enviaré notificaciones sobre tus órdenes en RoboSats."
        else:
            title = f"🔔 Hey {user.username}, I will send you notifications about your RoboSats orders."
        self.send_telegram_message(user.robot.telegram_chat_id, title)
        user.robot.telegram_welcomed = True
        user.robot.save(update_fields=["telegram_welcomed"])
        return

    def order_taken_confirmed(self, order):
        lang = order.maker.robot.telegram_lang_code
        if lang == "es":
            title = f"✅ Hey {order.maker.username} ¡Tu orden con ID {order.id} ha sido tomada por {order.taker.username}!🥳"
            description = f"Visita http://{self.site}/order/{order.id} para continuar."
        else:
            title = f"✅ Hey {order.maker.username}, your order was taken by {order.taker.username}!🥳"
            description = (
                f"Visit http://{self.site}/order/{order.id} to proceed with the trade."
            )
        self.send_message(order, order.maker.robot, title, description)

        lang = order.taker.robot.telegram_lang_code
        if lang == "es":
            title = f"✅ Hey {order.taker.username}, acabas de tomar la orden con ID {order.id}."
        else:
            title = f"✅ Hey {order.taker.username}, you just took the order with ID {order.id}."
        self.send_message(order, order.taker.robot, title)

        return

    def fiat_exchange_starts(self, order):
        for user in [order.maker, order.taker]:
            lang = user.robot.telegram_lang_code
            if lang == "es":
                title = f"✅ Hey {user.username}, el depósito de garantía y el recibo del comprador han sido recibidos. Es hora de enviar el dinero fiat."
                description = f"Visita http://{self.site}/order/{order.id} para hablar con tu contraparte."
            else:
                title = f"✅ Hey {user.username}, the escrow and invoice have been submitted. The fiat exchange starts now via the platform chat."
                description = f"Visit http://{self.site}/order/{order.id} to talk with your counterpart."
            self.send_message(order, user.robot, title, description)
        return

    def order_expired_untaken(self, order):
        lang = order.maker.robot.telegram_lang_code
        if lang == "es":
            title = f"😪 Hey {order.maker.username}, tu orden con ID {order.id} ha expirado sin ser tomada por ningún robot."
            description = f"Visita http://{self.site}/order/{order.id} para renovarla."
        else:
            title = f"😪 Hey {order.maker.username}, your order with ID {order.id} has expired without a taker."
            description = f"Visit http://{self.site}/order/{order.id} to renew it."
        self.send_message(order, order.maker.robot, title, description)
        return

    def trade_successful(self, order):
        for user in [order.maker, order.taker]:
            lang = user.robot.telegram_lang_code
            if lang == "es":
                title = f"🥳 ¡Tu orden con ID {order.id} ha finalizado exitosamente!"
                description = (
                    "⚡ Únete a nosotros en @robosats_es y ayúdanos a mejorar."
                )
            else:
                title = f"🥳 Your order with ID {order.id} has finished successfully!"
                description = "⚡ Join us @robosats and help us improve."
            self.send_message(order, user.robot, title, description)
        return

    def public_order_cancelled(self, order):
        lang = order.maker.robot.telegram_lang_code
        if lang == "es":
            title = f"❌ Hey {order.maker.username}, has cancelado tu orden pública con ID {order.id}."
        else:
            title = f"❌ Hey {order.maker.username}, you have cancelled your public order with ID {order.id}."
        self.send_message(order, order.maker.robot, title)
        return

    def collaborative_cancelled(self, order):
        for user in [order.maker, order.taker]:
            lang = user.robot.telegram_lang_code
            if lang == "es":
                title = f"❌ Hey {user.username}, tu orden con ID {str(order.id)} fue cancelada colaborativamente."
            else:
                title = f"❌ Hey {user.username}, your order with ID {str(order.id)} has been collaboratively cancelled."
            self.send_message(order, user.robot, title)
        return

    def dispute_opened(self, order):
        for user in [order.maker, order.taker]:
            lang = user.robot.telegram_lang_code
            if lang == "es":
                title = f"⚖️ Hey {user.username}, la orden con ID {str(order.id)} ha entrado en disputa."
            else:
                title = f"⚖️ Hey {user.username}, a dispute has been opened on your order with ID {str(order.id)}."
            self.send_message(order, user.robot, title)

        admin_chat_id = config("TELEGRAM_COORDINATOR_CHAT_ID")

        if len(admin_chat_id) == 0:
            return

        coordinator_text = (
            f"There is a new dispute opened for the order with ID {str(order.id)}."
        )
        coordinator_description = f"Visit http://{self.site}/coordinator/api/order/{str(order.id)}/change to proceed."
        self.send_telegram_message(
            admin_chat_id, coordinator_text, coordinator_description
        )

        return

    def order_published(self, order):
        lang = order.maker.robot.telegram_lang_code
        # In weird cases the order cannot be found (e.g. it is cancelled)
        queryset = Order.objects.filter(maker=order.maker)
        if len(queryset) == 0:
            return
        order = queryset.last()
        if lang == "es":
            title = f"✅ Hey {order.maker.username}, tu orden con ID {str(order.id)} es pública en el libro de ordenes."
        else:
            title = f"✅ Hey {order.maker.username}, your order with ID {str(order.id)} is public in the order book."
        self.send_message(order, order.maker.robot, title)
        return

    def new_chat_message(self, order, chat_message):
        """
        Sends a TG notification for a new in-app chat message if
        the last chat was at least CHAT_NOTIFICATION_TIMEGAP minutes ago.
        """
        from datetime import timedelta

        from django.utils import timezone

        from chat.models import Message

        TIMEGAP = config("CHAT_NOTIFICATION_TIMEGAP", cast=int, default=5)
        if chat_message.index > 1:
            previous_message = Message.objects.get(
                chatroom=chat_message.chatroom, index=(chat_message.index - 1)
            )
            notification_reason = f"(You receive this notification only because more than {TIMEGAP} minutes have passed since the last in-chat message)"
            if previous_message.created_at > timezone.now() - timedelta(
                minutes=TIMEGAP
            ):
                return
        else:
            notification_reason = f"(You receive this notification because this was the first in-chat message. You will only be notified again if there is a gap bigger than {TIMEGAP} minutes between messages)"

        user = chat_message.receiver
        title = f"💬 Hey {user.username}, a new chat message in-app was sent to you by {chat_message.sender.username} for order ID {str(order.id)}."
        self.send_message(order, user.robot, title, notification_reason)

        return

    def coordinator_cancelled(self, order):
        title = f"🛠️ Your order with ID {order.id} has been cancelled by the coordinator {config('COORDINATOR_ALIAS', cast=str, default='NoAlias')} for the upcoming maintenance stop."
        self.send_message(order, order.maker.robot, title)
        return

    def dispute_closed(self, order):
        lang = order.maker.robot.telegram_lang_code
        if order.status == Order.Status.MLD:
            # Maker lost dispute
            looser = order.maker
            winner = order.taker
        elif order.status == Order.Status.TLD:
            # Taker lost dispute
            looser = order.taker
            winner = order.maker

        lang = looser.robot.telegram_lang_code
        if lang == "es":
            title = f"⚖️ Hey {looser.username}, has perdido la disputa en la orden con ID {str(order.id)}."
        else:
            title = f"⚖️ Hey {looser.username}, you lost the dispute on your order with ID {str(order.id)}."
        self.send_message(order, looser.robot, title)

        lang = winner.robot.telegram_lang_code
        if lang == "es":
            title = f"⚖️ Hey {winner.username}, has ganado la disputa en la orden con ID {str(order.id)}."
        else:
            title = f"⚖️ Hey {winner.username}, you won the dispute on your order with ID {str(order.id)}."
        self.send_message(order, winner.robot, title)

        return

    def lightning_failed(self, order):
        lang = order.maker.robot.telegram_lang_code
        if order.type == Order.Types.BUY:
            buyer = order.maker
        else:
            buyer = order.taker

        if lang == "es":
            title = f"⚡❌ Hey {buyer.username}, el pago lightning en la order con ID {str(order.id)} ha fallado."
            description = "Intentalo de nuevo con una nueva factura o con otra wallet."
        else:
            title = f"⚡❌ Hey {buyer.username}, the lightning payment on your order with ID {str(order.id)} failed."
            description = "Try again with a new invoice or from another wallet."

        self.send_message(order, buyer.robot, title, description)
        return
