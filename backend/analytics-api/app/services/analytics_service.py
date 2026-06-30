from datetime import datetime, timedelta
from typing import Any
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ml_service import get_ml_service


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.ml = get_ml_service()

    async def get_dashboard_stats(self) -> dict[str, Any]:
        result = await self.db.execute(text("""
            SELECT
                COUNT(*) FILTER (WHERE status NOT IN ('DELIVERED','CANCELLED','RETURNED')) AS total_active,
                COUNT(*) FILTER (WHERE status = 'DELIVERED' AND updated_at >= NOW() - INTERVAL '1 day') AS delivered_today,
                COUNT(*) FILTER (WHERE status = 'IN_TRANSIT') AS in_transit,
                COUNT(*) FILTER (WHERE status = 'CREATED') AS pending_pickup,
                COUNT(*) AS total_volume,
                COUNT(*) FILTER (WHERE status = 'DELIVERED') AS total_delivered,
                COUNT(*) FILTER (WHERE status IN ('FAILED_DELIVERY','RETURNED')) AS total_exceptions,
                COUNT(*) FILTER (WHERE status = 'DELIVERED' AND actual_delivery <= estimated_delivery) AS on_time
            FROM waybills
        """))
        row = result.mappings().first()
        if not row:
            return {}

        total_delivered = row["total_delivered"] or 1
        sla = round(row["on_time"] / total_delivered * 100, 1) if row["on_time"] else 0
        exception_rate = round(row["total_exceptions"] / max(row["total_volume"], 1) * 100, 1)

        return {
            "totalActive": row["total_active"],
            "deliveredToday": row["delivered_today"],
            "inTransit": row["in_transit"],
            "pendingPickup": row["pending_pickup"],
            "totalVolume": row["total_volume"],
            "slaCompliance": sla,
            "exceptionRate": exception_rate,
            "avgTransitTime": 0,
        }

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

    async def get_cost_analytics(self) -> dict:
        summary_res = await self.db.execute(text("""
            SELECT
                COUNT(*) AS total_shipments,
                COALESCE(SUM(weight * 85), 0) AS total_cost,
                COALESCE(SUM(weight * 120), 0) AS total_revenue
            FROM waybills
        """))
        s = summary_res.mappings().first()
        total_cost = float(s["total_cost"] or 0)
        total_revenue = float(s["total_revenue"] or 0)
        total_shipments = int(s["total_shipments"] or 0)
        avg_cost = total_cost / total_shipments if total_shipments else 0
        avg_rev = total_revenue / total_shipments if total_shipments else 0
        margin = ((total_revenue - total_cost) / total_revenue * 100) if total_revenue else 0

        carrier_res = await self.db.execute(text("""
            SELECT
                COALESCE(carrier_name, 'Unknown') AS carrier_name,
                COUNT(*) AS shipment_count,
                COALESCE(SUM(weight * 85), 0) AS total_cost,
                COALESCE(SUM(weight * 120), 0) AS total_revenue
            FROM waybills
            GROUP BY carrier_name
            ORDER BY total_cost DESC
            LIMIT 10
        """))
        by_carrier = [
            {
                "carrierId": r["carrier_name"],
                "carrierName": r["carrier_name"],
                "totalCost": float(r["total_cost"]),
                "totalRevenue": float(r["total_revenue"]),
                "shipmentCount": int(r["shipment_count"]),
                "avgCost": float(r["total_cost"]) / int(r["shipment_count"]) if r["shipment_count"] else 0,
            }
            for r in carrier_res.mappings().all()
        ]

        region_res = await self.db.execute(text("""
            SELECT
                destination AS region,
                COUNT(*) AS shipment_count,
                COALESCE(SUM(weight * 85), 0) AS total_cost,
                COALESCE(SUM(weight * 120), 0) AS total_revenue
            FROM waybills
            GROUP BY destination
            ORDER BY total_cost DESC
            LIMIT 10
        """))
        by_region = [
            {
                "region": r["region"],
                "totalCost": float(r["total_cost"]),
                "totalRevenue": float(r["total_revenue"]),
                "shipmentCount": int(r["shipment_count"]),
            }
            for r in region_res.mappings().all()
        ]

        status_res = await self.db.execute(text("""
            SELECT status, COUNT(*) AS shipment_count, COALESCE(SUM(weight * 85), 0) AS total_cost
            FROM waybills GROUP BY status ORDER BY total_cost DESC
        """))
        by_status = [
            {"status": r["status"], "totalCost": float(r["total_cost"]), "shipmentCount": int(r["shipment_count"])}
            for r in status_res.mappings().all()
        ]

        monthly_res = await self.db.execute(text("""
            SELECT
                TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
                COUNT(*) AS count,
                COALESCE(SUM(weight * 85), 0) AS cost,
                COALESCE(SUM(weight * 120), 0) AS revenue
            FROM waybills
            WHERE created_at >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month
        """))
        monthly_trend = [
            {"month": r["month"], "cost": float(r["cost"]), "revenue": float(r["revenue"]), "count": int(r["count"])}
            for r in monthly_res.mappings().all()
        ]

        return {
            "summary": {
                "totalCost": total_cost,
                "totalRevenue": total_revenue,
                "totalShipments": total_shipments,
                "avgCostPerShipment": avg_cost,
                "avgRevenuePerShipment": avg_rev,
                "profitMargin": margin,
            },
            "byCarrier": by_carrier,
            "byRegion": by_region,
            "byStatus": by_status,
            "monthlyTrend": monthly_trend,
        }

    async def get_carbon_footprint(self) -> dict:
        EMISSION_FACTOR = 0.21

        summary_res = await self.db.execute(text("""
            SELECT
                COUNT(*) AS total_shipments,
                COALESCE(SUM(weight * :ef), 0) AS total_emissions,
                COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
                    AND created_at < DATE_TRUNC('month', NOW()) THEN weight * :ef ELSE 0 END), 0) AS last_month,
                COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN weight * :ef ELSE 0 END), 0) AS this_month
            FROM waybills
        """), {"ef": EMISSION_FACTOR})
        s = summary_res.mappings().first()
        total = float(s["total_emissions"] or 0)
        total_shipments = int(s["total_shipments"] or 0)
        avg_per = total / total_shipments if total_shipments else 0
        last_month = float(s["last_month"] or 0)
        this_month = float(s["this_month"] or 0)
        vs_last = ((this_month - last_month) / last_month * 100) if last_month else 0

        carrier_res = await self.db.execute(text("""
            SELECT
                COALESCE(carrier_name, 'Unknown') AS carrier_name,
                COUNT(*) AS shipment_count,
                COALESCE(SUM(weight * :ef), 0) AS total_emissions
            FROM waybills
            GROUP BY carrier_name
            ORDER BY total_emissions DESC
            LIMIT 10
        """), {"ef": EMISSION_FACTOR})
        by_carrier = []
        for r in carrier_res.mappings().all():
            cnt = int(r["shipment_count"])
            em = float(r["total_emissions"])
            avg = em / cnt if cnt else 0
            efficiency = "A" if avg < 5 else ("B" if avg < 10 else ("C" if avg < 20 else "D"))
            by_carrier.append({
                "carrierId": r["carrier_name"],
                "carrierName": r["carrier_name"],
                "totalEmissions": em,
                "shipmentCount": cnt,
                "avgPerShipment": avg,
                "efficiency": efficiency,
            })

        region_res = await self.db.execute(text("""
            SELECT
                destination AS region,
                COUNT(*) AS shipment_count,
                COALESCE(SUM(weight * :ef), 0) AS total_emissions
            FROM waybills
            GROUP BY destination
            ORDER BY total_emissions DESC
            LIMIT 10
        """), {"ef": EMISSION_FACTOR})
        by_region = [
            {
                "region": r["region"],
                "totalEmissions": float(r["total_emissions"]),
                "shipmentCount": int(r["shipment_count"]),
                "avgPerShipment": float(r["total_emissions"]) / int(r["shipment_count"]) if r["shipment_count"] else 0,
            }
            for r in region_res.mappings().all()
        ]

        monthly_res = await self.db.execute(text("""
            SELECT
                TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
                COUNT(*) AS shipments,
                COALESCE(SUM(weight * :ef), 0) AS emissions
            FROM waybills
            WHERE created_at >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month
        """), {"ef": EMISSION_FACTOR})
        monthly_trend = [
            {"month": r["month"], "emissions": float(r["emissions"]), "shipments": int(r["shipments"])}
            for r in monthly_res.mappings().all()
        ]

        return {
            "summary": {
                "totalEmissions": total,
                "avgPerShipment": avg_per,
                "totalShipments": total_shipments,
                "offsetCredits": round(total * 0.05, 2),
                "netEmissions": round(total * 0.95, 2),
                "vsLastMonth": round(vs_last, 2),
            },
            "byCarrier": by_carrier,
            "byRegion": by_region,
            "monthlyTrend": monthly_trend,
        }

    async def get_demand_forecast(self) -> dict:
        lane_res = await self.db.execute(text("""
            SELECT
                origin,
                destination,
                COUNT(*) AS current_volume
            FROM waybills
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY origin, destination
            ORDER BY current_volume DESC
            LIMIT 15
        """))
        lanes_raw = lane_res.mappings().all()

        prev_lane_res = await self.db.execute(text("""
            SELECT
                origin,
                destination,
                COUNT(*) AS prev_volume
            FROM waybills
            WHERE created_at >= NOW() - INTERVAL '60 days'
              AND created_at < NOW() - INTERVAL '30 days'
            GROUP BY origin, destination
        """))
        prev_map = {
            (r["origin"], r["destination"]): int(r["prev_volume"])
            for r in prev_lane_res.mappings().all()
        }

        by_lane = []
        for r in lanes_raw:
            cur = int(r["current_volume"])
            prev = prev_map.get((r["origin"], r["destination"]), cur)
            growth = ((cur - prev) / prev * 100) if prev else 0.0
            forecasted = round(cur * (1 + growth / 100))
            by_lane.append({
                "lane": f"{r['origin']} → {r['destination']}",
                "origin": r["origin"],
                "destination": r["destination"],
                "currentVolume": cur,
                "forecastedVolume": forecasted,
                "growth": round(growth, 2),
                "confidence": round(min(0.95, 0.60 + cur / 500), 2),
            })

        region_res = await self.db.execute(text("""
            SELECT
                destination AS region,
                COUNT(*) AS current_volume
            FROM waybills
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY destination
            ORDER BY current_volume DESC
            LIMIT 10
        """))
        prev_region_res = await self.db.execute(text("""
            SELECT
                destination AS region,
                COUNT(*) AS prev_volume
            FROM waybills
            WHERE created_at >= NOW() - INTERVAL '60 days'
              AND created_at < NOW() - INTERVAL '30 days'
            GROUP BY destination
        """))
        prev_region_map = {
            r["region"]: int(r["prev_volume"])
            for r in prev_region_res.mappings().all()
        }
        by_region = []
        for r in region_res.mappings().all():
            cur = int(r["current_volume"])
            prev = prev_region_map.get(r["region"], cur)
            growth = ((cur - prev) / prev * 100) if prev else 0.0
            by_region.append({
                "region": r["region"],
                "currentVolume": cur,
                "forecastedVolume": round(cur * (1 + growth / 100)),
                "growth": round(growth, 2),
            })

        monthly_res = await self.db.execute(text("""
            SELECT
                TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
                COUNT(*) AS volume
            FROM waybills
            WHERE created_at >= NOW() - INTERVAL '12 months'
            GROUP BY month
            ORDER BY month ASC
        """))
        monthly_rows = monthly_res.mappings().all()
        avg_vol = (
            sum(int(r["volume"]) for r in monthly_rows) / len(monthly_rows)
            if monthly_rows else 1
        )
        capacity = round(avg_vol * 1.25)
        monthly_forecast = [
            {
                "month": r["month"],
                "volume": int(r["volume"]),
                "capacity": capacity,
            }
            for r in monthly_rows
        ]

        total_current = sum(r["currentVolume"] for r in by_region) if by_region else 0
        total_forecast = sum(r["forecastedVolume"] for r in by_region) if by_region else 0
        total_capacity = round(total_current * 1.25)
        utilization = (total_current / total_capacity * 100) if total_capacity else 0
        growth_vals = [r["growth"] for r in by_region if r["growth"] != 0]
        next_month_growth = round(sum(growth_vals) / len(growth_vals), 2) if growth_vals else 0.0

        return {
            "summary": {
                "totalForecast": total_forecast,
                "totalCapacity": total_capacity,
                "utilizationRate": round(utilization, 2),
                "nextMonthGrowth": next_month_growth,
            },
            "byLane": by_lane,
            "byRegion": by_region,
            "monthlyForecast": monthly_forecast,
        }

    async def predict_eta(self, waybill_id: str) -> dict | None:
        ml_result = await self.ml.predict_eta(self.db, waybill_id)
        if ml_result:
            return ml_result

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
