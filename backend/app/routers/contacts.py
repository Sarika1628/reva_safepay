from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import TrustedContact, User
from backend.app.schemas import ContactCreateRequest, ContactResponse

router = APIRouter(prefix="/api/contacts", tags=["Contacts"])


@router.get("", response_model=List[ContactResponse])
def get_contacts(user_id: int = Query(..., description="ID of current synthetic user"), db: Session = Depends(get_db)):
    """Retrieve trusted family and vendor contacts with quick-payment shortcuts."""
    return db.query(TrustedContact).filter(TrustedContact.user_id == user_id).all()


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def add_contact(
    contact: ContactCreateRequest,
    user_id: int = Query(..., description="ID of current synthetic user"),
    db: Session = Depends(get_db)
):
    """Add a new trusted contact."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(TrustedContact).filter(
        TrustedContact.user_id == user_id,
        TrustedContact.upi_id == contact.upi_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Contact with UPI {contact.upi_id} already exists in your trusted list."
        )

    new_contact = TrustedContact(
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
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact


@router.delete("/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    """Remove a contact from trusted list."""
    contact = db.query(TrustedContact).filter(TrustedContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return {"message": "Contact removed successfully"}
