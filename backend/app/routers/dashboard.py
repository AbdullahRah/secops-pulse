"""
Dashboard router.
Provides aggregated data and statistics for the dashboard UI.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.models import (
    Incident, Event, IncidentStatus, RiskLevel
)
from app.schemas.schemas import (
    DashboardResponse, DashboardMetrics, RiskDistribution,
    IncidentListItem, EventsOverTime
)


router = APIRouter()


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    db: AsyncSession = Depends(get_db)
):
    """
    Get complete dashboard data in a single request.
    Includes metrics, risk distribution, recent incidents, and trends.
    """
    # Get metrics
    metrics = await get_metrics(db)
    
    # Get risk distribution
    risk_distribution = await get_risk_distribution(db)
    
    # Get recent incidents
    recent_incidents = await get_recent_incidents(db, limit=10)
    
    # Get events over time
    events_over_time = await get_events_timeline(db, hours=24)
    
    # Get top categories
    top_categories = await get_top_categories(db)
    
    return DashboardResponse(
        metrics=metrics,
        risk_distribution=risk_distribution,
        recent_incidents=recent_incidents,
        events_over_time=events_over_time,
        top_categories=top_categories,
    )


async def get_metrics(db: AsyncSession) -> DashboardMetrics:
    """Calculate key dashboard metrics."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    
    # Total events today
    events_today_query = select(func.count()).where(Event.created_at >= today_start)
    result = await db.execute(events_today_query)
    total_events_today = result.scalar() or 0
    
    # Total events this week
    events_week_query = select(func.count()).where(Event.created_at >= week_start)
    result = await db.execute(events_week_query)
    total_events_week = result.scalar() or 0
    
    # Open incidents
    open_incidents_query = select(func.count()).where(
        Incident.status == IncidentStatus.OPEN
    )
    result = await db.execute(open_incidents_query)
    open_incidents = result.scalar() or 0
    
    # High risk incidents
    high_risk_query = select(func.count()).where(
        and_(
            Incident.status == IncidentStatus.OPEN,
            Incident.risk_score >= 7
        )
    )
    result = await db.execute(high_risk_query)
    high_risk_incidents = result.scalar() or 0
    
    # Resolved today
    resolved_today_query = select(func.count()).where(
        and_(
            Incident.status == IncidentStatus.RESOLVED,
            Incident.resolved_at >= today_start
        )
    )
    result = await db.execute(resolved_today_query)
    resolved_today = result.scalar() or 0
    
    # Average risk score of open incidents
    avg_risk_query = select(func.avg(Incident.risk_score)).where(
        Incident.status == IncidentStatus.OPEN
    )
    result = await db.execute(avg_risk_query)
    avg_risk_score = round(result.scalar() or 0, 2)
    
    return DashboardMetrics(
        total_events_today=total_events_today,
        total_events_week=total_events_week,
        open_incidents=open_incidents,
        high_risk_incidents=high_risk_incidents,
        resolved_today=resolved_today,
        average_risk_score=avg_risk_score,
    )


async def get_risk_distribution(db: AsyncSession) -> RiskDistribution:
    """Get count of incidents by risk level."""
    distribution = RiskDistribution()
    
    # Only count open incidents
    for level in RiskLevel:
        query = select(func.count()).where(
            and_(
                Incident.status == IncidentStatus.OPEN,
                Incident.risk_level == level
            )
        )
        result = await db.execute(query)
        count = result.scalar() or 0
        
        if level == RiskLevel.CRITICAL:
            distribution.critical = count
        elif level == RiskLevel.HIGH:
            distribution.high = count
        elif level == RiskLevel.MEDIUM:
            distribution.medium = count
        elif level == RiskLevel.LOW:
            distribution.low = count
        else:
            distribution.info = count
    
    return distribution


async def get_recent_incidents(
    db: AsyncSession,
    limit: int = 10
) -> List[IncidentListItem]:
    """Get most recent incidents."""
    result = await db.execute(
        select(Incident)
        .order_by(desc(Incident.created_at))
        .limit(limit)
    )
    incidents = result.scalars().all()
    
    return [
        IncidentListItem(
            id=str(incident.id),
            title=incident.title,
            risk_score=incident.risk_score,
            risk_level=incident.risk_level,
            status=incident.status,
            category=incident.category,
            source_events_count=incident.source_events_count,
            created_at=incident.created_at,
            updated_at=incident.updated_at,
        )
        for incident in incidents
    ]


async def get_events_timeline(
    db: AsyncSession,
    hours: int = 24,
    interval_minutes: int = 60
) -> List[EventsOverTime]:
    """Get event counts over time for charts."""
    since = datetime.utcnow() - timedelta(hours=hours)
    
    # Aggregate by source and time bucket
    # This is a simplified version - in production, use SQL date_trunc
    query = (
        select(
            Event.source,
            func.date_trunc('hour', Event.created_at).label('hour'),
            func.count().label('count')
        )
        .where(Event.created_at >= since)
        .group_by(Event.source, func.date_trunc('hour', Event.created_at))
        .order_by(func.date_trunc('hour', Event.created_at))
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    # Group by hour and source
    events_map = {}
    for source, hour, count in rows:
        key = f"{hour.isoformat()}_{source}"
        events_map[key] = {
            "timestamp": hour,
            "source": source,
            "count": count,
        }
    
    # Return as list
    return [
        EventsOverTime(**data)
        for data in events_map.values()
    ]


async def get_top_categories(db: AsyncSession) -> List[Dict[str, Any]]:
    """Get top incident categories with counts."""
    query = (
        select(Incident.category, func.count().label('count'))
        .where(Incident.status == IncidentStatus.OPEN)
        .group_by(Incident.category)
        .order_by(desc('count'))
        .limit(5)
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    return [
        {"category": category or "uncategorized", "count": count}
        for category, count in rows
    ]


@router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_metrics_only(
    db: AsyncSession = Depends(get_db)
):
    """
    Get just the key metrics (for widgets).
    """
    return await get_metrics(db)


@router.get("/dashboard/risk-distribution", response_model=RiskDistribution)
async def get_risk_distribution_only(
    db: AsyncSession = Depends(get_db)
):
    """
    Get just the risk distribution (for charts).
    """
    return await get_risk_distribution(db)


@router.get("/dashboard/recent-incidents", response_model=List[IncidentListItem])
async def get_recent_incidents_only(
    limit: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """
    Get just recent incidents (for lists).
    """
    return await get_recent_incidents(db, limit)
