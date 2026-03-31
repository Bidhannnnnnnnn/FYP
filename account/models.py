from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser


#Custom User Manager
class UserManager(BaseUserManager):
    def create_user(self, email, name, tc, password=None,role="business"):
        """
        Creates and saves a User with the given email, name, tc and password.
        """
        if not email:
            raise ValueError("Users must have an email address")

        user = self.model(
            email=self.normalize_email(email),
            name=name,
            tc=tc,
            role=role,
        )

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, tc, password=None):
        """
        Creates and saves a superuser with the given email, name, tc and password.
        """
        user = self.create_user(
            email,
            password=password,
            name=name,
            tc=tc,
        )
        user.is_admin = True
        user.role = "superadmin"
        user.save(using=self._db)
        return user


#Custom user model
class User(AbstractBaseUser):
    email = models.EmailField(
        verbose_name="Email",
        max_length=255,
        unique=True,
    )
    
    ROLE_CHOICES = (
    ('superadmin', 'Super Admin'),
    ('admin', 'Admin'),
    ('business', 'Business Owner'),
    ('advertiser', 'Advertiser'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="advertiser")
    
    name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    company_name = models.CharField(max_length=200, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    tc=models.BooleanField()
    is_active = models.BooleanField(default=True)
    ban_reason = models.TextField(null=True, blank=True)
    unban_request_message = models.TextField(null=True, blank=True)
    is_admin = models.BooleanField(default=False)
    created_at= models.DateTimeField(auto_now_add=True)
    updated_at= models.DateTimeField(auto_now=True)
    

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name","tc"]

    def __str__(self):
        return self.email

    def has_module_perms(self, app_label):
        "Does the user have permissions to view the app `app_label`?"
        #Yes, always
        return True

    @property
    def is_staff(self):
        # Superadmins are always staff
        return self.is_admin or self.role == "superadmin"
    
    
    def has_perm(self, perm, obj=None):
        return self.is_admin or self.role == "superadmin"


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('booking_request', 'New Booking Request'),
        ('booking_update', 'Booking Status Update'),
        ('billboard_update', 'Billboard Status Update'),
        ('system', 'System Message'),
    )

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='triggered_notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    target_id = models.CharField(max_length=255, null=True, blank=True, help_text="ID of the related object (Booking, Billboard, etc.)")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type} for {self.recipient.email}"


class BanAppeal(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('rejected', 'Appeal Rejected'),
        ('approved', 'Appeal Approved - Unbanned'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ban_appeals')
    appeal_text = models.TextField(help_text="The user's appeal message")
    admin_response = models.TextField(blank=True, null=True, help_text="Message from the superadmin")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Appeal for {self.user.email} - {self.status}"