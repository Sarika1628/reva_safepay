import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Volume2, 
  ShieldCheck, 
  AlertTriangle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAccessibility } from '../context/AccessibilityContext';
import api from '../services/api';

export default function PracticeSandbox() {
  const { speak, triggerVisualAlert } = useAccessibility();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getPracticeScenarios()
      .then((data) => setScenarios(data))
      .catch((err) => console.error('Failed to load scenarios:', err))
      .finally(() => setLoading(false));
  }, []);

  const current = scenarios[activeScenarioIndex];

  const handleDecision = async (action) => {
    if (!current) return;
    setSubmitting(true);
    try {
      const res = await api.verifyPracticeDecision(current.id, action);
      setResult(res);

      if (res.is_correct) {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } catch (e) {}
        speak(`Correct! ${res.feedback}`, true);
        triggerVisualAlert('success', 'Practice Challenge Solved Correctly!');
      } else {
        speak(`Notice: ${res.feedback}`, true);
        triggerVisualAlert('danger', 'Check the safety rule explanation');
      }
    } catch (err) {
      alert('Verification error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    setResult(null);
    setShowHint(false);
    const nextIdx = (activeScenarioIndex + 1) % scenarios.length;
    setActiveScenarioIndex(nextIdx);
    speak(`Scenario ${nextIdx + 1}: ${scenarios[nextIdx]?.title}`);
  };

  const handleReadScenario = () => {
    if (!current) return;
    const speech = `Scenario ${activeScenarioIndex + 1}: ${current.title}. ${current.sender_or_recipient} is requesting ${current.amount} rupees. Note: ${current.message}. Would you approve this payment or reject it as a scam?`;
    speak(speech, true);
  };

  return (
    <div className="practice-page">
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: 'var(--font-2xl)' }}>
            <GraduationCap size={32} color="#2563eb" />
            <span>Senior Payment Practice Sandbox</span>
          </h2>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            A 100% safe practice simulator. Learn to spot scams and pay vendors with zero risk.
          </p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading practice exercises...</p>
      ) : !current ? (
        <p style={{ color: 'var(--text-muted)' }}>No practice scenarios available.</p>
      ) : (
        <div className="card" style={{ maxWidth: '850px', margin: '0 auto' }}>
          {/* Progress Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: 'var(--font-md)', fontWeight: 800, color: 'var(--color-brand)' }}>
              Scenario {activeScenarioIndex + 1} of {scenarios.length}
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleReadScenario}
              style={{ fontSize: 'var(--font-sm)', padding: '0.35rem 0.75rem' }}
            >
              <Volume2 size={16} />
              <span>Read Scenario Aloud</span>
            </button>
          </div>

          {/* Scenario Details */}
          <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: '0.75rem' }}>
            {current.title}
          </h3>

          <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '2px solid var(--border-color)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', display: 'block' }}>Requester:</span>
                <strong style={{ fontSize: 'var(--font-lg)' }}>{current.sender_or_recipient}</strong>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', display: 'block' }}>UPI ID:</span>
                <strong style={{ fontSize: 'var(--font-md)', fontFamily: 'monospace' }}>{current.vpa}</strong>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', display: 'block' }}>Amount Requested:</span>
                <strong style={{ fontSize: 'var(--font-xl)', color: 'var(--color-brand)' }}>₹{current.amount}</strong>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', display: 'block' }}>Message attached to payment:</span>
              <p style={{ fontSize: 'var(--font-lg)', fontWeight: 700, margin: '0.3rem 0 0', color: 'var(--text-primary)' }}>
                "{current.message}"
              </p>
            </div>
          </div>

          {/* Hint Accordion */}
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => {
                setShowHint(!showHint);
                if (!showHint) speak(`Hint: ${current.hints}`);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-brand)', fontWeight: 700, fontSize: 'var(--font-md)' }}
            >
              <HelpCircle size={18} />
              <span>{showHint ? 'Hide Clue / Hint' : 'Need a clue? Tap here for safety hint'}</span>
            </button>
            {showHint && (
              <p style={{ background: 'var(--color-brand-light)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem', fontSize: 'var(--font-md)', color: 'var(--text-primary)' }}>
                💡 <strong>Safety Tip:</strong> {current.hints}
              </p>
            )}
          </div>

          {/* Interactive Decision Buttons */}
          {!result ? (
            <div>
              <p style={{ fontSize: 'var(--font-lg)', fontWeight: 800, textAlign: 'center', marginBottom: '1rem' }}>
                What would you do?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleDecision('APPROVE')}
                  disabled={submitting}
                  style={{ background: 'var(--color-safe)', fontSize: 'var(--font-lg)', padding: '1.2rem' }}
                >
                  <CheckCircle2 size={24} />
                  <span>Approve & Pay (Safe)</span>
                </button>

                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => handleDecision('REJECT_AND_REPORT')}
                  disabled={submitting}
                  style={{ fontSize: 'var(--font-lg)', padding: '1.2rem' }}
                >
                  <XCircle size={24} />
                  <span>Reject & Report Scam</span>
                </button>
              </div>
            </div>
          ) : (
            /* Result and Key Learning Explanation */
            <div style={{ animation: 'slideDownPulse 0.3s ease-out' }}>
              <div
                style={{
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem',
                  background: result.is_correct ? 'var(--color-safe-bg)' : 'var(--color-danger-bg)',
                  border: `2px solid ${result.is_correct ? 'var(--color-safe-border)' : 'var(--color-danger-border)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                  {result.is_correct ? (
                    <CheckCircle2 size={32} color="var(--color-safe)" />
                  ) : (
                    <XCircle size={32} color="var(--color-danger)" />
                  )}
                  <h4 style={{ fontSize: 'var(--font-xl)', fontWeight: 900, color: result.is_correct ? 'var(--color-safe)' : 'var(--color-danger)', margin: 0 }}>
                    {result.is_correct ? 'CORRECT DECISION!' : 'NOT QUITE RIGHT'}
                  </h4>
                </div>

                <p style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
                  {result.feedback}
                </p>

                <div style={{ borderTop: '1px dashed currentColor', paddingTop: '0.6rem' }}>
                  <strong style={{ fontSize: 'var(--font-sm)', display: 'block', marginBottom: '0.2rem' }}>
                    Golden Rule Takeaway:
                  </strong>
                  <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', margin: 0 }}>
                    {result.key_safety_takeaway}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={handleNext}
                style={{ width: '100%', fontSize: 'var(--font-lg)', padding: '1.1rem' }}
              >
                <span>Next Practice Challenge</span>
                <ArrowRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
