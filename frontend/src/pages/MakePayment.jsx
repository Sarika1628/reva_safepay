import React, { useState } from 'react';
import { 
  ScanLine, 
  Users, 
  AtSign, 
  Phone, 
  QrCode, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import api from '../services/api';

export default function MakePayment({ onSelectMethod, onApplySampleQr }) {
  const { speak } = useAccessibility();
  const [pasteQrText, setPasteQrText] = useState('');
  const [parsing, setParsing] = useState(false);

  const sampleQrs = [
    {
      label: 'Safe Daily Milk QR (₹150)',
      qr: 'upi://pay?pa=gopal.dairy@paytm&pn=Gopal%20Cow%20Milk%20Dairy&am=150.00&tn=Daily%20Cow%20Milk',
      type: 'safe',
      hint: 'Verified neighborhood vendor'
    },
    {
      label: 'Electricity Disconnection Scam QR',
      qr: 'upi://pay?pa=bses.electricity.disconnection@upi&pn=Electricity%20Power%20Officer&am=1450.00&tn=Urgent%20power%20cut%20in%2015%20minutes',
      type: 'scam',
      hint: 'Urgent 15-minute fake power cut threat'
    },
    {
      label: 'WhatsApp ₹25 Lakh Lottery QR',
      qr: 'upi://pay?pa=kbc.lottery.headquarters@okaxis&pn=KBC%20Lottery%20Desk&am=499.00&tn=Pay%20tax%20to%20claim%2025%20Lakh%20prize',
      type: 'scam',
      hint: 'Advance fee lottery prize trick'
    }
  ];

  const handleParsePastedQr = async (e) => {
    e.preventDefault();
    if (!pasteQrText) return;
    setParsing(true);
    try {
      const parsed = await api.parseQr(pasteQrText);
      onApplySampleQr({
        name: parsed.recipient_name || parsed.recipient_upi,
        upi_id: parsed.recipient_upi,
        amount: parsed.suggested_amount || '',
        note: parsed.note || '',
        rawQr: pasteQrText
      });
    } catch (err) {
      alert('Could not parse QR string: ' + err.message);
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="make-payment-page" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: 'var(--font-2xl)' }}>
            <ScanLine size={32} color="var(--color-brand)" />
            <span>Make a Payment</span>
          </h2>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Choose how you would like to pay. Every transfer is protected by the SafePay AI Scam Shield.
          </p>
        </div>
      </div>

      {/* Main Payment Options Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Option 1: Trusted Contacts */}
        <button
          type="button"
          className="action-card-button"
          onClick={() => {
            speak("Opening verified contacts directory.");
            onSelectMethod('contacts');
          }}
          style={{ padding: '1.75rem 1.25rem' }}
        >
          <div className="icon-circle" style={{ background: '#ecfdf5', color: '#059669', width: '64px', height: '64px' }}>
            <Users size={32} />
          </div>
          <span className="action-title" style={{ fontSize: 'var(--font-xl)' }}>
            Pay a Trusted Contact
          </span>
          <span className="action-desc">
            Choose from daughter, milk vendor, chemist, or auto driver
          </span>
        </button>

        {/* Option 2: Enter UPI ID / VPA */}
        <button
          type="button"
          className="action-card-button"
          onClick={() => {
            speak("Enter recipient UPI handle.");
            onSelectMethod('upi');
          }}
          style={{ padding: '1.75rem 1.25rem' }}
        >
          <div className="icon-circle" style={{ background: '#eff6ff', color: '#2563eb', width: '64px', height: '64px' }}>
            <AtSign size={32} />
          </div>
          <span className="action-title" style={{ fontSize: 'var(--font-xl)' }}>
            Pay by UPI Handle
          </span>
          <span className="action-desc">
            Type any UPI ID (e.g. name@okaxis, shop@paytm)
          </span>
        </button>

        {/* Option 3: Phone / Bank Details */}
        <button
          type="button"
          className="action-card-button"
          onClick={() => {
            speak("Enter mobile number or bank account.");
            onSelectMethod('phone');
          }}
          style={{ padding: '1.75rem 1.25rem' }}
        >
          <div className="icon-circle" style={{ background: '#fdf4ff', color: '#a855f7', width: '64px', height: '64px' }}>
            <Phone size={32} />
          </div>
          <span className="action-title" style={{ fontSize: 'var(--font-xl)' }}>
            Pay by Phone Number
          </span>
          <span className="action-desc">
            Pay directly using a 10-digit mobile number
          </span>
        </button>
      </div>

      {/* Simulated QR Scanner & Paste */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card-title" style={{ fontSize: 'var(--font-lg)', marginBottom: '0.75rem' }}>
          <QrCode size={22} color="var(--color-brand)" />
          <span>Scan or Paste UPI QR Code</span>
        </h3>
        <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Paste a UPI QR code link or test out one of our pre-built simulated QR codes:
        </p>

        <form onSubmit={handleParsePastedQr} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Paste raw QR text (e.g. upi://pay?pa=vendor@bank&pn=Shop&am=100)"
            value={pasteQrText}
            onChange={(e) => setPasteQrText(e.target.value)}
            style={{ flex: 1, minWidth: '280px', padding: '0.85rem', fontSize: 'var(--font-md)', borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)' }}
          />
          <button type="submit" className="btn-primary" disabled={parsing || !pasteQrText}>
            {parsing ? 'Scanning...' : 'Scan QR Text'}
          </button>
        </form>

        {/* Preset Sample QRs */}
        <div>
          <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
            Try Instant Test QRs (Safe vs Fraud Demo):
          </strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {sampleQrs.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onApplySampleQr({
                    rawQr: item.qr,
                    label: item.label
                  });
                }}
                className={item.type === 'safe' ? 'btn-secondary' : 'btn-secondary'}
                style={{
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  padding: '0.85rem 1rem',
                  borderLeft: `6px solid ${item.type === 'safe' ? 'var(--color-safe)' : 'var(--color-danger)'}`
                }}
              >
                <strong style={{ fontSize: 'var(--font-md)', color: item.type === 'safe' ? 'var(--color-safe)' : 'var(--color-danger)' }}>
                  {item.label}
                </strong>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                  {item.hint}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
