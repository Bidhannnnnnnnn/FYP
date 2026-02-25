import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangoauthapi1.settings')
django.setup()

from account.models import User, Notification

def seed_notifications():
    users = User.objects.all()
    if not users:
        print("No users found to seed notifications for.")
        return

    admin = User.objects.filter(is_admin=True).first()
    
    for user in users:
        Notification.objects.create(
            recipient=user,
            actor=admin,
            notification_type='system',
            message=f"System Test: Your notification system is now active, {user.name}!",
            target_id="test"
        )
        print(f"Created notification for {user.email}")

if __name__ == "__main__":
    seed_notifications()
