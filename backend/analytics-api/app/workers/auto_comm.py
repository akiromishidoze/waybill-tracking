import asyncio
import logging
import re
from datetime import datetime
from sqlalchemy import text
from app.core.config import settings
from app.core.database import async_session
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

TRIGGER_CONDITIONS = {
    'STATUS_CHANGE': lambda wb: True,  # Always check for status changes
    'SLA_BREACHED': lambda wb: wb.get('sla_breached', False),
    'OUT_FOR_DELIVERY': lambda wb: wb.get('status') == 'OUT_FOR_DELIVERY',
    'DELIVERED': lambda wb: wb.get('status') == 'DELIVERED',
    'EXCEPTION_RAISED': lambda wb: wb.get('status') in ['FAILED_DELIVERY', 'EXCEPTION'],
    'RETURN_INITIATED': lambda wb: wb.get('status') == 'RETURNED',
}

def render_template(template: str, waybill: dict) -> str:
    """Replace template variables with waybill data."""
    variables = {
        'tracking': waybill.get('tracking_number', ''),
        'recipient': waybill.get('recipient_name', ''),
        'shipper': waybill.get('shipper_name', ''),
        'origin': waybill.get('origin', ''),
        'destination': waybill.get('destination', ''),
        'eta': waybill.get('estimated_delivery', ''),
        'carrier': waybill.get('carrier_name', ''),
        'exception': waybill.get('exception_code', ''),
        'reason': waybill.get('remark', ''),
    }
    
    for key, value in variables.items():
        template = template.replace(f'{{{key}}}', str(value))
    
    return template

@celery_app.task
def evaluate_auto_communication_rules():
    """Evaluate active auto-communication rules and dispatch notifications."""
    # Import here to avoid circular dependency
    from app.workers.tasks import send_email_notification, send_sms_notification
    
    logger.info("Evaluating auto-communication rules")
    
    async def _run():
        async with async_session() as session:
            # Fetch active rules
            rules_result = await session.execute(text("""
                SELECT id, trigger, channel, subject, template, send_to_shipper, send_to_recipient
                FROM auto_communication_rules
                WHERE is_active = true
                ORDER BY created_at DESC
            """))
            rules = rules_result.mappings().all()
            
            if not rules:
                logger.info("No active auto-communication rules found")
                return []
            
            logger.info(f"Found {len(rules)} active rules")
            
            # Fetch waybills that may trigger rules
            waybills_result = await session.execute(text("""
                SELECT id, tracking_number, shipper_name, recipient_name, shipper_email, recipient_email,
                       origin, destination, status, estimated_delivery, carrier_name,
                       sla_breached, exception_code, remark, updated_at
                FROM waybills
                WHERE status NOT IN ('CANCELLED')
                ORDER BY updated_at DESC
                LIMIT 1000
            """))
            waybills = waybills_result.mappings().all()
            
            notifications = []
            
            for rule in rules:
                trigger = rule['trigger']
                condition_func = TRIGGER_CONDITIONS.get(trigger)
                
                if not condition_func:
                    logger.warning(f"Unknown trigger type: {trigger}")
                    continue
                
                for wb in waybills:
                    if not condition_func(wb):
                        continue
                    
                    # Check if this waybill already triggered this rule recently (avoid duplicates)
                    recent_check = await session.execute(text("""
                        SELECT id FROM auto_communications
                        WHERE waybill_id = :waybill_id
                          AND trigger_type = :trigger
                          AND created_at > NOW() - INTERVAL '1 hour'
                        LIMIT 1
                    """), {
                        "waybill_id": wb['id'],
                        "trigger": trigger,
                    })
                    
                    if recent_check.fetchone():
                        continue
                    
                    # Determine recipients
                    recipients = []
                    if rule['send_to_shipper'] and wb.get('shipper_email'):
                        recipients.append(wb['shipper_email'])
                    if rule['send_to_recipient'] and wb.get('recipient_email'):
                        recipients.append(wb['recipient_email'])
                    
                    if not recipients:
                        logger.warning(f"No recipients for waybill {wb['tracking_number']} rule {rule['id']}")
                        continue
                    
                    # Render template
                    subject = render_template(rule['subject'], wb)
                    body = render_template(rule['template'], wb)
                    
                    # Create communication record
                    comm_result = await session.execute(text("""
                        INSERT INTO auto_communications (waybill_id, tracking_number, trigger_type, trigger_event, recipient, channel, status, created_at)
                        VALUES (:waybill_id, :tracking_number, :trigger_type, :trigger_event, :recipient, :channel, 'PENDING', NOW())
                        RETURNING id
                    """), {
                        "waybill_id": wb['id'],
                        "tracking_number": wb['tracking_number'],
                        "trigger_type": trigger,
                        "trigger_event": wb['status'],
                        "recipient": ', '.join(recipients),
                        "channel": rule['channel'],
                    })
                    comm_id = comm_result.scalar()
                    
                    # Dispatch notifications
                    for recipient in recipients:
                        notifications.append({
                            'comm_id': comm_id,
                            'channel': rule['channel'],
                            'recipient': recipient,
                            'subject': subject,
                            'body': body,
                        })
            
            await session.commit()
            return notifications
    
    try:
        notifications = asyncio.run(_run())
        
        if not notifications:
            logger.info("No notifications to send")
            return
        
        logger.info(f"Dispatching {len(notifications)} notifications")
        
        for notif in notifications:
            try:
                if notif['channel'] == 'EMAIL':
                    send_email_notification.delay(notif['recipient'], notif['subject'], notif['body'])
                elif notif['channel'] == 'SMS':
                    send_sms_notification.delay(notif['recipient'], notif['body'])
                
                # Mark as sent
                asyncio.run(_mark_sent(notif['comm_id']))
                
            except Exception as e:
                logger.error(f"Failed to dispatch notification: {e}")
                asyncio.run(_mark_failed(notif['comm_id'], str(e)))
        
        logger.info(f"Auto-communication evaluation complete: {len(notifications)} notifications dispatched")
        
    except Exception as e:
        logger.error(f"Failed to evaluate auto-communication rules: {e}")

async def _mark_sent(comm_id: str):
    async with async_session() as session:
        await session.execute(text("""
            UPDATE auto_communications
            SET status = 'SENT', sent_at = NOW()
            WHERE id = :id
        """), {"id": comm_id})
        await session.commit()

async def _mark_failed(comm_id: str, error_msg: str):
    async with async_session() as session:
        await session.execute(text("""
            UPDATE auto_communications
            SET status = 'FAILED', error_message = :error_msg
            WHERE id = :id
        """), {"id": comm_id, "error_msg": error_msg})
        await session.commit()
