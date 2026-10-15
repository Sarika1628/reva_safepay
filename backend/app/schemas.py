from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


# Health Check Schema
class HealthResponse(BaseModel):
    status: str = "ok"
    app: str = "EasyPay & SafePay"
    version: str = "1.0.0"
    simulation_mode: bool = True
    disclaimer: str = "SIMULATION ONLY: No real money, banking passwords, or UPI PINs are ever used or stored."
    timestamp: datetime


# User Schemas
class UserBase(BaseModel):
    name: str
    persona: str
    bio: Optional[str] = ""
    phone: str
    emergency_contact_name: str
    emergency_contact_phone: str
    preferred_font_size: str = "large"
    high_contrast: bool = False
    voice_guidance: bool = True
    slow_mode: bool = True


class UserPreferencesUpdate(BaseModel):
    preferred_font_size: Optional[str] = None
    high_contrast: Optional[bool] = None
    voice_guidance: Optional[bool] = None
    slow_mode: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    balance: float
    is_frozen: bool
    freeze_reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Trusted Contacts Schemas
class ContactBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    upi_id: str = Field(..., min_length=3, max_length=100)
    phone: Optional[str] = ""
    relationship: str = Field(default="Friend")
    category: str = Field(default="General")
    quick_amount: float = Field(default=100.0, ge=1.0)
    quick_phrase: Optional[str] = Field(default="")

    @field_validator("upi_id")
    def validate_upi_format(cls, v):
        clean = v.strip().lower()
        if "@" not in clean:
            raise ValueError("UPI ID must contain '@' (e.g. name@okhdfcbank or vendor@upi)")
        return clean


class ContactCreateRequest(ContactBase):
    pass


class ContactResponse(ContactBase):
    id: int
    user_id: int
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)


# SafePay Scam Engine Schemas
class PaymentAnalysisRequest(BaseModel):
    recipient_upi: str = Field(..., description="VPA or UPI ID to test")
    recipient_name: Optional[str] = Field(default="", description="Recipient display name")
    amount: float = Field(..., gt=0, le=100000, description="Payment amount in simulated INR")
    note: Optional[str] = Field(default="", description="Payment purpose or message")
    qr_raw_data: Optional[str] = Field(default=None, description="Raw scanned QR string if any")


class ScamFlag(BaseModel):
    category: str
    title: str
    description: str
    severity: str  # HIGH, MEDIUM, LOW, CRITICAL
    what_to_do_next: Optional[str] = None


class RiskAssessmentResponse(BaseModel):
    risk_score: int  # 0 to 100
    risk_level: str  # SAFE, CAUTION, HIGH_RISK_SCAM
    risk_category: str = Field(default="LOW", description="Standardized: LOW, MEDIUM, HIGH, CRITICAL")
    recommended_action: str  # PROCEED_SAFELY, CARE_DOUBLE_CHECK, BLOCK_IMMEDIATELY
    visual_color: str
    spoken_warning: str  # Tailored speech text for screen reader / TTS
    is_trusted_contact: bool
    is_known_scam: bool
    flags: List[ScamFlag]
    matched_scam_pattern: Optional[str] = None
    caregiver_alert_advised: bool = False
    is_serious_risk: bool = False
    safety_advice: List[str] = Field(default_factory=list)
    recipient_safety_note: Optional[str] = None
    upi_safety_note: Optional[str] = None
    amount_safety_note: Optional[str] = None
    disclaimer: str = (
        "Automated CyberCare warning: This hybrid ML and rule-based security check analyzes known fraud indicators. "
        "It cannot guarantee that any transaction is completely safe or fraudulent. "
        "Always independently verify unknown recipients and never share OTPs or enter your PIN to receive money."
    )
    # ML & Rule-override metadata
    model_prediction: Optional[str] = "LEGITIMATE"
    model_confidence: Optional[float] = 0.0
    ml_scam_probability: Optional[float] = 0.0
    rule_findings: List[ScamFlag] = Field(default_factory=list)
    rule_override_applied: bool = False
    override_reason: Optional[str] = None


class ScamWarningSign(BaseModel):
    category: str
    title: str
    explanation: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    matched_terms: List[str] = Field(default_factory=list)


class ScamTextDetectionRequest(BaseModel):
    message: str = Field(..., description="Suspicious SMS, WhatsApp, email, or payment message")


class ScamTextDetectionResponse(BaseModel):
    risk_score: int  # 0 to 100
    risk_category: str  # LOW, MEDIUM, HIGH, CRITICAL
    is_suspicious: bool
    summary: str
    warning_signs: List[ScamWarningSign]
    safety_advice: List[str]
    disclaimer: str = (
        "Automated CyberCare warning: This assessment combines a local ML classification model "
        "(TF-IDF + Logistic Regression) with safety rule overrides. It is not an absolute guarantee "
        "that a message is safe or fraudulent. Never share OTPs, PINs, or passwords, and always verify through official channels."
    )
    analyzed_at: datetime
    # ML & Rule-override metadata
    model_prediction: str = "LEGITIMATE"  # "SCAM" or "LEGITIMATE"
    model_confidence: float = 0.0  # 0.00 to 1.00
    ml_scam_probability: float = 0.0  # 0.00 to 1.00
    ml_score: int = 0  # 0 to 100
    rule_findings: List[ScamWarningSign] = Field(default_factory=list)
    rule_override_applied: bool = False
    override_reason: Optional[str] = None
    recommended_action: str = "PROCEED_SAFELY"


# Payment Execution
class PaymentExecutionRequest(BaseModel):
    recipient_upi: str
    recipient_name: str
    amount: float = Field(..., gt=0, le=50000)
    note: Optional[str] = ""
    category: str = "Payment"
    acknowledge_risk: bool = False
    emergency_override: bool = False


class PaymentResponse(BaseModel):
    transaction_id: int
    demo_transaction_id: Optional[str] = None
    status: str
    amount: float
    recipient_name: str
    recipient_upi: str
    risk_level: str
    risk_score: int
    message: str
    new_balance: float
    is_simulated: bool = True
    disclaimer: str = "Demo application. No real money is transferred. Simulated transaction: No actual funds were debited from any real bank account."
    caregiver_alert_sent: bool = False
    timestamp: datetime


class TransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    recipient_name: str
    recipient_upi: str
    category: str
    note: Optional[str]
    status: str
    risk_score: int
    risk_level: str
    risk_reasons: str
    is_simulated: bool
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# Wallet Freeze / Emergency Schemas
class FreezeWalletRequest(BaseModel):
    reason: str = Field(default="Suspected fraudulent activity or unauthorized request")
    notify_caregiver: bool = True


class EmergencyStatusResponse(BaseModel):
    is_frozen: bool
    freeze_reason: Optional[str]
    emergency_contact_name: str
    emergency_contact_phone: str
    helpline_numbers: dict
    caregiver_alert_simulated: bool


# Scam Catalog / Community Database
class ScamReportCreateRequest(BaseModel):
    upi_id: Optional[str] = None
    phone: Optional[str] = None
    title: str = Field(..., min_length=5, max_length=150)
    category: str = Field(..., min_length=3)
    description: str = Field(..., min_length=10)
    sample_message: Optional[str] = ""


class ScamCatalogResponse(BaseModel):
    id: int
    upi_id: Optional[str]
    phone: Optional[str]
    title: str
    category: str
    description: str
    severity: str
    reported_count: int
    sample_message: Optional[str]
    reported_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Practice Sandbox Schemas
class PracticeScenarioResponse(BaseModel):
    id: int
    title: str
    scenario_type: str
    difficulty: str
    sender_or_recipient: str
    vpa: str
    amount: float
    message: str
    hints: str
    explanation: str
    expected_action: str

    model_config = ConfigDict(from_attributes=True)


class PracticeVerifyRequest(BaseModel):
    scenario_id: int
    chosen_action: str  # APPROVE, REJECT_AND_REPORT


class PracticeVerifyResponse(BaseModel):
    scenario_id: int
    is_correct: bool
    feedback: str
    key_safety_takeaway: str


# Privacy Redactor Schemas
class PrivacyRedactRequest(BaseModel):
    text: str = Field(..., max_length=10000, description="Pasted text to sanitize")


class PrivacyRedactSummary(BaseModel):
    otps_masked: int = 0
    phones_masked: int = 0
    emails_masked: int = 0
    cards_masked: int = 0
    upis_masked: int = 0
    total_masked: int = 0


class PrivacyRedactResponse(BaseModel):
    original_text: str
    redacted_text: str
    summary: PrivacyRedactSummary
    warning: str = (
        "⚠️ Automated redaction helps mask recognizable numbers and identifiers, "
        "but it cannot guarantee catching every sensitive detail. Always review before sharing."
    )
    privacy_notice: str = (
        "Zero-Data-Storage Guarantee: Pasted text is processed in memory and never stored in any database "
        "or forwarded to any external service."
    )

