"""
Tests for Safety Centre & Practice Scenarios in EasyPay & SafePay.

Verifies:
1. Practice/Safety scenarios endpoint (/api/practice/scenarios) returns valid scenarios.
2. Scam scenario detection and decision validation (/api/practice/verify).
3. Feedback explains why each scenario is a scam or safe without promising fund recovery.
4. Appropriate handling of invalid scenario IDs.
5. Heuristic fraud analysis consistency with Safety Centre principles (reverse PIN, urgency, remote access).
"""

import pytest
from backend.app.database import SessionLocal
from backend.app.models import PracticeScenario
from backend.app.services.scam_engine import detect_scam_in_text


def test_get_practice_scenarios_returns_scam_and_safe_items(client):
    """
    Ensures the /api/practice/scenarios endpoint returns a balanced set of
    scam and safe scenarios with educational explanations and hints.
    """
    res = client.get("/api/practice/scenarios")
    assert res.status_code == 200
    scenarios = res.json()
    assert isinstance(scenarios, list)
    assert len(scenarios) >= 4, "Should have at least 4 practice scenarios seeded"

    # Verify both scam and safe types exist
    types = {s["scenario_type"] for s in scenarios}
    assert "SCAM" in types, "Must include SCAM scenarios"
    assert "SAFE" in types, "Must include SAFE scenarios"

    # Verify every scenario has title, explanation, hints, and expected action
    for s in scenarios:
        assert s["title"], "Scenario must have a title"
        assert s["explanation"], "Scenario must have an educational explanation"
        assert s["hints"], "Scenario must provide senior-friendly hints"
        assert s["expected_action"] in ["APPROVE", "REJECT_AND_REPORT"]


def test_verify_practice_scam_correct_rejection(client):
    """
    Verifies that rejecting a fraudulent scenario (/api/practice/verify)
    marks the decision as correct and commends the user for preventing fraud.
    """
    db = SessionLocal()
    scam_scenario = db.query(PracticeScenario).filter(PracticeScenario.scenario_type == "SCAM").first()
    db.close()
    assert scam_scenario is not None, "A seeded SCAM scenario must exist"

    payload = {
        "scenario_id": scam_scenario.id,
        "chosen_action": "REJECT_AND_REPORT"
    }

    res = client.post("/api/practice/verify", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["is_correct"] is True
    assert "Outstanding job" in data["feedback"] or "correctly identified" in data["feedback"]
    assert data["key_safety_takeaway"] == scam_scenario.explanation


def test_verify_practice_scam_incorrect_approval(client):
    """
    Verifies that mistakenly approving a scam scenario marks the decision
    as incorrect and provides an educational explanation of the danger.
    """
    db = SessionLocal()
    scam_scenario = db.query(PracticeScenario).filter(PracticeScenario.scenario_type == "SCAM").first()
    db.close()

    payload = {
        "scenario_id": scam_scenario.id,
        "chosen_action": "APPROVE"
    }

    res = client.post("/api/practice/verify", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["is_correct"] is False
    assert "Careful!" in data["feedback"] or "scammer" in data["feedback"]
    assert scam_scenario.explanation in data["feedback"] or data["key_safety_takeaway"] == scam_scenario.explanation


def test_verify_practice_safe_approval(client):
    """
    Verifies that approving a legitimate neighborhood vendor transaction
    is recognized as correct.
    """
    db = SessionLocal()
    safe_scenario = db.query(PracticeScenario).filter(PracticeScenario.scenario_type == "SAFE").first()
    db.close()
    assert safe_scenario is not None, "A seeded SAFE scenario must exist"

    payload = {
        "scenario_id": safe_scenario.id,
        "chosen_action": "APPROVE"
    }

    res = client.post("/api/practice/verify", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["is_correct"] is True
    assert "Well done!" in data["feedback"] or "safe" in data["feedback"]


def test_verify_practice_nonexistent_scenario(client):
    """
    Verifies that checking an invalid scenario ID returns a 404 error gracefully.
    """
    payload = {
        "scenario_id": 999999,
        "chosen_action": "REJECT_AND_REPORT"
    }

    res = client.post("/api/practice/verify", json=payload)
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_safety_principles_grounded_in_scam_detector(client):
    """
    Ensures that core Safety Centre principles (reverse PIN, urgency, remote access)
    are consistently detected by the backend scam analysis engine.
    """
    # 1. Reverse PIN trick
    res_pin = client.post(
        "/api/scams/detect-text",
        json={"message": "Enter your UPI PIN to receive Rs 5000 refund in your Google Pay account"}
    )
    assert res_pin.status_code == 200
    data_pin = res_pin.json()
    assert data_pin["is_suspicious"] is True
    assert data_pin["risk_category"] in ("HIGH", "CRITICAL")
    assert any("pin" in w["category"].lower() or "credential" in w["category"].lower() for w in data_pin["warning_signs"])

    # 2. Electricity panic
    res_elec = client.post(
        "/api/scams/detect-text",
        json={"message": "Urgent! Electricity will be disconnected in 15 minutes unless bill paid immediately"}
    )
    assert res_elec.status_code == 200
    data_elec = res_elec.json()
    assert data_elec["is_suspicious"] is True
    assert any("urgency" in w["category"].lower() for w in data_elec["warning_signs"])

    # 3. Screen-sharing app
    res_remote = client.post(
        "/api/scams/detect-text",
        json={"message": "Please install AnyDesk app to update your KYC and avoid account suspension"}
    )
    assert res_remote.status_code == 200
    data_remote = res_remote.json()
    assert data_remote["is_suspicious"] is True
    assert any("remote" in w["category"].lower() or "screen" in w["category"].lower() for w in data_remote["warning_signs"])
