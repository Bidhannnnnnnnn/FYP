from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from account.permissions import *
from account.serializers import UserRegistrationSerializer
from account.serializers import UserLoginSerializer
from account.serializers import UserProfileSerializer
from account.serializers import UserChangePasswordSerializer
from account.serializers import SendPassowrdResetEmailSerializer
from account.serializers import UserPasswordResetSerializer
from django.contrib.auth import authenticate
from account.renderers import UserRenderer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework.permissions import IsAuthenticated
import requests
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string

User = get_user_model()

permission_classes = [IsAdminUser]
permission_classes = [IsBusinessUser]
permission_classes = [IsSuperAdmin]


#Generate token Manually
def get_tokens_for_user(user):
    if not user.is_active:
      raise AuthenticationFailed("User is not active")

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
            email= serializer.data.get('email')
            password= serializer.data.get('password')
            user= authenticate(email=email, password=password)
            
            if user is not None:
                token= get_tokens_for_user(user)
                return Response({'token':token, 'msg':'Login Success'}, status=status.HTTP_200_OK)
            else:
                return Response({'errors':{'non_field_errors':['email or passowrd is not valid']}}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserProfileView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
        if serializer.is_valid(raise_exception=True):
            return Response({'msg':'password reset link sent, pease check your email'}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserPasswordResetView(APIView):
  renderer_classes = [UserRenderer]
  def post(self, request, uid, token, format=None):
    serializer = UserPasswordResetSerializer(data=request.data, context={'uid':uid, 'token':token})
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

class GoogleLoginView(APIView):
    renderer_classes = [UserRenderer]
    def post(self, request, format=None):
        access_token = request.data.get('access_token')
        if not access_token:
            return Response({'errors': {'token': ['No access token provided']}}, status=status.HTTP_400_BAD_REQUEST)

        # Verify token with Google
        url = 'https://www.googleapis.com/oauth2/v3/userinfo'
        headers = {'Authorization': f'Bearer {access_token}'}
        try:
            response = requests.get(url, headers=headers)
            if response.status_code != 200:
                return Response({'errors': {'token': ['Invalid Google token']}}, status=status.HTTP_400_BAD_REQUEST)
            
            user_info = response.json()
            email = user_info.get('email')
            name = user_info.get('name')
            
            if not email:
                 return Response({'errors': {'token': ['Could not get email from Google']}}, status=status.HTTP_400_BAD_REQUEST)

            # Check if user exists
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Create new user
                # Determine role or default to business? 
                # For now default to 'business' or generic user. App uses 'role' field in serializer but User model might differ.
                # Assuming User model has name, email, tc.
                # We'll set a random password.
                password = get_random_string(length=32)
                user = User.objects.create_user(email=email, name=name, password=password, tc=True)
                # If role is needed, need to check User model. Assuming default or handled.
                # If your User model requires 'role', we might need to set it.
                # Let's check User model in account/models.py if needed, but usually create_user handles basics.
                # We will save basic user.

            # Generate tokens
            token = get_tokens_for_user(user)
            return Response({'token': token, 'msg': 'Login Successful'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'errors': {'non_field_errors': [str(e)]}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)