import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  Copy, 
  Check, 
  PhoneCall, 
  ExternalLink
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useUser } from '../context/UserContext';

export default function ComplaintAssistant() {
  const { speak, triggerVisualAlert } = useAccessibility();
  const { activeUser } = useUser();

  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Fake Electricity Disconnection Scam',
    suspectVpa: 'bses.electricity.disconnection@upi',
    suspectPhone: '+91 98765 00000',
    amount: '1450',
    utrNumber: '329482910481',
    incidentDescription: 'Received an SMS claiming electricity would be cut in 15 minutes unless ₹1450 was sent to a personal UPI ID. Caller threatened immediate blackout.'
  });

  const generatedDraft = useMemo(() => `INCIDENT REPORT: FINANCIAL CYBER FRAUD (NATIONAL CYBER CRIME HELPLINE 1930)
--------------------------------------------------------------------------------
1. COMPLAINANT DETAILS:
   - Full Name: ${activeUser?.name || 'Ramesh Uncle'}
   - Registered Phone: ${activeUser?.phone || '+91 98450 11223'}
   - Emergency / Caregiver Contact: ${activeUser?.emergency_contact_name || 'Pooja (Daughter)'} (${activeUser?.emergency_contact_phone || '+91 99001 99887'})

2. INCIDENT SUMMARY:
   - Fraud Category: ${formData.category}
   - Disputed Amount: ₹${formData.amount}
   - Reference / UTR Number: ${formData.utrNumber || 'N/A (Pending Bank Statement)'}
   - Suspect Beneficiary VPA: ${formData.suspectVpa}
   - Suspect Phone / Contact: ${formData.suspectPhone}
   - Date & Time: ${new Date().toLocaleString('en-IN')}

3. DESCRIPTION OF EVENTS:
   ${formData.incidentDescription}

4. MITIGATION ACTIONS TAKEN:
   - Wallet Freeze: ${activeUser?.is_frozen ? 'YES (Frozen via EasyPay Emergency SOS)' : 'Action Initiated'}
   - Bank Emergency Desk: Notified
   - Reported under Golden Hour (within 120 minutes): YES
--------------------------------------------------------------------------------
Generated via EasyPay & SafePay CyberCare Intelligence Assistant
Demo Application - For guidance and official 1930 / cybercrime.gov.in complaint filing.`, [activeUser, formData]);

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    speak("Complaint draft copied to clipboard. You can now paste it into the cyber crime portal or read it on the 1930 helpline.");
    triggerVisualAlert('success', 'Complaint Draft Copied to Clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="complaint-assistant-page" style={{ maxWidth: '950px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Prominent Step 1 Notice */}
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
            Feature Status: Automated Cyber Portal Submission API is NOT YET IMPLEMENTED
          </strong>
          <p style={{ margin: 0, fontSize: 'var(--font-md)', color: '#92400e', lineHeight: 1.5 }}>
            Direct API submission to the National Cyber Crime Reporting Portal (cybercrime.gov.in) requires official government gateway credentials not yet connected in Step 1. However, the interactive incident formatting engine below is 100% active to help seniors structure complaint details before dialing <strong>1930</strong>.
          </p>
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#eff6ff', color: '#1d4ed8', padding: '0.35rem 0.8rem', borderRadius: '999px', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.5rem' }}>
          <FileText size={16} />
          <span>Cyber Crime Incident Report Generator</span>
        </div>
        <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
          Complaint Assistant
        </h1>
        <p style={{ fontSize: 'var(--font-lg)', color: 'var(--text-secondary)', margin: 0 }}>
          Generate a formal, structured cyber fraud complaint ready to submit to the National Cyber Crime Portal (1930 / cybercrime.gov.in).
        </p>
      </div>

      {/* Quick Action Hotline Card */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #1e3a8a, #0369a1)',
          color: '#ffffff',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div>
          <span style={{ fontSize: 'var(--font-sm)', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Official Citizen Helpline
          </span>
          <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, margin: '0.2rem 0' }}>
            National Cyber Crime Helpline: 1930
          </h2>
          <p style={{ margin: 0, fontSize: 'var(--font-sm)', opacity: 0.9 }}>
            Available 24x7 across all Indian states and Union Territories. Operated by MHA.
          </p>
        </div>

        <a
          href="tel:1930"
          style={{
            background: '#ffffff',
            color: '#1e3a8a',
            padding: '0.85rem 1.6rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 800,
            fontSize: 'var(--font-lg)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none'
          }}
        >
          <PhoneCall size={22} />
          <span>Call 1930 Now</span>
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Form to Customize Details */}
        <div className="card">
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: '1rem' }}>
            1. Enter Incident Details
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: '0.25rem' }}>
                Fraud Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)', fontSize: 'var(--font-md)' }}
              >
                <option value="Fake Electricity Disconnection Scam">Fake Electricity Disconnection Threat</option>
                <option value="Reverse UPI PIN Cashback Trap">Reverse UPI PIN / Cashback Trap</option>
                <option value="Lottery or KBC WhatsApp Prize">Lottery / WhatsApp Prize Trick</option>
                <option value="Remote Access App (AnyDesk/TeamViewer)">Screen Share / Remote Access Scam</option>
                <option value="Impersonation of Bank Official / KYC Expiry">Fake Bank KYC Expiry Scam</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Amount Demanded / Lost (₹)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)', fontSize: 'var(--font-md)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Bank Reference / UTR
                </label>
                <input
                  type="text"
                  value={formData.utrNumber}
                  onChange={(e) => setFormData({ ...formData, utrNumber: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)', fontSize: 'var(--font-md)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: '0.25rem' }}>
                Suspect UPI Handle / Recipient VPA
              </label>
              <input
                type="text"
                value={formData.suspectVpa}
                onChange={(e) => setFormData({ ...formData, suspectVpa: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)', fontSize: 'var(--font-md)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: '0.25rem' }}>
                Suspect Caller Phone Number
              </label>
              <input
                type="text"
                value={formData.suspectPhone}
                onChange={(e) => setFormData({ ...formData, suspectPhone: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)', fontSize: 'var(--font-md)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: '0.25rem' }}>
                What Happened? (Description)
              </label>
              <textarea
                rows={3}
                value={formData.incidentDescription}
                onChange={(e) => setFormData({ ...formData, incidentDescription: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)', fontSize: 'var(--font-md)' }}
              />
            </div>
          </div>
        </div>

        {/* Live Preview of Structured Draft */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ marginBottom: '0.75rem' }}>
            <h2 className="card-title" style={{ fontSize: 'var(--font-xl)' }}>
              2. Structured 1930 Draft
            </h2>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCopyDraft}
              style={{ fontSize: 'var(--font-sm)', padding: '0.4rem 0.8rem' }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Draft'}</span>
            </button>
          </div>

          <pre
            style={{
              flex: 1,
              background: 'var(--bg-tertiary)',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontSize: '0.82rem',
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              color: 'var(--text-primary)',
              overflowY: 'auto',
              maxHeight: '380px'
            }}
          >
            {generatedDraft}
          </pre>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed', flex: 1, padding: '0.75rem', fontSize: 'var(--font-sm)' }}
              title="Automated Portal API is in Step 2"
            >
              Direct Portal API Submission (Step 2)
            </button>

            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem', fontSize: 'var(--font-sm)', textDecoration: 'none' }}
            >
              <span>Visit cybercrime.gov.in</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
