from django.contrib import admin
from .models import Billboard, OwnerDocument, BillboardReview

@admin.register(Billboard)
class BillboardAdmin(admin.ModelAdmin):
    list_display = ('title','owner','location','size','status','base_price','created_at')
    list_filter = ('status','created_at')
    search_fields = ('title','location','owner__email')


@admin.register(OwnerDocument)
class OwnerDocumentAdmin(admin.ModelAdmin):
    list_display = ('owner','document_name','verified','uploaded_at','verified_by')
    list_filter = ('verified',)

@admin.register(BillboardReview)
class BillboardReviewAdmin(admin.ModelAdmin):
    list_display = ('billboard','user','action_type','status_result','created_at')
    list_filter = ('action_type','status_result','created_at')
    search_fields = ('billboard__title','user__email','feedback')
