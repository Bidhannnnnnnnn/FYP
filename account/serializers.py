from rest_framework import serializers
from account.models import User, Notification
from account.utils import Util
from django.utils.encoding import smart_str, force_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.crypto import get_random_string
from django.core.cache import cache
import random


class UserRegistrationSerializer(serializers.ModelSerializer):
    password2= serializers.CharField(style={'input_type': 'password'}, write_only=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=True)

    class Meta:
        model= User
        fields=['email', 'name', 'password','password2', 'tc', 'role']
        extra_kwargs={
            'password': {'write_only': True}
        }
        
    def validate(self, attrs):
        password =attrs.get('password')
        password2 =attrs.get('password2')
        
        if password != password2:
            raise serializers.ValidationError("Password and Confirm password doesn't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)
    
class UserLoginSerializer(serializers.ModelSerializer):
    email= serializers.EmailField(max_length=255)
    class Meta:
        model = User
        fields =['email', 'password']
        
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields=['id', 'email', 'name', 'role', 'phone_number', 'address', 'company_name', 'bio']
        extra_kwargs = {
            'email': {'read_only': True},
            'role': {'read_only': True}
        }
        
class UserChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
    password = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
    password2 = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
    
    class Meta:
        fields = ['old_password', 'password', 'password2']
        
    def validate(self, attrs):
        old_password= attrs.get('old_password')
        password= attrs.get('password')
        password2= attrs.get('password2')
        user= self.context.get('user')
        
        if not user.check_password(old_password):
            raise serializers.ValidationError("Old password is not correct.")
        
        if password != password2:
            raise serializers.ValidationError("Password and Confirm password doesn't match")
        
        user.set_password(password)
        user.save()
        
        return attrs

class SendPassowrdResetEmailSerializer(serializers.Serializer):
    email= serializers.EmailField(max_length=255)
    class Meta:
        fields=['email']
        
    def validate(self, attrs):
        email = attrs.get('email')
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            otp = str(random.randint(100000, 999999))
            
            # Save OTP to cache for 15 minutes (900 seconds)
            cache.set(f"password_reset_otp_{user.email}", otp, timeout=900)
            print('Password reset OTP generated: ', otp)
            
            # Send Email
            body = f'Your Bimbasetu Password Reset OTP is: {otp}\n\nThis verification code will expire securely in 15 minutes.'
            data = {
                'subject': 'Reset Your Password (OTP)',
                'body': body,
                'to_email': user.email,
            }
            Util.send_email(data)
            
            return attrs
                        
        else:
            raise serializers.ValidationError('You are not a registered User')
        
        
class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    otp = serializers.CharField(max_length=6)

    def validate(self, attrs):
        email = attrs.get('email')
        otp = attrs.get('otp')
        
        cached_otp = cache.get(f"password_reset_otp_{email}")
        
        if not cached_otp or str(cached_otp) != str(otp):
            raise serializers.ValidationError('OTP is Invalid or Expired')
            
        return attrs


class UserPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    otp = serializers.CharField(max_length=6)
    password = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
    password2 = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
    
    class Meta:
        fields = ['email', 'otp', 'password', 'password2']

    def validate(self, attrs):
        email = attrs.get('email')
        otp = attrs.get('otp')
        password = attrs.get('password')
        password2 = attrs.get('password2')
        
        if password != password2:
            raise serializers.ValidationError("Password and Confirm Password don't match")
            
        cached_otp = cache.get(f"password_reset_otp_{email}")
        
        if not cached_otp or str(cached_otp) != str(otp):
            raise serializers.ValidationError('OTP is Invalid or Expired')
            
        try:
            user = User.objects.get(email=email)
            user.set_password(password)
            user.is_active = True
            user.save()
            
            # Delete OTP from cache so it can't be reused
            cache.delete(f"password_reset_otp_{email}")
            
            return attrs
        except User.DoesNotExist:
            raise serializers.ValidationError('You are not a registered User')


class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'message', 'target_id', 'is_read', 'actor_name', 'created_at']

    def get_actor_name(self, obj):
        return obj.actor.name if obj.actor else "System"

class UserSignupInviteSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    name = serializers.CharField(max_length=255)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)

    class Meta:
        fields = ['email', 'name', 'role']

    def validate(self, attrs):
        email = attrs.get('email')
        name = attrs.get('name')
        role = attrs.get('role')

        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("Email already exists")

        # Create inactive user with random password
        user = User.objects.create_user(
            email=email,
            name=name,
            tc=True, # Implicitly agreed in multi-step flow
            role=role,
            password=get_random_string(16)
        )
        user.is_active = False
        user.save()

        # Generate OTP for Password Set (Signup Verification)
        otp = str(random.randint(100000, 999999))
        cache.set(f"password_reset_otp_{user.email}", otp, timeout=86400) # 24 hour expiry
        
        link = 'http://localhost:5173/reset-password'
        
        # Send Email
        body = f'Hi {name},\n\nWelcome to Bimbasetu!\nYour account has been pre-registered securely.\n\nPlease navigate to {link} and use the following verification OTP code to set up your password:\n\nOTP: {otp}\n\nThis verification code expires in 24 hours.'
        data = {
            'subject': 'Complete Your Bimbasetu Registration',
            'body': body,
            'to_email': user.email,
        }
        Util.send_email(data)

        return attrs