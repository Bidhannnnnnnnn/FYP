from rest_framework import serializers
from .models import Campaign, Booking
from billboards.serializers import BillboardListSerializer

class CampaignSerializer(serializers.ModelSerializer):
    advertiser_email = serializers.EmailField(source='advertiser.email', read_only=True)
    
    class Meta:
        model = Campaign
        fields = ['id', 'advertiser', 'advertiser_email', 'name', 'start_date', 'end_date', 
                  'budget', 'status', 'created_at', 'updated_at']
        read_only_fields = ['advertiser', 'status', 'created_at', 'updated_at']


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['campaign', 'billboard', 'start_date', 'end_date', 'creative_file']
        
    def validate(self, data):
        # Ensure start_date is before end_date
        if data['start_date'] >= data['end_date']:
            raise serializers.ValidationError("End date must be after start date")
        
        # Check if billboard is approved
        if data['billboard'].status != 'approved':
            raise serializers.ValidationError("Can only book approved billboards")
        
        return data


class BookingListSerializer(serializers.ModelSerializer):
    billboard_details = BillboardListSerializer(source='billboard', read_only=True)
    campaign_name = serializers.CharField(source='campaign.name', read_only=True)
    advertiser_email = serializers.EmailField(source='campaign.advertiser.email', read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'campaign', 'campaign_name', 'advertiser_email', 'billboard', 
                  'billboard_details', 'start_date', 'end_date', 'price_calculated',
                  'creative_file', 'creative_status', 'booking_status', 'owner_remarks',
                  'created_at', 'updated_at']
        read_only_fields = ['price_calculated', 'creative_status', 'booking_status', 
                           'owner_remarks', 'created_at', 'updated_at']


class BookingActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    remarks = serializers.CharField(required=False, allow_blank=True)

