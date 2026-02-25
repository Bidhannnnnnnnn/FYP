from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Billboard, OwnerDocument
from .serializers import BillboardCreateSerializer, BillboardListSerializer, OwnerDocumentSerializer
from .permissions import IsSuperAdminOrAdmin
from account.permissions import IsBusinessUser
from django.utils import timezone
from campaigns.models import Booking
from campaigns.serializers import BillboardPlayerAdSerializer

# Owner creates a billboard
class BillboardCreateView(generics.CreateAPIView):
    serializer_class = BillboardCreateSerializer
    permission_classes = [IsAuthenticated]  # owner must be authenticated

    def perform_create(self, serializer):
        # ensure only owners (role 'admin') can create—or allow 'superadmin' for testing
        user = self.request.user
        if user.role not in ['admin', 'superadmin', 'business']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only billboard owners can add billboards")
        serializer.save(owner=user)

# Owner lists their own billboards
class MyBillboardsListView(generics.ListAPIView):
    serializer_class = BillboardListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Billboard.objects.all()
        return Billboard.objects.filter(owner=user)

# Public listing for advertisers (approved ones only)
class PublicBillboardListView(generics.ListAPIView):
    serializer_class = BillboardListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Billboard.objects.filter(status='approved')

# Single billboard detail
class BillboardDetailView(generics.RetrieveAPIView):
    queryset = Billboard.objects.all()
    serializer_class = BillboardListSerializer
    permission_classes = [AllowAny]

# Admin approves a billboard
class ApproveBillboardView(generics.UpdateAPIView):
    serializer_class = BillboardListSerializer
    permission_classes = [IsSuperAdminOrAdmin]
    queryset = Billboard.objects.all()
    lookup_url_kwarg = 'pk'

    def patch(self, request, *args, **kwargs):
        billboard = self.get_object()
        action = request.data.get('action')
        if action == 'approve':
            billboard.status = 'approved'
            billboard.save()
            return Response({'msg': 'Billboard approved'}, status=status.HTTP_200_OK)
        elif action == 'reject':
            billboard.status = 'rejected'
            billboard.save()
            return Response({'msg': 'Billboard rejected'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

# Owner uploads verification docs
class OwnerDocumentCreateView(generics.CreateAPIView):
    serializer_class = OwnerDocumentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ['admin', 'superadmin', 'business']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only owners can upload documents")
        serializer.save(owner=user)
        serializer.save(owner=user)

# Owner updates their billboard
class BillboardUpdateView(generics.UpdateAPIView):
    serializer_class = BillboardCreateSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Billboard.objects.all()
        return Billboard.objects.filter(owner=user)

# Owner deletes their billboard
class BillboardDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Billboard.objects.all()
        return Billboard.objects.filter(owner=user)


class BillboardActiveAdsView(generics.ListAPIView):
    """
    Returns approved bookings for the current date for a specific billboard.
    Accessible without authentication for public display.
    """
    serializer_class = BillboardPlayerAdSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        billboard_id = self.kwargs.get('pk')
        today = timezone.now().date()
        return Booking.objects.filter(
            billboard_id=billboard_id,
            booking_status='approved',
            creative_status='approved',
            start_date__lte=today,
            end_date__gte=today
        ).select_related('campaign__advertiser')

