def test_recipients_endpoint(client):
    response = client.get("/api/recipients?user_id=1")
    assert response.status_code == 200
    recipients = response.json()
    assert isinstance(recipients, list)
    assert len(recipients) > 0
    assert any("gopal" in r["upi_id"].lower() for r in recipients)


def test_assess_risk_endpoint(client):
    # Safe assessment
    safe_resp = client.post(
        "/api/payments/assess-risk?user_id=1",
        json={
            "recipient_upi": "gopal.dairy@paytm",
            "recipient_name": "Gopal Dairy",
            "amount": 120.0,
            "note": "Morning Milk"
        }
    )
    assert safe_resp.status_code == 200
    data = safe_resp.json()
    assert data["risk_level"] == "SAFE"
    assert data["risk_score"] == 0

    # High risk scam assessment
    scam_resp = client.post(
        "/api/payments/assess-risk?user_id=1",
        json={
            "recipient_upi": "bses.electricity.disconnection@upi",
            "recipient_name": "Electricity Officer",
            "amount": 1450.0,
            "note": "Immediate power cut in 10 min"
        }
    )
    assert scam_resp.status_code == 200
    scam_data = scam_resp.json()
    assert scam_data["risk_level"] == "HIGH_RISK_SCAM"
    assert scam_data["risk_score"] >= 60
    assert len(scam_data["flags"]) > 0


def test_simulate_payment_endpoint(client):
    # Execute a simulated payment via /api/payments/simulate
    response = client.post(
        "/api/payments/simulate?user_id=1",
        json={
            "recipient_upi": "sanjivani.meds@okhdfcbank",
            "recipient_name": "Sanjivani Chemist",
            "amount": 350.0,
            "note": "Monthly BP Medicine",
            "category": "Healthcare"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["amount"] == 350.0
    assert data["is_simulated"] is True
    assert "transaction_id" in data
    txn_id = data["transaction_id"]

    # Verify transaction is recorded in SQLite
    single_txn_resp = client.get(f"/api/transactions/{txn_id}")
    assert single_txn_resp.status_code == 200
    single_data = single_txn_resp.json()
    assert single_data["id"] == txn_id
    assert single_data["amount"] == 350.0
    assert single_data["recipient_upi"] == "sanjivani.meds@okhdfcbank"


def test_transactions_and_insights_endpoints(client):
    txns_resp = client.get("/api/transactions?user_id=1")
    assert txns_resp.status_code == 200
    txns = txns_resp.json()
    assert isinstance(txns, list)
    assert len(txns) > 0

    # Check live dynamic insights
    insights_resp = client.get("/api/insights?user_id=1")
    assert insights_resp.status_code == 200
    insights = insights_resp.json()
    assert "current_month_total" in insights
    assert "scam_money_saved" in insights
    assert "categories" in insights
    assert isinstance(insights["categories"], list)


def test_accessibility_settings_endpoints(client):
    # GET settings
    get_resp = client.get("/api/settings/accessibility?user_id=1")
    assert get_resp.status_code == 200
    assert "preferred_font_size" in get_resp.json()

    # PUT settings
    put_resp = client.put(
        "/api/settings/accessibility?user_id=1",
        json={
            "preferred_font_size": "extra-large",
            "high_contrast": True,
            "voice_guidance": True,
            "slow_mode": True
        }
    )
    assert put_resp.status_code == 200
    data = put_resp.json()
    assert data["preferred_font_size"] == "extra-large"
    assert data["high_contrast"] is True


def test_screenshot_verify_endpoint(client):
    verify_resp = client.post(
        "/api/screenshot/verify?user_id=1",
        json={
            "text_content": "Urgent! Electricity power cut in 10 minutes. Send UPI to bses.power@upi",
            "upi_detected": "bses.power@upi"
        }
    )
    assert verify_resp.status_code == 200
    audit = verify_resp.json()
    assert audit["risk_level"] == "HIGH_RISK_SCAM"
    assert audit["is_safe"] is False
    assert len(audit["reasons"]) > 0


def test_screenshot_ledger_matching_states(client):
    # 1. Fetch an existing transaction to test matching
    txns = client.get("/api/transactions?user_id=1").json()
    assert len(txns) > 0
    first_txn = txns[0]

    # Matching by reference ID
    match_resp = client.post(
        "/api/screenshot/verify?user_id=1",
        json={"reference_id": str(first_txn["id"])}
    )
    assert match_resp.status_code == 200
    match_data = match_resp.json()
    assert match_data["ledger_status"] == "VERIFIED IN DEMO LEDGER"
    assert match_data["matched_record"]["id"] == first_txn["id"]

    # Not found in demo ledger
    not_found_resp = client.post(
        "/api/screenshot/verify?user_id=1",
        json={"reference_id": "99999999"}
    )
    assert not_found_resp.status_code == 200
    assert not_found_resp.json()["ledger_status"] == "NOT FOUND IN DEMO LEDGER"

    # Unable to verify (no reference or amount/recipient)
    unable_resp = client.post(
        "/api/screenshot/verify?user_id=1",
        json={"text_content": "Random harmless chat message"}
    )
    assert unable_resp.status_code == 200
    assert unable_resp.json()["ledger_status"] == "UNABLE TO VERIFY"

