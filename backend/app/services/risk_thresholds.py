"""
Shared Risk-Threshold Configuration for EasyPay & SafePay CyberCare Intelligence.

Documented Thresholds:
- LOW: 0 - 24 (No major warning signs detected)
- MEDIUM: 25 - 49 (Caution / potential risk indicators)
- HIGH: 50 - 79 (Significant fraud indicators / urgency panic)
- CRITICAL: 80 - 100 (Extreme danger / blacklisted handle / OTP theft / remote access)
"""

from typing import Dict, Any

RISK_THRESHOLDS: Dict[str, int] = {
    "CRITICAL": 80,
    "HIGH": 50,
    "MEDIUM": 25,
    "LOW": 0
}

RISK_DESCRIPTIONS: Dict[str, str] = {
    "LOW": "No major warning signs detected. Always independently verify new recipients.",
    "MEDIUM": "Visible caution. Review recipient, amount, and payment purpose carefully.",
    "HIGH": "Stop and check before proceeding. Significant fraud indicators detected.",
    "CRITICAL": "Emergency stop. Extreme danger of financial loss or credential theft."
}


def classify_risk(score: int, is_critical_flag: bool = False, has_known_scam: bool = False) -> str:
    """
    Classifies a risk score (0-100) into one of the four standardized risk categories.
    """
    safe_score = max(0, min(100, int(score or 0)))

    if is_critical_flag or has_known_scam or safe_score >= RISK_THRESHOLDS["CRITICAL"]:
        return "CRITICAL"
    elif safe_score >= RISK_THRESHOLDS["HIGH"]:
        return "HIGH"
    elif safe_score >= RISK_THRESHOLDS["MEDIUM"]:
        return "MEDIUM"
    return "LOW"


def get_risk_threshold_config() -> Dict[str, Any]:
    """
    Returns the complete documented risk-threshold configuration shared with frontend.
    """
    return {
        "thresholds": RISK_THRESHOLDS,
        "categories": ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        "descriptions": RISK_DESCRIPTIONS,
        "disclaimer": (
            "Automated CyberCare warning: Heuristic risk thresholds analyze known fraud patterns. "
            "They cannot guarantee that any transaction is completely safe or fraudulent."
        )
    }
