from django.db.models import Sum
from .models import Booking, BookingSlot

class AvailabilityService:
    MAX_SECONDS_PER_HOUR = 3600

    @staticmethod
    def calculate_booked_seconds(billboard_id, date, hour, include_pending=True):
        """
        Calculates the total seconds booked for a specific billboard, date, and hour.
        """
        status_filter = ['approved', 'active', 'paid']
        if include_pending:
            status_filter += ['pending', 'changes_requested']

        # Get all bookings that cover this specific date and hour
        # We look at the BookingSlot join to see which bookings are active then
        slots = BookingSlot.objects.filter(
            booking__billboard_id=billboard_id,
            booking__booking_status__in=status_filter,
            date=date,
            hour=hour
        ).select_related('booking')

        total_seconds = 0
        for slot in slots:
            booking = slot.booking
            # Use slot-level frequency if available, otherwise fallback to booking-level (for legacy)
            freq = getattr(slot, 'frequency_per_hour', booking.frequency_per_hour)
            total_seconds += (booking.slot_duration_seconds * freq)

        return total_seconds

    @staticmethod
    def check_availability(billboard_id, slots_data, requested_seconds):
        """
        Checks if a new booking fits across multiple date/hour combinations.
        slots_data: list of {'date': date_obj, 'hour': int}
        requested_seconds: slot_duration * frequency
        """
        results = []
        is_available = True
        
        for slot_info in slots_data:
            dt = slot_info['date']
            hr = slot_info['hour']
            
            total_load = AvailabilityService.calculate_booked_seconds(billboard_id, dt, hr, include_pending=True)
            confirmed_load = AvailabilityService.calculate_booked_seconds(billboard_id, dt, hr, include_pending=False)
            
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
