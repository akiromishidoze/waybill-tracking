import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy import text
from app.core.config import settings
from app.core.database import async_session
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

@celery_app.task
def check_iot_sensor_thresholds():
    """Check IoT sensor readings against active thresholds and create escalations."""
    logger.info("Checking IoT sensor thresholds")
    
    async def _run():
        async with async_session() as session:
            # Fetch active thresholds
            thresholds_result = await session.execute(text("""
                SELECT id, sensor_id, reading_type, min_value, max_value, severity, action_type
                FROM iot_sensor_thresholds
                WHERE is_active = true
            """))
            thresholds = thresholds_result.mappings().all()
            
            if not thresholds:
                logger.info("No active IoT sensor thresholds found")
                return []
            
            logger.info(f"Found {len(thresholds)} active thresholds")
            
            breaches = []
            
            for threshold in thresholds:
                # Get recent readings for this sensor and reading type
                readings_result = await session.execute(text("""
                    SELECT id, sensor_id, reading_type, value, unit, recorded_at
                    FROM iot_sensor_readings
                    WHERE sensor_id = :sensor_id
                      AND reading_type = :reading_type
                      AND recorded_at > NOW() - INTERVAL '10 minutes'
                    ORDER BY recorded_at DESC
                    LIMIT 1
                """), {
                    "sensor_id": threshold['sensor_id'],
                    "reading_type": threshold['reading_type'],
                })
                
                reading = readings_result.fetchone()
                
                if not reading:
                    continue
                
                value = reading['value']
                min_val = threshold['min_value']
                max_val = threshold['max_value']
                
                # Check if threshold is breached
                breached = False
                breach_type = None
                
                if min_val is not None and value < min_val:
                    breached = True
                    breach_type = 'BELOW_MIN'
                elif max_val is not None and value > max_val:
                    breached = True
                    breach_type = 'ABOVE_MAX'
                
                if not breached:
                    continue
                
                # Check if we already created an escalation for this breach recently (avoid duplicates)
                recent_check = await session.execute(text("""
                    SELECT id FROM escalations
                    WHERE waybill_id IS NULL
                      AND description LIKE :pattern
                      AND created_at > NOW() - INTERVAL '30 minutes'
                    LIMIT 1
                """), {
                    "pattern": f"%{threshold['sensor_id']}%{threshold['reading_type']}%{breach_type}%",
                })
                
                if recent_check.fetchone():
                    continue
                
                # Get sensor location for context
                sensor_result = await session.execute(text("""
                    SELECT location FROM iot_sensors WHERE sensor_id = :sensor_id
                """), {"sensor_id": threshold['sensor_id']})
                sensor = sensor_result.fetchone()
                location = sensor['location'] if sensor else 'Unknown'
                
                # Create escalation or notification based on action_type
                if threshold['action_type'] == 'ESCALATION':
                    escalation_result = await session.execute(text("""
                        INSERT INTO escalations (waybill_id, type, severity, description, status, created_at, updated_at)
                        VALUES (NULL, 'IOT_THRESHOLD', :severity, :description, 'OPEN', NOW(), NOW())
                        RETURNING id
                    """), {
                        "severity": threshold['severity'],
                        "description": f"Sensor {threshold['sensor_id']} at {location}: {threshold['reading_type']} {breach_type} threshold. Value: {value} (min: {min_val}, max: {max_val})",
                    })
                    escalation_id = escalation_result.scalar()
                    breaches.append({
                        'type': 'escalation',
                        'id': escalation_id,
                        'sensor_id': threshold['sensor_id'],
                        'reading_type': threshold['reading_type'],
                        'value': value,
                        'breach_type': breach_type,
                    })
                
                elif threshold['action_type'] == 'NOTIFICATION':
                    # Create auto-communication record
                    comm_result = await session.execute(text("""
                        INSERT INTO auto_communications (waybill_id, tracking_number, trigger_type, trigger_event, recipient, channel, status, created_at)
                        VALUES (NULL, :sensor_id, 'IOT_THRESHOLD', :breach_type, 'admin@waybilltrack.com', 'EMAIL', 'PENDING', NOW())
                        RETURNING id
                    """), {
                        "sensor_id": threshold['sensor_id'],
                        "breach_type": breach_type,
                    })
                    comm_id = comm_result.scalar()
                    breaches.append({
                        'type': 'notification',
                        'id': comm_id,
                        'sensor_id': threshold['sensor_id'],
                        'reading_type': threshold['reading_type'],
                        'value': value,
                        'breach_type': breach_type,
                    })
            
            await session.commit()
            return breaches
    
    try:
        breaches = asyncio.run(_run())
        
        if not breaches:
            logger.info("No threshold breaches detected")
            return
        
        logger.info(f"Detected {len(breaches)} threshold breaches")
        
        for breach in breaches:
            logger.info(
                f"Threshold breach: {breach['sensor_id']} {breach['reading_type']} "
                f"{breach['breach_type']} (value: {breach['value']}) - "
                f"created {breach['type']} {breach['id']}"
            )
        
        logger.info("IoT sensor threshold check complete")
        
    except Exception as e:
        logger.error(f"Failed to check IoT sensor thresholds: {e}")
