from django.urls import path
from .views import (
    BillboardCreateView, MyBillboardsListView, PublicBillboardListView,
    ApproveBillboardView, OwnerDocumentCreateView
)

urlpatterns = [
    path('add/', BillboardCreateView.as_view(), name='billboard-add'),
    path('my/', MyBillboardsListView.as_view(), name='billboard-my'),
    path('list/', PublicBillboardListView.as_view(), name='billboard-list'),
    path('approve/<int:pk>/', ApproveBillboardView.as_view(), name='billboard-approve'),
    path('documents/upload/', OwnerDocumentCreateView.as_view(), name='owner-doc-upload'),
]
