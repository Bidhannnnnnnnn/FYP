from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from billboards.models import Billboard

User = settings.AUTH_USER_MODEL

class Campaign(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
    )

    advertiser = models.ForeignKey(User, on_delete=models.CASCADE, related_name='campaigns')
    name = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    budget = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.advertiser.email}"

    class Meta:
        ordering = ['-created_at']


class Booking(models.Model):
    BOOKING_STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('changes_requested', 'Changes Requested'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
        ('active', 'Active'),
    )
    
    CREATIVE_STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('changes_requested', 'Changes Requested'),
        ('rejected', 'Rejected'),
    )

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='bookings')
    billboard = models.ForeignKey(Billboard, on_delete=models.CASCADE, related_name='bookings')
    
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Dynamic Pricing Factors
    slot_duration_seconds = models.IntegerField(
        default=10,
        validators=[MinValueValidator(5), MaxValueValidator(120)],
        help_text="Duration in seconds (5-120)"
    )
    frequency_per_hour = models.IntegerField(
        default=10, 
        validators=[MinValueValidator(1), MaxValueValidator(360)],
        help_text="Number of times ad is shown per hour"
    )
    
    price_calculated = models.DecimalField(max_digits=12, decimal_places=2, help_text="Auto-calculated price")
    
    # Ad Creative
    creative_file = models.FileField(upload_to='campaign_creatives/', null=True, blank=True)
    creative_status = models.CharField(max_length=20, choices=CREATIVE_STATUS_CHOICES, default='pending')
    
    # Booking Status
    booking_status = models.CharField(max_length=20, choices=BOOKING_STATUS_CHOICES, default='pending')
    owner_remarks = models.TextField(blank=True, help_text="Owner's feedback or rejection reason")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.campaign.name} - {self.billboard.title}"

    class Meta:
        ordering = ['-created_at']


class BookingSlot(models.Model):
    """
    Represents an individual hour booked within a Booking.
    Allows for granular availability checking and specific daily schedules.
    """
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='slots')
    date = models.DateField()
    hour = models.PositiveSmallIntegerField() # 0-23
    frequency_per_hour = models.IntegerField(
        default=10,
        validators=[MinValueValidator(1), MaxValueValidator(360)],
        help_text="Custom frequency for this specific hour"
    )
    
    def __str__(self):
        return f"{self.date} @ {self.hour}:00 for {self.booking}"

    class Meta:
        unique_together = ('booking', 'date', 'hour')
        ordering = ['date', 'hour']
 