import React, { useState } from 'react';
import { 
  EyeOff, 
  ShieldCheck, 
  ShieldAlert, 
  Copy, 
  Check, 
  Lock, 
  Sparkles, 
  RotateCcw, 
  Volume2, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Info,
  CreditCard,
  Phone,
  Mail,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import api from '../services/api';

export default function PrivacyRedactor() {
  const { speak, triggerVisualAlert, t } = useAccessibility();

  // Input text state
  const [inputText, setInputText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [redactionResult, setRedactionResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Quick-test sample presets
  const presets = [
    {
      title: "Bank OTP & Card Alert SMS",
      desc: "Masks 16-digit debit/credit card, OTP verification code, and phone",
      text: "Dear SBI Customer, OTP for your card ending 4582-1029-8472-9182 is 482910 for simulated transaction of Rs 3,450.00 at Retail Store. Never share OTP or UPI PIN with anyone."
    },
    {
      title: "WhatsApp Payment Request",
      desc: "Masks UPI VPA handle, Indian mobile number, and personal email",
      text: "Hi Uncle, please send the ₹1,200 payment to my UPI ID priya.sharma92@okaxis or send via Google Pay on +91 98450 12345. My email is priya.sharma@example.com."
    },
    {
      title: "KYC & Identity Verification Slip",
      desc: "Masks 12-digit Aadhaar UID, 10-char PAN identifier, and bank account",
      text: "KYC Verification Record: Payer Aadhaar 4829-1029-8921, PAN ABCDE1234F, linked to Bank Account No. 50100492817842. Authorization code: 772183."
    },
    {
      title: "Receipt with Multiple Identifiers",
      desc: "Masks combination of OTP, phone, card, email, and UPI handle",
      text: "Payment Receipt: Transferred ₹2,500 to rahul.kumar@paytm (Mobile: 9876543210). Confirmation sent to rahul.k@company.in. Card used: 5241987612340987. OTP code 654321 verified."
    }
  ];

  // Perform redaction
  const handleRedact = async (overrideText = null) => {
    const textToRedact = overrideText !== null ? overrideText : inputText;
    if (!textToRedact || !textToRedact.trim()) {
      triggerVisualAlert('caution', 'Please enter or paste text to redact sensitive information.');
      speak('Please enter or paste text to redact sensitive information.');
      return;
    }

    setProcessing(true);
    setCopied(false);

    try {
      const res = await api.redactPrivacyText(textToRedact);
      setRedactionResult(res);
      const totalMasked = res?.summary?.total_masked || 0;
      const feedback = `Redaction complete. Masked ${totalMasked} sensitive items.`;
      speak(feedback);
      triggerVisualAlert('safe', feedback);
    } catch (err) {
      triggerVisualAlert('danger', 'Error redacting text. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Copy redacted text to clipboard
  const handleCopy = async () => {
    if (!redactionResult?.redacted_text) return;

    try {
      await navigator.clipboard.writeText(redactionResult.redacted_text);
      setCopied(true);
      speak('Redacted text copied to clipboard successfully.');
      triggerVisualAlert('safe', 'Redacted text copied to clipboard! ✓');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers or restricted clipboard permissions
      try {
        const textarea = document.createElement('textarea');
        textarea.value = redactionResult.redacted_text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        speak('Redacted text copied to clipboard.');
        triggerVisualAlert('safe', 'Redacted text copied! ✓');
        setTimeout(() => setCopied(false), 3000);
      } catch {
        triggerVisualAlert('caution', 'Could not access clipboard. Please select the text manually.');
      }
    }
  };

  // Load a preset
  const handleSelectPreset = (preset) => {
    setInputText(preset.text);
    handleRedact(preset.text);
    speak(`Loaded preset: ${preset.title}. Redaction applied.`);
  };

  // Reset form
  const handleReset = () => {
    setInputText('');
    setRedactionResult(null);
    setCopied(false);
    speak('Privacy redactor cleared.');
  };

  return (
    <div className="privacy-redactor-page" style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Page Title & Controls */}
      <div className="card-header" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#eff6ff', color: '#1d4ed8', padding: '0.35rem 0.8rem', borderRadius: '999px', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.5rem' }}>
            <EyeOff size={16} />
            <span>Anti-Doxxing & Privacy Safeguard</span>
          </div>
          <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
            Privacy Redactor
          </h1>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', margin: 0 }}>
            Sanitize screenshots, SMS alerts, and messages by automatically masking OTPs, phone numbers, email addresses, card numbers, and UPI IDs before sharing.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={handleReset}
          style={{ fontSize: 'var(--font-sm)', padding: '0.45rem 0.9rem' }}
          title="Clear all fields"
        >
          <RotateCcw size={16} />
          <span>Reset Form</span>
        </button>
      </div>

      {/* Critical Zero Data Storage Guarantee & Honest Warning Banners */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {/* Zero Storage Banner */}
        <div className="card" style={{ background: '#f0fdf4', borderLeft: '6px solid var(--color-safe)', padding: '1.25rem', margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Lock size={26} color="var(--color-safe)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: 'var(--font-md)', color: '#166534', display: 'block', marginBottom: '0.25rem' }}>
                Zero-Data-Storage Guarantee
              </strong>
              <p style={{ fontSize: 'var(--font-sm)', color: '#14532d', margin: 0, lineHeight: 1.5 }}>
                Pasted text is processed strictly in-memory (on-device) and is <strong>never stored in any database, logged to disk, or sent to external AI/cloud services</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Limitation & Human Review Warning */}
        <div className="card" style={{ background: '#fffbeb', borderLeft: '6px solid var(--color-caution)', padding: '1.25rem', margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <AlertTriangle size={26} color="var(--color-caution)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: 'var(--font-md)', color: '#b45309', display: 'block', marginBottom: '0.25rem' }}>
                Human Review Required
              </strong>
              <p style={{ fontSize: 'var(--font-sm)', color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                <strong>Automated redaction can miss sensitive details</strong> or unconventional handwriting/number formats. Always inspect the redacted text carefully before sharing or posting publicly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Demo Test Presets */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sparkles size={20} color="var(--color-brand)" />
          <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 800, margin: 0 }}>
            Quick Test Presets (1-Click Fill & Redact):
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="card"
              onClick={() => handleSelectPreset(preset)}
              style={{
                margin: 0,
                padding: '0.85rem',
                textAlign: 'left',
                border: '2px solid var(--border-color)',
                background: inputText === preset.text ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <strong style={{ fontSize: 'var(--font-sm)', display: 'block', color: 'var(--color-brand)', marginBottom: '0.2rem' }}>
                {idx + 1}. {preset.title}
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                {preset.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Redaction Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Input Text Card */}
        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label 
              htmlFor="privacy-input-textarea"
              style={{ fontSize: 'var(--font-md)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <FileText size={18} color="var(--color-brand)" />
              <span>Paste or Type Text to Redact:</span>
            </label>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
              {inputText.length} characters
            </span>
          </div>

          <textarea
            id="privacy-input-textarea"
            className="input-field"
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste suspicious SMS messages, WhatsApp chats, bank alert messages, or receipt text here..."
            style={{
              width: '100%',
              fontFamily: 'monospace',
              fontSize: 'var(--font-md)',
              lineHeight: 1.5,
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--border-color)',
              marginBottom: '1rem'
            }}
          />

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-primary"
              disabled={processing || !inputText.trim()}
              onClick={() => handleRedact()}
              style={{
                fontSize: 'var(--font-md)',
                padding: '0.75rem 1.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <EyeOff size={20} />
              <span>{processing ? 'Redacting Sensitive Data...' : 'Redact Sensitive Information'}</span>
            </button>

            {inputText && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setInputText('');
                  setRedactionResult(null);
                }}
                style={{ fontSize: 'var(--font-sm)' }}
              >
                Clear Input
              </button>
            )}
          </div>
        </div>

        {/* Redacted Output Display */}
        {redactionResult && (
          <div 
            className="card" 
            role="region"
            aria-live="polite"
            style={{ 
              margin: 0, 
              border: '2px solid var(--color-brand)',
              background: 'var(--bg-secondary)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            {/* Output Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--color-brand)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={22} color="var(--color-safe)" />
                  <span>Sanitized & Redacted Output</span>
                </h2>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                  Total sensitive items masked: <strong>{redactionResult.summary?.total_masked || 0}</strong>
                </span>
              </div>

              {/* Accessible Copy Button */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCopy}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.25rem',
                    fontSize: 'var(--font-md)',
                    background: copied ? 'var(--color-safe)' : 'var(--color-brand)',
                    color: '#fff'
                  }}
                  title="Copy sanitized text to clipboard"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  <span>{copied ? 'Copied to Clipboard! ✓' : 'Copy Redacted Text'}</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => speak(redactionResult.redacted_text, true)}
                  title="Read sanitized text aloud"
                  style={{ padding: '0.6rem 0.9rem', fontSize: 'var(--font-sm)' }}
                >
                  <Volume2 size={18} />
                  <span>Read Aloud</span>
                </button>
              </div>
            </div>

            {/* Redacted Text Box */}
            <div 
              style={{
                background: '#0f172a',
                color: '#f8fafc',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'monospace',
                fontSize: 'var(--font-md)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                border: '1px solid #334155',
                marginBottom: '1.25rem'
              }}
            >
              {redactionResult.redacted_text}
            </div>

            {/* Category Masking Badges */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Redaction Breakdown by Category:
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem' }}>
                {/* OTPs */}
                <div style={{ background: 'var(--bg-tertiary)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <KeyRound size={18} color="var(--color-brand)" />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>OTPs / PINs</span>
                    <strong style={{ fontSize: 'var(--font-md)', color: 'var(--text-primary)' }}>
                      {redactionResult.summary?.otps_masked || 0} masked
                    </strong>
                  </div>
                </div>

                {/* Phone Numbers */}
                <div style={{ background: 'var(--bg-tertiary)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={18} color="var(--color-brand)" />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Phone Numbers</span>
                    <strong style={{ fontSize: 'var(--font-md)', color: 'var(--text-primary)' }}>
                      {redactionResult.summary?.phones_masked || 0} masked
                    </strong>
                  </div>
                </div>

                {/* Email Addresses */}
                <div style={{ background: 'var(--bg-tertiary)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={18} color="var(--color-brand)" />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Email Addresses</span>
                    <strong style={{ fontSize: 'var(--font-md)', color: 'var(--text-primary)' }}>
                      {redactionResult.summary?.emails_masked || 0} masked
                    </strong>
                  </div>
                </div>

                {/* Card / Account / Aadhaar / PAN */}
                <div style={{ background: 'var(--bg-tertiary)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={18} color="var(--color-brand)" />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Cards, IDs & Accts</span>
                    <strong style={{ fontSize: 'var(--font-md)', color: 'var(--text-primary)' }}>
                      {redactionResult.summary?.cards_masked || 0} masked
                    </strong>
                  </div>
                </div>

                {/* UPI IDs */}
                <div style={{ background: 'var(--bg-tertiary)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} color="var(--color-brand)" />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>UPI IDs / VPAs</span>
                    <strong style={{ fontSize: 'var(--font-md)', color: 'var(--text-primary)' }}>
                      {redactionResult.summary?.upis_masked || 0} masked
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Reminder Warning */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--font-sm)', color: '#92400e' }}>
                {redactionResult.warning}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Educational Guide: What Gets Redacted & Why */}
      <div className="card" style={{ background: 'var(--bg-secondary)' }}>
        <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, marginBottom: '1rem' }}>
          What Information Does EasyPay & SafePay Redact?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--color-brand)', display: 'block', marginBottom: '0.25rem', fontSize: 'var(--font-sm)' }}>
              1. 4-to-8 Digit OTPs & UPI PINs
            </strong>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              Never share one-time passwords or bank codes with anyone, even caregivers or support representatives. Replaced with <code>[REDACTED OTP]</code>.
            </p>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--color-brand)', display: 'block', marginBottom: '0.25rem', fontSize: 'var(--font-sm)' }}>
              2. 10-Digit Mobile Numbers & +91 Prefixes
            </strong>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              Protects private phone numbers from telemarketing databases and spam list harvesting. Replaced with <code>[REDACTED PHONE]</code>.
            </p>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--color-brand)', display: 'block', marginBottom: '0.25rem', fontSize: 'var(--font-sm)' }}>
              3. Debit / Credit Cards & Bank Accounts
            </strong>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              Detects 16-digit card sequences, Aadhaar UIDs, PAN cards, and bank account numbers to prevent financial identity theft. Replaced with <code>[REDACTED CARD NUMBER]</code> / <code>[REDACTED ACCOUNT]</code>.
            </p>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--color-brand)', display: 'block', marginBottom: '0.25rem', fontSize: 'var(--font-sm)' }}>
              4. Email Addresses & UPI ID Handles
            </strong>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              Masks email handles and UPI VPAs (e.g., <code>@paytm</code>, <code>@okhdfcbank</code>, <code>@okaxis</code>) to shield personal contacts. Replaced with <code>[REDACTED EMAIL]</code> and <code>[REDACTED UPI ID]</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
