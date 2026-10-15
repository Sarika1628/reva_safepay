import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Transaction, User
from backend.app.schemas import (
    PaymentAnalysisRequest,
    PaymentExecutionRequest,
    PaymentResponse,
    RiskAssessmentResponse,
    TransactionResponse,
)
from backend.app.services.scam_engine import analyze_risk, parse_qr_data

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.post("/parse-qr")
def parse_qr_endpoint(payload: dict):
    """
    Extracts structured payment data from raw UPI QR string.
    Example payload: {"raw_qr": "upi://pay?pa=gopal.dairy@paytm&pn=Gopal%20Dairy&am=150.00"}
    """
    raw_data = payload.get("raw_qr", "").strip()
    if not raw_data:
        raise HTTPException(status_code=400, detail="QR code content is required")
    parsed = parse_qr_data(raw_data)
    return {
        "raw": raw_data,
        "recipient_upi": parsed.get("pa", ""),
        "recipient_name": parsed.get("pn", ""),
        "suggested_amount": float(parsed["am"]) if "am" in parsed and parsed["am"].replace(".", "").isdigit() else None,
        "note": parsed.get("tn", ""),
        "is_valid_upi": bool(parsed.get("pa"))
    }


@router.post("/analyze", response_model=RiskAssessmentResponse)
@router.post("/assess-risk", response_model=RiskAssessmentResponse)
def analyze_payment(
    request: PaymentAnalysisRequest,
    user_id: int = Query(..., description="ID of current synthetic user"),
    db: Session = Depends(get_db)
):
    """
    Scans a prospective payment before sending, checking for known scams,
    urgency threats, lottery lures, and authority impersonation.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    assessment = analyze_risk(
        db=db,
        user_id=user_id,
        recipient_upi=request.recipient_upi,
        recipient_name=request.recipient_name or "",
        amount=request.amount,
        note=request.note or "",
        qr_raw_data=request.qr_raw_data
    )
    return assessment


@router.post("/pay", response_model=PaymentResponse)
@router.post("/simulate", response_model=PaymentResponse)
@router.post("/simulator", response_model=PaymentResponse)
def execute_payment(
    payment: PaymentExecutionRequest,
    user_id: int = Query(..., description="ID of current synthetic user"),
    db: Session = Depends(get_db)
):
    """
    Executes a SIMULATED payment with SafePay scam protection checks.
    No actual funds, bank accounts, or real credentials are ever touched.
    """
    # Validation 1: Rejection of zero, negative, or invalid amounts
    if payment.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid amount: Simulated payment amount must be greater than zero."
        )

    # Validation 2: Ensure recipient details are present
    if not payment.recipient_name or not payment.recipient_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipient name is required."
        )
    if not payment.recipient_upi or not payment.recipient_upi.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipient UPI ID is required."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check 1: Is user's wallet frozen for emergency safety?
    if user.is_frozen:
        # Record blocked attempt
        failed_txn = Transaction(
            user_id=user.id,
            amount=payment.amount,
            recipient_name=payment.recipient_name,
            recipient_upi=payment.recipient_upi,
            category=payment.category,
            note=payment.note or "Emergency freeze blocked attempt",
            status="FROZEN_REJECTED",
            risk_score=100,
            risk_level="HIGH_RISK_SCAM",
            risk_reasons=json.dumps(["Transaction blocked because wallet is locked in SOS Freeze Mode"]),
            is_simulated=True
        )
        db.add(failed_txn)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Simulated Wallet is FROZEN ({user.freeze_reason or 'SOS emergency active'}). Payments are locked to prevent loss."
        )

    # Check 2: Balance check
    if user.balance < payment.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient simulated balance. Current balance is ₹{user.balance:,.2f}, required ₹{payment.amount:,.2f}."
        )

    # Check 3: Real-time risk analysis
    assessment = analyze_risk(
        db=db,
        user_id=user_id,
        recipient_upi=payment.recipient_upi,
        recipient_name=payment.recipient_name,
        amount=payment.amount,
        note=payment.note or ""
    )

    # Check 4: Intercept high/critical risk scam if user didn't explicitly acknowledge/override
    is_high_or_critical = (
        assessment.risk_level == "HIGH_RISK_SCAM" or 
        assessment.risk_category in ("CRITICAL", "HIGH")
    )
    user_acknowledged = bool(payment.emergency_override or payment.acknowledge_risk)

    if is_high_or_critical and not user_acknowledged:
        # Save as blocked scam attempt
        blocked_txn = Transaction(
            user_id=user.id,
            amount=payment.amount,
            recipient_name=payment.recipient_name,
            recipient_upi=payment.recipient_upi,
            category=payment.category,
            note=payment.note or "Blocked by SafePay Shield",
            status="BLOCKED_SCAM",
            risk_score=assessment.risk_score,
            risk_level=assessment.risk_level,
            risk_reasons=json.dumps([f.title for f in assessment.flags]),
            is_simulated=True
        )
        db.add(blocked_txn)
        db.commit()

        raise HTTPException(
            status_code=422,
            detail={
                "message": "Payment Intercepted by SafePay Shield",
                "risk_score": assessment.risk_score,
                "risk_level": assessment.risk_level,
                "risk_category": assessment.risk_category,
                "spoken_warning": assessment.spoken_warning,
                "reasons": [f.title + ": " + f.description for f in assessment.flags],
                "can_override": True
            }
        )

    # Process simulated deduction
    user.balance -= payment.amount
    txn_status = "FLAGGED_OVERRIDE" if is_high_or_critical else "SUCCESS"
    caregiver_alert = assessment.caregiver_alert_advised or (payment.amount >= 2000 and not assessment.is_trusted_contact)

    txn = Transaction(
        user_id=user.id,
        amount=payment.amount,
        recipient_name=payment.recipient_name,
        recipient_upi=payment.recipient_upi,
        category=payment.category,
        note=payment.note or "",
        status=txn_status,
        risk_score=assessment.risk_score,
        risk_level=assessment.risk_level,
        risk_reasons=json.dumps([f.title for f in assessment.flags]),
        is_simulated=True
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    # Generate a unique demo transaction ID
    demo_txn_id = f"DEMO-TXN-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{txn.id:04d}"

    return PaymentResponse(
        transaction_id=txn.id,
        demo_transaction_id=demo_txn_id,
        status=txn_status,
        amount=payment.amount,
        recipient_name=payment.recipient_name,
        recipient_upi=payment.recipient_upi,
        risk_level=assessment.risk_level,
        risk_score=assessment.risk_score,
        message="Simulated Payment Completed Successfully",
        new_balance=user.balance,
        is_simulated=True,
        disclaimer="Demo application. No real money is transferred. Simulated transaction: No real money was transferred or debited.",
        caregiver_alert_sent=caregiver_alert,
        timestamp=txn.timestamp
    )


@router.get("/history", response_model=List[TransactionResponse])
def get_transaction_history(
    user_id: int = Query(..., description="ID of current synthetic user"),
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Retrieve simulated transaction ledger for review and dispute testing."""
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.timestamp.desc())
        .limit(limit)
        .all()
    )
