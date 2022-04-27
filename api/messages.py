from decouple import config
from secrets import token_urlsafe
from api.models import Order
from api.utils import get_tor_session
import time

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
        
        # if it fails, it should keep trying
        while True:
            try:
                self.session.get(message_url).json()
                return
            except:
                pass

    def welcome(self, user):
        lang = user.profile.telegram_lang_code

        # In weird cases the order cannot be found (e.g. it is cancelled)
        queryset = Order.objects.filter(maker=user)
        order = queryset.last()

        print(str(order.id))
        if lang == 'es':
            text = f'Hola {user.username}, te enviaré un mensaje cuando tu orden con ID {str(order.id)} haya sido tomada.'
        else:
            text = f"Hey {user.username}, I will send you a message when someone takes your order with ID {str(order.id)}."
        self.send_message(user, text)
        user.profile.telegram_welcomed = True
        user.profile.save()
        return

    def order_taken(self, order):
        user = order.maker
        if not user.profile.telegram_enabled:
            return

        lang = user.profile.telegram_lang_code
        taker_nick = order.taker.username
        site = config('HOST_NAME')
        if lang == 'es':
            text = f'¡Tu orden con ID {order.id} ha sido tomada por {taker_nick}!🥳   Visita http://{site}/order/{order.id} para continuar.'
        else:
            text = f'Your order with ID {order.id} was taken by {taker_nick}!🥳   Visit http://{site}/order/{order.id} to proceed with the trade.'
        
        self.send_message(user, text)
        return
    
    def order_taken_confirmed(self, order):
        user = order.maker
        if not user.profile.telegram_enabled:
            return

        lang = user.profile.telegram_lang_code
        taker_nick = order.taker.username
        site = config('HOST_NAME')
        if lang == 'es':
            text = f'¡Tu orden con ID {order.id} ha sido tomada por {taker_nick}!🥳 El tomador ya ha bloqueado su fianza. Visita http://{site}/order/{order.id} para continuar.'
        else:
            text = f'Your order with ID {order.id} was taken by {taker_nick}!🥳 The taker bond has already been locked. Visit http://{site}/order/{order.id} to proceed with the trade.'
        
        self.send_message(user, text)
        return

    def order_expired_untaken(self, order):
        user = order.maker
        if not user.profile.telegram_enabled:
            return

        lang = user.profile.telegram_lang_code
        site = config('HOST_NAME')
        if lang == 'es':
            text = f'Tu orden con ID {order.id} ha expirado sin ser tomada por ningún robot. Visita http://{site}/order/{order.id} para renovarla.'
        else:
            text = f'Your order with ID {order.id} has expired without a taker. Visit http://{site}/order/{order.id} to renew it.'
        
        self.send_message(user, text)
        return

    def trade_successful(self, order):
        user = order.maker
        if not user.profile.telegram_enabled:
            return

        lang = user.profile.telegram_lang_code
        if lang == 'es':
            text = f'¡Tu orden con ID {order.id} ha finalizado exitosamente!⚡ Unase a @robosats_es y ayudanos a mejorar.'
        else:
            text = f'Your order with ID {order.id} has finished successfully!⚡ Join us @robosats and help us improve.'
        
        self.send_message(user, text)
        return

    def public_order_cancelled(self, order):
        user = order.maker
        if not user.profile.telegram_enabled:
            return

        lang = user.profile.telegram_lang_code
        if lang == 'es':
            text = f'Has cancelado tu orden pública con ID {order.id}.'
        else:
            text = f'You have cancelled your public order with ID {order.id}.'
        
        self.send_message(user, text)
        return

    def taker_canceled_b4bond(self, order):
        user = order.maker
        if not user.profile.telegram_enabled:
            return

        lang = user.profile.telegram_lang_code
        if lang == 'es':
            text = f'El tomador ha cancelado antes de bloquear su fianza.'
        else:
            text = f'The taker has canceled before locking the bond.'
        
        self.send_message(user, text)
        return

    def taker_expired_b4bond(self, order):
        user = order.maker
        if not user.profile.telegram_enabled:
            return

        lang = user.profile.telegram_lang_code
        if lang == 'es':
            text = f'El tomador no ha bloqueado la fianza a tiempo.'
        else:
            text = f'The taker has not locked the bond in time.'
        
        self.send_message(user, text)
        return

    def order_published(self, order):

        time.sleep(1) # Just so this message always arrives after the previous two

        user = order.maker
        lang = user.profile.telegram_lang_code

        # In weird cases the order cannot be found (e.g. it is cancelled)

        queryset = Order.objects.filter(maker=user)
        order = queryset.last()

        print(str(order.id))
        if lang == 'es':
            text = f'Tu orden con ID {str(order.id)} es pública en el libro de ordenes.'
        else:
            text = f"Your order with ID {str(order.id)} is public in the order book."
        self.send_message(user, text)
        user.profile.telegram_welcomed = True
        user.profile.save()
        return