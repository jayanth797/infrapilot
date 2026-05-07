from django.db import models


class Deployment(models.Model):

    STATUS_CHOICES = [
        ('SUCCESS', 'SUCCESS'),
        ('FAILED', 'FAILED'),
        ('RUNNING', 'RUNNING'),
    ]

    service = models.CharField(max_length=200)

    version = models.CharField(max_length=100)

    commit_hash = models.CharField(max_length=40, unique=True, null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='RUNNING'
    )

    logs = models.TextField()

    deployed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.service} - {self.version} ({self.status})"
