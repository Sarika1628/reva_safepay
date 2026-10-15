import { 
  MOCK_USERS, 
  MOCK_CONTACTS, 
  MOCK_TRANSACTIONS, 
  MOCK_SPENDING_INSIGHTS, 
  MOCK_SCAM_SCREENSHOTS 
} from '../data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.detail?.message || 
                           (typeof data?.detail === 'string' ? data.detail : null) ||
                           `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.details = data?.detail || data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      const offlineError = new Error('Cannot connect to SafePay Backend. Falling back to local simulated data.');
      offlineError.status = 503;
      throw offlineError;
    }
    throw err;
  }
}

export const api = {
  // Health Check - Calls real FastAPI GET /api/health
  getHealth: async () => {
    return await request('/api/health');
  },

  // Users & Preferences
  getUsers: async () => {
    try {
      return await request('/api/users');
    } catch (e) {
      return MOCK_USERS;
    }
  },

  getUser: async (id) => {
    try {
      return await request(`/api/users/${id}`);
    } catch (e) {
      return MOCK_USERS.find(u => u.id === Number(id)) || MOCK_USERS[0];
    }
  },

  updatePreferences: async (id, prefs) => {
    try {
      return await request(`/api/users/${id}/preferences`, {
        method: 'PATCH',
        body: JSON.stringify(prefs)
      });
    } catch (e) {
      return { ...MOCK_USERS[0], ...prefs };
    }
  },

  resetDemoBalance: async (id) => {
    try {
      return await request(`/api/users/${id}/reset-demo`, { method: 'POST' });
    } catch (e) {
      const user = MOCK_USERS.find(u => u.id === Number(id)) || MOCK_USERS[0];
      user.balance = 15000.0;
      user.is_frozen = false;
      return user;
    }
  },

  // Contacts
  getContacts: async (userId) => {
    try {
      return await request(`/api/contacts?user_id=${userId}`);
    } catch (e) {
      return MOCK_CONTACTS.filter(c => !userId || c.user_id === Number(userId));
    }
  },

  addContact: async (userId, contactData) => {
    try {
      return await request(`/api/contacts?user_id=${userId}`, {
        method: 'POST',
        body: JSON.stringify(contactData)
      });
    } catch (e) {
      const newContact = {
        id: Date.now(),
        user_id: Number(userId),
        ...contactData,
        is_verified: true,
        safety_rating: 'VERIFIED_SAFE'
      };
      MOCK_CONTACTS.push(newContact);
      return newContact;
    }
  },

  deleteContact: async (contactId) => {
    try {
      return await request(`/api/contacts/${contactId}`, { method: 'DELETE' });
    } catch (e) {
      return { message: 'Contact removed' };
    }
  },

  getRecipients: async (userId) => {
    try {
      return await request(`/api/recipients?user_id=${userId}`);
    } catch (e) {
      return MOCK_CONTACTS.filter(c => !userId || c.user_id === Number(userId));
    }
  },

  // SafePay Scam Engine & Payments
  analyzePayment: async (userId, payload) => {
    try {
      return await request(`/api/payments/assess-risk?user_id=${userId}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (e) {
      if (e.status && e.status !== 503) throw e;
      // Local heuristic fallback
      const cleanVpa = (payload.recipient_upi || '').toLowerCase();
      const text = `${payload.note || ''} ${payload.recipient_name || ''} ${cleanVpa}`.toLowerCase();
      
      const isKnownScam = cleanVpa.includes('bses.electricity') || cleanVpa.includes('kbc.lottery') || cleanVpa.includes('disconnection');
      const isPinTrap = text.includes('pin') && (text.includes('receive') || text.includes('cashback') || text.includes('get'));
      const isUrgent = text.includes('10 min') || text.includes('15 min') || text.includes('cut') || text.includes('power');

      let risk_score = 0;
      let flags = [];

      if (isKnownScam) {
        risk_score = 95;
        flags.push({ category: 'Blacklist', title: 'Known Fraudulent VPA', description: 'Matched community reported fraud database', severity: 'HIGH' });
      }
      if (isPinTrap) {
        risk_score = Math.max(risk_score, 90);
        flags.push({ category: 'PIN Trap', title: 'Never Enter PIN to Receive Funds', description: 'You only enter UPI PIN to send money, never to receive refunds.', severity: 'HIGH' });
      }
      if (isUrgent) {
        risk_score = Math.max(risk_score, 80);
        flags.push({ category: 'Urgency Trap', title: 'Fake Urgency / Disconnection Threat', description: 'Scammers create panic with 15-minute deadlines.', severity: 'HIGH' });
      }

      const risk_level = risk_score >= 60 ? 'HIGH_RISK_SCAM' : risk_score >= 25 ? 'CAUTION' : 'SAFE';

      return {
        risk_score,
        risk_level,
        recommended_action: risk_score >= 60 ? 'BLOCK_IMMEDIATELY' : 'PROCEED_SAFELY',
        visual_color: risk_score >= 60 ? '#ef4444' : risk_score >= 25 ? '#f59e0b' : '#10b981',
        spoken_warning: risk_score >= 60 ? 'High risk scam detected! Do not proceed.' : 'Safe to proceed.',
        is_trusted_contact: MOCK_CONTACTS.some(c => c.upi_id.toLowerCase() === cleanVpa),
        is_known_scam: isKnownScam,
        flags
      };
    }
  },

  executePayment: async (userId, payload) => {
    return await request(`/api/payments/simulate?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getTransactionHistory: async (userId) => {
    try {
      return await request(`/api/transactions?user_id=${userId}`);
    } catch (e) {
      try {
        return await request(`/api/payments/history?user_id=${userId}`);
      } catch (err2) {
        return MOCK_TRANSACTIONS;
      }
    }
  },

  getTransaction: async (transactionId) => {
    try {
      return await request(`/api/transactions/${transactionId}`);
    } catch (e) {
      return MOCK_TRANSACTIONS.find(t => t.id === Number(transactionId)) || null;
    }
  },

  parseQr: async (rawQr) => {
    try {
      return await request('/api/payments/parse-qr', {
        method: 'POST',
        body: JSON.stringify({ raw_qr: rawQr })
      });
    } catch (e) {
      let recipient_upi = '';
      let recipient_name = '';
      let suggested_amount = null;
      let note = '';
      if (rawQr.includes('pa=')) {
        const parts = rawQr.split('?')[1]?.split('&') || [];
        parts.forEach(p => {
          const [k, v] = p.split('=');
          if (k === 'pa') recipient_upi = decodeURIComponent(v || '');
          if (k === 'pn') recipient_name = decodeURIComponent(v || '').replace(/\+/g, ' ');
          if (k === 'am') suggested_amount = parseFloat(v);
          if (k === 'tn') note = decodeURIComponent(v || '').replace(/\+/g, ' ');
        });
      }
      return { recipient_upi, recipient_name, suggested_amount, note, is_valid_upi: Boolean(recipient_upi) };
    }
  },

  // Spending Insights
  getSpendingInsights: async (userId) => {
    try {
      return await request(`/api/insights?user_id=${userId}`);
    } catch (e) {
      return MOCK_SPENDING_INSIGHTS;
    }
  },

  // Scam Catalog & VPA Verification
  getScamCatalog: async (search = '', category = '') => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      return await request(`/api/scams/catalog?${params.toString()}`);
    } catch (e) {
      return MOCK_SCAM_SCREENSHOTS;
    }
  },

  reportScam: async (reportData) => {
    try {
      return await request('/api/scams/report', {
        method: 'POST',
        body: JSON.stringify(reportData)
      });
    } catch (e) {
      return { id: Date.now(), ...reportData, reported_count: 1, reported_at: new Date().toISOString() };
    }
  },

  verifyVpa: async (vpa) => {
    try {
      return await request(`/api/scams/verify-vpa?vpa=${encodeURIComponent(vpa)}`);
    } catch (e) {
      const clean = vpa.toLowerCase();
      const isBad = clean.includes('bses.electricity') || clean.includes('kbc.lottery') || clean.includes('disconnection');
      return {
        vpa: clean,
        is_blacklisted: isBad,
        title: isBad ? 'Known Reported Fraudulent VPA' : 'Unlisted VPA',
        warning: isBad ? 'CRITICAL WARNING: This handle matches reported fraud.' : 'Not in blacklist, but exercise usual caution.'
      };
    }
  },

  detectScamText: async (message) => {
    return await request('/api/scams/detect-text', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },

  // Screenshot Scam & Ledger Verification
  verifyScreenshot: async (payload) => {
    try {
      return await request('/api/screenshot/verify', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (e) {
      const ref = (payload.reference_id || '').trim();
      const isBad = (payload.text_content || '').toLowerCase().includes('cut') ||
                    (payload.recipient_upi || payload.upi_detected || '').toLowerCase().includes('bses');
      return {
        status: 'VERIFIED_AUDIT',
        ledger_status: ref === '1' ? 'VERIFIED IN DEMO LEDGER' : (ref ? 'NOT FOUND IN DEMO LEDGER' : 'UNABLE TO VERIFY'),
        ledger_message: ref === '1' ? 'Matched simulated transaction #1 in demo ledger.' : (ref ? 'Reference not found in demo ledger.' : 'Enter a Transaction ID or Amount to verify.'),
        matched_record: ref === '1' ? { id: 1, amount: 150.0, recipient_name: 'Gopal Dairy', recipient_upi: 'gopal.dairy@paytm', status: 'SUCCESS' } : null,
        risk_score: isBad ? 90 : 10,
        risk_level: isBad ? 'HIGH_RISK_SCAM' : 'SAFE',
        risk_tier: isBad ? 'HIGH' : 'LOW',
        is_safe: !isBad,
        reasons: isBad ? ['Urgent threat or reported scam handle detected'] : ['No fraud flags found in extracted text'],
        recommended_action: isBad ? 'BLOCK_AND_REPORT' : 'PROCEED_WITH_USUAL_CARE',
        advice: isBad ? 'STOP! Do not pay or share your screen. Call 1930 Cyber Cell.' : 'No standard high-risk fraud keywords detected.',
        disclaimer: 'DISCLAIMER: Screenshots alone cannot prove payment and actual payment status must be checked directly in your real bank or payment application. This check only inspects synthetic records in our local SQLite demo ledger and never verifies real transactions.'
      };
    }
  },

  // Privacy Redactor
  redactPrivacyText: async (text) => {
    try {
      return await request('/api/privacy/redact', {
        method: 'POST',
        body: JSON.stringify({ text })
      });
    } catch {
      // In-browser fallback matching backend regex patterns
      let working = text || '';
      let otps = 0, phones = 0, emails = 0, cards = 0, upis = 0;

      // 1. Cards
      const cardRegex = /\b(?:\d{4}[\s-]){3}\d{4}\b|\b\d{16}\b/g;
      const cardM = working.match(cardRegex);
      if (cardM) { cards += cardM.length; working = working.replace(cardRegex, '[REDACTED CARD NUMBER]'); }

      // 2. Aadhaar
      const aadhRegex = /\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/g;
      const aadhM = working.match(aadhRegex);
      if (aadhM) { cards += aadhM.length; working = working.replace(aadhRegex, '[REDACTED AADHAAR]'); }

      // 3. PAN
      const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;
      const panM = working.match(panRegex);
      if (panM) { cards += panM.length; working = working.replace(panRegex, '[REDACTED PAN]'); }

      // 4. Accounts
      const acctRegex = /\b(?:a\/c|acct|account(?:\s*no\.?)?)\s*(?:is|:|-|=)?\s*([0-9]{9,18})\b/gi;
      let m;
      while ((m = acctRegex.exec(working)) !== null) { cards += 1; }
      working = working.replace(acctRegex, (full, g1) => full.replace(g1, '[REDACTED ACCOUNT]'));

      // 5. Emails
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi;
      const emailM = working.match(emailRegex);
      if (emailM) { emails += emailM.length; working = working.replace(emailRegex, '[REDACTED EMAIL]'); }

      // 6. UPI IDs
      const upiRegex = /\b[a-zA-Z0-9.\-_]{2,}@(paytm|okhdfcbank|okaxis|oksbi|okicici|ybl|ibl|axl|upi|apl|barodampay|postbank|federal|sbi|icici|hdfc|axis|pnb|kotak|indus|airtel|[a-zA-Z]{3,})\b/gi;
      working = working.replace(upiRegex, (val) => {
        if (val.includes('[REDACTED')) return val;
        upis += 1;
        return '[REDACTED UPI ID]';
      });

      // 7. OTPs
      const otpCtxRegex = /\b(?:otp|one\s*time\s*password|verification\s*code|auth\s*code|login\s*code|pin)\s*(?:is|:|-|=)?\s*([0-9]{4,8})\b/gi;
      while ((m = otpCtxRegex.exec(working)) !== null) { otps += 1; }
      working = working.replace(otpCtxRegex, (full, g1) => full.replace(g1, '[REDACTED OTP]'));

      if (/(?:otp|code|login|verification|verify|secret|password|bank|credit)/i.test(text || '')) {
        const stdOtp = /\b\d{6}\b/g;
        const stdM = working.match(stdOtp);
        if (stdM) { otps += stdM.length; working = working.replace(stdOtp, '[REDACTED OTP]'); }
      }

      // 8. Phones
      const phoneRegex = /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|\b0[6-9]\d{9}\b/g;
      const phoneM = working.match(phoneRegex);
      if (phoneM) {
        phoneM.forEach(p => { if (!p.includes('[REDACTED')) phones += 1; });
        working = working.replace(phoneRegex, '[REDACTED PHONE]');
      }

      const total = otps + phones + emails + cards + upis;

      return {
        original_text: text || '',
        redacted_text: working,
        summary: {
          otps_masked: otps,
          phones_masked: phones,
          emails_masked: emails,
          cards_masked: cards,
          upis_masked: upis,
          total_masked: total
        },
        warning: '⚠️ Automated redaction helps mask recognizable numbers and identifiers, but it cannot guarantee catching every sensitive detail. Always review before sharing.',
        privacy_notice: 'Zero-Data-Storage Guarantee: Pasted text is processed in memory and never stored in any database or forwarded to any external service.'
      };
    }
  },

  // Emergency SOS & Freeze
  getEmergencyStatus: async (userId) => {
    try {
      return await request(`/api/emergency/status?user_id=${userId}`);
    } catch (e) {
      return {
        is_frozen: false,
        emergency_contact_name: 'Pooja (Daughter)',
        emergency_contact_phone: '+91 99001 99887'
      };
    }
  },

  freezeWallet: async (userId, reason = 'Suspected scam or emergency security lock') => {
    try {
      return await request(`/api/emergency/freeze?user_id=${userId}`, {
        method: 'POST',
        body: JSON.stringify({ reason, notify_caregiver: true })
      });
    } catch (e) {
      const user = MOCK_USERS.find(u => u.id === Number(userId)) || MOCK_USERS[0];
      user.is_frozen = true;
      user.freeze_reason = reason;
      return {
        status: 'WALLET_FROZEN',
        message: 'Emergency lock active: Outgoing transfers paused.',
        caregiver_notified: true,
        caregiver_name: user.emergency_contact_name
      };
    }
  },

  unfreezeWallet: async (userId) => {
    try {
      return await request(`/api/emergency/unfreeze?user_id=${userId}`, { method: 'POST' });
    } catch (e) {
      const user = MOCK_USERS.find(u => u.id === Number(userId)) || MOCK_USERS[0];
      user.is_frozen = false;
      user.freeze_reason = null;
      return { status: 'WALLET_ACTIVE', message: 'Wallet unlocked.' };
    }
  },

  // Practice Scenarios
  getPracticeScenarios: async () => {
    try {
      return await request('/api/practice/scenarios');
    } catch (e) {
      return [
        {
          id: 1,
          title: "Paying Gopal Dairy for Morning Milk",
          scenario_type: "SAFE",
          difficulty: "Beginner",
          sender_or_recipient: "Gopal Dairy",
          vpa: "gopal.dairy@paytm",
          amount: 120.0,
          message: "Payment for 2 Litres of cow milk",
          hints: "Check the recipient name and UPI ID. Does it match your verified neighborhood vendor?",
          explanation: "This is a safe daily transaction to your verified neighborhood milk shop.",
          expected_action: "APPROVE"
        },
        {
          id: 2,
          title: "Threat: Electricity Cut in 15 Minutes!",
          scenario_type: "SCAM",
          difficulty: "Beginner",
          sender_or_recipient: "Electricity Power Officer",
          vpa: "bses.electricity.disconnection@upi",
          amount: 1450.0,
          message: "Urgent! Pay ₹1450 immediately or power disconnected in 15 minutes.",
          hints: "Notice the 15-minute panic threat and personal UPI ID instead of the official portal.",
          explanation: "Classic panic scam! Electricity boards NEVER disconnect power with a 15-minute SMS demanding instant personal UPI transfers.",
          expected_action: "REJECT_AND_REPORT"
        }
      ];
    }
  },

  verifyPracticeDecision: async (scenarioId, chosenAction) => {
    try {
      return await request('/api/practice/verify', {
        method: 'POST',
        body: JSON.stringify({ scenario_id: scenarioId, chosen_action: chosenAction })
      });
    } catch (e) {
      const isScam = scenarioId === 2;
      const isCorrect = (chosenAction === 'REJECT_AND_REPORT' && isScam) || (chosenAction === 'APPROVE' && !isScam);
      return {
        scenario_id: scenarioId,
        is_correct: isCorrect,
        feedback: isCorrect ? 'Spot-on! You made the safe and correct choice.' : 'Be careful! Notice the urgency or verification status.',
        key_safety_takeaway: isScam ? 'Never pay under panic or 15-minute threats.' : 'Verified neighborhood contacts are safe to pay.'
      };
    }
  },

  // Feature 1: Shared Risk Thresholds
  getRiskThresholds: async () => {
    try {
      return await request('/api/scams/risk-thresholds');
    } catch (e) {
      return {
        thresholds: { CRITICAL: 80, HIGH: 50, MEDIUM: 25, LOW: 0 },
        categories: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        descriptions: {
          LOW: 'No major warning signs detected. Always independently verify new recipients.',
          MEDIUM: 'Visible caution. Review recipient, amount, and payment purpose carefully.',
          HIGH: 'Stop and check before proceeding. Significant fraud indicators detected.',
          CRITICAL: 'Emergency stop. Extreme danger of financial loss or credential theft.'
        },
        disclaimer: 'Automated CyberCare warning: Heuristic risk thresholds analyze known fraud patterns.'
      };
    }
  },

  // Feature 3: Camera & Face Privacy
  getCameraStatus: async () => {
    try {
      return await request('/api/camera/status');
    } catch (e) {
      return {
        camera_mode: 'local_client_side_only',
        face_detection_available: true,
        face_detection_technology: 'Browser ShapeDetection API & HTML5 Canvas Spatial Geometrics',
        face_recognition_prototype: 'In-memory consent-based feature comparison',
        sqlite_biometric_storage: false,
        privacy_policy: {
          zero_cloud_upload: true,
          zero_sqlite_retention: true,
          zero_silent_recording: true,
          requires_explicit_user_start: true,
          immediate_camera_release_on_stop: true
        },
        limitations: [
          'Face detection verifies physical presence only and does NOT establish legal identity.',
          'Face recognition is a consent-based prototype and is NEVER used to authorize payments or bypass security checks.',
          'Manual typing and visual review alternatives are always provided.'
        ],
        disclaimer: 'Demo privacy protection: No facial images, video frames, or biometric templates are stored in SQLite or uploaded to any server.'
      };
    }
  },

  resetCameraBiometrics: async () => {
    try {
      return await request('/api/camera/reset-biometrics', { method: 'POST' });
    } catch (e) {
      return {
        status: 'SUCCESS',
        message: 'All temporary session biometrics cleared from in-memory cache.',
        biometric_db_records: 0
      };
    }
  }
};

export default api;
