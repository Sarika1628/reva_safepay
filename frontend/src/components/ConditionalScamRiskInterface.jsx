import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  XCircle, 
  ArrowRight, 
  PhoneCall, 
  Info, 
  HelpCircle, 
  RotateCcw,
  AlertOctagon,
  Lock
} from 'lucide-react';
import { CATEGORY_UI_METADATA, classifyRisk } from '../data/riskThresholds';
import ReadAloudButton from './ReadAloudButton';

/**
 * FEATURE 1: CONDITIONAL SCAM-RISK INTERFACE
 * Renders distinct, fully-accessible conditional screens for LOW, MEDIUM, HIGH, and CRITICAL scam risk.
 * Never hardcodes outcomes — connects directly to the backend risk score, category, and warning signs.
 */
export default function ConditionalScamRiskInterface({
  assessment,
  formData,
  onProceed,
  onCancel,
  onReviewAgain,
  onGetSafetyAdvice,
  isSubmitting = false,
  error = null,
  title = "SafePay CyberCare Scam Risk Evaluation"
}) {
  // Checkbox state for HIGH risk acknowledgement
  const [highRiskAcknowledged, setHighRiskAcknowledged] = useState(false);

  // Multi-step deliberate safe review flow state for CRITICAL risk (NO one-click bypass)
  const [criticalStep, setCriticalStep] = useState(1); // 1: Warning Details, 2: Official Channel Verification, 3: Deliberate Decision
  const [criticalAcknowledged, setCriticalAcknowledged] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState('');

  // Handle missing assessment or API error gracefully
  if (error || !assessment) {
    return (
      <div 
        className="risk-screen risk-screen-fallback"
        role="alert"
        aria-live="assertive"
        style={{
          border: '3px solid #d97706',
          borderRadius: '16px',
          background: '#fffbeb',
          padding: '1.75rem',
          margin: '1rem 0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: '#b45309' }}>
          <AlertTriangle size={32} aria-hidden="true" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
              Security Service Notice: Caution Advised
            </h3>
            <p style={{ margin: '0.35rem 0 0', fontSize: '1rem', color: '#78350f' }}>
              {error ? `Live assessment offline: ${error}` : 'Security scan data is unavailable.'}
            </p>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #fde68a' }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#92400e' }}>
            Recommended Action:
          </p>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.95rem', color: '#451a03' }}>
            Because the automated scam detector could not scan this request, proceed with utmost caution. 
            Do not pay unknown callers or enter your UPI PIN unless you have independently verified the recipient.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="action-btn cancel-btn"
            onClick={onCancel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.4rem',
              fontWeight: 800,
              fontSize: '1rem',
              borderRadius: '10px',
              border: '2px solid #dc2626',
              background: '#ffffff',
              color: '#dc2626',
              cursor: 'pointer'
            }}
          >
            <XCircle size={18} />
            <span>Cancel Transfer (Safest Choice)</span>
          </button>
          {onReviewAgain && (
            <button
              type="button"
              className="action-btn secondary-btn"
              onClick={onReviewAgain}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.4rem',
                fontWeight: 700,
                fontSize: '1rem',
                borderRadius: '10px',
                border: '2px solid #64748b',
                background: '#ffffff',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={18} />
              <span>Review Details</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Derive standardized category using documented shared thresholds
  const rawScore = Number(assessment.risk_score || 0);
  const categoryKey = assessment.risk_category || classifyRisk(rawScore, assessment.is_serious_risk, assessment.is_known_scam);
  const meta = CATEGORY_UI_METADATA[categoryKey] || CATEGORY_UI_METADATA.LOW;

  const warningSigns = assessment.flags || [];
  const safetyAdvice = assessment.safety_advice || [];
  const recipientName = formData?.recipient_name || assessment.recipient_safety_note || 'Recipient';
  const recipientUpi = formData?.recipient_upi || assessment.upi_safety_note || '';
  const amount = formData?.amount ? Number(formData.amount) : 0;

  // Speech summary text for TTS
  const speechSummary = `${meta.label}: ${meta.title}. ${meta.calmMessage} ${assessment.spoken_warning || ''}`;

  return (
    <section 
      className={`conditional-risk-card risk-${categoryKey.toLowerCase()}`}
      aria-label={`${meta.label} Security Assessment Screen`}
      aria-live={meta.ariaLive}
      style={{
        border: `3px solid ${meta.borderColorHex}`,
        borderRadius: '16px',
        backgroundColor: meta.bgColorHex,
        padding: '1.75rem',
        margin: '1.5rem 0',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        position: 'relative'
      }}
    >
      {/* Top Banner Header: Non-color-only Icon + Text Label + Category Tag + TTS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div 
            style={{ 
              width: '54px', 
              height: '54px', 
              borderRadius: '12px', 
              background: '#ffffff', 
              border: `2px solid ${meta.borderColorHex}`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: meta.borderColorHex,
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}
            aria-hidden="true"
          >
            {categoryKey === 'LOW' && <ShieldCheck size={34} />}
            {categoryKey === 'MEDIUM' && <AlertTriangle size={34} />}
            {categoryKey === 'HIGH' && <ShieldAlert size={34} />}
            {categoryKey === 'CRITICAL' && <AlertOctagon size={34} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '20px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: meta.borderColorHex,
                  color: '#ffffff'
                }}
              >
                {categoryKey === 'CRITICAL' && '🛑 '}
                {categoryKey === 'HIGH' && '⚠️ '}
                {categoryKey === 'MEDIUM' && '⚡ '}
                {categoryKey === 'LOW' && '✓ '}
                {meta.label}
              </span>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                Risk Score: <strong>{rawScore}/100</strong>
              </span>
            </div>
            <span style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.05em' }}>
              {title}
            </span>
            <h2 style={{ margin: '0.25rem 0 0', fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {meta.title}
            </h2>
          </div>
        </div>

        {/* Read Screen Aloud Button */}
        <ReadAloudButton text={speechSummary} label="Listen to Risk Report" />
      </div>

      {/* Recipient & Transfer Context pill */}
      <div 
        style={{ 
          marginTop: '1.25rem', 
          background: '#ffffff', 
          padding: '0.9rem 1.1rem', 
          borderRadius: '10px', 
          border: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
            Inspected Payee & Purpose:
          </span>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
            {recipientName} • <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{recipientUpi}</span>
          </div>
        </div>
        {amount > 0 && (
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Simulated Amount:
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-brand)' }}>
              ₹{amount.toLocaleString('en-IN')}
            </div>
          </div>
        )}
      </div>

      {/* ML Model & Rule-Override Transparency Pill */}
      {assessment?.model_prediction && (
        <div
          style={{
            marginTop: '0.85rem',
            background: 'var(--bg-secondary)',
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.6rem',
            fontSize: 'var(--font-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>ML Model Output:</span>
            <span style={{
              fontWeight: 800,
              padding: '0.15rem 0.6rem',
              borderRadius: '999px',
              fontSize: '12px',
              background: assessment.model_prediction === 'SCAM' ? '#fee2e2' : '#dcfce7',
              color: assessment.model_prediction === 'SCAM' ? '#dc2626' : '#166534',
              border: `1px solid ${assessment.model_prediction === 'SCAM' ? '#fca5a5' : '#86efac'}`
            }}>
              {assessment.model_prediction}
            </span>
            {assessment.model_confidence > 0 && (
              <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
                ({(assessment.model_confidence * 100).toFixed(0)}% confidence)
              </span>
            )}
          </div>

          {assessment.rule_override_applied && (
            <span style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '11px',
              border: '1px solid #f87171'
            }}>
              ⚠️ Critical Rule Override Active
            </span>
          )}
        </div>
      )}

      {/* =========================================================================
          SCREEN VARIANT 1: LOW RISK (0 - 24)
          Calm message, verification reminder, continue button, never claim safe.
         ========================================================================= */}
      {categoryKey === 'LOW' && (
        <div style={{ marginTop: '1.25rem' }}>
          <div 
            style={{ 
              padding: '1rem 1.25rem', 
              background: '#f0fdf4', 
              borderLeft: '5px solid #10b981', 
              borderRadius: '8px' 
            }}
          >
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#065f46' }}>
              ✓ {meta.calmMessage}
            </p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.95rem', color: '#047857', lineHeight: 1.5 }}>
              The recipient <strong>{recipientName}</strong> does not match known blacklisted UPI handles, 
              and the request contains no urgent threats, reverse PIN traps, or remote screen-sharing requests.
            </p>
          </div>

          {/* Verification Reminder */}
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
            <Info size={20} color="#059669" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#065f46', fontWeight: 600 }}>
              <strong>Reminder:</strong> {meta.verifyReminder} Ensure this is someone you personally know or a shop you have visited.
            </p>
          </div>

          {/* Essential Disclaimer: NEVER SAY GUARANTEED SAFE */}
          <div 
            style={{ 
              marginTop: '1rem', 
              padding: '0.75rem 1rem', 
              background: '#ffffff', 
              border: '1px dashed #a7f3d0', 
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#065f46'
            }}
          >
            🛡️ <strong>Safety Principle:</strong> {meta.neverGuaranteeSafeNote}
          </div>

          {/* Low Risk Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="action-btn primary-btn"
              onClick={onProceed}
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.85rem 1.8rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                borderRadius: '12px',
                background: 'var(--color-brand)',
                color: '#ffffff',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <span>Continue to Payment Review</span>
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              className="action-btn secondary-btn"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.4rem',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '12px',
                background: '#ffffff',
                border: '2px solid #cbd5e1',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <XCircle size={18} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN VARIANT 2: MEDIUM RISK (25 - 49)
          Visible caution, simple language explanations, review prompt, Review Again & Cancel
         ========================================================================= */}
      {categoryKey === 'MEDIUM' && (
        <div style={{ marginTop: '1.25rem' }}>
          <div 
            style={{ 
              padding: '1.1rem 1.25rem', 
              background: '#fffbeb', 
              borderLeft: '5px solid #f59e0b', 
              borderRadius: '8px' 
            }}
          >
            <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#92400e' }}>
              ⚡ {meta.calmMessage}
            </p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '1rem', color: '#78350f', lineHeight: 1.5 }}>
              {meta.reviewPrompt}
            </p>
          </div>

          {/* Warning Signs in Simple Language */}
          {warningSigns.length > 0 && (
            <div style={{ marginTop: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.6rem', fontSize: '1rem', fontWeight: 800, color: '#92400e' }}>
                Detected Warning Factors:
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#78350f', lineHeight: 1.6 }}>
                {warningSigns.map((w, idx) => (
                  <li key={idx} style={{ marginBottom: '0.4rem' }}>
                    <strong>{w.title}:</strong> {w.description || w.explanation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety Checklist prompt */}
          <div 
            style={{ 
              marginTop: '1.25rem', 
              background: '#ffffff', 
              border: '1px solid #fde68a', 
              borderRadius: '10px', 
              padding: '1rem 1.25rem' 
            }}
          >
            <div style={{ fontWeight: 800, color: '#92400e', marginBottom: '0.5rem' }}>
              🔍 Pre-Payment Double Check:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem', fontSize: '0.9rem', color: '#78350f' }}>
              <div>• Is this the exact UPI ID they gave you?</div>
              <div>• Did an unknown caller pressure you?</div>
              <div>• Is the amount accurate?</div>
            </div>
          </div>

          {/* Medium Risk Actions: Review Again and Cancel Options */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {onReviewAgain && (
              <button
                type="button"
                className="action-btn secondary-btn"
                onClick={onReviewAgain}
                disabled={isSubmitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.6rem',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: '2px solid #d97706',
                  color: '#b45309',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={18} />
                <span>Review Details Again</span>
              </button>
            )}
            <button
              type="button"
              className="action-btn cancel-btn"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.6rem',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '12px',
                background: '#ffffff',
                border: '2px solid #dc2626',
                color: '#dc2626',
                cursor: 'pointer'
              }}
            >
              <XCircle size={18} />
              <span>Cancel Payment</span>
            </button>
            <button
              type="button"
              className="action-btn"
              onClick={onProceed}
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.6rem',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '12px',
                background: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              <span>I Have Double-Checked, Continue</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN VARIANT 3: HIGH RISK (50 - 79)
          Prominent warning: "Stop and check before proceeding."
          Exact indicators, explain danger, Cancel & Safety Advice actions,
          requires explicit acknowledgement before allowing simulated payment.
         ========================================================================= */}
      {categoryKey === 'HIGH' && (
        <div style={{ marginTop: '1.25rem' }}>
          <div 
            style={{ 
              padding: '1.25rem', 
              background: '#fff7ed', 
              borderLeft: '6px solid #ea580c', 
              borderRadius: '10px' 
            }}
          >
            <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#c2410c' }}>
              🛑 Stop and Check Before Proceeding!
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '1rem', color: '#9a3412', lineHeight: 1.5 }}>
              SafePay has detected significant fraud indicators in this transaction request. 
              Scammers often manufacture false urgency or fake lottery rewards to manipulate people into sending funds.
            </p>
          </div>

          {/* Exact Suspicious Indicators Returned by Backend */}
          <div style={{ marginTop: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.65rem', fontSize: '1.05rem', fontWeight: 800, color: '#c2410c' }}>
              Suspicious Indicators Found by SafePay Shield:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {warningSigns.map((w, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '0.85rem 1rem', 
                    background: '#ffffff', 
                    borderRadius: '8px', 
                    border: '1px solid #fed7aa',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#c2410c' }}>
                    <AlertTriangle size={18} />
                    <span>{w.title}</span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.92rem', color: '#431407', lineHeight: 1.5 }}>
                    {w.description || w.explanation}
                  </p>
                  {w.what_to_do_next && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.88rem', color: '#9a3412', fontWeight: 700 }}>
                      What to do: {w.what_to_do_next}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Why this request is dangerous */}
          <div 
            style={{ 
              marginTop: '1.25rem', 
              padding: '1rem', 
              background: '#ffedd5', 
              borderRadius: '8px',
              fontSize: '0.92rem',
              color: '#7c2d12',
              lineHeight: 1.5
            }}
          >
            <strong>Why is this dangerous?</strong> Fraudsters use these tactics to steal your hard-earned money. 
            Once funds leave your bank account via UPI, recovery is extremely difficult.
          </div>

          {/* Explicit Acknowledgement Checkbox */}
          <div 
            style={{ 
              marginTop: '1.25rem', 
              padding: '1rem 1.25rem', 
              background: '#ffffff', 
              border: '2px solid #ea580c', 
              borderRadius: '10px' 
            }}
          >
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                id="high-risk-ack"
                checked={highRiskAcknowledged}
                onChange={(e) => setHighRiskAcknowledged(e.target.checked)}
                style={{ width: '22px', height: '22px', marginTop: '0.15rem', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#7c2d12', lineHeight: 1.4 }}>
                I have read and understand all the fraud warnings above. I acknowledge that this is a simulated test payment and confirm that in real life I must cancel this request.
              </span>
            </label>
          </div>

          {/* Actions: Cancel Payment, Get Safety Advice, and Controlled Proceed */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="action-btn cancel-btn"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.8rem',
                fontSize: '1.05rem',
                fontWeight: 900,
                borderRadius: '12px',
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <XCircle size={20} />
              <span>Cancel Payment (Recommended)</span>
            </button>

            {onGetSafetyAdvice && (
              <button
                type="button"
                className="action-btn secondary-btn"
                onClick={onGetSafetyAdvice}
                disabled={isSubmitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: '2px solid #ea580c',
                  color: '#c2410c',
                  cursor: 'pointer'
                }}
              >
                <HelpCircle size={18} />
                <span>Get Safety Advice & 1930 Helpline</span>
              </button>
            )}

            <button
              type="button"
              className="action-btn"
              onClick={onProceed}
              disabled={!highRiskAcknowledged || isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.4rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: '12px',
                background: highRiskAcknowledged ? '#64748b' : '#cbd5e1',
                color: '#ffffff',
                border: 'none',
                cursor: highRiskAcknowledged && !isSubmitting ? 'pointer' : 'not-allowed',
                opacity: highRiskAcknowledged ? 1 : 0.6
              }}
              title={!highRiskAcknowledged ? "You must tick the acknowledgement box above first" : "Proceed with simulated educational payment"}
            >
              <Lock size={16} />
              <span>Simulate Payment After Review</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN VARIANT 4: CRITICAL RISK (80 - 100)
          Prominent STOP warning, strongest detected warning signs, recommend
          cancelling & verifying through official contact, NO one-click bypass.
          Payment paused until user follows deliberate, safe review flow.
         ========================================================================= */}
      {categoryKey === 'CRITICAL' && (
        <div style={{ marginTop: '1.25rem' }}>
          <div 
            style={{ 
              padding: '1.4rem', 
              background: '#fef2f2', 
              border: '3px solid #dc2626', 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(220,38,38,0.1)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <XCircle size={36} color="#dc2626" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#991b1b' }}>
                  🛑 EMERGENCY STOP: CRITICAL SCAM THREAT!
                </p>
                <p style={{ margin: '0.35rem 0 0', fontSize: '1.05rem', color: '#b91c1c', fontWeight: 700 }}>
                  Payment has been PAUSED to protect your funds.
                </p>
              </div>
            </div>

            <p style={{ margin: '0.85rem 0 0', fontSize: '1rem', color: '#7f1d1d', lineHeight: 1.5 }}>
              This recipient or message exhibits severe fraud indicators such as reported fraud handles, 
              reverse PIN theft, or remote device hijack instructions. <strong>Do not proceed with any transfer.</strong>
            </p>
          </div>

          {/* Strongest Detected Warning Signs */}
          <div style={{ marginTop: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.65rem', fontSize: '1.05rem', fontWeight: 900, color: '#991b1b' }}>
              Severe Warning Signs Identified:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {warningSigns.map((w, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '1rem', 
                    background: '#ffffff', 
                    borderRadius: '8px', 
                    border: '2px solid #f87171' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 900, color: '#991b1b', fontSize: '1.02rem' }}>
                    <AlertOctagon size={20} color="#dc2626" />
                    <span>{w.title}</span>
                  </div>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.95rem', color: '#450a0a', lineHeight: 1.5 }}>
                    {w.description || w.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Verification via Independently Obtained Official Channel */}
          <div 
            style={{ 
              marginTop: '1.25rem', 
              padding: '1.1rem', 
              background: '#eff6ff', 
              border: '2px solid #3b82f6', 
              borderRadius: '10px' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#1d4ed8' }}>
              <PhoneCall size={20} />
              <span>Independently Obtained Official Verification Channel:</span>
            </div>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.95rem', color: '#1e3a8a', lineHeight: 1.5 }}>
              {meta.officialChannelAdvice}
            </p>
            <div style={{ marginTop: '0.65rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.95rem', fontWeight: 700 }}>
              <span style={{ color: '#1e40af' }}>📞 National Cyber Helpline: <strong>1930</strong></span>
              <span style={{ color: '#1e40af' }}>🌐 Portal: <strong>cybercrime.gov.in</strong></span>
            </div>
          </div>

          {/* Deliberate Safe Review Flow (No One-Click Bypass) */}
          <div 
            style={{ 
              marginTop: '1.5rem', 
              padding: '1.25rem', 
              background: '#ffffff', 
              border: '2px solid #dc2626', 
              borderRadius: '12px' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Lock size={20} color="#dc2626" />
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#991b1b' }}>
                Deliberate Safe Review Flow (No One-Click Bypass)
              </h4>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.92rem', color: '#7f1d1d' }}>
              To prevent accidental financial loss, you must complete this deliberate 2-step review before any demo action is allowed.
            </p>

            {criticalStep === 1 && (
              <div>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Step 1 of 2: Please confirm that you have read why this request is dangerous and will NOT share any PIN/OTP.
                </p>
                <div style={{ marginTop: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={criticalAcknowledged}
                      onChange={(e) => setCriticalAcknowledged(e.target.checked)}
                      style={{ width: '22px', height: '22px', marginTop: '0.1rem' }}
                    />
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#991b1b' }}>
                      I confirm that no legitimate entity requires me to enter a UPI PIN or share an OTP to receive money.
                    </span>
                  </label>
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setCriticalStep(2)}
                    disabled={!criticalAcknowledged}
                    style={{
                      padding: '0.65rem 1.4rem',
                      fontWeight: 800,
                      borderRadius: '8px',
                      background: criticalAcknowledged ? '#dc2626' : '#cbd5e1',
                      color: '#ffffff',
                      border: 'none',
                      cursor: criticalAcknowledged ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Proceed to Step 2
                  </button>
                </div>
              </div>
            )}

            {criticalStep === 2 && (
              <div>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#991b1b', fontWeight: 700 }}>
                  Step 2 of 2: Educational Sandbox Confirmation
                </p>
                <p style={{ margin: '0.35rem 0 0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Type <strong style={{ color: '#dc2626' }}>CANCEL</strong> to cancel safely, or type <strong style={{ color: '#334155' }}>DEMO TEST</strong> to run this simulation for training purposes:
                </p>
                <input 
                  type="text"
                  value={typedConfirmation}
                  onChange={(e) => setTypedConfirmation(e.target.value)}
                  placeholder="Type CANCEL or DEMO TEST"
                  aria-label="Type CANCEL or DEMO TEST to proceed"
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '2px solid #cbd5e1',
                    fontSize: '1rem',
                    fontWeight: 700,
                    width: '100%',
                    maxWidth: '300px'
                  }}
                />
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={onCancel}
                    style={{
                      padding: '0.65rem 1.25rem',
                      fontWeight: 800,
                      borderRadius: '8px',
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Cancel Payment Safely
                  </button>
                  {typedConfirmation.trim().toUpperCase() === 'DEMO TEST' && (
                    <button
                      type="button"
                      onClick={onProceed}
                      disabled={isSubmitting}
                      style={{
                        padding: '0.65rem 1.25rem',
                        fontWeight: 800,
                        borderRadius: '8px',
                        background: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Simulate Override (Educational Test Only)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Immediate Cancel Button */}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="action-btn cancel-btn"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.95rem 2rem',
                fontSize: '1.1rem',
                fontWeight: 900,
                borderRadius: '12px',
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <XCircle size={22} />
              <span>Cancel Payment Immediately</span>
            </button>
            {onGetSafetyAdvice && (
              <button
                type="button"
                className="action-btn"
                onClick={onGetSafetyAdvice}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.95rem 1.4rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: '2px solid #3b82f6',
                  color: '#2563eb',
                  cursor: 'pointer'
                }}
              >
                <PhoneCall size={18} />
                <span>Call 1930 Cyber Helpline Guide</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recommended Action Steps from Backend Assessment */}
      {safetyAdvice.length > 0 && (
        <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>
            SafePay Official Guidance:
          </strong>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {safetyAdvice.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '0.25rem' }}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
