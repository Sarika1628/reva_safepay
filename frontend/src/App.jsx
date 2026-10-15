import React, { useState } from 'react';
import DisclaimerBanner from './components/DisclaimerBanner';
import Navbar from './components/Navbar';
import AccessibilityBar from './components/AccessibilityBar';
import EmergencyFreezeModal from './components/EmergencyFreezeModal';
import Dashboard from './pages/Dashboard';
import SendPayment from './pages/SendPayment';
import SafePayScamChecker from './pages/SafePayScamChecker';
import ScreenshotScamDetector from './pages/ScreenshotScamDetector';
import PrivacyRedactor from './pages/PrivacyRedactor';
import ComplaintAssistant from './pages/ComplaintAssistant';
import TransactionHistory from './pages/TransactionHistory';
import SpendingInsights from './pages/SpendingInsights';
import TrustedContacts from './pages/TrustedContacts';
import GoldenHourHelp from './pages/GoldenHourHelp';
import AccessibilitySettings from './pages/AccessibilitySettings';
import SafetyCentre from './pages/SafetyCentre';
import NonSpeakingQuickPay from './pages/NonSpeakingQuickPay';
import PracticeSandbox from './pages/PracticeSandbox';
import SignSecureMode from './pages/SignSecureMode';
import VoiceLanguageAssist from './pages/VoiceLanguageAssist';
import HelpAbout from './pages/HelpAbout';
import ScamDatabase from './pages/ScamDatabase';
import FaceCameraDemo from './pages/FaceCameraDemo';
import SafePayVoiceAssistant from './components/SafePayVoiceAssistant';
import { useAccessibility } from './context/AccessibilityContext';
import { useUser } from './context/UserContext';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [selectedContactForPay, setSelectedContactForPay] = useState(null);
  const { visualFlash } = useAccessibility();

  const handleQuickPayContact = (contact) => {
    setSelectedContactForPay(contact);
    setActiveTab('send');
  };

  return (
    <div className="app-container">
      {/* Visual Flash Alert for Deaf & Hard of Hearing Users */}
      {visualFlash && (
        <div className={`visual-alert-banner ${visualFlash.type}`}>
          <span>⚠️ {visualFlash.message}</span>
        </div>
      )}

      {/* Mandatory Simulation Disclaimer */}
      <DisclaimerBanner />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedContactForPay(null);
          setActiveTab(tab);
        }}
        onOpenFreezeModal={() => setFreezeModalOpen(true)}
        onOpenAssistant={() => setAssistantOpen(true)}
      />

      {/* Accessibility Toolbar (Font Size, Contrast, Voice, Slow-Pay, Language) */}
      <AccessibilityBar />

      {/* Main Page Area */}
      <main className="main-content" id="main-content" tabIndex={-1}>
        {/* 1. Dashboard */}
        {activeTab === 'dashboard' && (
          <Dashboard
            setActiveTab={setActiveTab}
            onQuickPayContact={handleQuickPayContact}
            onOpenFreezeModal={() => setFreezeModalOpen(true)}
          />
        )}

        {/* 2. Make Payment */}
        {activeTab === 'send' && (
          <SendPayment
            initialContact={selectedContactForPay}
            onReturnToDashboard={() => {
              setSelectedContactForPay(null);
              setActiveTab('dashboard');
            }}
            onViewHistory={() => {
              setSelectedContactForPay(null);
              setActiveTab('history');
            }}
          />
        )}

        {/* 3. SafePay Scam Checker */}
        {activeTab === 'safepay-checker' && (
          <SafePayScamChecker onOpenFreezeModal={() => setFreezeModalOpen(true)} />
        )}

        {/* 4. Screenshot Checker */}
        {activeTab === 'screenshot' && (
          <ScreenshotScamDetector />
        )}

        {/* 5. Privacy Redactor */}
        {activeTab === 'privacy-redactor' && (
          <PrivacyRedactor />
        )}

        {/* 6. Complaint Assistant */}
        {activeTab === 'complaint-assistant' && (
          <ComplaintAssistant />
        )}

        {/* 7. Transaction History */}
        {activeTab === 'history' && (
          <TransactionHistory />
        )}

        {/* 8. Spending Insights */}
        {activeTab === 'insights' && (
          <SpendingInsights />
        )}

        {/* 9. Trusted Contacts */}
        {activeTab === 'contacts' && (
          <TrustedContacts
            onPayContact={handleQuickPayContact}
          />
        )}

        {/* 10. Golden Hour Help */}
        {activeTab === 'golden-hour-help' && (
          <GoldenHourHelp
            onOpenFreezeModal={() => setFreezeModalOpen(true)}
          />
        )}

        {/* 11. Accessibility */}
        {activeTab === 'accessibility' && (
          <AccessibilitySettings />
        )}

        {/* 12. Safety Centre */}
        {activeTab === 'safety' && (
          <SafetyCentre />
        )}

        {/* Additional Specialized Modes */}
        {activeTab === 'non-speaking' && (
          <NonSpeakingQuickPay
            onSelectForPayment={(card) => {
              setSelectedContactForPay({
                name: card.title,
                upi_id: card.vpa,
                quick_amount: card.amount,
                quick_phrase: card.phrase
              });
              setActiveTab('send');
            }}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeSandbox />
        )}

        {activeTab === 'sign-secure' && (
          <SignSecureMode />
        )}

        {activeTab === 'voice' && (
          <VoiceLanguageAssist onNavigateTab={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'help' && (
          <HelpAbout
            onOpenFreezeModal={() => setFreezeModalOpen(true)}
          />
        )}

        {activeTab === 'scams' && (
          <ScamDatabase />
        )}

        {/* FEATURE 3: Face & Camera Demo */}
        {activeTab === 'camera-demo' && (
          <FaceCameraDemo 
            onNavigatePayment={() => setActiveTab('send')}
          />
        )}
      </main>

      {/* Floating AI Voice Assistant Launcher Button (Always noticeable & accessible) */}
      <button
        type="button"
        onClick={() => setAssistantOpen(true)}
        aria-label="Open SafePay AI Voice Assistant"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.95rem 1.55rem',
          borderRadius: '999px',
          background: 'var(--brand-gradient)',
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '1.05rem',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 12px 32px -4px var(--color-brand-glow), 0 0 22px rgba(99, 102, 241, 0.4)',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <span style={{ fontSize: '1.35rem' }}>🎙️</span>
        <span style={{ letterSpacing: '0.01em' }}>Speak to SafePay</span>
        <span style={{ background: '#10b981', color: '#ffffff', fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '10px', fontWeight: 900, boxShadow: '0 2px 6px rgba(16,185,129,0.4)' }}>
          AI
        </span>
      </button>

      {/* Two-Way Voice Assistant Modal */}
      {assistantOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAssistantOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <SafePayVoiceAssistant
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              setAssistantOpen(false);
            }}
            onClose={() => setAssistantOpen(false)}
          />
        </div>
      )}

      {/* Emergency Freeze Modal */}
      <EmergencyFreezeModal
        isOpen={freezeModalOpen}
        onClose={() => setFreezeModalOpen(false)}
      />

      {/* Footer */}
      <footer className="footer">
        <p style={{ fontWeight: 800, marginBottom: '0.35rem', color: 'var(--color-brand)' }}>
          EasyPay & SafePay — CyberCare Intelligence
        </p>
        <p style={{ fontWeight: 700, marginBottom: '0.35rem', color: '#dc2626' }}>
          Demo application. No real money is transferred.
        </p>
        <p style={{ fontSize: '0.85rem', opacity: 0.85 }}>
          Designed for older adults, deaf individuals, and non-speaking users. All transactions and currency are strictly simulated for educational and cyber protection training.
        </p>
      </footer>
    </div>
  );
}
