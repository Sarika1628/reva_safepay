import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Eye, 
  Volume2, 
  MessageSquare, 
  CheckCircle2, 
  ArrowRight,
  UserCheck,
  HeartHandshake
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useAccessibility } from '../context/AccessibilityContext';

export default function Onboarding({ onComplete }) {
  const { users, activeUser, switchUser } = useUser();
  const { 
    fontSize, 
    setFontSize, 
    contrastMode, 
    setContrastMode, 
    voiceEnabled, 
    setVoiceEnabled, 
    speak 
  } = useAccessibility();

  const [step, setStep] = useState(1);

  const handleTestVoice = () => {
    speak("Hello and welcome! This is the voice assistant for EasyPay and SafePay. It helps you read warnings, check payment amounts, and stay safe.", true);
  };

  return (
    <div className="onboarding-page" style={{ maxWidth: '800px', margin: '1rem auto' }}>
      {/* Step Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 800,
              fontSize: 'var(--font-md)',
              color: step === s ? 'var(--color-brand)' : step > s ? 'var(--color-safe)' : 'var(--text-muted)'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: step === s ? 'var(--color-brand)' : step > s ? 'var(--color-safe-bg)' : 'var(--bg-tertiary)',
                color: step === s ? '#ffffff' : step > s ? 'var(--color-safe)' : 'var(--text-muted)',
                border: '2px solid currentColor'
              }}
            >
              {step > s ? '✓' : s}
            </div>
            <span>
              {s === 1 && 'Choose Profile'}
              {s === 2 && 'Readability'}
              {s === 3 && 'Safety Assurance'}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1: CHOOSE PROFILE */}
      {step === 1 && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div className="brand-logo-badge" style={{ margin: '0 auto 1rem', width: '56px', height: '56px' }}>
              <ShieldCheck size={32} />
            </div>
            <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, marginBottom: '0.4rem' }}>
              Welcome to EasyPay & SafePay
            </h2>
            <p style={{ fontSize: 'var(--font-lg)', color: 'var(--text-muted)' }}>
              Select a demo persona that best matches how you want to experience the app:
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {users.map((u) => {
              const isSelected = activeUser?.id === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => switchUser(u.id)}
                  style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: `3px solid ${isSelected ? 'var(--color-brand)' : 'var(--border-color)'}`,
                    background: isSelected ? 'var(--color-brand-light)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'none'
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <strong style={{ fontSize: 'var(--font-lg)', color: 'var(--text-primary)' }}>{u.name}</strong>
                    {isSelected && <CheckCircle2 size={22} color="var(--color-brand)" />}
                  </div>
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--color-brand)', display: 'block', marginBottom: '0.5rem' }}>
                    {u.persona}
                  </span>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {u.bio}
                  </p>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setStep(2);
              speak("Step 2: Customize text size and high contrast visibility.");
            }}
            style={{ width: '100%', fontSize: 'var(--font-lg)', padding: '1.1rem' }}
          >
            <span>Continue to Readability Setup</span>
            <ArrowRight size={20} />
          </button>
        </div>
      )}

      {/* STEP 2: READABILITY & ACCESSIBILITY SETUP */}
      {step === 2 && (
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, marginBottom: '0.5rem' }}>
            Customize for Comfort & Clarity
          </h2>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
            Adjust text size and contrast to make digital payments stress-free.
          </p>

          {/* Text Size Presets */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontWeight: 800, fontSize: 'var(--font-lg)', marginBottom: '0.75rem' }}>
              1. Choose Text Size:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                className={`toggle-chip ${fontSize === 'standard' ? 'active' : ''}`}
                onClick={() => setFontSize('standard')}
                style={{ justifyContent: 'center', padding: '1rem', fontSize: '1rem', fontWeight: 700 }}
              >
                Standard (16px)
              </button>
              <button
                type="button"
                className={`toggle-chip ${fontSize === 'large' ? 'active' : ''}`}
                onClick={() => setFontSize('large')}
                style={{ justifyContent: 'center', padding: '1rem', fontSize: '1.15rem', fontWeight: 800 }}
              >
                Large (19px) ★
              </button>
              <button
                type="button"
                className={`toggle-chip ${fontSize === 'xlarge' ? 'active' : ''}`}
                onClick={() => setFontSize('xlarge')}
                style={{ justifyContent: 'center', padding: '1rem', fontSize: '1.35rem', fontWeight: 900 }}
              >
                Extra Large (22px)
              </button>
            </div>
          </div>

          {/* Contrast Mode */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontWeight: 800, fontSize: 'var(--font-lg)', marginBottom: '0.75rem' }}>
              2. Contrast Theme:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <button
                type="button"
                className={`toggle-chip ${contrastMode === 'normal' ? 'active' : ''}`}
                onClick={() => setContrastMode('normal')}
                style={{ justifyContent: 'center', padding: '0.9rem' }}
              >
                Clean Banking Blue
              </button>
              <button
                type="button"
                className={`toggle-chip ${contrastMode === 'high-contrast' ? 'active' : ''}`}
                onClick={() => setContrastMode('high-contrast')}
                style={{ justifyContent: 'center', padding: '0.9rem', fontWeight: 800 }}
              >
                <Eye size={18} />
                High Contrast (Yellow/Black)
              </button>
              <button
                type="button"
                className={`toggle-chip ${contrastMode === 'dark' ? 'active' : ''}`}
                onClick={() => setContrastMode('dark')}
                style={{ justifyContent: 'center', padding: '0.9rem' }}
              >
                Dark Navy Mode
              </button>
            </div>
          </div>

          {/* Voice Narration Test */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <strong style={{ fontSize: 'var(--font-md)', display: 'block' }}>
                  Spoken Voice Assistance (Web Speech)
                </strong>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                  Speaks out scam warnings, receipt details, and button names.
                </span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleTestVoice}
              >
                <Volume2 size={18} />
                <span>Test Speaker Sound</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setStep(3);
                speak("Step 3: Our strict educational safety guarantee.");
              }}
              style={{ fontSize: 'var(--font-lg)', padding: '1.1rem' }}
            >
              <span>Next: Safety Guarantee</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SAFETY ASSURANCE & LAUNCH */}
      {step === 3 && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--color-safe-bg)', color: 'var(--color-safe)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <HeartHandshake size={42} />
          </div>

          <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, marginBottom: '0.5rem' }}>
            Our 100% Zero-Loss Safety Promise
          </h2>
          <p style={{ fontSize: 'var(--font-lg)', color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
            EasyPay & SafePay is built from the ground up to protect you from digital financial anxiety.
          </p>

          <div style={{ background: 'var(--color-safe-bg)', border: '2px solid var(--color-safe-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'left', marginBottom: '2rem', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <CheckCircle2 size={22} color="var(--color-safe)" style={{ flexShrink: 0 }} />
              <div>
                <strong>Zero Real Money at Risk:</strong> All transactions are simulated with synthetic currency so you can learn without fear.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <CheckCircle2 size={22} color="var(--color-safe)" style={{ flexShrink: 0 }} />
              <div>
                <strong>No Real Bank Passwords or PINs:</strong> We never ask for or store bank credentials or OTPs.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <CheckCircle2 size={22} color="var(--color-safe)" style={{ flexShrink: 0 }} />
              <div>
                <strong>Instant Caregiver Lock:</strong> The Emergency SOS button instantly freezes the demo wallet and alerts your family.
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setStep(2)}>
              ← Back
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={onComplete}
              style={{ fontSize: 'var(--font-xl)', padding: '1.2rem', background: 'var(--color-safe)' }}
            >
              <span>Enter Main Dashboard</span>
              <ArrowRight size={22} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
