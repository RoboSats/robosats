# We use custom seeded UUID generation during testing
import uuid

from decouple import config
from api.models import Order, Robot
from django.db import models
from django.utils import timezone

if config("TESTING", cast=bool, default=False):
    import random
    import string

    random.seed(1)
    chars = string.ascii_lowercase + string.digits

    def custom_uuid():
        return uuid.uuid5(uuid.NAMESPACE_DNS, "".join(random.choices(chars, k=20)))

else:
    custom_uuid = uuid.uuid4


class Notification(models.Model):
    # notification info
    created_at = models.DateTimeField(default=timezone.now)

    robot = models.ForeignKey(Robot, on_delete=models.CASCADE, default=None)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, default=None)

    # notification details
    title = models.CharField(max_length=240, null=False, default=None)
    description = models.CharField(max_length=240, default=None, blank=True)

    def __str__(self):
        return f"{self.title} {self.description}"
