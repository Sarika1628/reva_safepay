from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User
from backend.app.schemas import EmergencyStatusResponse, FreezeWalletRequest

router = APIRouter(prefix="/api/emergency", tags=["Emergency SOS"])

HELPLINE_NUMBERS = {
    "Cyber Crime Helpline": "1930",
    "Senior Citizen Elderline": "14567",
    "National Emergency SOS": "112",
    "NPCI DigiSaathi 24x7": "14431 / 1800 891 3333",
    "Bank Fraud Instant Block": "1800 11 2211"
}


@router.get("/status", response_model=EmergencyStatusResponse)
def get_emergency_status(user_id: int = Query(..., description="User ID"), db: Session = Depends(get_db)):
    """Check emergency freeze status and get designated caregiver contact info."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return EmergencyStatusResponse(
        is_frozen=user.is_frozen,
        freeze_reason=user.freeze_reason,
        emergency_contact_name=user.emergency_contact_name,
        emergency_contact_phone=user.emergency_contact_phone,
        helpline_numbers=HELPLINE_NUMBERS,
        caregiver_alert_simulated=user.is_frozen
    )


@router.post("/freeze")
def freeze_wallet(
    req: FreezeWalletRequest,
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """
    Emergency SOS: Immediately freezes the simulated wallet.
    Prevents any payments from proceeding and simulates an urgent SMS alert
    to the designated family caregiver.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_frozen = True
    user.freeze_reason = req.reason
    db.commit()

    return {
        "status": "WALLET_FROZEN",
        "message": "Emergency Lock Activated: All outgoing payments have been blocked to protect your funds.",
        "caregiver_notified": req.notify_caregiver,
        "caregiver_name": user.emergency_contact_name,
        "caregiver_phone": user.emergency_contact_phone,
        "simulated_sms": (
            f"ALERT to {user.emergency_contact_name} ({user.emergency_contact_phone}): "
            f"{user.name} has activated Emergency Wallet Lock on EasyPay. Reason: {req.reason}. "
            "All transactions have been paused."
        ),
        "helpline": "1930 (Cyber Crime Helpline)"
    }


@router.post("/unfreeze")
def unfreeze_wallet(
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Unfreezes wallet after user or caregiver confirms safety."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_frozen = False
    user.freeze_reason = None
    db.commit()

    return {
        "status": "WALLET_ACTIVE",
        "message": "Wallet unlocked. Simulated payments are now available."
    }
