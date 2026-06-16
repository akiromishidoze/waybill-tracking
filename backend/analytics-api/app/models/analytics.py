from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SLAReport(BaseModel):
    period: str
    totalShipments: int
    deliveredOnTime: int
    slaPercentage: float
    avgTransitHours: float

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
    predictedDelivery: datetime
    confidence: float
    basedOn: str