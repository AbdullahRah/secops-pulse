"""
Incident management router.
Handles CRUD operations for security incidents and their analysis.
"""

import uuid
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.models import (
    Incident, Event, Recommendation, IncidentStatus, RiskLevel
)
from app.schemas.schemas import (
    IncidentCreate, IncidentUpdate, IncidentResponse,
    IncidentListItem, IncidentListResponse, RecommendationResponse
)
from app.services.ai_service import analyze_incident_with_ai


router = APIRouter()


@router.get("/incidents", response_model=IncidentListResponse)
async def list_incidents(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    status: Optional[IncidentStatus] = None,
    min_risk: Optional[int] = Query(default=None, ge=0, le=10),
    max_risk: Optional[int] = Query(default=None, ge=0, le=10),
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List incidents with filtering, pagination, and sorting.
    """
    # Build query
    query = select(Incident)
    
    if status:
        query = query.where(Incident.status == status)
    if min_risk is not None:
        query = query.where(Incident.risk_score >= min_risk)
    if max_risk is not None:
        query = query.where(Incident.risk_score <= max_risk)
    if category:
        query = query.where(Incident.category == category)
    if search:
        query = query.where(Incident.title.ilike(f"%{search}%"))
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    result = await db.execute(count_query)
    total = result.scalar()
    
    # Add ordering and pagination
    query = query.order_by(desc(Incident.created_at)).offset(skip).limit(limit)
    
    # Execute
    result = await db.execute(query)
    incidents = result.scalars().all()
    
    # Build response
    items = [
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
    
    return IncidentListResponse(
        incidents=items,
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        has_more=skip + limit < total,
    )


@router.get("/incidents/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed incident information including events and recommendations.
    """
    result = await db.execute(
        select(Incident)
        .options(
            selectinload(Incident.events),
            selectinload(Incident.recommendations),
        )
        .where(Incident.id == incident_id)
    )
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Build event references
    events = [
        {
            "id": str(event.id),
            "source": event.source,
            "action": event.action,
            "timestamp": event.event_timestamp,
        }
        for event in incident.events
    ]
    
    # Build recommendations
    recommendations = [
        RecommendationResponse(
            id=str(rec.id),
            title=rec.title,
            description=rec.description,
            fix_steps=rec.fix_steps,
            priority=rec.priority,
            effort_estimate=rec.effort_estimate,
            category=rec.category,
            automation_possible=rec.automation_possible,
            applied=rec.applied,
        )
        for rec in incident.recommendations
    ]
    
    return IncidentResponse(
        id=str(incident.id),
        title=incident.title,
        description=incident.description,
        risk_score=incident.risk_score,
        risk_level=incident.risk_level,
        ai_summary=incident.ai_summary,
        ai_explanation=incident.ai_explanation,
        ai_recommendations=incident.ai_recommendations,
        status=incident.status,
        category=incident.category,
        tags=incident.tags,
        source_events_count=incident.source_events_count,
        first_event_at=incident.first_event_at,
        last_event_at=incident.last_event_at,
        created_at=incident.created_at,
        updated_at=incident.updated_at,
        events=events,
        recommendations=recommendations,
    )


@router.post("/incidents", response_model=IncidentResponse, status_code=201)
async def create_incident(
    incident_data: IncidentCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Manually create a new incident (for testing or manual triage).
    """
    incident = Incident(
        id=uuid.uuid4(),
        title=incident_data.title,
        description=incident_data.description,
        category=incident_data.category,
        tags=incident_data.tags,
        risk_score=5,  # Default score
        risk_level=RiskLevel.MEDIUM,
        status=IncidentStatus.OPEN,
        first_event_at=datetime.utcnow(),
        last_event_at=datetime.utcnow(),
        source_events_count=1,
    )
    
    db.add(incident)
    await db.commit()
    await db.refresh(incident)
    
    return await get_incident(str(incident.id), db)


@router.patch("/incidents/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str,
    update_data: IncidentUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update incident properties (status, title, description, tags).
    """
    result = await db.execute(
        select(Incident).where(Incident.id == incident_id)
    )
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Apply updates
    if update_data.status is not None:
        incident.status = update_data.status
        if update_data.status == IncidentStatus.RESOLVED:
            incident.resolved_at = datetime.utcnow()
    
    if update_data.title is not None:
        incident.title = update_data.title
    
    if update_data.description is not None:
        incident.description = update_data.description
    
    if update_data.tags is not None:
        incident.tags = update_data.tags
    
    incident.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(incident)
    
    return await get_incident(incident_id, db)


@router.post("/incidents/{incident_id}/reanalyze", response_model=IncidentResponse)
async def reanalyze_incident(
    incident_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger AI re-analysis of an incident.
    Useful when new context becomes available.
    """
    result = await db.execute(
        select(Incident)
        .options(selectinload(Incident.events))
        .where(Incident.id == incident_id)
    )
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Gather event data
    events_data = []
    for event in incident.events:
        events_data.append({
            "source": event.source,
            "action": event.action,
            "actor": event.actor,
            "result": event.result,
            "raw_payload": event.raw_payload,
        })
    
    # Analyze with AI
    ai_result = await analyze_incident_with_ai(
        incident_title=incident.title,
        incident_description=incident.description or "",
        events=events_data,
        current_risk_score=incident.risk_score,
    )
    
    # Update incident
    incident.risk_score = ai_result.risk_score
    incident.risk_level = get_risk_level(ai_result.risk_score)
    incident.ai_summary = ai_result.summary
    incident.ai_explanation = ai_result.explanation
    incident.ai_recommendations = ai_result.recommendations
    incident.risk_factors = ai_result.risk_factors
    incident.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(incident)
    
    return await get_incident(incident_id, db)


@router.post("/incidents/{incident_id}/resolve", response_model=IncidentResponse)
async def resolve_incident(
    incident_id: str,
    resolution_notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Mark an incident as resolved.
    """
    result = await db.execute(
        select(Incident).where(Incident.id == incident_id)
    )
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident.status = IncidentStatus.RESOLVED
    incident.resolved_at = datetime.utcnow()
    incident.updated_at = datetime.utcnow()
    
    if resolution_notes:
        if incident.description:
            incident.description += f"\n\nResolution notes: {resolution_notes}"
        else:
            incident.description = f"Resolution notes: {resolution_notes}"
    
    await db.commit()
    await db.refresh(incident)
    
    return await get_incident(incident_id, db)


@router.get("/incidents/stats/summary")
async def get_incident_stats(
    days: int = Query(default=7, ge=1, le=90),
    db: AsyncSession = Depends(get_db)
):
    """
    Get incident statistics for reporting and analytics.
    """
    from datetime import datetime, timedelta
    
    since = datetime.utcnow() - timedelta(days=days)
    
    # Status distribution
    status_query = (
        select(Incident.status, func.count())
        .where(Incident.created_at >= since)
        .group_by(Incident.status)
    )
    result = await db.execute(status_query)
    status_counts = dict(result.all())
    
    # Risk distribution
    risk_query = (
        select(Incident.risk_level, func.count())
        .where(Incident.created_at >= since)
        .group_by(Incident.risk_level)
    )
    result = await db.execute(risk_query)
    risk_counts = dict(result.all())
    
    # Average resolution time
    resolved_query = select(func.avg(
        func.extract('epoch', Incident.resolved_at) - 
        func.extract('epoch', Incident.created_at)
    )).where(
        and_(
            Incident.status == IncidentStatus.RESOLVED,
            Incident.resolved_at >= since
        )
    )
    result = await db.execute(resolved_query)
    avg_resolution_seconds = result.scalar()
    
    # Total count
    total_query = select(func.count()).where(Incident.created_at >= since)
    result = await db.execute(total_query)
    total = result.scalar()
    
    return {
        "period_days": days,
        "total_incidents": total,
        "by_status": status_counts,
        "by_risk_level": risk_counts,
        "average_resolution_time_hours": round(avg_resolution_seconds / 3600, 2) if avg_resolution_seconds else None,
        "open_incidents": status_counts.get(IncidentStatus.OPEN, 0),
        "resolved_incidents": status_counts.get(IncidentStatus.RESOLVED, 0),
    }


def get_risk_level(score: int) -> RiskLevel:
    """Determine risk level from score."""
    if score >= 9:
        return RiskLevel.CRITICAL
    elif score >= 7:
        return RiskLevel.HIGH
    elif score >= 4:
        return RiskLevel.MEDIUM
    elif score >= 1:
        return RiskLevel.LOW
    else:
        return RiskLevel.INFO
