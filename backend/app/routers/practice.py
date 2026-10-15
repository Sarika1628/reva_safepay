from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import PracticeScenario
from backend.app.schemas import (
    PracticeScenarioResponse,
    PracticeVerifyRequest,
    PracticeVerifyResponse,
)

router = APIRouter(prefix="/api/practice", tags=["Practice Sandbox"])


@router.get("/scenarios", response_model=List[PracticeScenarioResponse])
def get_practice_scenarios(db: Session = Depends(get_db)):
    """
    Returns guided scenarios for seniors and new digital learners to
    practice spotting scams and paying trusted vendors in a 100% risk-free sandbox.
    """
    return db.query(PracticeScenario).all()


@router.post("/verify", response_model=PracticeVerifyResponse)
def verify_practice_decision(req: PracticeVerifyRequest, db: Session = Depends(get_db)):
    """Validates the user's decision on a practice scenario."""
    scenario = db.query(PracticeScenario).filter(PracticeScenario.id == req.scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    is_correct = (req.chosen_action.upper() == scenario.expected_action.upper())

    if is_correct:
        if scenario.scenario_type == "SCAM":
            feedback = (
                f"Outstanding job! You correctly identified and REJECTED this scam ({scenario.title}). "
                "You saved your simulated funds from fraud."
            )
        else:
            feedback = (
                f"Well done! You correctly recognized that {scenario.sender_or_recipient} is a safe, "
                "verified neighborhood contact and APPROVED the payment."
            )
    else:
        if scenario.scenario_type == "SCAM":
            feedback = (
                "Careful! In real life, approving this payment would transfer your hard-earned money to a scammer. "
                f"Notice: {scenario.explanation}"
            )
        else:
            feedback = (
                f"Don't worry! This was actually a safe payment to {scenario.sender_or_recipient}. "
                "It is always good to be cautious, but verified contacts in green are safe."
            )

    return PracticeVerifyResponse(
        scenario_id=scenario.id,
        is_correct=is_correct,
        feedback=feedback,
        key_safety_takeaway=scenario.explanation
    )
