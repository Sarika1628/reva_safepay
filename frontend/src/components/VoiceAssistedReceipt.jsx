import React from 'react';
import { CheckCircle2, Volume2, Printer, X, ShieldCheck, Share2 } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function VoiceAssistedReceipt({ receipt, onClose }) {
  const { speak } = useAccessibility();

  if (!receipt) return null;

  const {
    transaction_id,
    recipient_name,
    recipient_upi,
    amount,
    status,
    timestamp,
    new_balance,
    disclaimer
  } = receipt;

  const dateStr = timestamp ? new Date(timestamp).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');

  const handleReadAloud = () => {
    const text = `Payment of ${amount} rupees to ${recipient_name} was successful. Transaction ID is ${transaction_id}. Your new simulated balance is ${new_balance} rupees. This was a simulated transaction and no real money was transferred.`;
    speak(text, true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
      <div className="modal-content" style={{ maxWidth: '520px', borderColor: 'var(--color-safe)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-safe)' }}>
            <CheckCircle2 size={32} />
            <h2 id="receipt-title" style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: 0 }}>
              Payment Receipt
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '0.4rem', borderRadius: '50%', background: 'var(--bg-tertiary)' }}
            aria-label="Close receipt"
          >
            <X size={20} />
          </button>
        </div>

        {/* Big Amount Header */}
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--color-safe-bg)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '2px solid var(--color-safe-border)' }}>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-safe)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            Simulated Transfer Completed
          </p>
          <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 900, color: 'var(--color-safe)', letterSpacing: '-0.02em' }}>
            ₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p style={{ fontSize: 'var(--font-md)', fontWeight: 700, marginTop: '0.2rem', color: 'var(--text-primary)' }}>
            Paid to: {recipient_name}
          </p>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
            {recipient_upi}
          </p>
        </div>

        {/* Receipt Details Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem', fontSize: 'var(--font-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Transaction Reference:</span>
            <strong style={{ fontFamily: 'monospace' }}>TXN-EP-{transaction_id || '9012'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>
            <strong>{dateStr}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Payment Mode:</span>
            <strong>EasyPay UPI (Simulated)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Remaining Demo Balance:</span>
            <strong style={{ color: 'var(--color-brand)' }}>₹{Number(new_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        {/* Clear Disclaimer */}
        <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} color="var(--color-brand)" style={{ flexShrink: 0 }} />
          <span>{disclaimer || "Simulated payment: No real money transferred or bank accounts debited."}</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleReadAloud}
            style={{ width: '100%' }}
          >
            <Volume2 size={18} />
            <span>Read Aloud</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handlePrint}
            style={{ width: '100%' }}
          >
            <Printer size={18} />
            <span>Print Receipt</span>
          </button>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={onClose}
          style={{ width: '100%', marginTop: '0.75rem' }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
