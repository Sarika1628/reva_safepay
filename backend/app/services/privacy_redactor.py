"""
Privacy Redaction Service for EasyPay & SafePay.
Masks recognizable sensitive details:
- OTPs (4-digit, 6-digit, 8-digit)
- Phone numbers (10-digit Indian numbers, +91 prefixes)
- Email addresses
- Card numbers, Aadhaar, PAN, and Bank Accounts
- UPI IDs / VPAs

Operates strictly in-memory. Zero database storage. Zero external network calls.
"""

import re
from typing import Dict, Any, Tuple


def redact_text(text: str) -> Dict[str, Any]:
    """
    Sanitizes sensitive personal data from text.
    Returns the redacted text and a statistical summary of masked items.
    """
    if not text:
        return {
            "original_text": "",
            "redacted_text": "",
            "summary": {
                "otps_masked": 0,
                "phones_masked": 0,
                "emails_masked": 0,
                "cards_masked": 0,
                "upis_masked": 0,
                "total_masked": 0
            },
            "warning": (
                "⚠️ Automated redaction helps mask recognizable numbers and identifiers, "
                "but it cannot guarantee catching every sensitive detail. Always review before sharing."
            ),
            "privacy_notice": (
                "Zero-Data-Storage Guarantee: Pasted text is processed in memory and never stored in any database "
                "or forwarded to any external service."
            )
        }

    otps_count = 0
    phones_count = 0
    emails_count = 0
    cards_count = 0
    upis_count = 0

    working_text = text

    # 1. Mask Debit / Credit Card Numbers (16 digits with spaces or dashes)
    card_pattern = re.compile(r"\b(?:\d{4}[\s-]){3}\d{4}\b|\b\d{16}\b")
    cards_matches = card_pattern.findall(working_text)
    if cards_matches:
        cards_count += len(cards_matches)
        working_text = card_pattern.sub("[REDACTED CARD NUMBER]", working_text)

    # 2. Mask 12-digit Aadhaar sequences (4-4-4 formatted)
    aadhaar_pattern = re.compile(r"\b\d{4}[\s-]\d{4}[\s-]\d{4}\b")
    aadhaar_matches = aadhaar_pattern.findall(working_text)
    if aadhaar_matches:
        cards_count += len(aadhaar_matches)
        working_text = aadhaar_pattern.sub("[REDACTED AADHAAR]", working_text)

    # 3. Mask PAN Card Identifiers (5 letters + 4 digits + 1 letter)
    pan_pattern = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")
    pan_matches = pan_pattern.findall(working_text)
    if pan_matches:
        cards_count += len(pan_matches)
        working_text = pan_pattern.sub("[REDACTED PAN]", working_text)

    # 4. Mask Bank Account numbers labeled with a/c, acct, account
    acct_pattern = re.compile(r"(?i)\b(?:a/c|acct|account(?:\s*no\.?)?)\s*(?:is|:|-|=)?\s*([0-9]{9,18})\b")
    for match in acct_pattern.finditer(working_text):
        cards_count += 1
    working_text = acct_pattern.sub(lambda m: m.group(0).replace(m.group(1), "[REDACTED ACCOUNT]"), working_text)

    # 5. Mask Email Addresses
    email_pattern = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(?:com|org|net|edu|gov|in|co\.in|io|ai|me|info|biz)\b", re.IGNORECASE)
    email_matches = email_pattern.findall(working_text)
    if email_matches:
        emails_count += len(email_matches)
        working_text = email_pattern.sub("[REDACTED EMAIL]", working_text)

    # 6. Mask UPI IDs / VPAs
    # Specific bank handles or general user@bank handles
    upi_pattern = re.compile(
        r"\b[a-zA-Z0-9.\-_]{2,}@(paytm|okhdfcbank|okaxis|oksbi|okicici|ybl|ibl|axl|upi|apl|barodampay|postbank|federal|sbi|icici|hdfc|axis|pnb|kotak|indus|airtel)\b"
        r"|\b[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{3,}\b",
        re.IGNORECASE
    )
    # Check that it's not already redacted
    upi_matches = [m for m in upi_pattern.findall(working_text) if not m.startswith("[REDACTED")]
    # Replace UPI IDs
    def replace_upi(match):
        nonlocal upis_count
        val = match.group(0)
        if "[REDACTED" in val:
            return val
        upis_count += 1
        return "[REDACTED UPI ID]"

    working_text = re.sub(
        r"\b(?![A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(?:com|org|net|edu|gov|in|co\.in|io|ai|me|info|biz)\b)[a-zA-Z0-9.\-_]{2,}@(paytm|okhdfcbank|okaxis|oksbi|okicici|ybl|ibl|axl|upi|apl|barodampay|postbank|federal|sbi|icici|hdfc|axis|pnb|kotak|indus|airtel|[a-zA-Z]{3,})\b",
        replace_upi,
        working_text,
        flags=re.IGNORECASE
    )

    # 7. Mask Explicit OTPs & PINs
    # Context-based OTP patterns
    otp_ctx_pattern = re.compile(r"(?i)\b(?:otp|one\s*time\s*password|verification\s*code|auth\s*code|login\s*code|pin)\s*(?:is|:|-|=)?\s*([0-9]{4,8})\b")
    for match in otp_ctx_pattern.finditer(working_text):
        otps_count += 1
    working_text = otp_ctx_pattern.sub(lambda m: m.group(0).replace(m.group(1), "[REDACTED OTP]"), working_text)

    # Standalone 6-digit codes if text suggests verification / OTP context
    if re.search(r"(?i)\b(?:otp|code|login|verification|verify|secret|password|bank|credit)\b", text):
        standalone_otp = re.compile(r"\b(?<!\[REDACTED\s)\b\d{6}\b")
        for match in standalone_otp.finditer(working_text):
            otps_count += 1
        working_text = standalone_otp.sub("[REDACTED OTP]", working_text)

    # 8. Mask Phone Numbers (Indian mobile formats: 10 digits starting with 6-9, +91 prefixes)
    phone_pattern = re.compile(r"(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|\b0[6-9]\d{9}\b")
    for match in phone_pattern.finditer(working_text):
        val = match.group(0)
        if "[REDACTED" not in val:
            phones_count += 1
    working_text = phone_pattern.sub("[REDACTED PHONE]", working_text)

    total_masked = otps_count + phones_count + emails_count + cards_count + upis_count

    return {
        "original_text": text,
        "redacted_text": working_text,
        "summary": {
            "otps_masked": otps_count,
            "phones_masked": phones_count,
            "emails_masked": emails_count,
            "cards_masked": cards_count,
            "upis_masked": upis_count,
            "total_masked": total_masked
        },
        "warning": (
            "⚠️ Automated redaction helps mask recognizable numbers and identifiers, "
            "but it cannot guarantee catching every sensitive detail. Always review before sharing."
        ),
        "privacy_notice": (
            "Zero-Data-Storage Guarantee: Pasted text is processed in memory and never stored in any database "
            "or forwarded to any external service."
        )
    }
