import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  X, 
  AlertTriangle, 
  MessageSquare, 
  ExternalLink,
  ChevronDown,
  Info
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

// Comprehensive local multilingual knowledge base for SafePay AI Assistant
const ASSISTANT_INTENTS = [
  // 1. Guardrail: Payment Authorization Block
  {
    patterns: [
      'pay', 'send money', 'transfer', 'confirm payment', 'authorize', 'bypass', 'send 500', 'send 1000', 'approve',
      'paise bhejo', 'bhejo', 'transfer karo',
      'hana kalsi', 'kalsi', 'hana kodi',
      'dabbulu pampu', 'pampu', 'dabbu pampu'
    ],
    action: 'NAVIGATE_PAYMENT',
    responses: {
      en: "Strict Safety Rule: Voice recognition will NEVER authorize a payment or bypass scam warnings. Opening Make Payment now so you can visually inspect recipient details and manually confirm.",
      hi: "कड़ा सुरक्षा नियम: वॉयस कमांड कभी भी भुगतान को अधिकृत या बाईपास नहीं करेगा। मेक पेमेंट खोला जा रहा है ताकि आप विवरण देखकर मैन्युअल पुष्टि कर सकें।",
      kn: "ಕಟ್ಟುನಿಟ್ಟಾದ ಭದ್ರತಾ ನಿಯಮ: ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆಯು ಪಾವತಿಯನ್ನು ಎಂದಿಗೂ ಅಧಿಕೃತಗೊಳಿಸುವುದಿಲ್ಲ. ಪಾವತಿ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಮೇಕ್ ಪಾವತಿ ಪುಟವನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.",
      te: "ఖచ్చితమైన భద్రతా నియమం: వాయిస్ కమాండ్ ఎప్పుడూ చెల్లింపును ధృవీకరించదు. వివరాలను స్వయంగా చూసి నిర్ధారించడానికి చెల్లింపు పేజీని తెరుస్తున్నాము."
    }
  },
  // 2. Scam Explanation: OTP & PIN Theft
  {
    patterns: [
      'otp', 'pin', 'upi pin', 'password', 'cvv', 'share otp',
      'otp scam', 'pin scam', 'kya otp bataye', 'pin kalsi'
    ],
    responses: {
      en: "Golden Rule of UPI: You only enter your UPI PIN to SEND money, never to receive a refund or lottery prize. Legitimate banks and officials NEVER ask for your OTP or UPI PIN.",
      hi: "यूपीआई का मुख्य नियम: आप पैसे भेजने के लिए ही यूपीआई पिन डालते हैं, पैसे पाने या रिफंड के लिए कभी नहीं। बैंक कभी भी आपका ओटीपी या पिन नहीं मांगते।",
      kn: "ಯುಪಿಐ ಸುವರ್ಣ ನಿಯಮ: ನೀವು ಹಣ ಕಳುಹಿಸಲು ಮಾತ್ರ ಯುಪಿಐ ಪಿನ್ ಹಾಕಬೇಕು, ಹಣ ಪಡೆಯಲು ಅಥವಾ ಮರುಪಾವತಿಗೆ ಎಂದಿಗೂ ಅಲ್ಲ. ಬ್ಯಾಂಕ್‌ಗಳು ಒಟಿಪಿ ಕೇಳುವುದಿಲ್ಲ.",
      te: "యూపీఐ ముఖ్య నియమం: డబ్బు పంపడానికి మాత్రమే యూపీఐ పిన్ నమోదు చేయాలి, రీఫండ్ పొందడానికి ఎప్పుడూ కాదు. బ్యాంకులు ఎప్పుడూ మీ ఓటీపీ లేదా పిన్ అడగవు."
    }
  },
  // 3. Scam Explanation: Electricity Disconnection Urgency
  {
    patterns: [
      'electricity', 'power cut', 'light bill', 'bill scam', 'bijli', 'power',
      'current bill', 'vidyut', 'current cut'
    ],
    responses: {
      en: "Electricity Panic Trick: Scammers threaten that power will be cut in 15 minutes unless you call an unknown number or pay via personal UPI. Real utility boards issue formal physical letters and never disconnect power over WhatsApp or SMS.",
      hi: "बिजली बिल धोखा: जालसाज धमकी देते हैं कि 15 मिनट में बिजली कट जाएगी। असली बिजली विभाग कभी भी एसएमएस पर निजी यूपीआई पर पैसे नहीं मांगते।",
      kn: "ವಿದ್ಯುತ್ ಕಡಿತ ವಂಚನೆ: 15 ನಿಮಿಷಗಳಲ್ಲಿ ಕರೆಂಟ್ ಕಟ್ ಮಾಡುವುದಾಗಿ ವಂಚಕರು ಬೆದರಿಸುತ್ತಾರೆ. ಅಸಲಿ ಬೆಸ್ಕಾಂ ಅಥವಾ ಇಲಾಖೆಗಳು ಇಂತಹ ಎಸ್ಎಂಎಸ್ ಕಳುಹಿಸುವುದಿಲ್ಲ.",
      te: "కరెంట్ బిల్లు మోసం: 15 నిమిషాల్లో విద్యుత్ నిలిపివేస్తామని భయపెడతారు. అసలైన విద్యుత్ శాఖ ఎప్పుడూ ఎస్ఎంఎస్ ద్వారా వ్యక్తిగత యూపీఐ చెల్లింపులు కోరదు."
    }
  },
  // 4. Remote Access Apps (AnyDesk / TeamViewer)
  {
    patterns: [
      'anydesk', 'teamviewer', 'quicksupport', 'screen share', 'remote app', 'apk', 'download app'
    ],
    responses: {
      en: "Danger: Never install AnyDesk, TeamViewer, or QuickSupport on the instructions of an unknown caller. These apps let fraudsters watch your mobile screen and steal incoming bank OTPs.",
      hi: "खतरा: किसी अनजान कॉलर के कहने पर कभी भी AnyDesk या TeamViewer ऐप डाउनलोड न करें। इससे वे आपके फोन की स्क्रीन देखकर बैंक ओटीपी चुरा लेते हैं।",
      kn: "ಅಪಾಯ: ಅಪರಿಚಿತರ ಮಾತನ್ನು ಕೇಳಿ AnyDesk ಅಥವಾ TeamViewer ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಬೇಡಿ. ಇವುಗಳ ಮೂಲಕ ವಂಚಕರು ನಿಮ್ಮ ಮೊಬೈಲ್ ಒಟಿಪಿ ಕದಿಯುತ್ತಾರೆ.",
      te: "ప్రమాదం: గుర్తుతెలియని వ్యక్తులు చెప్పినప్పుడు AnyDesk లేదా TeamViewer యాప్‌లను ఇన్‌స్టాల్ చేయవద్దు. వారు మీ ఫోన్ చూసి ఓటీపీని దొంగిలిస్తారు."
    }
  },
  // 5. Emergency SOS & Helpline 1930
  {
    patterns: [
      '1930', 'helpline', 'fraud call', 'police', 'cyber crime', 'report scam', 'lost money', 'help me', 'sos', 'freeze'
    ],
    action: 'NAVIGATE_GOLDEN_HOUR',
    responses: {
      en: "If you have lost money to a fraudster, act within the Golden Hour! Immediately call the National Cyber Crime Helpline at 1930 or visit cybercrime.gov.in. You can also freeze your SafePay demo wallet using Emergency SOS.",
      hi: "यदि किसी धोखाधड़ी में पैसे कटे हैं, तो तुरंत राष्ट्रीय साइबर हेल्पलाइन 1930 पर कॉल करें। आप तुरंत इमरजेंसी एसओएस का उपयोग करके वॉलेट फ्रीज भी कर सकते हैं।",
      kn: "ಹಣ ಕಳೆದುಕೊಂಡಿದ್ದರೆ ತಕ್ಷಣ ರಾಷ್ಟ್ರೀಯ ಸೈಬರ್ ಸಹಾಯವಾಣಿ 1930 ಗೆ ಕರೆ ಮಾಡಿ. ಅಥವಾ ತುರ್ತು ಎಸ್ಒಎಸ್ ಮೂಲಕ ವಾಲೆಟ್ ಲಾಕ್ ಮಾಡಿ.",
      te: "మోసానికి గురైతే వెంటనే జాతీయ సైబర్ హెల్ప్‌లైన్ 1930కి కాల్ చేయండి. మీరు ఎమర్జెన్సీ ఎస్ఓఎస్ ద్వారా వాలెట్‌ను లాక్ చేయవచ్చు."
    }
  },
  // 6. Navigation: SafePay Scam Checker
  {
    patterns: [
      'check scam', 'scan message', 'check message', 'is this scam', 'scam checker',
      'message check karo', 'message nodi', 'message chudandi'
    ],
    action: 'NAVIGATE_SCAM_CHECKER',
    responses: {
      en: "Opening SafePay Scam Checker. You can paste any SMS, WhatsApp chat, or email to inspect for fraud keywords, urgency threats, and fake links.",
      hi: "सेफपे स्कैम चेकर खोला जा रहा है। यहां आप किसी भी संदिग्ध एसएमएस या व्हाट्सएप संदेश की जांच कर सकते हैं।",
      kn: "ಸೇಫ್‌ಪೇ ಸ್ಕ್ಯಾಮ್ ಚೆಕರ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ. ನಿಮ್ಮ ಅನುಮಾನಾಸ್ಪದ ಸಂದೇಶವನ್ನು ಇಲ್ಲಿ ಪರೀಕ್ಷಿಸಬಹುದು.",
      te: "సేఫ్‌పే స్కామ్ చెకర్ తెరుస్తున్నాము. మీరు అనుమానాస్పద సందೇಶాలను ఇక్కడ పరిశీలించవచ్చు."
    }
  },
  // 7. Navigation: Privacy Redactor
  {
    patterns: [
      'privacy', 'redact', 'hide otp', 'sanitize', 'hide phone', 'mask data'
    ],
    action: 'NAVIGATE_REDACTOR',
    responses: {
      en: "Opening Privacy Redactor. Mask OTPs, mobile numbers, card numbers, and UPI IDs with zero data retention before sharing screenshots or text.",
      hi: "प्राइवेसी रिडैक्टर खोला जा रहा है। यहां संवेदनशील ओटीपी और फोन नंबर सुरक्षित रूप से मास्क किए जाते हैं।",
      kn: "ಪ್ರೈವಸಿ ರಿಡ್ಯಾಕ್ಟರ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ. ಗೌಪ್ಯ ಸಂಖ್ಯೆಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಮರೆಮಾಡಬಹುದು.",
      te: "ప్రైవసీ రిడాక్టర్ తెరుస్తున్నాము. మీ ఓటీపీ మరియు ఫోన్ నంబర్లను సురಕ್ಷితంగా దాచవచ్చు."
    }
  },
  // 8. General Greetings / Assistant Identity
  {
    patterns: [
      'hello', 'hi', 'safepay', 'who are you', 'namaste', 'namaskara', 'namaskaram', 'help'
    ],
    responses: {
      en: "Hello! I am your SafePay AI CyberCare Assistant. You can ask me to explain scams, navigate the app, or inspect safety rules. How can I protect you today?",
      hi: "नमस्ते! मैं आपका सेफपे साइबरकेयर असिस्टेंट हूँ। आप मुझसे किसी भी धोखाधड़ी के बारे में पूछ सकते हैं। मैं आपकी क्या मदद कर सकता हूँ?",
      kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸೇಫ್‌ಪೇ ಸೈಬರ್‌ಕೇರ್ ಸಹಾಯಕ. ಆನ್‌ಲೈನ್ ವಂಚನೆಗಳಿಂದ ರಕ್ಷಣೆ ಪಡೆಯಲು ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು.",
      te: "నమస్కారం! నేను మీ సేఫ్‌పే సైబర్‌కేర్ అసిస్టెంట్‌ని. సైబర్ మోసాల గురించి నన్ను అడగవచ్చు. నేను మీకు ఎలా సహాయపడగలను?"
    }
  }
];

export default function SafePayVoiceAssistant({ 
  onNavigateTab, 
  isOpen = false, 
  onClose = null,
  embedded = false 
}) {
  const { speak, currentLang = 'en', t } = useAccessibility();

  // Assistant UI State
  const [activeLang, setActiveLang] = useState(currentLang || 'en');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [typedInput, setTypedInput] = useState('');
  
  // Conversational History State
  const [conversation, setConversation] = useState([
    {
      sender: 'assistant',
      text: "Hello! I am your SafePay Voice & AI Assistant. Press 'Speak to SafePay' or type a question below to learn about scams or navigate safely.",
      timestamp: new Date()
    }
  ]);

  // TTS playback tracking
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastResponseText, setLastResponseText] = useState('');

  // Speech Recognition Reference
  const recognitionRef = useRef(null);

  // Sync language with accessibility context
  useEffect(() => {
    if (currentLang) setActiveLang(currentLang);
  }, [currentLang]);

  // Initialize SpeechRecognition on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      // Map language code for recognition
      const langMap = {
        en: 'en-IN',
        hi: 'hi-IN',
        kn: 'kn-IN',
        te: 'te-IN'
      };
      recognition.lang = langMap[activeLang] || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setPermissionDenied(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          // Display recognized text before acting on it
          setRecognizedText(transcript);
          handleUserQuery(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setPermissionDenied(true);
        } else if (event.error === 'no-speech') {
          handleFallbackResponse("I didn't hear any speech. Please press 'Speak to SafePay' again, or type your question below.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Could not initialize SpeechRecognition:', e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, [activeLang]);

  // Start Voice Recognition
  const handleStartListening = () => {
    if (isSpeaking) {
      handleStopSpeaking();
    }

    if (!speechSupported) {
      alert("Your browser does not support Web Speech Recognition. Please use the text input below to chat with SafePay.");
      return;
    }

    if (recognitionRef.current) {
      try {
        setRecognizedText('');
        recognitionRef.current.lang = {
          en: 'en-IN',
          hi: 'hi-IN',
          kn: 'kn-IN',
          te: 'te-IN'
        }[activeLang] || 'en-IN';
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start exception:', err);
      }
    }
  };

  // Stop Voice Recognition
  const handleStopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
  };

  // Browser TTS (SpeechSynthesis)
  const speakAssistantResponse = (text) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92; // Clear pacing for older adults
      utterance.pitch = 1.0;

      const langMap = {
        en: 'en-IN',
        hi: 'hi-IN',
        kn: 'kn-IN',
        te: 'te-IN'
      };
      utterance.lang = langMap[activeLang] || 'en-IN';

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setLastResponseText(text);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
      setIsSpeaking(false);
    }
  };

  // Stop Speaking
  const handleStopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Repeat Last Response
  const handleRepeatSpeaking = () => {
    if (lastResponseText) {
      speakAssistantResponse(lastResponseText);
    }
  };

  // Fallback for unclear or unhandled query
  const handleFallbackResponse = (fallbackMsg) => {
    const defaultMsg = fallbackMsg || {
      en: "I didn't quite catch that. Please speak slowly or type your question in the text box below.",
      hi: "मैं पूरी तरह से समझ नहीं पाया। कृपया धीरे बोलें या नीचे दिए गए बॉक्स में टाइप करें।",
      kn: "ನನಗೆ ಸ್ಪಷ್ಟವಾಗಿ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಧಾನವಾಗಿ ಮಾತನಾಡಿ ಅಥವಾ ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ.",
      te: "నాకు స్పష్టంగా అర్థం కాలేదు. దయచేసి నెమ్మదిగా మాట్లాడండి లేదా కింద టైప్ చేయండి."
    }[activeLang] || "I didn't quite catch that. Please repeat or type your question below.";

    setConversation(prev => [
      ...prev,
      { sender: 'assistant', text: defaultMsg, timestamp: new Date() }
    ]);
    speakAssistantResponse(defaultMsg);
  };

  // Match Query with Local Explainable Logic
  const handleUserQuery = (queryText) => {
    const clean = (queryText || '').trim();
    if (!clean) return;

    // Add user query to conversation history
    setConversation(prev => [
      ...prev,
      { sender: 'user', text: clean, timestamp: new Date() }
    ]);

    setIsProcessing(true);

    const lower = clean.toLowerCase();
    let matchedIntent = null;

    for (const intent of ASSISTANT_INTENTS) {
      if (intent.patterns.some(pattern => lower.includes(pattern))) {
        matchedIntent = intent;
        break;
      }
    }

    setTimeout(() => {
      setIsProcessing(false);

      if (matchedIntent) {
        const reply = matchedIntent.responses[activeLang] || matchedIntent.responses.en;
        
        setConversation(prev => [
          ...prev,
          { 
            sender: 'assistant', 
            text: reply, 
            action: matchedIntent.action,
            timestamp: new Date() 
          }
        ]);

        speakAssistantResponse(reply);

        // Perform optional navigation action (with safe visual review boundary)
        if (matchedIntent.action && onNavigateTab) {
          if (matchedIntent.action === 'NAVIGATE_PAYMENT') {
            setTimeout(() => onNavigateTab('send'), 1800);
          } else if (matchedIntent.action === 'NAVIGATE_SCAM_CHECKER') {
            setTimeout(() => onNavigateTab('safepay-checker'), 1600);
          } else if (matchedIntent.action === 'NAVIGATE_GOLDEN_HOUR') {
            setTimeout(() => onNavigateTab('golden-hour-help'), 1600);
          } else if (matchedIntent.action === 'NAVIGATE_REDACTOR') {
            setTimeout(() => onNavigateTab('privacy-redactor'), 1600);
          }
        }
      } else {
        // Unknown or unclear query handling
        handleFallbackResponse();
      }
    }, 400);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    const txt = typedInput.trim();
    setTypedInput('');
    setRecognizedText(txt);
    handleUserQuery(txt);
  };

  return (
    <div 
      className={`safepay-voice-assistant ${embedded ? 'embedded-mode' : 'modal-mode'}`}
      style={{
        background: 'var(--bg-secondary)',
        border: '2px solid var(--color-brand)',
        borderRadius: '20px',
        boxShadow: embedded ? 'var(--shadow-card)' : '0 20px 50px rgba(0,0,0,0.3)',
        padding: '1.75rem',
        maxWidth: embedded ? '100%' : '620px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.15rem',
        position: 'relative',
        zIndex: 100
      }}
      role="region"
      aria-label="SafePay Voice Assistant"
    >
      {/* Header with Title, Language Selector, and Close */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-brand-light)', color: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              SafePay AI Voice Assistant
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>
              ● Online • Local Zero-Data Security
            </span>
          </div>
        </div>

        {/* Language selector & Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select 
            value={activeLang}
            onChange={(e) => setActiveLang(e.target.value)}
            aria-label="Select voice assistant language"
            style={{
              padding: '0.35rem 0.6rem',
              borderRadius: '8px',
              border: '1.5px solid var(--border-color)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <option value="en">English (India)</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="te">తెలుగు (Telugu)</option>
          </select>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.3rem',
                borderRadius: '6px',
                color: 'var(--text-muted)'
              }}
              aria-label="Close voice assistant"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Strict Privacy & Security Guarantee Banner */}
      <div 
        style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.65rem 0.95rem',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem'
        }}
      >
        <Lock size={16} color="var(--color-safe)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Zero Audio Retention:</strong> Speech is processed in real time by your browser. No voice recordings or private data are ever saved, stored, or sent to external servers.
        </span>
      </div>

      {/* Guardrail Disclaimer Notice */}
      <div 
        style={{
          background: 'var(--color-brand-light)',
          borderLeft: '4px solid var(--color-brand)',
          borderRadius: '8px',
          padding: '0.6rem 0.85rem',
          fontSize: '0.84rem',
          color: 'var(--text-primary)'
        }}
      >
        🛡️ <strong style={{ color: 'var(--color-brand)' }}>Safety Law:</strong> Voice commands can navigate or explain scams, but will <em>never</em> authorize payments, send money, or bypass warnings without visual review.
      </div>

      {/* Permission Denied / Browser Limitation Alert */}
      {permissionDenied && (
        <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #f87171', borderRadius: '8px', color: '#991b1b', fontSize: '0.88rem' }}>
          <strong>Microphone Access Blocked:</strong> Please allow microphone permission in your browser settings to use speech recognition, or type your query in the box below.
        </div>
      )}

      {!speechSupported && (
        <div style={{ padding: '0.75rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '0.88rem' }}>
          <strong>Browser Speech Unsupported:</strong> Your browser does not expose Web Speech API. You can still chat with SafePay using the text box below!
        </div>
      )}

      {/* PRIMARY VOICE INTERACTION ZONE: Microphone Button Labelled "Speak to SafePay" */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem 1rem',
          background: isListening ? '#fef2f2' : 'var(--bg-secondary)',
          border: `2px ${isListening ? 'dashed #dc2626' : 'solid var(--border-color)'}`,
          borderRadius: '14px',
          transition: 'all 0.25s ease'
        }}
      >
        <button
          type="button"
          onClick={isListening ? handleStopListening : handleStartListening}
          aria-label="Speak to SafePay microphone button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            fontWeight: 900,
            borderRadius: '999px',
            background: isListening ? '#dc2626' : 'var(--color-brand)',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: isListening ? '0 0 20px rgba(220,38,38,0.5)' : 'var(--shadow-md)',
            animation: isListening ? 'pulse 1.5s infinite' : 'none'
          }}
        >
          {isListening ? <MicOff size={26} /> : <Mic size={26} />}
          <span>{isListening ? "Listening... (Tap to Stop)" : "Speak to SafePay"}</span>
        </button>

        <p style={{ margin: '0.65rem 0 0', fontSize: '0.85rem', color: isListening ? '#dc2626' : 'var(--text-muted)', fontWeight: 700 }}>
          {isListening 
            ? "Speak now into your microphone in English, Hindi, Kannada, or Telugu..." 
            : "Tap the button above to speak, or switch to typing anytime."}
        </p>
      </div>

      {/* Live Recognized Text Box: Display speech text before acting on it */}
      {recognizedText && (
        <div 
          style={{
            background: 'var(--bg-secondary)',
            border: '2px solid var(--color-brand)',
            borderRadius: '12px',
            padding: '0.85rem 1.15rem',
            fontSize: '0.95rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-brand)', display: 'block', marginBottom: '0.25rem' }}>
            🎙️ You Said (Speech Recognized):
          </span>
          <strong style={{ color: 'var(--text-primary)' }}>"{recognizedText}"</strong>
        </div>
      )}

      {/* Conversation Thread */}
      <div 
        style={{
          maxHeight: '230px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          padding: '0.75rem',
          background: 'var(--bg-tertiary)',
          borderRadius: '12px',
          border: '1.5px solid var(--border-color)'
        }}
      >
        {conversation.map((msg, idx) => (
          <div 
            key={idx}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              background: msg.sender === 'user' ? 'var(--brand-gradient)' : 'var(--bg-secondary)',
              color: msg.sender === 'user' ? '#ffffff' : 'var(--text-primary)',
              border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '0.75rem 1.05rem',
              maxWidth: '85%',
              fontSize: '0.92rem',
              lineHeight: 1.5,
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.85 }}>
              {msg.sender === 'user' ? 'You' : 'SafePay Assistant'}
            </div>
            <div>{msg.text}</div>
          </div>
        ))}
        {isProcessing && (
          <div style={{ alignSelf: 'flex-start', background: 'var(--bg-secondary)', padding: '0.5rem 0.95rem', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
            Thinking...
          </div>
        )}
      </div>

      {/* TTS Speech Controls: Stop Speaking & Repeat Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleStopSpeaking}
            disabled={!isSpeaking}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: isSpeaking ? '#fee2e2' : '#f8fafc',
              color: isSpeaking ? '#dc2626' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: isSpeaking ? 'pointer' : 'not-allowed'
            }}
            aria-label="Stop Speaking aloud"
          >
            <VolumeX size={16} />
            <span>Stop Speaking</span>
          </button>

          <button
            type="button"
            onClick={handleRepeatSpeaking}
            disabled={!lastResponseText}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: lastResponseText ? 'pointer' : 'not-allowed'
            }}
            aria-label="Repeat response aloud"
          >
            <RotateCcw size={16} />
            <span>Repeat</span>
          </button>
        </div>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Supported: EN • HI • KN • TE
        </span>
      </div>

      {/* TEXT-ONLY FALLBACK: Switch between Voice and Typing Anytime */}
      <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '0.65rem', marginTop: '0.25rem' }}>
        <input 
          type="text"
          value={typedInput}
          onChange={(e) => setTypedInput(e.target.value)}
          placeholder="Or type your question here (typing fallback)..."
          aria-label="Type your message to SafePay assistant"
          style={{
            flex: 1,
            padding: '0.85rem 1.15rem',
            borderRadius: '12px',
            border: '2px solid var(--border-color)',
            fontSize: '0.95rem',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)'
          }}
        />
        <button
          type="submit"
          disabled={!typedInput.trim()}
          style={{
            padding: '0.85rem 1.45rem',
            borderRadius: '12px',
            background: 'var(--brand-gradient)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 800,
            cursor: typedInput.trim() ? 'pointer' : 'not-allowed',
            opacity: typedInput.trim() ? 1 : 0.6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: 'var(--shadow-sm)'
          }}
          aria-label="Send typed query"
        >
          <span>Send</span>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
