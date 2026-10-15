from datetime import datetime, timezone
from fastapi import APIRouter
from backend.app.schemas import HealthResponse
from backend.app.config import settings

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health():
    """
    Health check endpoint returning system status, simulation mode flag,
    and strict non-real-money disclaimer.
    """
    return HealthResponse(
        status="ok",
        app=settings.APP_NAME,
        version="1.0.0",
        simulation_mode=settings.SIMULATION_MODE,
        disclaimer="Demo application. No real money is transferred. SIMULATED ENVIRONMENT: No real money, banking passwords, or UPI PINs are ever used or stored.",
        timestamp=datetime.now(timezone.utc)
    )
