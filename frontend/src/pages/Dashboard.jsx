import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Send, 
  ScanLine, 
  MessageSquare, 
  RotateCcw, 
  Plus,
  Lock, 
  ArrowRight, 
  History, 
  TrendingUp, 
  Camera, 
  Sliders, 
  Users, 
  ShieldAlert, 
  Languages, 
  HelpCircle, 
  EyeOff, 
  FileText, 
  Clock 
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useAccessibility } from '../context/AccessibilityContext';
import HealthStatusCard from '../components/HealthStatusCard';
import ReadAloudButton from '../components/ReadAloudButton';
import api from '../services/api';

export default function Dashboard({ setActiveTab, onQuickPayContact, onOpenFreezeModal }) {
  const { activeUser, resetDemoBalance } = useUser();
  const { speak, t } = useAccessibility();
  const [contacts, setContacts] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    upi_id: '',
    phone: '',
    relationship: 'Friend',
    category: 'General',
    quick_amount: 100,
    quick_phrase: ''
  });

  useEffect(() => {
    if (activeUser?.id) {
      setLoadingContacts(true);
      Promise.all([
        api.getContacts(activeUser.id).catch(() => []),
        api.getTransactionHistory(activeUser.id).catch(() => [])
      ]).then(([contactsData, txnsData]) => {
        setContacts(contactsData);
        setRecentTxns(txnsData.slice(0, 3));
      }).finally(() => {
        setLoadingContacts(false);
      });
    }
  }, [activeUser?.id]);

  const handleAddContactSubmit = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.upi_id) return;
    try {
      const added = await api.addContact(activeUser.id, newContact);
      setContacts(prev => [...prev, added]);
      setShowAddContact(false);
      setNewContact({ name: '', upi_id: '', phone: '', relationship: 'Friend', category: 'General', quick_amount: 100, quick_phrase: '' });
      speak(`Added ${added.name} to verified contacts`);
    } catch (err) {
      alert(err.message || 'Failed to add contact');
    }
  };

  // The 11 Core Navigation Modules requested in Task 5
  const coreActions = [
    {
      id: 'send',
      title: t('navMakePayment', 'Make Payment'),
      desc: t('makePaymentDesc', 'Pay verified contacts, enter recipient UPI ID, or scan simulated QR codes with real-time scam interception.'),
      icon: Send,
      colorBg: '#eff6ff',
      colorIcon: '#2563eb',
      badge: 'Protected',
      badgeColor: '#2563eb'
    },
    {
      id: 'safepay-checker',
      title: t('navSafePay', 'SafePay Scam Checker'),
      desc: t('safePayDesc', 'Verify suspicious UPI handles against community alerts, analyze fraud SMS notes, and practice spotting scams.'),
      icon: ShieldAlert,
      colorBg: '#fef2f2',
      colorIcon: '#dc2626',
      badge: 'AI Shield',
      badgeColor: '#dc2626'
    },
    {
      id: 'screenshot',
      title: t('navScreenshot', 'Screenshot Checker'),
      desc: 'Verify payment slips against the simulated SQLite ledger (PNG, JPG, JPEG < 5MB) and audit suspect receipts or fraud keywords.',
      icon: Camera,
      colorBg: '#fdf4ff',
      colorIcon: '#a855f7',
      badge: 'Ledger Audit',
      badgeColor: '#a855f7'
    },
    {
      id: 'privacy-redactor',
      title: t('navPrivacyRedactor', 'Privacy Redactor'),
      desc: 'Mask OTPs, phone numbers, email addresses, cards, and UPI IDs with zero data storage guarantee.',
      icon: EyeOff,
      colorBg: '#fefce8',
      colorIcon: '#ca8a04',
      badge: 'Zero Storage',
      badgeColor: '#16a34a'
    },
    {
      id: 'complaint-assistant',
      title: t('navComplaintAssistant', 'Complaint Assistant'),
      desc: 'Generate a structured incident complaint draft ready for the 1930 Cyber Fraud Helpline and official reporting.',
      icon: FileText,
      colorBg: '#f0fdf4',
      colorIcon: '#16a34a',
      badge: '1930 Draft',
      badgeColor: '#16a34a',
      statusNotice: 'Guidance Active'
    },
    {
      id: 'history',
      title: t('navHistory', 'Transaction History'),
      desc: t('historyDesc', 'Review simulated payments, receipt timestamps, caregiver alerts, and blocked fraud attempts.'),
      icon: History,
      colorBg: '#f8fafc',
      colorIcon: '#475569',
      badge: 'Ledger',
      badgeColor: '#475569'
    },
    {
      id: 'insights',
      title: t('navInsights', 'Spending Insights'),
      desc: t('insightsDesc', 'View visual breakdown of monthly spending habits and total money protected from scam intercepts.'),
      icon: TrendingUp,
      colorBg: '#ecfdf5',
      colorIcon: '#059669',
      badge: 'Analytics',
      badgeColor: '#059669'
    },
    {
      id: 'contacts',
      title: t('navContacts', 'Trusted Contacts'),
      desc: t('contactsDesc', 'Manage verified family members, neighborhood pharmacies, milk shops, and emergency caregiver consent.'),
      icon: Users,
      colorBg: '#eff6ff',
      colorIcon: '#1d4ed8',
      badge: 'Verified',
      badgeColor: '#1d4ed8'
    },
    {
      id: 'golden-hour-help',
      title: t('navGoldenHour', 'Golden Hour Help'),
      desc: 'Critical 120-minute action guide to freeze accounts, dial 1930, and reach official bank emergency desks.',
      icon: Clock,
      colorBg: '#fff7ed',
      colorIcon: '#ea580c',
      badge: '120-Min Window',
      badgeColor: '#ea580c'
    },
    {
      id: 'accessibility',
      title: t('navAccessibility', 'Accessibility'),
      desc: t('accessibilityDesc', 'Adjust text sizes, high-contrast vision mode, speech rate, visual flash cues, and slow-pay pacing.'),
      icon: Sliders,
      colorBg: '#fdf2f8',
      colorIcon: '#db2777',
      badge: 'Personalize',
      badgeColor: '#db2777'
    },
    {
      id: 'safety',
      title: t('navSafety', 'Safety Centre'),
      desc: t('safetyDesc', 'Learn common scam patterns, reverse PIN deception tactics, and official law enforcement helplines.'),
      icon: ShieldCheck,
      colorBg: '#f0fdf4',
      colorIcon: '#15803d',
      badge: 'Education',
      badgeColor: '#15803d'
    },
    {
      id: 'camera-demo',
      title: 'Face & Camera Demo',
      desc: 'Local browser presence detection (Identity Unknown) and consent-based matching prototype with zero SQLite storage.',
      icon: Camera,
      colorBg: '#f0fdf4',
      colorIcon: '#059669',
      badge: 'Privacy Vision',
      badgeColor: '#059669'
    }
  ];

  return (
    <div className="dashboard-page" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Real-time FastAPI Health Check Component */}
      <HealthStatusCard />

      {/* Mandatory Step 1 Simulation Notice */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 55%, #0369a1 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.4rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          boxShadow: '0 8px 20px -4px rgba(30, 58, 138, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(250, 204, 21, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} color="#facc15" />
          </div>
          <div>
            <strong style={{ fontSize: 'var(--font-md)', display: 'block', letterSpacing: '0.01em' }}>
              Demo application. No real money is transferred.
            </strong>
            <span style={{ fontSize: 'var(--font-xs)', opacity: 0.9 }}>
              Strictly simulated for older adults, deaf individuals, and cyber scam safety training.
            </span>
          </div>
        </div>
        <span style={{ fontSize: '0.78rem', background: 'rgba(255, 255, 255, 0.18)', padding: '0.3rem 0.8rem', borderRadius: '999px', fontWeight: 800, border: '1px solid rgba(255, 255, 255, 0.3)' }}>
          REVA HACKATHON 2026
        </span>
      </div>

      {/* 1. Wallet Balance Hero Card */}
      <div className="balance-card">
        <div className="balance-info">
          <div className="persona-tag">
            <span>{activeUser?.persona || 'Senior Citizen Persona'}</span>
          </div>
          <p style={{ fontSize: 'var(--font-sm)', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Simulated EasyPay Wallet Balance
          </p>
          <div className="balance-amount">
            <span style={{ fontSize: '0.65em', opacity: 0.85 }}>₹</span>
            <span>{activeUser?.balance ? activeUser.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</span>
          </div>
          <p style={{ fontSize: 'var(--font-sm)', opacity: 0.85, marginTop: '0.4rem' }}>
            {activeUser?.name} • Caregiver Contact: {activeUser?.emergency_contact_name} ({activeUser?.emergency_contact_phone})
          </p>
        </div>

        <div className="balance-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setActiveTab('send')}
              style={{
                padding: '0.75rem 1.4rem',
                fontSize: 'var(--font-sm)',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 6px 16px rgba(244, 63, 94, 0.4)'
              }}
            >
              <Send size={18} />
              <span>Send Money</span>
            </button>

            <button
              type="button"
              className="btn-glass"
              onClick={() => setActiveTab('safepay-checker')}
              style={{
                padding: '0.75rem 1.25rem',
                fontSize: 'var(--font-sm)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <ShieldAlert size={18} />
              <span>Scam Shield</span>
            </button>

            <button
              type="button"
              className="btn-glass"
              onClick={() => setActiveTab('send')}
              style={{
                padding: '0.75rem 1.25rem',
                fontSize: 'var(--font-sm)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <ScanLine size={18} />
              <span>Scan QR</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <ReadAloudButton 
              text={`Hello ${activeUser?.name || 'there'}. Your current simulated EasyPay balance is ${activeUser?.balance ? activeUser.balance : 0} rupees. This is a safe educational demo.`}
              label={t('readInstructions', 'Read balance aloud')}
              style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', padding: '0.55rem 1rem' }}
            />

            <button
              type="button"
              className="btn-glass"
              onClick={resetDemoBalance}
              title="Replenish demo balance back to ₹15,000"
              style={{ padding: '0.55rem 1rem', fontSize: 'var(--font-xs)' }}
            >
              <RotateCcw size={16} />
              <span>Reset Demo (₹15,000)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Freeze Notice if locked */}
      {activeUser?.is_frozen && (
        <div style={{ background: 'var(--color-danger-bg)', border: '2px solid var(--color-danger)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Lock size={28} color="var(--color-danger)" />
            <div>
              <strong style={{ fontSize: 'var(--font-lg)', color: 'var(--color-danger)', display: 'block' }}>
                Wallet is currently FROZEN in Emergency SOS Mode
              </strong>
              <span style={{ fontSize: 'var(--font-sm)' }}>
                Reason: {activeUser.freeze_reason || 'Security lock enabled'}. All outgoing transfers are paused.
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-danger"
            onClick={onOpenFreezeModal}
          >
            Manage Emergency Lock
          </button>
        </div>
      )}

      {/* EasySafePay Quick Send Verified Contacts Carousel (Uizard Prototype Component) */}
      <div 
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={20} color="var(--color-brand)" />
            <h3 style={{ margin: 0, fontSize: 'var(--font-md)', fontWeight: 800 }}>
              Quick Pay Verified Contacts
            </h3>
          </div>
          <button 
            type="button" 
            onClick={() => setActiveTab('contacts')}
            style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontWeight: 700, fontSize: 'var(--font-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'thin' }}>
          {contacts.slice(0, 5).map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => onQuickPayContact(c)}
              style={{
                flex: '0 0 auto',
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '16px',
                padding: '0.85rem 1.1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.45rem',
                minWidth: '115px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: 'var(--text-primary)'
              }}
              className="quick-contact-pill"
            >
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'var(--brand-gradient)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem',
                boxShadow: '0 4px 10px var(--color-brand-glow)'
              }}>
                {c.name.charAt(0)}
              </div>
              <strong style={{ fontSize: 'var(--font-xs)', textAlign: 'center', whiteSpace: 'nowrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.name.split('(')[0].trim()}
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-brand)', fontWeight: 700 }}>
                ₹{c.quick_amount || 100}
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            style={{
              flex: '0 0 auto',
              background: 'transparent',
              border: '2px dashed var(--border-color)',
              borderRadius: '16px',
              padding: '0.85rem 1.1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              minWidth: '115px',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-brand)'
            }}>
              <Plus size={22} />
            </div>
            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700 }}>Add Payee</span>
          </button>
        </div>
      </div>

      {/* 2. Responsive Dashboard Grid for all 11 Required Modules */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, margin: 0 }}>
            CyberCare Intelligence Modules
          </h2>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Accessible high-contrast touch targets designed for seniors, deaf users, and all abilities.
          </p>
        </div>
        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--color-brand)', background: 'var(--bg-secondary)', padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}>
          11 Core Services
        </span>
      </div>

      <div 
        className="action-grid" 
        style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', 
          gap: '1.25rem', 
          marginBottom: '2.5rem' 
        }}
      >
        {coreActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              className="action-card-button"
              onClick={() => {
                speak(`${action.title} selected`);
                setActiveTab(action.id);
              }}
              style={{
                padding: '1.65rem 1.4rem',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                <div 
                  className="icon-circle" 
                  style={{ 
                    background: action.colorBg, 
                    color: action.colorIcon,
                    width: '60px',
                    height: '60px',
                    borderRadius: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
                  }}
                >
                  <Icon size={28} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                  <span 
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.55rem',
                      borderRadius: 'var(--radius-full)',
                      background: action.colorBg,
                      color: action.badgeColor,
                      textTransform: 'uppercase'
                    }}
                  >
                    {action.badge}
                  </span>
                  {action.statusNotice && (
                    <span style={{ fontSize: '0.68rem', color: '#b45309', fontWeight: 700 }}>
                      {action.statusNotice}
                    </span>
                  )}
                </div>
              </div>

              <strong className="action-title" style={{ fontSize: 'var(--font-lg)', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                {action.title}
              </strong>

              <span className="action-desc" style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.45, flex: 1 }}>
                {action.desc}
              </span>

              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-brand)', fontWeight: 700, fontSize: 'var(--font-sm)' }}>
                <span>Open module</span>
                <ArrowRight size={14} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Auxiliary Accessibility Modes Bar */}
      <div className="card" style={{ marginBottom: '2.5rem', background: 'var(--bg-secondary)', border: '2px dashed var(--border-color)', padding: '1.25rem' }}>
        <strong style={{ fontSize: 'var(--font-sm)', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
          Specialized Assistive Communication Tools:
        </strong>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="toggle-chip"
            onClick={() => setActiveTab('sign-secure')}
            style={{ padding: '0.6rem 1.1rem', fontSize: 'var(--font-sm)', fontWeight: 700 }}
          >
            <span>🤟 Sign & Secure Mode (Deaf / Non-Audio)</span>
          </button>
          <button
            type="button"
            className="toggle-chip"
            onClick={() => setActiveTab('non-speaking')}
            style={{ padding: '0.6rem 1.1rem', fontSize: 'var(--font-sm)', fontWeight: 700 }}
          >
            <MessageSquare size={16} />
            <span>Non-Speaking Quick Phrases</span>
          </button>
          <button
            type="button"
            className="toggle-chip"
            onClick={() => setActiveTab('voice')}
            style={{ padding: '0.6rem 1.1rem', fontSize: 'var(--font-sm)', fontWeight: 700 }}
          >
            <Languages size={16} />
            <span>Voice & Languages (ಕನ್ನಡ, हिंदी, తెలుగు)</span>
          </button>
          <button
            type="button"
            className="toggle-chip"
            onClick={() => setActiveTab('help')}
            style={{ padding: '0.6rem 1.1rem', fontSize: 'var(--font-sm)', fontWeight: 700 }}
          >
            <HelpCircle size={16} />
            <span>Help & Project Documentation</span>
          </button>
        </div>
      </div>

      {/* 3. Verified Contacts / One-Tap Pay */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <div className="card-header">
          <div className="card-title">
            <ShieldCheck size={24} color="var(--color-safe)" />
            <span>Verified Family & Neighborhood Vendors (SQLite)</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowAddContact(!showAddContact)}
            style={{ fontSize: 'var(--font-sm)', padding: '0.4rem 0.8rem' }}
          >
            <Plus size={16} />
            <span>Add Trusted Contact</span>
          </button>
        </div>

        {/* Add Contact Form (Toggle) */}
        {showAddContact && (
          <form onSubmit={handleAddContactSubmit} style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: '0.75rem' }}>
              Add a Verified Trusted Contact to SQLite:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: '0.2rem' }}>Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chemist"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: '0.2rem' }}>UPI ID (e.g. name@bank)</label>
                <input
                  type="text"
                  required
                  placeholder="name@okaxis"
                  value={newContact.upi_id}
                  onChange={(e) => setNewContact({ ...newContact, upi_id: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: '0.2rem' }}>Relationship / Category</label>
                <select
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                >
                  <option value="Daughter">Daughter</option>
                  <option value="Son">Son</option>
                  <option value="Milk Vendor">Milk Vendor</option>
                  <option value="Doctor Clinic">Doctor Clinic</option>
                  <option value="Pharmacist">Pharmacist</option>
                  <option value="Grocery Store">Grocery Store</option>
                  <option value="Auto Driver">Auto Driver</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: '0.2rem' }}>Default Quick Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={newContact.quick_amount}
                  onChange={(e) => setNewContact({ ...newContact, quick_amount: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowAddContact(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Save to Database</button>
            </div>
          </form>
        )}

        {loadingContacts ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading trusted contacts from SQLite...</p>
        ) : contacts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No contacts saved yet.</p>
        ) : (
          <div className="contacts-grid">
            {contacts.map((contact) => (
              <div key={contact.id} className="contact-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div className="contact-avatar">
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <strong style={{ fontSize: 'var(--font-md)', display: 'block' }}>
                      {contact.name}
                    </strong>
                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-safe)', fontWeight: 700 }}>
                      ✓ {contact.relationship}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {contact.upi_id}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onQuickPayContact(contact)}
                  style={{ fontSize: 'var(--font-sm)', padding: '0.5rem 0.9rem' }}
                  title={`Pay ₹${contact.quick_amount} to ${contact.name}`}
                >
                  Pay ₹{contact.quick_amount}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Recent Simulated Activity Preview */}
      {recentTxns.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ fontSize: 'var(--font-lg)' }}>
              Recent Simulated Activity (SQLite)
            </h3>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setActiveTab('history')}
              style={{ fontSize: 'var(--font-sm)', padding: '0.35rem 0.75rem' }}
            >
              <span>View All History</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {recentTxns.map((txn) => (
              <div
                key={txn.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: txn.status === 'BLOCKED_SCAM' ? 'var(--color-danger-bg)' : 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <strong style={{ fontSize: 'var(--font-md)', display: 'block' }}>
                    {txn.recipient_name}
                  </strong>
                  <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                    {txn.recipient_upi} • {new Date(txn.timestamp).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: txn.status === 'BLOCKED_SCAM' ? 'var(--color-danger)' : 'var(--color-brand)' }}>
                    {txn.status === 'BLOCKED_SCAM' ? 'BLOCKED' : `₹${txn.amount.toLocaleString('en-IN')}`}
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      background: txn.status === 'BLOCKED_SCAM' ? 'var(--color-danger)' : 'var(--color-safe-bg)',
                      color: txn.status === 'BLOCKED_SCAM' ? '#ffffff' : 'var(--color-safe)'
                    }}
                  >
                    {txn.status === 'BLOCKED_SCAM' ? 'SCAM STOPPED' : 'SIMULATED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
