from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Billboard, OwnerDocument, BillboardReview
from .serializers import (
    BillboardCreateSerializer, 
    BillboardListSerializer, 
    OwnerDocumentSerializer,
    BillboardReviewSerializer
)
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

# Public listing for advertisers (approved ones only, owner must be active)
class PublicBillboardListView(generics.ListAPIView):
    serializer_class = BillboardListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Billboard.objects.filter(status='approved', owner__is_active=True)

# Single billboard detail
class BillboardDetailView(generics.RetrieveAPIView):
    serializer_class = BillboardListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Superadmins see everything; public only sees billboards from active owners
        user = self.request.user
        if user.is_authenticated and user.role == 'superadmin':
            return Billboard.objects.all()
        return Billboard.objects.filter(owner__is_active=True)

# Admin approves a billboard
class ApproveBillboardView(generics.UpdateAPIView):
    serializer_class = BillboardListSerializer
    permission_classes = [IsSuperAdminOrAdmin]
    queryset = Billboard.objects.all()
    lookup_url_kwarg = 'pk'

    def patch(self, request, *args, **kwargs):
        billboard = self.get_object()
        action = request.data.get('action')
        from account.models import Notification
        
        if action == 'approve':
            billboard.status = 'approved'
            billboard.feedback_message = None
            billboard.save()
            
            # Record in history
            BillboardReview.objects.create(
                billboard=billboard,
                user=request.user,
                action_type='admin_review',
                status_result='approved',
                feedback="Billboard approved"
            )
            Notification.objects.create(
                recipient=billboard.owner,
                notification_type='billboard_update',
                message=f"Your billboard '{billboard.title}' has been approved and is now live!",
                target_id=str(billboard.id)
            )
            return Response({'msg': 'Billboard approved'}, status=status.HTTP_200_OK)
        elif action == 'hide':
            billboard.status = 'hidden'
            billboard.save()
            
            # Record in history
            BillboardReview.objects.create(
                billboard=billboard,
                user=request.user,
                action_type='admin_review',
                status_result='hidden',
                feedback="Billboard hidden from marketplace"
            )
            return Response({'msg': 'Billboard hidden'}, status=status.HTTP_200_OK)
        elif action == 'reject':
            billboard.status = 'rejected'
            feedback = request.data.get('feedback_message', '').strip()
            billboard.feedback_message = feedback if feedback else None
            billboard.save()
            
            # Record in history
            BillboardReview.objects.create(
                billboard=billboard,
                user=request.user,
                action_type='admin_review',
                status_result='rejected',
                feedback=feedback
            )
            
            Notification.objects.create(
                recipient=billboard.owner,
                notification_type='billboard_update',
                message=f"Your billboard '{billboard.title}' requires improvements. Feedback: {feedback}" if feedback else f"Your billboard '{billboard.title}' requires improvements.",
                target_id=str(billboard.id)
            )
            return Response({'msg': 'Billboard rejected and feedback sent'}, status=status.HTTP_200_OK)
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

    def perform_update(self, serializer):
        billboard = serializer.save()
        
        # Record in history
        BillboardReview.objects.create(
            billboard=billboard,
            user=self.request.user,
            action_type='user_update',
            status_result=billboard.status,
            feedback="User updated billboard details/documents"
        )
        
        # Automatically set back to pending if the owner makes an update after a rejection
        if billboard.status == 'rejected':
            billboard.status = 'pending'
            billboard.save()
            
            # Record the status change to pending
            BillboardReview.objects.create(
                billboard=billboard,
                user=self.request.user,
                action_type='user_update',
                status_result='pending',
                feedback="Status automatically changed to pending after user update"
            )

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
    Returns approved bookings for the current date/hour for a specific billboard.
    Only returns bookings that have a BookingSlot matching today's date and current hour.
    Accessible without authentication for public display.
    """
    serializer_class = BillboardPlayerAdSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        billboard_id = self.kwargs.get('pk')
        now = timezone.localtime(timezone.now())
        today = now.date()
        current_hour = now.hour
        print(f"[Player] billboard={billboard_id} local_now={now} today={today} hour={current_hour}")
        qs = Booking.objects.filter(
            billboard_id=billboard_id,
            booking_status__in=['paid', 'active'],
            creative_status='approved',
            slots__date=today,
            slots__hour=current_hour
        ).distinct().select_related('campaign__advertiser')
        print(f"[Player] matched bookings: {qs.count()}")
        return qs

class BillboardReviewListView(generics.ListAPIView):
    serializer_class = BillboardReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        billboard_id = self.kwargs.get('pk')
        billboard = Billboard.objects.get(id=billboard_id)
        
        # Superadmins can see everything. Owners can see history of their own billboards.
        if self.request.user.role == 'superadmin' or billboard.owner == self.request.user:
            return BillboardReview.objects.filter(billboard_id=billboard_id)
        
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("You do not have permission to view this billboard's history.")

