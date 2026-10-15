import React, { useState } from 'react';
import { 
  HelpCircle, 
  PhoneCall, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  BookOpen, 
  Info, 
  ExternalLink,
  Volume2
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useUser } from '../context/UserContext';
import ConfirmationModal from '../components/ConfirmationModal';

export default function HelpAbout({ onOpenFreezeModal }) {
  const { speak } = useAccessibility();
  const { activeUser } = useUser();
  const [showSimulatedCyberCellModal, setShowSimulatedCyberCellModal] = useState(false);

  const guides = [
    {
      title: "How to scan a grocery QR code safely",
      text: "Open 'Make Payment' -> choose 'Scan QR'. The SafePay shield will automatically inspect the merchant's name and UPI ID. If it is a personal account or contains suspicious words, a red warning appears."
    },
    {
      title: "What to do if someone on call says they sent money by mistake",
      text: "Never send money back immediately! Check your actual bank statement or SMS. Scammers send fake SMS stating 'credited' and trick you into sending real funds back."
    },
    {
      title: "Why does EasyPay show '100% Simulated'?",
      text: "EasyPay & SafePay is designed as a zero-risk learning and protection sandbox. No real bank accounts are ever linked and no real money is ever transferred, allowing older adults to practice freely."
    }
  ];

  return (
    <div className="help-about-page" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: 'var(--font-2xl)' }}>
            <HelpCircle size={32} color="var(--color-brand)" />
            <span>Help, Support & About SafePay</span>
          </h2>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Get instant help, learn how to navigate payments, and understand our safety mission.
          </p>
        </div>
      </div>

      {/* Immediate Emergency Action Box */}
      <div className="card" style={{ border: '3px solid var(--color-danger)', background: 'var(--color-danger-bg)', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', fontWeight: 800, fontSize: 'var(--font-xl)', marginBottom: '0.4rem' }}>
              <AlertTriangle size={26} />
              <span>Suspect Fraud Right Now?</span>
            </div>
            <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
              If someone is pressuring you on a phone call or demanding an immediate transfer, click below to lock your wallet and simulate calling the national cyber crime hotline.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-danger"
              onClick={onOpenFreezeModal}
              style={{ fontSize: 'var(--font-md)' }}
            >
              <Lock size={18} />
              <span>Freeze Wallet (SOS)</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowSimulatedCyberCellModal(true)}
              style={{ fontSize: 'var(--font-sm)' }}
            >
              <PhoneCall size={16} />
              <span>Dial 1930 Helpline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Senior Help Guides */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card-title" style={{ fontSize: 'var(--font-xl)', marginBottom: '1rem' }}>
          <BookOpen size={22} color="var(--color-brand)" />
          <span>Step-by-Step Senior Guides:</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {guides.map((g, idx) => (
            <div key={idx} style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <strong style={{ fontSize: 'var(--font-lg)', color: 'var(--color-brand)' }}>{g.title}</strong>
                <button
                  type="button"
                  onClick={() => speak(`${g.title}. ${g.text}`, true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: 'var(--font-sm)', color: 'var(--color-brand)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  <Volume2 size={16} />
                  <span>Listen</span>
                </button>
              </div>
              <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                {g.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* About EasyPay & SafePay */}
      <div className="card">
        <h3 className="card-title" style={{ fontSize: 'var(--font-xl)', marginBottom: '0.75rem' }}>
          <Info size={22} color="var(--color-brand)" />
          <span>About EasyPay & SafePay</span>
        </h3>
        <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          EasyPay & SafePay was created for the hackathon as an accessible digital payment assistance and scam-prevention system. It bridges the digital divide for older adults, deaf individuals, and non-speaking citizens who find modern fast-paced payment apps intimidating or predatory.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: 'var(--font-sm)', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <div>
            <strong>Frontend Engine:</strong> React 19 + Vite + CSS
          </div>
          <div>
            <strong>Backend API:</strong> Python + FastAPI + Pydantic
          </div>
          <div>
            <strong>Database:</strong> SQLite Local Engine
          </div>
          <div>
            <strong>Currency:</strong> 100% Simulated INR
          </div>
        </div>
      </div>

      {/* Cyber Cell Helpline Modal */}
      <ConfirmationModal
        isOpen={showSimulatedCyberCellModal}
        title="Simulating Call to National Cyber Helpline (1930)"
        message="In real life, 1930 is the toll-free 24x7 National Cyber Crime Reporting Helpline operated by the Ministry of Home Affairs in India. Operators assist victims in freezing fraudulent bank transactions within the golden hour. In this demo, your simulated emergency contact has been sent an alert notification."
        confirmText="Understood"
        cancelText="Close"
        onConfirm={() => {
          setShowSimulatedCyberCellModal(false);
          speak("Remember: 1930 is free and available 24 hours a day.");
        }}
        onCancel={() => setShowSimulatedCyberCellModal(false)}
      />
    </div>
  );
}
