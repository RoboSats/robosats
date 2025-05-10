from __future__ import absolute_import, unicode_literals

import os
from datetime import timedelta

from celery import Celery
from celery.schedules import crontab

# You can use rabbitmq instead here.
BASE_REDIS_URL = config("REDIS_URL", default="redis://localhost:6379")

# set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "robosats.settings")

app = Celery("robosats")

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

app.conf.broker_url = BASE_REDIS_URL

# this allows schedule items in the Django admin.
app.conf.beat_scheduler = "django_celery_beat.schedulers:DatabaseScheduler"


# Configure the periodic tasks
app.conf.beat_schedule = {
    "users-cleansing": {  # Cleans abandoned users at midnight
        "task": "users_cleansing",
        "schedule": crontab(hour=0, minute=0),
    },
    "chatrooms-cleansing": {  # Cleans 3+ days old encrypted messages and chatrooms at midnight
        "task": "chatrooms_cleansing",
        "schedule": crontab(hour=0, minute=0),
    },
    "lnpayments-cleansing": {  # Cleans 3+ days old unlocked hodl invoices
        "task": "payments_cleansing",
        "schedule": crontab(hour=0, minute=0),
    },
    "do-accounting": {  # Does accounting for the last day
        "task": "do_accounting",
        "schedule": crontab(hour=23, minute=59),
    },
    "cache-market-prices": {  # Cache market prices every minute
        "task": "cache_external_market_prices",
        "schedule": timedelta(seconds=60),
    },
    "compute-node-balance": {  # Logs LND channel and wallet balance
        "task": "compute_node_balance",
        "schedule": timedelta(minutes=60),
    },
}

app.conf.timezone = "UTC"
