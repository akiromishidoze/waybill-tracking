from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class HealthResponse(BaseModel):
    status: str
    service: str


class DashboardStats(BaseModel):
    totalActive: int
    deliveredToday: int
    inTransit: int
    pendingPickup: int
    totalVolume: int
    slaCompliance: float
    exceptionRate: float
    avgTransitTime: float


class SLAReportRow(BaseModel):
    date: str
    total: int
    onTime: int
    sla: float


class AnomalyDetection(BaseModel):
    waybillId: str
    trackingNumber: str
    anomalyType: str
    severity: str
    description: str
    detectedAt: datetime


class PredictiveETA(BaseModel):
    waybillId: str
    trackingNumber: str
    predictedDelivery: Optional[str] = None
    confidence: float
    estimatedHours: float
    basedOn: str
