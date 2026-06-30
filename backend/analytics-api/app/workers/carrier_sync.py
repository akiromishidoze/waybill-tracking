import asyncio
import hashlib
import logging

from sqlalchemy import text

from app.core.database import async_session
from app.integrations.carriers import get_adapter
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

_TERMINAL_STATUSES = frozenset({"DELIVERED", "CANCELLED", "RETURNED"})


def _normalise_carrier(row: dict) -> dict:
    """Return a carrier dict with both snake_case and camelCase keys so all
    adapters can find the fields they need regardless of naming convention."""
    return {
        **row,
        "apiEndpoint": row.get("api_endpoint", ""),
        "apiKey": row.get("api_key", ""),
    }


@celery_app.task
def sync_carrier_tracking():
    logger.info("Starting carrier tracking sync")

    async def _run():
        async with async_session() as session:
            carriers_result = await session.execute(
                text(
                    "SELECT id, name, api_endpoint, api_key, is_active "
                    "FROM carriers WHERE is_active = TRUE"
                )
            )
            carriers = [dict(r) for r in carriers_result.mappings().all()]

            if not carriers:
                logger.info("No active carriers configured")
                return

            for raw_carrier in carriers:
                carrier_dict = _normalise_carrier(raw_carrier)
                carrier_name = carrier_dict.get("name", "")
                logger.info("Syncing carrier: %s", carrier_name)

                try:
                    await _sync_carrier(session, carrier_dict)
                    await session.commit()
                    logger.info("Committed sync for carrier: %s", carrier_name)
                except Exception as exc:
                    await session.rollback()
                    logger.error("Sync failed for carrier %s: %s", carrier_name, exc)

    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(_run())
        logger.info("Carrier tracking sync completed")
    except Exception as e:
        logger.error("Carrier tracking sync failed: %s", e)
    finally:
        loop.close()


async def _sync_carrier(session, carrier_dict: dict) -> None:
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

    if not waybills:
        return

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
                    INSERT INTO scan_events
                        (id, waybill_id, status, location, timestamp, remark, event_type)
                    VALUES
                        (:id, :waybill_id, :status, :location, :timestamp, :remark, 'SCAN')
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
            logger.info(
                "Updated waybill %s status: %s → %s",
                wb["id"], wb["status"], latest_event.status,
            )
