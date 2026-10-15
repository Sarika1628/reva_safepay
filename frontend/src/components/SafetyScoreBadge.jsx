import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Volume2, CheckCircle2, XCircle } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function SafetyScoreBadge({ assessment }) {
  const { speak } = useAccessibility();

  if (!assessment) return null;

  const {
    risk_score,
    risk_level,
    recommended_action,
    spoken_warning,
    is_trusted_contact,
    is_known_scam,
    flags = [],
    matched_scam_pattern
  } = assessment;

  const isSafe = risk_level === 'SAFE';
  const isCaution = risk_level === 'CAUTION';
  const isDanger = risk_level === 'HIGH_RISK_SCAM';

  const meterClass = isSafe ? 'safe' : isCaution ? 'caution' : 'danger';

  return (
    <div className={`risk-meter ${meterClass}`} role="status" aria-live="polite">
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        {isSafe && <ShieldCheck size={36} color="var(--color-safe)" />}
        {isCaution && <AlertTriangle size={36} color="var(--color-caution)" />}
        {isDanger && <ShieldAlert size={36} color="var(--color-danger)" />}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h4 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, margin: 0 }}>
              {isSafe && 'Verified Safe to Pay'}
              {isCaution && 'Caution: Unverified or New Recipient'}
              {isDanger && 'CRITICAL SCAM ALERT DETECTED'}
            </h4>
            <span
              style={{
                fontSize: 'var(--font-sm)',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(0,0,0,0.1)',
                border: '1px solid currentColor'
              }}
            >
              Risk Score: {risk_score}/100
            </span>
          </div>

          <button
            type="button"
            onClick={() => speak(spoken_warning, true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              background: 'currentColor',
              color: 'var(--bg-secondary)',
              fontWeight: 700,
              fontSize: 'var(--font-sm)'
            }}
            title="Read safety report aloud"
          >
            <Volume2 size={16} />
            <span>Read Warning Aloud</span>
          </button>
        </div>

        <p style={{ marginTop: '0.5rem', marginBottom: '0.6rem', fontSize: 'var(--font-md)', fontWeight: 500 }}>
          {spoken_warning}
        </p>

        {is_trusted_contact && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-safe)', fontWeight: 700 }}>
            <CheckCircle2 size={18} />
            <span>Matched in your Verified Family & Vendor Directory</span>
          </div>
        )}

        {is_known_scam && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-danger)', fontWeight: 800 }}>
            <XCircle size={18} />
            <span>Matched Known Blacklisted Scammer Database</span>
          </div>
        )}

        {flags.length > 0 && (
          <div style={{ marginTop: '0.75rem', borderTop: '1px dashed currentColor', paddingTop: '0.5rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.3rem', fontSize: 'var(--font-sm)' }}>
              Safety Reasons Detected:
            </strong>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: 'var(--font-sm)' }}>
              {flags.map((flag, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>
                  <strong>{flag.title}:</strong> {flag.description}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
