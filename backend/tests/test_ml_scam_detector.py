"""
Unit & Integration Tests for SafePay ML-Based Scam Detector & Rule-Override Engine

Tests:
1. Model loading on startup and inference with confidence score.
2. Legitimate message classification (LOW risk, confidence, prediction='LEGITIMATE').
3. Scam message classification (HIGH/CRITICAL risk, prediction='SCAM').
4. Crucial Rule Override: Neutral or polite message asking for OTP/PIN or remote access
   MUST be overridden to CRITICAL/HIGH even if ML probability is low.
5. All four risk tiers: LOW, MEDIUM, HIGH, and CRITICAL.
6. Disclaimer verification: Ensures model predictions are never described as a 100% guarantee.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.ml.model_service import predict_scam_message, combine_ml_and_rules
from backend.app.schemas import ScamWarningSign

client = TestClient(app)


def test_ml_model_loads_and_infers():
    """Verify ML model is loaded and generates valid confidence and prediction."""
    res = predict_scam_message("Hi Ramesh uncle, let us meet for evening tea.")
    assert res["is_model_available"] is True
    assert res["model_prediction"] == "LEGITIMATE"
    assert 0.0 <= res["model_confidence"] <= 1.0
    assert 0.0 <= res["ml_scam_probability"] <= 1.0
    assert 0 <= res["ml_score"] <= 24
    assert "not guarantee" in res["model_disclaimer"].lower()


def test_ml_detect_scam_message_api():
    """Verify /api/scams/detect-text returns ML prediction and confidence along with rule findings."""
    res = client.post("/api/scams/detect-text", json={
        "message": "Congratulations! You have won Rs 25,00,000 in KBC Lucky Draw. Pay processing fee Rs 1,500 via UPI."
    })
    assert res.status_code == 200
    data = res.json()
    assert data["model_prediction"] == "SCAM"
    assert data["model_confidence"] >= 0.50
    assert data["risk_category"] in ("HIGH", "CRITICAL")
    assert data["risk_score"] >= 50
    assert data["is_suspicious"] is True
    assert len(data["warning_signs"]) > 0
    assert "not an absolute guarantee" in data["disclaimer"].lower()


def test_rule_override_otp_requests_overrides_to_critical():
    """
    CRITICAL REQUIREMENT:
    Even if a message begins with polite/neutral words, a secret OTP or PIN
    request MUST trigger rule override to CRITICAL.
    """
    res = client.post("/api/scams/detect-text", json={
        "message": "Good morning respected sir. Please share your 6-digit OTP to confirm your appointment."
    })
    assert res.status_code == 200
    data = res.json()
    # Even if ML might be confused by 'good morning respected sir', rule override MUST elevate to CRITICAL
    assert data["risk_category"] == "CRITICAL"
    assert data["risk_score"] >= 80
    assert data["rule_override_applied"] is True
    assert "override" in data["override_reason"].lower()
    assert any("otp" in w["title"].lower() or "credential" in w["category"].lower() for w in data["warning_signs"])


def test_rule_override_remote_access_overrides_to_critical():
    """
    CRITICAL REQUIREMENT:
    Remote access software requests (AnyDesk, TeamViewer) must trigger CRITICAL
    even with otherwise polite language.
    """
    res = client.post("/api/scams/detect-text", json={
        "message": "Dear customer, to assist your query kindly install AnyDesk on your mobile phone."
    })
    assert res.status_code == 200
    data = res.json()
    assert data["risk_category"] == "CRITICAL"
    assert data["risk_score"] >= 80
    assert data["rule_override_applied"] is True
    assert any("remote" in w["category"].lower() or "anydesk" in w["title"].lower() for w in data["warning_signs"])


def test_all_four_risk_tiers_integrated_with_ml():
    """Verify LOW, MEDIUM, HIGH, and CRITICAL response states."""
    # 1. LOW RISK
    low_res = client.post("/api/scams/detect-text", json={
        "message": "Hi mom, reaching home around 7 PM for dinner. See you soon!"
    })
    assert low_res.status_code == 200
    low_data = low_res.json()
    assert low_data["risk_category"] == "LOW"
    assert 0 <= low_data["risk_score"] <= 24
    assert low_data["model_prediction"] == "LEGITIMATE"
    assert low_data["recommended_action"] == "PROCEED_SAFELY"

    # 2. MEDIUM RISK
    med_res = client.post("/api/scams/detect-text", json={
        "message": "Please click on this payment link to view your utility receipt: https://example.com/receipt"
    })
    assert med_res.status_code == 200
    med_data = med_res.json()
    assert med_data["risk_category"] == "MEDIUM"
    assert 25 <= med_data["risk_score"] <= 49
    assert med_data["recommended_action"] == "CARE_DOUBLE_CHECK"

    # 3. HIGH RISK
    high_res = client.post("/api/scams/detect-text", json={
        "message": "Electricity power cut tonight at 9:30 PM due to pending bill. Call officer immediately at 9876543210."
    })
    assert high_res.status_code == 200
    high_data = high_res.json()
    assert high_data["risk_category"] == "HIGH"
    assert 50 <= high_data["risk_score"] <= 79
    assert high_data["recommended_action"] == "BLOCK_IMMEDIATELY"

    # 4. CRITICAL RISK
    crit_res = client.post("/api/scams/detect-text", json={
        "message": "I am sending Rs 5000 refund. Scan this QR code and enter your UPI PIN to claim money."
    })
    assert crit_res.status_code == 200
    crit_data = crit_res.json()
    assert crit_data["risk_category"] == "CRITICAL"
    assert 80 <= crit_data["risk_score"] <= 100
    assert crit_data["recommended_action"] == "BLOCK_IMMEDIATELY"


def test_payment_assess_risk_exposes_ml_metadata():
    """Verify /api/payments/assess-risk endpoint includes ML and rule override metadata."""
    res = client.post("/api/payments/assess-risk?user_id=1", json={
        "recipient_name": "Electricity Bill Helpdesk",
        "recipient_upi": "bill.pay@fraudbank",
        "amount": 2500,
        "note": "Urgent bill power cut tonight"
    })
    assert res.status_code == 200
    data = res.json()
    assert "model_prediction" in data
    assert "model_confidence" in data
    assert "rule_override_applied" in data
    assert data["risk_category"] in ("HIGH", "CRITICAL")
