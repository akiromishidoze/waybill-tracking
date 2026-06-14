import logging
from datetime import datetime

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task
def send_email_notification(to: str, subject: str, body: str):
    logger.info(f"Sending email to {to}: {subject}")
    raise NotImplementedError("Integrate SendGrid/SMTP here")


@celery_app.task
def send_sms_notification(to: str, message: str):
    logger.info(f"Sending SMS to {to}: {message}")
    raise NotImplementedError("Integrate Twilio here")


@celery_app.task
def generate_daily_report():
    logger.info(f"Generating daily report: {datetime.now().date()}")
    raise NotImplementedError("Integrate report generation here")
