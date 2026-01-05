# SecOps Pulse - AI-Ops Security Observability Platform

<p align="center">
  <img src="https://via.placeholder.com/100x100/007AFF/ffffff?text=SP" alt="SecOps Pulse Logo" width="100" height="100"/>
</p>

<p align="center">
  <strong>AI-powered security observability for DevSecOps teams</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#api-documentation">API</a> •
  <a href="#development">Development</a>
</p>

---

## Overview

SecOps Pulse is an AI-Ops Security Observability Platform that helps DevSecOps teams detect, analyze, and respond to security incidents across cloud infrastructure, CI/CD pipelines, APIs, and automation platforms.

### Key Capabilities

- **Real-time Telemetry Collection**: Ingest events from multiple sources (CloudWatch, Azure Monitor, GitHub Actions, Power Platform, Kubernetes)
- **AI-Powered Risk Analysis**: OpenAI integration for intelligent risk scoring and incident analysis
- **Smart Alerting**: Noise suppression and intelligent alert grouping
- **Actionable Recommendations**: AI-generated remediation steps for security issues
- **Modern Dashboard**: Clean, Apple-inspired UI for real-time security monitoring

---

## Features

### Core Features

- **Event Ingestion API**: Receive and normalize security events from any source
- **Risk Scoring Engine**: Rule-based + AI-powered risk assessment (0-10 scale)
- **Incident Management**: Track and manage security incidents with status workflows
- **AI Analysis**: Summarize incidents, explain risks, and recommend fixes
- **Dashboard**: Real-time visibility into security posture

### Supported Sources

| Source | Type | Status |
|--------|------|--------|
| AWS CloudWatch | Cloud Monitoring | ✅ |
| Azure Monitor | Cloud Monitoring | ✅ |
| GitHub Actions | CI/CD | ✅ |
| Power Platform | Low-code Automation | ✅ |
| Kubernetes | Container Orchestration | ✅ |
| API Gateway | API Management | ✅ |
| OpenTelemetry | Telemetry | ✅ |

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- OpenAI API key (for AI features)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd secops-pulse
```

### 2. Configure Environment

Create a `.env` file in the project root:

```bash
# OpenAI Configuration (required for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Customize AI model
AI_MODEL=gpt-4-turbo
```

### 3. Launch with Docker Compose

```bash
# Start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 4. Access the Application

- **Dashboard**: http://localhost:3000/dashboard
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/v1/health

---

## Architecture

```
Sources → Collectors → Ingest API → Event Store → AI Engine → Dashboard
         │                                              │
         └────────────── Incident Detection ────────────┘
```

### Backend (Python/FastAPI)

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── database.py          # PostgreSQL connection
│   ├── models/              # SQLAlchemy models
│   ├── routers/             # API endpoints
│   │   ├── events.py        # Event ingestion
│   │   ├── incidents.py     # Incident management
│   │   ├── dashboard.py     # Dashboard stats
│   │   └── health.py        # Health checks
│   └── services/            # Business logic
│       ├── ai_service.py    # OpenAI integration
│       └── risk_scoring.py  # Risk assessment
└── requirements.txt
```

### Frontend (Next.js)

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── dashboard/           # Dashboard pages
│   └── api/client.ts        # API client
├── components/
│   ├── dashboard/           # Dashboard components
│   ├── incidents/           # Incident components
│   └── layout/              # Layout components
└── package.json
```

---

## API Documentation

### Event Ingestion

```bash
# Ingest a single event
POST /api/v1/ingest
Content-Type: application/json

{
  "source": "power_platform",
  "resource_type": "flow",
  "actor": "john.doe@company.com",
  "action": "create",
  "result": "success",
  "raw_payload": {
    "flow_id": "abc123",
    "connectors": ["sharepoint", "outlook"]
  }
}
```

### Incidents

```bash
# List incidents
GET /api/v1/incidents?status=open&min_risk=7

# Get incident details
GET /api/v1/incidents/{id}

# Update incident
PATCH /api/v1/incidents/{id}
Content-Type: application/json

{
  "status": "investigating"
}

# Reanalyze with AI
POST /api/v1/incidents/{id}/reanalyze
```

### Dashboard

```bash
# Get dashboard data
GET /api/v1/dashboard

# Get metrics
GET /api/v1/dashboard/metrics

# Get risk distribution
GET /api/v1/dashboard/risk-distribution
```

---

## Development

### Local Development (Without Docker)

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Initialize database
python init_db.py

# Start server
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | Generated from defaults |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Required for AI |
| `AI_MODEL` | OpenAI model to use | `gpt-4-turbo` |
| `AI_TEMPERATURE` | AI response creativity | `0.2` |
| `HIGH_RISK_THRESHOLD` | Score threshold for high risk | `7` |
| `DEBUG` | Enable debug mode | `true` |

### Risk Scoring

Risk scores are calculated on a 0-10 scale:

| Score | Level | Action |
|-------|-------|--------|
| 9-10 | Critical | Immediate attention required |
| 7-8 | High | Review within hours |
| 4-6 | Medium | Review within 24 hours |
| 1-3 | Low | Monitor and review |
| 0 | Info | Log for awareness |

---

## Production Deployment

### Docker Compose (Recommended)

```bash
docker-compose -f docker-compose.yml up -d
```

### Kubernetes

Helm charts are available in the `/k8s` directory (coming soon).

### Security Considerations

- Use strong database passwords in production
- Configure CORS appropriately for your domain
- Enable HTTPS in production
- Use secrets management for API keys
- Regular database backups

---

## Roadmap

- [ ] Custom policy engine
- [ ] SIEM export (Splunk, Elastic)
- [ ] More AI models (Anthropic, local LLMs)
- [ ] Mobile app
- [ ] SSO integration (Azure AD, Okta)
- [ ] Webhook notifications
- [ ] Custom dashboard widgets

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

MIT License - see LICENSE file for details.

---

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Email: support@secops-pulse.example.com
