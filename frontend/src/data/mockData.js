// Synthetic demo data for EasyPay & SafePay
// STRICT DISCLAIMER: All data, account numbers, and VPAs are synthetic and simulated.

export const MOCK_USERS = [
  {
    id: 1,
    name: "Ramesh Uncle",
    persona: "Senior Citizen (Age 72)",
    bio: "Retired high-school teacher. Prefers large buttons, slow reassurance, and voice guidance.",
    balance: 18500.0,
    phone: "+91 98450 11223",
    emergency_contact_name: "Pooja (Daughter)",
    emergency_contact_phone: "+91 99001 99887",
    is_frozen: false,
    preferred_font_size: "large",
    high_contrast: false,
    voice_guidance: true,
    slow_mode: true
  },
  {
    id: 2,
    name: "Lakshmi Devi",
    persona: "Vision Assist Mode (Age 68)",
    bio: "Prefers high-contrast text and audio readouts for receipts and security warnings.",
    balance: 12400.0,
    phone: "+91 98860 33445",
    emergency_contact_name: "Arjun (Son)",
    emergency_contact_phone: "+91 98440 22331",
    is_frozen: false,
    preferred_font_size: "xlarge",
    high_contrast: true,
    voice_guidance: true,
    slow_mode: true
  },
  {
    id: 3,
    name: "Aarav",
    persona: "Deaf & Non-speaking Mode (Age 23)",
    bio: "Visual-first user. Relies on color-coded safety badges, visual flashes, and quick vendor cards.",
    balance: 9200.0,
    phone: "+91 97410 55667",
    emergency_contact_name: "Neha (Sister)",
    emergency_contact_phone: "+91 97400 44556",
    is_frozen: false,
    preferred_font_size: "standard",
    high_contrast: false,
    voice_guidance: false,
    slow_mode: false
  }
];

export const MOCK_CONTACTS = [
  {
    id: 1,
    user_id: 1,
    name: "Pooja (Daughter)",
    upi_id: "pooja.sharma@okaxis",
    phone: "+91 99001 99887",
    relationship: "Daughter",
    category: "Family",
    is_verified: true,
    quick_amount: 2000.0,
    quick_phrase: "Sending monthly allowance to daughter Pooja with love",
    safety_rating: "VERIFIED_SAFE"
  },
  {
    id: 2,
    user_id: 1,
    name: "Gopal Cow Milk Dairy",
    upi_id: "gopal.dairy@paytm",
    phone: "+91 98451 88776",
    relationship: "Milk Vendor",
    category: "Vendor",
    is_verified: true,
    quick_amount: 150.0,
    quick_phrase: "Payment for today's morning cow milk delivery",
    safety_rating: "VERIFIED_SAFE"
  },
  {
    id: 3,
    user_id: 1,
    name: "Sanjivani Chemist & Pharmacy",
    upi_id: "sanjivani.meds@okhdfcbank",
    phone: "+91 94480 33221",
    relationship: "Pharmacist",
    category: "Healthcare",
    is_verified: true,
    quick_amount: 650.0,
    quick_phrase: "Paying for prescription BP and sugar medicines",
    safety_rating: "VERIFIED_SAFE"
  },
  {
    id: 4,
    user_id: 1,
    name: "Raju Auto Rickshaw",
    upi_id: "raju.auto@icici",
    phone: "+91 98800 77665",
    relationship: "Trusted Driver",
    category: "Vendor",
    is_verified: true,
    quick_amount: 80.0,
    quick_phrase: "Paying auto rickshaw fare to temple and park",
    safety_rating: "VERIFIED_SAFE"
  },
  {
    id: 5,
    user_id: 1,
    name: "Dr. Kulkarni Clinic",
    upi_id: "dr.kulkarni@sbi",
    phone: "+91 98440 11990",
    relationship: "Family Doctor",
    category: "Healthcare",
    is_verified: true,
    quick_amount: 400.0,
    quick_phrase: "Paying doctor consultation and checkup fee",
    safety_rating: "VERIFIED_SAFE"
  },
  {
    id: 6,
    user_id: 1,
    name: "Sharma Grocery Store",
    upi_id: "sharma.grocery@upi",
    phone: "+91 98452 33445",
    relationship: "Kirana Store",
    category: "Groceries",
    is_verified: true,
    quick_amount: 350.0,
    quick_phrase: "Paying for rice, dal, and cooking oil",
    safety_rating: "VERIFIED_SAFE"
  }
];

export const MOCK_TRANSACTIONS = [
  {
    id: 101,
    amount: 150.0,
    recipient_name: "Gopal Cow Milk Dairy",
    recipient_upi: "gopal.dairy@paytm",
    category: "Vendor",
    note: "Daily Cow Milk Bill",
    status: "SUCCESS",
    risk_score: 0,
    risk_level: "SAFE",
    risk_reasons: "Verified trusted neighborhood vendor",
    is_simulated: true,
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString()
  },
  {
    id: 102,
    amount: 650.0,
    recipient_name: "Sanjivani Chemist & Pharmacy",
    recipient_upi: "sanjivani.meds@okhdfcbank",
    category: "Healthcare",
    note: "Monthly BP & Diabetes Tablets",
    status: "SUCCESS",
    risk_score: 0,
    risk_level: "SAFE",
    risk_reasons: "Verified family medical shop",
    is_simulated: true,
    timestamp: new Date(Date.now() - 3 * 24 * 3600000).toISOString()
  },
  {
    id: 103,
    amount: 1450.0,
    recipient_name: "Electricity Power Disconnection Officer",
    recipient_upi: "bses.electricity.disconnection@upi",
    category: "Utilities",
    note: "Urgent power cut in 15 minutes unless paid",
    status: "BLOCKED_SCAM",
    risk_score: 95,
    risk_level: "HIGH_RISK_SCAM",
    risk_reasons: "Urgency Panic Trick & Blacklisted Scammer VPA",
    is_simulated: true,
    timestamp: new Date(Date.now() - 4 * 24 * 3600000).toISOString()
  },
  {
    id: 104,
    amount: 2000.0,
    recipient_name: "Pooja (Daughter)",
    recipient_upi: "pooja.sharma@okaxis",
    category: "Family",
    note: "Festival blessings and pocket allowance",
    status: "SUCCESS",
    risk_score: 0,
    risk_level: "SAFE",
    risk_reasons: "Verified daughter contact",
    is_simulated: true,
    timestamp: new Date(Date.now() - 6 * 24 * 3600000).toISOString()
  },
  {
    id: 105,
    amount: 499.0,
    recipient_name: "KBC Lucky Prize Processing Desk",
    recipient_upi: "kbc.lottery.headquarters@okaxis",
    category: "Lottery",
    note: "Pay GST tax to release ₹25 Lakh reward",
    status: "BLOCKED_SCAM",
    risk_score: 92,
    risk_level: "HIGH_RISK_SCAM",
    risk_reasons: "Lottery Advance Fee Scam & Suspicious Prize Keyword",
    is_simulated: true,
    timestamp: new Date(Date.now() - 8 * 24 * 3600000).toISOString()
  },
  {
    id: 106,
    amount: 80.0,
    recipient_name: "Raju Auto Rickshaw",
    recipient_upi: "raju.auto@icici",
    category: "Vendor",
    note: "Auto fare to community hall",
    status: "SUCCESS",
    risk_score: 0,
    risk_level: "SAFE",
    risk_reasons: "Verified local driver",
    is_simulated: true,
    timestamp: new Date(Date.now() - 10 * 24 * 3600000).toISOString()
  }
];

export const MOCK_SPENDING_INSIGHTS = {
  current_month_total: 2880.0,
  last_month_total: 3250.0,
  budget_limit: 10000.0,
  scam_money_saved: 1949.0, // Prevented by SafePay
  categories: [
    { name: "Family & Loved Ones", amount: 2000.0, percentage: 69, color: "#2563eb", icon: "Users" },
    { name: "Healthcare & Pharmacy", amount: 650.0, percentage: 23, color: "#059669", icon: "Pill" },
    { name: "Daily Milk & Groceries", amount: 150.0, percentage: 5, color: "#d97706", icon: "Coffee" },
    { name: "Local Transport", amount: 80.0, percentage: 3, color: "#7c3aed", icon: "Truck" }
  ]
};

export const MOCK_SCAM_SCREENSHOTS = [
  {
    id: "scam-1",
    title: "Fake Electricity Disconnection SMS",
    image_label: "SMS from +91-9123456789",
    category: "Urgency Threat",
    sender: "MD-POWER-URGENT",
    content: "Dear Consumer, Your electricity power will be DISCONNECTED tonight at 9:30 PM from electricity office because your previous month bill was not updated. Please immediately contact our power officer at 9123456789 or pay bill here: bses.electricity.disconnection@upi",
    flags: [
      { rule: "Panic Urgency", detail: "Scammers create artificial fear of immediate darkness." },
      { rule: "Personal UPI ID", detail: "Utility boards never collect payments into personal VPAs." }
    ],
    risk_score: 96,
    advice: "Do NOT pay. Electricity boards give formal written notices on official paper bills."
  },
  {
    id: "scam-2",
    title: "WhatsApp ₹25 Lakh KBC Lottery Certificate",
    image_label: "WhatsApp Image with Fake Amitabh Bachchan Seal",
    category: "Lottery Advance Fee",
    sender: "KBC Head Office WhatsApp",
    content: "CONGRATULATIONS! Your mobile number has won ₹25,00,000 in KBC All-India Lucky Draw. To credit funds to your SBI account, transfer registration fee ₹499 to manager UPI: kbc.lottery.headquarters@okaxis",
    flags: [
      { rule: "Advance Fee Scam", detail: "Genuine prizes never ask the winner to pay advance processing fees." },
      { rule: "Unsolicited Lucky Draw", detail: "You cannot win a lottery you never bought a ticket for." }
    ],
    risk_score: 94,
    advice: "Block this contact immediately. Never pay money to receive a prize."
  },
  {
    id: "scam-3",
    title: "Fake Bank KYC Suspension Notice",
    image_label: "SMS with dangerous link to install APK",
    category: "Remote Access / APK Malware",
    sender: "VM-SBIYONO",
    content: "Dear Customer, Your SBI account is SUSPENDED due to incomplete PAN KYC. Click link to download QuickSupport.apk and send ₹10 to reactivate your internet banking immediately.",
    flags: [
      { rule: "APK File Link", detail: "Banks never ask customers to download .apk files via SMS." },
      { rule: "Screen Sharing Threat", detail: "QuickSupport lets criminals see your screen and read your OTPs." }
    ],
    risk_score: 98,
    advice: "Never install apps from SMS links. Visit your local bank branch in person."
  },
  {
    id: "scam-4",
    title: "Reverse PIN Trap QR Code",
    image_label: "Marketplace / OLX QR Code sent to receive buyer money",
    category: "Reverse PIN Trap",
    sender: "Unknown Buyer on OLX",
    content: "upi://pay?pa=stranger.refund@okaxis&am=5000&tn=Enter%20UPI%20PIN%20to%20receive%20payment%20of%205000",
    flags: [
      { rule: "PIN Required = Money LEAVES", detail: "You only enter UPI PIN to SEND money, never to receive." }
    ],
    risk_score: 95,
    advice: "Entering your PIN sends money out of your account. Refuse to scan."
  }
];

export const MOCK_SAFETY_FAQS = [
  {
    q: "Do I ever need to enter my UPI PIN to receive money or refunds?",
    a: "NEVER. A UPI PIN is strictly for authorizing money leaving your account. If anyone asks you to enter your PIN to receive a prize, lottery, or refund, they are attempting to steal from you."
  },
  {
    q: "Can the electricity department cut off my power with a 15-minute SMS warning?",
    a: "NO. Government electricity providers are required by law to provide written advance notices printed on your bill. They never send panic SMS threats demanding personal UPI transfers."
  },
  {
    q: "What should I do if a caller tells me to download AnyDesk or TeamViewer?",
    a: "Hang up immediately! These are screen-sharing tools that allow scammers to see everything on your screen, including banking passwords and SMS OTPs."
  },
  {
    q: "What is the official National Cyber Crime Helpline in India?",
    a: "Dial 1930 immediately (toll-free, 24x7) if you suspect a financial fraud or click on a suspicious payment link. You can also contact Senior Citizen Elderline at 14567."
  }
];

export const HELPLINE_DIRECTORY = {
  national_cyber_crime: { name: "National Cyber Crime Helpline", number: "1930", hours: "24x7 Free" },
  elderline: { name: "Senior Citizen Elderline", number: "14567", hours: "Mon-Sat 8AM - 8PM" },
  national_emergency: { name: "National Emergency Response", number: "112", hours: "24x7 Free" },
  digisaathi: { name: "NPCI DigiSaathi 24x7 Digital Helpline", number: "14431 / 1800 891 3333", hours: "24x7 Free" }
};
