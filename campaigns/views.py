from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404
from .models import Campaign, Booking, BookingSlot
from .availability import AvailabilityService
from .serializers import (
    CampaignSerializer, 
    BookingCreateSerializer, 
    BookingListSerializer,
    BookingActionSerializer
)
from rest_framework.views import APIView
from .permissions import IsAdvertiser, IsBookingBillboardOwner
from billboards.models import Billboard
from datetime import datetime, timedelta

# ============ ADVERTISER VIEWS ============

class CampaignListCreateView(generics.ListCreateAPIView):
    """
    Advertisers can list their campaigns and create new ones
    """
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Campaign.objects.filter(advertiser=self.request.user)

    def perform_create(self, serializer):
        if self.request.user.role not in ['advertiser', 'superadmin']:
            raise PermissionDenied("Only advertisers can create campaigns")
        serializer.save(advertiser=self.request.user)


class BookingCreateView(generics.CreateAPIView):
    """
    Advertisers create bookings for billboards with granular slots.
    """
    serializer_class = BookingCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ['advertiser', 'superadmin']:
            raise PermissionDenied("Only advertisers can create bookings")
        
        # Extract slots from validated_data
        slots_json = serializer.validated_data.pop('slots', [])
        
        # Parse JSON if it arrives as a string (common in FormData)
        import json
        if isinstance(slots_json, str):
            try:
                slots_json = json.loads(slots_json)
            except json.JSONDecodeError:
                raise ValidationError("Invalid slots format. Must be JSON string.")

        billboard = serializer.validated_data['billboard']
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        slot_duration = serializer.validated_data.get('slot_duration_seconds', 10)
        default_frequency = serializer.validated_data.get('frequency_per_hour', 10)

        # Enforce booking lead days
        from django.utils import timezone as tz
        min_start = tz.localdate() + timedelta(days=billboard.booking_lead_days)
        if start_date < min_start:
            raise ValidationError(
                f"Bookings for this billboard must be made at least {billboard.booking_lead_days} day(s) in advance. "
                f"Earliest allowed start date is {min_start}."
            )

        from datetime import datetime
        flat_slots = []
        for item in slots_json:
            dt = datetime.strptime(item['date'], '%Y-%m-%d').date()
            for hr in item['hours']:
                # The 'hours' can now be a list of objects {h: int, f: int} or just ints
                if isinstance(hr, dict):
                    h = int(hr['h'])
                    f = int(hr.get('f', default_frequency))
                else:
                    h = int(hr)
                    f = default_frequency
                flat_slots.append({'date': dt, 'hour': h, 'frequency': f})

        if not flat_slots:
            raise ValidationError("At least one time slot must be selected.")

        # 1. Check Availability for all slots
        # We need to check each slot specifically now because frequencies differ
        is_available = True
        availability_results = []
        for s in flat_slots:
            load = slot_duration * s['frequency']
            check_single = AvailabilityService.check_availability(billboard.id, [s], load)
            if not check_single['available']:
                is_available = False
            availability_results.append(check_single['slots'][0])

        if not is_available:
            raise ValidationError({"error": "Capacity exceeded in one or more selected slots.", "slots": availability_results})

        # 2. Calculate Weighted Price
        from .pricing_engine import PricingEngine
        price = PricingEngine.calculate_price(billboard, flat_slots, slot_duration, default_frequency)

        # 3. Handle Campaign
        campaign = serializer.validated_data.get('campaign')
        if not campaign:
            from .models import Campaign
            campaign_name = f"Booking for {billboard.title} - {start_date}"
            campaign = Campaign.objects.create(
                advertiser=user, name=campaign_name, start_date=start_date, 
                end_date=end_date, budget=0, status='active'
            )
            serializer.validated_data['campaign'] = campaign

        # 4. Save Booking
        booking = serializer.save(price_calculated=price)

        # 5. Create BookingSlots
        for s in flat_slots:
            BookingSlot.objects.create(
                booking=booking, 
                date=s['date'], 
                hour=s['hour'], 
                frequency_per_hour=s['frequency']
            )


class CheckAvailabilityView(APIView):
    """
    Check capacity for specific hourly slots.
    Payload: { billboard_id, slots: [{date, hours: []}], slot_duration, frequency }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            billboard_id = request.data.get('billboard_id')
            slots_json = request.data.get('slots', [])
            
            import json
            if isinstance(slots_json, str):
                slots_json = json.loads(slots_json)

            slot_duration = int(request.data.get('slot_duration', 10))
            frequency = int(request.data.get('frequency', 10))
            
            flat_slots = []
            for item in slots_json:
                dt = datetime.strptime(item['date'], '%Y-%m-%d').date()
                for hr in item['hours']:
                    if isinstance(hr, dict):
                        h = int(hr['h'])
                        f = int(hr.get('f', frequency))
                    else:
                        h = int(hr)
                        f = frequency
                    flat_slots.append({'date': dt, 'hour': h, 'frequency': f})
            
            # Since check_availability in the engine currently takes a single requested_seconds, 
            # we need to adapt it or call it per-slot if frequencies differ, or update engines.
            # For simplicity, we'll loop through flat_slots and check load correctly.
            results = []
            is_available = True
            for s in flat_slots:
                load = slot_duration * s['frequency']
                check_single = AvailabilityService.check_availability(billboard_id, [s], load)
                if not check_single['available']:
                    is_available = False
                results.append(check_single['slots'][0])

            return Response({'available': is_available, 'slots': results}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CalculatePriceView(APIView):
    """
    Calculate estimated price for granular slots.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            billboard_id = request.data.get('billboard_id')
            slots_json = request.data.get('slots', [])
            
            import json
            if isinstance(slots_json, str):
                slots_json = json.loads(slots_json)

            slot_duration = int(request.data.get('slot_duration', 10))
            frequency = int(request.data.get('frequency', 10))

            billboard = get_object_or_404(Billboard, pk=billboard_id)
            
            flat_slots = []
            for item in slots_json:
                dt = datetime.strptime(item['date'], '%Y-%m-%d').date()
                for hr in item['hours']:
                    if isinstance(hr, dict):
                        h = int(hr['h'])
                        f = int(hr.get('f', frequency))
                    else:
                        h = int(hr)
                        f = frequency
                    flat_slots.append({'date': dt, 'hour': h, 'frequency': f})

            from .pricing_engine import PricingEngine
            price = PricingEngine.calculate_price(billboard, flat_slots, slot_duration, frequency)

            return Response({'estimated_price': price}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class MyBookingsListView(generics.ListAPIView):
    serializer_class = BookingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'advertiser':
            return Booking.objects.filter(campaign__advertiser=user)
        elif user.role == 'superadmin':
            return Booking.objects.all()
        return Booking.objects.none()


class BookingUpdateView(generics.UpdateAPIView):
    serializer_class = BookingCreateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Booking.objects.all()
        return Booking.objects.filter(
            campaign__advertiser=user,
            booking_status__in=['pending', 'changes_requested', 'rejected']
        )

    def perform_update(self, serializer):
        import json
        from .pricing_engine import PricingEngine

        # 1. Pop slots from validated_data (same as perform_create)
        slots_json = serializer.validated_data.pop('slots', [])
        if isinstance(slots_json, str):
            try:
                slots_json = json.loads(slots_json)
            except json.JSONDecodeError:
                raise ValidationError("Invalid slots format.")

        billboard = serializer.validated_data.get('billboard', serializer.instance.billboard)
        slot_duration = serializer.validated_data.get('slot_duration_seconds', serializer.instance.slot_duration_seconds)
        default_frequency = serializer.validated_data.get('frequency_per_hour', serializer.instance.frequency_per_hour)

        # 2. Parse flat slots
        flat_slots = []
        for item in slots_json:
            dt = datetime.strptime(item['date'], '%Y-%m-%d').date()
            for hr in item['hours']:
                if isinstance(hr, dict):
                    h = int(hr['h'])
                    f = int(hr.get('f', default_frequency))
                else:
                    h = int(hr)
                    f = default_frequency
                flat_slots.append({'date': dt, 'hour': h, 'frequency': f})

        if not flat_slots:
            raise ValidationError("At least one time slot must be selected.")

        # 3. Check availability (excluding THIS booking's own existing slots)
        is_available = True
        for s in flat_slots:
            load = slot_duration * s['frequency']
            check = AvailabilityService.check_availability(
                billboard.id, [s], load, exclude_booking_id=serializer.instance.id
            )
            if not check['available']:
                is_available = False
                break

        if not is_available:
            raise ValidationError({"error": "Capacity exceeded in one or more selected slots."})

        # 4. Recalculate price
        price = PricingEngine.calculate_price(billboard, flat_slots, slot_duration, default_frequency)

        # 5. Delete old slots and save the booking
        serializer.instance.slots.all().delete()
        booking = serializer.save(
            booking_status='pending',
            creative_status='pending',
            price_calculated=price
        )

        # 6. Create new slots
        for s in flat_slots:
            BookingSlot.objects.create(
                booking=booking,
                date=s['date'],
                hour=s['hour'],
                frequency_per_hour=s['frequency']
            )


# ============ OWNER VIEWS ============

class OwnerBookingsListView(generics.ListAPIView):
    serializer_class = BookingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'business']:
            return Booking.objects.filter(billboard__owner=user)
        elif user.role == 'superadmin':
            return Booking.objects.all()
        return Booking.objects.none()

class BookingApprovalView(generics.UpdateAPIView):
    serializer_class = BookingActionSerializer
    permission_classes = [IsAuthenticated]
    queryset = Booking.objects.all()
    lookup_url_kwarg = 'pk'

    def patch(self, request, *args, **kwargs):
        booking = self.get_object()
        if booking.billboard.owner != request.user and request.user.role != 'superadmin':
            raise PermissionDenied("You can only approve bookings for your own billboards")
        
        serializer = BookingActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        action = serializer.validated_data['action']
        remarks = serializer.validated_data.get('remarks', '')
        
        if action == 'approve':
            booking.booking_status = 'approved'
            booking.creative_status = 'approved'
            booking.owner_remarks = remarks if remarks else 'Approved'
            from django.utils import timezone
            booking.payment_deadline = timezone.now() + timedelta(hours=8)
        elif action == 'reject':
            booking.booking_status = 'rejected'
            booking.creative_status = 'rejected'
            booking.owner_remarks = remarks if remarks else 'Rejected'
        elif action == 'request_revision':
            booking.booking_status = 'changes_requested'
            booking.creative_status = 'changes_requested'
            booking.owner_remarks = remarks if remarks else 'Please revise the booking.'
        
        booking.save()
        return Response({
            'msg': f'Booking {action}d successfully',
            'booking_status': booking.booking_status,
            'creative_status': booking.creative_status
        }, status=status.HTTP_200_OK)


from django.utils import timezone

class OwnerOccupancyStatsView(APIView):
    """
    Provides occupancy statistics for billboards owned by the authenticated user.
    Supports periods: hourly, daily, weekly, monthly.
    Occupancy = (Booked Seconds) / (Total Seconds in interval * Number of Billboards)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in ['admin', 'business', 'superadmin']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        period = request.query_params.get('period', 'daily')
        billboard_id = request.query_params.get('billboard_id')
        now = timezone.now()
        
        # 1. Get owned billboards
        if user.role == 'superadmin':
            billboards = Billboard.objects.filter(status='approved')
        else:
            billboards = Billboard.objects.filter(owner=user)
        
        if billboard_id:
            billboards = billboards.filter(id=billboard_id)
            
        num_billboards = billboards.count()
        if num_billboards == 0:
            return Response({'stats': []})

        # 2. Define Time Intervals
        intervals = []
        if period == 'hourly':
            # Today from 00:00 to 23:00 (24 hours)
            start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
            for i in range(24):
                dt = start_of_day + timedelta(hours=i)
                intervals.append({
                    'start': dt,
                    'end': dt.replace(minute=59, second=59, microsecond=999999),
                    'label': dt.strftime('%H:00'),
                    'total_sec': 3600
                })
        elif period == 'daily':
            # This week starting from Sunday (7 days)
            # now.weekday(): 0=Mon, ..., 6=Sun. Offset to Sun: (now.weekday() + 1) % 7
            offset = (now.weekday() + 1) % 7
            start_of_week = (now - timedelta(days=offset)).replace(hour=0, minute=0, second=0, microsecond=0)
            for i in range(7):
                dt = start_of_week + timedelta(days=i)
                intervals.append({
                    'start': dt,
                    'end': dt.replace(hour=23, minute=59, second=59, microsecond=999999),
                    'label': dt.strftime('%a'),
                    'total_sec': 86400
                })
        elif period == 'weekly':
            # Last 4 weeks
            for i in range(3, -1, -1):
                dt = now - timedelta(weeks=i)
                intervals.append({
                    'start': (dt - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0),
                    'end': dt.replace(hour=23, minute=59, second=59, microsecond=999999),
                    'label': f"Week {4-i}",
                    'total_sec': 86400 * 7
                })
        elif period == 'monthly':
            # This year starting from Jan (12 months)
            year = now.year
            for i in range(1, 13):
                dt_obj = datetime(year, i, 1)
                start_dt = timezone.make_aware(dt_obj) if timezone.is_naive(dt_obj) else dt_obj
                
                if i == 12:
                    next_dt = datetime(year + 1, 1, 1)
                else:
                    next_dt = datetime(year, i + 1, 1)
                
                next_dt_aware = timezone.make_aware(next_dt) if timezone.is_naive(next_dt) else next_dt
                end_dt = next_dt_aware - timedelta(microseconds=1)
                
                intervals.append({
                    'start': start_dt,
                    'end': end_dt,
                    'label': start_dt.strftime('%b'),
                    'total_sec': (end_dt - start_dt).total_seconds()
                })

        # 3. Aggregate Bookings
        from .models import BookingSlot
        stats_data = []
        
        for inter in intervals:
            # Get all approved/active/paid slots in this interval for filtered billboards
            slots = BookingSlot.objects.filter(
                booking__billboard__in=billboards,
                booking__booking_status__in=['approved', 'active', 'paid'],
                date__gte=inter['start'].date(),
                date__lte=inter['end'].date()
            ).select_related('booking')
            
            # Filter specifically by hour if hourly
            if period == 'hourly':
                slots = slots.filter(hour=inter['start'].hour)
            
            total_booked_sec = 0
            for s in slots:
                total_booked_sec += (s.booking.slot_duration_seconds * s.frequency_per_hour)
            
            # Limit booked sec to total capacity
            max_capacity = inter['total_sec'] * num_billboards
            occupancy = (total_booked_sec / max_capacity * 100) if max_capacity > 0 else 0
            occupancy = min(100, occupancy) # Cap at 100%
            
            stats_data.append({
                'label': inter['label'],
                'occupancy': round(occupancy, 2),
                'booked_sec': total_booked_sec,
                'capacity_sec': max_capacity
            })

        return Response({'stats': stats_data})

class PayBookingView(APIView):
    """
    Endpoint for advertisers to pay for an approved booking.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
            
            # Verify the user owns the campaign for this booking
            if booking.campaign.advertiser != request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only pay for your own bookings.")
                
            # Verify booking is in 'approved' status
            if booking.booking_status != 'approved':
                return Response({'error': 'Booking must be approved before payment.'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Simulate payment processing success
            booking.booking_status = 'paid'
            booking.save()
            
            return Response({'msg': 'Payment successful', 'booking_status': booking.booking_status}, status=status.HTTP_200_OK)
            
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DownloadReportView(APIView):
    """
    Generate and serve a downloadable CSV report based on the user's role.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        import csv
        from django.http import HttpResponse
        user = request.user
        role = user.role

        # 1. Query the appropriate bookings
        if role == 'superadmin':
            bookings = Booking.objects.all()
        elif role in ['business', 'admin']:
            bookings = Booking.objects.filter(billboard__owner=user)
        elif role == 'advertiser':
            bookings = Booking.objects.filter(campaign__advertiser=user)
        else:
            bookings = Booking.objects.none()

        bookings = bookings.select_related('campaign', 'campaign__advertiser', 'billboard', 'billboard__owner').order_by('-created_at')

        # 2. Setup the HTTP Response for CSV download
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="platform-report.csv"'

        writer = csv.writer(response)
        
        # 3. Write Headers
        writer.writerow([
            'Transaction ID',
            'Campaign Name',
            'Billboard Title',
            'Location',
            'Advertiser Email',
            'Owner Email',
            'Start Date',
            'End Date',
            'Price (NRs)',
            'Status',
            'Booked On'
        ])

        # 4. Write Data Rows
        for b in bookings:
            writer.writerow([
                f"#{str(b.id).zfill(5)}",
                b.campaign.name if b.campaign else f"Campaign #{b.campaign_id}",
                b.billboard.title if b.billboard else f"Billboard #{b.billboard_id}",
                b.billboard.location if b.billboard else "N/A",
                b.campaign.advertiser.email if (b.campaign and b.campaign.advertiser) else "N/A",
                b.billboard.owner.email if (b.billboard and b.billboard.owner) else "N/A",
                b.start_date.strftime('%Y-%m-%d') if b.start_date else "N/A",
                b.end_date.strftime('%Y-%m-%d') if b.end_date else "N/A",
                b.price_calculated,
                b.get_booking_status_display() if hasattr(b, 'get_booking_status_display') else b.booking_status,
                b.created_at.strftime('%Y-%m-%d %H:%M:%S') if getattr(b, 'created_at', None) else "N/A"
            ])

        return response
