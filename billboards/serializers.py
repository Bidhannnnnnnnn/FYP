from rest_framework import serializers
from .models import Billboard, OwnerDocument
from account.serializers import UserProfileSerializer
from django.conf import settings

class BillboardCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Billboard
        fields = ['id','title','location','size','display_type','base_price','visibility_score','traffic_density']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['owner'] = user
        return super().create(validated_data)


class BillboardListSerializer(serializers.ModelSerializer):
    owner = UserProfileSerializer(read_only=True)
    class Meta:
        model = Billboard
        fields = ['id','title','location','size','display_type','base_price','visibility_score','traffic_density','status','owner']


class OwnerDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = OwnerDocument
        fields = ['id','document_name','file','uploaded_at','verified','verified_by']
        read_only_fields = ['verified','verified_by']
