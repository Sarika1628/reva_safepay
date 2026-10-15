import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.risk_thresholds import classify_risk, RISK_THRESHOLDS, get_risk_threshold_config

client = TestClient(app)


def test_shared_risk_threshold_service_and_endpoint():
    """Verify shared threshold configuration is documented, standard, and accessible via API."""
    cfg = get_risk_threshold_config()
    assert cfg["thresholds"]["CRITICAL"] == 80
    assert cfg["thresholds"]["HIGH"] == 50
    assert cfg["thresholds"]["MEDIUM"] == 25
    assert cfg["thresholds"]["LOW"] == 0
    assert "CRITICAL" in cfg["categories"]
    assert "LOW" in cfg["categories"]

    res = client.get("/api/scams/risk-thresholds")
    assert res.status_code == 200
    data = res.json()
    assert data["thresholds"]["CRITICAL"] == 80
    assert data["thresholds"]["MEDIUM"] == 25
    assert "disclaimer" in data


def test_classify_risk_all_four_tiers():
    """Unit test for classify_risk function across all 4 categories."""
    assert classify_risk(0) == "LOW"
    assert classify_risk(24) == "LOW"
    assert classify_risk(25) == "MEDIUM"
    assert classify_risk(49) == "MEDIUM"
    assert classify_risk(50) == "HIGH"
    assert classify_risk(79) == "HIGH"
    assert classify_risk(80) == "CRITICAL"
    assert classify_risk(100) == "CRITICAL"

    # Critical flag override
    assert classify_risk(10, is_critical_flag=True) == "CRITICAL"
    assert classify_risk(10, has_known_scam=True) == "CRITICAL"


def test_conditional_risk_low_tier():
    """Test LOW risk: normal friendly message, no warning signs."""
    res = client.post("/api/scams/detect-text", json={
        "message": "Hello Ramesh uncle, let us meet for evening tea at 5 PM at the park."
    })
    assert res.status_code == 200
    data = res.json()
    assert data["risk_category"] == "LOW"
    assert data["risk_score"] < 25
    assert data["is_suspicious"] is False
    assert len(data["warning_signs"]) == 0
    assert "LOW RISK" in data["summary"]
    assert "disclaimer" in data


def test_conditional_risk_medium_tier():
    """Test MEDIUM risk: caution indicator like unverified link or large new payee."""
    res = client.post("/api/scams/detect-text", json={
        "message": "Please click on this payment link to view your utility receipt: https://example.com/receipt"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["risk_category"] == "MEDIUM"
    assert 25 <= data["risk_score"] < 50
    assert data["is_suspicious"] is True
    assert len(data["warning_signs"]) > 0


def test_conditional_risk_high_tier():
    """Test HIGH risk: urgency threat or lottery lure."""
    res = client.post("/api/scams/detect-text", json={
        "message": "Dear customer, your electricity power will be disconnected immediately within 15 minutes unless bill is paid. Urgent final warning."
    })
    assert res.status_code == 200
    data = res.json()
    assert data["risk_category"] == "HIGH"
    assert 50 <= data["risk_score"] < 80
    assert data["is_suspicious"] is True
    assert any("Urgency" in w["category"] or "Urgent" in w["title"] for w in data["warning_signs"])


def test_conditional_risk_critical_tier():
    """Test CRITICAL risk: reverse PIN trap, remote access app, or OTP theft."""
    res = client.post("/api/scams/detect-text", json={
        "message": "I am sending your ₹5,000 refund. Please enter your UPI PIN or install AnyDesk app to receive your refund immediately."
    })
    assert res.status_code == 200
    data = res.json()
    assert data["risk_category"] == "CRITICAL"
    assert data["risk_score"] >= 80
    assert data["is_suspicious"] is True
    assert any(w["severity"] == "CRITICAL" for w in data["warning_signs"])


def test_payment_risk_assessment_all_tiers():
    """Verify /api/payments/assess-risk returns standardized risk_category."""
    # 1. Trusted contact -> LOW
    res_low = client.post("/api/payments/assess-risk?user_id=1", json={
        "recipient_name": "Pooja (Daughter)",
        "recipient_upi": "pooja.family@okaxis",
        "amount": 500,
        "note": "Groceries"
    })
    assert res_low.status_code == 200
    data_low = res_low.json()
    assert data_low["risk_category"] == "LOW"
    assert data_low["risk_score"] == 0

    # 2. Known scammer -> CRITICAL
    res_crit = client.post("/api/payments/assess-risk?user_id=1", json={
        "recipient_name": "Power Cut Officer",
        "recipient_upi": "electricity.bill.fraud@upi",
        "amount": 1450,
        "note": "Urgent power cut in 10 minutes"
    })
    assert res_crit.status_code == 200
    data_crit = res_crit.json()
    assert data_crit["risk_category"] == "CRITICAL"
    assert data_crit["risk_score"] >= 80
    assert data_crit["is_serious_risk"] is True


def test_payment_warning_behavior_and_acknowledgement():
    """Verify payment interception on high/critical scam and acknowledgement override."""
    scam_payload = {
        "recipient_name": "Power Cut Officer",
        "recipient_upi": "electricity.bill.fraud@upi",
        "amount": 100,
        "note": "Urgent power cut"
    }

    # Attempt 1: Without acknowledgement -> Should be intercepted with 422
    res_blocked = client.post("/api/payments/simulate?user_id=1", json={
        **scam_payload,
        "acknowledge_risk": False,
        "emergency_override": False
    })
    assert res_blocked.status_code == 422
    err_data = res_blocked.json()["detail"]
    assert err_data["can_override"] is True
    assert err_data["risk_category"] == "CRITICAL"

    # Attempt 2: With explicit user acknowledgement -> Allowed as FLAGGED_OVERRIDE simulation
    res_override = client.post("/api/payments/simulate?user_id=1", json={
        **scam_payload,
        "acknowledge_risk": True,
        "emergency_override": True
    })
    assert res_override.status_code == 200
    success_data = res_override.json()
    assert success_data["status"] == "FLAGGED_OVERRIDE"
    assert success_data["is_simulated"] is True


def test_camera_status_and_privacy_safeguards():
    """Verify camera privacy endpoints guarantee zero SQLite storage and explicit permissions."""
    res = client.get("/api/camera/status")
    assert res.status_code == 200
    data = res.json()
    assert data["sqlite_biometric_storage"] is False
    assert data["privacy_policy"]["zero_cloud_upload"] is True
    assert data["privacy_policy"]["zero_sqlite_retention"] is True
    assert data["privacy_policy"]["requires_explicit_user_start"] is True
    assert "limitations" in data

    res_reset = client.post("/api/camera/reset-biometrics")
    assert res_reset.status_code == 200
    assert res_reset.json()["biometric_db_records"] == 0
