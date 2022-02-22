from decouple import config
from secrets import token_urlsafe
from api.models import Order
from api.utils import get_tor_session

class Telegram():
    ''' Simple telegram messages by requesting to API'''

    session = get_tor_session()

    def get_context(user):
        """returns context needed to enable TG notifications"""
        context = {}
        if user.profile.telegram_enabled :
            context['tg_enabled'] = True
        else:
            context['tg_enabled'] = False
        
        if user.profile.telegram_token == None:
            user.profile.telegram_token = token_urlsafe(15)
            user.profile.save()

        context['tg_token'] = user.profile.telegram_token
        context['tg_bot_name'] = config("TELEGRAM_BOT_NAME")

        return context

    def send_message(self, user, text):
        """ sends a message to a user with telegram notifications enabled"""

        bot_token=config('TELEGRAM_TOKEN')

        chat_id = user.profile.telegram_chat_id
        message_url = f'https://api.telegram.org/bot{bot_token}/sendMessage?chat_id={chat_id}&text={text}'
        
        response = self.session.get(message_url).json()
        print(response)

        return

    def welcome(self, user):
        lang = user.profile.telegram_lang_code
        order = Order.objects.get(maker=user)
        print(str(order.id))
        if lang == 'es':
            text = f'Hola ⚡{user.username}⚡, Te enviaré un mensaje cuando tu orden con ID {str(order.id)} haya sido tomada.'
        else:
            text = f"Hey ⚡{user.username}⚡, I will send you a message when someone takes your order with ID {str(order.id)}."
        self.send_message(user=user, text=text)
        return


    def order_taken(self, order):
        user = order.maker
        if not user.profile.telegram_enabled:
            return

        lang = user.profile.telegram_lang_code
        taker_nick = order.taker.username
        site = config('HOST_NAME')
        if lang == 'es':
            text = f'Tu orden con ID {order.id} ha sido tomada por {taker_nick}!🥳   Visita http://{site}/order/{order.id} para continuar.'
        else:
            text = f'Your order with ID {order.id} was taken by {taker_nick}!🥳   Visit http://{site}/order/{order.id} to proceed with the trade.'
        
        self.send_message(user=user, text=text)
        return