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

    subject = f"Waybill {req.trackingNumber} delivered"
    body = f"<p>Hi,</p><p>Waybill <strong>{req.trackingNumber}</strong> has been delivered to {req.recipientName} in {req.destination}.</p>"
    sms_body = f"Waybill {req.trackingNumber} delivered to {req.recipientName} in {req.destination}."

    if shipper_email:
        send_email_notification.delay(shipper_email, subject, body)

    if req.recipientPhone:
        send_sms_notification.delay(req.recipientPhone, sms_body)

    return {"message": "notifications queued"}
