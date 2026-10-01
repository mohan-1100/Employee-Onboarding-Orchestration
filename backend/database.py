import os
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Database URL: Supports PostgreSQL (Supabase) via env or falls back to SQLite
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")

if not DATABASE_URL:
    # Use local SQLite database with thread safety
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DB_PATH = os.path.join(BASE_DIR, "onboarding.db")
    DATABASE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Handle postgres:// vs postgresql:// prefix if using Supabase connection string
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Initialize Supabase Python Client
supabase_client = None
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Warning: could not initialize supabase client: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def log_audit_silent(db, user_role: str, action_taken: str):
    """
    Appends an entry to audit_logs silently.
    This table is NEVER displayed on the frontend per specification.
    Synchronizes to both local database and live Supabase!
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    
    # 1. Local database record
    from .models import AuditLog
    audit_entry = AuditLog(
        timestamp=now,
        user_role=user_role,
        action_taken=action_taken
    )
    db.add(audit_entry)
    db.commit()

    # 2. Live Supabase database record
    if supabase_client:
        try:
            supabase_client.table("audit_logs").insert({
                "timestamp": now.isoformat(),
                "user_role": user_role,
                "action_taken": action_taken
            }).execute()
        except Exception as e:
            print(f"Silent audit sync to Supabase notice: {e}")
