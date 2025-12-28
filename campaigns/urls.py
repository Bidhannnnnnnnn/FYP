from django.urls import path
from .views import (
    CampaignListCreateView,
    BookingCreateView,
    MyBookingsListView,
    OwnerBookingsListView,
    BookingApprovalView
)

urlpatterns = [
    # Campaign endpoints
    path('campaigns/', CampaignListCreateView.as_view(), name='campaign-list-create'),
    
    # Booking endpoints - Advertiser
    path('bookings/', MyBookingsListView.as_view(), name='my-bookings'),
    path('bookings/create/', BookingCreateView.as_view(), name='booking-create'),
    
    # Booking endpoints - Owner
    path('owner/bookings/', OwnerBookingsListView.as_view(), name='owner-bookings'),
    path('bookings/<int:pk>/approve/', BookingApprovalView.as_view(), name='booking-approve'),
]

