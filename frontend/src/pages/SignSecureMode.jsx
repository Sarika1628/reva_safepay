import React, { useState } from 'react';
import { 
  Sparkles, 
  Eye, 
  MessageSquare, 
  Maximize2, 
  CheckCircle2, 
  AlertTriangle, 
  VolumeX, 
  Smartphone,
  X
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function SignSecureMode() {
  const { triggerVisualAlert } = useAccessibility();
  const [fullscreenPhrase, setFullscreenPhrase] = useState(null);

  const signCards = [
    {
      title: "Daily Cow Milk",
      amount: "₹150",
      signLabel: "🥛 Drink / Milk Gesture",
      phrase: "Paying ₹150 for today's fresh cow milk.",
      color: "#059669"
    },
    {
      title: "Auto Rickshaw Fare",
      amount: "₹80",
      signLabel: "🛺 Vehicle / Drive Gesture",
      phrase: "Paying ₹80 auto rickshaw fare via EasyPay.",
      color: "#d97706"
    },
    {
      title: "Pharmacy Tablets",
      amount: "₹650",
      signLabel: "💊 Medicine / Health Gesture",
      phrase: "Paying ₹650 for prescription blood pressure tablets.",
      color: "#2563eb"
    },
    {
      title: "Grocery Essentials",
      amount: "₹320",
      signLabel: "🛒 Food / Bag Gesture",
      phrase: "Paying ₹320 for kitchen groceries and vegetables.",
      color: "#7c3aed"
    }
  ];

  const handleTestVisualPulse = (type) => {
    triggerVisualAlert(type, type === 'danger' ? 'VISUAL ALERT: STOP! Do not pay!' : 'VISUAL CONFIRMATION: Safe & Verified');
  };

  return (
    <div className="sign-secure-page" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: 'var(--font-2xl)' }}>
            <Sparkles size={32} color="#059669" />
            <span>Sign & Secure Accessibility Mode</span>
          </h2>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Specially designed for Deaf, Hard-of-Hearing, and Non-speaking users. Zero audio dependency.
          </p>
        </div>
      </div>

      {/* Visual Principles Banner */}
      <div className="card" style={{ background: '#ecfdf5', border: '2px solid #6ee7b7', padding: '1.5rem', marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: '#065f46', marginBottom: '0.75rem' }}>
          🤟 Visual-First Accessibility Features Active:
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: 'var(--font-md)', color: '#064e3b' }}>
          <div>✓ Screen border flash on all safety alerts</div>
          <div>✓ Color-coded visual badges (Green / Red)</div>
          <div>✓ Haptic pulse simulation on mobile devices</div>
          <div>✓ Huge fullscreen cards for shopkeepers</div>
        </div>
      </div>

      {/* Test Visual Flashes */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <h3 className="card-title" style={{ fontSize: 'var(--font-lg)', marginBottom: '0.75rem' }}>
          Test Visual Alerts (For Deaf Users):
        </h3>
        <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Click below to see how EasyPay flashes the top of the screen instead of relying on audio sounds:
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => handleTestVisualPulse('success')}
            style={{ background: 'var(--color-safe)' }}
          >
            <CheckCircle2 size={18} />
            <span>Test Green Visual Confirmation</span>
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => handleTestVisualPulse('danger')}
          >
            <AlertTriangle size={18} />
            <span>Test Red Scam Intercept Flash</span>
          </button>
        </div>
      </div>

      {/* Non-Speaking Shopkeeper Cards */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title" style={{ fontSize: 'var(--font-xl)', marginBottom: '0.75rem' }}>
          One-Tap Cards to Show Shopkeepers:
        </h3>
        <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Tap "Show Fullscreen" to display huge bold text directly to the vendor across the counter:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {signCards.map((c, i) => (
            <div
              key={i}
              className="card"
              style={{ margin: 0, borderLeft: `8px solid ${c.color}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {c.signLabel}
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.4rem 0' }}>
                  <strong style={{ fontSize: 'var(--font-lg)' }}>{c.title}</strong>
                  <strong style={{ fontSize: 'var(--font-xl)', color: c.color }}>{c.amount}</strong>
                </div>
                <p style={{ background: 'var(--bg-tertiary)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', fontStyle: 'italic', fontSize: 'var(--font-md)', marginBottom: '1rem' }}>
                  "{c.phrase}"
                </p>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setFullscreenPhrase(c)}
                style={{ background: c.color, fontSize: 'var(--font-sm)', padding: '0.6rem' }}
              >
                <Maximize2 size={16} />
                <span>Show Fullscreen to Shopkeeper</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Display Modal */}
      {fullscreenPhrase && (
        <div className="modal-overlay" style={{ background: '#000000', padding: '1.5rem' }}>
          <div style={{ width: '100%', maxWidth: '800px', textAlign: 'center', color: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
              <button
                type="button"
                onClick={() => setFullscreenPhrase(null)}
                style={{ background: '#333333', color: '#ffffff', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: 'var(--font-lg)' }}
              >
                <X size={24} /> Close Fullscreen
              </button>
            </div>

            <p style={{ fontSize: '1.25rem', color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, marginBottom: '1rem' }}>
              PLEASE READ THIS PAYMENT MESSAGE:
            </p>

            <div style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.25, marginBottom: '2rem', padding: '1.5rem', background: '#111827', borderRadius: 'var(--radius-lg)', border: '4px solid #facc15' }}>
              {fullscreenPhrase.phrase}
            </div>

            <div style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: 900, color: '#4ade80' }}>
              {fullscreenPhrase.amount}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
