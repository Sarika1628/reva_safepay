import React from 'react';
import { 
  Clock, 
  ShieldAlert, 
  PhoneCall, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Users
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useUser } from '../context/UserContext';

export default function GoldenHourHelp({ onOpenFreezeModal }) {
  const { speak } = useAccessibility();
  const { activeUser } = useUser();

  const bankHelplines = [
    { bank: 'State Bank of India (SBI)', tollFree: '1800 11 1109 / 1800 425 3800', ussd: '*99#' },
    { bank: 'HDFC Bank', tollFree: '1800 1600 / 1800 2600', ussd: 'SMS BLOCK to 5676712' },
    { bank: 'ICICI Bank', tollFree: '1800 1080', ussd: 'SMS BLOCK to 5676766' },
    { bank: 'Punjab National Bank (PNB)', tollFree: '1800 180 2222', ussd: '1800 103 2222' },
    { bank: 'Axis Bank', tollFree: '1860 419 5555', ussd: 'SMS BLOCK to 56161600' },
    { bank: 'Bank of Baroda', tollFree: '1800 258 4455', ussd: 'SMS BLOCK to 8422009988' }
  ];

  return (
    <div className="golden-hour-page" style={{ maxWidth: '950px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Notice on Real Bank API Status */}
      <div 
        style={{
          background: '#fffbeb',
          border: '2px solid #f59e0b',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}
        role="alert"
      >
        <AlertTriangle size={28} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ fontSize: 'var(--font-lg)', color: '#b45309', display: 'block', marginBottom: '0.35rem' }}>
            Emergency Protocol: Direct Bank Core-Switch API is NOT YET IMPLEMENTED
          </strong>
          <p style={{ margin: 0, fontSize: 'var(--font-md)', color: '#92400e', lineHeight: 1.5 }}>
            Direct automated bank account freezing via RBI/NPCI core switches requires institutional banking gateways scheduled for Step 2. Use the 1-click SOS wallet freeze below to lock this simulated application, and immediately follow the Golden Hour steps to dial <strong>1930</strong> and your bank's emergency desk.
          </p>
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fef2f2', color: '#dc2626', padding: '0.35rem 0.8rem', borderRadius: '999px', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.5rem' }}>
          <Clock size={16} />
          <span>Critical 120-Minute Financial Cyber Fraud Window</span>
        </div>
        <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
          Golden Hour Help
        </h1>
        <p style={{ fontSize: 'var(--font-lg)', color: 'var(--text-secondary)', margin: 0 }}>
          The first 1 to 2 hours following a suspected fraudulent payment are vital. Rapid action can stop money from leaving intermediary bank escrow accounts.
        </p>
      </div>

      {/* 4 Golden Hour Action Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {/* Step 1: Lock Wallet */}
        <div 
          className="card"
          style={{
            borderLeft: '6px solid var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ maxWidth: '600px' }}>
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step 1 • Immediate Device Protection
            </span>
            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: '0.25rem 0' }}>
              Activate Emergency SOS Lock
            </h2>
            <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', margin: 0 }}>
              Instantly pauses all outgoing simulated transactions on your account and triggers simulated caregiver SMS alerts to your family.
            </p>
          </div>

          <button
            type="button"
            className="btn-danger"
            onClick={onOpenFreezeModal}
            style={{ padding: '0.85rem 1.6rem', fontSize: 'var(--font-md)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Lock size={20} />
            <span>{activeUser?.is_frozen ? 'Manage Wallet Lock' : 'LOCK WALLET NOW'}</span>
          </button>
        </div>

        {/* Step 2: Call 1930 */}
        <div 
          className="card"
          style={{
            borderLeft: '6px solid #2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            background: 'linear-gradient(to right, #eff6ff, #ffffff)'
          }}
        >
          <div style={{ maxWidth: '600px' }}>
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step 2 • Citizen Financial Cyber Fraud Reporting System
            </span>
            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: '0.25rem 0' }}>
              Call 1930 Cyber Cell Helpline
            </h2>
            <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', margin: 0 }}>
              Operated by the Ministry of Home Affairs (MHA). Nodal police and bank officers immediately freeze beneficiary bank and wallet accounts across India.
            </p>
          </div>

          <a
            href="tel:1930"
            className="btn-primary"
            style={{ padding: '0.85rem 1.6rem', fontSize: 'var(--font-md)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
          >
            <PhoneCall size={20} />
            <span>Call 1930 (Toll-Free)</span>
          </a>
        </div>

        {/* Step 3: Bank Emergency Helpline Directory */}
        <div className="card" style={{ borderLeft: '6px solid #059669' }}>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step 3 • Bank Customer Care Emergency Desks
            </span>
            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: '0.25rem 0' }}>
              Major Bank 24x7 Fraud Helplines
            </h2>
            <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', margin: 0 }}>
              Call your bank's emergency number to request an immediate freeze on net-banking, debit card, and UPI services.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {bankHelplines.map((item, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'var(--bg-tertiary)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <Building2 size={16} color="var(--color-brand)" />
                  <strong style={{ fontSize: 'var(--font-md)' }}>{item.bank}</strong>
                </div>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
                  📞 Toll Free: <strong>{item.tollFree}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Fast Action: {item.ussd}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 4: Caregiver Alert */}
        <div className="card" style={{ borderLeft: '6px solid #ca8a04' }}>
          <span style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: '#ca8a04', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Step 4 • Notify Designated Family Contact
          </span>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: '0.25rem 0' }}>
            Inform {activeUser?.emergency_contact_name || 'Your Trusted Caregiver'}
          </h2>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Having a family member or caregiver assist you when speaking with 1930 officers or your branch manager significantly reduces panic and ensures all transaction timestamps are accurately relayed.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-tertiary)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)' }}>
            <Users size={24} color="#ca8a04" />
            <div>
              <strong>{activeUser?.emergency_contact_name}</strong>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                Registered Phone: {activeUser?.emergency_contact_phone}
              </div>
            </div>
            <a
              href={`tel:${activeUser?.emergency_contact_phone}`}
              className="btn-secondary"
              style={{ marginLeft: 'auto', fontSize: 'var(--font-sm)', padding: '0.4rem 0.8rem', textDecoration: 'none' }}
            >
              Call Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
