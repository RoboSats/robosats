# /api/migrations — schema history (agent reference)

**Two `0001` files coexist on purpose**: `0001_initial.py` (standalone, `initial = True`)
and `0001_squashed_0036_remove_order_maker_last_seen_and_more.py` (`replaces` every
migration `0001`–`0036`, and — unusually for a squash — also declares `initial = True`).
The originals are kept for deployments that already applied them individually; the squash
is what fresh deployments actually run. **Never delete either 0001 file, never regenerate
0001** — doing so breaks one class of deployment or the other.

Numbering continues linearly from `0037` onward after the squash range, with one
documented exception: two parallel branches both landed a `0058` migration, reconciled by
`0059_merge_0058_alter_order_logs_0058_lnpayment_concept_community_donation.py` — a plain
`Migration` with both `0058` files in its `dependencies` list and an empty `operations`
list. This is the **accepted pattern** for parallel-branch migration collisions: keep both
`0058` files, add a `0059` merge migration, never renumber either branch.

Roughly 1-in-6 files (9 of 59, excluding the merge) are trivial
`*_alter_currency_currency.py` choice-field churn from `currencies.json` updates — safe
to skip when scanning history for behavior changes.

Semantically interesting migrations: `0035_rename_profile_robot.py` (the Profile→Robot
model rename), `0047_notification.py` (Notification model added), `0051_takeorder.py`
(TakeOrder introduced), `0052_robot_nostr_pubkey_...py` (nostr pubkey field),
`0056_robot_webhook_fields.py`/`0057_robot_webhook_enabled_...py` (robot webhooks),
`0058_lnpayment_concept_community_donation.py` (adds `COMDONAT = 6` concept to
`LNPayment`, enabling per-payment tracking of community-split donations),
`0058_alter_order_logs.py` (backfill-only — the `Order.logs` model field already matched
the DB, this migration simply makes Django migrations aware of the `max_length=80_000`
constraint so future `makemigrations` runs stay clean).

The squash migration (only migration in this app with a cross-app dependency) depends on
`("control", "0002_auto_20220619_0535")` — `control`'s migrations must be applied
consistently with this app's.

## Constraints
Never delete or regenerate either `0001` file. Never renumber existing migrations. New
migrations always continue from the current highest number, never inserted mid-sequence.
