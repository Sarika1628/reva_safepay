import re
from datetime import datetime, timezone
from typing import List, Tuple
from sqlalchemy.orm import Session
from backend.app.models import ScamCatalogItem, TrustedContact
from backend.app.schemas import (
    RiskAssessmentResponse, 
    ScamFlag,
    ScamWarningSign,
    ScamTextDetectionResponse
)
from backend.app.services.risk_thresholds import classify_risk
from backend.app.ml.model_service import predict_scam_message, combine_ml_and_rules


# Known scam indicators and trigger words
SCAM_KEYWORDS = {
    "URGENCY_THREAT": [
        "disconnection", "cut off", "within 10 min", "within 15 min", "within 30 min",
        "power cut", "immediate suspension", "account blocked", "kyc expired",
        "arrest warrant", "police fine", "court summons", "urgent"
    ],
    "PRIZE_OR_LOTTERY": [
        "lottery", "jackpot", "winner", "prize money", "won", "crorepati",
        "cashback reward", "congratulations you won", "claim bonus", "lucky draw"
    ],
    "RECEIVE_MONEY_TRICK": [
        "enter pin to receive", "pin to get", "receive refund", "enter upi pin",
        "scan to get money", "scan to receive", "click to receive"
    ],
    "REMOTE_ACCESS": [
        "anydesk", "teamviewer", "quicksupport", "rustdesk", "screen share",
        "install app to assist", "customer support apk"
    ],
    "IMPERSONATION": [
        "customer care", "officer", "bank manager", "helpdesk", "refund officer",
        "electricity board", "mseb", "bses", "bescom", "telecom department", "trai"
    ]
}


def parse_qr_data(qr_raw: str) -> dict:
    """
    Parses standard UPI QR URI scheme:
    upi://pay?pa=recipient@bank&pn=MerchantName&am=150.00&tn=Note
    """
    if not qr_raw:
        return {}
    
    extracted = {}
    if qr_raw.startswith("upi://pay?") or "pa=" in qr_raw:
        query_part = qr_raw.split("?", 1)[-1]
        pairs = query_part.split("&")
        for p in pairs:
            if "=" in p:
                k, v = p.split("=", 1)
                extracted[k.lower()] = v.replace("%20", " ")
    return extracted


def analyze_risk(
    db: Session,
    user_id: int,
    recipient_upi: str,
    recipient_name: str,
    amount: float,
    note: str = "",
    qr_raw_data: str = None
) -> RiskAssessmentResponse:
    flags: List[ScamFlag] = []
    risk_score = 0
    clean_upi = recipient_upi.strip().lower()
    combined_text = f"{note} {recipient_name} {clean_upi}".lower()
    matched_pattern = None

    # Check if QR provided additional metadata
    if qr_raw_data:
        parsed_qr = parse_qr_data(qr_raw_data)
        if "pa" in parsed_qr:
            clean_upi = parsed_qr["pa"].lower()
        if "pn" in parsed_qr and not recipient_name:
            recipient_name = parsed_qr["pn"]
        if "tn" in parsed_qr:
            combined_text += f" {parsed_qr['tn']}".lower()

    # 1. Trusted Contact Check (Immediate Safety Bonus)
    is_trusted = False
    trusted_query = db.query(TrustedContact).filter(TrustedContact.user_id == user_id)
    if recipient_name and recipient_name.strip():
        trusted_contact = trusted_query.filter(
            (TrustedContact.upi_id.ilike(clean_upi)) |
            (TrustedContact.name.ilike(recipient_name.strip()))
        ).first()
    else:
        trusted_contact = trusted_query.filter(TrustedContact.upi_id.ilike(clean_upi)).first()

    if trusted_contact:
        is_trusted = True
        return RiskAssessmentResponse(
            risk_score=0,
            risk_level="SAFE",
            risk_category="LOW",
            recommended_action="PROCEED_SAFELY",
            visual_color="#10b981",  # Vibrant emerald green
            spoken_warning=f"Verified contact: You are paying {trusted_contact.name}, your {trusted_contact.relationship}. No scam patterns detected. Always verify details independently.",
            is_trusted_contact=True,
            is_known_scam=False,
            flags=[],
            matched_scam_pattern=None,
            caregiver_alert_advised=False,
            is_serious_risk=False,
            safety_advice=[
                f"Recipient {trusted_contact.name} is in your saved trusted directory.",
                "Always verify the amount before confirming.",
                "Never share your OTP or enter your PIN to receive money."
            ],
            recipient_safety_note=f"Verified Trusted Contact: {trusted_contact.name} ({trusted_contact.relationship})",
            upi_safety_note=f"Verified UPI Handle: {clean_upi}",
            amount_safety_note=f"Payment Amount: ₹{amount:,.2f}",
            disclaimer=(
                "Automated CyberCare warning: This rule-based security check analyzes known fraud indicators. "
                "It cannot guarantee that any transaction is completely safe or fraudulent. "
                "Always verify unknown recipients independently."
            )
        )

    # 2. Known Community Scam Database Check
    known_scam = db.query(ScamCatalogItem).filter(
        (ScamCatalogItem.upi_id.ilike(f"%{clean_upi}%")) |
        (ScamCatalogItem.phone == clean_upi)
    ).first()

    if known_scam:
        risk_score += 95
        matched_pattern = f"Known Blacklisted Scam: {known_scam.category}"
        flags.append(ScamFlag(
            category="Blacklisted Scammer",
            title="Known Fraudulent UPI Handle",
            description=f"This ID has been reported {known_scam.reported_count} times for: {known_scam.description}",
            severity="HIGH",
            what_to_do_next="Do NOT pay! This recipient is a reported fraud handle in our scam database. Cancel this payment immediately and report to 1930 Cyber Helpline."
        ))

    # 3. Reuse explainable scam detector on combined text (Note, Recipient Name, UPI Handle)
    text_audit = detect_scam_in_text(combined_text)
    if text_audit.is_suspicious and text_audit.warning_signs:
        for ws in text_audit.warning_signs:
            # Map warning sign to specific action advice
            action_advice = "Do not proceed with this payment. Contact your trusted family member or call the 1930 Cyber Helpline."
            if "Credential Theft" in ws.category or "PIN" in ws.category:
                action_advice = "STOP! Never enter your UPI PIN or share OTP to receive money. UPI PIN is only typed to send money. Cancel this transaction."
            elif "Urgency" in ws.category:
                action_advice = "Do not panic. Official utility boards and banks never disconnect services within minutes over SMS. Call the official number on your physical bill."
            elif "Remote" in ws.category:
                action_advice = "Never install AnyDesk, TeamViewer, or QuickSupport on caller instructions. Hang up immediately."
            elif "Advance-Fee" in ws.category or "Lottery" in ws.category:
                action_advice = "Never pay fees to claim prizes or lottery winnings. Genuine rewards never demand upfront payments."
            elif "Phishing" in ws.category:
                action_advice = "Do not click unverified links or send funds to unknown payment URLs. Use official apps only."

            # Avoid duplicate titles
            if not any(f.title == ws.title for f in flags):
                flags.append(ScamFlag(
                    category=ws.category,
                    title=ws.title,
                    description=ws.explanation,
                    severity="HIGH" if ws.severity in ("HIGH", "CRITICAL") else "MEDIUM",
                    what_to_do_next=action_advice
                ))
        risk_score += text_audit.risk_score

    # 4. Check for Reverse PIN scam ("Enter PIN to receive money") if not already flagged
    has_pin = bool(re.search(r"\bpin\b", combined_text))
    has_receive_intent = bool(re.search(r"\b(receive|get|claim|collect|cashback|refund)\b", combined_text))
    is_pin_trap = any(keyword in combined_text for keyword in SCAM_KEYWORDS["RECEIVE_MONEY_TRICK"]) or (has_pin and has_receive_intent)
    
    if is_pin_trap and not any("PIN" in f.title for f in flags):
        risk_score += 85
        matched_pattern = "Receive Money PIN Trap"
        flags.append(ScamFlag(
            category="PIN Trap Scam",
            title="Never Enter PIN to Receive Funds!",
            description="Crucial Safety Rule: You ONLY enter your UPI PIN to SEND money, never to receive a refund or lottery prize.",
            severity="HIGH",
            what_to_do_next="STOP immediately. Legitimate senders never require you to enter a PIN to receive a payment or refund. Cancel this payment."
        ))

    # 5. Check for Urgency & Disconnection Threat if not already flagged
    if not any("Urgent" in f.title or "Disconnection" in f.title for f in flags):
        for keyword in SCAM_KEYWORDS["URGENCY_THREAT"]:
            if keyword in combined_text:
                risk_score += 65
                matched_pattern = "Urgency / Disconnection Panic Trick"
                flags.append(ScamFlag(
                    category="Urgency Panic Trick",
                    title="Fake Disconnection or Urgent Threat",
                    description="Scammers create artificial panic claiming electricity/SIM will be cut in 15 minutes. Official utility boards never demand instant UPI transfers like this.",
                    severity="HIGH",
                    what_to_do_next="Do not panic. Call your electricity provider using the verified phone number printed on your physical electricity bill."
                ))
                break

    # 6. Check for Lottery / Prize Scam if not already flagged
    if not any("Lottery" in f.title or "Reward" in f.title for f in flags):
        for keyword in SCAM_KEYWORDS["PRIZE_OR_LOTTERY"]:
            if keyword in combined_text:
                risk_score += 70
                matched_pattern = "Prize / Lottery Advance Fee Scam"
                flags.append(ScamFlag(
                    category="Lottery / Prize Scam",
                    title="Unsolicited Reward or Lottery Fee",
                    description="You are being asked to pay money to claim a prize or bonus. Genuine rewards do not require advance processing fees.",
                    severity="HIGH",
                    what_to_do_next="Do not send any advance processing fee or tax. If you did not enter a lottery, you cannot win."
                ))
                break

    # 7. Check for Remote Access APKs if not already flagged
    if not any("Remote" in f.title for f in flags):
        for keyword in SCAM_KEYWORDS["REMOTE_ACCESS"]:
            if keyword in combined_text:
                risk_score += 90
                matched_pattern = "Remote Screen Access Scam"
                flags.append(ScamFlag(
                    category="Device Hijack Threat",
                    title="Dangerous Remote Access App",
                    description="Never download screen-sharing tools like AnyDesk, TeamViewer, or QuickSupport on the instructions of a caller.",
                    severity="HIGH",
                    what_to_do_next="Hang up immediately and uninstall any app the caller told you to download. Never grant screen sharing."
                ))
                break

    # 8. Check for Impersonation in UPI Handle or Name if not already flagged
    if not any("Impersonation" in f.category for f in flags):
        for keyword in SCAM_KEYWORDS["IMPERSONATION"]:
            if keyword in clean_upi or keyword in recipient_name.lower():
                risk_score += 40
                flags.append(ScamFlag(
                    category="Authority Impersonation",
                    title="Suspicious 'Official' or 'Customer Care' Handle",
                    description="Official organizations use verified merchant QR codes, not personal UPI IDs claiming to be 'customercare' or 'officer'.",
                    severity="MEDIUM",
                    what_to_do_next="Verify independently through the customer support phone number on the back of your bank debit card."
                ))
                break

    # 9. First-time unknown recipient & amount risk checks
    if not is_trusted:
        if amount >= 5000:
            risk_score += 25
            if not any("Large Amount" in f.title for f in flags):
                flags.append(ScamFlag(
                    category="High Value Transfer",
                    title="Large Amount to New Payee",
                    description=f"Transferring ₹{amount:,.2f} to a new recipient not saved in your trusted family contacts.",
                    severity="MEDIUM",
                    what_to_do_next="Call your trusted contact or verify the recipient's phone number before sending large amounts."
                ))
        elif amount <= 10 and ("test" in combined_text or "verify" in combined_text):
            risk_score += 35
            if not any("Testing Fee" in f.title for f in flags):
                flags.append(ScamFlag(
                    category="Micro-charge Verification Trick",
                    title="Small Testing Fee Trap",
                    description="Scammers often ask for ₹1 or ₹5 test transfers to link your account or steal OTPs.",
                    severity="MEDIUM",
                    what_to_do_next="Do not send test transfers to unverified callers or third-party links."
                ))

    # Cap risk score between 0 and 100
    risk_score = min(100, max(0, risk_score))

    # Determine serious risk (Pauses the payment flow and requires explicit review)
    is_serious = (risk_score >= 60) or (known_scam is not None) or any(f.severity in ("HIGH", "CRITICAL") for f in flags)

    # Determine severity tier & actions
    if risk_score >= 60 or known_scam:
        risk_level = "HIGH_RISK_SCAM"
        recommended_action = "BLOCK_IMMEDIATELY"
        visual_color = "#ef4444"  # Alert Red
        spoken_warning = (
            f"Payment paused! Serious risk detected for {recipient_name or recipient_upi}. "
            f"Reason: {flags[0].title if flags else 'Suspicious fraudulent patterns'}. "
            "Please review the safety warnings and advice carefully before deciding."
        )
        caregiver_alert_advised = True
    elif risk_score >= 25:
        risk_level = "CAUTION"
        recommended_action = "CARE_DOUBLE_CHECK"
        visual_color = "#f59e0b"  # Amber / Warning Yellow
        spoken_warning = (
            f"Caution. You are paying a new recipient, {recipient_name or recipient_upi}. "
            "Please review recipient details and amount carefully before proceeding."
        )
        caregiver_alert_advised = amount > 2000
    else:
        risk_level = "SAFE"
        recommended_action = "PROCEED_SAFELY"
        visual_color = "#10b981"  # Emerald
        spoken_warning = (
            f"No scam patterns detected for simulated payment of ₹{amount:,.0f} to {recipient_name or recipient_upi}. "
            "SafePay cannot guarantee safety. Please verify details carefully before confirming."
        )
        caregiver_alert_advised = False

    # Build safety review notes for recipient, UPI, and amount
    recipient_safety_note = (
        f"Verified Trusted Contact: {trusted_contact.name}" if is_trusted
        else ("KNOWN FRAUDSTER in scam database" if known_scam
        else f"Unverified New Payee ({recipient_name or 'Name not provided'})")
    )
    upi_safety_note = (
        f"Trusted Handle: {clean_upi}" if is_trusted
        else (f"Blacklisted Scam Handle: {clean_upi}" if known_scam
        else f"UPI Handle: {clean_upi}")
    )
    amount_safety_note = (
        f"High value transfer: ₹{amount:,.2f}" if amount >= 5000
        else f"Simulated Amount: ₹{amount:,.2f}"
    )

    combined_safety_advice = [
        "Never share your OTP or enter your UPI PIN to receive money.",
        "Never install AnyDesk, TeamViewer, or QuickSupport if an unknown caller told you to.",
        "Do not click on unverified payment links or shortened URLs.",
        "If you suspect fraud, call the National Cyber Crime Helpline at 1930 immediately."
    ]
    if text_audit.safety_advice:
        for sa in text_audit.safety_advice:
            if sa not in combined_safety_advice:
                combined_safety_advice.append(sa)

    # Integrate ML and rule metadata from text audit
    model_prediction = getattr(text_audit, "model_prediction", "LEGITIMATE")
    model_confidence = getattr(text_audit, "model_confidence", 0.0)
    ml_scam_probability = getattr(text_audit, "ml_scam_probability", 0.0)
    rule_override_applied = getattr(text_audit, "rule_override_applied", False)
    override_reason = getattr(text_audit, "override_reason", None)

    if text_audit.risk_score > risk_score and not is_trusted:
        risk_score = text_audit.risk_score
    if text_audit.risk_category in ("CRITICAL", "HIGH") and not is_trusted:
        is_serious = True

    is_critical_flag = (known_scam is not None) or any(f.severity in ("CRITICAL", "HIGH") and ("Theft" in f.category or "Hijack" in f.category or "Blacklist" in f.category) for f in flags) or is_pin_trap
    risk_category = classify_risk(risk_score, is_critical_flag=is_critical_flag, has_known_scam=(known_scam is not None))

    return RiskAssessmentResponse(
        risk_score=risk_score,
        risk_level=risk_level,
        risk_category=risk_category,
        recommended_action=recommended_action,
        visual_color=visual_color,
        spoken_warning=spoken_warning,
        is_trusted_contact=is_trusted,
        is_known_scam=known_scam is not None,
        flags=flags,
        matched_scam_pattern=matched_pattern,
        caregiver_alert_advised=caregiver_alert_advised,
        is_serious_risk=is_serious,
        safety_advice=combined_safety_advice[:5],
        recipient_safety_note=recipient_safety_note,
        upi_safety_note=upi_safety_note,
        amount_safety_note=amount_safety_note,
        disclaimer=(
            "Automated CyberCare warning: This hybrid ML and rule-based security check analyzes known fraud indicators. "
            "It cannot guarantee that any transaction is completely safe or fraudulent. "
            "Always verify unknown recipients independently."
        ),
        model_prediction=model_prediction,
        model_confidence=model_confidence,
        ml_scam_probability=ml_scam_probability,
        rule_findings=flags,
        rule_override_applied=rule_override_applied,
        override_reason=override_reason
    )


def detect_scam_in_text(message: str) -> ScamTextDetectionResponse:
    """
    Analyzes arbitrary text (SMS, WhatsApp, email, payment note) using
    explainable, transparent rule-based scam indicators.
    Returns risk score (0-100), category (LOW, MEDIUM, HIGH, CRITICAL),
    detected warning signs with explanations, practical safety advice, and disclaimer.
    """
    clean_text = message.strip()
    lower_text = clean_text.lower()

    warning_signs: List[ScamWarningSign] = []
    safety_advice: List[str] = []
    raw_score = 0

    # 1. Requests for OTP, PIN, Passwords, or Bank Details
    otp_pin_matches = []
    if re.search(r"\b(otp|one[-\s]?time[-\s]?password)\b", lower_text):
        otp_pin_matches.append("OTP / One-Time Password")
    if re.search(r"\b(upi[-\s]?pin|mpin|atm[-\s]?pin|\bpin\b)\b", lower_text) and re.search(r"\b(enter|share|send|provide|give|verify|tell|input|receive|get|claim)\b", lower_text):
        otp_pin_matches.append("UPI PIN / ATM PIN")
    if re.search(r"\b(cvv|card\s*number|expiry\s*date|bank\s*password|net\s*banking\s*password|login\s*password|debit\s*card\s*details)\b", lower_text):
        otp_pin_matches.append("Confidential Bank/Card Details")
    if re.search(r"\b(share|tell|send|enter|give)\s+(?:your\s+)?(?:6|4)?[-\s]?(?:digit\s+)?(?:otp|pin|password|cvv)\b", lower_text):
        otp_pin_matches.append("Direct Request to Share Secret Code")

    if otp_pin_matches:
        raw_score += 45
        warning_signs.append(ScamWarningSign(
            category="Credential Theft",
            title="Request for Secret OTP, PIN, or Passwords",
            explanation="Legitimate banks, electricity boards, and payment apps NEVER ask you to reveal your OTP, UPI PIN, or bank passwords over message or phone. Anyone asking for this is attempting unauthorized access to your money.",
            severity="CRITICAL",
            matched_terms=otp_pin_matches
        ))
        safety_advice.append("NEVER share any 4-digit or 6-digit OTP or UPI PIN with anyone, even if they claim to be a bank official, police officer, or telecom agent.")

    # 2. Urgent Threat / Account Blocking / Service Disconnection
    urgency_matches = []
    if re.search(r"\b(account\s+(?:will\s+be\s+)?(?:blocked|suspended|deactivated|closed|frozen)|kyc\s+(?:expired|suspended|pending|deactivated|update\s+required))\b", lower_text):
        urgency_matches.append("Threat of Account Blocking / KYC Expiry")
    if re.search(r"\b(electricity|power|sim|card)\s+(?:will\s+be\s+)?(?:disconnected|cut(?:\s+off)?|terminated|stopped)\b", lower_text):
        urgency_matches.append("Threat of Power/SIM Disconnection")
    if re.search(r"\b(immediately|urgent|urgently|within\s+\d+\s*(?:mins?|minutes?|hours?)|today\s+night|tonight|final\s+warning|last\s+notice)\b", lower_text):
        urgency_matches.append("Extreme Time Urgency / Artificial Panic")
    if re.search(r"\b(arrest\s+warrant|police\s+(?:action|case|fine)|court\s+summons|legal\s+action)\b", lower_text):
        urgency_matches.append("Legal / Police Arrest Intimidation")

    if urgency_matches:
        raw_score += 35
        warning_signs.append(ScamWarningSign(
            category="Urgency Panic",
            title="Urgent Threat Threatening Immediate Disconnection or Blocking",
            explanation="Scammers deliberately engineer artificial panic (e.g. threatening that power will be cut in 15 minutes or your account will be frozen tonight) to prevent you from consulting family or verifying the claim.",
            severity="HIGH",
            matched_terms=urgency_matches
        ))
        safety_advice.append("Do not act under panic. Genuine banks and utility boards issue formal physical notices and do not disconnect critical services within minutes over SMS or WhatsApp.")

    # 3. Fake Cashback, Lottery, Prize, or Refund Offers
    lottery_matches = []
    if re.search(r"\b(lottery|jackpot|kbc|kaun\s+banega\s+crorepati|crorepati|lucky\s+draw)\b", lower_text):
        lottery_matches.append("Lottery / KBC Draw Reference")
    if re.search(r"\b(congratulations|congrats|winner|won\s+(?:rs\.?|inr|₹)?\s*[\d,]+|selected\s+(?:as\s+)?(?:a\s+)?winner)\b", lower_text):
        lottery_matches.append("Unsolicited Prize / Winner Claim")
    if re.search(r"\b(cashback(?:\s+reward)?|unclaimed\s+(?:refund|cashback|money)|claim\s+(?:your\s+)?(?:reward|bonus|prize|cashback|refund))\b", lower_text):
        lottery_matches.append("Unsolicited Cashback / Refund Lure")

    if lottery_matches:
        raw_score += 35
        warning_signs.append(ScamWarningSign(
            category="Advance-Fee Bait",
            title="Fake Lottery, Prize, Cashback, or Refund Lure",
            explanation="Unsolicited messages promising high-value lottery winnings, surprise cashback, or unexpected refunds are advance-fee fraud tricks designed to lure you into paying processing fees or surrendering credentials.",
            severity="HIGH",
            matched_terms=lottery_matches
        ))
        safety_advice.append("If you did not enter a lottery or purchase a ticket, you cannot win. Never pay any fee or deposit to release a supposed prize or refund.")

    # 4. Suspicious Links and Unknown Payment URLs
    found_urls = re.findall(
        r"(?:https?://[^\s<>\"']+|www\.[^\s<>\"']+"
        r"|(?:bit\.ly|tinyurl\.com|is\.gd|t\.co|ow\.ly|cutt\.ly|rb\.gy|tiny\.cc)(?:/[^\s<>\"']*)?"
        r"|[a-zA-Z0-9-]+\.(?:xyz|top|tk|ml|ga|cf|gq|club|work|ru|cn|buzz|link|rest|surf|site|online|ly|apk)(?:/[^\s<>\"']*)?)",
        lower_text
    )
    suspicious_link_matches = []
    if found_urls:
        for u in found_urls:
            if re.search(r"(bit\.ly|tinyurl\.com|is\.gd|t\.co|ow\.ly|cutt\.ly|rb\.gy|tiny\.cc)", u):
                suspicious_link_matches.append(f"Shortened obfuscated URL: {u}")
            elif re.search(r"\.(xyz|top|tk|ml|ga|cf|gq|club|work|ru|cn|buzz|link|site|online)\b|ngrok\.io", u):
                suspicious_link_matches.append(f"High-risk untrusted web domain: {u}")
            elif re.search(r"(?:sbi|hdfc|icici|pnb|axis|bescom|bses|uppcl|paytm|phonepe|gpay)[^/\s]*\.(?:apk|php|html|xyz|top|site|net|org)", u):
                suspicious_link_matches.append(f"Deceptive lookalike brand domain: {u}")
            elif re.search(r"\.apk\b", u):
                suspicious_link_matches.append(f"Direct executable file/APK download: {u}")
            else:
                suspicious_link_matches.append(f"Web link in message: {u}")

    if re.search(r"\b(click\s+(?:on\s+)?(?:this\s+)?link|open\s+(?:this\s+)?link|payment\s+link|kyc\s+link|verification\s+link)\b", lower_text):
        suspicious_link_matches.append("Call-to-action urging user to click an unverified link")

    if suspicious_link_matches:
        raw_score += 35
        warning_signs.append(ScamWarningSign(
            category="Phishing Link",
            title="Suspicious Link or Unknown Payment URL",
            explanation="The message contains web links, shortened URLs, or suspicious domains. Scammers use these to steer you onto spoofed lookalike banking websites designed to capture your login credentials or install malware.",
            severity="HIGH" if any("shortened" in m.lower() or "lookalike" in m.lower() or "apk" in m.lower() for m in suspicious_link_matches) else "MEDIUM",
            matched_terms=suspicious_link_matches[:3]
        ))
        safety_advice.append("Do NOT click on links received in unsolicited messages. Always open your browser and navigate directly to your bank or provider's official verified portal.")

    # 5. Screen-Sharing or Remote-Access Application Requests
    remote_matches = []
    if re.search(r"\b(anydesk|teamviewer|quicksupport|rustdesk|zoho\s+assist|airdroid|any\s*desk|team\s*viewer)\b", lower_text):
        remote_matches.append("Remote Access Software (AnyDesk/TeamViewer/QuickSupport)")
    if re.search(r"\b(screen\s*share|share\s+your\s+screen|remote\s+access|remote\s+control|mirror\s+screen)\b", lower_text):
        remote_matches.append("Request to Share Screen / Device Control")
    if re.search(r"\b(download\s+(?:this\s+)?apk|install\s+(?:this\s+)?app\s+to\s+assist|support\s+apk|customer\s+support\s+app)\b", lower_text):
        remote_matches.append("Instruction to Install Unverified Mobile App")

    if remote_matches:
        raw_score += 45
        warning_signs.append(ScamWarningSign(
            category="Remote Hijack",
            title="Dangerous Screen-Sharing or Remote-Access App Request",
            explanation="The message or caller instructs you to install screen-sharing software (like AnyDesk or QuickSupport) or an unknown APK. Once installed, fraudsters can see your phone screen, read incoming SMS OTPs in real-time, and control your device remotely.",
            severity="CRITICAL",
            matched_terms=remote_matches
        ))
        safety_advice.append("Never download AnyDesk, TeamViewer, or any APK file instructed by an unknown caller. Legitimate bank or telecom support will NEVER ask you to share your screen.")

    # 6. Impersonation of Banks, Customer Support, or Government Officials
    impersonation_matches = []
    if re.search(r"\b(sbi|state\s+bank|hdfc|icici|axis\s+bank|punjab\s+national\s+bank|pnb|reserve\s+bank|rbi|bank\s+manager|bank\s+officer|bank\s+support)\b", lower_text):
        impersonation_matches.append("Bank / RBI Impersonation")
    if re.search(r"\b(electricity\s+(?:board|department|office|officer)|bses|mseb|bescom|uppcl|dhbvn|tneb|wbnsedcl)\b", lower_text):
        impersonation_matches.append("Electricity Board / Utility Impersonation")
    if re.search(r"\b(police|cyber\s+(?:crime|cell)|cbi|income\s+tax|department\s+of\s+telecom|trai|customs\s+department)\b", lower_text):
        impersonation_matches.append("Law Enforcement / Government Impersonation")
    if re.search(r"\b(customer\s+care(?:\s+executive|\s+number|\s+officer)?|nodal\s+officer|helpdesk\s+executive)\b", lower_text):
        impersonation_matches.append("Customer Care Representative Impersonation")

    if impersonation_matches:
        has_other_scam_signs = bool(otp_pin_matches or urgency_matches or lottery_matches or suspicious_link_matches or remote_matches)
        has_phone_in_msg = bool(re.search(r"\b(?:\+?91[-\s]?)?[6-9]\d{9}\b", lower_text))

        if has_other_scam_signs or has_phone_in_msg:
            raw_score += 25
            warning_signs.append(ScamWarningSign(
                category="Authority Impersonation",
                title="Impersonation of Banks, Utility Providers, or Officials",
                explanation="The message claims to be from an official entity (such as a bank, utility board, or government agency) but pairs it with threats, unofficial links, or personal contact numbers. Scammers use institutional names to lower your guard.",
                severity="HIGH" if has_other_scam_signs else "MEDIUM",
                matched_terms=impersonation_matches
            ))
            safety_advice.append("Verify through official numbers: Check the official customer support number printed on the back of your debit card or on your physical electricity bill.")

    # 7. Pressure to Scan QR Code or Pay Fee to Receive Money
    qr_pin_matches = []
    if re.search(r"\b(scan\s+(?:this\s+)?(?:qr|code)\s+to\s+(?:receive|get|claim|collect|credit))\b", lower_text):
        qr_pin_matches.append("Scan QR Code to Receive Money Trap")
    if re.search(r"\b(enter\s+(?:your\s+)?(?:upi\s+)?pin\s+to\s+(?:receive|get|claim|collect|refund))\b", lower_text):
        qr_pin_matches.append("Enter UPI PIN to Receive Refund Trap")
    if re.search(r"\b(pay\s+(?:rs\.?|inr|₹)?\s*\d+\s*(?:fee|charge|advance|tax|deposit)?\s*to\s*(?:receive|get|claim|release|unlock))\b", lower_text):
        qr_pin_matches.append("Pay Advance Fee to Receive Funds")
    if re.search(r"\b(processing\s+fee|activation\s+charge|customs\s+clearance\s+fee)\b", lower_text) and re.search(r"\b(receive|release|refund|prize|bonus)\b", lower_text):
        qr_pin_matches.append("Advance Processing Fee Demanded")

    if qr_pin_matches:
        raw_score += 45
        warning_signs.append(ScamWarningSign(
            category="QR / PIN Trap",
            title="Pressure to Scan QR Code or Pay to Receive Money",
            explanation="Crucial UPI Security Law: You NEVER scan a QR code or enter your UPI PIN to receive money. Scanning a QR code or typing your PIN is ALWAYS an instruction to SEND money from your bank account.",
            severity="CRITICAL",
            matched_terms=qr_pin_matches
        ))
        safety_advice.append("Golden Rule of UPI: You only enter your PIN to SEND money, never to RECEIVE money. If anyone asks you to scan a QR code to receive a refund, STOP immediately.")

    # 8. ML Model Prediction & Hybrid Rule Override Combination
    # Run scikit-learn ML pipeline (TF-IDF + Logistic Regression)
    ml_result = predict_scam_message(clean_text)

    # Combine ML output with deterministic safety rules
    combined = combine_ml_and_rules(
        ml_result=ml_result,
        rule_score=raw_score,
        warning_signs=warning_signs
    )

    risk_score = combined["combined_risk_score"]
    risk_category = combined["final_risk_category"]
    recommended_action = combined["recommended_action"]
    summary = combined["summary"]
    is_suspicious = (risk_category in ("MEDIUM", "HIGH", "CRITICAL"))

    if combined["rule_override_applied"] and combined.get("override_reason"):
        safety_advice.insert(0, f"SAFETY RULE OVERRIDE: {combined['override_reason']}")

    if risk_category == "LOW":
        safety_advice.append("Although this message appears normal, always stay vigilant and never share passwords or OTPs.")

    safety_advice.append("If you have already sent money or shared credentials, call the National Cyber Crime Helpline at 1930 immediately or visit cybercrime.gov.in.")

    return ScamTextDetectionResponse(
        risk_score=risk_score,
        risk_category=risk_category,
        is_suspicious=is_suspicious,
        summary=summary,
        warning_signs=warning_signs,
        safety_advice=safety_advice,
        disclaimer=(
            "Automated CyberCare warning: This assessment combines a local ML classification model "
            "(TF-IDF + Logistic Regression) with safety rule overrides. It is not an absolute guarantee "
            "that a message is safe or fraudulent. Never share OTPs, PINs, or passwords, and always verify through official channels."
        ),
        analyzed_at=datetime.now(timezone.utc),
        model_prediction=ml_result.get("model_prediction", "LEGITIMATE"),
        model_confidence=ml_result.get("model_confidence", 0.0),
        ml_scam_probability=ml_result.get("ml_scam_probability", 0.0),
        ml_score=ml_result.get("ml_score", 0),
        rule_findings=warning_signs,
        rule_override_applied=combined.get("rule_override_applied", False),
        override_reason=combined.get("override_reason"),
        recommended_action=recommended_action
    )

