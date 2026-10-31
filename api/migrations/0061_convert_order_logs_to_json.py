import html
import json
import re

from django.db import migrations

LOG_ROW = re.compile(r"<tr><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td></tr>", re.S)


def plain_text(text):
    return html.unescape(re.sub(r"<[^>]+>", "", text))


def html_to_markdown(text):
    text = re.sub(r"</?b>", "**", text)
    text = re.sub(r"</?i>", "*", text)
    return plain_text(text)


def html_log_to_entries(raw):
    return [
        {
            "timestamp": plain_text(timestamp),
            "level": plain_text(level),
            "event": html_to_markdown(event),
        }
        for timestamp, level, event in LOG_ROW.findall(raw)
    ]


def convert_html_logs(apps, schema_editor):
    Order = apps.get_model("api", "Order")
    rows = Order.objects.exclude(logs__isnull=True).exclude(logs="")
    for pk, raw in rows.values_list("pk", "logs").iterator():
        try:
            json.loads(raw)
            continue
        except (ValueError, TypeError):
            pass
        entries = html_log_to_entries(raw)
        Order.objects.filter(pk=pk, logs=raw).update(logs=json.dumps(entries))


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0060_lnpayment_rewarded_at"),
    ]

    operations = [
        migrations.RunPython(convert_html_logs, migrations.RunPython.noop),
    ]
