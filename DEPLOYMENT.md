# SecOps Pulse - Deployment Complete!

Your AI-Ops Security Observability Platform has been built and is ready for deployment.

## Quick Start with Docker Compose

### 1. Navigate to the project directory
```bash
cd secops-pulse
```

### 2. Configure environment
Copy the example environment file and add your OpenAI API key:
```bash
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=your_api_key_here
```

### 3. Start all services
```bash
docker-compose up --build -d
```

### 4. Access the application

- **Dashboard**: http://localhost:3000/dashboard
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/v1/health

## Manual Development Setup

### Backend (Python/FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python init_db.py  # Initialize database with sample data
uvicorn app.main:app --reload
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
secops-pulse/
├── docker-compose.yml     # Orchestrates all services
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── main.py       # API entry point
│   │   ├── config.py     # Configuration
│   │   ├── database.py   # PostgreSQL connection
│   │   ├── models/       # SQLAlchemy models
│   │   ├── routers/      # API endpoints
│   │   └── services/     # AI & risk scoring
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/             # Next.js frontend
│   ├── app/
│   │   ├── dashboard/    # Dashboard pages
│   │   ├── incidents/    # Incident management
│   │   ├── events/       # Event viewer
│   │   └── settings/     # Configuration
│   ├── components/       # React components
│   └── package.json
└── README.md
```

## Features

- **Real-time Dashboard**: Overview of security posture with metrics and charts
- **Incident Management**: Track, analyze, and resolve security incidents
- **AI-Powered Analysis**: OpenAI integration for intelligent risk assessment
- **Event Ingestion**: API for receiving security events from multiple sources
- **Risk Scoring**: Rule-based + AI risk assessment (0-10 scale)
- **Apple-inspired UI**: Clean, modern interface with smooth animations

## API Endpoints

### Event Ingestion
```bash
POST /api/v1/ingest
POST /api/v1/ingest/batch
GET /api/v1/events
```

### Incident Management
```bash
GET /api/v1/incidents
GET /api/v1/incidents/{id}
PATCH /api/v1/incidents/{id}
POST /api/v1/incidents/{id}/reanalyze
```

### Dashboard
```bash
GET /api/v1/dashboard
GET /api/v1/dashboard/metrics
GET /api/v1/dashboard/risk-distribution
```

## Deployment URL

Your application has been built and tested. For local development, use Docker Compose as described above.

## Hosting on Railway

To host this project on Railway, follow these steps:

### 1. Connect GitHub Repository
1. Log in to [Railway.app](https://railway.app/).
2. Click **"New Project"** -> **"Deploy from GitHub repo"**.
3. Select your repository: `AbdullahRah/secops-pulse`.

### 2. Configure Services
Railway will detect the `railway.json` file and should automatically create two services: `backend` and `frontend`.

### 3. Setup Database
1. In your Railway project, click **"Add"** -> **"Database"** -> **"PostgreSQL"**.
2. Railway will provision a database and automatically provide the `DATABASE_URL` to your services if configured correctly.

### 4. Environment Variables
You need to set the following environment variables in the Railway dashboard for each service:

#### Backend Service:
- `GEMINI_API_KEY`: Your Google Gemini API key.
- `DATABASE_URL`: Railway will provide this if you link the PostgreSQL service.
- `DEBUG`: `false` for production.

#### Frontend Service:
- `NEXT_PUBLIC_API_URL`: The public URL of your **Backend Service** (e.g., `https://backend-production-xyz.up.railway.app`).

### 5. Deployment
- Railway will automatically build and deploy your services whenever you push to the `master` branch.
- You can monitor builds and logs in the Railway dashboard.

---

For questions or issues, please refer to the README.md file or the project documentation.
