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
    EsewaInitiatePaymentView,
    EsewaVerifyPaymentView,
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

    # eSewa payment — verify must come BEFORE <int:pk> patterns to avoid 'verify' being captured as pk
    path('bookings/esewa/verify/', EsewaVerifyPaymentView.as_view(), name='esewa-verify'),

    # Booking endpoints - Owner
    path('owner-bookings/', OwnerBookingsListView.as_view(), name='owner-bookings'),
    path('owner-occupancy-stats/', OwnerOccupancyStatsView.as_view(), name='owner-occupancy-stats'),
    path('bookings/<int:pk>/update/', BookingUpdateView.as_view(), name='update-booking'),
    path('bookings/<int:pk>/action/', BookingApprovalView.as_view(), name='booking-action'),
    path('bookings/<int:pk>/esewa/initiate/', EsewaInitiatePaymentView.as_view(), name='esewa-initiate'),

    # Reports
    path('reports/download/', DownloadReportView.as_view(), name='download-report'),
]
