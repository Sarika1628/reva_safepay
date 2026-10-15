import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_safe_friendly_message():
    """Verify safe message returns LOW risk score and category."""
    response = client.post(
        "/api/scams/detect-text",
        json={"message": "Hi Ramesh uncle, let us meet tomorrow for tea at the park around 5 PM."}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_category"] == "LOW"
    assert data["risk_score"] < 20
    assert data["is_suspicious"] is False
    assert len(data["warning_signs"]) == 0
    assert "automated" in data["disclaimer"].lower()


def test_safe_routine_bill_message():
    """Verify benign bill summary with no urgency threats is classified as LOW."""
    response = client.post(
        "/api/scams/detect-text",
        json={"message": "Your milk subscription bill of Rs 480 for October is available. Paid at counter."}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_category"] == "LOW"
    assert data["risk_score"] < 20
    assert data["is_suspicious"] is False


def test_detect_otp_pin_credential_theft():
    """Verify detection of OTP and PIN sharing requests."""
    response = client.post(
        "/api/scams/detect-text",
        json={"message": "Dear customer, your SBI account is locked. Please share the 6-digit OTP sent to your phone to verify identity."}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_category"] in ("HIGH", "CRITICAL")
    assert data["risk_score"] >= 80
    assert data["is_suspicious"] is True
    categories = [w["category"] for w in data["warning_signs"]]
    assert "Credential Theft" in categories
    assert any("otp" in term.lower() for w in data["warning_signs"] for term in w["matched_terms"])


def test_detect_electricity_disconnection_urgency():
    """Verify urgent power cut threat within 15 minutes is flagged."""
    response = client.post(
        "/api/scams/detect-text",
        json={"message": "Dear consumer, your electricity power will be disconnected tonight at 9:30 PM by electricity officer because your bill was not updated. Immediately call 9876543210"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_category"] in ("HIGH", "CRITICAL")
    assert data["risk_score"] >= 70
    assert data["is_suspicious"] is True
    categories = [w["category"] for w in data["warning_signs"]]
    assert "Urgency Panic" in categories


def test_detect_lottery_prize_scam():
    """Verify KBC lottery winner prize scam is flagged."""
    response = client.post(
        "/api/scams/detect-text",
        json={"message": "Congratulations! You have won Rs 25,00,000 in KBC Lucky Draw. To claim your lottery prize money, pay processing fee of Rs 1,500 via UPI."}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_category"] in ("HIGH", "CRITICAL")
    assert data["risk_score"] >= 75
    assert data["is_suspicious"] is True
    categories = [w["category"] for w in data["warning_signs"]]
    assert "Advance-Fee Bait" in categories


def test_detect_remote_access_app_threat():
    """Verify AnyDesk / QuickSupport remote control request is flagged as CRITICAL."""
    response = client.post(
        "/api/scams/detect-text",
        json={"message": "Customer care: Install AnyDesk app or QuickSupport immediately on your mobile so our officer can assist your refund."}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_category"] == "CRITICAL"
    assert data["risk_score"] >= 80
    assert data["is_suspicious"] is True
    categories = [w["category"] for w in data["warning_signs"]]
    assert "Remote Hijack" in categories


def test_detect_suspicious_link():
    """Verify shortened obfuscated URLs and suspicious links are flagged."""
    response = client.post(
        "/api/scams/detect-text",
        json={"message": "Your bank account has been blocked due to KYC. Update your PAN card now by clicking: http://bit.ly/sbi-kyc-verify-urgent"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_category"] in ("HIGH", "CRITICAL")
    assert data["is_suspicious"] is True
    categories = [w["category"] for w in data["warning_signs"]]
    assert "Phishing Link" in categories


def test_detect_scan_qr_to_receive_money():
    """Verify reverse PIN / scan QR code to receive refund trap is flagged as CRITICAL."""
    response = client.post(
        "/api/scams/detect-text",
        json={"message": "I am sending you Rs 5,000 refund. Please scan this QR code and enter your UPI PIN to receive the money in your bank account."}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_category"] == "CRITICAL"
    assert data["risk_score"] >= 80
    assert data["is_suspicious"] is True
    categories = [w["category"] for w in data["warning_signs"]]
    assert "QR / PIN Trap" in categories


def test_empty_message_validation_rejected():
    """Verify empty or whitespace message returns HTTP 400 Bad Request."""
    response = client.post(
        "/api/scams/detect-text",
        json={"message": "   "}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_excessively_long_message_validation_rejected():
    """Verify excessively long message (> 5000 characters) returns HTTP 400 Bad Request."""
    long_msg = "Spam " * 1500  # ~7500 characters
    response = client.post(
        "/api/scams/detect-text",
        json={"message": long_msg}
    )
    assert response.status_code == 400
    assert "too long" in response.json()["detail"].lower()
