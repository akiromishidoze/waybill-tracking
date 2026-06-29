import asyncio
import hashlib
import logging
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import text

from app.core.database import async_session
from app.integrations.ecommerce import get_adapter
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task
def sync_ecommerce_orders():
    logger.info("Starting e-commerce order sync")

    async def _run():
        async with async_session() as session:
            platforms_result = await session.execute(
                text("SELECT id, platform, store_name, store_url, api_key, api_secret, connected, last_sync, synced_orders FROM ecommerce_platforms WHERE connected = TRUE")
            )
            platforms = platforms_result.mappings().all()

            if not platforms:
                logger.info("No connected e-commerce platforms")
                return

            admin_result = await session.execute(text("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1"))
            admin_row = admin_result.mappings().first()
            shipper_id = admin_row["id"] if admin_row else None

            if not shipper_id:
                logger.error("No ADMIN user found to assign as shipper for e-commerce orders")
                return

            for platform in platforms:
                platform_dict = dict(platform)
                platform_id = platform_dict["id"]
                platform_name = platform_dict["platform"]
                store_name = platform_dict["store_name"]
                last_sync = platform_dict.get("last_sync")

                logger.info("Syncing platform: %s (%s)", platform_name, store_name)

                adapter = get_adapter(platform_dict)
                orders = []
                try:
                    orders = adapter.fetch_orders(since=last_sync)
                except Exception as e:
                    logger.error("Failed to fetch orders from %s: %s", platform_name, e)
                    await _log_sync(session, platform_id, platform_name, store_name, 0, 1)
                    continue

                synced_count = 0
                error_count = 0
                for order in orders:
                    try:
                        await _create_waybill_from_order(session, order, shipper_id, store_name)
                        synced_count += 1
                    except Exception as e:
                        logger.error("Failed to create waybill for order %s: %s", order.order_id, e)
                        error_count += 1

                await session.execute(
                    text("""
                        UPDATE ecommerce_platforms
                        SET synced_orders = synced_orders + :synced,
                            last_sync = NOW(),
                            updated_at = NOW()
                        WHERE id = :id
                    """),
                    {"synced": synced_count, "id": platform_id},
                )

                await _log_sync(session, platform_id, platform_name, store_name, synced_count, error_count)
                await session.commit()

    try:
        asyncio.run(_run())
        logger.info("E-commerce order sync completed")
    except Exception as e:
        logger.error("E-commerce order sync failed: %s", e)


async def _create_waybill_from_order(session, order, shipper_id: str, store_name: str):
    tracking_number = f"WBT-{uuid.uuid4().hex[:8]}"
    order_id = order.order_id
    waybill_id = hashlib.sha256(f"{order_id}:{store_name}".encode()).hexdigest()[:32]

    existing = await session.execute(
        text("SELECT id FROM waybills WHERE id = :id OR tracking_number = :tracking_number LIMIT 1"),
        {"id": waybill_id, "tracking_number": tracking_number},
    )
    if existing.mappings().first():
        logger.info("Waybill already exists for order %s", order_id)
        return

    await session.execute(
        text("""
            INSERT INTO waybills (
                id, tracking_number, shipper_id, shipper_name, recipient_name, recipient_address,
                recipient_phone, origin, destination, weight, dimensions, service_type, status, created_at, updated_at
            )
            VALUES (
                :id, :tracking_number, :shipper_id, :shipper_name, :recipient_name, :recipient_address,
                :recipient_phone, :origin, :destination, :weight, :dimensions, :service_type, 'CREATED', NOW(), NOW()
            )
        """),
        {
            "id": waybill_id,
            "tracking_number": tracking_number,
            "shipper_id": shipper_id,
            "shipper_name": store_name,
            "recipient_name": order.recipient_name,
            "recipient_address": order.recipient_address,
            "recipient_phone": order.recipient_phone,
            "origin": order.origin or "Unknown",
            "destination": order.destination or "Unknown",
            "weight": order.weight or 0.0,
            "dimensions": order.dimensions or "",
            "service_type": order.service_type or "STANDARD",
        },
    )


async def _log_sync(session, platform_id: str, platform: str, store_name: str, synced: int, errors: int):
    status = "success" if errors == 0 else "partial" if synced > 0 else "failed"
    await session.execute(
        text("""
            INSERT INTO ecommerce_sync_logs (platform_id, platform, store_name, status, orders_synced, errors_count, synced_at)
            VALUES (:platform_id, :platform, :store_name, :status, :orders_synced, :errors_count, NOW())
        """),
        {
            "platform_id": platform_id,
            "platform": platform,
            "store_name": store_name,
            "status": status,
            "orders_synced": synced,
            "errors_count": errors,
        },
    )
