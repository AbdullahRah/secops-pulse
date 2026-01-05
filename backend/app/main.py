"""
SecOps Pulse - AI-Ops Security Observability Platform

A comprehensive security observability platform that collects telemetry,
detects risks and vulnerabilities, explains impact using AI, and recommends fixes.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db, close_db
from app.routers import events, incidents, dashboard, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler for startup and shutdown events.
    Initializes and closes database connections.
    """
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


# Create FastAPI application
app = FastAPI(
    title="SecOps Pulse API",
    description="""
    ## AI-Ops Security Observability Platform API

    SecOps Pulse provides comprehensive security observability by:
    - Collecting telemetry from multiple sources (logs, metrics, traces, audit events)
    - Detecting configuration vulnerabilities and behavioral risks
    - Analyzing incidents using AI to provide risk scores and recommendations
    - Delivering actionable insights through a clean, modern API

    ### Core Features
    - **Event Ingestion**: Receive and normalize security events from any source
    - **AI-Powered Analysis**: OpenAI integration for intelligent risk assessment
    - **Incident Management**: Track and manage security incidents with severity scoring
    - **Dashboard Metrics**: Real-time visibility into security posture

    ### API Version
    - Current: v1 (stable)
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(events.router, prefix="/api/v1", tags=["Events"])
app.include_router(incidents.router, prefix="/api/v1", tags=["Incidents"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])


@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint providing API overview and quick links.
    """
    return {
        "name": "SecOps Pulse API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "health": "/api/v1/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
    )
