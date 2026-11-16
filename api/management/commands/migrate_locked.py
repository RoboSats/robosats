from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import connection

MIGRATE_LOCK_ID = 0x524F424F


class Command(BaseCommand):
    help = "Run migrate while holding a PostgreSQL advisory lock"

    def handle(self, *args, **options):
        if connection.vendor != "postgresql":
            call_command("migrate", interactive=False)
            return
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_lock(%s)", [MIGRATE_LOCK_ID])
            try:
                call_command("migrate", interactive=False)
            finally:
                cursor.execute("SELECT pg_advisory_unlock(%s)", [MIGRATE_LOCK_ID])
