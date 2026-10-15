import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Send, 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Volume2, 
  PhoneCall, 
  CheckCircle2, 
  Lock,
  XCircle,
  RotateCcw,
  Info
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useAccessibility } from '../context/AccessibilityContext';
import SafetyScoreBadge from '../components/SafetyScoreBadge';
import ScamAlertModal from '../components/ScamAlertModal';
import api from '../services/api';

export default function ReviewConfirmPayment({
  recipient,
  amount,
  note,
  onConfirmed,
  onBack,
  onCancel
}) {
  const { activeUser } = useUser();
  const { speak, triggerVisualAlert } = useAccessibility();
  
  const [assessment, setAssessment] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(true);
  const [assessmentError, setAssessmentError] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [verifiedCheck, setVerifiedCheck] = useState(false);
  const [highRiskDeliberateCheck, setHighRiskDeliberateCheck] = useState(false);
  const [interceptModalData, setInterceptModalData] = useState(null);

  // Call backend risk assessment endpoint on mount
  useEffect(() => {
    let isMounted = true;
    if (recipient && amount && activeUser?.id) {
      setLoadingAssessment(true);
      setAssessmentError(null);
      
      api.analyzePayment(activeUser.id, {
        recipient_upi: recipient.upi_id,
        recipient_name: recipient.name || '',
        amount: Number(amount),
        note: note || ''
      }).then((res) => {
        if (!isMounted) return;
        setAssessment(res);
        if (res.risk_level === 'HIGH_RISK_SCAM') {
          speak("High risk scam warning! SafePay Shield has flagged this payment as potentially fraudulent. Please review the reasons carefully before continuing.", true);
          triggerVisualAlert('danger', 'HIGH RISK SCAM WARNING');
        } else if (res.risk_level === 'CAUTION') {
          speak(`Caution: You are paying a new recipient, ${recipient.name || recipient.upi_id}. Please review carefully.`);
          triggerVisualAlert('warning', 'CAUTION: Double check recipient');
        } else {
          speak(`Safe to proceed. Simulated payment of ${amount} rupees to ${recipient.name || recipient.upi_id}.`);
        }
      }).catch((err) => {
        if (!isMounted) return;
        console.error('Risk assessment error:', err);
        setAssessmentError(err.message || 'Unable to complete real-time security assessment.');
      }).finally(() => {
        if (isMounted) setLoadingAssessment(false);
      });
    }
    return () => { isMounted = false; };
  }, [recipient, amount, note, activeUser?.id, speak, triggerVisualAlert]);

  const isHighRisk = assessment?.risk_level === 'HIGH_RISK_SCAM';

  // Deliberate submission handler
  const handleExecutePayment = async (emergencyOverride = false) => {
    setSubmitError(null);

    // Rule: Accidental repeated submission protection
    if (submitting) return;

    if (!verifiedCheck && !emergencyOverride) {
      alert("Please confirm the verification checkbox before proceeding.");
      return;
    }

    if (isHighRisk && !highRiskDeliberateCheck && !emergencyOverride) {
      alert("This payment has been flagged as HIGH RISK. You must check the deliberate high-risk confirmation box to proceed with this demo.");
      return;
    }

    if (activeUser?.is_frozen) {
      alert("Cannot pay: Simulated Wallet is FROZEN in Emergency SOS Mode.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.executePayment(activeUser.id, {
        recipient_upi: recipient.upi_id,
        recipient_name: recipient.name || recipient.upi_id,
        amount: Number(amount),
        note: note || '',
        emergency_override: emergencyOverride || (isHighRisk && highRiskDeliberateCheck)
      });
      onConfirmed(response);
    } catch (err) {
      if (err.status === 422 && err.details?.reasons) {
        // Backend intercepted payment
        setInterceptModalData({
          recipient_name: recipient.name || recipient.upi_id,
          recipient_upi: recipient.upi_id,
          amount: Number(amount),
          reasons: err.details.reasons,
          risk_score: err.details.risk_score,
          spoken_warning: err.details.spoken_warning
        });
      } else {
        const friendlyMsg = err.message || 'We could not connect to the backend server. Your money is safe and no transaction was created.';
        setSubmitError(friendlyMsg);
        speak("Payment could not be processed. Your funds are safe.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-confirm-page" style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Navigation & Step Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onBack}
          disabled={submitting}
          style={{ fontSize: 'var(--font-sm)', padding: '0.45rem 0.9rem' }}
        >
          <ArrowLeft size={16} />
          <span>Edit Amount</span>
        </button>

        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
          Step 3 of 4: Review & Security Shield
        </span>

        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={submitting}
          style={{ fontSize: 'var(--font-sm)', padding: '0.45rem 0.9rem', color: 'var(--color-danger)' }}
          title="Abort transfer and return to Dashboard (No money is moved)"
        >
          <XCircle size={16} />
          <span>Cancel Payment</span>
        </button>
      </div>

      <div className="card-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: 'var(--font-2xl)' }}>
            <ShieldCheck size={32} color="var(--color-brand)" />
            <span>Review Simulated Payment</span>
          </h2>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Check every detail carefully. No real money or banking PIN will ever be requested.
          </p>
        </div>
      </div>

      {/* Prominent Simulation Notice */}
      <div style={{
        background: 'var(--bg-tertiary)',
        border: '2px solid var(--color-brand)',
        borderRadius: 'var(--radius-md)',
        padding: '0.9rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <Info size={24} color="var(--color-brand)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
          <strong style={{ display: 'block', color: 'var(--color-brand)', fontWeight: 800 }}>
            SIMULATED PAYMENT NOTICE
          </strong>
          This is an educational demo for accessibility and scam protection. No real bank accounts, UPI PINs, passwords, or actual currency will be debited.
        </div>
      </div>

      {/* Payment Summary Box */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.25rem' }}>
        <div style={{ textAlign: 'center', paddingBottom: '1.25rem', borderBottom: '2px solid var(--border-color)', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Payment Amount
          </span>
          <div style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: 900, color: 'var(--color-brand)', margin: '0.4rem 0' }}>
            ₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
            From: {activeUser?.name || 'Demo User'} • Current Balance: ₹{activeUser?.balance ? activeUser.balance.toLocaleString('en-IN') : '0'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: 'var(--font-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Paying to:</span>
            <strong style={{ fontSize: 'var(--font-lg)' }}>{recipient?.name || recipient?.upi_id}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>UPI Handle:</span>
            <strong style={{ fontFamily: 'monospace' }}>{recipient?.upi_id}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Category / Tag:</span>
            <span>{recipient?.category || recipient?.relationship || 'General Payment'}</span>
          </div>
          {note && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Purpose Note:</span>
              <strong style={{ fontStyle: 'italic' }}>"{note}"</strong>
            </div>
          )}
        </div>
      </div>

      {/* Security Assessment Display */}
      {loadingAssessment ? (
        <div className="card" style={{ textAlign: 'center', padding: '1.75rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700, marginBottom: '0.5rem' }}>
            Scanning with SafePay AI Scam Shield...
          </div>
          <span style={{ fontSize: 'var(--font-sm)' }}>
            Checking against community blacklist, reverse PIN traps, and urgency threats in SQLite.
          </span>
        </div>
      ) : assessmentError ? (
        <div className="card" style={{ borderColor: 'var(--color-danger)', background: 'var(--color-danger-bg)', padding: '1.25rem' }}>
          <strong style={{ color: 'var(--color-danger)', display: 'block', marginBottom: '0.4rem' }}>
            ⚠️ Security Assessment Notice:
          </strong>
          <p style={{ fontSize: 'var(--font-sm)', margin: 0 }}>
            {assessmentError}. SafePay fallback rules are active. Please exercise extra caution.
          </p>
        </div>
      ) : (
        <SafetyScoreBadge assessment={assessment} />
      )}

      {/* PROMINENT HIGH RISK WARNING & DELIBERATE CONFIRMATION */}
      {isHighRisk && (
        <div style={{
          background: 'var(--color-danger-bg)',
          border: '3px solid var(--color-danger)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          margin: '1.5rem 0',
          animation: 'slideDownPulse 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-danger)', marginBottom: '0.75rem' }}>
            <AlertTriangle size={32} />
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 900, margin: 0 }}>
              CRITICAL SCAM WARNING!
            </h3>
          </div>
          
          <p style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--color-danger)', marginBottom: '0.6rem' }}>
            SafePay Shield strongly recommends CANCELING this payment.
          </p>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.5 }}>
            {assessment?.spoken_warning || 'This recipient or message matches known fraudulent patterns.'}
          </p>

          {/* Deliberate Confirmation Checkbox for High-Risk Demo */}
          <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-danger)' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', fontSize: 'var(--font-md)' }}>
              <input
                type="checkbox"
                checked={highRiskDeliberateCheck}
                onChange={(e) => setHighRiskDeliberateCheck(e.target.checked)}
                style={{ width: '22px', height: '22px', marginTop: '3px', cursor: 'pointer', accentColor: 'var(--color-danger)' }}
              />
              <span style={{ fontWeight: 800, color: 'var(--color-danger)' }}>
                DELIBERATE CONFIRMATION: I understand this payment has been flagged as a HIGH-RISK SCAM by the security engine. I deliberately choose to test this simulated override.
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Standard Caregiver Reassurance Checkbox */}
      <div style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', margin: '1.25rem 0' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', fontSize: 'var(--font-md)' }}>
          <input
            type="checkbox"
            checked={verifiedCheck}
            onChange={(e) => setVerifiedCheck(e.target.checked)}
            style={{ width: '22px', height: '22px', marginTop: '2px', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 600 }}>
            I confirm that I want to send simulated <strong>₹{amount}</strong> to <strong>{recipient?.name || recipient?.upi_id}</strong>, and no caller asked me to download remote screen software or enter my PIN.
          </span>
        </label>
      </div>

      {/* Error recovery box if submission failed */}
      {submitError && (
        <div style={{ background: 'var(--color-danger-bg)', border: '2px solid var(--color-danger)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', fontWeight: 800, marginBottom: '0.4rem' }}>
            <AlertTriangle size={20} />
            <span>Payment Not Processed</span>
          </div>
          <p style={{ fontSize: 'var(--font-sm)', margin: '0 0 0.8rem' }}>
            {submitError}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleExecutePayment(false)}
              disabled={submitting}
              style={{ fontSize: 'var(--font-sm)', padding: '0.4rem 0.8rem' }}
            >
              <RotateCcw size={14} />
              <span>Retry Transfer</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              style={{ fontSize: 'var(--font-sm)', padding: '0.4rem 0.8rem', color: 'var(--color-danger)' }}
            >
              Cancel & Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Explicit Action Buttons: Back, Cancel, Continue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={submitting}
          style={{ fontSize: 'var(--font-lg)', padding: '1.1rem', color: 'var(--color-danger)' }}
        >
          <XCircle size={20} />
          <span>Cancel</span>
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={() => handleExecutePayment(false)}
          disabled={submitting || !verifiedCheck || (isHighRisk && !highRiskDeliberateCheck)}
          style={{
            fontSize: 'var(--font-xl)',
            padding: '1.1rem',
            background: isHighRisk ? 'var(--color-danger)' : 'var(--color-safe)',
            opacity: (!verifiedCheck || (isHighRisk && !highRiskDeliberateCheck) || submitting) ? 0.6 : 1
          }}
        >
          <Send size={24} />
          <span>{submitting ? 'Authorizing Simulated Payment...' : `Confirm & Send ₹${amount}`}</span>
        </button>
      </div>

      {/* Scam Intercept Modal */}
      <ScamAlertModal
        isOpen={Boolean(interceptModalData)}
        onClose={() => setInterceptModalData(null)}
        interceptData={interceptModalData}
        onConfirmOverride={() => handleExecutePayment(true)}
      />
    </div>
  );
}
