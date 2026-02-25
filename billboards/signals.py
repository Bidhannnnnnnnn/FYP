from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Billboard
from account.models import Notification

@receiver(post_save, sender=Billboard)
def create_billboard_notification(sender, instance, created, **kwargs):
    if not created:
        # Notify Owner about billboard approval/rejection
        Notification.objects.create(
            recipient=instance.owner,
            notification_type='billboard_update',
            message=f"Your billboard '{instance.title}' status has been updated to {instance.get_status_display()}.",
            target_id=str(instance.id)
        )
