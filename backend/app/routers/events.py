"""
Event ingestion router.
Handles receiving and processing events from various sources.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import Event, Incident, Resource, IncidentStatus, RiskLevel
from app.schemas.schemas import EventIngest, EventBatchIngest, EventResponse
from app.services.ai_service import analyze_event_with_ai
from app.services.risk_scoring import calculate_risk_score


router = APIRouter()


async def process_event(
    db: AsyncSession,
    event_data: EventIngest,
    background_tasks: Optional[BackgroundTasks] = None
) -> Event:
    """
    Process and store a single event.
    Handles normalization, risk scoring, and incident creation.
    """
    # Create the event
    event = Event(
        id=uuid.uuid4(),
        source=event_data.source.value if hasattr(event_data.source, 'value') else event_data.source,
        resource_id=uuid.UUID(event_data.resource_id) if event_data.resource_id else None,
        event_type=event_data.event_type,
        actor=event_data.actor,
        actor_type=event_data.actor_type,
        action=event_data.action,
        result=event_data.result,
        event_timestamp=event_data.timestamp,
        raw_payload=event_data.raw_payload,
        metadata=event_data.metadata,
        normalized_data={
            "source": event_data.source.value if hasattr(event_data.source, 'value') else event_data.source,
            "resource_type": event_data.resource_type,
            "actor": event_data.actor,
            "action": event_data.action,
            "result": event_data.result,
        },
        processed=False,
    )
    
    # Calculate initial risk score using rules
    risk_score = await calculate_risk_score(event_data)
    event.risk_score = risk_score
    
    # Add to session and commit
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    # Trigger AI analysis for high-risk events
    if risk_score >= settings.HIGH_RISK_THRESHOLD and background_tasks:
        background_tasks.add_task(
            analyze_and_create_incident,
            db,
            event.id,
            event_data
        )
    
    return event


async def analyze_and_create_incident(
    db: AsyncSession,
    event_id: uuid.UUID,
    event_data: EventIngest
):
    """
    Background task to analyze event with AI and create incident if needed.
    """
    try:
        # Analyze event with AI
        ai_result = await analyze_event_with_ai(event_data)
        
        # Get the event
        result = await db.execute(select(Event).where(Event.id == event_id))
        event = result.scalar_one_or_none()
        
        if not event:
            return
        
        # Update event with AI analysis
        event.risk_score = ai_result.risk_score
        event.risk_factors = ai_result.risk_factors
        event.processed = True
        
        # Determine risk level
        risk_level = get_risk_level(ai_result.risk_score)
        
        # Create incident
        incident = Incident(
            id=uuid.uuid4(),
            title=ai_result.summary[:500],
            description=ai_result.explanation,
            risk_score=ai_result.risk_score,
            risk_level=risk_level,
            risk_factors=ai_result.risk_factors,
            ai_summary=ai_result.summary,
            ai_explanation=ai_result.explanation,
            ai_recommendations=ai_result.recommendations,
            status=IncidentStatus.OPEN,
            category=determine_category(event_data),
            first_event_at=event.event_timestamp or datetime.utcnow(),
            last_event_at=datetime.utcnow(),
            source_events_count=1,
        )
        
        db.add(incident)
        
        # Link event to incident
        event.incident_id = incident.id
        
        await db.commit()
        
    except Exception as e:
        # Log error but don't fail the request
        print(f"Error in background AI analysis: {e}")


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


def determine_category(event_data: EventIngest) -> str:
    """Determine incident category based on event data."""
    source = str(event_data.source.value if hasattr(event_data.source, 'value') else event_data.source)
    
    if source in ["power_platform", "github_actions"]:
        return "automation"
    elif source in ["cloudwatch", "azure_monitor"]:
        return "cloud"
    elif source in ["kubernetes", "api_gateway"]:
        return "infrastructure"
    else:
        return "security"


@router.post("/ingest", response_model=EventResponse, status_code=201)
async def ingest_single_event(
    event_data: EventIngest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest a single event from any supported source.
    
    Events are normalized, scored for risk, and processed for potential incidents.
    High-risk events trigger AI analysis in the background.
    """
    event = await process_event(db, event_data, background_tasks)
    
    return EventResponse(
        id=str(event.id),
        source=event.source,
        resource_id=str(event.resource_id) if event.resource_id else None,
        actor=event.actor,
        action=event.action,
        result=event.result,
        risk_score=event.risk_score,
        processed=event.processed,
        event_timestamp=event.event_timestamp,
        created_at=event.created_at,
    )


@router.post("/ingest/batch", response_model=List[EventResponse], status_code=201)
async def ingest_event_batch(
    batch: EventBatchIngest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest multiple events in a single request.
    Useful for bulk imports or batch processing from log aggregators.
    """
    events = []
    for event_data in batch.events:
        event = await process_event(db, event_data, background_tasks if event_data.actor else None)
        events.append(EventResponse(
            id=str(event.id),
            source=event.source,
            resource_id=str(event.resource_id) if event.resource_id else None,
            actor=event.actor,
            action=event.action,
            result=event.result,
            risk_score=event.risk_score,
            processed=event.processed,
            event_timestamp=event.event_timestamp,
            created_at=event.created_at,
        ))
    
    return events


@router.get("/events", response_model=List[EventResponse])
async def list_events(
    skip: int = 0,
    limit: int = 100,
    source: Optional[str] = None,
    min_risk: Optional[int] = None,
    processed: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List ingested events with optional filtering.
    """
    query = select(Event).offset(skip).limit(limit)
    
    if source:
        query = query.where(Event.source == source)
    if min_risk is not None:
        query = query.where(Event.risk_score >= min_risk)
    if processed is not None:
        query = query.where(Event.processed == processed)
    
    result = await db.execute(query)
    events = result.scalars().all()
    
    return [
        EventResponse(
            id=str(event.id),
            source=event.source,
            resource_id=str(event.resource_id) if event.resource_id else None,
            actor=event.actor,
            action=event.action,
            result=event.result,
            risk_score=event.risk_score,
            processed=event.processed,
            event_timestamp=event.event_timestamp,
            created_at=event.created_at,
        )
        for event in events
    ]


@router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get a specific event by ID with full details.
    """
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return EventResponse(
        id=str(event.id),
        source=event.source,
        resource_id=str(event.resource_id) if event.resource_id else None,
        actor=event.actor,
        action=event.action,
        result=event.result,
        risk_score=event.risk_score,
        processed=event.processed,
        event_timestamp=event.event_timestamp,
        created_at=event.created_at,
    )


@router.get("/events/stats/summary")
async def get_event_stats(
    source: Optional[str] = None,
    hours: int = 24,
    db: AsyncSession = Depends(get_db)
):
    """
    Get event statistics for monitoring and analytics.
    """
    from datetime import datetime, timedelta
    
    since = datetime.utcnow() - timedelta(hours=hours)
    
    # Count by source
    if source:
        count_query = select(func.count()).where(
            and_(Event.source == source, Event.created_at >= since)
        )
    else:
        count_query = select(func.count()).where(Event.created_at >= since)
    
    result = await db.execute(count_query)
    total_count = result.scalar()
    
    # Risk distribution
    high_risk_query = select(func.count()).where(
        and_(
            Event.risk_score >= settings.HIGH_RISK_THRESHOLD,
            Event.created_at >= since
        )
    )
    result = await db.execute(high_risk_query)
    high_risk_count = result.scalar()
    
    return {
        "total_events": total_count,
        "high_risk_events": high_risk_count,
        "period_hours": hours,
        "high_risk_percentage": round(high_risk_count / total_count * 100, 2) if total_count > 0 else 0
    }


# Import settings for access to thresholds
from app.config import settings
