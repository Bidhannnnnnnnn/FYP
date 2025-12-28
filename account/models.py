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

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="business")
    
    name = models.CharField(max_length=200)
    tc=models.BooleanField()
    is_active = models.BooleanField(default=True)
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
        # Simplest possible answer: Yes, always
        return True

    @property
    def is_staff(self):
        # Superadmins are always staff
        return self.is_admin or self.role == "superadmin"
    
    def has_perm(self, perm, obj=None):
        return self.is_admin or self.role == "superadmin"