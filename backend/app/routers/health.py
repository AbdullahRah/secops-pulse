"""
Health check router for system status monitoring.
Provides endpoints to check the health of the API and its dependencies.
"""

from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings


router = APIRouter()


@router.get("/health", response_model=Dict[str, Any])
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Comprehensive health check endpoint.
    Returns status of API and all dependencies.
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.API_VERSION,
        "components": {}
    }

    # Check database connection
    try:
        result = await db.execute(text("SELECT 1"))
        result.scalar()
        health_status["database"] = "connected"
        health_status["components"]["database"] = {
            "status": "healthy",
            "type": "postgresql"
        }
    except Exception as e:
        health_status["database"] = "disconnected"
        health_status["components"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"

    # Check AI service availability
    if settings.OPENAI_API_KEY:
        health_status["components"]["ai"] = {
            "status": "healthy",
            "model": settings.AI_MODEL,
            "configured": True
        }
    else:
        health_status["components"]["ai"] = {
            "status": "warning",
            "message": "AI service not configured",
            "configured": False
        }

    return health_status


@router.get("/health/live")
async def liveness_check():
    """
    Kubernetes-style liveness probe.
    Simple check to verify the service is running.
    """
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}


@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """
    Kubernetes-style readiness probe.
    Checks if the service is ready to receive traffic.
    """
    # Check database
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        return {"status": "not_ready", "reason": "database_unavailable"}

    return {"status": "ready", "timestamp": datetime.utcnow().isoformat()}
