from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from .models import Campaign, Booking
from .serializers import (
    CampaignSerializer, 
    BookingCreateSerializer, 
    BookingListSerializer,
    BookingActionSerializer
)
from .permissions import IsAdvertiser, IsBookingBillboardOwner


# ============ ADVERTISER VIEWS ============

class CampaignListCreateView(generics.ListCreateAPIView):
    """
    Advertisers can list their campaigns and create new ones
    """
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only show campaigns for the logged-in advertiser
        return Campaign.objects.filter(advertiser=self.request.user)

    def perform_create(self, serializer):
        # Ensure only advertisers can create campaigns
        if self.request.user.role not in ['advertiser', 'superadmin']:
            raise PermissionDenied("Only advertisers can create campaigns")
        serializer.save(advertiser=self.request.user)


class BookingCreateView(generics.CreateAPIView):
    """
    Advertisers create bookings for billboards
    Auto-calculates price based on billboard daily_rate and duration
    """
    serializer_class = BookingCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        
        # Check if user is advertiser
        if user.role not in ['advertiser', 'superadmin']:
            raise PermissionDenied("Only advertisers can create bookings")
        
        # Verify campaign belongs to this advertiser
        campaign = serializer.validated_data['campaign']
        if campaign.advertiser != user and user.role != 'superadmin':
            raise PermissionDenied("You can only create bookings for your own campaigns")
        
        # Calculate price
        billboard = serializer.validated_data['billboard']
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        
        days = (end_date - start_date).days
        if days < 1:
            days = 1
        
        # Use daily_rate if available, otherwise base_price
        if billboard.daily_rate > 0:
            price = billboard.daily_rate * days
        else:
            price = billboard.base_price
        
        serializer.save(price_calculated=price)


class MyBookingsListView(generics.ListAPIView):
    """
    Advertisers view their bookings
    """
    serializer_class = BookingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'advertiser':
            return Booking.objects.filter(campaign__advertiser=user)
        elif user.role == 'superadmin':
            return Booking.objects.all()
        return Booking.objects.none()


# ============ OWNER VIEWS ============

class OwnerBookingsListView(generics.ListAPIView):
    """
    Billboard owners view bookings for their billboards
    """
    serializer_class = BookingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'business']:
            # Show bookings for billboards owned by this user
            return Booking.objects.filter(billboard__owner=user)
        elif user.role == 'superadmin':
            return Booking.objects.all()
        return Booking.objects.none()


class BookingApprovalView(generics.UpdateAPIView):
    """
    Billboard owners approve/reject bookings and creatives
    """
    serializer_class = BookingActionSerializer
    permission_classes = [IsAuthenticated]
    queryset = Booking.objects.all()
    lookup_url_kwarg = 'pk'

    def patch(self, request, *args, **kwargs):
        booking = self.get_object()
        
        # Ensure user owns the billboard
        if booking.billboard.owner != request.user and request.user.role != 'superadmin':
            raise PermissionDenied("You can only approve bookings for your own billboards")
        
        serializer = BookingActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        action = serializer.validated_data['action']
        remarks = serializer.validated_data.get('remarks', '')
        
        if action == 'approve':
            booking.booking_status = 'approved'
            booking.creative_status = 'approved'
            booking.owner_remarks = remarks if remarks else 'Approved'
        elif action == 'reject':
            booking.booking_status = 'rejected'
            booking.creative_status = 'rejected'
            booking.owner_remarks = remarks if remarks else 'Rejected'
        
        booking.save()
        
        return Response({
            'msg': f'Booking {action}d successfully',
            'booking_status': booking.booking_status,
            'creative_status': booking.creative_status
        }, status=status.HTTP_200_OK)

