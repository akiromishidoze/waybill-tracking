from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


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


class CostByCarrier(BaseModel):
    carrierId: str
    carrierName: str
    totalCost: float
    totalRevenue: float
    shipmentCount: int
    avgCost: float


class CostByRegion(BaseModel):
    region: str
    totalCost: float
    totalRevenue: float
    shipmentCount: int


class CostByStatus(BaseModel):
    status: str
    totalCost: float
    shipmentCount: int


class CostMonthlyTrend(BaseModel):
    month: str
    cost: float
    revenue: float
    count: int


class CostSummary(BaseModel):
    totalCost: float
    totalRevenue: float
    totalShipments: int
    avgCostPerShipment: float
    avgRevenuePerShipment: float
    profitMargin: float


class CostAnalytics(BaseModel):
    summary: CostSummary
    byCarrier: List[CostByCarrier]
    byRegion: List[CostByRegion]
    byStatus: List[CostByStatus]
    monthlyTrend: List[CostMonthlyTrend]


class CarbonByCarrier(BaseModel):
    carrierId: str
    carrierName: str
    totalEmissions: float
    shipmentCount: int
    avgPerShipment: float
    efficiency: str


class CarbonByRegion(BaseModel):
    region: str
    totalEmissions: float
    shipmentCount: int
    avgPerShipment: float


class CarbonMonthlyTrend(BaseModel):
    month: str
    emissions: float
    shipments: int


class CarbonSummary(BaseModel):
    totalEmissions: float
    avgPerShipment: float
    totalShipments: int
    offsetCredits: float
    netEmissions: float
    vsLastMonth: float


class CarbonFootprint(BaseModel):
    summary: CarbonSummary
    byCarrier: List[CarbonByCarrier]
    byRegion: List[CarbonByRegion]
    monthlyTrend: List[CarbonMonthlyTrend]


class DemandForecastLane(BaseModel):
    lane: str
    origin: str
    destination: str
    currentVolume: int
    forecastedVolume: int
    growth: float
    confidence: float


class DemandForecastRegion(BaseModel):
    region: str
    currentVolume: int
    forecastedVolume: int
    growth: float


class DemandForecastMonth(BaseModel):
    month: str
    volume: int
    capacity: int


class DemandForecastSummary(BaseModel):
    totalForecast: int
    totalCapacity: int
    utilizationRate: float
    nextMonthGrowth: float


class DemandForecast(BaseModel):
    summary: DemandForecastSummary
    byLane: List[DemandForecastLane]
    byRegion: List[DemandForecastRegion]
    monthlyForecast: List[DemandForecastMonth]
