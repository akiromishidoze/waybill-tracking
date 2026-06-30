from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.ratelimit import rate_limit
from app.services.analytics_service import AnalyticsService
from app.models.analytics import DashboardStats, SLAReportRow, AnomalyDetection, PredictiveETA, CostAnalytics, CarbonFootprint

router = APIRouter(tags=["Analytics"])

rate_limit_analytics = rate_limit(60, 60)


@router.get(
    "/stats",
    response_model=DashboardStats,
    summary="Dashboard statistics",
    description="Returns aggregate KPIs for the dashboard: active shipments, delivered today, in-transit count, pending pickups, total volume, SLA compliance rate, exception rate, and average transit time.",
)
async def get_stats(db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user), _rate_limit: None = Depends(rate_limit_analytics)):
    svc = AnalyticsService(db)
    return await svc.get_dashboard_stats()


@router.get(
    "/sla",
    response_model=list[SLAReportRow],
    summary="SLA compliance report",
    description="Returns daily SLA compliance data for a given date range. Each row shows the date, total shipments, on-time deliveries, and SLA percentage.",
)
async def get_sla(
    from_date: str = Query(default="2024-01-01", description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(default="2024-12-31", description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
    _rate_limit: None = Depends(rate_limit_analytics),
):
    svc = AnalyticsService(db)
    return await svc.get_sla_report(from_date, to_date)


@router.get(
    "/anomalies",
    response_model=list[AnomalyDetection],
    summary="Detect anomalies",
    description="Scans for shipments stuck in non-terminal statuses for more than 3 days and returns anomaly records.",
)
async def get_anomalies(db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user), _rate_limit: None = Depends(rate_limit_analytics)):
    svc = AnalyticsService(db)
    return await svc.detect_anomalies()


@router.get(
    "/predict-eta/{waybill_id}",
    response_model=PredictiveETA,
    summary="Predict delivery ETA",
    description="Predicts the estimated time of arrival for a waybill using a trained RandomForest model when available, otherwise falls back to historical average transit time.",
    responses={404: {"description": "Waybill not found"}},
)
async def predict_eta(waybill_id: str, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user), _rate_limit: None = Depends(rate_limit_analytics)):
    svc = AnalyticsService(db)
    result = await svc.predict_eta(waybill_id)
    if not result:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=404, content={"error": "Waybill not found"})
    return result


@router.post(
    "/train",
    summary="Train ML models",
    description="Trains and persists the ETA prediction and anomaly detection models using historical delivery data. Protected by admin role.",
)
async def train_models(db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    if user.get("role") != "ADMIN":
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=403, content={"error": "Admin access required"})
    svc = AnalyticsService(db)
    result = await svc.ml.train(db)
    return result


@router.get(
    "/cost-per-shipment",
    response_model=CostAnalytics,
    summary="Cost per shipment analytics",
    description="Returns cost and revenue breakdown by carrier, region, status, and monthly trend. Costs are estimated using weight-based heuristics (cost = weight × 85, revenue = weight × 120).",
)
async def get_cost_analytics(db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user), _rate_limit: None = Depends(rate_limit_analytics)):
    svc = AnalyticsService(db)
    return await svc.get_cost_analytics()


@router.get(
    "/carbon-footprint",
    response_model=CarbonFootprint,
    summary="Carbon footprint analytics",
    description="Returns CO₂ emission estimates by carrier, region, and monthly trend. Emissions are calculated using a factor of 0.21 kg CO₂ per kg of shipment weight.",
)
async def get_carbon_footprint(db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user), _rate_limit: None = Depends(rate_limit_analytics)):
    svc = AnalyticsService(db)
    return await svc.get_carbon_footprint()
