import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from prometheus_fastapi_instrumentator import Instrumentator

from app.api import analytics, reports, health, notifications
from app.core.config import settings
from app.core.database import async_session
from app.services.ml_service import get_ml_service

logger = logging.getLogger(__name__)

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
app.include_router(notifications.router, prefix="/api/v1/notifications")
app.include_router(analytics.router, prefix="/api/analytics")
app.include_router(reports.router, prefix="/api/reports")
app.include_router(notifications.router, prefix="/api/notifications")

Instrumentator().instrument(app).expose(app)


class _CatchAllMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        try:
            return await call_next(request)
        except Exception as exc:
            logger.error("Unhandled exception on %s: %s", request.url.path, exc, exc_info=True)
            return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.add_middleware(_CatchAllMiddleware)


@app.on_event("startup")
async def startup_train_ml():
    try:
        ml = get_ml_service()
        ml._load_if_needed()
        if ml.is_trained:
            logger.info("ML model loaded from disk")
            return
        async with async_session() as db:
            result = await ml.train(db)
            logger.info("ML startup training result: %s", result)
    except Exception as e:
        logger.warning("ML startup training failed: %s", e)
