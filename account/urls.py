from django.urls import path, include
from account.views import UserRegistrationView, UserLoginView, UserProfileView, UserChangePasswordView, SendPasswordResetEmailView, UserPasswordResetView, GoogleLoginView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(),
    name='register'),
    
    path('login/', UserLoginView.as_view(),
    name='login'),
    
    path('profile/', UserProfileView.as_view(),
    name='profile'),
    
    path('changepassword/', UserChangePasswordView.as_view(),
    name='changepassword'),
    
    path('SendPasswordResetEmail/', SendPasswordResetEmailView.as_view(),
    name='SendPasswordResetEmail'),
    
    path('reset-password/<uid>/<token>/', UserPasswordResetView.as_view(),
    name='reset-password'),

    path('google/', GoogleLoginView.as_view(), name='google_login'),
]