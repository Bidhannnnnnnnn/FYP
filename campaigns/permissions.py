from rest_framework import permissions

class IsAdvertiser(permissions.BasePermission):
    """
    Permission to check if user is an advertiser
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'advertiser'


class IsBookingBillboardOwner(permissions.BasePermission):
    """
    Permission to check if user owns the billboard in the booking
    """
    def has_object_permission(self, request, view, obj):
        # obj is a Booking instance
        return obj.billboard.owner == request.user
 