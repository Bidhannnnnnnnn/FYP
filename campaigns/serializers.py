from rest_framework import serializers
from .models import Campaign, Booking, BookingSlot
from billboards.serializers import BillboardListSerializer

class CampaignSerializer(serializers.ModelSerializer):
    advertiser_email = serializers.EmailField(source='advertiser.email', read_only=True)
    
    class Meta:
        model = Campaign
        fields = ['id', 'advertiser', 'advertiser_email', 'name', 'start_date', 'end_date', 
                  'budget', 'status', 'created_at', 'updated_at']
        read_only_fields = ['advertiser', 'status', 'created_at', 'updated_at']


class BookingCreateSerializer(serializers.ModelSerializer):
    slots = serializers.JSONField(write_only=True, help_text="List of {date, hours: []}")

    class Meta:
        model = Booking
        fields = ['campaign', 'billboard', 'start_date', 'end_date', 'creative_file', 
                  'slot_duration_seconds', 'frequency_per_hour', 'slots']
        extra_kwargs = {
            'campaign': {'required': False}
        }
        
    def validate(self, data):
        # Support partial updates by getting from instance if missing in data
        start_date = data.get('start_date', self.instance.start_date if self.instance else None)
        end_date = data.get('end_date', self.instance.end_date if self.instance else None)
        billboard = data.get('billboard', self.instance.billboard if self.instance else None)

        # Ensure start_date is before end_date
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError("End date must be after start date")
        
        # Check if billboard is approved
        if billboard and billboard.status != 'approved':
            raise serializers.ValidationError("Can only book approved billboards")
        
        return data

class BookingSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingSlot
        fields = ['date', 'hour', 'frequency_per_hour']


class BookingListSerializer(serializers.ModelSerializer):
    billboard_details = BillboardListSerializer(source='billboard', read_only=True)
    campaign_name = serializers.CharField(source='campaign.name', read_only=True)
    advertiser_email = serializers.EmailField(source='campaign.advertiser.email', read_only=True)
    slots = BookingSlotSerializer(many=True, read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'campaign', 'campaign_name', 'advertiser_email', 'billboard', 
                  'billboard_details', 'start_date', 'end_date', 'price_calculated',
                  'slot_duration_seconds', 'frequency_per_hour', 'slots',
                  'creative_file', 'creative_status', 'booking_status', 'owner_remarks',
                  'payment_deadline', 'vat_amount', 'platform_commission', 'owner_payout_amount',
                  'created_at', 'updated_at']
        read_only_fields = ['price_calculated', 'creative_status', 'booking_status', 
                           'owner_remarks', 'vat_amount', 'platform_commission', 'owner_payout_amount',
                           'created_at', 'updated_at']



class BookingActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject', 'request_revision'])
    remarks = serializers.CharField(required=False, allow_blank=True)


class BillboardPlayerAdSerializer(serializers.ModelSerializer):
    advertiser_name = serializers.CharField(source='campaign.advertiser.name', read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'creative_file', 'slot_duration_seconds', 'frequency_per_hour', 'advertiser_name']

