from datetime import datetime, timedelta
from typing import Any
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_stats(self) -> dict[str, Any]:
        result = await self.db.execute(text("""
            SELECT
                COUNT(*) FILTER (WHERE status NOT IN ('DELIVERED','CANCELLED','RETURNED')) AS total_active,
                COUNT(*) FILTER (WHERE status = 'DELIVERED' AND updated_at >= NOW() - INTERVAL '1 day') AS delivered_today,
                COUNT(*) FILTER (WHERE status = 'IN_TRANSIT') AS in_transit,
                COUNT(*) FILTER (WHERE status = 'CREATED') AS pending_pickup
            FROM waybills
        """))
        row = result.mappings().first()
        return dict(row) if row else {}

    async def get_sla_report(self, from_date: str, to_date: str) -> list[dict]:
        result = await self.db.execute(text("""
            SELECT
                DATE(created_at) AS date,
                COUNT(*) AS total,
                COUNT(*) FILTER (
                    WHERE status = 'DELIVERED'
                    AND actual_delivery <= estimated_delivery
                ) AS on_time
            FROM waybills
            WHERE created_at BETWEEN :from_date AND :to_date
            GROUP BY DATE(created_at)
            ORDER BY date
        """), {"from_date": from_date, "to_date": to_date})
        rows = result.mappings().all()
        return [
            {
                "date": str(r["date"]),
                "total": r["total"],
                "onTime": r["on_time"],
                "sla": round(r["on_time"] / r["total"] * 100, 2) if r["total"] > 0 else 0,
            }
            for r in rows
        ]

    async def detect_anomalies(self) -> list[dict]:
        result = await self.db.execute(text("""
            SELECT id, tracking_number, status, created_at, updated_at
            FROM waybills
            WHERE status NOT IN ('DELIVERED','CANCELLED','RETURNED')
              AND updated_at < NOW() - INTERVAL '3 days'
            ORDER BY updated_at ASC
        """))
        rows = result.mappings().all()
        return [
            {
                "waybillId": r["id"],
                "trackingNumber": r["tracking_number"],
                "anomalyType": "STUCK_SHIPMENT",
                "severity": "high",
                "description": f"Shipment stuck in '{r['status']}' for over 3 days",
                "detectedAt": datetime.utcnow().isoformat(),
            }
            for r in rows
        ]

    async def predict_eta(self, waybill_id: str) -> dict | None:
        result = await self.db.execute(text("""
            SELECT
                tracking_number, origin, destination, status, created_at,
                (SELECT AVG(EXTRACT(EPOCH FROM (actual_delivery - created_at)) / 3600)
                 FROM waybills
                 WHERE status = 'DELIVERED'
                   AND origin = (SELECT origin FROM waybills WHERE id = :wid)
                   AND destination = (SELECT destination FROM waybills WHERE id = :wid)
                ) AS avg_hours
            FROM waybills WHERE id = :wid
        """), {"wid": waybill_id})
        row = result.mappings().first()
        if not row:
            return None
        return {
            "waybillId": waybill_id,
            "trackingNumber": row["tracking_number"],
            "predictedDelivery": (
                datetime.utcnow() + timedelta(hours=row["avg_hours"])
            ).isoformat() if row["avg_hours"] else None,
            "confidence": 0.85 if row["avg_hours"] else 0.0,
            "basedOn": "Historical average transit time",
        }
