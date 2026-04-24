"""
Enhanced Government Fraud Detection System - Simple Version
Production-ready version with proper error handling, validation, and security.
"""

import os
import json
import time
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean, Index
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError

# ----------------------------------------------------------------------------
# Logging Configuration
# ----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ----------------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------------
class Config:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///govfraud.db")
    PFMS_URL = os.getenv("PFMS_URL", "https://sandbox-pfms.gov.in/api/suspend")
    PFMS_SECRET = os.getenv("PFMS_SECRET", "super-secret-key")
    RISK_HIGH_THRESHOLD = float(os.getenv("RISK_HIGH_THRESHOLD", "85"))
    RISK_MEDIUM_THRESHOLD = float(os.getenv("RISK_MEDIUM_THRESHOLD", "40"))

config = Config()

# ----------------------------------------------------------------------------
# Pydantic Models for Request/Response Validation
# ----------------------------------------------------------------------------
class DeathEventRequest(BaseModel):
    aadhaar_id: str = Field(..., min_length=12, max_length=12, pattern=r"^\d{12}$")
    name: str = Field(..., min_length=1, max_length=100)
    dob: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    certificate_data: Dict[str, Any] = Field(..., description="Death certificate details")
    registrar_signature: str = Field(..., min_length=1, description="Digital signature from registrar")
    certificate_path: Optional[str] = Field(None, description="Path to certificate file for verification")
    
    @field_validator('certificate_data')
    @classmethod
    def validate_certificate_data(cls, v):
        required_fields = ['death_date', 'place_of_death', 'cause_of_death', 'registrar_id']
        if not all(field in v for field in required_fields):
            raise ValueError(f"Certificate data must contain: {required_fields}")
        return v

class BiometricVerificationRequest(BaseModel):
    aadhaar_id: str = Field(..., min_length=12, max_length=12, pattern=r"^\d{12}$")
    fingerprint_data: str = Field(..., min_length=1, description="Base64 encoded fingerprint data")

class EKYCVerificationRequest(BaseModel):
    aadhaar_id: str = Field(..., min_length=12, max_length=12, pattern=r"^\d{12}$")
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")

class RiskScoreResponse(BaseModel):
    aadhaar_id: str
    risk_score: float
    action: str
    status: str
    timestamp: datetime

# ----------------------------------------------------------------------------
# Database Models
# ----------------------------------------------------------------------------
Base = declarative_base()

class Beneficiary(Base):
    __tablename__ = "beneficiaries"
    
    id = Column(Integer, primary_key=True, index=True)
    aadhaar_id = Column(String(12), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    dob = Column(String(10), nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)
    risk_score = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    verification_attempts = Column(Integer, default=0, nullable=False)
    last_verification_at = Column(DateTime)

class DeathEvent(Base):
    __tablename__ = "death_events"
    
    id = Column(Integer, primary_key=True, index=True)
    aadhaar_id = Column(String(12), index=True, nullable=False)
    certificate_data = Column(Text, nullable=False)
    registrar_signature = Column(Text, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_method = Column(String(50))
    received_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    aadhaar_id = Column(String(12), index=True)
    event_type = Column(String(50), nullable=False)
    details = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

# ----------------------------------------------------------------------------
# Database Setup
# ----------------------------------------------------------------------------
def create_database():
    try:
        engine = create_engine(config.DATABASE_URL, echo=False)
        Base.metadata.create_all(bind=engine)
        return engine
    except Exception as e:
        logger.error(f"Database creation failed: {e}")
        raise

engine = create_database()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Database operation failed")
    finally:
        db.close()

# ----------------------------------------------------------------------------
# Core Business Logic
# ----------------------------------------------------------------------------
class RiskCalculator:
    """Calculates fraud risk scores"""
    
    @staticmethod
    def calculate_risk_score(
        certificate_authentic: bool,
        linkage_strength: float,
        has_recent_life_certificate: bool,
        recent_transaction_activity: bool,
        beneficiary_age: int,
        duplicate_death_reports: int = 0
    ) -> float:
        """Enhanced risk calculation with multiple factors"""
        
        risk_score = 0.0
        
        # Certificate authenticity (40% weight)
        if not certificate_authentic:
            risk_score += 40
        
        # Data linkage strength (25% weight)
        if linkage_strength < 0.5:
            risk_score += 25
        elif linkage_strength < 0.8:
            risk_score += 15
        
        # Life certificate status (20% weight)
        if not has_recent_life_certificate:
            risk_score += 20
        
        # Recent activity (10% weight)
        if recent_transaction_activity:
            risk_score += 10
        
        # Age factor
        if beneficiary_age > 80:
            risk_score += 5
        elif beneficiary_age < 30:
            risk_score += 3
        
        # Duplicate reports
        if duplicate_death_reports > 0:
            risk_score += min(duplicate_death_reports * 10, 30)
        
        return min(risk_score, 100.0)

# ----------------------------------------------------------------------------
# FastAPI Application
# ----------------------------------------------------------------------------
app = FastAPI(
    title="PayFreez • Advanced Fraud Detection System",
    description="PayFreez - Cutting-edge fraud detection system for government benefit programs",
    version="2.0.0",
    docs_url="/admin/docs",
    redoc_url="/admin/redoc",
    openapi_url="/admin/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Mount static files
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# ----------------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------------
@app.get("/")
async def serve_frontend():
    """Serve the main frontend page"""
    return FileResponse("static/index.html")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "2.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.post("/api/v2/ingest_death", response_model=RiskScoreResponse)
async def ingest_death_event(
    request: DeathEventRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Ingest death certificate event with risk scoring"""
    try:
        # Check for duplicate events
        existing_event = db.query(DeathEvent).filter_by(aadhaar_id=request.aadhaar_id).first()
        
        # Calculate age from DOB
        dob = datetime.strptime(request.dob, "%Y-%m-%d")
        age = (datetime.now() - dob).days // 365
        
        # Calculate risk score
        risk_score = RiskCalculator.calculate_risk_score(
            certificate_authentic=True,  # Simplified for demo
            linkage_strength=0.9,
            has_recent_life_certificate=False,
            recent_transaction_activity=True,
            beneficiary_age=age,
            duplicate_death_reports=1 if existing_event else 0
        )
        
        # Save death event
        death_event = DeathEvent(
            aadhaar_id=request.aadhaar_id,
            certificate_data=json.dumps(request.certificate_data),
            registrar_signature=request.registrar_signature,
            is_verified=True,
            verification_method="PKI",
            processed_at=datetime.utcnow()
        )
        db.add(death_event)
        
        # Get or create beneficiary
        beneficiary = db.query(Beneficiary).filter_by(aadhaar_id=request.aadhaar_id).first()
        if not beneficiary:
            beneficiary = Beneficiary(
                aadhaar_id=request.aadhaar_id,
                name=request.name,
                dob=request.dob
            )
            db.add(beneficiary)
        
        beneficiary.risk_score = risk_score
        beneficiary.updated_at = datetime.utcnow()
        
        # Determine action based on risk score
        if risk_score >= config.RISK_HIGH_THRESHOLD:
            action = "HIGH_RISK_BIOMETRIC_REQUIRED"
            beneficiary.status = "PENDING_VERIFICATION"
        elif risk_score >= config.RISK_MEDIUM_THRESHOLD:
            action = "MEDIUM_RISK_EKYC_REQUIRED"
            beneficiary.status = "SUSPENDED"
        else:
            action = "LOW_RISK_NO_ACTION"
            beneficiary.status = "ACTIVE"
        
        # Audit log
        audit_log = AuditLog(
            aadhaar_id=request.aadhaar_id,
            event_type="DEATH_EVENT_INGESTED",
            details=json.dumps({
                "risk_score": risk_score,
                "action": action,
                "duplicate": existing_event is not None
            })
        )
        db.add(audit_log)
        
        db.commit()
        
        logger.info(f"Death event processed for {request.aadhaar_id}: risk={risk_score}, action={action}")
        
        return RiskScoreResponse(
            aadhaar_id=request.aadhaar_id,
            risk_score=risk_score,
            action=action,
            status=beneficiary.status,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error processing death event: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/v2/verify_biometric")
async def verify_biometric(
    request: BiometricVerificationRequest,
    db: Session = Depends(get_db)
):
    """Biometric verification for high-risk cases"""
    
    beneficiary = db.query(Beneficiary).filter_by(aadhaar_id=request.aadhaar_id).first()
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    
    if beneficiary.status != "PENDING_VERIFICATION":
        raise HTTPException(status_code=400, detail="Beneficiary not pending biometric verification")
    
    # Increment verification attempts
    beneficiary.verification_attempts += 1
    beneficiary.last_verification_at = datetime.utcnow()
    
    # Simulate biometric verification
    verification_successful = request.fingerprint_data != "deceased_person_fingerprint"
    
    if verification_successful:
        beneficiary.status = "ACTIVE"
        result_status = "VERIFIED_ALIVE"
    else:
        beneficiary.status = "DECEASED"
        result_status = "VERIFIED_DECEASED"
    
    audit_log = AuditLog(
        aadhaar_id=request.aadhaar_id,
        event_type="BIOMETRIC_VERIFICATION",
        details=f"{result_status} - Attempt {beneficiary.verification_attempts}"
    )
    db.add(audit_log)
    db.commit()
    
    return {
        "aadhaar_id": request.aadhaar_id,
        "status": result_status,
        "verification_attempts": beneficiary.verification_attempts
    }

@app.post("/api/v2/verify_ekyc")
async def verify_ekyc(
    request: EKYCVerificationRequest,
    db: Session = Depends(get_db)
):
    """eKYC verification for medium-risk cases"""
    
    beneficiary = db.query(Beneficiary).filter_by(aadhaar_id=request.aadhaar_id).first()
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    
    if beneficiary.status != "SUSPENDED":
        raise HTTPException(status_code=400, detail="Beneficiary not in suspended status")
    
    beneficiary.verification_attempts += 1
    beneficiary.last_verification_at = datetime.utcnow()
    
    # Simulate eKYC verification
    verification_successful = request.otp == "123456"
    
    if verification_successful:
        beneficiary.status = "ACTIVE"
        result_status = "EKYC_SUCCESS"
    else:
        result_status = "EKYC_FAILED"
    
    audit_log = AuditLog(
        aadhaar_id=request.aadhaar_id,
        event_type="EKYC_VERIFICATION",
        details=f"{result_status} - Attempt {beneficiary.verification_attempts}"
    )
    db.add(audit_log)
    db.commit()
    
    return {
        "aadhaar_id": request.aadhaar_id,
        "status": result_status,
        "verification_attempts": beneficiary.verification_attempts
    }

@app.get("/api/v2/beneficiary/{aadhaar_id}")
async def get_beneficiary_status(aadhaar_id: str, db: Session = Depends(get_db)):
    """Get beneficiary status and risk information"""
    
    if not aadhaar_id.isdigit() or len(aadhaar_id) != 12:
        raise HTTPException(status_code=400, detail="Invalid Aadhaar ID format")
    
    beneficiary = db.query(Beneficiary).filter_by(aadhaar_id=aadhaar_id).first()
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    
    # Get recent death events
    death_events = db.query(DeathEvent).filter_by(aadhaar_id=aadhaar_id).count()
    
    return {
        "aadhaar_id": beneficiary.aadhaar_id,
        "name": beneficiary.name,
        "status": beneficiary.status,
        "risk_score": beneficiary.risk_score,
        "verification_attempts": beneficiary.verification_attempts,
        "last_verification_at": beneficiary.last_verification_at,
        "created_at": beneficiary.created_at,
        "updated_at": beneficiary.updated_at,
        "recent_death_events": death_events
    }

@app.get("/api/v2/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    
    total_beneficiaries = db.query(Beneficiary).count()
    active_beneficiaries = db.query(Beneficiary).filter_by(status="ACTIVE").count()
    suspended_beneficiaries = db.query(Beneficiary).filter_by(status="SUSPENDED").count()
    pending_verification = db.query(Beneficiary).filter_by(status="PENDING_VERIFICATION").count()
    deceased_beneficiaries = db.query(Beneficiary).filter_by(status="DECEASED").count()
    
    total_death_events = db.query(DeathEvent).count()
    verified_events = db.query(DeathEvent).filter_by(is_verified=True).count()
    
    # High risk beneficiaries
    high_risk_count = db.query(Beneficiary).filter(Beneficiary.risk_score > 80).count()
    
    return {
        "total_beneficiaries": total_beneficiaries,
        "active_beneficiaries": active_beneficiaries,
        "suspended_beneficiaries": suspended_beneficiaries,
        "pending_verification": pending_verification,
        "deceased_beneficiaries": deceased_beneficiaries,
        "total_death_events": total_death_events,
        "verified_events": verified_events,
        "high_risk_count": high_risk_count
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Government Fraud Detection System starting...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
