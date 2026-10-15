from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import ScamCatalogItem
from backend.app.schemas import (
    ScamCatalogResponse, 
    ScamReportCreateRequest,
    ScamTextDetectionRequest,
    ScamTextDetectionResponse
)
from backend.app.services.scam_engine import detect_scam_in_text
from backend.app.services.risk_thresholds import get_risk_threshold_config

router = APIRouter(prefix="/api/scams", tags=["Scam Shield"])


@router.get("/catalog", response_model=List[ScamCatalogResponse])
def get_scam_catalog(
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Search community scam database to view known fraud tricks,
    blacklisted UPI handles, and electricity threat reports.
    """
    query = db.query(ScamCatalogItem)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (ScamCatalogItem.title.ilike(search_filter)) |
            (ScamCatalogItem.upi_id.ilike(search_filter)) |
            (ScamCatalogItem.phone.ilike(search_filter)) |
            (ScamCatalogItem.description.ilike(search_filter))
        )
    if category:
        query = query.filter(ScamCatalogItem.category == category)

    return query.order_by(ScamCatalogItem.reported_count.desc()).all()


@router.post("/report", response_model=ScamCatalogResponse, status_code=status.HTTP_201_CREATED)
def report_scam(report: ScamReportCreateRequest, db: Session = Depends(get_db)):
    """Report a suspicious UPI ID, phone number, or SMS message."""
    clean_upi = report.upi_id.strip().lower() if report.upi_id else None
    
    # Check if this UPI is already reported
    existing = None
    if clean_upi:
        existing = db.query(ScamCatalogItem).filter(ScamCatalogItem.upi_id.ilike(clean_upi)).first()

    if existing:
        existing.reported_count += 1
        existing.description = f"{existing.description} | Community report: {report.description}"
        db.commit()
        db.refresh(existing)
        return existing

    new_scam = ScamCatalogItem(
        upi_id=clean_upi,
        phone=report.phone or "",
        title=report.title,
        category=report.category,
        description=report.description,
        severity="HIGH",
        reported_count=1,
        sample_message=report.sample_message or ""
    )
    db.add(new_scam)
    db.commit()
    db.refresh(new_scam)
    return new_scam


@router.get("/verify-vpa")
def verify_vpa(vpa: str = Query(..., description="UPI ID or VPA to verify"), db: Session = Depends(get_db)):
    """Fast lookup to verify whether a UPI ID is on the blacklist."""
    clean = vpa.strip().lower()
    match = db.query(ScamCatalogItem).filter(ScamCatalogItem.upi_id.ilike(f"%{clean}%")).first()
    if match:
        return {
            "vpa": clean,
            "is_blacklisted": True,
            "title": match.title,
            "category": match.category,
            "reported_count": match.reported_count,
            "warning": "CRITICAL DANGER: This UPI handle matches a known scammer reported by community members."
        }
    return {
        "vpa": clean,
        "is_blacklisted": False,
        "title": "Unlisted VPA",
        "category": "Unknown",
        "warning": "Not currently in known blacklist. Always verify the person's identity before transferring."
    }


@router.post("/detect-text", response_model=ScamTextDetectionResponse)
@router.post("/analyze-message", response_model=ScamTextDetectionResponse)
def detect_scam_message(payload: ScamTextDetectionRequest):
    """
    Analyzes an SMS, WhatsApp message, email, or payment request for fraud indicators.
    Uses explainable rule-based analysis without external AI APIs.
    """
    message = payload.message.strip() if payload.message else ""
    if not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message text cannot be empty. Please enter or paste a message to analyze."
        )
    if len(message) > 5000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message text is too long (maximum 5,000 characters). Please provide a single message or excerpt."
        )
    return detect_scam_in_text(message)
 
 
@router.get("/risk-thresholds")
def get_risk_thresholds_endpoint():
    """
    Returns the documented risk-threshold configuration shared by backend and frontend.
    Guarantees consistency across score calculations, UI banners, and review flows.
    """
    return get_risk_threshold_config()

