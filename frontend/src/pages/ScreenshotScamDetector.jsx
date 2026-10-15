import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Volume2, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  Image as ImageIcon,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import api from '../services/api';

export default function ScreenshotScamDetector() {
  const { speak, triggerVisualAlert, t } = useAccessibility();

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileError, setFileError] = useState(null);

  // Manual verification fields
  const [referenceId, setReferenceId] = useState('');
  const [amount, setAmount] = useState('');
  const [recipientUpi, setRecipientUpi] = useState('');
  const [textContent, setTextContent] = useState('');

  // Analysis result state
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  // Preset quick-test samples
  const samplePresets = [
    {
      label: "1. Demo Txn #1 (Found in SQLite)",
      ref: "1",
      amt: "150",
      upi: "gopal.dairy@paytm",
      text: "Simulated Milk Payment to Gopal Dairy",
      hint: "Matches synthetic record #1 seeded in demo database -> VERIFIED IN DEMO LEDGER"
    },
    {
      label: "2. Not in Ledger (Unknown Txn)",
      ref: "TXN-9999999",
      amt: "5000",
      upi: "unknown.stranger@okaxis",
      text: "Payment of ₹5000 sent to unknown account",
      hint: "Simulates an unrecorded or fake receipt -> NOT FOUND IN DEMO LEDGER"
    },
    {
      label: "3. Altered Amount Mismatch",
      ref: "1",
      amt: "9999",
      upi: "gopal.dairy@paytm",
      text: "Simulated Milk Payment to Gopal Dairy with altered amount",
      hint: "Valid reference #1 but tampered amount (₹9999 vs ₹150) -> NOT FOUND IN DEMO LEDGER"
    },
    {
      label: "4. Blank (Unable to Verify)",
      ref: "",
      amt: "",
      upi: "",
      text: "Hello, please check this payment screenshot",
      hint: "Demonstrates UNABLE TO VERIFY state when required reference/amount are missing"
    },
    {
      label: "5. Electricity Cut Scam SMS",
      ref: "FAKE-9988",
      amt: "1450",
      upi: "bses.electricity.disconnection@upi",
      text: "Urgent! Electricity will be disconnected in 15 minutes unless bill is paid. Send UPI to bses.electricity.disconnection@upi",
      hint: "Triggers urgent disconnection threat and reported scam UPI handle"
    }
  ];

  // Handle client-side file selection with strict validation (PNG, JPG, JPEG with 5 MB maximum)
  const handleFileChange = (e) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type: PNG, JPG, JPEG only
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const validExtensions = ['.png', '.jpg', '.jpeg'];
    const lowerName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some(ext => lowerName.endsWith(ext));
    if (!validTypes.includes(file.type) && !hasValidExt) {
      const err = "Invalid file type. Please upload a PNG, JPG, or JPEG screenshot.";
      setFileError(err);
      setSelectedFile(null);
      setPreviewUrl(null);
      triggerVisualAlert('danger', err);
      speak(err);
      return;
    }

    // Validate file size (max 5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const err = `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 5 MB maximum limit.`;
      setFileError(err);
      setSelectedFile(null);
      setPreviewUrl(null);
      triggerVisualAlert('danger', err);
      speak(err);
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    speak(`Screenshot selected: ${file.name}. Size: ${(file.size / 1024).toFixed(0)} kilobytes. Please enter transaction reference or amount to verify.`);
    triggerVisualAlert('info', `Screenshot loaded: ${file.name}`);
  };

  const handleApplyPreset = (preset) => {
    setReferenceId(preset.ref);
    setAmount(preset.amt);
    setRecipientUpi(preset.upi);
    setTextContent(preset.text);
    setResult(null);
    speak(`Loaded preset: ${preset.label}`);
  };

  const handleClearAll = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileError(null);
    setReferenceId('');
    setAmount('');
    setRecipientUpi('');
    setTextContent('');
    setResult(null);
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    setVerifying(true);
    setResult(null);

    try {
      const payload = {
        reference_id: referenceId.trim() || undefined,
        amount: amount ? Number(amount) : undefined,
        recipient_upi: recipientUpi.trim() || undefined,
        text_content: textContent.trim() || undefined,
        upi_detected: recipientUpi.trim() || undefined
      };

      const res = await api.verifyScreenshot(payload);
      setResult(res);

      if (res.ledger_status === 'VERIFIED IN DEMO LEDGER') {
        speak(`Verification status: Verified in demo ledger. Simulated transaction of ${res.matched_record?.amount} rupees found.`);
        triggerVisualAlert('success', 'Verified in Demo Ledger');
      } else if (res.ledger_status === 'NOT FOUND IN DEMO LEDGER' || res.ledger_status === 'NOT FOUND') {
        speak(`Notice: Reference or amount not found in demo ledger. Screenshots alone cannot prove payment.`);
        triggerVisualAlert('warning', 'Not Found in Demo Ledger');
      } else {
        speak(`Unable to verify: Please provide a reference number or amount to check against the demo ledger.`);
        triggerVisualAlert('info', 'Unable to verify without reference or amount');
      }
    } catch (err) {
      console.error('Verification error:', err);
      alert('Verification request failed: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="screenshot-detector-page" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: 'var(--font-2xl)' }}>
            <Camera size={32} color="var(--color-brand)" />
            <span>{t('screenshotTitle', 'Screenshot & Receipt Scam Checker')}</span>
          </h2>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {t('screenshotSubtitle', 'Verify payment receipts against our local SQLite demo ledger and audit message scam keywords.')}
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={handleClearAll}
          style={{ fontSize: 'var(--font-sm)', padding: '0.45rem 0.9rem' }}
        >
          <RotateCcw size={16} />
          <span>Reset Form</span>
        </button>
      </div>

      {/* Critical Verification & Architecture Safety Notice */}
      <div className="card" style={{ background: '#f8fafc', borderLeft: '6px solid var(--color-brand)', marginBottom: '1.75rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <ShieldAlert size={28} color="var(--color-brand)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ fontSize: 'var(--font-md)', display: 'block', marginBottom: '0.3rem', color: 'var(--color-brand)' }}>
              Important: Screenshots Alone Cannot Prove Payment
            </strong>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Fraudsters frequently use fake screenshot generator apps, altered fonts, or spoofed receipts. <strong>Screenshots alone cannot prove payment</strong>. You must always check your actual balance and payment status directly in your official banking app or UPI provider (e.g., GPay, PhonePe, Paytm, or your bank's net banking).
            </p>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-danger)', fontWeight: 800, marginTop: '0.5rem', marginBottom: 0 }}>
              🔒 Simulated Demo Only: This tool strictly compares manually entered details against our local SQLite demo transaction ledger. It never claims to verify real transactions and never sends your images or data to external servers.
            </p>
          </div>
        </div>
      </div>

      {/* Presets for Quick Hackathon Demo */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sparkles size={20} color="var(--color-brand)" />
          <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 800, margin: 0 }}>
            Quick Demo Test Presets (1-Click Fill):
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {samplePresets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              className="card"
              onClick={() => handleApplyPreset(p)}
              style={{
                margin: 0,
                padding: '0.85rem',
                textAlign: 'left',
                border: '2px solid var(--border-color)',
                background: referenceId === p.ref && p.ref ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                cursor: 'pointer'
              }}
            >
              <strong style={{ fontSize: 'var(--font-sm)', display: 'block', color: 'var(--color-brand)', marginBottom: '0.2rem' }}>
                {p.label}
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                {p.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleVerify} className="card" style={{ marginBottom: '2rem' }}>
        {/* Step 1: File Upload */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <label style={{ display: 'block', fontSize: 'var(--font-md)', fontWeight: 800, marginBottom: '0.4rem' }}>
            1. Select Image / Screenshot (Optional Preview):
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label
              htmlFor="screenshot-file-input"
              className="btn-secondary"
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Upload size={18} />
              <span>Choose Image (PNG, JPG, JPEG — Max 5 MB)</span>
            </label>
            <input
              id="screenshot-file-input"
              type="file"
              accept=".png, .jpg, .jpeg, image/png, image/jpeg"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {selectedFile && (
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-safe)', fontWeight: 700 }}>
                ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
              </span>
            )}
          </div>

          {fileError && (
            <div style={{ marginTop: '0.75rem', color: 'var(--color-danger)', fontSize: 'var(--font-sm)', fontWeight: 700 }}>
              ⚠️ {fileError}
            </div>
          )}

          {previewUrl && (
            <div style={{ marginTop: '1rem', background: '#0f172a', padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'inline-block', maxWidth: '100%' }}>
              <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                Selected Image Preview:
              </span>
              <img
                src={previewUrl}
                alt="Selected payment screenshot"
                style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>

        {/* Step 2: Manual Fields */}
        <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 800, marginBottom: '1rem' }}>
          2. Enter Transaction & Message Details to Verify:
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.3rem' }}>
              Transaction Reference / ID:
            </label>
            <input
              type="text"
              placeholder="e.g. 1 or TXN-101"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: 'var(--font-md)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.3rem' }}>
              Amount in Screenshot (₹):
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 150"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: 'var(--font-md)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.3rem' }}>
              Recipient UPI ID or Phone:
            </label>
            <input
              type="text"
              placeholder="e.g. gopal.dairy@paytm"
              value={recipientUpi}
              onChange={(e) => setRecipientUpi(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: 'var(--font-md)' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.3rem' }}>
            Message or SMS Text from Screenshot:
          </label>
          <textarea
            rows={3}
            placeholder="e.g. 'Urgent power cut in 10 minutes unless paid now' or payment remarks..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: 'var(--font-md)' }}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={verifying}
          style={{ width: '100%', padding: '0.9rem', fontSize: 'var(--font-md)', fontWeight: 800 }}
        >
          <Camera size={20} />
          <span>{verifying ? 'Auditing Demo Ledger & Scam Rules...' : t('verifyButton', 'Verify in Demo Ledger & Audit Scam Risk')}</span>
        </button>
      </form>

      {/* Results Card */}
      {result && (
        <div className="card" style={{ border: '3px solid var(--border-color)', padding: '1.75rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {result.ledger_status === 'VERIFIED IN DEMO LEDGER' && (
                <div style={{ background: '#ecfdf5', color: '#059669', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '2px solid #059669' }}>
                  <CheckCircle2 size={24} />
                  <span style={{ fontSize: 'var(--font-lg)' }}>VERIFIED IN DEMO LEDGER</span>
                </div>
              )}
              {(result.ledger_status === 'NOT FOUND IN DEMO LEDGER' || result.ledger_status === 'NOT FOUND') && (
                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '2px solid #dc2626' }}>
                  <XCircle size={24} />
                  <span style={{ fontSize: 'var(--font-lg)' }}>NOT FOUND IN DEMO LEDGER</span>
                </div>
              )}
              {result.ledger_status === 'UNABLE TO VERIFY' && (
                <div style={{ background: '#f8fafc', color: '#64748b', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '2px solid #94a3b8' }}>
                  <HelpCircle size={24} />
                  <span style={{ fontSize: 'var(--font-lg)' }}>UNABLE TO VERIFY</span>
                </div>
              )}
            </div>

            {/* Risk Tier Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 900,
                  fontSize: 'var(--font-sm)',
                  background: result.risk_tier === 'HIGH' ? 'var(--color-danger-bg)' : result.risk_tier === 'MEDIUM' ? 'var(--color-caution-bg)' : 'var(--color-safe-bg)',
                  color: result.risk_tier === 'HIGH' ? 'var(--color-danger)' : result.risk_tier === 'MEDIUM' ? 'var(--color-caution)' : 'var(--color-safe)',
                  border: '2px solid currentColor'
                }}
              >
                [{result.risk_tier} RISK] Score: {result.risk_score}/100
              </span>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => speak(`${result.ledger_status}. Risk tier: ${result.risk_tier}. ${result.advice}`, true)}
                title="Read verdict aloud"
                style={{ padding: '0.35rem 0.7rem', fontSize: 'var(--font-sm)' }}
              >
                <Volume2 size={16} />
                <span>Read Verdict</span>
              </button>
            </div>
          </div>

          {/* Ledger Match Details if Found */}
          {result.matched_record ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 800, color: '#166534', marginBottom: '0.5rem' }}>
                ✓ Matched SQLite Ledger Record:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: 'var(--font-sm)' }}>
                <div><strong>Transaction ID:</strong> #{result.matched_record.id}</div>
                <div><strong>Amount:</strong> ₹{result.matched_record.amount}</div>
                <div><strong>Recipient:</strong> {result.matched_record.recipient_name} ({result.matched_record.recipient_upi})</div>
                <div><strong>Status:</strong> {result.matched_record.status}</div>
                {result.matched_record.timestamp && (
                  <div><strong>Timestamp:</strong> {new Date(result.matched_record.timestamp).toLocaleString('en-IN')}</div>
                )}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {result.ledger_message}
            </p>
          )}

          {/* Risk Engine Breakdown */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 800, marginBottom: '0.4rem' }}>
              SafePay Scam Engine Audit:
            </h4>
            <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
              {result.reasons?.map((r, i) => (
                <li key={i} style={{ marginBottom: '0.3rem', fontSize: 'var(--font-md)' }}>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Action Box */}
          <div style={{ background: result.is_safe ? 'var(--color-safe-bg)' : 'var(--color-danger-bg)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: `2px solid ${result.is_safe ? 'var(--color-safe)' : 'var(--color-danger)'}` }}>
            <strong style={{ fontSize: 'var(--font-md)', color: result.is_safe ? 'var(--color-safe)' : 'var(--color-danger)', display: 'block', marginBottom: '0.3rem' }}>
              Recommended Action: {result.recommended_action}
            </strong>
            <p style={{ margin: 0, fontSize: 'var(--font-md)', fontWeight: 500 }}>
              {result.advice}
            </p>
          </div>

          {/* Visible Disclaimer */}
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', marginBottom: 0, fontStyle: 'italic' }}>
            {result.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
