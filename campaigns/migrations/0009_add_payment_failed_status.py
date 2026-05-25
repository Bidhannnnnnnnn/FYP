# Generated migration to add payment_failed status to Booking model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('campaigns', '0008_booking_platform_commission_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='booking',
            name='booking_status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending Approval'),
                    ('approved', 'Approved'),
                    ('changes_requested', 'Changes Requested'),
                    ('rejected', 'Rejected'),
                    ('paid', 'Paid'),
                    ('active', 'Active'),
                    ('payment_failed', 'Payment Failed'),
                ],
                default='pending',
                max_length=20
            ),
        ),
    ]
