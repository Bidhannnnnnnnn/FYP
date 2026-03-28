from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Billboard(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('hidden', 'Hidden'),
    )

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='billboards')
    title = models.CharField(max_length=200)
    location = models.CharField(max_length=255)
    image = models.ImageField(upload_to='billboards/', blank=True, null=True)
    size = models.CharField(max_length=64)              # e.g. "20x10"
    display_type = models.CharField(max_length=64, blank=True)  # LED, static
    base_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Base rate per day")
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    description = models.TextField(blank=True)
    visibility_score = models.PositiveSmallIntegerField(default=1)
    traffic_density = models.PositiveSmallIntegerField(default=1)

    # Dynamic Pricing Enhancements
    weekend_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=0.80, help_text="Multiplier for weekend pricing (default 0.80)")
    LOCATION_TIER_CHOICES = (
        ('standard', 'Standard (1.0x)'),
        ('prime', 'Prime (1.5x)'),
        ('ultra', 'Ultra-Prime (2.0x)'),
    )
    location_tier = models.CharField(max_length=20, choices=LOCATION_TIER_CHOICES, default='standard')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    feedback_message = models.TextField(blank=True, null=True, help_text="Message from Admin when requesting changes")
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

class BillboardDocument(models.Model):
    billboard = models.ForeignKey(Billboard, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='billboard_documents/')
    document_type = models.CharField(max_length=100, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Document for {self.billboard.title} ({self.id})"

class BillboardReview(models.Model):
    ACTION_CHOICES = (
        ('admin_review', 'Admin Review'),
        ('user_update', 'User Update'),
    )
    billboard = models.ForeignKey(Billboard, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES)
    status_result = models.CharField(max_length=20)
    feedback = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action_type} - {self.billboard.title} ({self.created_at})"
