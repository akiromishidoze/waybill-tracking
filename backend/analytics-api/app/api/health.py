from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    summary="Health check",
    description="Returns the current service status. Used by load balancers and orchestration tools.",
)
async def health():
    return {"status": "ok", "service": "analytics-api"}
