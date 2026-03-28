from django.urls import path
from .views import (
    CampaignListCreateView,
    BookingCreateView,
    MyBookingsListView,
    OwnerBookingsListView,
    BookingUpdateView,
    BookingApprovalView,
    CalculatePriceView,
    CheckAvailabilityView,
    OwnerOccupancyStatsView,
    PayBookingView,
    DownloadReportView
)

urlpatterns = [
    # Campaign endpoints
    path('campaigns/', CampaignListCreateView.as_view(), name='campaign-list-create'),
    
    # Booking endpoints - Advertiser
    path('bookings/', MyBookingsListView.as_view(), name='my-bookings'),
    path('bookings/create/', BookingCreateView.as_view(), name='create-booking'),
    path('calculate-price/', CalculatePriceView.as_view(), name='calculate-price'),
    path('check-availability/', CheckAvailabilityView.as_view(), name='check-availability'),
    path('bookings/<int:pk>/pay/', PayBookingView.as_view(), name='pay-booking'),
    
    # Booking endpoints - Owner
    path('owner-bookings/', OwnerBookingsListView.as_view(), name='owner-bookings'),
    path('owner-occupancy-stats/', OwnerOccupancyStatsView.as_view(), name='owner-occupancy-stats'),
    path('bookings/<int:pk>/update/', BookingUpdateView.as_view(), name='update-booking'),
    path('bookings/<int:pk>/action/', BookingApprovalView.as_view(), name='booking-action'),
    path('reports/download/', DownloadReportView.as_view(), name='download-report'),
]
