import asyncio
import base64
import io
import logging
from datetime import datetime

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import (
    Attachment,
    Disposition,
    FileContent,
    FileName,
    FileType,
    Mail,
)
from sqlalchemy import text
from twilio.rest import Client

from app.core.config import settings
from app.core.database import async_session
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task
def send_email_notification(to: str, subject: str, body: str):
    if not settings.SENDGRID_KEY:
        logger.warning("SENDGRID_KEY not set, skipping email")
        return

    message = Mail(
        from_email="noreply@waybilltracking.com",
        to_emails=to,
        subject=subject,
        html_content=body,
    )

    try:
        sg = SendGridAPIClient(settings.SENDGRID_KEY)
        response = sg.send(message)
        logger.info(
            "Email sent to %s: %s (status=%s)",
            to, subject, response.status_code,
        )
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)


@celery_app.task
def send_sms_notification(to: str, message: str):
    if not settings.TWILIO_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.warning("Twilio credentials not set, skipping SMS")
        return

    try:
        client = Client(settings.TWILIO_SID, settings.TWILIO_AUTH_TOKEN)
        twilio_msg = client.messages.create(
            to=to,
            from_="+12025551234",
            body=message,
        )
        logger.info(
            "SMS sent to %s (sid=%s)", to, twilio_msg.sid,
        )
    except Exception as e:
        logger.error("Failed to send SMS to %s: %s", to, e)


@celery_app.task
def generate_daily_report():
    logger.info("Generating daily report for %s", datetime.now().date())

    async def _run():
        async with async_session() as session:
            result = await session.execute(text("""
                SELECT tracking_number, shipper_name, recipient_name,
                       destination, status, created_at, updated_at
                FROM waybills
                WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
                  AND created_at < CURRENT_DATE
                ORDER BY created_at DESC
            """))
            rows = result.mappings().all()

            import openpyxl

            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Daily Report"

            headers = [
                "Tracking #", "Shipper", "Recipient", "Destination",
                "Status", "Created", "Updated",
            ]
            ws.append(headers)

            for r in rows:
                ws.append([
                    r["tracking_number"], r["shipper_name"],
                    r["recipient_name"], r["destination"],
                    r["status"], str(r["created_at"]),
                    str(r["updated_at"]),
                ])

            output = io.BytesIO()
            wb.save(output)
            output.seek(0)
            return output.getvalue()

    try:
        report_data = asyncio.run(_run())
        logger.info(
            "Daily report generated (%d bytes)", len(report_data),
        )

        if settings.SENDGRID_KEY:
            encoded = base64.b64encode(report_data).decode()
            attachment = Attachment(
                FileContent(encoded),
                FileType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ),
                FileName(f"daily-report-{datetime.now().date()}.xlsx"),
                Disposition("attachment"),
            )

            message = Mail(
                from_email="noreply@waybilltracking.com",
                to_emails=settings.REPORT_EMAIL,
                subject=f"Daily Waybill Report - {datetime.now().date()}",
                html_content="<p>Attached is the daily waybill report.</p>",
            )
            message.add_attachment(attachment)

            sg = SendGridAPIClient(settings.SENDGRID_KEY)
            sg.send(message)
            logger.info(
                "Daily report emailed to %s", settings.REPORT_EMAIL,
            )
    except Exception as e:
        logger.error("Failed to generate daily report: %s", e)
