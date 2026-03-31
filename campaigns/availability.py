from django.db.models import Sum
from django.utils import timezone
from .models import Booking, BookingSlot

class AvailabilityService:
    MAX_SECONDS_PER_HOUR = 3600

    @staticmethod
    def calculate_booked_seconds(billboard_id, date, hour, include_pending=True, exclude_booking_id=None):
        status_filter = ['paid', 'active']
        if include_pending:
            status_filter += ['pending', 'changes_requested']
        # Include approved only if payment deadline hasn't passed
        now = timezone.now()
        qs = BookingSlot.objects.filter(
            booking__billboard_id=billboard_id,
            booking__booking_status__in=status_filter,
            date=date,
            hour=hour
        ).select_related('booking')

        # Also include approved bookings whose payment deadline hasn't expired yet
        approved_qs = BookingSlot.objects.filter(
            booking__billboard_id=billboard_id,
            booking__booking_status='approved',
            date=date,
            hour=hour
        ).filter(
            booking__payment_deadline__gt=now
        ).select_related('booking')

        if exclude_booking_id:
            qs = qs.exclude(booking_id=exclude_booking_id)
            approved_qs = approved_qs.exclude(booking_id=exclude_booking_id)

        total_seconds = 0
        for slot in list(qs) + list(approved_qs):
            booking = slot.booking
            freq = getattr(slot, 'frequency_per_hour', booking.frequency_per_hour)
            total_seconds += (booking.slot_duration_seconds * freq)

        return total_seconds

    @staticmethod
    def check_availability(billboard_id, slots_data, requested_seconds, exclude_booking_id=None):
        """
        Checks if a new booking fits across multiple date/hour combinations.
        slots_data: list of {'date': date_obj, 'hour': int}
        requested_seconds: slot_duration * frequency
        exclude_booking_id: optionally exclude a booking's own slots (used for revisions)
        """
        results = []
        is_available = True
        
        for slot_info in slots_data:
            dt = slot_info['date']
            hr = slot_info['hour']
            
            total_load = AvailabilityService.calculate_booked_seconds(billboard_id, dt, hr, include_pending=True, exclude_booking_id=exclude_booking_id)
            confirmed_load = AvailabilityService.calculate_booked_seconds(billboard_id, dt, hr, include_pending=False, exclude_booking_id=exclude_booking_id)
            
            remaining = AvailabilityService.MAX_SECONDS_PER_HOUR - total_load
            fits = (total_load + requested_seconds <= AvailabilityService.MAX_SECONDS_PER_HOUR)
            
            if not fits:
                is_available = False
                
            results.append({
                'date': dt,
                'hour': hr,
                'total_load': total_load,
                'confirmed_load': confirmed_load,
                'remaining_seconds': max(0, remaining),
                'fits': fits
            })
            
        return {
            'available': is_available,
            'slots': results
        }
