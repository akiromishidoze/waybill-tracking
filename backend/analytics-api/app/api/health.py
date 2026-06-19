from fastapi import APIRouter
from app.models.analytics import HealthResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Returns the current service health status and service name.",
)
async def health():
    return {"status": "ok", "service": "analytics-api"}
