from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Billboard(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='billboards')
    title = models.CharField(max_length=200)
    location = models.CharField(max_length=255)        
    size = models.CharField(max_length=64)              # e.g. "20x10"
    display_type = models.CharField(max_length=64, blank=True)  # LED, static
    base_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Base rate per day")
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    description = models.TextField(blank=True)
    visibility_score = models.PositiveSmallIntegerField(default=1)
    traffic_density = models.PositiveSmallIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} — {self.location} ({self.owner})"


class OwnerDocument(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    document_name = models.CharField(max_length=200)
    file = models.FileField(upload_to='owner_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_documents')

    def __str__(self):
        return f"{self.owner.email} - {self.document_name}"

