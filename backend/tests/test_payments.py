def test_successful_simulated_payment(client):
    # Make a safe payment to trusted contact
    response = client.post(
        "/api/payments/pay?user_id=1",
        json={
            "recipient_upi": "gopal.dairy@paytm",
            "recipient_name": "Gopal Cow Milk Dairy",
            "amount": 100.0,
            "note": "Simulated Milk Payment",
            "category": "Vendor",
            "emergency_override": False
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["is_simulated"] is True
    assert "No real money" in data["disclaimer"]


def test_insufficient_balance_handling(client):
    # Attempt to transfer large sum exceeding limit or balance
    response = client.post(
        "/api/payments/pay?user_id=1",
        json={
            "recipient_upi": "gopal.dairy@paytm",
            "recipient_name": "Gopal Dairy",
            "amount": 9999999.0,
            "note": "Too much money"
        }
    )
    assert response.status_code in (400, 422)


def test_scam_interception_and_blocking(client):
    # Attempt to pay high-risk electricity scam without override
    response = client.post(
        "/api/payments/pay?user_id=1",
        json={
            "recipient_upi": "bses.electricity.disconnection@upi",
            "recipient_name": "Fake Electricity Officer",
            "amount": 1450.0,
            "note": "Disconnection threat in 10 mins",
            "emergency_override": False
        }
    )
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert "Intercepted" in data["detail"]["message"] or "SafePay" in data["detail"]["message"]


def test_emergency_freeze_locks_wallet(client):
    # 1. Freeze wallet
    freeze_resp = client.post(
        "/api/emergency/freeze?user_id=1",
        json={"reason": "Test emergency lock", "notify_caregiver": True}
    )
    assert freeze_resp.status_code == 200
    assert freeze_resp.json()["status"] == "WALLET_FROZEN"

    # 2. Attempt payment while frozen -> Must be blocked 403
    pay_resp = client.post(
        "/api/payments/pay?user_id=1",
        json={
            "recipient_upi": "gopal.dairy@paytm",
            "recipient_name": "Gopal Cow Milk Dairy",
            "amount": 50.0,
            "note": "Payment while frozen"
        }
    )
    assert pay_resp.status_code == 403
    assert "FROZEN" in pay_resp.json()["detail"]

    # 3. Unfreeze wallet
    unfreeze_resp = client.post("/api/emergency/unfreeze?user_id=1")
    assert unfreeze_resp.status_code == 200
    assert unfreeze_resp.json()["status"] == "WALLET_ACTIVE"


def test_amount_validation_rejects_zero_and_negative(client):
    # Test zero amount
    zero_resp = client.post(
        "/api/payments/pay?user_id=1",
        json={
            "recipient_upi": "gopal.dairy@paytm",
            "recipient_name": "Gopal Dairy",
            "amount": 0.0,
            "note": "Zero payment"
        }
    )
    assert zero_resp.status_code in (400, 422)

    # Test negative amount
    neg_resp = client.post(
        "/api/payments/pay?user_id=1",
        json={
            "recipient_upi": "gopal.dairy@paytm",
            "recipient_name": "Gopal Dairy",
            "amount": -50.0,
            "note": "Negative payment"
        }
    )
    assert neg_resp.status_code in (400, 422)


def test_demo_transaction_id_generation(client):
    response = client.post(
        "/api/payments/simulate?user_id=1",
        json={
            "recipient_upi": "gopal.dairy@paytm",
            "recipient_name": "Gopal Cow Milk Dairy",
            "amount": 20.0,
            "note": "Test Demo TXN ID",
            "category": "Vendor"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "demo_transaction_id" in data
    assert data["demo_transaction_id"].startswith("DEMO-TXN-")
    assert data["status"] == "SUCCESS"

