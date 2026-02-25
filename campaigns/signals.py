from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Booking
from account.models import Notification

@receiver(post_save, sender=Booking)
def create_booking_notification(sender, instance, created, **kwargs):
    if created:
        # 1. Notify Billboard Owner about new booking
        Notification.objects.create(
            recipient=instance.billboard.owner,
            actor=instance.campaign.advertiser,
            notification_type='booking_request',
            message=f"New booking request for '{instance.billboard.title}' from {instance.campaign.advertiser.name}.",
            target_id=str(instance.id)
        )
    else:
        # 2. Notify Advertiser about status changes
        # Check if status has changed (simple check for now)
        Notification.objects.create(
            recipient=instance.campaign.advertiser,
            actor=instance.billboard.owner,
            notification_type='booking_update',
            message=f"Booking for '{instance.billboard.title}' status updated to {instance.get_booking_status_display()}.",
            target_id=str(instance.id)
        )
