from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.auth import get_current_user
from app.core.database import get_db
from app.services.analytics_service import AnalyticsService
from app.services.ml_service import ml_service

router = APIRouter(
    prefix="/api/v1/analytics",
    tags=["Analytics"],
    dependencies=[Depends(get_current_user)],
)

class DashboardStats(BaseModel):
    total_active: int = 0
    delivered_today: int = 0
    in_transit: int = 0
    pending_pickup: int = 0

class SLARow(BaseModel):
    date: str
    total: int
    onTime: int
    sla: float

class Anomaly(BaseModel):
    waybillId: str
    trackingNumber: str
    anomalyType: str
    severity: str
    description: str
    detectedAt: str

class ETAPrediction(BaseModel):
    waybillId: str
    trackingNumber: str
    predictedDelivery: str | None = None
    confidence: float
    estimatedHours: float | None = None
    basedOn: str

@router.get(
    "/stats",
    summary="Dashboard statistics",
    description="Returns aggregate counts for active, delivered today, in-transit, and pending pickup waybills.",
    response_model=DashboardStats,
)

async def get_stats(db: AsyncSession = Depends(get_db)):
    svc = AnalyticsService(db)
    return await svc.get_dashboard_stats()

@router.get(
    "/sla",
    summary="SLA report",
    description="Daily on-time delivery percentages between the given date range.",
    response_model=list[SLARow],
)

async def get_sla(
    from_date: str = Query(default="2024-01-01", description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(default="2024-12-31", description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
):
    svc = AnalyticsService(db)
    return await svc.get_sla_report(from_date, to_date)

@router.get(
    "/anomalies",
    summary="Detect anomalies",
    description="Finds anomalous shipments using ML (IsolationForest) and rule-based checks (stuck >3 days).",
    response_model=list[Anomaly],
)

async def get_anomalies(db: AsyncSession = Depends(get_db)):
    return await ml_service.detect_anomalies(db)

@router.get(
    "/predict-eta/{waybill_id}",
    summary="Predict ETA",
    description="Estimates delivery time using ML model (RandomForest) when available, falls back to historical average.",
    response_model=ETAPrediction,
)

async def predict_eta(waybill_id: str, db: AsyncSession = Depends(get_db)):
    result = await ml_service.predict_eta(db, waybill_id)

    if not result:
        return {"error": "Waybill not found"}

    return result


@router.post(
    "/train",
    summary="Train ML models",
    description="Trains ETA prediction (RandomForest) and anomaly detection (IsolationForest) models on historical waybill data.",
)

async def train_models(db: AsyncSession = Depends(get_db)):
    return await ml_service.train(db)