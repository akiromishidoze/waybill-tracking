from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    svc = AnalyticsService(db)
    return await svc.get_dashboard_stats()


@router.get("/sla")
async def get_sla(
    from_date: str = Query(default="2024-01-01"),
    to_date: str = Query(default="2024-12-31"),
    db: AsyncSession = Depends(get_db),
):
    svc = AnalyticsService(db)
    return await svc.get_sla_report(from_date, to_date)


@router.get("/anomalies")
async def get_anomalies(db: AsyncSession = Depends(get_db)):
    svc = AnalyticsService(db)
    return await svc.detect_anomalies()


@router.get("/predict-eta/{waybill_id}")
async def predict_eta(waybill_id: str, db: AsyncSession = Depends(get_db)):
    svc = AnalyticsService(db)
    result = await svc.predict_eta(waybill_id)
    if not result:
        return {"error": "Waybill not found"}
    return result
