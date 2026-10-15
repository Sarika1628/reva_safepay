import React, { useState } from 'react';
import { ShieldAlert, PhoneCall, Volume2, X, AlertTriangle } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useUser } from '../context/UserContext';

export default function ScamAlertModal({
  isOpen,
  onClose,
  interceptData,
  onConfirmOverride
}) {
  const { speak } = useAccessibility();
  const { activeUser } = useUser();
  const [calledCaregiver, setCalledCaregiver] = useState(false);
  const [allowOverride, setAllowOverride] = useState(false);

  if (!isOpen || !interceptData) return null;

  const {
    recipient_name,
    recipient_upi,
    amount,
    reasons = [],
    risk_score = 90,
    spoken_warning = "High risk scam intercepted"
  } = interceptData;

  const handleSimulateCall = () => {
    setCalledCaregiver(true);
    speak(`Calling your emergency contact, ${activeUser?.emergency_contact_name || 'Caregiver'}, at ${activeUser?.emergency_contact_phone}...`);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="scam-alert-title">
      <div className="modal-content" style={{ borderColor: 'var(--color-danger)', borderTopWidth: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-danger)' }}>
            <ShieldAlert size={36} />
            <h2 id="scam-alert-title" style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, margin: 0 }}>
              Payment Intercepted!
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '0.4rem', borderRadius: '50%', background: 'var(--bg-tertiary)' }}
            aria-label="Close alert"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'var(--color-danger)', marginBottom: '0.4rem' }}>
            SafePay Shield has blocked this payment to protect your funds.
          </p>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
            You were about to pay <strong>₹{Number(amount).toLocaleString('en-IN')}</strong> to <strong>{recipient_name || recipient_upi}</strong> ({recipient_upi}).
          </p>
          <button
            type="button"
            onClick={() => speak(spoken_warning, true)}
            className="btn-secondary"
            style={{ fontSize: 'var(--font-sm)', padding: '0.4rem 0.8rem' }}
          >
            <Volume2 size={16} />
            <span>Listen to Safety Warning</span>
          </button>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 800, marginBottom: '0.5rem' }}>
            Why SafePay flagged this transaction:
          </h3>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: 'var(--font-md)' }}>
            {reasons.map((r, i) => (
              <li key={i} style={{ marginBottom: '0.35rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Caregiver Helpline Box */}
        <div style={{ background: 'var(--bg-tertiary)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: '0.3rem' }}>
            Need help? Ask your trusted caregiver:
          </h4>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            {activeUser?.emergency_contact_name || 'Family Contact'} ({activeUser?.emergency_contact_phone || '+91 99001 99887'})
          </p>
          {calledCaregiver ? (
            <div style={{ color: 'var(--color-safe)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PhoneCall size={18} />
              <span>Simulated Call Connected to {activeUser?.emergency_contact_name}!</span>
            </div>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={handleSimulateCall}
              style={{ background: '#059669', width: '100%' }}
            >
              <PhoneCall size={18} />
              <span>Simulate Call to {activeUser?.emergency_contact_name || 'Caregiver'}</span>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-danger"
            onClick={onClose}
            style={{ width: '100%', fontSize: 'var(--font-lg)', padding: '1rem' }}
          >
            Cancel & Reject This Payment (Safest Choice)
          </button>

          {/* Test Demo Override */}
          <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-color)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-sm)', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={allowOverride}
                onChange={(e) => setAllowOverride(e.target.checked)}
              />
              <span>(Demo only) I understand this is simulated and want to override the shield</span>
            </label>
            {allowOverride && (
              <button
                type="button"
                className="btn-secondary"
                onClick={onConfirmOverride}
                style={{ width: '100%', marginTop: '0.5rem', color: 'var(--color-danger)' }}
              >
                Proceed Anyway (Simulated Risk Override)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
