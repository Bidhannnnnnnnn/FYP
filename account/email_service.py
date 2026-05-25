import logging
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)

# Base URL for action links — update this when deployed
FRONTEND_URL = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')


# ---------------------------------------------------------------------------
# Shared HTML layout
# ---------------------------------------------------------------------------

def _base_html(recipient_name, headline, subheadline, body_rows_html, action_url=None, action_label=None, accent_color="#4F46E5"):
    """
    Renders a full HTML email using an inline-styled, email-client-safe layout.
    """
    action_button = ""
    if action_url and action_label:
        action_button = f"""
        <tr>
          <td align="center" style="padding: 28px 0 8px 0;">
            <a href="{action_url}"
               style="display:inline-block; background:{accent_color}; color:#ffffff;
                      font-family:Arial,sans-serif; font-size:15px; font-weight:700;
                      text-decoration:none; padding:14px 36px; border-radius:8px;
                      letter-spacing:0.3px;">
              {action_label}
            </a>
          </td>
        </tr>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bimbasetu</title>
</head>
<body style="margin:0; padding:0; background-color:#F3F4F6; font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F4F6; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px; width:100%; background:#ffffff;
                      border-radius:16px; overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:{accent_color}; padding:32px 40px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:800;
                         letter-spacing:1px; font-family:Arial,sans-serif;">
                📋 Bimbasetu
              </h1>
              <p style="margin:6px 0 0 0; color:rgba(255,255,255,0.85);
                        font-size:13px; font-family:Arial,sans-serif;">
                Billboard Advertising Platform
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 20px 40px;">
              <h2 style="margin:0 0 6px 0; color:#111827; font-size:20px;
                         font-weight:700; font-family:Arial,sans-serif;">
                {headline}
              </h2>
              <p style="margin:0 0 24px 0; color:#6B7280; font-size:14px;
                        font-family:Arial,sans-serif;">
                {subheadline}
              </p>

              <!-- Greeting -->
              <p style="margin:0 0 20px 0; color:#374151; font-size:15px;
                        font-family:Arial,sans-serif;">
                Hi <strong>{recipient_name}</strong>,
              </p>

              <!-- Detail rows -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#F9FAFB; border-radius:10px;
                            border:1px solid #E5E7EB; margin-bottom:8px;">
                {body_rows_html}
              </table>

              <!-- Action button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                {action_button}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB; border-top:1px solid #E5E7EB;
                       padding:24px 40px; text-align:center;">
              <p style="margin:0 0 6px 0; color:#9CA3AF; font-size:12px;
                        font-family:Arial,sans-serif;">
                You received this email because you have an account on
                <a href="{FRONTEND_URL}" style="color:{accent_color}; text-decoration:none;">Bimbasetu</a>.
              </p>
              <p style="margin:0; color:#9CA3AF; font-size:12px;
                        font-family:Arial,sans-serif;">
                To stop receiving emails, update your
                <a href="{FRONTEND_URL}/profile" style="color:{accent_color}; text-decoration:none;">
                  notification preferences
                </a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _row(label, value):
    """Single detail row inside the info table."""
    return f"""
    <tr>
      <td style="padding:12px 20px; border-bottom:1px solid #E5E7EB;">
        <span style="color:#6B7280; font-size:12px; font-weight:600;
                     text-transform:uppercase; letter-spacing:0.5px;
                     font-family:Arial,sans-serif;">{label}</span><br/>
        <span style="color:#111827; font-size:14px; font-weight:500;
                     font-family:Arial,sans-serif;">{value}</span>
      </td>
    </tr>"""


def _row_last(label, value):
    """Last row — no bottom border."""
    return f"""
    <tr>
      <td style="padding:12px 20px;">
        <span style="color:#6B7280; font-size:12px; font-weight:600;
                     text-transform:uppercase; letter-spacing:0.5px;
                     font-family:Arial,sans-serif;">{label}</span><br/>
        <span style="color:#111827; font-size:14px; font-weight:500;
                     font-family:Arial,sans-serif;">{value}</span>
      </td>
    </tr>"""


def _alert_row(label, value, bg="#FEF3C7", text_color="#92400E"):
    """Highlighted row for warnings like payment deadlines."""
    return f"""
    <tr>
      <td style="padding:12px 20px; background:{bg}; border-radius:0 0 10px 10px;">
        <span style="color:{text_color}; font-size:12px; font-weight:700;
                     text-transform:uppercase; letter-spacing:0.5px;
                     font-family:Arial,sans-serif;">⚠ {label}</span><br/>
        <span style="color:{text_color}; font-size:14px; font-weight:600;
                     font-family:Arial,sans-serif;">{value}</span>
      </td>
    </tr>"""


# ---------------------------------------------------------------------------
# Internal send helper
# ---------------------------------------------------------------------------

def _send(subject, html_body, plain_body, recipient):
    """
    Checks opt-out, then sends an HTML email with plain-text fallback.
    Swallows all exceptions so callers are never interrupted.
    """
    if not getattr(recipient, 'email_notifications_enabled', True):
        return
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient.email],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
    except Exception:
        logger.exception("Failed to send email '%s' to %s", subject, recipient.email)


# ---------------------------------------------------------------------------
# Booking events
# ---------------------------------------------------------------------------

def send_booking_request_to_owner(booking):
    owner = booking.billboard.owner
    advertiser = booking.campaign.advertiser
    subject = f"New Booking Request — {booking.billboard.title}"

    rows = (
        _row("Billboard", booking.billboard.title) +
        _row("Advertiser", f"{advertiser.name} ({advertiser.email})") +
        _row("Campaign", booking.campaign.name) +
        _row("Booking ID", f"#{booking.id}") +
        _row_last("Dates", f"{booking.start_date} → {booking.end_date}")
    )
    html = _base_html(
        recipient_name=owner.name,
        headline="You have a new booking request!",
        subheadline="An advertiser wants to book your billboard. Review and respond below.",
        body_rows_html=rows,
        action_url=f"{FRONTEND_URL}/owner/requests",
        action_label="Review Booking Request",
        accent_color="#4F46E5",
    )
    plain = (
        f"Hi {owner.name},\n\nNew booking request for '{booking.billboard.title}' "
        f"from {advertiser.name}.\nBooking ID: #{booking.id}\n"
        f"Dates: {booking.start_date} to {booking.end_date}\n\n"
        f"Log in at {FRONTEND_URL}/owner/requests to review.\n\n— Bimbasetu"
    )
    _send(subject, html, plain, owner)


def send_booking_request_to_superadmins(booking, superadmins):
    advertiser = booking.campaign.advertiser
    subject = f"New Booking Submitted — {booking.campaign.name}"

    rows = (
        _row("Campaign", booking.campaign.name) +
        _row("Billboard", booking.billboard.title) +
        _row("Advertiser", f"{advertiser.name} ({advertiser.email})") +
        _row("Booking ID", f"#{booking.id}") +
        _row_last("Dates", f"{booking.start_date} → {booking.end_date}")
    )
    for admin in superadmins:
        html = _base_html(
            recipient_name=admin.name,
            headline="A new booking has been submitted.",
            subheadline="Here's a summary of the new booking on the platform.",
            body_rows_html=rows,
            action_url=f"{FRONTEND_URL}/admin/bookings",
            action_label="View in Admin Panel",
            accent_color="#4F46E5",
        )
        plain = (
            f"Hi {admin.name},\n\nNew booking: '{booking.campaign.name}' on "
            f"'{booking.billboard.title}' by {advertiser.name}.\n"
            f"Booking ID: #{booking.id}\n\n— Bimbasetu"
        )
        _send(subject, html, plain, admin)


def send_booking_status_update(booking):
    advertiser = booking.campaign.advertiser
    status_display = booking.get_booking_status_display()

    # Pick accent color based on status
    color_map = {
        'approved': '#059669',
        'paid': '#059669',
        'active': '#059669',
        'rejected': '#DC2626',
        'changes_requested': '#D97706',
        'pending': '#4F46E5',
    }
    accent = color_map.get(booking.booking_status, '#4F46E5')

    subject = f"Booking Update — {booking.billboard.title} is now {status_display}"

    rows = (
        _row("Billboard", booking.billboard.title) +
        _row("Booking ID", f"#{booking.id}") +
        _row("New Status", status_display)
    )
    if booking.owner_remarks:
        rows += _row("Owner's Note", booking.owner_remarks)
    if booking.booking_status == 'approved' and booking.payment_deadline:
        rows += _alert_row(
            "Payment Deadline",
            booking.payment_deadline.strftime('%d %b %Y, %H:%M'),
        )
    else:
        rows = rows[:-len(_row("", ""))]  # close normally
        rows += _row_last("Campaign", booking.campaign.name)

    html = _base_html(
        recipient_name=advertiser.name,
        headline=f"Your booking status has changed.",
        subheadline=f"Status updated to: {status_display}",
        body_rows_html=rows,
        action_url=f"{FRONTEND_URL}/booking/{booking.id}",
        action_label="View Booking Details",
        accent_color=accent,
    )
    plain = (
        f"Hi {advertiser.name},\n\nYour booking for '{booking.billboard.title}' "
        f"is now: {status_display}.\nBooking ID: #{booking.id}\n\n"
        f"View it at {FRONTEND_URL}/booking/{booking.id}\n\n— Bimbasetu"
    )
    _send(subject, html, plain, advertiser)


# ---------------------------------------------------------------------------
# Billboard events
# ---------------------------------------------------------------------------

def send_billboard_submission_to_superadmins(billboard, superadmins):
    subject = f"New Billboard Submitted — {billboard.title}"

    rows = (
        _row("Billboard Title", billboard.title) +
        _row("Owner", f"{billboard.owner.name} ({billboard.owner.email})") +
        _row("Location", billboard.location) +
        _row_last("Billboard ID", f"#{billboard.id}")
    )
    for admin in superadmins:
        html = _base_html(
            recipient_name=admin.name,
            headline="A new billboard needs your review.",
            subheadline="A billboard owner has submitted a new listing for approval.",
            body_rows_html=rows,
            action_url=f"{FRONTEND_URL}/admin/billboards",
            action_label="Review in Admin Panel",
            accent_color="#4F46E5",
        )
        plain = (
            f"Hi {admin.name},\n\nNew billboard '{billboard.title}' submitted by "
            f"{billboard.owner.name}.\nLocation: {billboard.location}\n\n"
            f"Review at {FRONTEND_URL}/admin/billboards\n\n— Bimbasetu"
        )
        _send(subject, html, plain, admin)


def send_billboard_status_update_to_owner(billboard):
    owner = billboard.owner
    status_display = billboard.get_status_display()

    color_map = {
        'approved': '#059669',
        'rejected': '#DC2626',
        'hidden': '#6B7280',
        'pending': '#D97706',
    }
    accent = color_map.get(billboard.status, '#4F46E5')

    subject = f"Billboard Update — '{billboard.title}' is now {status_display}"

    rows = (
        _row("Billboard", billboard.title) +
        _row("New Status", status_display)
    )
    if billboard.feedback_message:
        rows += _row_last("Admin Feedback", billboard.feedback_message)
    else:
        rows += _row_last("Location", billboard.location)

    html = _base_html(
        recipient_name=owner.name,
        headline="Your billboard status has been updated.",
        subheadline=f"Status: {status_display}",
        body_rows_html=rows,
        action_url=f"{FRONTEND_URL}/billboard-manage/{billboard.id}",
        action_label="View Billboard",
        accent_color=accent,
    )
    plain = (
        f"Hi {owner.name},\n\nYour billboard '{billboard.title}' is now: {status_display}.\n"
        f"View it at {FRONTEND_URL}/billboard-manage/{billboard.id}\n\n— Bimbasetu"
    )
    _send(subject, html, plain, owner)


def send_billboard_resubmission_to_superadmins(billboard, superadmins):
    subject = f"Billboard Resubmitted — {billboard.title}"

    rows = (
        _row("Billboard Title", billboard.title) +
        _row("Owner", f"{billboard.owner.name} ({billboard.owner.email})") +
        _row_last("Billboard ID", f"#{billboard.id}")
    )
    for admin in superadmins:
        html = _base_html(
            recipient_name=admin.name,
            headline="A billboard has been resubmitted for review.",
            subheadline="The owner has made updates and is requesting re-approval.",
            body_rows_html=rows,
            action_url=f"{FRONTEND_URL}/admin/billboards",
            action_label="Review in Admin Panel",
            accent_color="#D97706",
        )
        plain = (
            f"Hi {admin.name},\n\nBillboard '{billboard.title}' by "
            f"{billboard.owner.name} has been resubmitted.\n\n"
            f"Review at {FRONTEND_URL}/admin/billboards\n\n— Bimbasetu"
        )
        _send(subject, html, plain, admin)


# ---------------------------------------------------------------------------
# Account ban / unban
# ---------------------------------------------------------------------------

def send_ban_notification(user, ban_reason):
    subject = "Your Bimbasetu Account Has Been Suspended"

    rows = (
        _row("Account", user.email) +
        _row_last("Reason", ban_reason)
    )
    html = _base_html(
        recipient_name=user.name,
        headline="Your account has been suspended.",
        subheadline="An administrator has suspended your Bimbasetu account.",
        body_rows_html=rows,
        action_url=f"{FRONTEND_URL}/banned",
        action_label="Submit an Appeal",
        accent_color="#DC2626",
    )
    plain = (
        f"Hi {user.name},\n\nYour Bimbasetu account has been suspended.\n"
        f"Reason: {ban_reason}\n\n"
        f"You can appeal at {FRONTEND_URL}/banned\n\n— Bimbasetu"
    )
    _send(subject, html, plain, user)


def send_unban_notification(user):
    subject = "Your Bimbasetu Account Has Been Reinstated"

    rows = _row_last("Account", user.email)
    html = _base_html(
        recipient_name=user.name,
        headline="Great news — you're back! 🎉",
        subheadline="Your account suspension has been lifted by an administrator.",
        body_rows_html=rows,
        action_url=f"{FRONTEND_URL}/login",
        action_label="Log In to Bimbasetu",
        accent_color="#059669",
    )
    plain = (
        f"Hi {user.name},\n\nYour Bimbasetu account suspension has been lifted.\n"
        f"Log in at {FRONTEND_URL}/login\n\n— Bimbasetu"
    )
    _send(subject, html, plain, user)


# ---------------------------------------------------------------------------
# Ban appeal events
# ---------------------------------------------------------------------------

def send_appeal_submitted_to_superadmins(appeal, superadmins):
    subject = f"New Ban Appeal — {appeal.user.name}"

    rows = (
        _row("User", f"{appeal.user.name} ({appeal.user.email})") +
        _row("Appeal ID", f"#{appeal.id}") +
        _row_last("Message", appeal.appeal_text[:300] + ("..." if len(appeal.appeal_text) > 300 else ""))
    )
    for admin in superadmins:
        html = _base_html(
            recipient_name=admin.name,
            headline="A banned user has submitted an appeal.",
            subheadline="Review the appeal and respond in the admin panel.",
            body_rows_html=rows,
            action_url=f"{FRONTEND_URL}/admin/users",
            action_label="Review Appeal",
            accent_color="#D97706",
        )
        plain = (
            f"Hi {admin.name},\n\nNew ban appeal from {appeal.user.name} ({appeal.user.email}).\n"
            f"Message: {appeal.appeal_text}\n\n"
            f"Review at {FRONTEND_URL}/admin/users\n\n— Bimbasetu"
        )
        _send(subject, html, plain, admin)


def send_appeal_approved_to_user(appeal):
    subject = "Your Ban Appeal Has Been Approved ✓"

    rows = (
        _row("Appeal ID", f"#{appeal.id}") +
        _row_last("Admin Response", appeal.admin_response or "Your account has been reinstated.")
    )
    html = _base_html(
        recipient_name=appeal.user.name,
        headline="Your appeal has been approved! 🎉",
        subheadline="Your Bimbasetu account has been fully reinstated.",
        body_rows_html=rows,
        action_url=f"{FRONTEND_URL}/login",
        action_label="Log In to Bimbasetu",
        accent_color="#059669",
    )
    plain = (
        f"Hi {appeal.user.name},\n\nYour ban appeal has been approved.\n"
        f"Response: {appeal.admin_response or 'Your account has been reinstated.'}\n\n"
        f"Log in at {FRONTEND_URL}/login\n\n— Bimbasetu"
    )
    _send(subject, html, plain, appeal.user)


def send_appeal_rejected_to_user(appeal):
    subject = "Your Ban Appeal Has Been Reviewed"

    rows = (
        _row("Appeal ID", f"#{appeal.id}") +
        _row_last("Admin Response", appeal.admin_response or "No additional details provided.")
    )
    html = _base_html(
        recipient_name=appeal.user.name,
        headline="Your appeal has been reviewed.",
        subheadline="Unfortunately, your appeal was not approved at this time.",
        body_rows_html=rows,
        accent_color="#DC2626",
    )
    plain = (
        f"Hi {appeal.user.name},\n\nYour ban appeal has been rejected.\n"
        f"Response: {appeal.admin_response or 'No additional details provided.'}\n\n— Bimbasetu"
    )
    _send(subject, html, plain, appeal.user)


# ---------------------------------------------------------------------------
# Payment deadline expiration
# ---------------------------------------------------------------------------

def send_payment_deadline_expired_to_advertiser(booking):
    """Notify advertiser that their payment deadline has expired."""
    advertiser = booking.campaign.advertiser
    subject = f"Payment Deadline Expired — Booking Cancelled"

    rows = (
        _row("Billboard", booking.billboard.title) +
        _row("Booking ID", f"#{booking.id}") +
        _row("Campaign", booking.campaign.name) +
        _row("Dates", f"{booking.start_date} → {booking.end_date}") +
        _row("Amount", f"NRs. {booking.price_calculated}") +
        _alert_row(
            "Deadline Expired",
            booking.payment_deadline.strftime('%d %b %Y, %H:%M'),
            bg="#FEE2E2",
            text_color="#991B1B"
        )
    )
    html = _base_html(
        recipient_name=advertiser.name,
        headline="Payment deadline has expired.",
        subheadline="Your booking has been automatically cancelled due to missed payment.",
        body_rows_html=rows,
        action_url=f"{FRONTEND_URL}/bookings",
        action_label="View My Bookings",
        accent_color="#DC2626",
    )
    plain = (
        f"Hi {advertiser.name},\n\nYour payment deadline for booking #{booking.id} "
        f"('{booking.billboard.title}') has expired.\n"
        f"The booking has been cancelled and slots have been released.\n\n"
        f"Amount: NRs. {booking.price_calculated}\n"
        f"Deadline was: {booking.payment_deadline.strftime('%d %b %Y, %H:%M')}\n\n"
        f"View your bookings at {FRONTEND_URL}/bookings\n\n— Bimbasetu"
    )
    _send(subject, html, plain, advertiser)


def send_payment_deadline_expired_to_owner(booking):
    """Notify billboard owner that a booking payment deadline expired."""
    owner = booking.billboard.owner
    advertiser = booking.campaign.advertiser
    subject = f"Booking Cancelled — Payment Not Received"

    rows = (
        _row("Billboard", booking.billboard.title) +
        _row("Advertiser", f"{advertiser.name} ({advertiser.email})") +
        _row("Booking ID", f"#{booking.id}") +
        _row("Dates", f"{booking.start_date} → {booking.end_date}") +
        _row_last("Status", "Cancelled - Payment deadline expired")
    )
    html = _base_html(
        recipient_name=owner.name,
        headline="Booking cancelled due to missed payment.",
        subheadline="The advertiser did not complete payment within the deadline. Your slots are now available.",
        body_rows_html=rows,
        action_url=f"{FRONTEND_URL}/owner/bookings",
        action_label="View My Bookings",
        accent_color="#D97706",
    )
    plain = (
        f"Hi {owner.name},\n\nBooking #{booking.id} for '{booking.billboard.title}' "
        f"by {advertiser.name} has been cancelled.\n"
        f"Reason: Payment deadline expired.\n\n"
        f"Your billboard slots are now available for new bookings.\n\n"
        f"View at {FRONTEND_URL}/owner/bookings\n\n— Bimbasetu"
    )
    _send(subject, html, plain, owner)

