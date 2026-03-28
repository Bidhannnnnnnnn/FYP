from rest_framework import serializers
from .models import Billboard, OwnerDocument, BillboardDocument, BillboardReview
from account.serializers import UserProfileSerializer
from django.conf import settings

class BillboardDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillboardDocument
        fields = ['id', 'file', 'document_type', 'uploaded_at']

class BillboardCreateSerializer(serializers.ModelSerializer):
    documents = BillboardDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Billboard
        fields = [
            'id','title','location','image','size','display_type',
            'base_price','visibility_score','traffic_density',
            'weekend_multiplier', 'location_tier',
            'description','latitude','longitude','feedback_message',
            'documents'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['owner'] = user
        billboard = Billboard.objects.create(**validated_data)
        
        # Handle multiple document uploads
        request = self.context.get('request')
        if request and request.FILES:
            files = request.FILES.getlist('uploaded_documents')
            for f in files:
                BillboardDocument.objects.create(billboard=billboard, file=f)
        
        return billboard

    def update(self, instance, validated_data):
        # Handle multiple document uploads
        request = self.context.get('request')
        if request and request.FILES:
            files = request.FILES.getlist('uploaded_documents')
            for f in files:
                BillboardDocument.objects.create(billboard=instance, file=f)
        
        return super().update(instance, validated_data)


class BillboardListSerializer(serializers.ModelSerializer):
    owner = UserProfileSerializer(read_only=True)
    documents = BillboardDocumentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Billboard
        fields = [
            'id','title','location','image','size','display_type',
            'base_price','visibility_score','traffic_density','status','owner',
            'weekend_multiplier', 'location_tier',
            'description','latitude','longitude','feedback_message',
            'documents'
        ]


class OwnerDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = OwnerDocument
        fields = ['id','document_name','file','uploaded_at','verified','verified_by']
        read_only_fields = ['verified','verified_by']

class BillboardReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = BillboardReview
        fields = ['id', 'user', 'user_name', 'action_type', 'status_result', 'feedback', 'created_at']
