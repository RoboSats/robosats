from secrets import token_urlsafe

from decouple import config

from api.models import Order
from api.utils import get_session


class Telegram:
    """Simple telegram messages using TG's API"""

    session = get_session()
    site = config("HOST_NAME")

    def get_context(user):
        """returns context needed to enable TG notifications"""
        context = {}
        if user.robot.telegram_enabled:
            context["tg_enabled"] = True
        else:
            context["tg_enabled"] = False

        if user.robot.telegram_token is None:
            user.robot.telegram_token = token_urlsafe(15)
            user.robot.save(update_fields=["telegram_token"])

        context["tg_token"] = user.robot.telegram_token
        context["tg_bot_name"] = config("TELEGRAM_BOT_NAME")

        return context

    def send_message(self, chat_id, text):
        """sends a message to a user with telegram notifications enabled"""

        bot_token = config("TELEGRAM_TOKEN")

        message_url = f"https://api.telegram.org/bot{bot_token}/sendMessage?chat_id={chat_id}&text={text}"

        # if it fails, it should keep trying
        while True:
            try:
                self.session.get(message_url).json()
                return
            except Exception:
                pass

    def welcome(self, user):
        """User enabled Telegram Notifications"""
        lang = user.robot.telegram_lang_code

        if lang == "es":
            text = f"🔔 Hola {user.username}, te enviaré notificaciones sobre tus órdenes en RoboSats."
        else:
            text = f"🔔 Hey {user.username}, I will send you notifications about your RoboSats orders."
        self.send_message(user.robot.telegram_chat_id, text)
        user.robot.telegram_welcomed = True
        user.robot.save(update_fields=["telegram_welcomed"])
        return

    def order_taken_confirmed(self, order):
        if order.maker.robot.telegram_enabled:
            lang = order.maker.robot.telegram_lang_code
            if lang == "es":
                text = f"✅ Hey {order.maker.username} ¡Tu orden con ID {order.id} ha sido tomada por {order.taker.username}!🥳   Visita http://{self.site}/order/{order.id} para continuar."
            else:
                text = f"✅ Hey {order.maker.username}, your order was taken by {order.taker.username}!🥳   Visit http://{self.site}/order/{order.id} to proceed with the trade."
            self.send_message(order.maker.robot.telegram_chat_id, text)

        if order.taker.robot.telegram_enabled:
            lang = order.taker.robot.telegram_lang_code
            if lang == "es":
                text = f"✅ Hey {order.taker.username}, acabas de tomar la orden con ID {order.id}."
            else:
                text = f"✅ Hey {order.taker.username}, you just took the order with ID {order.id}."
            self.send_message(order.taker.robot.telegram_chat_id, text)

        return

    def fiat_exchange_starts(self, order):
        for user in [order.maker, order.taker]:
            if user.robot.telegram_enabled:
                lang = user.robot.telegram_lang_code
                if lang == "es":
                    text = f"✅ Hey {user.username}, el depósito de garantía y el recibo del comprador han sido recibidos. Es hora de enviar el dinero fiat. Visita http://{self.site}/order/{order.id} para hablar con tu contraparte."
                else:
                    text = f"✅ Hey {user.username}, the escrow and invoice have been submitted. The fiat exchange starts now via the platform chat. Visit http://{self.site}/order/{order.id} to talk with your counterpart."
                self.send_message(user.robot.telegram_chat_id, text)
        return

    def order_expired_untaken(self, order):
        if order.maker.robot.telegram_enabled:
            lang = order.maker.robot.telegram_lang_code
            if lang == "es":
                text = f"😪 Hey {order.maker.username}, tu orden con ID {order.id} ha expirado sin ser tomada por ningún robot. Visita http://{self.site}/order/{order.id} para renovarla."
            else:
                text = f"😪 Hey {order.maker.username}, your order with ID {order.id} has expired without a taker. Visit http://{self.site}/order/{order.id} to renew it."
            self.send_message(order.maker.robot.telegram_chat_id, text)
        return

    def trade_successful(self, order):
        for user in [order.maker, order.taker]:
            if user.robot.telegram_enabled:
                lang = user.robot.telegram_lang_code
                if lang == "es":
                    text = f"🥳 ¡Tu orden con ID {order.id} ha finalizado exitosamente!⚡ Únete a nosotros en @robosats_es y ayúdanos a mejorar."
                else:
                    text = f"🥳 Your order with ID {order.id} has finished successfully!⚡ Join us @robosats and help us improve."
                self.send_message(user.robot.telegram_chat_id, text)
        return

    def public_order_cancelled(self, order):
        if order.maker.robot.telegram_enabled:
            lang = order.maker.robot.telegram_lang_code
            if lang == "es":
                text = f"❌ Hey {order.maker.username}, has cancelado tu orden pública con ID {order.id}."
            else:
                text = f"❌ Hey {order.maker.username}, you have cancelled your public order with ID {order.id}."
            self.send_message(order.maker.robot.telegram_chat_id, text)
        return

    def collaborative_cancelled(self, order):
        for user in [order.maker, order.taker]:
            if user.robot.telegram_enabled:
                lang = user.robot.telegram_lang_code
                if lang == "es":
                    text = f"❌ Hey {user.username}, tu orden con ID {str(order.id)} fue cancelada colaborativamente."
                else:
                    text = f"❌ Hey {user.username}, your order with ID {str(order.id)} has been collaboratively cancelled."
                self.send_message(user.robot.telegram_chat_id, text)
        return

    def dispute_opened(self, order):
        for user in [order.maker, order.taker]:
            if user.robot.telegram_enabled:
                lang = user.robot.telegram_lang_code
                if lang == "es":
                    text = f"⚖️ Hey {user.username}, la orden con ID {str(order.id)} ha entrado en disputa."
                else:
                    text = f"⚖️ Hey {user.username}, a dispute has been opened on your order with ID {str(order.id)}."
                self.send_message(user.robot.telegram_chat_id, text)
        return

    def order_published(self, order):
        if order.maker.robot.telegram_enabled:
            lang = order.maker.robot.telegram_lang_code
            # In weird cases the order cannot be found (e.g. it is cancelled)
            queryset = Order.objects.filter(maker=order.maker)
            if len(queryset) == 0:
                return
            order = queryset.last()
            if lang == "es":
                text = f"✅ Hey {order.maker.username}, tu orden con ID {str(order.id)} es pública en el libro de ordenes."
            else:
                text = f"✅ Hey {order.maker.username}, your order with ID {str(order.id)} is public in the order book."
            self.send_message(order.maker.robot.telegram_chat_id, text)
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
        if user.robot.telegram_enabled:
            text = f"💬 Hey {user.username}, a new chat message in-app was sent to you by {chat_message.sender.username} for order ID {str(order.id)}. {notification_reason}"
            self.send_message(user.robot.telegram_chat_id, text)

        return
