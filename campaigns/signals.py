from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Booking
from account.models import Notification, User
from account import email_service


@receiver(post_save, sender=Booking)
def create_booking_notification(sender, instance, created, **kwargs):
    if created:
        superadmins = list(User.objects.filter(role='superadmin'))

        # 1. In-app: notify billboard owner
        Notification.objects.create(
            recipient=instance.billboard.owner,
            actor=instance.campaign.advertiser,
            notification_type='booking_request',
            message=f"New booking request for '{instance.billboard.title}' from {instance.campaign.advertiser.name}.",
            target_id=str(instance.id)
        )

        # 2. In-app: notify superadmins
        for admin in superadmins:
            Notification.objects.create(
                recipient=admin,
                actor=instance.campaign.advertiser,
                notification_type='booking_request',
                message=f"New booking: '{instance.campaign.name}' on '{instance.billboard.title}' by {instance.campaign.advertiser.name}.",
                target_id=str(instance.id)
            )

        # Email notifications
        email_service.send_booking_request_to_owner(instance)
        email_service.send_booking_request_to_superadmins(instance, superadmins)

    else:
        # 3. In-app: notify advertiser about status change
        Notification.objects.create(
            recipient=instance.campaign.advertiser,
            actor=instance.billboard.owner,
            notification_type='booking_update',
            message=f"Booking for '{instance.billboard.title}' status updated to {instance.get_booking_status_display()}.",
            target_id=str(instance.id)
        )

        # Email: notify advertiser about status change
        email_service.send_booking_status_update(instance)
