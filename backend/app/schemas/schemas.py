"""
Pydantic schemas for API request/response validation.
Defines all data structures used in API endpoints.
"""

from datetime import datetime
from typing import Optional, List, Any, Dict
from enum import Enum

from pydantic import Field, BaseModel, ConfigDict


# ============== Enums ==============

class IncidentStatusEnum(str, Enum):
    """Enumeration of possible incident statuses."""
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class RiskLevelEnum(str, Enum):
    """Enumeration of risk levels based on score."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class EventSourceEnum(str, Enum):
    """Enumeration of supported event sources."""
    CLOUDWATCH = "cloudwatch"
    AZURE_MONITOR = "azure_monitor"
    GITHUB_ACTIONS = "github_actions"
    POWER_PLATFORM = "power_platform"
    KUBERNETES = "kubernetes"
    API_GATEWAY = "api_gateway"
    OPEN_TELEMETRY = "opentelemetry"
    CUSTOM = "custom"


# ============== Event Schemas ==============

class EventIngest(BaseModel):
    """
    Schema for ingesting a single event.
    Used as input for the event ingestion API.
    """
    source: EventSourceEnum = Field(..., description="Source of the event")
    resource_id: Optional[str] = Field(None, description="Associated resource ID")
    resource_type: Optional[str] = Field(None, description="Type of resource")
    event_type: Optional[str] = Field(None, description="Type of event")
    actor: Optional[str] = Field(None, description="Actor who performed the action")
    actor_type: Optional[str] = Field(None, description="Type of actor (user, service, system)")
    action: Optional[str] = Field(None, description="Action performed")
    result: Optional[str] = Field(None, description="Result of the action (success, failure)")
    timestamp: Optional[datetime] = Field(None, description="When the event occurred")
    raw_payload: Dict[str, Any] = Field(..., description="Raw event payload")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "source": "power_platform",
                "resource_type": "flow",
                "actor": "john.doe@company.com",
                "action": "create",
                "result": "success",
                "timestamp": "2024-01-15T10:30:00Z",
                "raw_payload": {
                    "flow_id": "abc123",
                    "flow_name": "Daily Report Automation",
                    "connectors": ["sharepoint", "outlook"]
                },
                "metadata": {
                    "environment": "production",
                    "region": "eastus"
                }
            }
        }
    )


class EventBatchIngest(BaseModel):
    """
    Schema for ingesting multiple events at once.
    Useful for bulk imports or batch processing.
    """
    events: List[EventIngest] = Field(..., min_length=1, max_length=100)


class EventResponse(BaseModel):
    """
    Schema for event response data.
    """
    id: str = Field(..., description="Unique event ID")
    source: str = Field(..., description="Event source")
    resource_id: Optional[str] = Field(None, description="Associated resource ID")
    actor: Optional[str] = Field(None, description="Actor who performed the action")
    action: Optional[str] = Field(None, description="Action performed")
    result: Optional[str] = Field(None, description="Result of the action")
    risk_score: Optional[int] = Field(None, description="Assigned risk score (0-10)")
    processed: bool = Field(..., description="Whether event has been processed")
    event_timestamp: Optional[datetime] = Field(None, description="When the event occurred")
    created_at: datetime = Field(..., description="When event was ingested")

    model_config = ConfigDict(from_attributes=True)


# ============== Incident Schemas ==============

class IncidentCreate(BaseModel):
    """
    Schema for creating a new incident manually.
    """
    title: str = Field(..., min_length=1, max_length=500, description="Incident title")
    description: Optional[str] = Field(None, description="Incident description")
    category: Optional[str] = Field(None, description="Incident category")
    tags: Optional[List[str]] = Field(None, description="Tags for categorization")


class IncidentUpdate(BaseModel):
    """
    Schema for updating an existing incident.
    """
    status: Optional[IncidentStatusEnum] = Field(None, description="New status")
    title: Optional[str] = Field(None, min_length=1, max_length=500, description="Updated title")
    description: Optional[str] = Field(None, description="Updated description")
    tags: Optional[List[str]] = Field(None, description="Updated tags")


class IncidentEventReference(BaseModel):
    """
    Brief reference to an event within an incident.
    """
    id: str
    source: str
    action: Optional[str]
    timestamp: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class RecommendationResponse(BaseModel):
    """
    Schema for AI-generated recommendation.
    """
    id: str
    title: str
    description: Optional[str]
    fix_steps: Optional[List[Dict[str, Any]]]
    priority: Optional[int]
    effort_estimate: Optional[str]
    category: Optional[str]
    automation_possible: bool
    applied: bool

    model_config = ConfigDict(from_attributes=True)


class IncidentResponse(BaseModel):
    """
    Detailed incident response including AI analysis.
    """
    id: str
    title: str
    description: Optional[str]
    risk_score: int
    risk_level: RiskLevelEnum
    ai_summary: Optional[str]
    ai_explanation: Optional[str]
    ai_recommendations: Optional[List[Dict[str, Any]]]
    status: IncidentStatusEnum
    category: Optional[str]
    tags: Optional[List[str]]
    source_events_count: int
    first_event_at: Optional[datetime]
    last_event_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    events: List[IncidentEventReference] = []
    recommendations: List[RecommendationResponse] = []

    model_config = ConfigDict(from_attributes=True)


class IncidentListItem(BaseModel):
    """
    Brief incident information for list views.
    """
    id: str
    title: str
    risk_score: int
    risk_level: RiskLevelEnum
    status: IncidentStatusEnum
    category: Optional[str]
    source_events_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IncidentListResponse(BaseModel):
    """
    Paginated list of incidents.
    """
    incidents: List[IncidentListItem]
    total: int
    page: int
    page_size: int
    has_more: bool


# ============== Dashboard Schemas ==============

class DashboardMetrics(BaseModel):
    """
    Key metrics for the dashboard overview.
    """
    total_events_today: int = Field(..., description="Events ingested today")
    total_events_week: int = Field(..., description="Events ingested this week")
    open_incidents: int = Field(..., description="Currently open incidents")
    high_risk_incidents: int = Field(..., description="High and critical risk incidents")
    resolved_today: int = Field(..., description="Incidents resolved today")
    average_risk_score: float = Field(..., description="Average risk score of open incidents")


class RiskDistribution(BaseModel):
    """
    Distribution of incidents by risk level.
    """
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0


class EventsOverTime(BaseModel):
    """
    Event count data point for time series charts.
    """
    timestamp: datetime
    count: int
    source: str


class DashboardResponse(BaseModel):
    """
    Complete dashboard data response.
    """
    metrics: DashboardMetrics
    risk_distribution: RiskDistribution
    recent_incidents: List[IncidentListItem]
    events_over_time: List[EventsOverTime]
    top_categories: List[Dict[str, Any]]


# ============== Health Check Schemas ==============

class HealthCheckResponse(BaseModel):
    """
    Health check response with component status.
    """
    status: str
    version: str
    database: str
    components: Dict[str, Dict[str, Any]]


# ============== AI Analysis Schemas ==============

class AIAnalysisRequest(BaseModel):
    """
    Request for AI analysis of an event or incident.
    """
    event_data: Dict[str, Any] = Field(..., description="Event data to analyze")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")


class AIAnalysisResponse(BaseModel):
    """
    Response from AI analysis.
    """
    risk_score: int = Field(..., description="Risk score (0-10)")
    risk_factors: List[str] = Field(default_factory=list, description="Factors contributing to risk")
    summary: str = Field(..., description="Brief summary of the issue")
    explanation: str = Field(..., description="Detailed explanation")
    recommendations: List[Dict[str, Any]] = Field(default_factory=list, description="Recommended actions")
