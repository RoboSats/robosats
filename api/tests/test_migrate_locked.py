from unittest.mock import MagicMock, patch

from django.core.management import call_command
from django.db import connection
from django.test import TestCase

from api.management.commands.migrate_locked import MIGRATE_LOCK_ID

COMMAND = "api.management.commands.migrate_locked"


def _lock_held():
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT count(*) FROM pg_locks WHERE locktype = 'advisory' "
            "AND classid = 0 AND objid = %s AND objsubid = 1 AND granted",
            [MIGRATE_LOCK_ID],
        )
        return cursor.fetchone()[0] == 1


class MigrateLockedTest(TestCase):
    def test_runs_migrate_holding_the_lock(self):
        held_during_migrate = []

        def migrate(*args, **kwargs):
            held_during_migrate.append(_lock_held())

        with patch(f"{COMMAND}.call_command", side_effect=migrate) as migrate_mock:
            call_command("migrate_locked")

        migrate_mock.assert_called_once_with("migrate", interactive=False)
        self.assertEqual(held_during_migrate, [True])
        self.assertFalse(_lock_held())

    def test_releases_the_lock_when_migrate_fails(self):
        with patch(f"{COMMAND}.call_command", side_effect=RuntimeError("boom")):
            with self.assertRaises(RuntimeError):
                call_command("migrate_locked")

        self.assertFalse(_lock_held())

    def test_other_databases_migrate_without_a_lock(self):
        fake_connection = MagicMock(vendor="sqlite")
        with (
            patch(f"{COMMAND}.connection", fake_connection),
            patch(f"{COMMAND}.call_command") as migrate_mock,
        ):
            call_command("migrate_locked")

        migrate_mock.assert_called_once_with("migrate", interactive=False)
        fake_connection.cursor.assert_not_called()
