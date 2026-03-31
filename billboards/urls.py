from django.urls import path
from .views import (
    BillboardCreateView,
    MyBillboardsListView,
    PublicBillboardListView,
    BillboardDetailView,
    ApproveBillboardView,
    OwnerDocumentCreateView,
    BillboardUpdateView,
    BillboardDeleteView,
    BillboardActiveAdsView,
    BillboardReviewListView
)

urlpatterns = [
    path('add/', BillboardCreateView.as_view(), name='billboard-add'),
    path('my/', MyBillboardsListView.as_view(), name='billboard-my'),
    path('list/', PublicBillboardListView.as_view(), name='billboard-list'),
    path('detail/<int:pk>/', BillboardDetailView.as_view(), name='billboard-detail'),
    path('<int:pk>/active-ads/', BillboardActiveAdsView.as_view(), name='billboard-active-ads'),
    path('history/<int:pk>/', BillboardReviewListView.as_view(), name='billboard-history'),
    path('approve/<int:pk>/', ApproveBillboardView.as_view(), name='approve-billboard'),
    path('update/<int:pk>/', BillboardUpdateView.as_view(), name='billboard-update'),
    path('delete/<int:pk>/', BillboardDeleteView.as_view(), name='billboard-delete'),
    path('documents/upload/', OwnerDocumentCreateView.as_view(), name='owner-doc-upload'),
]
