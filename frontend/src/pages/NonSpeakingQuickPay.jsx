import React, { useState } from 'react';
import { 
  MessageSquare, 
  Volume2, 
  Maximize2, 
  Send, 
  CheckCircle2, 
  Truck, 
  Coffee, 
  ShoppingBag, 
  Pill, 
  UserCheck, 
  Stethoscope,
  X
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useUser } from '../context/UserContext';

export default function NonSpeakingQuickPay({ onSelectForPayment }) {
  const { speak } = useAccessibility();
  const { activeUser } = useUser();
  const [fullscreenPhrase, setFullscreenPhrase] = useState(null);
  const [customPhrase, setCustomPhrase] = useState('');
  const [customAmount, setCustomAmount] = useState('');

  const quickCards = [
    {
      title: 'Morning Milk Vendor',
      amount: 150,
      vpa: 'gopal.dairy@paytm',
      icon: Coffee,
      color: '#059669',
      phrase: 'Hello, I am paying 150 rupees for today\'s fresh milk.'
    },
    {
      title: 'Auto Rickshaw Driver',
      amount: 80,
      vpa: 'raju.auto@icici',
      icon: Truck,
      color: '#d97706',
      phrase: 'Namaste Driver. Paying 80 rupees auto fare via EasyPay.'
    },
    {
      title: 'Chemist & Medicine Shop',
      amount: 650,
      vpa: 'sanjivani.meds@okhdfcbank',
      icon: Pill,
      color: '#2563eb',
      phrase: 'Paying 650 rupees for monthly BP and sugar tablets.'
    },
    {
      title: 'Neighborhood Kirana Grocery',
      amount: 320,
      vpa: 'sharma.groceries@paytm',
      icon: ShoppingBag,
      color: '#7c3aed',
      phrase: 'Paying 320 rupees for daily vegetables and wheat flour.'
    },
    {
      title: 'Doctor Clinic Consultation',
      amount: 400,
      vpa: 'dr.kulkarni@sbi',
      icon: Stethoscope,
      color: '#0891b2',
      phrase: 'Paying 400 rupees for doctor health checkup fee.'
    },
    {
      title: 'Family Allowance to Daughter',
      amount: 2000,
      vpa: 'pooja.sharma@okaxis',
      icon: UserCheck,
      color: '#db2777',
      phrase: 'Sending 2000 rupees to daughter Pooja with love.'
    }
  ];

  const handleSpeakPhrase = (phrase) => {
    speak(phrase, true);
  };

  const handleShowFullscreen = (card) => {
    setFullscreenPhrase(card);
    speak(card.phrase, true);
  };

  const handleCustomSpeak = () => {
    if (!customPhrase) return;
    speak(customPhrase, true);
  };

  const handleCustomFullscreen = () => {
    if (!customPhrase) return;
    setFullscreenPhrase({
      title: 'Vendor Message',
      amount: customAmount ? Number(customAmount) : null,
      phrase: customPhrase,
      vpa: ''
    });
    speak(customPhrase, true);
  };

  return (
    <div className="non-speaking-page">
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: 'var(--font-2xl)' }}>
            <MessageSquare size={32} color="#059669" />
            <span>Non-Speaking Assistant & Quick Phrases</span>
          </h2>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Tap any card to speak out loud to the vendor or show huge text on your screen.
          </p>
        </div>
      </div>

      {/* Quick Phrase Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {quickCards.map((card, idx) => {
          const IconComp = card.icon;
          return (
            <div
              key={idx}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: `8px solid ${card.color}`,
                margin: 0
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: `${card.color}20`, color: card.color }}>
                      <IconComp size={24} />
                    </div>
                    <strong style={{ fontSize: 'var(--font-lg)' }}>{card.title}</strong>
                  </div>
                  <span style={{ fontSize: 'var(--font-xl)', fontWeight: 900, color: card.color }}>
                    ₹{card.amount}
                  </span>
                </div>

                <p style={{ background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontStyle: 'italic', fontSize: 'var(--font-md)', color: 'var(--text-primary)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                  "{card.phrase}"
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleSpeakPhrase(card.phrase)}
                  style={{ fontSize: 'var(--font-sm)', padding: '0.6rem' }}
                  title="Speak phrase through speaker"
                >
                  <Volume2 size={16} />
                  <span>Speak Aloud</span>
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleShowFullscreen(card)}
                  style={{ fontSize: 'var(--font-sm)', padding: '0.6rem', background: card.color }}
                  title="Show huge text on screen to show vendor"
                >
                  <Maximize2 size={16} />
                  <span>Show Screen</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Phrase Maker */}
      <div className="card">
        <h3 className="card-title" style={{ fontSize: 'var(--font-lg)', marginBottom: '1rem' }}>
          Create a Custom Spoken Phrase for Any Shopkeeper:
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Type what you want your phone to say (e.g. 'Please give me 1 packet of bread and 2 eggs')"
            value={customPhrase}
            onChange={(e) => setCustomPhrase(e.target.value)}
            style={{ padding: '0.85rem', fontSize: 'var(--font-md)', borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)' }}
          />
          <input
            type="number"
            placeholder="₹ Amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            style={{ width: '130px', padding: '0.85rem', fontSize: 'var(--font-md)', borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCustomSpeak}
            disabled={!customPhrase}
          >
            <Volume2 size={18} />
            <span>Speak Out Loud</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleCustomFullscreen}
            disabled={!customPhrase}
          >
            <Maximize2 size={18} />
            <span>Show Fullscreen to Shopkeeper</span>
          </button>
        </div>
      </div>

      {/* FULLSCREEN VENDOR DISPLAY MODAL */}
      {fullscreenPhrase && (
        <div className="modal-overlay" style={{ background: '#000000', padding: '1.5rem' }}>
          <div style={{ width: '100%', maxWidth: '800px', textAlign: 'center', color: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
              <button
                type="button"
                onClick={() => setFullscreenPhrase(null)}
                style={{ background: '#333333', color: '#ffffff', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: 'var(--font-lg)' }}
              >
                <X size={24} /> Close Screen
              </button>
            </div>

            <p style={{ fontSize: '1.25rem', color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, marginBottom: '1rem' }}>
              PLEASE READ THIS SCREEN:
            </p>

            <div style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.25, marginBottom: '2rem', padding: '1rem', background: '#111827', borderRadius: 'var(--radius-lg)', border: '4px solid #facc15' }}>
              {fullscreenPhrase.phrase}
            </div>

            {fullscreenPhrase.amount && (
              <div style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, color: '#4ade80', marginBottom: '2rem' }}>
                ₹{fullscreenPhrase.amount}
              </div>
            )}

            <button
              type="button"
              className="btn-primary"
              onClick={() => speak(fullscreenPhrase.phrase, true)}
              style={{ fontSize: '1.4rem', padding: '1.2rem 2.5rem', background: '#2563eb' }}
            >
              <Volume2 size={28} />
              <span>Pronounce Aloud Again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
