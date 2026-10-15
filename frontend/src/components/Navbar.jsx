import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Send, 
  AlertOctagon, 
  History, 
  Lock, 
  User as UserIcon,
  TrendingUp,
  Camera,
  Users,
  ShieldAlert,
  Sliders,
  EyeOff,
  FileText,
  Clock,
  ChevronDown,
  Bell
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useAccessibility } from '../context/AccessibilityContext';

export default function Navbar({ activeTab, setActiveTab, onOpenFreezeModal, onOpenAssistant }) {
  const { users, activeUser, switchUser } = useUser();
  const { speak, t } = useAccessibility();
  const [moreToolsOpen, setMoreToolsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleNavClick = (tabId, label) => {
    setActiveTab(tabId);
    setMoreToolsOpen(false);
    speak(`${label} opened`);
  };

  const navItems = [
    { id: 'dashboard', label: t('navHome', 'Home'), icon: ShieldCheck },
    { id: 'send', label: t('navMakePayment', 'Make Payment'), icon: Send },
    { id: 'safepay-checker', label: t('navSafePay', 'SafePay Scam Checker'), icon: ShieldAlert },
    { id: 'screenshot', label: t('navScreenshot', 'Screenshot Checker'), icon: Camera },
    { id: 'camera-demo', label: t('navCameraDemo', 'Face & Camera Demo'), icon: Camera, isNew: true },
    { id: 'privacy-redactor', label: t('navPrivacyRedactor', 'Privacy Redactor'), icon: EyeOff, isNew: true },
    { id: 'complaint-assistant', label: t('navComplaintAssistant', 'Complaint Assistant'), icon: FileText, isNew: true },
    { id: 'history', label: t('navHistory', 'Transaction History'), icon: History },
    { id: 'insights', label: t('navInsights', 'Spending Insights'), icon: TrendingUp },
    { id: 'contacts', label: t('navContacts', 'Trusted Contacts'), icon: Users },
    { id: 'golden-hour-help', label: t('navGoldenHour', 'Golden Hour Help'), icon: Clock, isEmergency: true },
    { id: 'accessibility', label: t('navAccessibility', 'Accessibility'), icon: Sliders },
    { id: 'safety', label: t('navSafety', 'Safety Centre'), icon: ShieldCheck }
  ];

  return (
    <nav className="navbar" aria-label="Main Navigation">
      {/* Brand & Logo */}
      <div 
        className="brand-section" 
        onClick={() => handleNavClick('dashboard', 'Dashboard')} 
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNavClick('dashboard', 'Dashboard'); }}
        aria-label="EasyPay & SafePay Home"
      >
        <div className="brand-logo-badge">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h1 className="brand-title">{t('appName', 'EasySafePay')}</h1>
          <p className="brand-subtitle">
            CyberCare Intelligence • <span style={{ color: '#f43f5e', fontWeight: 800 }}>Protected</span>
          </p>
        </div>
      </div>

      {/* Demo Persona Switcher */}
      <div className="persona-switcher" title="Switch synthetic persona for testing">
        <UserIcon size={18} color="var(--color-brand)" />
        <label htmlFor="persona-select" className="sr-only">Switch Demo Persona</label>
        <select
          id="persona-select"
          className="persona-select"
          value={activeUser?.id || ''}
          onChange={(e) => switchUser(e.target.value)}
          aria-label="Switch Demo User Persona"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.persona.split('(')[0].trim()})
            </option>
          ))}
        </select>
      </div>

      {/* Primary Desktop Nav Links */}
      <div className="nav-links">
        <button
          type="button"
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavClick('dashboard', t('navHome', 'Home'))}
        >
          <span>{t('navHome', 'Home')}</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => handleNavClick('send', t('navMakePayment', 'Make Payment'))}
        >
          <Send size={18} />
          <span>{t('navMakePayment', 'Make Payment')}</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === 'safepay-checker' ? 'active' : ''}`}
          onClick={() => handleNavClick('safepay-checker', t('navSafePay', 'SafePay Scam Checker'))}
        >
          <ShieldAlert size={18} />
          <span>{t('navSafePay', 'SafePay Checker')}</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === 'screenshot' ? 'active' : ''}`}
          onClick={() => handleNavClick('screenshot', t('navScreenshot', 'Screenshot Checker'))}
        >
          <Camera size={18} />
          <span>{t('navScreenshot', 'Screenshot Checker')}</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === 'golden-hour-help' ? 'active' : ''}`}
          onClick={() => handleNavClick('golden-hour-help', t('navGoldenHour', 'Golden Hour Help'))}
          style={{ color: activeTab === 'golden-hour-help' ? '#ffffff' : '#b45309' }}
        >
          <Clock size={18} />
          <span>{t('navGoldenHour', 'Golden Hour')}</span>
        </button>

        {/* More Tools Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className={`nav-item ${['privacy-redactor', 'complaint-assistant', 'history', 'insights', 'contacts', 'accessibility', 'safety'].includes(activeTab) ? 'active' : ''}`}
            onClick={() => setMoreToolsOpen(!moreToolsOpen)}
            aria-expanded={moreToolsOpen}
            aria-haspopup="true"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <span>{t('navAllTools', 'All Features')} ({navItems.length - 1})</span>
            <ChevronDown size={14} />
          </button>

          {moreToolsOpen && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.4rem',
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '0.5rem',
                minWidth: '240px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem'
              }}
            >
              {navItems.filter(item => item.id !== 'dashboard').map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id, item.label)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      background: activeTab === item.id ? 'var(--color-brand-light)' : 'transparent',
                      color: activeTab === item.id ? 'var(--color-brand)' : 'var(--text-primary)',
                      fontWeight: activeTab === item.id ? 800 : 600,
                      fontSize: 'var(--font-sm)',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications Button & Dropdown (Uizard Prototype Component) */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Security Notifications"
            title="Cyber Security Notifications & Live Alerts"
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              border: '1.5px solid var(--border-color)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Bell size={19} />
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: '#f43f5e',
              boxShadow: '0 0 8px #f43f5e'
            }} />
          </button>

          {notificationsOpen && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.45)',
                padding: '1.25rem',
                width: '340px',
                zIndex: 1000
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={18} color="var(--color-brand)" />
                  <strong style={{ fontSize: 'var(--font-md)', color: 'var(--text-primary)' }}>
                    Security Alerts
                  </strong>
                </div>
                <span style={{ fontSize: '0.75rem', background: 'var(--color-brand-light)', color: 'var(--color-brand)', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                  4 Active
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', borderLeft: '4px solid #ef4444' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444' }}>⚡ Urgent Advisory</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>10m ago</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    High-volume fake electricity power-cut SMS wave reported. Never click APK links.
                  </p>
                </div>

                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', borderLeft: '4px solid #10b981' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10b981' }}>🛡️ ML Shield Active</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Just now</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Scikit-Learn LogisticRegression engine running with 80+ synthetic fraud rules.
                  </p>
                </div>

                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', borderLeft: '4px solid #3b82f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3b82f6' }}>👧 Verified Safety Contact</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>1h ago</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Pooja (Daughter) is confirmed in your trusted contact graph.
                  </p>
                </div>

                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', borderLeft: '4px solid #a855f7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#a855f7' }}>📞 National Helpline</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>24x7</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Call <strong>1930</strong> or visit cybercrime.gov.in within Golden Hour (2h).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(false);
                  setActiveTab('safety');
                }}
                style={{
                  marginTop: '0.85rem',
                  width: '100%',
                  padding: '0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--color-brand)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Open Full Safety Centre →
              </button>
            </div>
          )}
        </div>

        {/* AI Voice Assistant Button */}
        <button
          type="button"
          onClick={onOpenAssistant}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.55rem 0.95rem',
            borderRadius: '999px',
            background: 'var(--color-brand-light)',
            color: 'var(--color-brand)',
            border: '2px solid var(--color-brand)',
            fontWeight: 800,
            fontSize: 'var(--font-sm)',
            cursor: 'pointer'
          }}
          title="Open SafePay AI Voice Assistant"
        >
          <span style={{ fontSize: '1.1rem' }}>🎙️</span>
          <span>Speak to SafePay</span>
        </button>

        {/* SOS Emergency Button */}
        <button
          type="button"
          className={`sos-nav-button ${activeUser?.is_frozen ? 'frozen' : ''}`}
          onClick={onOpenFreezeModal}
          title={activeUser?.is_frozen ? "Wallet is FROZEN. Click to manage." : "Emergency SOS: Lock wallet immediately"}
        >
          {activeUser?.is_frozen ? <Lock size={18} /> : <AlertOctagon size={18} />}
          <span>{activeUser?.is_frozen ? t('navWalletLocked', 'WALLET LOCKED') : t('navSOS', 'EMERGENCY SOS')}</span>
        </button>
      </div>
    </nav>
  );
}
