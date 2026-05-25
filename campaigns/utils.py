"""
Utility functions for the campaigns app.
Covers eSewa ePay-v2 payment helpers: VAT breakdown, HMAC signature, UUID parsing.
"""
import re
import hmac
import hashlib
import base64
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings


def compute_vat_breakdown(price_calculated):
    """
    Reverse-extract 13% VAT from a VAT-inclusive total.

    Nepal's 13% VAT is already embedded in price_calculated.
    Formula: vat = total * 13 / 113  (reverse extraction)
             base = total - vat

    Returns:
        (base_amount, vat_amount) — both Decimal, rounded to 2 decimal places.

    Example:
        compute_vat_breakdown(Decimal('1000.00'))
        → (Decimal('886.73'), Decimal('113.27'))
    """
    total = Decimal(str(price_calculated))
    vat = (total * Decimal('13') / Decimal('113')).quantize(
        Decimal('0.01'), rounding=ROUND_HALF_UP
    )
    base = total - vat
    return base, vat


def generate_signature(total_amount, transaction_uuid, product_code):
    """
    Generate the HMAC-SHA256 signature required by eSewa ePay-v2.

    According to eSewa documentation, the message format is:
    "total_amount={value},transaction_uuid={value},product_code={value}"

    The key is settings.ESEWA_SECRET_KEY.

    Returns:
        Base64-encoded UTF-8 string of the HMAC-SHA256 digest.
    """
    message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    secret = settings.ESEWA_SECRET_KEY.encode('utf-8')
    digest = hmac.new(secret, message.encode('utf-8'), hashlib.sha256).digest()
    return base64.b64encode(digest).decode('utf-8')


def parse_booking_id(transaction_uuid):
    """
    Extract the booking ID from a transaction_uuid string.

    Expected format: BIMBASETU-{booking_id}-{unix_timestamp_ms}

    Returns:
        int — the booking ID.

    Raises:
        ValueError — if the format does not match.
    """
    match = re.match(r'^BIMBASETU-(\d+)-\d+$', transaction_uuid)
    if not match:
        raise ValueError(
            f"Invalid transaction_uuid format: '{transaction_uuid}'. "
            "Expected BIMBASETU-{{booking_id}}-{{timestamp_ms}}"
        )
    return int(match.group(1))
