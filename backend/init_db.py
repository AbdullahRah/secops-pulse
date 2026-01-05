"""
Database initialization script.
Creates all tables and optionally seeds sample data.
"""

import asyncio
from datetime import datetime, timedelta
import uuid
import random

from app.database import init_db, engine, async_session_factory
from app.models.models import (
    Base, Event, Incident, Resource, Recommendation,
    IncidentStatus, RiskLevel, EventSource, ResourceType
)
from app.config import settings


async def create_tables():
    """Create all database tables."""
    print("Creating database tables...")
    await init_db()
    print("Database tables created successfully!")


async def seed_sample_data():
    """Seed database with sample data for testing."""
    print("Seeding sample data...")
    
    async with async_session_factory() as session:
        # Create sample resources
        resources = []
        resource_data = [
            ("prod-api-server-001", ResourceType.SERVER, "prod", "critical"),
            ("staging-db-001", ResourceType.DATABASE, "staging", "high"),
            ("daily-report-flow", ResourceType.FLOW, "prod", "medium"),
            ("payment-processor", ResourceType.API, "prod", "critical"),
            ("ci-cd-pipeline", ResourceType.WORKFLOW, "prod", "high"),
        ]
        
        for name, rtype, env, sensitivity in resource_data:
            resource = Resource(
                id=uuid.uuid4(),
                name=name,
                type=rtype,
                owner=f"team-{name.split('-')[0]}@company.com",
                environment=env,
                sensitivity=sensitivity,
                health_status="healthy",
            )
            resources.append(resource)
            session.add(resource)
        
        await session.commit()
        print(f"Created {len(resources)} sample resources")
        
        # Create sample events
        events = []
        event_samples = [
            {
                "source": EventSource.POWER_PLATFORM,
                "action": "create",
                "actor": "john.doe@company.com",
                "result": "success",
                "risk_score": 6,
            },
            {
                "source": EventSource.GITHUB_ACTIONS,
                "action": "push",
                "actor": "service-account@github.com",
                "result": "success",
                "risk_score": 4,
            },
            {
                "source": EventSource.KUBERNETES,
                "action": "scale",
                "actor": "system:controller",
                "result": "success",
                "risk_score": 5,
            },
            {
                "source": EventSource.CLOUDWATCH,
                "action": "auth_failure",
                "actor": "unknown@192.168.1.100",
                "result": "failure",
                "risk_score": 8,
            },
            {
                "source": EventSource.AZURE_MONITOR,
                "action": "config_change",
                "actor": "admin@company.com",
                "result": "success",
                "risk_score": 5,
            },
        ]
        
        for i, sample in enumerate(event_samples):
            event = Event(
                id=uuid.uuid4(),
                resource_id=resources[i % len(resources)].id,
                source=sample["source"],
                action=sample["action"],
                actor=sample["actor"],
                result=sample["result"],
                event_timestamp=datetime.utcnow() - timedelta(hours=random.randint(0, 48)),
                raw_payload={"sample": True, "index": i},
                normalized_data={
                    "source": str(sample["source"].value),
                    "action": sample["action"],
                    "actor": sample["actor"],
                },
                risk_score=sample["risk_score"],
                processed=True,
            )
            events.append(event)
            session.add(event)
        
        await session.commit()
        print(f"Created {len(events)} sample events")
        
        # Create sample incidents
        incidents = []
        incident_data = [
            {
                "title": "Suspicious Power Automate Flow Creation",
                "description": "A new Power Automate flow was created with access to SharePoint and Outlook connectors",
                "risk_score": 7,
                "risk_level": RiskLevel.HIGH,
                "category": "automation",
                "ai_summary": "New automation accessing sensitive data sources",
            },
            {
                "title": "Multiple Failed Authentication Attempts",
                "description": "Multiple failed login attempts detected from unusual IP address",
                "risk_score": 9,
                "risk_level": RiskLevel.CRITICAL,
                "category": "authentication",
                "ai_summary": "Potential brute force attack detected",
            },
            {
                "title": "Configuration Change in Production",
                "description": "Production API configuration was modified outside business hours",
                "risk_score": 6,
                "risk_level": RiskLevel.MEDIUM,
                "category": "configuration",
                "ai_summary": "Out-of-hours configuration change requires review",
            },
            {
                "title": "New GitHub Workflow with Broad Permissions",
                "description": "A CI/CD workflow was created with elevated permissions",
                "risk_score": 5,
                "risk_level": RiskLevel.MEDIUM,
                "category": "automation",
                "ai_summary": "New automation workflow with elevated permissions",
            },
        ]
        
        for i, data in enumerate(incident_data):
            incident = Incident(
                id=uuid.uuid4(),
                title=data["title"],
                description=data["description"],
                risk_score=data["risk_score"],
                risk_level=data["risk_level"],
                ai_summary=data["ai_summary"],
                ai_explanation=f"Analysis of {data['title']}: This incident requires attention due to the security implications of the detected activity.",
                ai_recommendations=[
                    {
                        "title": "Review the change",
                        "description": "Verify this change was authorized",
                        "priority": "high"
                    },
                    {
                        "title": "Check related events",
                        "description": "Look for similar activity in logs",
                        "priority": "medium"
                    }
                ],
                status=IncidentStatus.OPEN if i < 3 else IncidentStatus.RESOLVED,
                category=data["category"],
                first_event_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
                last_event_at=datetime.utcnow() - timedelta(minutes=random.randint(0, 60)),
                source_events_count=random.randint(1, 10),
                tags=["sample", data["category"]],
            )
            incidents.append(incident)
            session.add(incident)
            
            # Create sample recommendations
            recommendation = Recommendation(
                id=uuid.uuid4(),
                incident_id=incident.id,
                title=f"Remediate {data['title']}",
                description="Follow these steps to address the security concern",
                fix_steps=[
                    {"step": 1, "action": "Investigate", "description": "Review the incident details"},
                    {"step": 2, "action": "Verify", "description": "Confirm if activity was authorized"},
                    {"step": 3, "action": "Remediate", "description": "Take appropriate action"},
                ],
                priority=10 - data["risk_score"],
                effort_estimate="2-4 hours",
                category="corrective",
                automation_possible=False,
            )
            session.add(recommendation)
        
        await session.commit()
        print(f"Created {len(incidents)} sample incidents with recommendations")
        
        print("Sample data seeded successfully!")


async def reset_database():
    """Reset database by dropping and recreating tables."""
    print("Resetting database...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await create_tables()
    await seed_sample_data()


async def main():
    """Main entry point for database operations."""
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--reset":
        await reset_database()
    else:
        await create_tables()
        if settings.DEBUG:
            await seed_sample_data()


if __name__ == "__main__":
    asyncio.run(main())
