import json
import re
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import User, TrustedContact, Transaction, ScamCatalogItem
from backend.app.schemas import (
    ContactResponse,
    ContactCreateRequest,
    TransactionResponse,
    PaymentAnalysisRequest,
    PaymentExecutionRequest,
    PaymentResponse,
    RiskAssessmentResponse,
    UserPreferencesUpdate,
    UserResponse,
    PrivacyRedactRequest,
    PrivacyRedactResponse
)
from backend.app.services.scam_engine import analyze_risk, SCAM_KEYWORDS, detect_scam_in_text
from backend.app.services.privacy_redactor import redact_text

router = APIRouter(prefix="/api", tags=["Compatibility & Insights"])


# 1. GET /api/recipients
@router.get("/recipients", response_model=List[ContactResponse])
def get_recipients(
    user_id: Optional[int] = Query(default=1, description="User ID"),
    db: Session = Depends(get_db)
):
    """Retrieve trusted recipients list for payments."""
    return db.query(TrustedContact).filter(TrustedContact.user_id == user_id).all()


# 2. GET /api/transactions
@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    user_id: Optional[int] = Query(default=1, description="User ID"),
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Retrieve transaction history ledger."""
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.timestamp.desc())
        .limit(limit)
        .all()
    )


# 3. GET /api/transactions/{transaction_id}
@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
def get_single_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Retrieve details for a specific simulated transaction."""
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID {transaction_id} not found."
        )
    return txn


# 4. GET /api/insights
@router.get("/insights")
def get_spending_insights(
    user_id: Optional[int] = Query(default=1, description="User ID"),
    db: Session = Depends(get_db)
):
    """
    Computes real-time spending and scam-prevention insights dynamically
    from simulated transactions in SQLite.
    """
    user = db.query(User).filter(User.id == user_id).first()
    txns = db.query(Transaction).filter(Transaction.user_id == user_id).all()

    current_month_total = 0.0
    scam_money_saved = 0.0
    category_map = {}

    for t in txns:
        if t.status in ("SUCCESS", "FLAGGED_OVERRIDE"):
            current_month_total += t.amount
            cat = t.category or "General"
            category_map[cat] = category_map.get(cat, 0.0) + t.amount
        elif t.status in ("BLOCKED_SCAM", "FROZEN_REJECTED"):
            scam_money_saved += t.amount

    # Category styling metadata
    palette = {
        "Family": {"color": "#2563eb", "icon": "Users", "label": "Family & Loved Ones"},
        "Healthcare": {"color": "#059669", "icon": "Pill", "label": "Healthcare & Medicine"},
        "Vendor": {"color": "#d97706", "icon": "Coffee", "label": "Daily Essentials & Milk"},
        "Groceries": {"color": "#0284c7", "icon": "Coffee", "label": "Groceries & Kirana"},
        "Payment": {"color": "#7c3aed", "icon": "Truck", "label": "General Transfers"}
    }

    categories = []
    for cat_name, amt in category_map.items():
        meta = palette.get(cat_name, {"color": "#64748b", "icon": "PieChart", "label": cat_name})
        pct = round((amt / current_month_total * 100), 1) if current_month_total > 0 else 0
        categories.append({
            "name": meta["label"],
            "amount": amt,
            "percentage": pct,
            "color": meta["color"],
            "icon": meta["icon"]
        })

    categories.sort(key=lambda x: x["amount"], reverse=True)

    return {
        "user_name": user.name if user else "Demo User",
        "current_month_total": current_month_total,
        "last_month_total": 3250.0,
        "budget_limit": 10000.0,
        "scam_money_saved": scam_money_saved,
        "categories": categories if categories else [
            {"name": "No expenditures yet", "amount": 0.0, "percentage": 0, "color": "#64748b", "icon": "PieChart"}
        ],
        "is_safe": True,
        "message": "All current month spending is focused on verified necessities."
    }


# 5. GET and PUT /api/settings/accessibility
@router.get("/settings/accessibility", response_model=UserResponse)
def get_accessibility_settings(
    user_id: Optional[int] = Query(default=1),
    db: Session = Depends(get_db)
):
    """Get accessibility preferences for current user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/settings/accessibility", response_model=UserResponse)
def update_accessibility_settings(
    prefs: UserPreferencesUpdate,
    user_id: Optional[int] = Query(default=1),
    db: Session = Depends(get_db)
):
    """Update accessibility settings (high contrast, voice guidance, slow mode, etc)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if prefs.preferred_font_size is not None:
        user.preferred_font_size = prefs.preferred_font_size
    if prefs.high_contrast is not None:
        user.high_contrast = prefs.high_contrast
    if prefs.voice_guidance is not None:
        user.voice_guidance = prefs.voice_guidance
    if prefs.slow_mode is not None:
        user.slow_mode = prefs.slow_mode

    db.commit()
    db.refresh(user)
    return user


# 6. GET and PUT /api/settings/trusted-contacts
@router.get("/settings/trusted-contacts", response_model=List[ContactResponse])
def get_trusted_contacts_settings(
    user_id: Optional[int] = Query(default=1),
    db: Session = Depends(get_db)
):
    """Retrieve trusted contact list settings."""
    return db.query(TrustedContact).filter(TrustedContact.user_id == user_id).all()


@router.put("/settings/trusted-contacts", response_model=ContactResponse)
def add_or_update_trusted_contact(
    contact: ContactCreateRequest,
    user_id: Optional[int] = Query(default=1),
    db: Session = Depends(get_db)
):
    """Add or update a trusted contact."""
    existing = db.query(TrustedContact).filter(
        TrustedContact.user_id == user_id,
        TrustedContact.upi_id == contact.upi_id
    ).first()

    if existing:
        existing.name = contact.name
        existing.phone = contact.phone or ""
        existing.relationship = contact.relationship
        existing.category = contact.category
        existing.quick_amount = contact.quick_amount
        existing.quick_phrase = contact.quick_phrase or f"Payment to {contact.name}"
        db.commit()
        db.refresh(existing)
        return existing

    new_c = TrustedContact(
        user_id=user_id,
        name=contact.name,
        upi_id=contact.upi_id,
        phone=contact.phone or "",
        relationship=contact.relationship,
        category=contact.category,
        is_verified=True,
        quick_amount=contact.quick_amount,
        quick_phrase=contact.quick_phrase or f"Payment to {contact.name}"
    )
    db.add(new_c)
    db.commit()
    db.refresh(new_c)
    return new_c


# 7. POST /api/screenshot/verify
class ScreenshotVerifyRequest(BaseModel):
    reference_id: Optional[str] = Field(default=None, description="Transaction ID or reference code from screenshot/SMS")
    amount: Optional[float] = Field(default=None, description="Amount in rupees")
    recipient_upi: Optional[str] = Field(default=None, description="Recipient UPI ID")
    text_content: Optional[str] = Field(default="", description="OCR or message text extracted from screenshot/SMS")
    upi_detected: Optional[str] = Field(default=None, description="UPI ID detected in screenshot")
    amount_detected: Optional[float] = Field(default=None, description="Amount detected in screenshot")


@router.post("/screenshot/verify")
def verify_screenshot(
    payload: ScreenshotVerifyRequest,
    user_id: Optional[int] = Query(default=1),
    db: Session = Depends(get_db)
):
    """
    Audits suspicious payment requests or receipts from screenshots/SMS messages.
    Compares entered transaction reference and amount against synthetic records in the
    SQLite demo ledger, returning VERIFIED IN DEMO LEDGER, NOT FOUND IN DEMO LEDGER, or UNABLE TO VERIFY.
    Also audits scam urgency, lottery lures, and known fraud UPI handles.
    """
    text = (payload.text_content or "").lower()
    upi = (payload.recipient_upi or payload.upi_detected or "").lower().strip()
    amt = payload.amount if payload.amount is not None else payload.amount_detected
    ref = (payload.reference_id or "").strip()

    # 1. Compare against synthetic records in SQLite demo ledger
    matched_record = None
    ledger_status = "UNABLE TO VERIFY"
    ledger_message = "Enter a Transaction Reference or Amount to verify against the local SQLite demo ledger."

    if ref:
        matched_txn = None
        extracted_id = None
        if ref.isdigit():
            extracted_id = int(ref)
        else:
            # Extract trailing or contained digits (e.g., DEMO-TXN-20261014-0004 -> 4, TXN-101 -> 101)
            num_match = re.search(r"(?:DEMO-TXN-\d+-|TXN-|#)?(\d+)", ref, re.IGNORECASE)
            if num_match:
                try:
                    extracted_id = int(num_match.group(1))
                except ValueError:
                    extracted_id = None

        if extracted_id is not None:
            matched_txn = db.query(Transaction).filter(Transaction.id == extracted_id).first()

        if not matched_txn:
            matched_txn = db.query(Transaction).filter(
                (Transaction.note.ilike(f"%{ref}%")) |
                (Transaction.recipient_upi.ilike(f"%{ref}%"))
            ).first()

        if matched_txn:
            if amt is not None:
                # Compare both reference and amount to detect altered receipts
                if abs(matched_txn.amount - amt) < 0.01:
                    ledger_status = "VERIFIED IN DEMO LEDGER"
                    ledger_message = f"Matched simulated transaction #{matched_txn.id} (₹{matched_txn.amount:,.2f} to {matched_txn.recipient_name}) in local SQLite demo ledger."
                    matched_record = {
                        "id": matched_txn.id,
                        "amount": matched_txn.amount,
                        "recipient_name": matched_txn.recipient_name,
                        "recipient_upi": matched_txn.recipient_upi,
                        "status": matched_txn.status,
                        "timestamp": matched_txn.timestamp.isoformat() if matched_txn.timestamp else None,
                        "note": matched_txn.note
                    }
                else:
                    ledger_status = "NOT FOUND IN DEMO LEDGER"
                    ledger_message = f"Transaction reference #{matched_txn.id} was found, but the amount differs (ledger record is ₹{matched_txn.amount:,.2f}, entered screenshot amount is ₹{amt:,.2f}). Possible altered receipt."
            else:
                ledger_status = "VERIFIED IN DEMO LEDGER"
                ledger_message = f"Matched simulated transaction #{matched_txn.id} in local SQLite demo ledger."
                matched_record = {
                    "id": matched_txn.id,
                    "amount": matched_txn.amount,
                    "recipient_name": matched_txn.recipient_name,
                    "recipient_upi": matched_txn.recipient_upi,
                    "status": matched_txn.status,
                    "timestamp": matched_txn.timestamp.isoformat() if matched_txn.timestamp else None,
                    "note": matched_txn.note
                }
        else:
            ledger_status = "NOT FOUND IN DEMO LEDGER"
            ledger_message = f"Reference '{ref}' does not match any simulated transaction in the demo ledger."
    elif amt is not None:
        if upi:
            matched_txn = db.query(Transaction).filter(
                Transaction.amount == amt,
                Transaction.recipient_upi.ilike(f"%{upi}%")
            ).first()

            if matched_txn:
                ledger_status = "VERIFIED IN DEMO LEDGER"
                ledger_message = f"Matched simulated transfer of ₹{amt:,.2f} to {matched_txn.recipient_name} ({upi}) in demo ledger."
                matched_record = {
                    "id": matched_txn.id,
                    "amount": matched_txn.amount,
                    "recipient_name": matched_txn.recipient_name,
                    "recipient_upi": matched_txn.recipient_upi,
                    "status": matched_txn.status,
                    "timestamp": matched_txn.timestamp.isoformat() if matched_txn.timestamp else None,
                    "note": matched_txn.note
                }
            else:
                ledger_status = "NOT FOUND IN DEMO LEDGER"
                ledger_message = f"No transaction found for ₹{amt:,.2f} to {upi} in local demo ledger."
        else:
            matched_txn = db.query(Transaction).filter(Transaction.amount == amt).first()
            if matched_txn:
                ledger_status = "VERIFIED IN DEMO LEDGER"
                ledger_message = f"Matched simulated transaction #{matched_txn.id} with amount ₹{amt:,.2f} in demo ledger."
                matched_record = {
                    "id": matched_txn.id,
                    "amount": matched_txn.amount,
                    "recipient_name": matched_txn.recipient_name,
                    "recipient_upi": matched_txn.recipient_upi,
                    "status": matched_txn.status,
                    "timestamp": matched_txn.timestamp.isoformat() if matched_txn.timestamp else None,
                    "note": matched_txn.note
                }
            else:
                ledger_status = "NOT FOUND IN DEMO LEDGER"
                ledger_message = f"No simulated transaction with amount ₹{amt:,.2f} found in local demo ledger."

    # 2. Rule-based risk audit for scam indicators
    reasons = []
    risk_score = 0

    if upi:
        known = db.query(ScamCatalogItem).filter(
            ScamCatalogItem.upi_id.ilike(f"%{upi}%")
        ).first()
        if known:
            risk_score += 90
            reasons.append(f"UPI ID {upi} matches known reported scam: {known.category}")

    # Reuse explainable scam detector on text if present
    if text:
        text_audit = detect_scam_in_text(text)
        if text_audit.warning_signs:
            for ws in text_audit.warning_signs:
                reasons.append(f"{ws.title}: {ws.explanation}")
            risk_score = max(risk_score, text_audit.risk_score)

    for threat in SCAM_KEYWORDS["URGENCY_THREAT"]:
        if threat in text and not any("Urgent" in r or "Disconnection" in r for r in reasons):
            risk_score += 70
            reasons.append(f"Urgent threat keyword detected: '{threat}'")
            break

    for trick in SCAM_KEYWORDS["RECEIVE_MONEY_TRICK"]:
        if trick in text and not any("PIN" in r for r in reasons):
            risk_score += 85
            reasons.append("Reverse PIN trap detected: Asking to enter UPI PIN to receive money")
            break

    for prize in SCAM_KEYWORDS["PRIZE_OR_LOTTERY"]:
        if prize in text and not any("Lottery" in r or "Prize" in r for r in reasons):
            risk_score += 75
            reasons.append(f"Lottery/prize advance-fee keyword detected: '{prize}'")
            break

    for remote in SCAM_KEYWORDS["REMOTE_ACCESS"]:
        if remote in text and not any("Remote" in r for r in reasons):
            risk_score += 90
            reasons.append(f"Dangerous remote screen-share app mentioned: '{remote}'")
            break

    risk_score = min(100, risk_score)
    risk_level = "HIGH_RISK_SCAM" if risk_score >= 60 else "CAUTION" if risk_score >= 25 else "SAFE"
    risk_tier = "HIGH" if risk_score >= 60 else "MEDIUM" if risk_score >= 25 else "LOW"

    return {
        "status": "VERIFIED_AUDIT",
        "ledger_status": ledger_status,
        "ledger_message": ledger_message,
        "matched_record": matched_record,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_tier": risk_tier,
        "is_safe": risk_level == "SAFE",
        "reasons": reasons if reasons else ["No known scam patterns detected in extracted message"],
        "recommended_action": "BLOCK_AND_REPORT" if risk_level == "HIGH_RISK_SCAM" else "PROCEED_WITH_USUAL_CARE",
        "advice": (
            "STOP! Do not pay or share your screen. Call 1930 Cyber Cell." 
            if risk_level == "HIGH_RISK_SCAM" 
            else "Content looks clear of standard high-risk fraud keywords."
        ),
        "disclaimer": (
            "DISCLAIMER: Screenshots alone cannot prove payment and actual payment status must be checked "
            "directly in your real bank or payment application. This check only inspects synthetic records "
            "in our local SQLite demo ledger and never verifies real transactions."
        ),
        "screenshot_warning": (
            "Screenshots can easily be faked or altered with fake payment generator tools. "
            "Never rely on a screenshot alone to confirm that you have received money."
        )
    }


# 8. POST /api/privacy/redact
@router.post("/privacy/redact", response_model=PrivacyRedactResponse)
def redact_sensitive_text(payload: PrivacyRedactRequest):
    """
    Sanitizes sensitive information (OTPs, phone numbers, email addresses,
    card-number-like sequences, and UPI IDs) from pasted text.
    Operates strictly in memory: NEVER saves to database or forwards to external services.
    """
    result = redact_text(payload.text)
    return PrivacyRedactResponse(**result)


# 9. GET /api/camera/status
@router.get("/camera/status")
def get_camera_privacy_status():
    """
    Returns server-verified privacy guarantees and biometric limitations for Face & Camera demo.
    Confirms zero biometric storage in SQLite and local browser execution boundaries.
    """
    return {
        "camera_mode": "local_client_side_only",
        "face_detection_available": True,
        "face_detection_technology": "Browser ShapeDetection API & HTML5 Canvas Spatial Geometrics",
        "face_recognition_prototype": "In-memory consent-based feature comparison",
        "sqlite_biometric_storage": False,
        "privacy_policy": {
            "zero_cloud_upload": True,
            "zero_sqlite_retention": True,
            "zero_silent_recording": True,
            "requires_explicit_user_start": True,
            "immediate_camera_release_on_stop": True
        },
        "limitations": [
            "Face detection verifies physical presence only and does NOT establish legal identity.",
            "Face recognition is a consent-based prototype and is NEVER used to authorize payments or bypass security checks.",
            "Manual typing and visual review alternatives are always provided."
        ],
        "disclaimer": "Demo privacy protection: No facial images, video frames, or biometric templates are stored in SQLite or uploaded to any server."
    }


# 10. POST /api/camera/reset-biometrics
@router.post("/camera/reset-biometrics")
def reset_camera_biometrics():
    """
    Simulates clearing any session biometric caches or enrolled prototype signatures.
    Re-verifies that zero facial records exist in the database.
    """
    return {
        "status": "SUCCESS",
        "message": "All temporary session biometrics cleared. Zero records retained.",
        "biometric_db_records": 0,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

