"""
SQLAlchemy database models for SecOps Pulse.
Defines tables for events, incidents, resources, and recommendations.
"""

from datetime import datetime
from enum import Enum as PyEnum
from typing import List, Optional
import uuid

from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Float,
    DateTime,
    Boolean,
    ForeignKey,
    JSON,
    Index,
    Enum,
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from app.database import Base


class IncidentStatus(str, PyEnum):
    """Enumeration of possible incident statuses."""
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class RiskLevel(str, PyEnum):
    """Enumeration of risk levels based on score."""
    CRITICAL = "critical"    # Score 9-10
    HIGH = "high"            # Score 7-8
    MEDIUM = "medium"        # Score 4-6
    LOW = "low"              # Score 1-3
    INFO = "info"            # Score 0


class EventSource(str, PyEnum):
    """Enumeration of supported event sources."""
    CLOUDWATCH = "cloudwatch"
    AZURE_MONITOR = "azure_monitor"
    GITHUB_ACTIONS = "github_actions"
    POWER_PLATFORM = "power_platform"
    KUBERNETES = "kubernetes"
    API_GATEWAY = "api_gateway"
    OPEN_TELEMETRY = "opentelemetry"
    CUSTOM = "custom"


class ResourceType(str, PyEnum):
    """Enumeration of resource types."""
    SERVER = "server"
    DATABASE = "database"
    API = "api"
    FLOW = "flow"            # Power Automate flow
    WORKFLOW = "workflow"    # GitHub Actions workflow
    CONTAINER = "container"
    STORAGE = "storage"
    IDENTITY = "identity"


class Resource(Base):
    """
    Represents a tracked resource in the system.
    Resources are entities that can be affected by security events.
    """
    __tablename__ = "resources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    type = Column(Enum(ResourceType), nullable=False)
    owner = Column(String(255), nullable=True)
    environment = Column(String(50), nullable=True)  # production, staging, development
    sensitivity = Column(String(50), nullable=True)  # low, medium, high, critical
    metadata = Column(JSON, nullable=True)
    health_status = Column(String(50), default="healthy")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    events = relationship("Event", back_populates="resource", lazy="dynamic")
    incidents = relationship("IncidentResource", back_populates="resource")

    __table_args__ = (
        Index("ix_resources_type", "type"),
        Index("ix_resources_environment", "environment"),
    )


class Event(Base):
    """
    Represents a single event from any monitored source.
    Events are the atomic units of telemetry data.
    """
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resource_id = Column(UUID(as_uuid=True), ForeignKey("resources.id"), nullable=True, index=True)
    
    # Event identification
    source = Column(Enum(EventSource), nullable=False, index=True)
    event_type = Column(String(100), nullable=True)
    
    # Actor information
    actor = Column(String(255), nullable=True)
    actor_type = Column(String(50), nullable=True)  # user, service, system
    
    # Action details
    action = Column(String(100), nullable=True)
    result = Column(String(50), nullable=True)  # success, failure, error
    
    # Data
    raw_payload = Column(JSON, nullable=False)
    normalized_data = Column(JSON, nullable=True)
    
    # Risk assessment (computed or AI-assigned)
    risk_score = Column(Integer, nullable=True)
    risk_factors = Column(JSON, nullable=True)
    
    # Timestamps
    event_timestamp = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Processing status
    processed = Column(Boolean, default=False)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=True, index=True)

    # Relationships
    resource = relationship("Resource", back_populates="events")
    incident = relationship("Incident", back_populates="events")

    __table_args__ = (
        Index("ix_events_source_timestamp", "source", "event_timestamp"),
        Index("ix_events_actor", "actor"),
        Index("ix_events_processed", "processed"),
    )


class Incident(Base):
    """
    Represents a security incident detected by the system.
    Incidents group related events and include AI analysis.
    """
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Incident identification
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Risk assessment
    risk_score = Column(Integer, nullable=False, index=True)
    risk_level = Column(Enum(RiskLevel), nullable=False)
    risk_factors = Column(JSON, nullable=True)
    
    # AI-generated analysis
    ai_summary = Column(Text, nullable=True)
    ai_explanation = Column(Text, nullable=True)
    ai_recommendations = Column(JSON, nullable=True)
    
    # Status management
    status = Column(Enum(IncidentStatus), default=IncidentStatus.OPEN, index=True)
    
    # Categorization
    category = Column(String(100), nullable=True)  # e.g., "configuration", "behavioral", "dependency"
    tags = Column(ARRAY(String), nullable=True)
    
    # Timeline
    first_event_at = Column(DateTime, nullable=True)
    last_event_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Metadata
    source_events_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    events = relationship("Event", back_populates="incident", order_by="Event.created_at")
    resources = relationship("IncidentResource", back_populates="incident")
    recommendations = relationship("Recommendation", back_populates="incident")

    __table_args__ = (
        Index("ix_incidents_risk_status", "risk_score", "status"),
        Index("ix_incidents_created_at", "created_at"),
    )


class IncidentResource(Base):
    """
    Many-to-many relationship between incidents and resources.
    Tracks which resources are affected by an incident.
    """
    __tablename__ = "incident_resources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=False)
    resource_id = Column(UUID(as_uuid=True), ForeignKey("resources.id"), nullable=False)
    
    impact_level = Column(String(50), nullable=True)  # direct, indirect, potential
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    incident = relationship("Incident", back_populates="resources")
    resource = relationship("Resource", back_populates="incidents")

    __table_args__ = (
        Index("ix_incident_resource_incident", "incident_id"),
        Index("ix_incident_resource_resource", "resource_id"),
    )


class Recommendation(Base):
    """
    AI-generated recommendations for incident remediation.
    Provides actionable fix steps for security issues.
    """
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=False, index=True)
    
    # Recommendation content
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    fix_steps = Column(JSON, nullable=True)  # Array of step objects
    code_snippet = Column(Text, nullable=True)
    
    # Prioritization
    priority = Column(Integer, nullable=True)  # 1 = highest priority
    effort_estimate = Column(String(100), nullable=True)  # e.g., "2 hours"
    
    # Metadata
    category = Column(String(100), nullable=True)  # preventive, detective, corrective
    automation_possible = Column(Boolean, default=False)
    automation_script = Column(Text, nullable=True)
    
    # Status
    applied = Column(Boolean, default=False)
    applied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    incident = relationship("Incident", back_populates="recommendations")

    __table_args__ = (
        Index("ix_recommendations_incident", "incident_id"),
        Index("ix_recommendations_priority", "priority"),
    )
