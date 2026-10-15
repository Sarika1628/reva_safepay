import React, { useState } from 'react';
import { AlertOctagon, Lock, Unlock, PhoneCall, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useAccessibility } from '../context/AccessibilityContext';

export default function EmergencyFreezeModal({ isOpen, onClose }) {
  const { activeUser, emergencyFreeze, unfreezeWallet } = useUser();
  const { speak } = useAccessibility();
  const [selectedReason, setSelectedReason] = useState('Suspected fraudulent phone call or fake electricity warning');
  const [submitting, setSubmitting] = useState(false);
  const [freezeResult, setFreezeResult] = useState(null);

  if (!isOpen) return null;

  const reasons = [
    'Suspected fraudulent phone call or fake electricity warning',
    'Someone asked me to install AnyDesk or screen sharing app',
    'Someone asked for UPI PIN to receive money or prize',
    'Lost phone or suspect unauthorized attempt',
    'General safety precaution'
  ];

  const handleFreeze = async () => {
    setSubmitting(true);
    try {
      const result = await emergencyFreeze(selectedReason);
      setFreezeResult(result);
    } catch (err) {
      alert('Freeze failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnfreeze = async () => {
    setSubmitting(true);
    try {
      await unfreezeWallet();
      setFreezeResult(null);
      onClose();
    } catch (err) {
      alert('Unfreeze failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="emergency-modal-title">
      <div className="modal-content" style={{ borderColor: 'var(--color-danger)', borderTopWidth: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-danger)' }}>
            <AlertOctagon size={32} />
            <h2 id="emergency-modal-title" style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: 0 }}>
              Emergency SOS Security
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '0.4rem', borderRadius: '50%', background: 'var(--bg-tertiary)' }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {activeUser?.is_frozen ? (
          /* WALLET IS CURRENTLY FROZEN */
          <div>
            <div style={{ background: 'var(--color-danger-bg)', border: '2px solid var(--color-danger)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '1.5rem' }}>
              <Lock size={48} color="var(--color-danger)" style={{ marginBottom: '0.5rem' }} />
              <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 900, color: 'var(--color-danger)', marginBottom: '0.4rem' }}>
                Simulated Wallet is LOCKED
              </h3>
              <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-primary)' }}>
                All outgoing payments are stopped to protect your simulated account.
              </p>
              {activeUser?.freeze_reason && (
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Lock Reason: "{activeUser.freeze_reason}"
                </p>
              )}
            </div>

            <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 800, marginBottom: '0.5rem' }}>
                Your Emergency Contacts:
              </h4>
              <p style={{ fontSize: 'var(--font-md)', marginBottom: '0.5rem' }}>
                Family: <strong>{activeUser?.emergency_contact_name}</strong> ({activeUser?.emergency_contact_phone})
              </p>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                National Cyber Crime Helpline: <strong>1930</strong> (Free 24x7)
              </p>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                Senior Citizen Elderline: <strong>14567</strong>
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={handleUnfreeze}
              disabled={submitting}
              style={{ width: '100%', fontSize: 'var(--font-lg)', background: 'var(--color-safe)' }}
            >
              <Unlock size={20} />
              <span>{submitting ? 'Unlocking...' : 'Unlock My Wallet (I am Safe)'}</span>
            </button>
          </div>
        ) : (
          /* WALLET IS ACTIVE - CAN FREEZE */
          <div>
            <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              If you feel someone is pressuring you or trying to scam you, click below to immediately lock all outgoing payments and notify your family caregiver.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: 'var(--font-md)' }}>
                What happened? (Select reason):
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {reasons.map((r, i) => (
                  <label
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: selectedReason === r ? 'var(--color-brand-light)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: 'var(--font-sm)',
                      fontWeight: selectedReason === r ? 700 : 500
                    }}
                  >
                    <input
                      type="radio"
                      name="freeze-reason"
                      checked={selectedReason === r}
                      onChange={() => setSelectedReason(r)}
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="btn-danger"
              onClick={handleFreeze}
              disabled={submitting}
              style={{ width: '100%', fontSize: 'var(--font-lg)', padding: '1.1rem' }}
            >
              <Lock size={22} />
              <span>{submitting ? 'Locking Wallet...' : 'FREEZE MY WALLET NOW'}</span>
            </button>
          </div>
        )}

        <button
          type="button"
          className="btn-secondary"
          onClick={onClose}
          style={{ width: '100%', marginTop: '0.75rem' }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
