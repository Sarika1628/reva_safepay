import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Volume2, 
  Printer, 
  ShieldCheck, 
  ArrowRight, 
  Home, 
  RotateCcw,
  AlertTriangle,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAccessibility } from '../context/AccessibilityContext';
import ConfirmationModal from '../components/ConfirmationModal';

export default function PaymentReceipt({ receiptData, onDone, onPayAgain }) {
  const { speak } = useAccessibility();
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReported, setDisputeReported] = useState(false);

  useEffect(() => {
    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}

    if (receiptData) {
      const speech = `Payment Successful! Simulated transfer of ${receiptData.amount} rupees to ${receiptData.recipient_name} is complete. Your new demo balance is ${receiptData.new_balance} rupees.`;
      speak(speech);
    }
  }, [receiptData, speak]);

  if (!receiptData) return null;

  const {
    transaction_id,
    recipient_name,
    recipient_upi,
    amount,
    timestamp,
    new_balance,
    disclaimer
  } = receiptData;

  const dateStr = timestamp ? new Date(timestamp).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');

  const handleReadAloud = () => {
    const text = `Simulated Payment Receipt. You paid ${amount} rupees to ${recipient_name}. Reference ID is TXN-EP-${transaction_id}. Current simulated balance is ${new_balance} rupees. No real money was debited.`;
    speak(text, true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="payment-receipt-page" style={{ maxWidth: '650px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '2rem', border: '3px solid var(--color-safe)' }}>
        {/* Success Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--color-safe-bg)', color: 'var(--color-safe)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '3px solid var(--color-safe-border)' }}>
            <CheckCircle2 size={42} />
          </div>
          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-safe)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Simulated Payment Successful
          </span>
          <div style={{ fontSize: 'clamp(2.5rem, 6vw, 3.75rem)', fontWeight: 900, color: 'var(--color-safe)', letterSpacing: '-0.02em', margin: '0.4rem 0' }}>
            ₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
            Paid to: {recipient_name}
          </p>
          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
            {recipient_upi}
          </span>
        </div>

        {/* Transaction Reference Table */}
        <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: 'var(--font-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Reference Number:</span>
            <strong style={{ fontFamily: 'monospace' }}>TXN-EP-{transaction_id}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>
            <strong>{dateStr}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Payment Channel:</span>
            <strong>EasyPay UPI (Simulated)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Remaining Demo Balance:</span>
            <strong style={{ color: 'var(--color-brand)' }}>₹{Number(new_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Security Shield Status:</span>
            <span style={{ color: 'var(--color-safe)', fontWeight: 800 }}>✓ Verified Zero Scam Flags</span>
          </div>
        </div>

        {/* Disclaimer Notice */}
        <div style={{ background: 'var(--bg-primary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
          <ShieldCheck size={20} color="var(--color-brand)" style={{ flexShrink: 0 }} />
          <span>{disclaimer || "Simulated receipt: No real money was debited from any real bank account."}</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleReadAloud}
          >
            <Volume2 size={18} />
            <span>Read Aloud</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handlePrint}
          >
            <Printer size={18} />
            <span>Print / Save</span>
          </button>
        </div>

        {/* Secondary Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onPayAgain}
          >
            <RotateCcw size={16} />
            <span>Pay Someone Else</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onDone}
            style={{ background: 'var(--color-brand)' }}
          >
            <Home size={16} />
            <span>Return to Dashboard</span>
          </button>
        </div>

        {/* Practice Dispute Simulation */}
        <div style={{ textAlign: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem' }}>
          {disputeReported ? (
            <span style={{ color: 'var(--color-safe)', fontWeight: 700, fontSize: 'var(--font-sm)' }}>
              ✓ Simulated Dispute Ticket #DSP-4091 Created. In real life, report wrong payments immediately to helpline 1930.
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowDisputeModal(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 'var(--font-sm)', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Practice: What if I sent money by mistake? (Simulate Dispute)
            </button>
          )}
        </div>
      </div>

      {/* Dispute Simulation Modal */}
      <ConfirmationModal
        isOpen={showDisputeModal}
        title="Practice Wrong Payment Dispute"
        message="If you ever make an incorrect transfer in real banking, you should: 1) Immediately report to your bank within 24 hours, 2) Contact NPCI DigiSaathi helpline at 14431, and 3) Dial Cyber Cell 1930 if fraud is suspected. Would you like to log a simulated dispute report for this demo payment?"
        confirmText="Submit Simulated Dispute"
        cancelText="Close"
        onConfirm={() => {
          setShowDisputeModal(false);
          setDisputeReported(true);
          speak("Simulated dispute recorded. Remember to contact 1930 for real emergencies.");
        }}
        onCancel={() => setShowDisputeModal(false)}
      />
    </div>
  );
}
