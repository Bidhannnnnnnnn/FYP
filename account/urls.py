from django.urls import path, include
from account.views import (
    UserRegistrationView, UserLoginView, UserProfileView, UserChangePasswordView,
    SendPasswordResetEmailView, VerifyOTPView, UserPasswordResetView, UserListView, GoogleLoginView,
    NotificationListView, NotificationMarkReadView, UserManageDetailView, UserSignupInviteView,
    UserBanView, UserUnbanView, UserAppealView, AdminAppealManageView
)

urlpatterns = [
    path('register/', UserRegistrationView.as_view(),
    name='register'),
    
    path('login/', UserLoginView.as_view(),
    name='login'),
    
    path('signup-invite/', UserSignupInviteView.as_view(),
    name='signup-invite'),
    
    path('profile/', UserProfileView.as_view(),
    name='profile'),
    
    path('changepassword/', UserChangePasswordView.as_view(),
    name='changepassword'),
    
    path('SendPasswordResetEmail/', SendPasswordResetEmailView.as_view(),
    name='SendPasswordResetEmail'),
    
    path('userlist/', UserListView.as_view(),
    name='userlist'),
    
    path('user-manage/<int:pk>/', UserManageDetailView.as_view(),
    name='user-manage'),
    
    path('reset-password/', UserPasswordResetView.as_view(),
    name='reset-password'),
    
    path('verify-otp/', VerifyOTPView.as_view(),
    name='verify-otp'),

    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('notifications/mark-read/', NotificationMarkReadView.as_view(), name='notifications-mark-read-all'),
    path('notifications/mark-read/<int:pk>/', NotificationMarkReadView.as_view(), name='notifications-mark-read'),

    path('google/', GoogleLoginView.as_view(), name='google_login'),
    
    # Ban and Appeal
    path('ban/<int:pk>/', UserBanView.as_view(), name='user-ban'),
    path('unban/<int:pk>/', UserUnbanView.as_view(), name='user-unban'),
    path('appeal/', UserAppealView.as_view(), name='user-appeal'),
    path('manage-appeals/', AdminAppealManageView.as_view(), name='admin-appeal-manage'),
    path('manage-appeals/<int:pk>/', AdminAppealManageView.as_view(), name='admin-appeal-respond'),
]