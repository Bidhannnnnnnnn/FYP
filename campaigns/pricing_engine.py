from decimal import Decimal
from .constants import get_multiplier_for_hour

class PricingEngine:
    """
    Advanced Dynamic Pricing Engine for Billboard Bookings.
    Factors:
    - Base Rate (Billboard specific)
    - Slot Duration (10s is base)
    - Frequency (Slots per hour)
    - Seasonality (Month-based)
    - Time of Day (Hourly multipliers)
    """

    BASE_SLOT_DURATION = 10  # Seconds
    BASE_FREQUENCY = 10      # Times per hour

    @staticmethod
    def calculate_price(billboard, slots_data, slot_duration, frequency):
        """
        Calculate total price for a booking by summing hourly rates.
        slots_data: list of {'date': date_obj, 'hour': int}
        """
        
        base_rate = Decimal(billboard.base_price)
        if base_rate < 10:
            base_rate = Decimal(10.00)
        
        # Hourly base rate (Base Price is for a full day of 10s x 10shots)
        # We define hourly_base = base_rate / 24
        hourly_base = base_rate / Decimal(24)
        
        duration_multiplier = Decimal(slot_duration) / Decimal(PricingEngine.BASE_SLOT_DURATION)
        frequency_multiplier = Decimal(frequency) / Decimal(PricingEngine.BASE_FREQUENCY)
        
        total_price = Decimal(0)
        
        for slot in slots_data:
            dt = slot['date']
            hr = slot['hour']
            # Use specific frequency for this slot if provided, else use the default
            freq = slot.get('frequency', frequency)
            
            # Seasonality (Simple month-based logic)
            seasonality_multiplier = Decimal(1.5) if dt.month in [10, 11, 12] else Decimal(1.0)
            
            # Time of Day Multiplier from constants
            time_multiplier = Decimal(get_multiplier_for_hour(hr))
            
            # Traffic Density Modifier
            traffic_multiplier = Decimal(1.0)
            if hasattr(billboard, 'traffic_density'):
                if billboard.traffic_density == 'High' or billboard.traffic_density == 10:
                    traffic_multiplier = Decimal(1.2)
                elif billboard.traffic_density == 'Low' or billboard.traffic_density == 1:
                    traffic_multiplier = Decimal(0.8)

            # Weekend Multiplier (Saturdays=5, Sundays=6)
            is_weekend = dt.weekday() == 5
            weekend_multiplier = Decimal(billboard.weekend_multiplier) if is_weekend else Decimal(1.0)
            
            # Location Tier Multiplier
            tier_mults = {'standard': Decimal(1.0), 'prime': Decimal(1.5), 'ultra': Decimal(2.0)}
            location_multiplier = tier_mults.get(getattr(billboard, 'location_tier', 'standard'), Decimal(1.0))
            
            # Visibility Multiplier (score 1-10, base 5)
            # base = 1.0, step = 0.05. Score 10 -> +0.25 (1.25x), Score 1 -> -0.20 (0.80x)
            vis_score = billboard.visibility_score or 5
            visibility_multiplier = Decimal(1.0) + (Decimal(vis_score) - Decimal(5)) * Decimal(0.05)

            # Frequency Multiplier for this specific hour
            frequency_multiplier = Decimal(freq) / Decimal(PricingEngine.BASE_FREQUENCY)

            # Hour Cost calculation
            hour_cost = (hourly_base * time_multiplier * seasonality_multiplier * 
                         traffic_multiplier * weekend_multiplier * location_multiplier * 
                         visibility_multiplier * duration_multiplier * frequency_multiplier)

            
            total_price += hour_cost
            
        return round(total_price, 2)
