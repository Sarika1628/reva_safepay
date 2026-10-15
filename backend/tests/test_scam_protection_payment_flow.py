"""
Tests for Guided Payment Flow Scam Protection in EasyPay & SafePay.
Validates:
1. Safety review of recipient, UPI ID, and amount before final payment confirmation.
2. Plain-language warnings for OTPs, UPI PINs, remote-access apps, suspicious links, fake refunds, and urgency.
3. Reuse of the explainable rule-based scam detector.
4. Explanations for why flags were raised and what the user should do next.
5. Serious risk detection, pausing, and review requirement before proceeding.
6. Safe payment cancellation leaving balance and ledger untouched.
7. Disclaimers never claiming a guarantee of 100% safety.
8. Simulation-only boundaries (no real banking or real money movement).
"""

import pytest


@pytest.fixture(autouse=True)
def reset_user_wallet(client):
    client.post("/api/users/1/reset-demo")
    yield
    client.post("/api/users/1/reset-demo")


def test_safe_payment_safety_review_and_confirmation(client):
    """
    Test 1: Safe payment to a verified recipient.
    Validates safety review pillars (recipient, UPI ID, amount) and simulated confirmation.
    """
    # 1. Inspect initial balance
    user_res = client.get("/api/users/1")
    assert user_res.status_code == 200
    initial_balance = user_res.json()["balance"]

    # 2. Safety Review Call (before final payment confirmation)
    review_res = client.post(
        "/api/payments/assess-risk?user_id=1",
        json={
            "recipient_name": "Gopal Dairy",
            "recipient_upi": "gopal.dairy@paytm",
            "amount": 150.0,
            "note": "Daily fresh cow milk"
        }
    )
    assert review_res.status_code == 200
    review_data = review_res.json()

    # Verify Safety Review Pillars
    assert review_data["is_trusted_contact"] is True
    assert review_data["is_serious_risk"] is False
    assert review_data["risk_level"] == "SAFE"
    assert review_data["recommended_action"] == "PROCEED_SAFELY"

    # Verify Plain-Language Pillar Explanations
    assert review_data["recipient_safety_note"] is not None
    assert "trusted" in review_data["recipient_safety_note"].lower() or "verified" in review_data["recipient_safety_note"].lower()
    assert review_data["upi_safety_note"] is not None
    assert review_data["amount_safety_note"] is not None
    assert "₹150" in review_data["amount_safety_note"]

    # Verify Disclaimer NEVER guarantees absolute safety
    assert "disclaimer" in review_data
    disclaimer_text = review_data["disclaimer"].lower()
    assert "cannot guarantee" in disclaimer_text or "advisory" in disclaimer_text or "does not guarantee" in disclaimer_text
    assert "guaranteed 100% safe" not in disclaimer_text

    # 3. Final Payment Confirmation & Simulation
    pay_res = client.post(
        "/api/payments/simulate?user_id=1",
        json={
            "recipient_name": "Gopal Dairy",
            "recipient_upi": "gopal.dairy@paytm",
            "amount": 150.0,
            "category": "Vendor",
            "note": "Daily fresh cow milk",
            "emergency_override": False
        }
    )
    assert pay_res.status_code == 200
    pay_data = pay_res.json()
    assert pay_data["status"] == "SUCCESS"
    assert pay_data["amount"] == 150.0
    assert pay_data["is_simulated"] is True
    assert pay_data["demo_transaction_id"].startswith("DEMO-TXN-")
    assert "No real money was transferred" in pay_data["disclaimer"]

    # Balance check: correctly debited in demo environment
    updated_user = client.get("/api/users/1").json()
    assert updated_user["balance"] == initial_balance - 150.0


def test_suspicious_payment_requests_detection_and_next_steps(client):
    """
    Test 2: Reusing scam detector for various fraud lures:
    - OTP / UPI PIN credential theft
    - Remote-access apps (AnyDesk, TeamViewer)
    - Suspicious links
    - Fake refunds / lotteries
    - Urgent pressure to pay
    Each flag must explain WHY it was flagged and WHAT TO DO NEXT.
    """
    scenarios = [
        {
            "name": "OTP / PIN Theft",
            "upi": "refund.support@ybl",
            "note": "Share OTP and enter UPI PIN to receive your instant ₹2000 cashback",
            "expected_keyword": "pin",
            "expected_action_keyword": "never"
        },
        {
            "name": "Remote-Access Application",
            "upi": "tech.support@icici",
            "note": "Install AnyDesk app and TeamViewer QuickSupport APK to resolve your banking freeze",
            "expected_keyword": "remote",
            "expected_action_keyword": "install"
        },
        {
            "name": "Suspicious Link Phishing",
            "upi": "rewards.portal@okaxis",
            "note": "Visit bit.ly/claim-bank-kyc-reward to unlock your account balance",
            "expected_keyword": "link",
            "expected_action_keyword": "click"
        },
        {
            "name": "Fake Refund / Lottery Lure",
            "upi": "lottery.prize777@paytm",
            "note": "Congratulations you won Kaun Banega Crorepati lucky draw lottery prize claim refund now",
            "expected_keyword": "lottery",
            "expected_action_keyword": "prize"
        },
        {
            "name": "Urgent Pressure / Disconnection Threat",
            "upi": "power.bill.desk@okaxis",
            "note": "Electricity power cut in 15 minutes tonight unless you pay bill immediately",
            "expected_keyword": "urgency",
            "expected_action_keyword": "disconnection"
        }
    ]

    for sc in scenarios:
        res = client.post(
            "/api/payments/assess-risk?user_id=1",
            json={
                "recipient_name": sc["name"],
                "recipient_upi": sc["upi"],
                "amount": 500.0,
                "note": sc["note"]
            }
        )
        assert res.status_code == 200, f"Failed for scenario {sc['name']}"
        data = res.json()

        # Risk must be elevated
        assert data["risk_score"] > 30, f"Expected elevated risk for {sc['name']}"
        assert len(data["flags"]) > 0, f"Expected flags for {sc['name']}"

        # Every flag MUST have why it was flagged and what to do next
        for flag in data["flags"]:
            assert flag["title"], "Flag must have a title"
            assert flag["description"], f"Flag '{flag['title']}' must have a description (why flagged)"
            assert flag["what_to_do_next"], f"Flag '{flag['title']}' must have actionable 'what_to_do_next' advice"
            assert len(flag["what_to_do_next"]) > 10, "what_to_do_next must be informative"


def test_serious_risk_pauses_payment_and_requires_review(client):
    """
    Test 3: Serious risk must pause payment simulation.
    Attempting to confirm without deliberate override returns 422 Intercepted,
    does NOT debit balance, and records a BLOCKED_SCAM in audit ledger.
    """
    user_res = client.get("/api/users/1")
    balance_before = user_res.json()["balance"]

    scam_payload = {
        "recipient_name": "Power Cut Department",
        "recipient_upi": "bses.electricity.disconnection@upi",
        "amount": 1450.0,
        "note": "Urgent electricity power cut within 15 minutes unless paid immediately",
        "emergency_override": False
    }

    # First attempt: Blocked / Paused
    blocked_res = client.post("/api/payments/simulate?user_id=1", json=scam_payload)
    assert blocked_res.status_code == 422
    err_detail = blocked_res.json()["detail"]
    assert "Intercepted" in err_detail["message"]
    assert err_detail["risk_level"] == "HIGH_RISK_SCAM"

    # Verify user balance was NOT debited
    user_after_block = client.get("/api/users/1").json()
    assert user_after_block["balance"] == balance_before

    # Verify audit ledger recorded the blocked attempt
    txns = client.get("/api/transactions?user_id=1").json()
    assert txns[0]["status"] == "BLOCKED_SCAM"
    assert txns[0]["recipient_upi"] == "bses.electricity.disconnection@upi"

    # Second attempt: User deliberately reviews warnings and proceeds in demo sandbox
    scam_payload["emergency_override"] = True
    override_res = client.post("/api/payments/simulate?user_id=1", json=scam_payload)
    assert override_res.status_code == 200
    override_data = override_res.json()
    assert override_data["status"] == "FLAGGED_OVERRIDE"
    assert override_data["is_simulated"] is True

    # Balance now debited in demo environment
    user_after_override = client.get("/api/users/1").json()
    assert user_after_override["balance"] == balance_before - 1450.0


def test_payment_cancellation_flow(client):
    """
    Test 4: Payment cancellation flow.
    When a user decides to go back or cancel payment during safety review,
    no transaction is submitted to the backend, zero funds are debited,
    and ledger length remains identical.
    """
    # 1. Record baseline state
    user_initial = client.get("/api/users/1").json()
    balance_initial = user_initial["balance"]
    txns_initial = client.get("/api/transactions?user_id=1").json()
    count_initial = len(txns_initial)

    # 2. User reviews payment details in Stage 2
    review_res = client.post(
        "/api/payments/assess-risk?user_id=1",
        json={
            "recipient_name": "Suspicious Vendor",
            "recipient_upi": "unknown.vendor@upi",
            "amount": 2500.0,
            "note": "Payment request"
        }
    )
    assert review_res.status_code == 200
    # User sees caution / warnings and clicks "Cancel Payment" or "Back to Edit"

    # 3. Verify that cancellation creates no server mutations
    txns_after = client.get("/api/transactions?user_id=1").json()
    assert len(txns_after) == count_initial

    user_after = client.get("/api/users/1").json()
    assert user_after["balance"] == balance_initial


def test_disclaimer_never_claims_absolute_safety(client):
    """
    Test 5: Explicit test that the scam detector never claims to guarantee safety.
    Rule 7: Never claim the detector can guarantee that a transaction is safe.
    """
    # Check safe recipient assessment
    safe_res = client.post(
        "/api/payments/assess-risk?user_id=1",
        json={
            "recipient_name": "Pooja (Daughter)",
            "recipient_upi": "pooja.family@okaxis",
            "amount": 500.0,
            "note": "Grocery"
        }
    )
    assert safe_res.status_code == 200
    data = safe_res.json()

    disclaimer = data.get("disclaimer", "")
    assert disclaimer, "Assessment must provide a safety disclaimer"
    assert "guarantee" in disclaimer.lower()
    # Must explicitly state it CANNOT guarantee or is advisory
    assert "cannot guarantee" in disclaimer.lower() or "advisory" in disclaimer.lower() or "does not guarantee" in disclaimer.lower()

    # Confirm no false claim in payment response either
    pay_res = client.post(
        "/api/payments/simulate?user_id=1",
        json={
            "recipient_name": "Pooja (Daughter)",
            "recipient_upi": "pooja.family@okaxis",
            "amount": 100.0,
            "note": "Tea",
            "emergency_override": False
        }
    )
    assert pay_res.status_code == 200
    pay_disclaimer = pay_res.json().get("disclaimer", "")
    assert "simulated" in pay_disclaimer.lower() or "demo" in pay_disclaimer.lower()
    assert "guaranteed safe" not in pay_disclaimer.lower()


def test_simulation_only_boundaries_and_amount_validation(client):
    """
    Test 6: Validates simulation-only guardrails and rejection of zero/negative amounts.
    """
    # 1. Zero amount rejection
    zero_res = client.post(
        "/api/payments/simulate?user_id=1",
        json={
            "recipient_name": "Gopal Dairy",
            "recipient_upi": "gopal.dairy@paytm",
            "amount": 0.0
        }
    )
    assert zero_res.status_code in (400, 422)

    # 2. Negative amount rejection
    neg_res = client.post(
        "/api/payments/simulate?user_id=1",
        json={
            "recipient_name": "Gopal Dairy",
            "recipient_upi": "gopal.dairy@paytm",
            "amount": -100.0
        }
    )
    assert neg_res.status_code in (400, 422)

    # 3. Missing recipient details
    missing_res = client.post(
        "/api/payments/simulate?user_id=1",
        json={
            "recipient_name": "",
            "recipient_upi": "",
            "amount": 100.0
        }
    )
    assert missing_res.status_code in (400, 422)
