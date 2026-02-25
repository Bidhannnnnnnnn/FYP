from django.urls import path, include
from account.views import (
    UserRegistrationView, UserLoginView, UserProfileView, UserChangePasswordView,
    SendPasswordResetEmailView, UserPasswordResetView, UserListView, GoogleLoginView,
    NotificationListView, NotificationMarkReadView
)

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
    
    path('userlist/', UserListView.as_view(),
    name='userlist'),
    
    path('reset-password/<uid>/<token>/', UserPasswordResetView.as_view(),
    name='reset-password'),

    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('notifications/mark-read/', NotificationMarkReadView.as_view(), name='notifications-mark-read-all'),
    path('notifications/mark-read/<int:pk>/', NotificationMarkReadView.as_view(), name='notifications-mark-read'),

    path('google/', GoogleLoginView.as_view(), name='google_login'),
]