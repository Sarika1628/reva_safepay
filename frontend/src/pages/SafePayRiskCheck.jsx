import React, { useState } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useAccessibility } from '../context/AccessibilityContext';
import SafetyScoreBadge from '../components/SafetyScoreBadge';
import api from '../services/api';

export default function SafePayRiskCheck({ onProceedToPay }) {
  const { activeUser } = useUser();
  const { speak, triggerVisualAlert } = useAccessibility();
  
  const [recipientUpi, setRecipientUpi] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState('100');
  const [note, setNote] = useState('');
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);

  const testCases = [
    {
      label: "⚡ Fake Electricity Cut SMS",
      upi: "bses.electricity.disconnection@upi",
      name: "Electricity Officer",
      amount: "1450",
      note: "Urgent power cut in 15 minutes unless paid immediately"
    },
    {
      label: "🎁 ₹25 Lakh KBC Lottery Scam",
      upi: "kbc.lottery.headquarters@okaxis",
      name: "KBC Lucky Prize Desk",
      amount: "499",
      note: "Pay registration processing tax to claim 25 Lakh prize won in WhatsApp draw"
    },
    {
      label: "📲 AnyDesk Screen Share Trap",
      upi: "support.executive@airtel",
      name: "Customer Care Refund Agent",
      amount: "50",
      note: "Install AnyDesk QuickSupport and send test 50 rupees to receive 5000 refund"
    },
    {
      label: "🥛 Safe Cow Milk Vendor",
      upi: "gopal.dairy@paytm",
      name: "Gopal Cow Milk Dairy",
      amount: "150",
      note: "Daily morning fresh milk delivery"
    }
  ];

  const handleRunAnalysis = async (e) => {
    if (e) e.preventDefault();
    if (!recipientUpi) {
      alert("Please enter a UPI ID or select a sample case above.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.analyzePayment(activeUser?.id || 1, {
        recipient_upi: recipientUpi,
        recipient_name: recipientName || '',
        amount: Number(amount) || 100,
        note: note || ''
      });
      setAssessment(res);

      if (res.risk_level === 'HIGH_RISK_SCAM') {
        speak(res.spoken_warning, true);
        triggerVisualAlert('danger', 'CRITICAL SCAM THREAT IDENTIFIED');
      } else {
        speak(res.spoken_warning);
      }
    } catch (err) {
      alert("Analysis failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyTestCase = (tc) => {
    setRecipientUpi(tc.upi);
    setRecipientName(tc.name);
    setAmount(tc.amount);
    setNote(tc.note);
    speak(`Loaded sample: ${tc.label}`);
  };

  return (
    <div className="safepay-risk-check-page" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: 'var(--font-2xl)' }}>
            <ShieldCheck size={32} color="var(--color-brand)" />
            <span>SafePay Risk Check & Fraud Scanner</span>
          </h2>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Before transferring any money, check any UPI handle, message, or phone number here to see if it's safe.
          </p>
        </div>
      </div>

      {/* Preset Test Case Chips */}
      <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
        <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', display: 'block', marginBottom: '0.6rem' }}>
          Try Instant Real-World Test Scenarios:
        </strong>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {testCases.map((tc, idx) => (
            <button
              key={idx}
              type="button"
              className="toggle-chip"
              onClick={() => applyTestCase(tc)}
              style={{ fontWeight: 700, padding: '0.6rem 1rem' }}
            >
              {tc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Form */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleRunAnalysis}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: '0.4rem' }}>
                Recipient UPI ID / VPA to Test *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. bses.electricity.disconnection@upi"
                value={recipientUpi}
                onChange={(e) => setRecipientUpi(e.target.value)}
                style={{ width: '100%', padding: '0.85rem', fontSize: 'var(--font-md)', borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: '0.4rem' }}>
                Recipient Name (if provided)
              </label>
              <input
                type="text"
                placeholder="e.g. Electricity Power Officer"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                style={{ width: '100%', padding: '0.85rem', fontSize: 'var(--font-md)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: '0.4rem' }}>
                Transfer Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                placeholder="₹ Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ width: '100%', padding: '0.85rem', fontSize: 'var(--font-md)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: '0.4rem' }}>
              Message / Payment Purpose Note (Paste SMS or WhatsApp Text):
            </label>
            <textarea
              rows={3}
              placeholder="Paste the SMS or message here (e.g. 'Pay ₹1450 immediately or power disconnected in 15 minutes')..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ width: '100%', padding: '0.85rem', fontSize: 'var(--font-md)', borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)', resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', fontSize: 'var(--font-lg)', padding: '1.1rem' }}
          >
            <ShieldCheck size={22} />
            <span>{loading ? 'Analyzing with SafePay Scam Engine...' : 'Scan This Payment for Scams'}</span>
          </button>
        </form>
      </div>

      {/* Safety Score Results */}
      {assessment && (
        <div style={{ animation: 'slideDownPulse 0.3s ease-out' }}>
          <SafetyScoreBadge assessment={assessment} />

          {/* Action recommendation */}
          <div className="card" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <strong style={{ fontSize: 'var(--font-lg)', display: 'block' }}>
                {assessment.risk_level === 'HIGH_RISK_SCAM' ? 'Recommended Action: DO NOT PAY' : 'Recommended Action: Safe to Proceed'}
              </strong>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                {assessment.risk_level === 'HIGH_RISK_SCAM' ? 'This payment matches known fraudulent patterns.' : 'No scam flags detected.'}
              </span>
            </div>

            {assessment.risk_level === 'SAFE' && onProceedToPay && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => onProceedToPay({
                  name: recipientName || recipientUpi,
                  upi_id: recipientUpi,
                  amount: Number(amount),
                  note: note
                })}
              >
                <span>Proceed to Pay (₹{amount})</span>
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
