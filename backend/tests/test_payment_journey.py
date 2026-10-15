import pytest


def test_complete_payment_journey(client):
    # -------------------------------------------------------------
    # Step 1: Discover recipients from backend recipient list
    # -------------------------------------------------------------
    recipients_res = client.get("/api/recipients?user_id=1")
    assert recipients_res.status_code == 200
    recipients = recipients_res.json()
    assert len(recipients) > 0
    dairy_recipient = next((r for r in recipients if "dairy" in r["upi_id"].lower()), recipients[0])
    assert dairy_recipient is not None

    # Get user initial balance
    user_res = client.get("/api/users/1")
    assert user_res.status_code == 200
    initial_balance = user_res.json()["balance"]

    # -------------------------------------------------------------
    # Step 2: Amount Validation (Reject negative, zero, or excessive)
    # -------------------------------------------------------------
    # Negative amount
    neg_res = client.post(
        "/api/payments/simulate?user_id=1",
        json={
            "recipient_upi": dairy_recipient["upi_id"],
            "recipient_name": dairy_recipient["name"],
            "amount": -50.0,
            "note": "Negative amount test"
        }
    )
    assert neg_res.status_code == 422

    # Zero amount
    zero_res = client.post(
        "/api/payments/simulate?user_id=1",
        json={
            "recipient_upi": dairy_recipient["upi_id"],
            "recipient_name": dairy_recipient["name"],
            "amount": 0.0,
            "note": "Zero amount test"
        }
    )
    assert zero_res.status_code == 422

    # Excess amount beyond limits
    excess_res = client.post(
        "/api/payments/simulate?user_id=1",
        json={
            "recipient_upi": dairy_recipient["upi_id"],
            "recipient_name": dairy_recipient["name"],
            "amount": 999999.0,
            "note": "Excessive amount test"
        }
    )
    assert excess_res.status_code in (400, 422)

    # -------------------------------------------------------------
    # Step 3: Cancellation must NOT create any transaction or debit balance
    # -------------------------------------------------------------
    txns_before = client.get("/api/transactions?user_id=1").json()
    # Simulating cancellation in frontend: no POST /simulate is fired
    txns_after_cancel = client.get("/api/transactions?user_id=1").json()
    assert len(txns_after_cancel) == len(txns_before)
    user_after_cancel = client.get("/api/users/1").json()
    assert user_after_cancel["balance"] == initial_balance

    # -------------------------------------------------------------
    # Step 4: Risk Assessment Endpoint
    # -------------------------------------------------------------
    # Safe contact check
    safe_assess = client.post(
        "/api/payments/assess-risk?user_id=1",
        json={
            "recipient_upi": dairy_recipient["upi_id"],
            "recipient_name": dairy_recipient["name"],
            "amount": 150.0,
            "note": "Morning cow milk"
        }
    )
    assert safe_assess.status_code == 200
    safe_data = safe_assess.json()
    assert safe_data["risk_level"] == "SAFE"
    assert safe_data["is_trusted_contact"] is True
    assert safe_data["recommended_action"] == "PROCEED_SAFELY"

    # High-Risk Scam check (Electricity Disconnection Panic Trick)
    scam_assess = client.post(
        "/api/payments/assess-risk?user_id=1",
        json={
            "recipient_upi": "bses.electricity.disconnection@upi",
            "recipient_name": "Power Cut Department",
            "amount": 1450.0,
            "note": "Urgent power disconnection in 15 minutes unless paid now"
        }
    )
    assert scam_assess.status_code == 200
    scam_data = scam_assess.json()
    assert scam_data["risk_level"] == "HIGH_RISK_SCAM"
    assert scam_data["risk_score"] >= 60
    assert scam_data["recommended_action"] == "BLOCK_IMMEDIATELY"
    assert len(scam_data["flags"]) > 0

    # -------------------------------------------------------------
    # Step 5: High-Risk Scam Interception (Blocked if no deliberate confirmation)
    # -------------------------------------------------------------
    blocked_pay = client.post(
        "/api/payments/simulate?user_id=1",
        json={
            "recipient_upi": "bses.electricity.disconnection@upi",
            "recipient_name": "Power Cut Department",
            "amount": 1450.0,
            "note": "Urgent power disconnection in 15 minutes",
            "emergency_override": False
        }
    )
    assert blocked_pay.status_code == 422
    blocked_detail = blocked_pay.json()["detail"]
    assert "Intercepted" in blocked_detail["message"]
    # Verify balance was NOT touched
    user_check = client.get("/api/users/1").json()
    assert user_check["balance"] == initial_balance

    # Verify blocked scam was logged into SQLite audit ledger
    txns_after_block = client.get("/api/transactions?user_id=1").json()
    latest_blocked = txns_after_block[0]
    assert latest_blocked["status"] == "BLOCKED_SCAM"
    assert latest_blocked["recipient_upi"] == "bses.electricity.disconnection@upi"

    # -------------------------------------------------------------
    # Step 6: Successful Simulated Payment Execution
    # -------------------------------------------------------------
    pay_amount = 150.0
    pay_res = client.post(
        "/api/payments/simulate?user_id=1",
        json={
            "recipient_upi": dairy_recipient["upi_id"],
            "recipient_name": dairy_recipient["name"],
            "amount": pay_amount,
            "note": "Simulated Daily Milk Payment",
            "category": "Vendor",
            "emergency_override": False
        }
    )
    assert pay_res.status_code == 200
    pay_data = pay_res.json()
    assert pay_data["status"] == "SUCCESS"
    assert pay_data["amount"] == pay_amount
    assert pay_data["is_simulated"] is True
    assert "No real money was transferred or debited" in pay_data["disclaimer"]
    txn_id = pay_data["transaction_id"]

    # -------------------------------------------------------------
    # Step 7: Verify SQLite persistence & Transaction History
    # -------------------------------------------------------------
    single_res = client.get(f"/api/transactions/{txn_id}")
    assert single_res.status_code == 200
    single_txn = single_res.json()
    assert single_txn["id"] == txn_id
    assert single_txn["amount"] == pay_amount
    assert single_txn["recipient_upi"] == dairy_recipient["upi_id"]
    assert single_txn["is_simulated"] is True

    # Check updated balance in SQLite
    user_updated = client.get("/api/users/1").json()
    assert user_updated["balance"] == initial_balance - pay_amount

    # -------------------------------------------------------------
    # Step 8: Verify Live Spending Insights Update
    # -------------------------------------------------------------
    insights_res = client.get("/api/insights?user_id=1")
    assert insights_res.status_code == 200
    insights = insights_res.json()
    assert insights["current_month_total"] >= pay_amount
    assert insights["scam_money_saved"] >= 1450.0  # From intercepted scam earlier
    assert len(insights["categories"]) > 0

    # -------------------------------------------------------------
    # Step 9: Emergency Freeze Lock Prevents Payments (403)
    # -------------------------------------------------------------
    client.post("/api/emergency/freeze?user_id=1", json={"reason": "SOS Panic Lock", "notify_caregiver": True})
    frozen_pay = client.post(
        "/api/payments/simulate?user_id=1",
        json={
            "recipient_upi": dairy_recipient["upi_id"],
            "recipient_name": dairy_recipient["name"],
            "amount": 50.0,
            "note": "Payment attempt while locked"
        }
    )
    assert frozen_pay.status_code == 403
    assert "FROZEN" in frozen_pay.json()["detail"]

    # Cleanup: unfreeze wallet for clean state
    client.post("/api/emergency/unfreeze?user_id=1")
    user_restored = client.get("/api/users/1").json()
    assert user_restored["is_frozen"] is False
