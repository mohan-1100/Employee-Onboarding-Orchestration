# OrchestrAI - Enterprise Employee Onboarding Orchestrator

An enterprise full-stack web application designed for IT and HR organizations to manage complex, multi-department employee onboarding workflows. Built with an autonomous AI agent backed by OpenRouter LLM (`gpt-4o-mini` with multi-model fallbacks), strict **Human-in-the-Loop** governance, and granular **Role-Based Access Control (RBAC)**.

---

## Key Highlights & Governance Architecture

1. **Strict Human-in-the-Loop Enforcement**:
   - The AI agent has **zero direct database write permissions**.
   - All state mutations (adding employees, updating IT provisioning, HR compliance, logistics) produce staged diff proposals (`DiffProposal`) requiring explicit manual approval.
2. **Role-Based Access Control (RBAC)**:
   - Built-in department personas: **HR Operations**, **IT Provisioning**, **Workplace Logistics**, and **Super Admin**.
   - The agent strictly enforces table permissions at runtime (e.g., HR cannot mutate IT provisioning; unauthorized requests are rejected).
3. **Automated Checklist Cascading**:
   - Adding a new recruit triggers role-based cascading checklist entries across HR compliance, IT systems (SSO, GitHub, AWS, VPN), and hardware logistics (MacBook Pro vs. Dell XPS, shipping status).
4. **Comprehensive Real-Time Dashboard**:
   - Executive KPIs: Total recruits, completed onboarding, pending tasks, critical/at-risk/on-track statuses.
   - Dynamic search, department filter, and recruit detail modal.
   - Interactive AI Copilot with live staged diff comparison.

---

## Tech Stack

- **Frontend**: React (Vite), TailwindCSS, Lucide Icons
- **Backend**: Python FastAPI, Uvicorn, SQLAlchemy, Pydantic
- **AI Agent**: OpenRouter API (`openai/gpt-4o-mini` with fallbacks: `google/gemini-2.5-flash`, `google/gemini-2.5-flash-lite`, `deepseek/deepseek-chat`)
- **Database**: Supabase (PostgreSQL) + Local SQLite fallback

---

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI endpoints & CORS configuration
│   ├── agent.py             # OpenRouter LLM orchestrator with model fallbacks & staging
│   ├── access_control.py    # RBAC permissions matrix & cascading checklist generator
│   ├── database.py          # SQLAlchemy engine & Supabase connection pool
│   ├── models.py            # PostgreSQL database models & relations
│   ├── schemas.py           # Pydantic schemas for requests, responses & diff proposals
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Backend environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (Metrics, RecruitList, AIChatDrawer, etc.)
│   │   ├── supabaseClient.js# Supabase client configuration
│   │   ├── App.jsx          # Main application dashboard
│   │   └── main.jsx         # App entrypoint
│   ├── package.json         # Node.js dependencies
│   ├── vite.config.js       # Vite configuration
│   └── .env.example         # Frontend environment variables template
├── supabase_schema.sql      # Supabase PostgreSQL DDL schema & sample dataset
├── setup_supabase.py        # Supabase verification and connectivity script
└── README.md
```

---

## Quickstart Guide

### 1. Database Setup (Supabase)
1. Create a Supabase project at [https://supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste and execute the contents of [`supabase_schema.sql`](supabase_schema.sql).

### 2. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```
Fill in `.env`:
```ini
OPENROUTER_API_KEY=your_openrouter_api_key
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Run the backend server:
```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup (React / Vite)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Access the application at: `http://127.0.0.1:5173`

---

## License
MIT License
