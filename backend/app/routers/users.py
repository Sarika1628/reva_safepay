from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User
from backend.app.schemas import UserResponse, UserPreferencesUpdate

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    """List all synthetic demo personas."""
    return db.query(User).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Fetch details for a specific user persona."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Synthetic user with ID {user_id} not found."
        )
    return user


@router.patch("/{user_id}/preferences", response_model=UserResponse)
def update_preferences(user_id: int, prefs: UserPreferencesUpdate, db: Session = Depends(get_db)):
    """Update accessibility preferences (font size, contrast, voice, slow mode)."""
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


@router.post("/{user_id}/reset-demo", response_model=UserResponse)
def reset_demo_balance(user_id: int, db: Session = Depends(get_db)):
    """Replenish simulated wallet balance for testing & demo purposes."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.balance = 15000.0
    user.is_frozen = False
    user.freeze_reason = None
    db.commit()
    db.refresh(user)
    return user
