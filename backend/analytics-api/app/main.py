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

origins = (
    settings.ALLOWED_ORIGINS.split(",")
    if settings.ALLOWED_ORIGINS
    else ["http://localhost:3010"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analytics.router)
app.include_router(reports.router)

Instrumentator().instrument(app).expose(app)