from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.workers.tasks import send_email_notification, send_sms_notification

router = APIRouter(tags=["Notifications"])


class DeliveryNotificationRequest(BaseModel):
    trackingNumber: str
    shipperId: str
    recipientName: str
    recipientPhone: str
    status: str
    destination: str
    eventType: str | None = None
    remark: str | None = None


class EmailRequest(BaseModel):
    to: str
    subject: str
    body: str


@router.post(
    "/dispatch",
    summary="Dispatch delivery notifications",
    description="Enqueues email and SMS Celery tasks for a delivered waybill. Protected by an internal API key when configured.",
)
async def dispatch_notifications(
    req: DeliveryNotificationRequest,
    db: AsyncSession = Depends(get_db),
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
):
    if settings.INTERNAL_API_KEY and x_internal_api_key != settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal API key")

    result = await db.execute(
        text("SELECT email FROM users WHERE id = :shipper_id"),
        {"shipper_id": req.shipperId},
    )
    row = result.mappings().first()
    shipper_email = row["email"] if row else None

    # Generate appropriate message based on event type
    if req.eventType == "DELIVERY":
        subject = f"Waybill {req.trackingNumber} delivered"
        body = f"<p>Hi,</p><p>Waybill <strong>{req.trackingNumber}</strong> has been delivered to {req.recipientName} in {req.destination}.</p>"
        sms_body = f"Waybill {req.trackingNumber} delivered to {req.recipientName} in {req.destination}."
    elif req.eventType == "ATTEMPT":
        subject = f"Delivery attempt for {req.trackingNumber}"
        body = f"<p>Hi,</p><p>A delivery attempt was made for waybill <strong>{req.trackingNumber}</strong> to {req.recipientName} in {req.destination}.</p>"
        if req.remark:
            body += f"<p>Reason: {req.remark}</p>"
        sms_body = f"Delivery attempt for {req.trackingNumber} to {req.recipientName} in {req.destination}."
        if req.remark:
            sms_body += f" Reason: {req.remark}"
    elif req.eventType == "RETURN":
        subject = f"Return initiated for {req.trackingNumber}"
        body = f"<p>Hi,</p><p>Waybill <strong>{req.trackingNumber}</strong> has been marked for return.</p>"
        if req.remark:
            body += f"<p>Reason: {req.remark}</p>"
        sms_body = f"Return initiated for {req.trackingNumber}."
        if req.remark:
            sms_body += f" Reason: {req.remark}"
    else:
        # Default: status change notification
        subject = f"Waybill {req.trackingNumber} status update"
        body = f"<p>Hi,</p><p>Waybill <strong>{req.trackingNumber}</strong> status is now {req.status}.</p>"
        sms_body = f"Waybill {req.trackingNumber} status: {req.status}."

    if shipper_email:
        send_email_notification.delay(shipper_email, subject, body)

    if req.recipientPhone:
        send_sms_notification.delay(req.recipientPhone, sms_body)

    return {"message": "notifications queued"}


@router.post(
    "/email",
    summary="Send a generic email",
    description="Enqueues a Celery email task. Protected by an internal API key when configured.",
)
async def send_email(
    req: EmailRequest,
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
):
    if settings.INTERNAL_API_KEY and x_internal_api_key != settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal API key")

    send_email_notification.delay(req.to, req.subject, req.body)
    return {"message": "email queued"}
