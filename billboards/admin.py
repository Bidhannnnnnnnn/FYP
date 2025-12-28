from django.contrib import admin
from .models import Billboard, OwnerDocument

@admin.register(Billboard)
class BillboardAdmin(admin.ModelAdmin):
    list_display = ('title','owner','location','size','status','base_price','created_at')
    list_filter = ('status','created_at')
    search_fields = ('title','location','owner__email')


@admin.register(OwnerDocument)
class OwnerDocumentAdmin(admin.ModelAdmin):
    list_display = ('owner','document_name','verified','uploaded_at','verified_by')
    list_filter = ('verified',)
