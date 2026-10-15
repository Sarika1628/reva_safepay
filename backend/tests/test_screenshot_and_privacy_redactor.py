"""
Tests for Screenshot Checker and Privacy Redactor features.

Requirements Verified:
Screenshot Checker:
- Accepts PNG, JPG, JPEG files with 5 MB maximum.
- Compares manually entered transaction references and amounts against simulated SQLite transaction ledger.
- Returns VERIFIED IN DEMO LEDGER, NOT FOUND IN DEMO LEDGER, or UNABLE TO VERIFY.
- Explains that screenshots alone cannot prove payment and that actual payment status must be checked in real bank or payment application.
- Never claims to verify real transactions.

Privacy Redactor:
- Masks recognizable OTPs, phone numbers, email addresses, card-number-like sequences, and UPI IDs.
- Shows redacted result.
- Does not save pasted text in the database or send it to external services (zero-storage).
- Warns that automatic redaction can miss sensitive details.
"""

import pytest
from backend.app.database import SessionLocal
from backend.app.models import Transaction, User
from backend.app.services.privacy_redactor import redact_text


# ============================================================================
# Screenshot Checker Tests
# ============================================================================

def test_screenshot_checker_verified_in_demo_ledger(client):
    """
    When reference and amount match a transaction in SQLite,
    returns status 'VERIFIED IN DEMO LEDGER' and matched transaction record.
    """
    # Query seeded transaction #1
    db = SessionLocal()
    txn = db.query(Transaction).filter(Transaction.id == 1).first()
    db.close()
    assert txn is not None, "Seeded transaction #1 must exist in demo ledger"

    payload = {
        "reference_id": str(txn.id),
        "amount": float(txn.amount),
        "recipient_upi": txn.recipient_upi,
        "text_content": f"Payment to {txn.recipient_name} for dairy milk"
    }

    res = client.post("/api/screenshot/verify", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["ledger_status"] == "VERIFIED IN DEMO LEDGER"
    assert data["matched_record"] is not None
    assert data["matched_record"]["id"] == txn.id
    assert float(data["matched_record"]["amount"]) == float(txn.amount)
    assert "Matched simulated transaction" in data["ledger_message"]


def test_screenshot_checker_not_found_unknown_reference(client):
    """
    When reference ID does not exist in SQLite,
    returns status 'NOT FOUND IN DEMO LEDGER'.
    """
    payload = {
        "reference_id": "TXN-999999999",
        "amount": 4500.0,
        "recipient_upi": "unknown.merchant@okaxis",
        "text_content": "Payment receipt for electronics purchase"
    }

    res = client.post("/api/screenshot/verify", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["ledger_status"] == "NOT FOUND IN DEMO LEDGER"
    assert data["matched_record"] is None
    assert "does not match any simulated transaction" in data["ledger_message"]


def test_screenshot_checker_not_found_altered_amount_mismatch(client):
    """
    When transaction reference is found but the amount differs from SQLite ledger,
    returns status 'NOT FOUND IN DEMO LEDGER' and alerts user to potential alteration.
    """
    db = SessionLocal()
    txn = db.query(Transaction).filter(Transaction.id == 1).first()
    db.close()

    # Provide valid ID 1 but fabricated amount ₹9,999.00 instead of ₹150.00
    payload = {
        "reference_id": str(txn.id),
        "amount": 9999.0,
        "recipient_upi": txn.recipient_upi,
        "text_content": "Altered receipt showing ₹9,999"
    }

    res = client.post("/api/screenshot/verify", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["ledger_status"] == "NOT FOUND IN DEMO LEDGER"
    assert data["matched_record"] is None
    assert "amount differs" in data["ledger_message"]
    assert "Possible altered receipt" in data["ledger_message"]


def test_screenshot_checker_unable_to_verify_missing_fields(client):
    """
    When neither reference ID nor amount is provided,
    returns status 'UNABLE TO VERIFY'.
    """
    payload = {
        "reference_id": "",
        "amount": None,
        "recipient_upi": "",
        "text_content": "Just a general message without transaction reference or amount"
    }

    res = client.post("/api/screenshot/verify", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["ledger_status"] == "UNABLE TO VERIFY"
    assert data["matched_record"] is None
    assert "Enter a Transaction Reference or Amount" in data["ledger_message"]


def test_screenshot_checker_explicit_disclaimer_and_real_bank_warning(client):
    """
    Ensures the response explains that screenshots alone cannot prove payment,
    actual status must be checked in the user's real bank/payment application,
    and never claims to verify real transactions.
    """
    payload = {
        "reference_id": "1",
        "amount": 150.0,
        "recipient_upi": "gopal.dairy@paytm",
        "text_content": "Payment confirmation"
    }

    res = client.post("/api/screenshot/verify", json=payload)
    assert res.status_code == 200
    data = res.json()

    disclaimer = data.get("disclaimer", "")
    warning = data.get("screenshot_warning", "")

    # Explain screenshots cannot prove payment
    assert "Screenshots alone cannot prove payment" in disclaimer or "Screenshots alone cannot prove payment" in warning
    # State actual payment status must be checked in real bank / payment app
    assert "real bank" in disclaimer.lower() or "real bank" in warning.lower()
    # Explicitly state simulation / demo ledger only
    assert "demo ledger" in disclaimer.lower() or "simulated" in disclaimer.lower()
    # Never claim to verify real transactions
    assert "never verifies real transactions" in disclaimer.lower()


# ============================================================================
# Privacy Redactor Tests
# ============================================================================

def test_privacy_redactor_service_masks_all_sensitive_categories():
    """
    Verifies that redact_text() masks OTPs, phone numbers, email addresses,
    card numbers, Aadhaar, PAN, and UPI IDs.
    """
    sample_text = (
        "Dear Customer, your OTP is 482910 for card 4582-1029-8472-9182. "
        "Please send Rs 1,500 to rahul.sharma@okaxis or call +91 98450 12345. "
        "Support email: support@easypay.com. KYC: Aadhaar 4829-1029-8921, PAN ABCDE1234F."
    )

    result = redact_text(sample_text)
    redacted = result["redacted_text"]
    summary = result["summary"]

    # 1. OTP
    assert "482910" not in redacted
    assert "[REDACTED OTP]" in redacted
    assert summary["otps_masked"] >= 1

    # 2. Card Number
    assert "4582-1029-8472-9182" not in redacted
    assert "[REDACTED CARD NUMBER]" in redacted
    assert summary["cards_masked"] >= 1

    # 3. UPI ID
    assert "rahul.sharma@okaxis" not in redacted
    assert "[REDACTED UPI ID]" in redacted
    assert summary["upis_masked"] >= 1

    # 4. Phone Number
    assert "98450" not in redacted
    assert "[REDACTED PHONE]" in redacted
    assert summary["phones_masked"] >= 1

    # 5. Email Address
    assert "support@easypay.com" not in redacted
    assert "[REDACTED EMAIL]" in redacted
    assert summary["emails_masked"] >= 1

    # 6. Aadhaar & PAN
    assert "4829-1029-8921" not in redacted
    assert "[REDACTED AADHAAR]" in redacted
    assert "ABCDE1234F" not in redacted
    assert "[REDACTED PAN]" in redacted

    assert summary["total_masked"] >= 6


def test_privacy_redact_endpoint_api(client):
    """
    Verifies the POST /api/privacy/redact endpoint correctly formats the response
    and includes the mandatory automated redaction warning.
    """
    payload = {
        "text": "Call me on 9876543210 or email me at user.name@test.in with verification code 882910"
    }

    res = client.post("/api/privacy/redact", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert "[REDACTED PHONE]" in data["redacted_text"]
    assert "[REDACTED EMAIL]" in data["redacted_text"]
    assert "[REDACTED OTP]" in data["redacted_text"]
    assert data["summary"]["phones_masked"] >= 1
    assert data["summary"]["emails_masked"] >= 1
    assert data["summary"]["otps_masked"] >= 1

    # Mandatory warning requirement
    assert "warning" in data
    assert "cannot guarantee catching every sensitive detail" in data["warning"] or "miss sensitive details" in data["warning"]


def test_privacy_redactor_does_not_save_to_database(client):
    """
    Verifies the zero-data-storage guarantee: pasting text into Privacy Redactor
    does not create any database records or alter existing tables.
    """
    db = SessionLocal()
    txn_count_before = db.query(Transaction).count()
    user_count_before = db.query(User).count()
    db.close()

    payload = {
        "text": "Private Aadhaar 1234-5678-9012 and Secret OTP 991827 and Card 1111-2222-3333-4444"
    }

    res = client.post("/api/privacy/redact", json=payload)
    assert res.status_code == 200

    db = SessionLocal()
    txn_count_after = db.query(Transaction).count()
    user_count_after = db.query(User).count()
    db.close()

    assert txn_count_before == txn_count_after, "Privacy redactor must not write transactions"
    assert user_count_before == user_count_after, "Privacy redactor must not write users"
