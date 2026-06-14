from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.api import analytics, reports, health
from app.core.config import settings

app = FastAPI(
    title="Waybill Analytics API",
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analytics.router, prefix="/api/analytics")
app.include_router(reports.router, prefix="/api/reports")

Instrumentator().instrument(app).expose(app)
