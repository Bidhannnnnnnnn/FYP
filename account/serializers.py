from rest_framework import serializers
from account.models import User, Notification
from account.utils import Util
from django.utils.encoding import smart_str, force_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.crypto import get_random_string


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
            user= User.objects.get(email = email)
            uid= urlsafe_base64_encode(force_bytes(user.id))
            print('Encoded UID', uid)
            token=PasswordResetTokenGenerator().make_token(user)
            print('Password Reset Token', token)
            link='http://localhost:5173/reset-password/'+uid+'/'+token
            print('Password reset link: ', link)
            
            #Send Email
            
            body = 'Click Following link to reset Your Password '+ link
            data={
                'subject': 'Reset Your Password',
                'body': body,
                'to_email': user.email,
            }
            Util.send_email(data)
            
            return attrs
                        
        else:
            raise serializers.ValidationError('You are not a registered User')
        
        
class UserPasswordResetSerializer(serializers.Serializer):
  password = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
  password2 = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
  class Meta:
    fields = ['password', 'password2']

  def validate(self, attrs):
    try:
      password = attrs.get('password')
      password2 = attrs.get('password2')
      uid = self.context.get('uid')
      token = self.context.get('token')
      if password != password2:
        raise serializers.ValidationError("Password and Confirm Password doesn't match")
      id = smart_str(urlsafe_base64_decode(uid))
      user = User.objects.get(id=id)
      if not PasswordResetTokenGenerator().check_token(user, token):
        raise serializers.ValidationError('Token is not Valid or Expired')
      user.set_password(password)
      user.is_active = True
      user.save()
      return attrs
    except DjangoUnicodeDecodeError as identifier:
      # PasswordResetTokenGenerator().check_token(user, token) # This line is redundant here
      raise serializers.ValidationError('Token is not Valid or Expired')


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

        # Generate Token for Password Set (Signup Verification)
        uid = urlsafe_base64_encode(force_bytes(user.id))
        token = PasswordResetTokenGenerator().make_token(user)
        # Use existing frontend reset-password route
        link = f'http://localhost:5173/reset-password/{uid}/{token}'
        
        # Send Email
        body = f'Hi {name},\n\nWelcome to Bimbasetu! Please click the following link to set your password and complete your registration:\n\n{link}'
        data = {
            'subject': 'Complete Your Bimbasetu Registration',
            'body': body,
            'to_email': user.email,
        }
        Util.send_email(data)

        return attrs