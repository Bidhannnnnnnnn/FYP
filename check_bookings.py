from campaigns.models import Booking
from django.db.models import Sum

print('=== BOOKING STATUS SUMMARY ===\n')

statuses = ['pending', 'approved', 'paid', 'active', 'payment_failed', 'rejected', 'changes_requested']

for status in statuses:
    bookings = Booking.objects.filter(booking_status=status)
    count = bookings.count()
    total = bookings.aggregate(total=Sum('price_calculated'))['total'] or 0
    if count > 0:
        print(f'{status.upper()}: {count} bookings, Total: NRs. {total:,.2f}')

print('\n=== WHAT ADVERTISER SHOULD SEE ===')
paid_active = Booking.objects.filter(booking_status__in=['paid', 'active'])
invested = paid_active.aggregate(total=Sum('price_calculated'))['total'] or 0
print(f'Invested Amount (paid + active only): NRs. {invested:,.2f}')

print('\n=== ALL BOOKINGS (WRONG CALCULATION) ===')
all_bookings = Booking.objects.all()
wrong_total = all_bookings.aggregate(total=Sum('price_calculated'))['total'] or 0
print(f'Total if counting ALL bookings: NRs. {wrong_total:,.2f}')
