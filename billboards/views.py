from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Billboard, OwnerDocument
from .serializers import BillboardCreateSerializer, BillboardListSerializer, OwnerDocumentSerializer
from .permissions import IsSuperAdminOrAdmin
from account.permissions import IsBusinessUser  # For advertiser endpoints

# Owner creates a billboard
class BillboardCreateView(generics.CreateAPIView):
    serializer_class = BillboardCreateSerializer
    permission_classes = [IsAuthenticated]  # owner must be authenticated

    def perform_create(self, serializer):
        # ensure only owners (role 'admin') can create—or allow 'superadmin' for testing
        user = self.request.user
        if user.role not in ['admin','superadmin']:
            raise PermissionError("Only billboard owners can add billboards")
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
        if user.role not in ['admin','superadmin']:
            raise PermissionError("Only owners can upload documents")
        serializer.save(owner=user)
