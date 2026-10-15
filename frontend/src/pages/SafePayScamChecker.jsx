import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  GraduationCap, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
  RefreshCw,
  Copy,
  Check,
  Lock,
  Volume2,
  FileText,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import ReadAloudButton from '../components/ReadAloudButton';
import ConditionalScamRiskInterface from '../components/ConditionalScamRiskInterface';
import PracticeSandbox from './PracticeSandbox';
import api from '../services/api';

// Curated sample messages covering all primary scam types and a safe message
const SAMPLE_MESSAGES = [
  {
    id: 'electricity',
    title: '⚡ Electricity Power Cut',
    tag: 'Urgent Threat',
    badgeClass: 'danger',
    text: 'Dear consumer, your electricity power will be disconnected tonight at 9:30 PM by electricity officer because your bill was not updated. Immediately call 9876543210'
  },
  {
    id: 'lottery',
    title: '🏆 KBC Lottery Prize',
    tag: 'Advance Fee',
    badgeClass: 'warning',
    text: 'Congratulations! You have won Rs 25,00,000 in KBC Lucky Draw. To claim your lottery prize money, pay processing fee of Rs 1,500 via UPI.'
  },
  {
    id: 'kyc',
    title: '🔒 Bank KYC & OTP Trap',
    tag: 'Credential Theft',
    badgeClass: 'danger',
    text: 'Dear SBI customer, your net banking account is blocked due to incomplete KYC. Click http://bit.ly/sbi-kyc-verify to verify and share the 6-digit OTP sent to your phone.'
  },
  {
    id: 'remote',
    title: '📲 AnyDesk Screen Share',
    tag: 'Remote Hijack',
    badgeClass: 'danger',
    text: 'Customer care: Install AnyDesk app or QuickSupport immediately on your mobile so our officer can assist your refund of Rs 4,500.'
  },
  {
    id: 'qr',
    title: '🔄 Scan QR to Receive',
    tag: 'Reverse PIN Trap',
    badgeClass: 'danger',
    text: 'I am sending you Rs 5,000 refund for your returned product. Please scan this QR code and enter your UPI PIN to receive the money in your bank account.'
  },
  {
    id: 'safe',
    title: '☕ Routine Safe Message',
    tag: 'Safe / Normal',
    badgeClass: 'safe',
    text: 'Hi Ramesh uncle, let us meet tomorrow for tea at the park around 5 PM.'
  }
];

export default function SafePayScamChecker({ onOpenFreezeModal }) {
  const { speak, triggerVisualAlert, t } = useAccessibility();
  const [activeSubTab, setActiveSubTab] = useState('detector'); // 'detector' | 'lookup' | 'practice'
  
  // 1. Scam Detector (Message Analyzer) State
  const [messageInput, setMessageInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [copiedAdvice, setCopiedAdvice] = useState(false);

  // 2. VPA Verification State
  const [vpaInput, setVpaInput] = useState('');
  const [vpaLoading, setVpaLoading] = useState(false);
  const [vpaResult, setVpaResult] = useState(null);

  // Handle Scanning Text Message
  const handleCheckScam = async (e) => {
    if (e) e.preventDefault();
    const text = messageInput.trim();
    if (!text) {
      setInputError(t('errMessageEmpty', 'Please paste or type a message before scanning.'));
      return;
    }
    if (text.length > 5000) {
      setInputError(t('errMessageTooLong', 'Message is too long (maximum 5,000 characters). Please provide a single message or excerpt.'));
      return;
    }

    setInputError('');
    setScanning(true);
    setScanResult(null);
    setScanError(null);

    try {
      const res = await api.detectScamText(text);
      setScanResult(res);

      if (res.risk_category === 'CRITICAL') {
        speak(`Danger: Critical scam detected. Risk score ${res.risk_score} out of 100. Do not pay or share credentials.`, true);
        triggerVisualAlert('danger', `CRITICAL SCAM DETECTED: Score ${res.risk_score}/100`);
      } else if (res.risk_category === 'HIGH') {
        speak(`Warning: High scam risk detected. Risk score ${res.risk_score} out of 100.`, true);
        triggerVisualAlert('danger', `High Scam Risk: Score ${res.risk_score}/100`);
      } else if (res.risk_category === 'MEDIUM') {
        speak(`Caution: Medium risk factors detected. Risk score ${res.risk_score} out of 100.`, false);
        triggerVisualAlert('info', `Caution Flagged: Score ${res.risk_score}/100`);
      } else {
        speak('Safe. No known scam patterns detected in this message.', false);
        triggerVisualAlert('success', 'Low Risk: Message appears safe');
      }
    } catch (err) {
      setScanError(err.message || 'Failed to analyze message. Please check backend connection.');
    } finally {
      setScanning(false);
    }
  };

  const handleSelectSample = (sampleText) => {
    setMessageInput(sampleText);
    setInputError('');
    setScanResult(null);
    setScanError(null);
  };

  const handleClear = () => {
    setMessageInput('');
    setInputError('');
    setScanResult(null);
    setScanError(null);
  };

  const handleCopySafetyReport = () => {
    if (!scanResult) return;
    const reportText = [
      `SafePay Scam Assessment Report`,
      `Risk Category: ${scanResult.risk_category} (${scanResult.risk_score}/100)`,
      `Summary: ${scanResult.summary}`,
      `Warning Signs:`,
      ...scanResult.warning_signs.map(w => `- [${w.severity}] ${w.title}: ${w.explanation}`),
      `Safety Advice:`,
      ...scanResult.safety_advice.map(a => `- ${a}`),
      `Disclaimer: ${scanResult.disclaimer}`
    ].join('\n');

    navigator.clipboard.writeText(reportText);
    setCopiedAdvice(true);
    setTimeout(() => setCopiedAdvice(false), 2500);
  };

  // Handle VPA Lookup
  const handleVerifyVpa = async (e) => {
    e.preventDefault();
    if (!vpaInput.trim()) return;
    setVpaLoading(true);
    setVpaResult(null);
    try {
      const res = await api.verifyVpa(vpaInput.trim());
      setVpaResult(res);
      if (res.is_blacklisted) {
        speak(`Warning: ${res.title}. ${res.warning}`, true);
        triggerVisualAlert('danger', 'Known Reported Scam Handle Detected!');
      } else {
        speak('UPI handle is not on the active community blacklist.', false);
        triggerVisualAlert('info', 'Handle not in blacklist. Exercise standard caution.');
      }
    } catch (err) {
      alert('Verification error: ' + err.message);
    } finally {
      setVpaLoading(false);
    }
  };

  return (
    <div className="safepay-scam-checker-page" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#eff6ff', color: '#1d4ed8', padding: '0.35rem 0.8rem', borderRadius: '999px', fontSize: 'var(--font-sm)', fontWeight: 700 }}>
            <ShieldCheck size={16} />
            <span>Step 3: SafePay CyberCare Intelligence Engine</span>
          </div>

          <ReadAloudButton 
            text={`${t('scamDetectorTitle', 'SafePay Scam Detector')}. ${t('scamDetectorInstructions', 'Paste suspicious message text below. Click Check for Scam to run rule-based fraud detection.')} ${t('goldenRulePin', 'Golden Rule: You only enter your UPI PIN to SEND money, never to RECEIVE money.')}`}
            label={t('readInstructions', 'Read instructions aloud')}
          />
        </div>

        <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
          {t('scamDetectorTitle', 'SafePay Scam Detector')}
        </h1>
        <p style={{ fontSize: 'var(--font-lg)', color: 'var(--text-secondary)', margin: 0 }}>
          {t('scamDetectorSubtitle', 'Paste suspicious SMS, WhatsApp messages, emails, or payment requests. SafePay uses transparent, explainable rule analysis to detect fraud threats, PIN traps, and impersonation.')}
        </p>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('detector')}
          className={`btn-secondary ${activeSubTab === 'detector' ? 'active' : ''}`}
          style={{
            padding: '0.8rem 1.4rem',
            fontWeight: 700,
            fontSize: 'var(--font-md)',
            background: activeSubTab === 'detector' ? 'var(--color-brand)' : 'var(--bg-secondary)',
            color: activeSubTab === 'detector' ? '#ffffff' : 'var(--text-primary)',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <ShieldAlert size={18} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
          Message Scam Detector
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('lookup')}
          className={`btn-secondary ${activeSubTab === 'lookup' ? 'active' : ''}`}
          style={{
            padding: '0.8rem 1.4rem',
            fontWeight: 700,
            fontSize: 'var(--font-md)',
            background: activeSubTab === 'lookup' ? 'var(--color-brand)' : 'var(--bg-secondary)',
            color: activeSubTab === 'lookup' ? '#ffffff' : 'var(--text-primary)',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <Search size={18} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
          Verify UPI Handle / VPA
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('practice')}
          className={`btn-secondary ${activeSubTab === 'practice' ? 'active' : ''}`}
          style={{
            padding: '0.8rem 1.4rem',
            fontWeight: 700,
            fontSize: 'var(--font-md)',
            background: activeSubTab === 'practice' ? 'var(--color-brand)' : 'var(--bg-secondary)',
            color: activeSubTab === 'practice' ? '#ffffff' : 'var(--text-primary)',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <GraduationCap size={18} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
          Practice Scam Challenges
        </button>
      </div>

      {/* Sub Tab 1: Primary Message Scam Detector */}
      {activeSubTab === 'detector' && (
        <div>
          {/* Main Input Card */}
          <div className="card" style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={24} color="var(--color-brand)" />
                <span>Paste Suspicious Message or Payment Request</span>
              </h2>
              <span style={{ fontSize: 'var(--font-sm)', color: messageInput.length > 5000 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                {messageInput.length} / 5,000 characters
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: 'var(--font-md)' }}>
              Copy the text from your SMS, WhatsApp, email, or UPI payment note and paste it below to run rule-based fraud detection.
            </p>

            {/* Clickable Sample Messages */}
            <div style={{ marginBottom: '1.25rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.6rem' }}>
                💡 Click a sample message to test:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
                {SAMPLE_MESSAGES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample.text)}
                    className="toggle-chip"
                    style={{
                      textAlign: 'left',
                      padding: '0.6rem 0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                      background: messageInput === sample.text ? '#eff6ff' : 'var(--bg-primary)',
                      borderColor: messageInput === sample.text ? 'var(--color-brand)' : 'var(--border-color)'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
                      {sample.title}
                    </span>
                    <span style={{ fontSize: '11px', color: sample.badgeClass === 'safe' ? '#059669' : '#dc2626', fontWeight: 600 }}>
                      [{sample.tag}]
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCheckScam}>
              <div style={{ marginBottom: '1rem' }}>
                <label 
                  htmlFor="scam-message-input" 
                  style={{ display: 'block', fontWeight: 700, fontSize: 'var(--font-sm)', marginBottom: '0.4rem' }}
                >
                  Message Content *
                </label>
                <textarea
                  id="scam-message-input"
                  rows={6}
                  required
                  placeholder="Paste SMS message, WhatsApp chat, email text, or payment note here... (e.g. 'Dear consumer your electricity power will be disconnected tonight...')"
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    if (inputError) setInputError('');
                  }}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: 'var(--font-md)',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${inputError ? '#ef4444' : 'var(--border-color)'}`,
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    resize: 'vertical'
                  }}
                />
                {inputError && (
                  <div style={{ color: '#ef4444', fontSize: 'var(--font-sm)', marginTop: '0.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertCircle size={16} />
                    <span>{inputError}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!messageInput && !scanResult}
                  className="btn-secondary"
                  style={{ padding: '0.85rem 1.4rem', fontSize: 'var(--font-md)' }}
                >
                  {t('btnClear', 'Clear Box')}
                </button>

                <button
                  type="submit"
                  disabled={scanning || !messageInput.trim()}
                  className="btn-primary"
                  style={{
                    padding: '0.9rem 2rem',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  {scanning ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      <span>{t('btnScanning', 'Scanning for Scams...')}</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={20} />
                      <span>{t('btnCheckScam', 'Check for Scam')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Backend Error Display */}
          {scanError && (
            <div style={{ padding: '1.25rem', background: '#fef2f2', border: '2px solid #ef4444', borderRadius: 'var(--radius-md)', marginBottom: '1.75rem', color: '#991b1b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: 'var(--font-lg)', marginBottom: '0.25rem' }}>
                <AlertTriangle size={20} color="#ef4444" />
                <span>Unable to Analyze Message</span>
              </div>
              <p style={{ margin: 0 }}>{scanError}</p>
            </div>
          )}

          {/* FEATURE 1: CONDITIONAL SCAM-RISK INTERFACE (LOW, MEDIUM, HIGH, CRITICAL) */}
          {scanResult && (
            <ConditionalScamRiskInterface
              assessment={{
                risk_score: scanResult.risk_score,
                risk_category: scanResult.risk_category,
                flags: scanResult.warning_signs?.map(w => ({
                  title: w.title,
                  description: w.explanation,
                  category: w.category,
                  severity: w.severity,
                  what_to_do_next: "Verify independently and never share credentials."
                })) || [],
                safety_advice: scanResult.safety_advice,
                spoken_warning: scanResult.summary,
                disclaimer: scanResult.disclaimer,
                is_serious_risk: scanResult.risk_category === 'CRITICAL' || scanResult.risk_category === 'HIGH'
              }}
              formData={{
                recipient_name: "Scanned Message / Request",
                recipient_upi: messageInput.slice(0, 35) + (messageInput.length > 35 ? '...' : ''),
                amount: 0
              }}
              onProceed={() => {
                const el = document.getElementById('scam-report-details');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onCancel={handleClear}
              onReviewAgain={handleClear}
              onGetSafetyAdvice={() => {
                if (onOpenFreezeModal) onOpenFreezeModal();
                else alert("Call National Cyber Crime Helpline at 1930 immediately.");
              }}
            />
          )}

          {/* Analysis Results Display */}
          {scanResult && (
            <div 
              id="scam-report-details"
              className="card"
              style={{
                marginBottom: '1.75rem',
                border: `3px solid ${
                  scanResult.risk_category === 'CRITICAL' ? '#ef4444' :
                  scanResult.risk_category === 'HIGH' ? '#f97316' :
                  scanResult.risk_category === 'MEDIUM' ? '#f59e0b' : '#10b981'
                }`,
                background: scanResult.risk_category === 'LOW' ? '#f0fdf4' : '#ffffff'
              }}
            >
              {/* Score & Category Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', borderRadius: '999px', fontWeight: 800, fontSize: 'var(--font-sm)', textTransform: 'uppercase', letterSpacing: '0.05em',
                      background: scanResult.risk_category === 'CRITICAL' ? '#fee2e2' : scanResult.risk_category === 'HIGH' ? '#ffedd5' : scanResult.risk_category === 'MEDIUM' ? '#fef3c7' : '#dcfce7',
                      color: scanResult.risk_category === 'CRITICAL' ? '#991b1b' : scanResult.risk_category === 'HIGH' ? '#c2410c' : scanResult.risk_category === 'MEDIUM' ? '#b45309' : '#166534'
                    }}>
                      {scanResult.risk_category === 'CRITICAL' && <AlertTriangle size={16} />}
                      {scanResult.risk_category === 'HIGH' && <ShieldAlert size={16} />}
                      {scanResult.risk_category === 'MEDIUM' && <AlertCircle size={16} />}
                      {scanResult.risk_category === 'LOW' && <CheckCircle2 size={16} />}
                      <span>Risk Category: {scanResult.risk_category}</span>
                    </div>

                    <ReadAloudButton 
                      text={`${scanResult.risk_category} risk detected. Score ${scanResult.risk_score} out of 100. ${scanResult.summary}. ${scanResult.warning_signs?.map(w => w.title).join(', ')}. ${scanResult.safety_advice?.join('. ')}`}
                      label={t('readInstructions', 'Read findings aloud')}
                      variant="chip"
                    />
                  </div>

                  <h3 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, margin: '0 0 0.4rem 0', color: 'var(--text-primary)' }}>
                    {scanResult.summary}
                  </h3>
                  <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                    Hybrid Engine: Local Scikit-Learn ML Model + Deterministic Safety Rules
                  </span>
                </div>

                {/* Score Dial / Number */}
                <div style={{ textAlign: 'center', minWidth: '130px', background: 'var(--bg-secondary)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                    Calculated Risk Score
                  </span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.1,
                    color: scanResult.risk_category === 'CRITICAL' ? '#ef4444' : scanResult.risk_category === 'HIGH' ? '#f97316' : scanResult.risk_category === 'MEDIUM' ? '#f59e0b' : '#10b981'
                  }}>
                    {scanResult.risk_score}
                    <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-muted)' }}>/100</span>
                  </div>
                </div>
              </div>

              {/* Real ML Model Prediction & Confidence Card */}
              <div 
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1.5px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '1.25rem 1.5rem', 
                  marginBottom: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Sparkles size={20} color="var(--color-brand)" />
                    <strong style={{ fontSize: 'var(--font-md)', color: 'var(--text-primary)' }}>
                      Local Scikit-Learn ML Model Prediction
                    </strong>
                    <span style={{ fontSize: '11px', background: 'rgba(244, 63, 94, 0.12)', color: 'var(--color-brand)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 800 }}>
                      TF-IDF + LogisticRegression
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Model Output:
                    </span>
                    <span style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '999px',
                      fontWeight: 900,
                      fontSize: 'var(--font-sm)',
                      letterSpacing: '0.04em',
                      background: scanResult.model_prediction === 'SCAM' ? '#fee2e2' : '#dcfce7',
                      color: scanResult.model_prediction === 'SCAM' ? '#dc2626' : '#166534',
                      border: `1.5px solid ${scanResult.model_prediction === 'SCAM' ? '#ef4444' : '#22c55e'}`
                    }}>
                      {scanResult.model_prediction === 'SCAM' ? '⚠️ SCAM DETECTED' : '✓ LEGITIMATE PATTERN'}
                    </span>
                  </div>
                </div>

                {/* Model Confidence Meter */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Model Confidence Level:</span>
                    <span style={{ color: 'var(--color-brand)' }}>
                      {(Number(scanResult.model_confidence || 0) * 100).toFixed(1)}% Confidence
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '9px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <div 
                      style={{ 
                        width: `${Math.min(100, Math.max(10, Number(scanResult.model_confidence || 0) * 100))}%`, 
                        height: '100%', 
                        background: scanResult.model_prediction === 'SCAM' ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #10b981, #059669)',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease'
                      }} 
                    />
                  </div>
                </div>

                {/* Safety Rule Override Notice if Active */}
                {scanResult.rule_override_applied && (
                  <div style={{ background: '#fef2f2', border: '1.5px solid #ef4444', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#991b1b' }}>
                    <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: 'var(--font-sm)' }}>
                      <strong style={{ display: 'block', fontWeight: 800 }}>Mandatory Safety Rule Override Active</strong>
                      <span>{scanResult.override_reason || 'Severe indicators (e.g. OTP/PIN or remote access requests) strictly override ML output.'}</span>
                    </div>
                  </div>
                )}

                {/* Recommended Action Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Recommended Action:
                  </span>
                  <span style={{
                    padding: '0.3rem 0.8rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: 'var(--font-sm)',
                    background: scanResult.recommended_action === 'BLOCK_IMMEDIATELY' ? '#dc2626' : scanResult.recommended_action === 'CARE_DOUBLE_CHECK' ? '#f59e0b' : '#10b981',
                    color: '#ffffff'
                  }}>
                    {scanResult.recommended_action === 'BLOCK_IMMEDIATELY' ? '🛑 Cancel & Block Immediately' : scanResult.recommended_action === 'CARE_DOUBLE_CHECK' ? '⚠️ Exercise Caution & Verify' : '✓ Proceed with Care'}
                  </span>
                </div>
              </div>

              {/* Detected Warning Signs */}
              <div style={{ marginBottom: '1.75rem' }}>
                <h4 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldAlert size={20} color="var(--color-brand)" />
                  <span>Detected Warning Signs ({scanResult.warning_signs.length})</span>
                </h4>

                {scanResult.warning_signs.length === 0 ? (
                  <div style={{ padding: '1.25rem', background: '#dcfce7', borderRadius: 'var(--radius-sm)', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={24} color="#16a34a" style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ color: '#166534', display: 'block' }}>No Suspicious Fraud Indicators Found</strong>
                      <span style={{ fontSize: 'var(--font-sm)', color: '#15803d' }}>
                        This text does not trigger any of our rule patterns for OTP theft, urgent disconnection threats, fake lotteries, remote-access APKs, or reverse PIN traps.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {scanResult.warning_signs.map((sign, idx) => (
                      <div 
                        key={idx} 
                        style={{
                          padding: '1.1rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-secondary)',
                          borderLeft: `5px solid ${sign.severity === 'CRITICAL' ? '#ef4444' : sign.severity === 'HIGH' ? '#f97316' : '#f59e0b'}`
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 'var(--font-md)', color: sign.severity === 'CRITICAL' ? '#b91c1c' : sign.severity === 'HIGH' ? '#c2410c' : '#b45309' }}>
                            ⚠️ {sign.title}
                          </strong>
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px', background: sign.severity === 'CRITICAL' ? '#fee2e2' : '#ffedd5', color: sign.severity === 'CRITICAL' ? '#991b1b' : '#9a3412', textTransform: 'uppercase' }}>
                            {sign.severity} SEVERITY
                          </span>
                        </div>

                        <p style={{ margin: '0 0 0.5rem 0', fontSize: 'var(--font-md)', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                          <strong>Why this is suspicious:</strong> {sign.explanation}
                        </p>

                        {sign.matched_terms && sign.matched_terms.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.4rem' }}>
                            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>Matched triggers:</span>
                            {sign.matched_terms.map((term, tIdx) => (
                              <span 
                                key={tIdx} 
                                style={{ background: '#ffffff', border: '1px solid var(--border-color)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}
                              >
                                {term}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Practical Safety Advice */}
              <div style={{ marginBottom: '1.75rem', background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1e293b' }}>
                  <ShieldCheck size={20} color="#059669" />
                  <span>Practical Safety Advice & Next Steps</span>
                </h4>

                <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {scanResult.safety_advice.map((advice, aIdx) => (
                    <li key={aIdx} style={{ fontSize: 'var(--font-md)', color: '#334155', lineHeight: 1.4 }}>
                      {advice}
                    </li>
                  ))}
                </ul>

                {/* Immediate Action Buttons */}
                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleCopySafetyReport}
                    className="btn-secondary"
                    style={{ fontSize: 'var(--font-sm)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {copiedAdvice ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                    <span>{copiedAdvice ? 'Copied to Clipboard!' : 'Copy Safety Report'}</span>
                  </button>

                  {scanResult.risk_category === 'CRITICAL' && onOpenFreezeModal && (
                    <button
                      type="button"
                      onClick={onOpenFreezeModal}
                      style={{
                        background: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.6rem 1.1rem',
                        fontWeight: 700,
                        fontSize: 'var(--font-sm)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Lock size={16} />
                      <span>Lock Wallet (Emergency SOS Freeze)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Requirement 8: Explicit Disclaimer */}
              <div style={{ padding: '0.85rem 1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <Info size={18} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: 'var(--font-xs)', color: '#92400e', lineHeight: 1.4 }}>
                  <strong>Disclaimer:</strong> {scanResult.disclaimer}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub Tab 2: VPA Lookup */}
      {activeSubTab === 'lookup' && (
        <div className="card">
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={24} color="var(--color-brand)" />
            <span>Community VPA & UPI ID Verification</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Enter any UPI ID, vendor name, or handle to verify whether it matches known fraudulent reports or community alerts.
          </p>

          <form onSubmit={handleVerifyVpa} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="e.g. bses.electricity.disconnection@upi or kbc.lottery@okaxis"
              value={vpaInput}
              onChange={(e) => setVpaInput(e.target.value)}
              style={{
                flex: 1,
                minWidth: '280px',
                padding: '0.85rem 1rem',
                fontSize: 'var(--font-md)',
                borderRadius: 'var(--radius-sm)',
                border: '2px solid var(--border-color)'
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={vpaLoading || !vpaInput.trim()}
              style={{ padding: '0.85rem 1.5rem', fontSize: 'var(--font-md)' }}
            >
              {vpaLoading ? 'Checking...' : 'Check Handle'}
            </button>
          </form>

          {/* Quick preset chips */}
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Try sample handles:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="toggle-chip"
                onClick={() => setVpaInput('bses.electricity.disconnection@upi')}
              >
                ⚠️ bses.electricity.disconnection@upi (Scam)
              </button>
              <button
                type="button"
                className="toggle-chip"
                onClick={() => setVpaInput('kbc.lottery.headquarters@okaxis')}
              >
                ⚠️ kbc.lottery.headquarters@okaxis (Scam)
              </button>
              <button
                type="button"
                className="toggle-chip"
                onClick={() => setVpaInput('gopal.dairy@paytm')}
              >
                ✓ gopal.dairy@paytm (Safe Verified Vendor)
              </button>
            </div>
          </div>

          {/* VPA Result */}
          {vpaResult && (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: vpaResult.is_blacklisted ? 'var(--color-danger-bg)' : 'var(--color-safe-bg)',
                border: `2px solid ${vpaResult.is_blacklisted ? 'var(--color-danger)' : 'var(--color-safe)'}`,
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start'
              }}
            >
              {vpaResult.is_blacklisted ? (
                <XCircle size={32} color="var(--color-danger)" style={{ flexShrink: 0 }} />
              ) : (
                <CheckCircle2 size={32} color="var(--color-safe)" style={{ flexShrink: 0 }} />
              )}
              <div>
                <strong style={{ fontSize: 'var(--font-lg)', color: vpaResult.is_blacklisted ? 'var(--color-danger)' : 'var(--color-safe)', display: 'block', marginBottom: '0.25rem' }}>
                  {vpaResult.title}
                </strong>
                <p style={{ margin: 0, fontSize: 'var(--font-md)' }}>
                  {vpaResult.warning}
                </p>
                <div style={{ marginTop: '0.6rem', fontSize: 'var(--font-sm)', opacity: 0.85 }}>
                  Queried handle: <code>{vpaResult.vpa}</code>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub Tab 3: Practice Sandbox Challenges */}
      {activeSubTab === 'practice' && (
        <div>
          <PracticeSandbox />
        </div>
      )}

      {/* Transparent Fraud Detection Principles */}
      <div className="card" style={{ marginTop: '2rem', background: 'var(--bg-secondary)', border: '2px solid var(--border-color)' }}>
        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Info size={20} color="var(--color-brand)" />
          <span>Core Golden Rules of SafePay Protection</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <strong style={{ color: 'var(--color-brand)', display: 'block', marginBottom: '0.25rem' }}>
              1. Never Enter PIN to Receive Funds
            </strong>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              A UPI PIN is only entered to deduct money from your account. Receiving refunds or prize money NEVER requires entering your PIN.
            </span>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <strong style={{ color: 'var(--color-brand)', display: 'block', marginBottom: '0.25rem' }}>
              2. 15-Minute Panic Threat Rule
            </strong>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              Electricity boards and utility companies do not send SMS messages threatening instant power cuts within 15 minutes asking for personal UPI payments.
            </span>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <strong style={{ color: 'var(--color-brand)', display: 'block', marginBottom: '0.25rem' }}>
              3. Never Install Screen Sharing Apps
            </strong>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              Never install AnyDesk, TeamViewer, or QuickSupport on caller instructions. Scammers use these to capture OTPs and banking credentials.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
