import asyncio
import hashlib
import logging
from datetime import datetime
from typing import Any

from sqlalchemy import text

from app.core.database import async_session
from app.integrations.carriers import get_adapter
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task
def sync_carrier_tracking():
    logger.info("Starting carrier tracking sync")

    async def _run():
        async with async_session() as session:
            carriers_result = await session.execute(
                text("SELECT id, name, api_endpoint, api_key, is_active FROM carriers WHERE is_active = TRUE")
            )
            carriers = carriers_result.mappings().all()

            if not carriers:
                logger.info("No active carriers configured")
                return

            for carrier in carriers:
                carrier_dict = dict(carrier)
                logger.info("Syncing carrier: %s", carrier_dict.get("name"))

                waybills_result = await session.execute(
                    text("""
                        SELECT id, carrier_tracking_number, status
                        FROM waybills
                        WHERE carrier_name = :carrier_name
                          AND carrier_tracking_number IS NOT NULL
                          AND status NOT IN ('DELIVERED', 'CANCELLED', 'RETURNED')
                    """),
                    {"carrier_name": carrier_dict.get("name")},
                )
                waybills = waybills_result.mappings().all()

                adapter = get_adapter(carrier_dict)
                for wb in waybills:
                    tracking_number = wb["carrier_tracking_number"]
                    try:
                        events = adapter.fetch_tracking(tracking_number)
                    except Exception as e:
                        logger.error("Failed to fetch tracking for %s: %s", tracking_number, e)
                        continue

                    if not events:
                        continue

                    events.sort(key=lambda e: e.timestamp)
                    latest_event = events[-1]

                    for event in events:
                        event_id = hashlib.sha256(
                            f"{wb['id']}:{event.status}:{event.timestamp.isoformat()}:{event.location}".encode()
                        ).hexdigest()[:32]
                        await session.execute(
                            text("""
                                INSERT INTO scan_events (id, waybill_id, status, location, timestamp, remark)
                                VALUES (:id, :waybill_id, :status, :location, :timestamp, :remark)
                                ON CONFLICT (id, timestamp) DO NOTHING
                            """),
                            {
                                "id": event_id,
                                "waybill_id": wb["id"],
                                "status": event.status,
                                "location": event.location,
                                "timestamp": event.timestamp,
                                "remark": event.remark,
                            },
                        )

                    if latest_event.status and latest_event.status != wb["status"]:
                        await session.execute(
                            text("""
                                UPDATE waybills
                                SET status = :status, updated_at = NOW()
                                WHERE id = :id
                            """),
                            {"status": latest_event.status, "id": wb["id"]},
                        )

                await session.commit()

    try:
        asyncio.run(_run())
        logger.info("Carrier tracking sync completed")
    except Exception as e:
        logger.error("Carrier tracking sync failed: %s", e)
