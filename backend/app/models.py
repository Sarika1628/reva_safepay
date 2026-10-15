from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship as orm_relationship
from backend.app.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    persona = Column(String(50), default="Senior Citizen")
    bio = Column(String(255), default="")
    balance = Column(Float, default=15000.0)  # Simulated INR
    phone = Column(String(20), default="+91 98765 43210")
    emergency_contact_name = Column(String(100), default="Pooja (Daughter)")
    emergency_contact_phone = Column(String(20), default="+91 99887 76655")
    is_frozen = Column(Boolean, default=False)
    freeze_reason = Column(String(255), nullable=True)
    preferred_font_size = Column(String(20), default="large")
    high_contrast = Column(Boolean, default=False)
    voice_guidance = Column(Boolean, default=True)
    slow_mode = Column(Boolean, default=True)

    transactions = orm_relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    contacts = orm_relationship("TrustedContact", back_populates="user", cascade="all, delete-orphan")


class TrustedContact(Base):
    __tablename__ = "trusted_contacts"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    upi_id = Column(String(100), nullable=False)
    phone = Column(String(20), default="")
    relationship = Column(String(50), default="Friend")
    category = Column(String(50), default="General")  # Family, Healthcare, Vendor, Utility
    is_verified = Column(Boolean, default=True)
    quick_amount = Column(Float, default=100.0)
    quick_phrase = Column(String(255), default="")  # Accessible phrase for non-speaking users

    user = orm_relationship("User", back_populates="contacts")


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    recipient_name = Column(String(100), nullable=False)
    recipient_upi = Column(String(100), nullable=False)
    category = Column(String(50), default="Payment")
    note = Column(String(255), default="")
    status = Column(String(30), default="SUCCESS")  # SUCCESS, BLOCKED_SCAM, FLAGGED_OVERRIDE, FROZEN_REJECTED
    risk_score = Column(Integer, default=0)  # 0 to 100
    risk_level = Column(String(30), default="SAFE")  # SAFE, CAUTION, HIGH_RISK_SCAM
    risk_reasons = Column(Text, default="[]")  # JSON encoded list of flags
    is_simulated = Column(Boolean, default=True)  # STRICT REQUIREMENT: Always simulated
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = orm_relationship("User", back_populates="transactions")


class ScamCatalogItem(Base):
    __tablename__ = "scam_catalog"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    upi_id = Column(String(100), index=True, nullable=True)
    phone = Column(String(20), nullable=True)
    title = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="HIGH")  # CRITICAL, HIGH, MEDIUM
    reported_count = Column(Integer, default=1)
    sample_message = Column(Text, default="")
    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class PracticeScenario(Base):
    __tablename__ = "practice_scenarios"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    scenario_type = Column(String(20), default="SAFE")  # SAFE, SCAM
    difficulty = Column(String(20), default="Beginner")
    sender_or_recipient = Column(String(100), nullable=False)
    vpa = Column(String(100), nullable=False)
    amount = Column(Float, default=100.0)
    message = Column(Text, default="")
    hints = Column(Text, default="")
    explanation = Column(Text, default="")
    expected_action = Column(String(30), default="APPROVE")  # APPROVE, REJECT_AND_REPORT
