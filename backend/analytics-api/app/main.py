from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.api import analytics, reports, health
from app.core.config import settings

origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app = FastAPI(
    title="Waybill Analytics API",
    description="Provides dashboard statistics, SLA compliance reports, anomaly detection, ETA predictions, and Excel report exports for the Waybill Tracking system.",
    version="2.0.0",
    docs_url="/docs",
    contact={"name": "WaybillTrack Support", "email": "support@waybilltrack.com"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analytics.router, prefix="/api/v1/analytics")
app.include_router(reports.router, prefix="/api/v1/reports")
app.include_router(analytics.router, prefix="/api/analytics")
app.include_router(reports.router, prefix="/api/reports")

Instrumentator().instrument(app).expose(app)
