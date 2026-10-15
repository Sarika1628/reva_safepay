import json
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from backend.app.models import User, TrustedContact, Transaction, ScamCatalogItem, PracticeScenario


def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).first():
        return

    # 1. Synthetic Demo Users
    user1 = User(
        name="Ramesh Uncle",
        persona="Senior Citizen (Age 72)",
        bio="Retired teacher. Prefers large buttons, slow reassurance, and voice guidance.",
        balance=18500.0,
        phone="+91 98450 11223",
        emergency_contact_name="Pooja (Daughter)",
        emergency_contact_phone="+91 99001 99887",
        is_frozen=False,
        preferred_font_size="large",
        high_contrast=False,
        voice_guidance=True,
        slow_mode=True
    )
    user2 = User(
        name="Lakshmi Devi",
        persona="Vision Assist Mode (Age 68)",
        bio="Loves high-contrast text and audio readouts for receipts and warnings.",
        balance=12400.0,
        phone="+91 98860 33445",
        emergency_contact_name="Arjun (Son)",
        emergency_contact_phone="+91 98440 22331",
        is_frozen=False,
        preferred_font_size="xlarge",
        high_contrast=True,
        voice_guidance=True,
        slow_mode=True
    )
    user3 = User(
        name="Aarav",
        persona="Deaf & Non-speaking Mode (Age 23)",
        bio="Visual-first user. Relies on color-coded badges, haptic alerts, and quick vendor phrase cards.",
        balance=9200.0,
        phone="+91 97410 55667",
        emergency_contact_name="Neha (Sister)",
        emergency_contact_phone="+91 97400 44556",
        is_frozen=False,
        preferred_font_size="standard",
        high_contrast=False,
        voice_guidance=False,
        slow_mode=False
    )
    db.add_all([user1, user2, user3])
    db.commit()

    # 2. Trusted Contacts for Ramesh Uncle (user1.id)
    contacts = [
        TrustedContact(
            user_id=user1.id,
            name="Pooja (Daughter)",
            upi_id="pooja.sharma@okaxis",
            phone="+91 99001 99887",
            relationship="Daughter",
            category="Family",
            is_verified=True,
            quick_amount=2000.0,
            quick_phrase="Sending love and pocket expenses to daughter"
        ),
        TrustedContact(
            user_id=user1.id,
            name="Gopal Cow Milk Dairy",
            upi_id="gopal.dairy@paytm",
            phone="+91 98451 88776",
            relationship="Milk Vendor",
            category="Vendor",
            is_verified=True,
            quick_amount=150.0,
            quick_phrase="Daily milk delivery bill payment"
        ),
        TrustedContact(
            user_id=user1.id,
            name="Sanjivani Chemist & Pharmacy",
            upi_id="sanjivani.meds@okhdfcbank",
            phone="+91 94480 33221",
            relationship="Pharmacist",
            category="Healthcare",
            is_verified=True,
            quick_amount=650.0,
            quick_phrase="Monthly BP & Sugar tablets payment"
        ),
        TrustedContact(
            user_id=user1.id,
            name="Raju Auto Rickshaw",
            upi_id="raju.auto@icici",
            phone="+91 98800 77665",
            relationship="Trusted Driver",
            category="Vendor",
            is_verified=True,
            quick_amount=80.0,
            quick_phrase="Auto fare to temple and park"
        ),
        TrustedContact(
            user_id=user1.id,
            name="Dr. Kulkarni Clinic",
            upi_id="dr.kulkarni@sbi",
            phone="+91 98440 11990",
            relationship="Family Doctor",
            category="Healthcare",
            is_verified=True,
            quick_amount=400.0,
            quick_phrase="Doctor consultation and health checkup fee"
        )
    ]
    db.add_all(contacts)

    # 3. Community Scam Blacklist / Catalog
    scams = [
        ScamCatalogItem(
            upi_id="bses.electricity.disconnection@upi",
            phone="+91 91234 56789",
            title="Fake Electricity Disconnection Warning",
            category="Electricity Threat",
            description="Sends SMS claiming power will be disconnected at 9:30 PM due to unpaid previous month bill. Asks victim to urgently call or transfer to personal UPI ID.",
            severity="CRITICAL",
            reported_count=42,
            sample_message="Dear Consumer, Your electricity power will be disconnected tonight at 9:30 PM from electricity office because your previous month bill was not updated. Please immediately contact our power officer at 9123456789 or pay bill here."
        ),
        ScamCatalogItem(
            upi_id="kbc.lottery.headquarters@okaxis",
            phone="+91 98765 00112",
            title="KBC / Amitabh Bachchan WhatsApp Lottery Trap",
            category="Lottery / Prize",
            description="Claims user won ₹25,00,000 cash prize in WhatsApp lucky draw. Demands ₹499 or ₹2,500 'GST tax certificate fee' via UPI.",
            severity="HIGH",
            reported_count=67,
            sample_message="Congratulations! Your SIM number won 25 Lakh Rupees in KBC WhatsApp draw. To transfer amount to your SBI account, pay file processing fee ₹499."
        ),
        ScamCatalogItem(
            upi_id="sbi.yono.kyc.verification@paytm",
            phone="+91 80011 22334",
            title="SBI YONO / Bank Account KYC Suspension Fraud",
            category="KYC Suspension",
            description="Threatens immediate account block within 24 hours unless an unverified APK is downloaded or small payment is made to update Aadhaar/PAN.",
            severity="CRITICAL",
            reported_count=89,
            sample_message="Dear Customer, Your SBI YONO account will be blocked today. Please complete your KYC verification immediately by sending ₹10 to activate portal."
        ),
        ScamCatalogItem(
            upi_id="anydesk.support.desk@airtel",
            phone="+91 99988 77665",
            title="Fake Customer Care Remote Screen Access Scam",
            category="Remote Access / AnyDesk",
            description="Scammer pretends to help with wrong payment refund and tricks elderly caller into installing AnyDesk or TeamViewer QuickSupport to view OTPs.",
            severity="CRITICAL",
            reported_count=35,
            sample_message="Customer Care Executive: Please download our safety companion app QuickSupport so I can authorize your ₹500 wrong recharge refund."
        )
    ]
    db.add_all(scams)

    # 4. Guided Senior Practice Scenarios
    scenarios = [
        PracticeScenario(
            title="Paying Gopal Dairy for Morning Milk",
            scenario_type="SAFE",
            difficulty="Beginner",
            sender_or_recipient="Gopal Dairy",
            vpa="gopal.dairy@paytm",
            amount=120.0,
            message="Payment for 2 Litres of cow milk",
            hints="Check the recipient name and UPI ID. Does it match your verified neighborhood vendor?",
            explanation="This is a safe daily transaction. The vendor is in your trusted directory and the amount matches your usual grocery purchase.",
            expected_action="APPROVE"
        ),
        PracticeScenario(
            title="Threat: Electricity Cut in 15 Minutes!",
            scenario_type="SCAM",
            difficulty="Beginner",
            sender_or_recipient="Electricity Power Officer",
            vpa="bses.electricity.disconnection@upi",
            amount=1450.0,
            message="Urgent! Pay ₹1450 immediately or power disconnected in 15 minutes.",
            hints="Notice the urgency ('15 minutes') and personal UPI ID instead of the official utility portal.",
            explanation="Classic panic scam! Electricity boards NEVER disconnect supply with an urgent 15-minute SMS threatening you to send money to a personal UPI ID.",
            expected_action="REJECT_AND_REPORT"
        ),
        PracticeScenario(
            title="Congratulations! ₹25 Lakh KBC Lucky Draw",
            scenario_type="SCAM",
            difficulty="Beginner",
            sender_or_recipient="KBC Lucky Prize Desk",
            vpa="kbc.lottery.headquarters@okaxis",
            amount=499.0,
            message="Pay ₹499 registration fee to release your ₹25 Lakh prize money.",
            hints="Remember the Golden Rule: You NEVER have to pay money to receive legitimate prize money.",
            explanation="Scammers want you to send ₹499 advance fee. Once you pay, they demand more or vanish. Never pay advance fees for prizes.",
            expected_action="REJECT_AND_REPORT"
        ),
        PracticeScenario(
            title="Monthly BP Tablets at Sanjivani Pharmacy",
            scenario_type="SAFE",
            difficulty="Beginner",
            sender_or_recipient="Sanjivani Chemist",
            vpa="sanjivani.meds@okhdfcbank",
            amount=540.0,
            message="Prescription medicine refilled for October",
            hints="Look for the green verified badge and your doctor's prescribed medical shop.",
            explanation="Safe and regular healthcare expense. You can safely proceed with simulated payment.",
            expected_action="APPROVE"
        )
    ]
    db.add_all(scenarios)

    # 5. Realistic Simulated Transaction History
    now = datetime.now(timezone.utc)
    transactions = [
        Transaction(
            user_id=user1.id,
            amount=150.0,
            recipient_name="Gopal Cow Milk Dairy",
            recipient_upi="gopal.dairy@paytm",
            category="Vendor",
            note="Morning Milk Bill",
            status="SUCCESS",
            risk_score=0,
            risk_level="SAFE",
            risk_reasons=json.dumps(["Verified neighborhood dairy vendor"]),
            is_simulated=True,
            timestamp=now - timedelta(days=1, hours=3)
        ),
        Transaction(
            user_id=user1.id,
            amount=650.0,
            recipient_name="Sanjivani Chemist & Pharmacy",
            recipient_upi="sanjivani.meds@okhdfcbank",
            category="Healthcare",
            note="Monthly BP Medicine",
            status="SUCCESS",
            risk_score=0,
            risk_level="SAFE",
            risk_reasons=json.dumps(["Verified family chemist"]),
            is_simulated=True,
            timestamp=now - timedelta(days=3, hours=5)
        ),
        Transaction(
            user_id=user1.id,
            amount=1450.0,
            recipient_name="Electricity Bill Threat Officer",
            recipient_upi="bses.electricity.disconnection@upi",
            category="Utility",
            note="Power cut threat in 10 minutes",
            status="BLOCKED_SCAM",
            risk_score=95,
            risk_level="HIGH_RISK_SCAM",
            risk_reasons=json.dumps([
                "Known Blacklisted Scammer ID",
                "Urgency Panic Trick detected in message",
                "Personal UPI claiming to represent utility board"
            ]),
            is_simulated=True,
            timestamp=now - timedelta(days=4, hours=1)
        )
    ]
    db.add_all(transactions)

    db.commit()
