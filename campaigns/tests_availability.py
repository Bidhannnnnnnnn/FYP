from django.test import TestCase
from django.contrib.auth import get_user_model
from billboards.models import Billboard
from campaigns.models import Campaign, Booking
from campaigns.availability import AvailabilityService
from datetime import date, timedelta

User = get_user_model()

class AvailabilityServiceTest(TestCase):
    def setUp(self):
        self.advertiser = User.objects.create_user(email='ad@test.com', password='password', role='advertiser', name='Test Ad', tc=True)
        self.owner = User.objects.create_user(email='owner@test.com', password='password', role='admin', name='Test Owner', tc=True)
        
        self.billboard = Billboard.objects.create(
            owner=self.owner,
            title="Test Billboard",
            location="Test Location",
            daily_rate=100
        )
        
        self.campaign = Campaign.objects.create(
            advertiser=self.advertiser,
            name="Test Campaign",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7),
            budget=1000,
            status='active'
        )

    def test_pending_booking_blocks_availability(self):
        """
        A pending booking should reduce the available capacity for new bookings.
        """
        # Create a pending booking that takes 2000 seconds/hour (out of 3600)
        Booking.objects.create(
            campaign=self.campaign,
            billboard=self.billboard,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7),
            slot_duration_seconds=20,
            frequency_per_hour=100, # 2000 seconds
            price_calculated=500,
            booking_status='pending'
        )
        
        # Check availability for another 2000 seconds - should be unavailable
        # Total load is 2000, max is 3600. 2000 + 2000 = 4000 > 3600.
        check = AvailabilityService.check_availability(
            self.billboard.id, 
            date.today(), 
            date.today() + timedelta(days=7), 
            2000
        )
        self.assertFalse(check['available'])
        self.assertEqual(check['total_load'], 2000)
        self.assertEqual(check['confirmed_load'], 0)

        # Check availability for 1500 seconds - should be available
        # 2000 + 1500 = 3500 <= 3600
        check = AvailabilityService.check_availability(
            self.billboard.id, 
            date.today(), 
            date.today() + timedelta(days=7), 
            1500
        )
        self.assertTrue(check['available'])

    def test_rejected_booking_releases_capacity(self):
        """
        A rejected booking should NOT reduce the available capacity.
        """
        Booking.objects.create(
            campaign=self.campaign,
            billboard=self.billboard,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7),
            slot_duration_seconds=30,
            frequency_per_hour=100, # 3000 seconds
            price_calculated=500,
            booking_status='rejected'
        )
        
        # Check availability for 1000 seconds - should be available because rejected doesn't count
        check = AvailabilityService.check_availability(
            self.billboard.id, 
            date.today(), 
            date.today() + timedelta(days=7), 
            1000
        )
        self.assertTrue(check['available'])
        self.assertEqual(check['total_load'], 0)

    def test_revision_requested_blocks_capacity(self):
        """
        A booking with 'changes_requested' should still block capacity.
        """
        Booking.objects.create(
            campaign=self.campaign,
            billboard=self.billboard,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7),
            slot_duration_seconds=30,
            frequency_per_hour=100, # 3000 seconds
            price_calculated=500,
            booking_status='changes_requested'
        )
        
        check = AvailabilityService.check_availability(
            self.billboard.id, 
            date.today(), 
            date.today() + timedelta(days=7), 
            1000
        )
        self.assertFalse(check['available'])
        self.assertEqual(check['total_load'], 3000)
