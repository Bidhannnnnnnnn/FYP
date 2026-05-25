from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from account.permissions import *
from account.serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    UserChangePasswordSerializer, SendPassowrdResetEmailSerializer,
    VerifyOTPSerializer, UserPasswordResetSerializer, NotificationSerializer, UserSignupInviteSerializer,
    BanAppealSerializer
)
from django.contrib.auth import authenticate
from account.renderers import UserRenderer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
import requests
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
from account.models import User, Notification, BanAppeal
from account import email_service

User = get_user_model()


#Generate token Manually
def get_tokens_for_user(user):

    refresh = RefreshToken.for_user(user)

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
    

class UserRegistrationView(APIView):
    renderer_classes = [UserRenderer]
    def post(self, request, format=None):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            user = serializer.save()
            token= get_tokens_for_user(user)
            return Response({'token':token,'msg':'Registration Sucessful'}, status= status.HTTP_201_CREATED)
        return Response(serializer.errors, status.HTTP_400_BAD_REQUEST)
    
class UserLoginView(APIView):
    renderer_classes = [UserRenderer]
    def post(self, request, format=None):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            email = serializer.data.get('email')
            password = serializer.data.get('password')
            
            # Manually check credentials to allow inactive (banned) users to login
            user = User.objects.filter(email=email).first()
            if user is not None and user.check_password(password):
                token= get_tokens_for_user(user)
                return Response({
                    'token': token,
                    'msg': 'Login Success',
                    'role': user.role,
                    'name': user.name,
                    'is_active': user.is_active,
                    'ban_reason': user.ban_reason
                }, status=status.HTTP_200_OK)
            else:
                return Response({'errors':{'non_field_errors':['Email or password is not valid']}}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserProfileView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, format=None):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserChangePasswordView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]
    def post(self, request, format=None):
        serializer= UserChangePasswordSerializer(data=request.data, context={'user':request.user})
        if serializer.is_valid(raise_exception=True):
            return Response({'msg':'password changed sucessfully'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class SendPasswordResetEmailView(APIView):
    renderer_classes= [UserRenderer]
    def post(self, request, format= None):
        serializer=SendPassowrdResetEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'msg':'Password Reset link send. Please check your Email'}, status=status.HTTP_200_OK)


class UserSignupInviteView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = UserSignupInviteSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            return Response({'msg': 'Verification email sent. Please check your inbox to complete registration.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'msg': 'OTP Verified Successfully'}, status=status.HTTP_200_OK)


class UserPasswordResetView(APIView):
  renderer_classes = [UserRenderer]
  def post(self, request, format=None):
    serializer = UserPasswordResetSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    return Response({'msg':'Password Reset Successfully'}, status=status.HTTP_200_OK)



# -----------------------------
# Example Admin-only view
# -----------------------------
class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, format=None):
        return Response({'msg': f'Hello {request.user.name}, welcome to Admin Dashboard!'}, status=status.HTTP_200_OK)


# -----------------------------
# Example Business-only view
# -----------------------------
class BusinessDashboardView(APIView):
    permission_classes = [IsBusinessUser]

    def get(self, request, format=None):
        return Response({'msg': f'Hello {request.user.name}, welcome to Business Dashboard!'}, status=status.HTTP_200_OK)


# -----------------------------
# Example SuperAdmin-only view
# -----------------------------
class SuperAdminDashboardView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request, format=None):
        return Response({'msg': f'Hello {request.user.name}, welcome to SuperAdmin Dashboard!'}, status=status.HTTP_200_OK)

class UserListView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsSuperAdmin]
    def get(self, request, format=None):
        users = User.objects.all()
        serializer = UserProfileSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class UserManageDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsSuperAdmin]

class GoogleLoginView(APIView):
    renderer_classes = [UserRenderer]
    def post(self, request, format=None):
        access_token = request.data.get('access_token')
        if not access_token:
            return Response({'errors': {'token': ['No access token provided']}}, status=status.HTTP_400_BAD_REQUEST)

        # Verify token with Google (frontend sends ID Token as access_token parameter)
        url = f'https://oauth2.googleapis.com/tokeninfo?id_token={access_token}'
        try:
            response = requests.get(url)
            if response.status_code != 200:
                return Response({'errors': {'token': ['Invalid Google token']}}, status=status.HTTP_400_BAD_REQUEST)
            
            user_info = response.json()
            email = user_info.get('email')
            name = user_info.get('name') or email.split('@')[0]
            
            if not email:
                 return Response({'errors': {'token': ['Could not get email from Google']}}, status=status.HTTP_400_BAD_REQUEST)

            # Check if user exists
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Return 404 so UI can auto-fill signup form
                return Response({'errors': {'token': ['Account does not exist. Please sign up first.']}, 'email': email, 'name': name}, status=status.HTTP_404_NOT_FOUND)

            # Generate tokens - Allow suspended users to login (same as regular login)
            token = get_tokens_for_user(user)
            return Response({
                'token': token,
                'msg': 'Login Successful',
                'role': user.role,
                'name': user.name,
                'is_active': user.is_active,
                'ban_reason': user.ban_reason
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'errors': {'non_field_errors': [str(e)]}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationListView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        user = request.user
        notifications = Notification.objects.filter(recipient=user).order_by('-created_at')
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationMarkReadView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk=None, format=None):
        if pk:
            try:
                notification = Notification.objects.get(pk=pk, recipient=request.user)
                notification.is_read = True
                notification.save()
                return Response({'msg': 'Notification marked as read'}, status=status.HTTP_200_OK)
            except Notification.DoesNotExist:
                return Response({'errors': {'detail': 'Notification not found'}}, status=status.HTTP_404_NOT_FOUND)
        else:
            Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
            return Response({'msg': 'All notifications marked as read'}, status=status.HTTP_200_OK)

# -----------------------------
# Ban System Views
# -----------------------------
class UserBanView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk, format=None):
        try:
            user = User.objects.get(pk=pk)
            if user.role == "superadmin":
                return Response({'error': 'Cannot ban a superadmin'}, status=status.HTTP_400_BAD_REQUEST)
            
            ban_reason = request.data.get('ban_reason', 'Violation of terms.')
            user.is_active = False
            user.ban_reason = ban_reason
            user.save()
            
            # Notify the banned user
            Notification.objects.create(
                recipient=user,
                notification_type='system',
                message=f"Account Suspended: Your account has been suspended by an Admin. Reason: {ban_reason}"
            )
            email_service.send_ban_notification(user, ban_reason)
            
            return Response({'status': 'User banned successfully'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class UserUnbanView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk, format=None):
        try:
            user = User.objects.get(pk=pk)
            user.is_active = True
            user.ban_reason = None
            user.unban_request_message = None
            user.save()
            
            # Notify the unbanned user
            Notification.objects.create(
                recipient=user,
                notification_type='system',
                message="Account Restored: Your account suspension has been lifted by an Admin. Welcome back!"
            )
            email_service.send_unban_notification(user)
            
            return Response({'status': 'User unbanned successfully'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class UserAppealView(APIView):
    # Bypass standard auth because SimpleJWT rejects inactive users
    authentication_classes = []
    permission_classes = []

    def _get_user_from_request(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        token = auth_header.split(' ')[1]
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            access_token = AccessToken(token)
            return User.objects.get(id=access_token['user_id'])
        except Exception:
            return None

    def get(self, request, format=None):
        user = self._get_user_from_request(request)
        if not user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
            
        appeals = BanAppeal.objects.filter(user=user).order_by('-created_at')
        appealsUrl = BanAppealSerializer(appeals, many=True).data
        
        return Response({
            'profile': {
                'email': user.email,
                'name': user.name,
                'is_active': user.is_active,
                'ban_reason': user.ban_reason
            },
            'appeals': appealsUrl
        }, status=status.HTTP_200_OK)
        
    def post(self, request, format=None):
        user = self._get_user_from_request(request)
        if not user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
            
        appeal_text = request.data.get('appeal_text')
        if not appeal_text:
            return Response({'error': 'Appeal text is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if they already have a pending appeal to prevent spam
        if BanAppeal.objects.filter(user=user, status='pending').exists():
            return Response({'error': 'You already have a pending appeal.'}, status=status.HTTP_400_BAD_REQUEST)
            
        appeal = BanAppeal.objects.create(
            user=user,
            appeal_text=appeal_text,
            status='pending'
        )
        
        user.unban_request_message = appeal_text
        user.save()
        
        # Notify superadmins
        superadmins = User.objects.filter(role='superadmin')
        for admin in superadmins:
            Notification.objects.create(
                recipient=admin,
                notification_type='system',
                message=f"New Ban Appeal: User {user.name} ({user.email}) has appealed their suspension."
            )
        email_service.send_appeal_submitted_to_superadmins(appeal, list(superadmins))
            
        serializer = BanAppealSerializer(appeal)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class AdminAppealManageView(APIView):
    permission_classes = [IsSuperAdmin]
    
    def get(self, request, format=None):
        appeals = BanAppeal.objects.all().order_by('-created_at')
        serializer = BanAppealSerializer(appeals, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    def post(self, request, pk, format=None):
        try:
            appeal = BanAppeal.objects.get(pk=pk)
            admin_response = request.data.get('admin_response')
            new_status = request.data.get('status')
            
            if admin_response:
                appeal.admin_response = admin_response
            if new_status in dict(BanAppeal.STATUS_CHOICES):
                appeal.status = new_status
            
            appeal.save()
            
            if new_status == 'approved':
                user = appeal.user
                user.is_active = True
                user.ban_reason = None
                user.unban_request_message = None
                user.save()
                
                Notification.objects.create(
                    recipient=user,
                    notification_type='system',
                    message=f"Appeal Approved. {admin_response or 'Your account has been reinstated.'}"
                )
                email_service.send_appeal_approved_to_user(appeal)
            elif new_status == 'rejected':
                Notification.objects.create(
                    recipient=appeal.user,
                    notification_type='system',
                    message=f"Appeal Rejected. {admin_response or ''}"
                )
                email_service.send_appeal_rejected_to_user(appeal)
                
            serializer = BanAppealSerializer(appeal)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except BanAppeal.DoesNotExist:
            return Response({'error': 'Appeal not found'}, status=status.HTTP_404_NOT_FOUND)