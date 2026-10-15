import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Volume2, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Delete,
  AlertCircle,
  Mic,
  MicOff
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useAccessibility } from '../context/AccessibilityContext';

export default function EnterAmount({ recipient, onNext, onBack }) {
  const { activeUser } = useUser();
  const { speak, isListening, startSpeechRecognition, stopSpeechRecognition, triggerVisualAlert } = useAccessibility();
  const [amountStr, setAmountStr] = useState(recipient?.quick_amount ? String(recipient.quick_amount) : '');
  const [note, setNote] = useState(recipient?.quick_phrase || '');
  const [error, setError] = useState(null);
  const [voiceNotice, setVoiceNotice] = useState(null);

  const quickAmounts = [50, 100, 250, 500, 1000, 2000];
  const quickNotes = ["Daily Milk", "Medicine Tablets", "Groceries", "Auto Fare", "Pocket Allowance", "Consultation Fee"];

  const handleVoiceInput = () => {
    if (isListening) {
      stopSpeechRecognition();
      return;
    }

    setVoiceNotice("Listening for amount (e.g. say 'one hundred fifty' or '150')...");
    speak("Please speak the amount you want to pay.");

    startSpeechRecognition(
      (transcript) => {
        // Extract numbers from transcript
        const match = transcript.match(/\d+(\.\d+)?/);
        if (match) {
          const val = match[0];
          setAmountStr(val);
          setError(null);
          const notice = `Voice recognized: ₹${val}. Please review and confirm the amount. Voice alone will NEVER send payments.`;
          setVoiceNotice(notice);
          speak(notice);
          triggerVisualAlert('info', `Voice recognized: ₹${val}`);
        } else {
          setVoiceNotice(`Could not detect numeric amount from: "${transcript}". Please type using keypad.`);
          speak("Could not detect number. Please type.");
        }
      },
      (err) => {
        setVoiceNotice(err);
        triggerVisualAlert('warning', err);
      }
    );
  };

  const handleKeypadPress = (val) => {
    setError(null);
    if (val === 'DEL') {
      setAmountStr(prev => prev.slice(0, -1));
    } else if (val === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr(prev => (prev || '0') + '.');
      }
    } else {
      if (amountStr.length < 7) {
        setAmountStr(prev => (prev === '0' ? String(val) : prev + String(val)));
      }
    }
  };

  const handleReadAmountAloud = () => {
    const val = parseFloat(amountStr);
    if (!val || isNaN(val)) {
      speak("Please enter an amount first.");
    } else {
      speak(`Amount entered is ${val} rupees for ${recipient?.name || 'recipient'}.`, true);
    }
  };

  const handleProceed = () => {
    const num = parseFloat(amountStr);
    if (!num || num <= 0) {
      setError("Please enter a valid payment amount greater than zero.");
      speak("Please enter an amount.");
      return;
    }

    if (activeUser && num > activeUser.balance) {
      setError(`Amount exceeds your simulated balance of ₹${activeUser.balance.toLocaleString('en-IN')}.`);
      speak("Insufficient simulated balance.");
      return;
    }

    speak(`Reviewing payment of ${num} rupees to ${recipient?.name}.`);
    onNext({
      amount: num,
      note: note || `Payment to ${recipient?.name}`
    });
  };

  return (
    <div className="enter-amount-page" style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onBack}
          style={{ fontSize: 'var(--font-sm)', padding: '0.4rem 0.8rem' }}
        >
          <ArrowLeft size={16} />
          <span>Change Recipient</span>
        </button>
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
          Step 2 of 4: Amount
        </span>
      </div>

      {/* Recipient Selected Summary */}
      <div style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="contact-avatar" style={{ width: '44px', height: '44px' }}>
            {recipient?.name ? recipient.name.charAt(0) : 'P'}
          </div>
          <div>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', display: 'block' }}>Paying to:</span>
            <strong style={{ fontSize: 'var(--font-lg)', color: 'var(--text-primary)' }}>{recipient?.name}</strong>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', display: 'block' }}>{recipient?.upi_id}</span>
          </div>
        </div>

        <span style={{ background: 'var(--color-safe-bg)', color: 'var(--color-safe)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-sm)', fontWeight: 800 }}>
          ✓ Verified
        </span>
      </div>

      {/* Big High-Contrast Amount Box */}
      <div className="card" style={{ textAlign: 'center', padding: '1.75rem', marginBottom: '1.25rem', border: '3px solid var(--color-brand)' }}>
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Enter Amount
        </span>

        <div style={{ fontSize: 'clamp(2.5rem, 7vw, 4rem)', fontWeight: 900, color: 'var(--color-brand)', letterSpacing: '-0.02em', margin: '0.5rem 0' }}>
          ₹{amountStr || '0'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
            Simulated Balance: ₹{activeUser?.balance ? activeUser.balance.toLocaleString('en-IN') : '0'}
          </span>
          <button
            type="button"
            onClick={handleReadAmountAloud}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-brand)', fontWeight: 700, fontSize: 'var(--font-sm)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <Volume2 size={16} />
            <span>Listen</span>
          </button>
          <button
            type="button"
            onClick={handleVoiceInput}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              color: isListening ? '#ef4444' : 'var(--color-brand)',
              fontWeight: 800,
              fontSize: 'var(--font-sm)',
              background: isListening ? '#fef2f2' : 'var(--bg-tertiary)',
              padding: '0.3rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid currentColor',
              cursor: 'pointer'
            }}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            <span>{isListening ? 'Listening...' : 'Speak Amount (Voice)'}</span>
          </button>
        </div>

        {voiceNotice && (
          <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: '#eff6ff', borderRadius: 'var(--radius-sm)', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: 'var(--font-sm)', fontWeight: 600 }}>
            🎙️ {voiceNotice}
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: 'var(--font-md)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Quick Chips */}
      <div style={{ marginBottom: '1.25rem' }}>
        <span style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
          Quick Amount Buttons:
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {quickAmounts.map((q) => (
            <button
              key={q}
              type="button"
              className="toggle-chip"
              onClick={() => {
                setAmountStr(String(q));
                setError(null);
                speak(`${q} rupees`);
              }}
              style={{ padding: '0.5rem 0.9rem', fontSize: 'var(--font-md)', fontWeight: 700 }}
            >
              + ₹{q}
            </button>
          ))}
          <button
            type="button"
            className="toggle-chip"
            onClick={() => { setAmountStr(''); setError(null); }}
            style={{ padding: '0.5rem 0.9rem', color: 'var(--color-danger)' }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Note / Purpose Input & Suggestions */}
      <div style={{ marginBottom: '1.75rem' }}>
        <label style={{ display: 'block', fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: '0.4rem' }}>
          What is this payment for? (Optional):
        </label>
        <input
          type="text"
          placeholder="e.g. Daily milk bill"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ width: '100%', padding: '0.85rem', fontSize: 'var(--font-md)', borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)', marginBottom: '0.5rem' }}
        />
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {quickNotes.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNote(n)}
              style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Large Accessible Keypad */}
      <div style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'DEL'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeypadPress(k)}
              style={{
                padding: '1.1rem',
                fontSize: 'var(--font-2xl)',
                fontWeight: 800,
                borderRadius: 'var(--radius-md)',
                background: k === 'DEL' ? 'var(--color-danger-bg)' : 'var(--bg-tertiary)',
                color: k === 'DEL' ? 'var(--color-danger)' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              {k === 'DEL' ? <Delete size={24} style={{ margin: '0 auto' }} /> : k}
            </button>
          ))}
        </div>
      </div>

      {/* Next Button */}
      <button
        type="button"
        className="btn-primary"
        onClick={handleProceed}
        style={{ width: '100%', fontSize: 'var(--font-xl)', padding: '1.25rem' }}
      >
        <span>Review & Confirm Payment (₹{amountStr || '0'})</span>
        <ArrowRight size={24} />
      </button>
    </div>
  );
}
