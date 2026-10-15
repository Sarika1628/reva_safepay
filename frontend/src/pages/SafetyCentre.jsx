import React, { useState } from 'react';
import { 
  ShieldAlert, 
  PhoneCall, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Volume2, 
  BookOpen, 
  Phone, 
  ExternalLink, 
  CheckSquare, 
  Square, 
  RotateCcw, 
  Award, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  Info, 
  Clock 
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function SafetyCentre() {
  const { speak, triggerVisualAlert, t } = useAccessibility();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState('guide'); // 'guide' | 'scams' | 'checklist' | 'helplines' | 'quiz'

  // FAQ accordion state
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [calledHelpline, setCalledHelpline] = useState(null);

  // Checklist state
  const [checkedItems, setCheckedItems] = useState({});

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizFinished, setQuizFinished] = useState(false);

  // 1. Senior-Friendly Digital-Payment Safety Principles
  const safetyRules = [
    {
      id: "pin-rule",
      title: "1. The UPI PIN Rule: Only for Sending Money",
      short: "You ONLY type your UPI PIN to SEND money out. You NEVER type your PIN to receive money, refunds, or prizes.",
      detail: "If someone tells you to enter your PIN to receive a lottery, cashback, or electricity refund, they are trying to steal your savings. Refuse immediately.",
      icon: Lock,
      color: "var(--color-danger)"
    },
    {
      id: "otp-rule",
      title: "2. The OTP Secret Rule: Never Share with Anyone",
      short: "Never read your bank OTP to any caller. No real bank officer will ever ask for your OTP.",
      detail: "One-Time Passwords (OTPs) are the digital keys to your bank account. Real banks and UPI providers never ask you for your OTP over phone, WhatsApp, or SMS.",
      icon: ShieldCheck,
      color: "var(--color-brand)"
    },
    {
      id: "remote-rule",
      title: "3. The Screen-Sharing Rule: Never Install on a Call",
      short: "Never download AnyDesk, TeamViewer, or QuickSupport if an unknown caller tells you to.",
      detail: "These apps allow strangers to view your screen in real time. Scammers use them to see your bank passwords and read OTPs as they arrive.",
      icon: AlertTriangle,
      color: "var(--color-caution)"
    },
    {
      id: "urgency-rule",
      title: "4. The Calmness Rule: Panic is the Scammer's Weapon",
      short: "Government offices and electricity departments never disconnect power on a 15-minute SMS threat.",
      detail: "Scammers create artificial fear to make you rush. Legitimate utility boards send formal written letters printed on your physical bills.",
      icon: Clock,
      color: "#0891b2"
    },
    {
      id: "balance-rule",
      title: "5. The Verification Rule: Always Check Your Real Bank App",
      short: "Screenshots alone cannot prove payment. Always verify your balance directly inside your official bank app.",
      detail: "Anyone can use a free mobile app to generate a fake payment screenshot. Never give goods or confirm money received based on a picture.",
      icon: Info,
      color: "#16a34a"
    }
  ];

  // 2. Common Scams with Short Sentences & Concrete Examples
  const commonScams = [
    {
      title: "1. The '15-Minute Electricity Cut' Threat",
      severity: "CRITICAL DANGER",
      example: "SMS: 'Dear Consumer, Your power will be DISCONNECTED tonight at 9:30 PM due to unpaid bill. Immediately pay ₹1,450 to officer UPI: bses.electricity@upi.'",
      mechanism: "The scammer sends an urgent message to create panic. They ask you to transfer money to a personal mobile number or private UPI address.",
      truth: "Official electricity boards never cut power on 15-minute SMS notices. They send written notices printed on your physical monthly bills.",
      action: "Do NOT pay. Call the official electricity helpline printed on your physical monthly bill."
    },
    {
      title: "2. The 'Enter PIN to Accept Refund' Trick",
      severity: "CRITICAL DANGER",
      example: "Call: 'Sir, I sent ₹3,000 to your Google Pay by mistake. Please open your app, click Accept, and type your UPI PIN to return my money.'",
      mechanism: "The scammer sends a 'Collect Request' or gives you a QR code. When you type your PIN, money leaves YOUR account.",
      truth: "You NEVER need a UPI PIN to receive money or refunds. PIN is only typed to debit your bank account.",
      action: "Hang up immediately. Never enter your PIN for incoming transfers or refunds."
    },
    {
      title: "3. The Fake Bank KYC & AnyDesk App Scam",
      severity: "HIGH DANGER",
      example: "SMS: 'Dear SBI Customer, Your account is BLOCKED due to incomplete PAN KYC. Click link to download QuickSupport.apk to restore access.'",
      mechanism: "The caller pretends to be a bank manager. They ask you to download AnyDesk or QuickSupport from an SMS link so they can 'assist' you.",
      truth: "Banks never ask you to install apps via SMS links. Screen-sharing apps allow fraudsters to view your incoming OTPs and drain accounts.",
      action: "Never install apps on instructions from unknown callers. Visit your local bank branch in person."
    },
    {
      title: "4. The 'Digital Arrest' / Police Video Call Threat",
      severity: "CRITICAL DANGER",
      example: "WhatsApp Video Call: A caller wearing an official police uniform claims an illegal parcel with drugs or passports was found in your name.",
      mechanism: "They threaten immediate arrest and jail. They order you to stay on video in a closed room and transfer your savings to a 'Supreme Court verification account'.",
      truth: "There is NO legal concept of 'Digital Arrest' in Indian law. Police and courts never interrogate citizens over WhatsApp video calls or demand money transfers.",
      action: "Disconnect the call immediately. Dial 1930 and 112 to report police impersonation."
    },
    {
      title: "5. The WhatsApp KBC / Lucky Draw Prize",
      severity: "HIGH RISK",
      example: "WhatsApp Image: A certificate with Amitabh Bachchan's photo claiming your SIM number won ₹25,00,000. It asks for ₹499 GST fee first.",
      mechanism: "The scammer promises a huge lottery. They demand a small 'processing fee', 'GST tax', or 'release fee' via UPI before sending the prize.",
      truth: "You cannot win a lottery you never bought a ticket for. Genuine lotteries never demand advance processing fees from the winner.",
      action: "Delete and block the message. Never pay money to claim a prize."
    },
    {
      title: "6. The Fake Buyer Payment Screenshot",
      severity: "MEDIUM RISK",
      example: "Marketplace / OLX: A stranger buying your furniture sends a picture of a payment slip showing 'Payment Successful: ₹5,000 to you'.",
      mechanism: "They use a fake receipt generator app to create a realistic screenshot. They ask you to dispatch the item immediately before you check your bank.",
      truth: "Screenshots can be edited in seconds. Only the actual credit entry in your official bank or UPI app proves money has arrived.",
      action: "Never trust screenshots alone. Open your official bank app and check your actual account balance."
    }
  ];

  // 3. Suspect Fraud Checklist
  const checklistSteps = [
    {
      id: "step1",
      title: "Step 1: Disconnect and Stop Contact Immediately",
      desc: "Hang up the phone call immediately. Do not click any links in SMS or WhatsApp. Do not send any money, OTP, or passwords."
    },
    {
      id: "step2",
      title: "Step 2: Contact Your Bank or Payment App Promptly",
      desc: "Call your bank's official emergency helpline immediately (the number on the back of your debit card). Request an immediate fraud lock to freeze outgoing transfers and block compromised cards."
    },
    {
      id: "step3",
      title: "Step 3: Dial the 1930 National Cyber Crime Helpline",
      desc: "Dial 1930 (toll-free, 24x7) right away. Reporting within the 120-minute Golden Hour gives authorities the best chance to place a hold on the scammer's bank account."
    },
    {
      id: "step4",
      title: "Step 4: File a Formal Complaint on cybercrime.gov.in",
      desc: "Visit the official Government of India portal (https://cybercrime.gov.in) to register a Citizen Financial Cyber Fraud complaint."
    },
    {
      id: "step5",
      title: "Step 5: Preserve All Evidence for Police",
      desc: "Take clear screenshots of transaction references, UPI IDs, SMS messages, and caller phone numbers. Do not delete chat history."
    },
    {
      id: "step6",
      title: "Step 6: Inform a Trusted Family Member or Caregiver",
      desc: "Talk to your family or a trusted caregiver. Fraudsters use complex psychological tricks to deceive smart people every day; you do not need to feel ashamed."
    }
  ];

  const toggleChecklist = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // 4. Official Indian Cybercrime Reporting Contacts
  const officialHelplines = [
    {
      name: "National Cyber Crime Helpline",
      number: "1930",
      hours: "24x7 Toll-Free",
      org: "Ministry of Home Affairs (I4C) — Indian Cybercrime Coordination Centre",
      url: "https://cybercrime.gov.in",
      urlLabel: "cybercrime.gov.in (Official Portal)",
      desc: "Primary national helpline to report financial cyber fraud and request rapid inter-bank freeze."
    },
    {
      name: "Senior Citizen National Helpline (Elderline)",
      number: "14567",
      hours: "Mon–Sat 8:00 AM – 8:00 PM",
      org: "Ministry of Social Justice and Empowerment, Govt. of India",
      url: "https://socialjustice.gov.in",
      urlLabel: "socialjustice.gov.in",
      desc: "Free dedicated support for older adults facing harassment, digital confusion, or elder abuse."
    },
    {
      name: "NPCI DigiSaathi 24x7 Digital Payments Helpline",
      number: "14431 / 1800 891 3333",
      hours: "24x7 Toll-Free",
      org: "National Payments Corporation of India (NPCI) & Indian Banks",
      url: "https://digisaathi.info",
      urlLabel: "digisaathi.info (NPCI Official)",
      desc: "Guidance on UPI transactions, debit card issues, IMPS, and digital wallet security."
    },
    {
      name: "Reserve Bank of India (RBI) Sachet Portal",
      number: "14440",
      hours: "Business Hours",
      org: "Reserve Bank of India",
      url: "https://sachet.rbi.org.in",
      urlLabel: "sachet.rbi.org.in (RBI Portal)",
      desc: "Official portal to report illegal deposit schemes, fake loan apps, and unauthorized financial entities."
    },
    {
      name: "National Emergency Response Support System",
      number: "112",
      hours: "24x7 Free",
      org: "Ministry of Home Affairs",
      url: "https://112.gov.in",
      urlLabel: "112.gov.in",
      desc: "Unified emergency number for police, medical, and immediate physical distress."
    }
  ];

  const bankHelplines = [
    { bank: "State Bank of India (SBI)", numbers: "1800 1234 / 1800 2100 / 1930" },
    { bank: "HDFC Bank", numbers: "1800 1600 / 1800 2600" },
    { bank: "ICICI Bank", numbers: "1800 1080" },
    { bank: "Axis Bank", numbers: "1800 419 5959" },
    { bank: "Punjab National Bank (PNB)", numbers: "1800 1800 / 1800 2021" }
  ];

  // 5. Interactive Scam Defense Quiz: 6 Senior-Friendly Scenarios
  const quizQuestions = [
    {
      id: 1,
      title: "Scenario 1: Urgent Electricity Disconnection SMS",
      scenario: "You receive an SMS at 7:00 PM saying your electricity will be disconnected tonight in 15 minutes unless you immediately send ₹1,450 to a mobile number on WhatsApp. What should you do?",
      options: [
        { id: "A", text: "Pay ₹1,450 quickly so your lights don't go out in the dark." },
        { id: "B", text: "Call the mobile number in the SMS and share your debit card details." },
        { id: "C", text: "Do not pay. Government electricity boards send formal printed notices on your paper bills and never disconnect power on a 15-minute SMS threat.", isCorrect: true },
        { id: "D", text: "Forward the message to your neighbors to warn them." }
      ],
      explanation: "Correct! Electricity boards NEVER disconnect supply based on an urgent 15-minute SMS demanding money to a personal mobile number. Always check your physical electricity bill or call the verified number printed on it."
    },
    {
      id: 2,
      title: "Scenario 2: 'Enter UPI PIN to Receive Refund'",
      scenario: "A caller says they accidentally sent ₹5,000 to your Google Pay. They tell you: 'Please open your UPI app and type your UPI PIN to accept the refund.' What should you do?",
      options: [
        { id: "A", text: "Type your UPI PIN immediately to receive the ₹5,000." },
        { id: "B", text: "Disconnect the call immediately. You ONLY enter your UPI PIN to SEND money, never to RECEIVE money.", isCorrect: true },
        { id: "C", text: "Give them your bank SMS OTP instead of your PIN." },
        { id: "D", text: "Share your debit card 16-digit number and CVV." }
      ],
      explanation: "Correct! The Golden Rule of UPI is: You ONLY enter your UPI PIN to send money out. You NEVER need a PIN to receive funds. If you type your PIN, money will be deducted from your account."
    },
    {
      id: 3,
      title: "Scenario 3: Bank KYC Suspension & AnyDesk App",
      scenario: "An unknown caller claims your bank account is suspended due to expired KYC. They instruct you to click a link to install 'QuickSupport' or 'AnyDesk' so they can assist you remotely. What should you do?",
      options: [
        { id: "A", text: "Install the app immediately so your bank account stays active." },
        { id: "B", text: "Allow them to view your mobile screen while you open your banking app." },
        { id: "C", text: "Never install screen-sharing apps on instructions from unknown callers. Hang up and visit your local bank branch in person.", isCorrect: true },
        { id: "D", text: "Transfer ₹10 through the app to verify your identity." }
      ],
      explanation: "Correct! Screen-sharing apps like AnyDesk and QuickSupport allow criminals to view your screen in real time, see your bank passwords, and read SMS OTPs. Banks never ask you to install apps via phone calls."
    },
    {
      id: 4,
      title: "Scenario 4: Fake Police 'Digital Arrest' Threat",
      scenario: "A caller in a police uniform on a WhatsApp video call claims an illegal parcel in your name was seized at customs. They say you are under 'Digital Arrest' and must transfer your savings to a clearance account. What should you do?",
      options: [
        { id: "A", text: "Transfer your savings immediately to prove your innocence." },
        { id: "B", text: "Stay on video in a closed room and do not tell your family." },
        { id: "C", text: "Disconnect immediately. Indian law has NO concept of 'Digital Arrest', and police never conduct trials or demand money over WhatsApp video.", isCorrect: true },
        { id: "D", text: "Buy gift cards or cryptocurrency to send the officer." }
      ],
      explanation: "Correct! 'Digital Arrest' is a complete psychological scam. Police and judicial courts in India NEVER conduct arrests or demand money transfers over WhatsApp or Skype video calls. Hang up and dial 1930 / 112."
    },
    {
      id: 5,
      title: "Scenario 5: KBC WhatsApp ₹25 Lakh Lottery",
      scenario: "You receive a colorful WhatsApp message with photos of Amitabh Bachchan and official seals, saying your mobile number won ₹25,00,000 in a lucky draw, but you must pay ₹499 GST fee first. What should you do?",
      options: [
        { id: "A", text: "Pay ₹499 because ₹499 is very small compared to 25 Lakhs." },
        { id: "B", text: "Send your Aadhaar card and bank passbook photos to the manager." },
        { id: "C", text: "Block the sender. You cannot win a lottery you never entered, and genuine prizes never ask for advance fees.", isCorrect: true },
        { id: "D", text: "Forward the message to 10 friends to claim the prize." }
      ],
      explanation: "Correct! This is a classic advance-fee lottery scam. You cannot win a draw you never entered, and genuine prizes never demand advance taxes or processing fees via UPI."
    },
    {
      id: 6,
      title: "Scenario 6: Stranger Sends Payment Screenshot",
      scenario: "Someone buying furniture from you shows you a screenshot on their phone saying 'Payment of ₹4,000 Successful to You', but you have not received an SMS from your bank and your bank balance hasn't increased. What should you do?",
      options: [
        { id: "A", text: "Hand over the furniture because the screenshot has a bank logo on it." },
        { id: "B", text: "Assume bank SMS is delayed and trust their screenshot." },
        { id: "C", text: "Do not hand over the furniture. Screenshots can easily be faked; only trust the actual balance shown inside your own bank app.", isCorrect: true },
        { id: "D", text: "Send them ₹4,000 back in case they made a mistake." }
      ],
      explanation: "Correct! Fraudsters frequently use fake screenshot generator apps that mimic real payment slips. Never release goods or send money based on a picture. Always verify inside your own official bank or UPI app."
    }
  ];

  // Quiz Interaction Handlers
  const handleSelectOption = (optionId) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(optionId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption) {
      triggerVisualAlert('caution', 'Please select an answer first.');
      speak('Please select an answer first.');
      return;
    }

    const currentQ = quizQuestions[currentQuestionIndex];
    const chosen = currentQ.options.find(o => o.id === selectedOption);
    const correct = chosen?.isCorrect || false;

    if (correct) {
      setQuizScore(prev => prev + 1);
      speak(`Correct! ${currentQ.explanation}`);
      triggerVisualAlert('safe', 'Correct answer! ✓');
    } else {
      speak(`Incorrect. ${currentQ.explanation}`);
      triggerVisualAlert('danger', 'Incorrect choice. Review the explanation.');
    }

    setUserAnswers(prev => [
      ...prev,
      {
        questionId: currentQ.id,
        questionTitle: currentQ.title,
        selectedOptionId: selectedOption,
        selectedText: chosen?.text,
        isCorrect: correct,
        explanation: currentQ.explanation
      }
    ]);

    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      speak(`Question ${currentQuestionIndex + 2}: ${quizQuestions[currentQuestionIndex + 1].scenario}`);
    } else {
      setQuizFinished(true);
      const finalScore = quizScore + (quizQuestions[currentQuestionIndex].options.find(o => o.id === selectedOption)?.isCorrect ? 1 : 0);
      speak(`Quiz finished! You scored ${finalScore} out of ${quizQuestions.length}.`);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setQuizScore(0);
    setUserAnswers([]);
    setQuizFinished(false);
    speak('Quiz restarted. Best of luck!');
    triggerVisualAlert('info', 'Quiz restarted');
  };

  const handleSimulateCall = (hl) => {
    setCalledHelpline(hl.number);
    speak(`Simulating call to ${hl.name} at number ${hl.number}. This is a free national helpline.`, true);
    triggerVisualAlert('info', `Connecting to ${hl.name} (${hl.number})`);
  };

  return (
    <div className="safety-centre-page" style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="card-header" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#eff6ff', color: '#1d4ed8', padding: '0.35rem 0.8rem', borderRadius: '999px', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.5rem' }}>
            <ShieldAlert size={16} />
            <span>Senior Citizen Digital Defense Academy</span>
          </div>
          <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
            {t('safetyCentreTitle', 'Safety Centre & Scam Prevention Academy')}
          </h1>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', margin: 0 }}>
            {t('safetyCentreSubtitle', 'Learn how to spot payment scams, protect your savings, and act immediately if you suspect fraud.')}
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => speak("Welcome to the Safety Centre. Here you can read simple safety guides, review common scams, follow our emergency checklist, and practice with our interactive quiz.", true)}
          style={{ fontSize: 'var(--font-sm)', padding: '0.5rem 0.9rem' }}
        >
          <Volume2 size={16} />
          <span>Read Page Overview</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div 
        role="tablist"
        aria-label="Safety Centre Sections"
        style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          overflowX: 'auto', 
          paddingBottom: '0.5rem', 
          marginBottom: '1.75rem',
          borderBottom: '2px solid var(--border-color)'
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'guide'}
          className={activeTab === 'guide' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => { setActiveTab('guide'); speak("Safety guide opened"); }}
          style={{ fontSize: 'var(--font-sm)', padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}
        >
          <BookOpen size={16} />
          <span>{t('tabSafetyGuide', 'Safety Guide')}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'scams'}
          className={activeTab === 'scams' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => { setActiveTab('scams'); speak("Common scams opened"); }}
          style={{ fontSize: 'var(--font-sm)', padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}
        >
          <AlertTriangle size={16} />
          <span>{t('tabCommonScams', 'Common Scams')}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'checklist'}
          className={activeTab === 'checklist' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => { setActiveTab('checklist'); speak("Fraud checklist opened"); }}
          style={{ fontSize: 'var(--font-sm)', padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}
        >
          <CheckSquare size={16} />
          <span>{t('tabFraudChecklist', 'Suspect Fraud? Checklist')}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'helplines'}
          className={activeTab === 'helplines' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => { setActiveTab('helplines'); speak("Official helplines opened"); }}
          style={{ fontSize: 'var(--font-sm)', padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}
        >
          <PhoneCall size={16} />
          <span>{t('tabHelplines', 'Official Helplines & Links')}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'quiz'}
          className={activeTab === 'quiz' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => { setActiveTab('quiz'); speak("Scam defense quiz opened"); }}
          style={{ fontSize: 'var(--font-sm)', padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}
        >
          <Award size={16} />
          <span>{t('tabQuiz', 'Scam Defense Quiz')}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SENIOR-FRIENDLY DIGITAL PAYMENT SAFETY GUIDE */}
      {/* ========================================================================= */}
      {activeTab === 'guide' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Introduction Card */}
          <div className="card" style={{ background: '#f8fafc', borderLeft: '6px solid var(--color-brand)', margin: 0, padding: '1.5rem' }}>
            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--color-brand)', marginBottom: '0.5rem' }}>
              The 5 Golden Rules of Safe Digital Payments
            </h2>
            <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Digital payments on UPI and Google Pay are convenient and fast. But scammers try to confuse or frighten older adults. Follow these 5 simple, unbreakable rules to keep your bank savings 100% safe.
            </p>
          </div>

          {/* 5 Rules Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {safetyRules.map((rule) => {
              const IconComp = rule.icon;
              return (
                <div 
                  key={rule.id} 
                  className="card" 
                  style={{ 
                    margin: 0, 
                    borderLeft: `6px solid ${rule.color}`,
                    padding: '1.25rem 1.5rem',
                    background: 'var(--bg-secondary)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ background: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: rule.color }}>
                        <IconComp size={22} />
                      </div>
                      <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, margin: 0 }}>
                        {rule.title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => speak(`${rule.title}. ${rule.short}. ${rule.detail}`, true)}
                      style={{ fontSize: 'var(--font-sm)', padding: '0.35rem 0.75rem' }}
                      title="Listen to this rule"
                    >
                      <Volume2 size={16} />
                      <span>Read Rule</span>
                    </button>
                  </div>

                  <p style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    👉 {rule.short}
                  </p>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {rule.detail}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Quick FAQ Accordion */}
          <div className="card" style={{ marginTop: '0.5rem' }}>
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: '1rem' }}>
              Frequently Asked Safety Questions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                {
                  q: "Do I ever need to type my UPI PIN to receive money or get a refund?",
                  a: "NO. Never. You only enter your UPI PIN when you want money to leave your account. To receive money, someone just needs your UPI ID or phone number. Anyone telling you to enter your PIN to get money is a thief."
                },
                {
                  q: "What should I do if an unknown caller says my bank account will be blocked today?",
                  a: "Disconnect the call immediately. Scammers create panic to prevent you from thinking clearly. Real banks never block accounts with an urgent telephone threat. Visit your local branch or call the number on your passbook."
                },
                {
                  q: "Is it safe to click links received in SMS messages?",
                  a: "NO. Do not click links in SMS or WhatsApp from unknown senders. These links often download dangerous software (APK files) that read your passwords and SMS messages."
                }
              ].map((faq, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    background: selectedFaq === idx ? 'var(--color-brand-light)' : 'var(--bg-secondary)',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    const next = selectedFaq === idx ? null : idx;
                    setSelectedFaq(next);
                    if (next !== null) speak(`Question: ${faq.q}. Answer: ${faq.a}`, true);
                  }}
                >
                  <strong style={{ fontSize: 'var(--font-md)', color: 'var(--color-brand)', display: 'block' }}>
                    Q: {faq.q}
                  </strong>
                  {selectedFaq === idx && (
                    <p style={{ marginTop: '0.5rem', fontSize: 'var(--font-md)', color: 'var(--text-primary)', lineHeight: 1.6, margin: '0.5rem 0 0 0' }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMMON SCAMS EXPLAINED WITH SHORT SENTENCES & EXAMPLES */}
      {/* ========================================================================= */}
      {activeTab === 'scams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ background: '#fff7ed', borderLeft: '6px solid var(--color-caution)', margin: 0, padding: '1.25rem' }}>
            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: '#c2410c', marginBottom: '0.35rem' }}>
              Common Scams Explained Simply
            </h2>
            <p style={{ fontSize: 'var(--font-md)', color: '#9a3412', margin: 0 }}>
              Scammers rely on predictable tricks. Learn these real-world examples so you can recognize them instantly.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {commonScams.map((scam, i) => (
              <div 
                key={i} 
                className="card" 
                style={{ 
                  margin: 0, 
                  borderLeft: scam.severity.includes('CRITICAL') ? '6px solid var(--color-danger)' : '6px solid var(--color-caution)',
                  padding: '1.5rem',
                  background: 'var(--bg-secondary)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, margin: 0 }}>
                    {scam.title}
                  </h3>
                  <span 
                    style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 800, 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: 'var(--radius-full)',
                      background: scam.severity.includes('CRITICAL') ? 'var(--color-danger-bg)' : 'var(--color-caution-bg)',
                      color: scam.severity.includes('CRITICAL') ? 'var(--color-danger)' : 'var(--color-caution)'
                    }}
                  >
                    {scam.severity}
                  </span>
                </div>

                {/* Example Message Box */}
                <div style={{ background: 'var(--bg-tertiary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)', marginBottom: '0.85rem', fontFamily: 'monospace', fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
                  <strong>Example:</strong> {scam.example}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem', marginBottom: '0.85rem', fontSize: 'var(--font-sm)' }}>
                  <div>
                    <strong style={{ color: 'var(--color-danger)', display: 'block', marginBottom: '0.2rem' }}>
                      The Trap:
                    </strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{scam.mechanism}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-safe)', display: 'block', marginBottom: '0.2rem' }}>
                      The Reality:
                    </strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{scam.truth}</span>
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: 'var(--font-sm)', color: '#166534', fontWeight: 700 }}>
                    🛡️ Safe Action: {scam.action}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => speak(`${scam.title}. Example: ${scam.example}. Safe Action: ${scam.action}`, true)}
                    style={{ fontSize: 'var(--font-sm)', padding: '0.3rem 0.6rem' }}
                  >
                    <Volume2 size={14} />
                    <span>Read Aloud</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CHECKLIST FOR SOMEONE WHO SUSPECTS FRAUD */}
      {/* ========================================================================= */}
      {activeTab === 'checklist' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Critical Prompt Bank Contact Banner */}
          <div className="card" style={{ background: '#fef2f2', borderLeft: '6px solid var(--color-danger)', padding: '1.5rem', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <PhoneCall size={30} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--color-danger)', margin: '0 0 0.35rem 0' }}>
                  {t('promptBankContactTitle', 'Contact Your Bank or Payment App Promptly')}
                </h2>
                <p style={{ fontSize: 'var(--font-md)', color: '#991b1b', margin: '0 0 0.5rem 0', lineHeight: 1.6 }}>
                  {t('promptBankContactDesc', 'The first 1 to 2 hours are the Golden Hour. Call your bank immediately using the verified number on the back of your debit card so they can place an inter-bank stop-payment hold on the recipient account.')}
                </p>
                <div style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #fecaca', fontSize: 'var(--font-sm)', color: '#7f1d1d' }}>
                  <strong>How to find your bank's real number:</strong> Look at the physical back of your plastic ATM/debit card, or check your official printed account passbook. Never search Google for "bank customer care numbers", as fraudsters create fake Google search listings!
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Checklist */}
          <div className="card" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
                  Immediate Action Checklist (Click to Mark Done)
                </h3>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                  Completed {Object.values(checkedItems).filter(Boolean).length} of {checklistSteps.length} steps
                </span>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCheckedItems({})}
                style={{ fontSize: 'var(--font-sm)' }}
              >
                <RotateCcw size={14} />
                <span>Reset Checklist</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {checklistSteps.map((step) => {
                const isChecked = Boolean(checkedItems[step.id]);
                return (
                  <div
                    key={step.id}
                    onClick={() => toggleChecklist(step.id)}
                    style={{
                      border: `2px solid ${isChecked ? 'var(--color-safe)' : 'var(--border-color)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem 1.25rem',
                      background: isChecked ? '#f0fdf4' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem',
                      transition: 'all 0.15s ease'
                    }}
                    role="checkbox"
                    aria-checked={isChecked}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleChecklist(step.id); } }}
                  >
                    <div style={{ marginTop: '2px', color: isChecked ? 'var(--color-safe)' : 'var(--text-muted)' }}>
                      {isChecked ? <CheckSquare size={22} /> : <Square size={22} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: 'var(--font-md)', color: isChecked ? '#166534' : 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>
                        {step.title}
                      </strong>
                      <p style={{ fontSize: 'var(--font-sm)', color: isChecked ? '#14532d' : 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {step.desc}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(`${step.title}. ${step.desc}`, true);
                      }}
                      style={{ padding: '0.35rem 0.6rem', fontSize: 'var(--font-sm)' }}
                      title="Read step aloud"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Honest No-Recovery Guarantee Warning */}
          <div className="card" style={{ background: '#fffbeb', borderLeft: '6px solid var(--color-caution)', padding: '1.25rem', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <AlertTriangle size={26} color="var(--color-caution)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: 'var(--font-md)', color: '#b45309', display: 'block', marginBottom: '0.3rem' }}>
                  Important Truth: Stolen Money Recovery is Never Guaranteed
                </strong>
                <p style={{ fontSize: 'var(--font-sm)', color: '#92400e', margin: 0, lineHeight: 1.6 }}>
                  {t('noRecoveryGuarantee', 'Important Notice: While reporting immediately to your bank and 1930 gives the best chance to freeze stolen funds, recovery of lost money is NEVER guaranteed. Cyber criminals move funds quickly through multiple mule accounts. The strongest defense is always prevention.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ACCURATE OFFICIAL INDIAN CYBERCRIME HELPLINES & CONTACTS */}
      {/* ========================================================================= */}
      {activeTab === 'helplines' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ background: '#eff6ff', borderLeft: '6px solid var(--color-brand)', margin: 0, padding: '1.5rem' }}>
            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--color-brand)', marginBottom: '0.35rem' }}>
              Official Indian Cybercrime Helplines & Portals
            </h2>
            <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              All telephone numbers and web links below are verified official public services run by the Government of India, the Reserve Bank of India (RBI), and the National Payments Corporation of India (NPCI).
            </p>
          </div>

          {/* Official Helplines Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {officialHelplines.map((hl, idx) => (
              <div 
                key={idx} 
                className="card" 
                style={{ 
                  margin: 0, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  padding: '1.25rem'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    {hl.org}
                  </span>
                  <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, margin: '0.2rem 0' }}>
                    {hl.name}
                  </h3>
                  <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--color-danger)', margin: '0.4rem 0' }}>
                    ☎ {hl.number}
                  </div>
                  <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-safe)', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                    ⏰ {hl.hours}
                  </span>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: '0 0 0.85rem 0' }}>
                    {hl.desc}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <a
                    href={hl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ fontSize: 'var(--font-sm)', justifyContent: 'center', textDecoration: 'none' }}
                  >
                    <span>Visit {hl.urlLabel}</span>
                    <ExternalLink size={14} />
                  </a>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleSimulateCall(hl)}
                    style={{ fontSize: 'var(--font-sm)', justifyContent: 'center' }}
                  >
                    <Phone size={16} />
                    <span>{calledHelpline === hl.number ? `Calling ${hl.number}...` : `Dial ${hl.number}`}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Major Bank Emergency Numbers */}
          <div className="card" style={{ margin: 0 }}>
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: '0.5rem' }}>
              Official Bank Fraud Emergency Numbers (India)
            </h3>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Always check the back of your physical ATM card first. Here are the official verified 24x7 customer desks:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {bankHelplines.map((b, idx) => (
                <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--color-brand)', display: 'block' }}>
                    {b.bank}
                  </strong>
                  <span style={{ fontSize: 'var(--font-md)', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginTop: '0.2rem' }}>
                    ☎ {b.numbers}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SCAM DEFENSE QUIZ (6 MULTIPLE CHOICE SCENARIOS) */}
      {/* ========================================================================= */}
      {activeTab === 'quiz' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quiz Header & Progress */}
          <div className="card" style={{ background: '#f8fafc', borderLeft: '6px solid var(--color-brand)', padding: '1.25rem 1.5rem', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--color-brand)', margin: '0 0 0.25rem 0' }}>
                  {t('quizTitle', 'Interactive Scam Defense Quiz')}
                </h2>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                  Practice identifying real scam scenarios in a 100% safe educational environment.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: 'var(--font-md)', fontWeight: 800, color: 'var(--color-brand)' }}>
                  Question {currentQuestionIndex + 1} of {quizQuestions.length}
                </span>
                <span style={{ background: 'var(--bg-tertiary)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-sm)', fontWeight: 700 }}>
                  Score: {quizScore}
                </span>
              </div>
            </div>
          </div>

          {!quizFinished ? (
            /* Active Question Card */
            <div className="card" style={{ margin: 0, padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'var(--color-brand)', margin: 0 }}>
                  {quizQuestions[currentQuestionIndex].title}
                </h3>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => speak(`${quizQuestions[currentQuestionIndex].title}. Scenario: ${quizQuestions[currentQuestionIndex].scenario}`, true)}
                  style={{ fontSize: 'var(--font-sm)', padding: '0.35rem 0.7rem' }}
                  title="Read question aloud"
                >
                  <Volume2 size={16} />
                  <span>Read Question</span>
                </button>
              </div>

              {/* Scenario Context */}
              <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', fontSize: 'var(--font-lg)', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                {quizQuestions[currentQuestionIndex].scenario}
              </div>

              {/* Multiple Choice Options */}
              <div 
                role="radiogroup" 
                aria-label="Quiz Answer Options"
                style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}
              >
                {quizQuestions[currentQuestionIndex].options.map((opt) => {
                  const isSelected = selectedOption === opt.id;
                  let borderCol = 'var(--border-color)';
                  let bgCol = 'var(--bg-secondary)';

                  if (isAnswerSubmitted) {
                    if (opt.isCorrect) {
                      borderCol = 'var(--color-safe)';
                      bgCol = '#f0fdf4';
                    } else if (isSelected && !opt.isCorrect) {
                      borderCol = 'var(--color-danger)';
                      bgCol = '#fef2f2';
                    }
                  } else if (isSelected) {
                    borderCol = 'var(--color-brand)';
                    bgCol = 'var(--bg-tertiary)';
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={isAnswerSubmitted}
                      onClick={() => handleSelectOption(opt.id)}
                      style={{
                        textAlign: 'left',
                        padding: '1.1rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${borderCol}`,
                        background: bgCol,
                        cursor: isAnswerSubmitted ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        fontSize: 'var(--font-md)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span 
                        style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '50%', 
                          background: isSelected ? 'var(--color-brand)' : 'var(--bg-tertiary)',
                          color: isSelected ? '#ffffff' : 'var(--text-primary)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: 800,
                          fontSize: 'var(--font-sm)',
                          flexShrink: 0
                        }}
                      >
                        {opt.id}
                      </span>
                      <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: isSelected ? 700 : 500 }}>
                        {opt.text}
                      </span>
                      {isAnswerSubmitted && opt.isCorrect && (
                        <CheckCircle2 size={22} color="var(--color-safe)" style={{ flexShrink: 0 }} />
                      )}
                      {isAnswerSubmitted && isSelected && !opt.isCorrect && (
                        <XCircle size={22} color="var(--color-danger)" style={{ flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Action Bar */}
              {isAnswerSubmitted ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div 
                    style={{ 
                      padding: '1.25rem', 
                      borderRadius: 'var(--radius-md)',
                      background: quizQuestions[currentQuestionIndex].options.find(o => o.id === selectedOption)?.isCorrect ? '#f0fdf4' : '#fef2f2',
                      border: `2px solid ${quizQuestions[currentQuestionIndex].options.find(o => o.id === selectedOption)?.isCorrect ? 'var(--color-safe)' : 'var(--color-danger)'}`
                    }}
                  >
                    <strong style={{ fontSize: 'var(--font-md)', color: quizQuestions[currentQuestionIndex].options.find(o => o.id === selectedOption)?.isCorrect ? '#166534' : '#991b1b', display: 'block', marginBottom: '0.35rem' }}>
                      {quizQuestions[currentQuestionIndex].options.find(o => o.id === selectedOption)?.isCorrect ? '✓ Correct Decision!' : '⚠️ Caution Needed!'}
                    </strong>
                    <p style={{ margin: 0, fontSize: 'var(--font-md)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {quizQuestions[currentQuestionIndex].explanation}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleNextQuestion}
                      style={{ fontSize: 'var(--font-md)', padding: '0.75rem 1.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <span>{currentQuestionIndex < quizQuestions.length - 1 ? 'Next Scenario' : 'View Final Score'}</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                    Choose the safest action, then tap Submit.
                  </span>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!selectedOption}
                    onClick={handleSubmitAnswer}
                    style={{ fontSize: 'var(--font-md)', padding: '0.75rem 1.75rem' }}
                  >
                    Submit Answer
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Quiz Completed Summary Card */
            <div className="card" style={{ margin: 0, padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: quizScore >= 5 ? '#f0fdf4' : '#eff6ff', color: quizScore >= 5 ? 'var(--color-safe)' : 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                <Award size={40} />
              </div>

              <h3 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: '0.4rem' }}>
                Quiz Completed!
              </h3>
              <p style={{ fontSize: 'var(--font-lg)', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                You scored <strong>{quizScore} out of {quizQuestions.length}</strong> ({(quizScore / quizQuestions.length * 100).toFixed(0)}%)
              </p>

              <div style={{ display: 'inline-block', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)', background: quizScore >= 5 ? 'var(--color-safe-bg)' : 'var(--color-caution-bg)', color: quizScore >= 5 ? 'var(--color-safe)' : 'var(--color-caution)', fontWeight: 800, fontSize: 'var(--font-md)', marginBottom: '1.75rem', border: '1px solid currentColor' }}>
                {quizScore === 6 && "🏆 Perfect 6/6! CyberCare Shield Master"}
                {quizScore >= 4 && quizScore < 6 && "🌟 Well Done! High Scam Awareness"}
                {quizScore < 4 && "💡 Keep Practicing — Safety is a Habit!"}
              </div>

              {/* Review of all 6 Questions */}
              <div style={{ textAlign: 'left', marginTop: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <h4 style={{ fontSize: 'var(--font-lg)', fontWeight: 800 }}>
                  Detailed Review of All Scenarios:
                </h4>
                {quizQuestions.map((q, idx) => {
                  const ans = userAnswers[idx];
                  return (
                    <div 
                      key={q.id}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-secondary)',
                        border: `1px solid ${ans?.isCorrect ? 'var(--color-safe)' : 'var(--color-danger)'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--color-brand)' }}>
                          {idx + 1}. {q.title}
                        </strong>
                        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: ans?.isCorrect ? 'var(--color-safe)' : 'var(--color-danger)' }}>
                          {ans?.isCorrect ? '✓ Correct' : '✗ Review'}
                        </span>
                      </div>
                      <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: '0 0 0.35rem 0' }}>
                        {q.scenario}
                      </p>
                      <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>
                        💡 Key Lesson: {q.explanation}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={handleRestartQuiz}
                style={{ fontSize: 'var(--font-md)', padding: '0.8rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
              >
                <RotateCcw size={18} />
                <span>Restart Quiz & Practice Again</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
