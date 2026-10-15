"""
SafePay ML Scam Detector - Synthetic Training Dataset

IMPORTANT NOTICE:
This dataset contains purely synthetic, curated sample messages representing common
Indian digital payment communications (legitimate notifications vs. common fraud schemes).
It is created specifically for local prototype demonstration, training, and unit testing.
It does NOT represent real-world national fraud statistics or actual telecom traffic.
"""

from typing import List, Tuple

# Label 0: LEGITIMATE (Routine, non-scam communications)
# Label 1: SCAM (Fraudulent, phishing, extortion, or trap messages)

SYNTHETIC_DATASET: List[Tuple[str, int]] = [
    # --- LEGITIMATE SAMPLES (Label 0) ---
    ("Hi Ramesh uncle, let us meet tomorrow for tea at the park around 5 PM.", 0),
    ("Hi Mom, reaching home by 7 PM tonight for dinner. Please do not worry.", 0),
    ("Dear customer, your monthly milk subscription of Rs 950 is due. Pay via routine UPI if convenient.", 0),
    ("Tuition class notes for chapter 4 have been sent to your email. Monthly fee Rs 1200 can be paid before 10th.", 0),
    ("Your BESCOM electricity bill for September is Rs 640. Due date is Oct 25. View bill at bescom.karnataka.gov.in.", 0),
    ("Salary of Rs 45,000 for September credited to your account. Reference: SAL10294.", 0),
    ("Your account ending 4321 was debited by Rs 150 at Supermarket. Avail balance: Rs 14,200.", 0),
    ("Apartment maintenance of Rs 2500 for October is due by 15th. Account details on society notice board.", 0),
    ("Your appointment with Dr. Sharma is confirmed for Wednesday at 4 PM at City Clinic.", 0),
    ("Your package containing books is out for delivery today with delivery associate Ravi.", 0),
    ("Thank you for ordering on FoodKart. Order #8472 is being prepared by the restaurant.", 0),
    ("Your monthly e-statement for account ending 7890 is available on net banking portal.", 0),
    ("House rent for October received with thanks. Regards, Landlord.", 0),
    ("Your dry cleaning order is ready for pickup at CleanCare laundry.", 0),
    ("Reminder: Book 'Wings of Fire' is due for return at Central Library on Friday.", 0),
    ("Hey Suresh, sharing the recipe for sambar we talked about yesterday. Call me when free.", 0),
    ("Dear patient, your routine dental checkup is scheduled for tomorrow 11 AM.", 0),
    ("Water supply bill of Rs 220 paid successfully. Transaction receipt downloaded.", 0),
    ("Hi Priya, could you send the photos from yesterday's family get-together?", 0),
    ("Your broadband plan renewal is due on 28th. Recharge through official provider app.", 0),
    ("Good morning sir, school bus has arrived at the stop.", 0),
    ("LPG cylinder booking #55231 confirmed. Delivery expected within 2 working days.", 0),
    ("Newspaper bill for this month is Rs 180. Vendor will collect during weekend.", 0),
    ("Meeting link for tomorrow's community welfare meeting has been shared on group.", 0),
    ("Hi dad, booked the train tickets for Diwali vacation. PNR details sent on WhatsApp.", 0),
    ("Gym membership renewal reminder. Please visit front desk before expiry.", 0),
    ("Your lab test reports are ready for download from the official diagnostic portal.", 0),
    ("Car service completed. Total bill Rs 3,450. Vehicle ready for collection.", 0),
    ("Vegetable vendor: Fresh organic greens available today at stall #4.", 0),
    ("Reminder: Your insurance policy premium is due next week. Pay via official insurance website.", 0),
    ("Dear customer, your metro smart card recharge of Rs 200 was successful.", 0),
    ("Hi Anita, please bring the tax documents to office tomorrow for filing.", 0),
    ("Society yoga session tomorrow morning at 6:30 AM in clubhouse.", 0),
    ("Your order for medicines from Pharmacy has been delivered to your doorstep.", 0),
    ("Dear customer, your recurring fixed deposit installment has been processed.", 0),
    ("Happy birthday grandfather! Wishing you good health and joy from all of us.", 0),
    ("Carpool ride confirmed for tomorrow morning 8:30 AM.", 0),
    ("Your electricity meter reading has been recorded. Bill will be generated shortly.", 0),
    ("Plumber appointment booked for kitchen sink repair at 3 PM today.", 0),
    ("Dear member, library weekend book reading club will meet at 10 AM.", 0),

    # --- SCAM SAMPLES (Label 1) ---
    ("Dear consumer, your electricity power will be disconnected tonight at 9:30 PM by electricity officer because your bill was not updated. Call immediately 9876543210", 1),
    ("Congratulations! You have won Rs 25,00,000 in KBC Lucky Draw. To claim your lottery prize money, pay processing fee of Rs 1,500 via UPI.", 1),
    ("Dear SBI customer, your net banking account is blocked due to incomplete KYC. Click http://bit.ly/sbi-kyc-verify to verify and share the 6-digit OTP sent to your phone.", 1),
    ("Customer care: Install AnyDesk app or QuickSupport immediately on your mobile so our officer can assist your refund of Rs 4,500.", 1),
    ("I am sending you Rs 5,000 refund for your returned product. Please scan this QR code and enter your UPI PIN to receive the money in your bank account.", 1),
    ("Your international courier parcel is held at Mumbai airport customs. Pay Rs 2,999 clearance fee to prevent arrest warrant and legal confiscation.", 1),
    ("Earn Rs 3000 to Rs 8000 daily from home just by liking YouTube videos and rating hotels on Telegram. Join t.me/fast_earn now.", 1),
    ("HDFC Card alert: Your credit card reward points worth Rs 9,800 will expire tonight. Click http://tinyurl.com/hdfc-points to redeem cash directly.", 1),
    ("Legal notice: Delhi police cyber cell has issued arrest warrant against your Aadhaar for illegal money laundering courier. Call officer urgently.", 1),
    ("Your Airtel SIM card will be deactivated within 1 hour. Update KYC immediately by calling verification officer at 9811223344.", 1),
    ("Instant loan of Rs 2,00,000 pre-approved at 0% interest! No documents required. Deposit Rs 999 file processing fee immediately.", 1),
    ("Dear taxpayer, your income tax refund of Rs 14,350 has been approved. Submit your bank account and debit card CVV to receive credit.", 1),
    ("Urgent: Your bank account will be frozen today due to PAN card mismatch. Send your 6-digit OTP to bank manager on WhatsApp to keep active.", 1),
    ("Scan this QR code to claim your GooglePay cashback reward of Rs 2,000. Enter your secret UPI MPIN to credit your wallet.", 1),
    ("Technical support alert: Your mobile has 5 dangerous viruses. Download our support APK file immediately to clean your device.", 1),
    ("BSES electricity bill unpaid. Power cut will happen within 15 minutes. Call BSES officer immediately on personal mobile 9988776655.", 1),
    ("You are selected for Amazon lucky shopper prize of iPhone 15 Pro. Pay delivery charge Rs 499 through UPI link to dispatch.", 1),
    ("Emergency hospital fund: Your close relative met with accident in highway. Transfer Rs 10,000 urgently to nurse UPI handle to start surgery.", 1),
    ("Court summons issued: You failed to appear for illegal cyber crime hearing. Pay fine Rs 5,000 immediately or police will arrive.", 1),
    ("Free government laptop scheme approved for your family. Click link and enter your bank account details and debit card PIN to register.", 1),
    ("Pushed payment trick: We mistakenly credited Rs 50,000 to your GPay. Please refund Rs 45,000 immediately to this UPI ID or face police complaint.", 1),
    ("Customer service: To cancel your auto-debit of Rs 9,999, download TeamViewer and share your screen with executive.", 1),
    ("Work from home part-time crypto trading job. Guaranteed 200% profit in 2 hours. Send minimum deposit Rs 2,000 to start trading.", 1),
    ("Dear customer, your credit card is temporarily blocked. Verify your 16-digit card number and 3-digit CVV to unblock instantly.", 1),
    ("PM Kisan Yojana subsidy of Rs 6,000 waiting in your account. Click link and enter UPI PIN to claim government subsidy.", 1),
    ("Electricity board warning: Final notice before power line cut. Contact electricity officer Mr. Verma at 8877665544 right now.", 1),
    ("Lottery winner! Claim your UK National Lottery jackpot of Rs 50 Lakhs. Pay international conversion charge Rs 3,500 now.", 1),
    ("Your SIM card KYC is expired. Services will be terminated today night. Call Jio nodal officer at 9123456789.", 1),
    ("Scan QR code sent on WhatsApp to receive payment for your OLX furniture listing. Enter UPI PIN to confirm receipt of funds.", 1),
    ("Traffic police e-challan notice: You have unpaid fine of Rs 1,000. Click malicious-link.apk to download challan receipt.", 1),
    ("Bank alert: Suspicious login from Nigeria detected. Tell the one-time password OTP received on SMS to verify your identity.", 1),
    ("Exclusive job offer from Tata Motors HR. Salary Rs 60,000 per month. Pay interview registration fee Rs 850 via UPI.", 1),
    ("Your WhatsApp account will be deleted in 12 hours. Send the 6-digit verification code to keep your WhatsApp active.", 1),
    ("RTO vehicle blacklisted: Clear your road tax arrears within 30 minutes to prevent vehicle seizure. Call transport officer.", 1),
    ("Raffle contest congratulations! You won a gold coin. Pay postal shipping fee Rs 250 to release shipment.", 1),
    ("Urgent bank KYC update required immediately. Download our quicksupport app to allow remote verification by officer.", 1),
    ("Telecom department notice: All SIM cards in your name will be blocked in 2 hours. Contact TRAI officer on WhatsApp.", 1),
    ("Congratulations you received an unexpected cashback of Rs 1,500. Enter your UPI PIN to collect money in your bank.", 1),
    ("Customs seized gold parcel in your name. Pay customs duty Rs 7,500 immediately to avoid arrest by CBI.", 1),
    ("Your debit card has expired. Provide card number, expiry date, and CVV to customer care to issue new chip card.", 1),
]
