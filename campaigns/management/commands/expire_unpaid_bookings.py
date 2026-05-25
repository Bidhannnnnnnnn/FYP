"""
Management command to expire bookings with missed payment deadlines.

This command should be run periodically (e.g., via cron job or scheduled task)
to automatically mark approved bookings as 'payment_failed' when their payment
deadline has passed.

Usage:
    python manage.py expire_unpaid_bookings
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from campaigns.models import Booking, BookingSlot
from account.models import Notification
from account import email_service


class Command(BaseCommand):
    help = 'Expire approved bookings whose payment deadline has passed'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be expired without actually expiring',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        now = timezone.now()

        # Find all approved bookings with expired payment deadlines
        expired_bookings = Booking.objects.filter(
            booking_status='approved',
            payment_deadline__isnull=False,
            payment_deadline__lt=now
        ).select_related('campaign__advertiser', 'billboard__owner')

        count = expired_bookings.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS('No expired bookings found.'))
            return

        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would expire {count} booking(s):')
            )
            for booking in expired_bookings:
                self.stdout.write(
                    f'  - Booking #{booking.id}: {booking.campaign.name} '
                    f'(deadline: {booking.payment_deadline})'
                )
            return

        # Process each expired booking
        expired_count = 0
        for booking in expired_bookings:
            try:
                # Mark as payment_failed
                booking.booking_status = 'payment_failed'
                booking.owner_remarks = (
                    f"Payment deadline expired on {booking.payment_deadline.strftime('%Y-%m-%d %H:%M')}. "
                    "Booking automatically cancelled."
                )
                
                # Clear any pending payout amounts (they were never paid)
                booking.vat_amount = None
                booking.platform_commission = None
                booking.owner_payout_amount = None
                
                booking.save()

                # Delete the booking slots to free up capacity
                BookingSlot.objects.filter(booking=booking).delete()

                # Create notification for advertiser
                Notification.objects.create(
                    recipient=booking.campaign.advertiser,
                    actor=None,  # System action
                    notification_type='booking_update',
                    message=(
                        f"Payment deadline expired for booking '{booking.billboard.title}'. "
                        f"Booking has been cancelled and slots released."
                    ),
                    target_id=str(booking.id)
                )

                # Create notification for billboard owner
                Notification.objects.create(
                    recipient=booking.billboard.owner,
                    actor=None,  # System action
                    notification_type='booking_update',
                    message=(
                        f"Booking for '{booking.billboard.title}' by {booking.campaign.advertiser.name} "
                        f"was cancelled due to missed payment deadline. Slots are now available."
                    ),
                    target_id=str(booking.id)
                )

                # Send email notifications
                try:
                    email_service.send_payment_deadline_expired_to_advertiser(booking)
                    email_service.send_payment_deadline_expired_to_owner(booking)
                except Exception as email_error:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Failed to send email for booking #{booking.id}: {email_error}'
                        )
                    )

                expired_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Expired booking #{booking.id}: {booking.campaign.name}'
                    )
                )

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Failed to expire booking #{booking.id}: {str(e)}'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully expired {expired_count} out of {count} booking(s).'
            )
        )
