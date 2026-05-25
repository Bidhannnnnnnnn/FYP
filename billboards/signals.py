from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Billboard
from account.models import Notification, User
from account import email_service


@receiver(post_save, sender=Billboard)
def create_billboard_notification(sender, instance, created, **kwargs):
    if created:
        superadmins = list(User.objects.filter(role='superadmin'))

        # In-app notifications
        for admin in superadmins:
            Notification.objects.create(
                recipient=admin,
                actor=instance.owner,
                notification_type='billboard_update',
                message=f"New billboard submitted for review: '{instance.title}' by {instance.owner.name}.",
                target_id=str(instance.id)
            )

        # Email notifications
        email_service.send_billboard_submission_to_superadmins(instance, superadmins)

    else:
        # In-app: notify owner about status change
        Notification.objects.create(
            recipient=instance.owner,
            notification_type='billboard_update',
            message=f"Your billboard '{instance.title}' status has been updated to {instance.get_status_display()}.",
            target_id=str(instance.id)
        )

        # Email: notify owner about status change
        email_service.send_billboard_status_update_to_owner(instance)

        # If resubmitted, also notify superadmins
        if instance.status == 'pending':
            superadmins = list(User.objects.filter(role='superadmin'))
            for admin in superadmins:
                Notification.objects.create(
                    recipient=admin,
                    actor=instance.owner,
                    notification_type='billboard_update',
                    message=f"Billboard resubmitted for review: '{instance.title}' by {instance.owner.name}.",
                    target_id=str(instance.id)
                )
            email_service.send_billboard_resubmission_to_superadmins(instance, superadmins)
