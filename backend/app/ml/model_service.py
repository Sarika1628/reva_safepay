"""
SafePay ML Scam Detector - Model Service & Hybrid Risk Combiner

Loads the local scikit-learn Pipeline (TfidfVectorizer + LogisticRegression)
and provides inference with confidence scores.
Combines ML predictions with deterministic safety rules, ensuring that
critical patterns (OTP, PIN, passwords, remote-access apps) ALWAYS override
low ML scores.

Threshold Alignment (from risk_thresholds.py):
- LOW: 0 - 24
- MEDIUM: 25 - 49
- HIGH: 50 - 79
- CRITICAL: 80 - 100

DISCLAIMER:
Model predictions are probabilistic heuristic indicators based on synthetic
educational training data. They NEVER guarantee that a message is 100% safe
or fraudulent.
"""

import os
import logging
from typing import Dict, Any, Optional, List
import joblib

logger = logging.getLogger("safepay.ml")

_MODEL_PIPELINE = None
_MODEL_METADATA = None

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(MODEL_DIR, "scam_model.joblib")
METRICS_FILE = os.path.join(MODEL_DIR, "model_metrics.json")


def load_model() -> bool:
    """
    Loads the trained scikit-learn pipeline artifact into memory.
    If the file does not exist, attempts to train it on the synthetic dataset.
    """
    global _MODEL_PIPELINE, _MODEL_METADATA
    try:
        if not os.path.exists(MODEL_FILE):
            logger.warning(f"Model file {MODEL_FILE} not found. Running training on synthetic dataset...")
            from backend.app.ml.train import train_and_save_model
            train_and_save_model(MODEL_DIR)

        if os.path.exists(MODEL_FILE):
            _MODEL_PIPELINE = joblib.load(MODEL_FILE)
            logger.info(f"Loaded SafePay ML Scam Detector pipeline from {MODEL_FILE}")
            
            # Load metadata if present
            if os.path.exists(METRICS_FILE):
                import json
                with open(METRICS_FILE, "r", encoding="utf-8") as f:
                    _MODEL_METADATA = json.load(f)
            return True
        else:
            logger.error(f"Failed to find or train model at {MODEL_FILE}")
            return False
    except Exception as e:
        logger.error(f"Error loading SafePay ML Scam Detector: {e}")
        _MODEL_PIPELINE = None
        return False


def get_model():
    """Returns the loaded pipeline or attempts to load if not already loaded."""
    global _MODEL_PIPELINE
    if _MODEL_PIPELINE is None:
        load_model()
    return _MODEL_PIPELINE


def predict_scam_message(text: str) -> Dict[str, Any]:
    """
    Runs text through the scikit-learn ML pipeline.
    Returns:
      - model_prediction: "SCAM" | "LEGITIMATE"
      - model_confidence: float between 0.50 and 1.00
      - ml_scam_probability: float between 0.00 and 1.00
      - ml_score: integer aligned with shared risk thresholds (0 to 100)
      - is_model_available: bool
      - model_disclaimer: str
    """
    clean_text = (text or "").strip()
    pipeline = get_model()

    if pipeline is None or not clean_text:
        return {
            "model_prediction": "LEGITIMATE",
            "model_confidence": 0.5,
            "ml_scam_probability": 0.0,
            "ml_score": 0,
            "is_model_available": False,
            "model_disclaimer": "ML Model unavailable; falling back to deterministic safety rules."
        }

    try:
        # Predict class probabilities [P(legitimate), P(scam)]
        probabilities = pipeline.predict_proba([clean_text])[0]
        prob_legit = float(probabilities[0])
        prob_scam = float(probabilities[1])

        # Require prob_scam >= 0.55 to classify as SCAM (neutral unseen words naturally yield ~0.50)
        prediction_label = "SCAM" if prob_scam >= 0.55 else "LEGITIMATE"
        confidence = prob_scam if prediction_label == "SCAM" else prob_legit

        # Map ML score directly into standardized threshold bands
        if prediction_label == "LEGITIMATE":
            if prob_scam <= 0.52:
                ml_score = 0
            else:
                ml_score = int(round((prob_scam - 0.40) * (24 / 0.15)))
                ml_score = min(24, max(0, ml_score))
        else:
            if prob_scam >= 0.75:
                # Strong scam confidence -> HIGH range [65, 79]
                ml_score = int(round(65 + (prob_scam - 0.75) * (14 / 0.25)))
                ml_score = min(79, max(65, ml_score))
            else:
                # Borderline scam confidence -> MEDIUM range [25, 49]
                ml_score = int(round(25 + (prob_scam - 0.55) * (24 / 0.20)))
                ml_score = min(49, max(25, ml_score))

        return {
            "model_prediction": prediction_label,
            "model_confidence": round(confidence, 4),
            "ml_scam_probability": round(prob_scam, 4),
            "ml_score": ml_score,
            "is_model_available": True,
            "model_name": "TfidfVectorizer + LogisticRegression (Local)",
            "model_disclaimer": (
                "ML model prediction is a probabilistic indicator trained on synthetic data. "
                "It does not guarantee that a message is completely safe or fraudulent."
            )
        }
    except Exception as e:
        logger.error(f"Inference error in predict_scam_message: {e}")
        return {
            "model_prediction": "LEGITIMATE",
            "model_confidence": 0.5,
            "ml_scam_probability": 0.0,
            "ml_score": 0,
            "is_model_available": False,
            "model_disclaimer": f"ML Inference error: {str(e)}"
        }


def combine_ml_and_rules(
    ml_result: Dict[str, Any],
    rule_score: int,
    warning_signs: List[Any],
    has_critical_rule: bool = False,
    is_trusted_contact: bool = False
) -> Dict[str, Any]:
    """
    Combines ML prediction with deterministic safety rules.

    CRITICAL SAFETY REQUIREMENT:
    Requests for OTPs, UPI PINs, passwords, or suspicious remote access
    MUST trigger suitable warnings even if the ML model predicts low risk.
    Severe rule-based findings ALWAYS override a low ML prediction.

    Documented Thresholds:
    - LOW: 0 - 24
    - MEDIUM: 25 - 49
    - HIGH: 50 - 79
    - CRITICAL: 80 - 100
    """
    ml_score = ml_result.get("ml_score", 0)
    ml_prediction = ml_result.get("model_prediction", "LEGITIMATE")

    # Has severe rule-based indicators
    has_otp_pin = any(
        getattr(w, "category", "") in ("Credential Theft", "QR / PIN Trap", "PIN_THEFT") or
        "otp" in getattr(w, "title", "").lower() or
        "pin" in getattr(w, "title", "").lower()
        for w in warning_signs
    )
    has_remote_access = any(
        getattr(w, "category", "") in ("Remote Hijack", "REMOTE_ACCESS") or
        "anydesk" in getattr(w, "title", "").lower() or
        "screen" in getattr(w, "title", "").lower()
        for w in warning_signs
    )
    has_critical_severity = any(
        getattr(w, "severity", "") == "CRITICAL" for w in warning_signs
    )
    has_high_severity = any(
        getattr(w, "severity", "") == "HIGH" for w in warning_signs
    )
    has_medium_severity = any(
        getattr(w, "severity", "") == "MEDIUM" for w in warning_signs
    )

    rule_override_applied = False
    override_reason = None

    if has_otp_pin:
        rule_override_applied = True
        override_reason = "Critical Rule Override: Secret OTP or UPI PIN request detected. Elevated to CRITICAL regardless of ML prediction."
        final_risk_category = "CRITICAL"
        combined_score = max(85, min(100, max(rule_score, ml_score, 85)))
    elif has_remote_access or has_critical_severity or has_critical_rule:
        rule_override_applied = True
        override_reason = "Critical Rule Override: Remote-access application or critical device hijack detected. Elevated to CRITICAL."
        final_risk_category = "CRITICAL"
        combined_score = max(85, min(100, max(rule_score, ml_score, 85)))
    elif has_high_severity:
        if ml_prediction == "LEGITIMATE":
            rule_override_applied = True
            override_reason = "Safety Rule Override: High-severity fraud pattern (e.g., urgency panic or fake lottery) detected. Elevated to HIGH."
        final_risk_category = "HIGH"
        combined_score = max(70, min(79, max(rule_score, ml_score, 70)))
    elif ml_prediction == "SCAM" and ml_score >= 50:
        final_risk_category = "HIGH"
        combined_score = max(55, min(79, ml_score))
    elif has_medium_severity or rule_score >= 25:
        final_risk_category = "MEDIUM"
        combined_score = max(25, min(49, max(rule_score, ml_score, 30)))
    elif ml_prediction == "SCAM":
        final_risk_category = "MEDIUM"
        combined_score = max(25, min(49, ml_score))
    else:
        # Clean / Normal: Both rules and ML agree text is low risk
        final_risk_category = "LOW"
        combined_score = max(0, min(24, max(rule_score, ml_score)))
        if is_trusted_contact:
            combined_score = 0

    # Recommended action based on final category
    if final_risk_category == "CRITICAL":
        recommended_action = "BLOCK_IMMEDIATELY"
        summary_text = (
            "CRITICAL RISK: Strong scam indicators detected — do not proceed. "
            "Never share OTPs, UPI PINs, or install remote access software."
        )
    elif final_risk_category == "HIGH":
        recommended_action = "BLOCK_IMMEDIATELY"
        summary_text = (
            "HIGH RISK: Possible scam — stop and check. "
            "Verify independently using a trusted contact method before taking any action."
        )
    elif final_risk_category == "MEDIUM":
        recommended_action = "CARE_DOUBLE_CHECK"
        summary_text = (
            "MEDIUM RISK: Be careful — this message has some suspicious signs. "
            "Review carefully before proceeding."
        )
    else:
        recommended_action = "PROCEED_SAFELY"
        summary_text = (
            "LOW RISK: No major warning signs detected. "
            "SafePay cannot guarantee safety; always verify unfamiliar payees independently."
        )

    return {
        "final_risk_category": final_risk_category,
        "combined_risk_score": combined_score,
        "rule_override_applied": rule_override_applied,
        "override_reason": override_reason,
        "recommended_action": recommended_action,
        "summary": summary_text
    }
