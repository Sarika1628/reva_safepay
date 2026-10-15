def test_trusted_contact_safe_analysis(client):
    # Ramesh Uncle (id=1) has Gopal Dairy in trusted contacts
    response = client.post(
        "/api/payments/analyze?user_id=1",
        json={
            "recipient_upi": "gopal.dairy@paytm",
            "recipient_name": "Gopal Cow Milk Dairy",
            "amount": 150.0,
            "note": "Morning milk"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "SAFE"
    assert data["risk_score"] == 0
    assert data["is_trusted_contact"] is True
    assert data["recommended_action"] == "PROCEED_SAFELY"


def test_blacklisted_electricity_scam_detection(client):
    # Known scam: bses.electricity.disconnection@upi
    response = client.post(
        "/api/payments/analyze?user_id=1",
        json={
            "recipient_upi": "bses.electricity.disconnection@upi",
            "recipient_name": "Electricity Officer",
            "amount": 1450.0,
            "note": "Power cut in 10 minutes unless paid"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "HIGH_RISK_SCAM"
    assert data["risk_score"] >= 60
    assert data["recommended_action"] == "BLOCK_IMMEDIATELY"
    assert data["is_known_scam"] is True
    assert len(data["flags"]) > 0


def test_reverse_pin_scam_detection(client):
    response = client.post(
        "/api/payments/analyze?user_id=1",
        json={
            "recipient_upi": "random.stranger@okaxis",
            "recipient_name": "Refund Agent",
            "amount": 100.0,
            "note": "Enter your UPI PIN to receive cashback"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "HIGH_RISK_SCAM"
    assert any("PIN" in f["title"] for f in data["flags"])
