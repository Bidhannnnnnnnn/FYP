from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Billboard
from account.models import Notification, User

@receiver(post_save, sender=Billboard)
def create_billboard_notification(sender, instance, created, **kwargs):
    if created:
        # Notify all superadmins about new billboard submission
        for admin in User.objects.filter(role='superadmin'):
            Notification.objects.create(
                recipient=admin,
                actor=instance.owner,
                notification_type='billboard_update',
                message=f"New billboard submitted for review: '{instance.title}' by {instance.owner.name}.",
                target_id=str(instance.id)
            )
    else:
        # Notify Owner about billboard approval/rejection
        Notification.objects.create(
            recipient=instance.owner,
            notification_type='billboard_update',
            message=f"Your billboard '{instance.title}' status has been updated to {instance.get_status_display()}.",
            target_id=str(instance.id)
        )
        # Also notify superadmins about status changes (e.g. owner resubmits after rejection)
        if instance.status == 'pending':
            for admin in User.objects.filter(role='superadmin'):
                Notification.objects.create(
                    recipient=admin,
                    actor=instance.owner,
                    notification_type='billboard_update',
                    message=f"Billboard resubmitted for review: '{instance.title}' by {instance.owner.name}.",
                    target_id=str(instance.id)
                )
