import React, { useState, useEffect } from 'react';
import { 
  Send, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowLeft, 
  ArrowRight, 
  Copy, 
  Check, 
  Info, 
  Lock, 
  RefreshCw,
  History,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useUser } from '../context/UserContext';
import { useAccessibility } from '../context/AccessibilityContext';
import ReadAloudButton from '../components/ReadAloudButton';
import ConditionalScamRiskInterface from '../components/ConditionalScamRiskInterface';
import api from '../services/api';

export default function SendPayment({ initialContact, onReturnToDashboard, onViewHistory }) {
  const { activeUser, refreshUserData, resetDemoBalance } = useUser();
  const { speak, triggerVisualAlert, t, silentMode } = useAccessibility();

  // Workflow Stages: 'FORM' | 'CONFIRMATION' | 'RESULT'
  const [stage, setStage] = useState('FORM');
  const [paymentMode, setPaymentMode] = useState('send'); // 'send' | 'request'
  const [requestData, setRequestData] = useState({
    payer_upi: '',
    amount: '',
    note: ''
  });
  const [requestSent, setRequestSent] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    recipient_name: initialContact?.name || '',
    recipient_upi: initialContact?.upi_id || '',
    amount: initialContact?.quick_amount ? String(initialContact.quick_amount) : '',
    category: initialContact?.category || 'Vendor',
    note: initialContact?.quick_phrase || ''
  });

  // Client Validation Errors
  const [errors, setErrors] = useState({});

  // Risk Assessment State (Queried before/during confirmation)
  const [assessment, setAssessment] = useState(null);
  const [assessing, setAssessing] = useState(false);
  const [assessmentError, setAssessmentError] = useState(null);

  // Execution State
  const [submitting, setSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [executionError, setExecutionError] = useState(null);

  // Confirmation & safety review flags
  const [demoConfirmed, setDemoConfirmed] = useState(false);
  const [highRiskConfirmed, setHighRiskConfirmed] = useState(false);
  const [warningsReviewed, setWarningsReviewed] = useState(false);
  const [cancelledMessage, setCancelledMessage] = useState(null);

  // Copy transaction ID state
  const [copiedId, setCopiedId] = useState(false);

  // Available Saved Contacts for Quick Select
  const [contacts, setContacts] = useState([]);
  const [showContactPicker, setShowContactPicker] = useState(false);

  // Quick Presets (Safe vs High-Risk Scam Tests)
  const quickPresets = [
    {
      label: '🥛 Gopal Cow Milk (₹150)',
      name: 'Gopal Dairy',
      upi: 'gopal.dairy@paytm',
      amount: '150',
      category: 'Vendor',
      note: 'Daily fresh cow milk',
      type: 'safe',
      hint: 'Verified neighborhood milk shop'
    },
    {
      label: '💊 Sanjivani Chemist (₹350)',
      name: 'Sanjivani Pharmacy',
      upi: 'sanjivani.meds@okhdfcbank',
      amount: '350',
      category: 'Healthcare',
      note: 'Monthly BP & Diabetes tablets',
      type: 'safe',
      hint: 'Verified neighborhood pharmacy'
    },
    {
      label: '👧 Daughter Pooja (₹1,000)',
      name: 'Pooja (Daughter)',
      upi: 'pooja.family@okaxis',
      amount: '1000',
      category: 'Family',
      note: 'Household grocery allowance',
      type: 'safe',
      hint: 'Primary caregiver contact'
    },
    {
      label: '⚡ Electricity Threat (₹1,450)',
      name: 'Electricity Power Officer',
      upi: 'bses.electricity.disconnection@upi',
      amount: '1450',
      category: 'Utilities',
      note: 'Urgent power cut in 15 minutes unless paid now',
      type: 'scam',
      hint: 'High-risk panic scam trick'
    },
    {
      label: '🎁 WhatsApp Lottery (₹499)',
      name: 'KBC Lottery Headquarters',
      upi: 'kbc.lottery.headquarters@okaxis',
      amount: '499',
      category: 'Payment',
      note: 'Pay advance fee to release ₹25 Lakh prize money',
      type: 'scam',
      hint: 'High-risk advance fee lure'
    }
  ];

  // Load Contacts for Quick Picker
  useEffect(() => {
    if (activeUser?.id) {
      api.getContacts(activeUser.id)
        .then((data) => setContacts(data))
        .catch(() => {});
    }
  }, [activeUser?.id]);

  // Sync if initialContact is passed
  useEffect(() => {
    if (initialContact) {
      setFormData({
        recipient_name: initialContact.name || '',
        recipient_upi: initialContact.upi_id || '',
        amount: initialContact.quick_amount ? String(initialContact.quick_amount) : '',
        category: initialContact.category || 'Vendor',
        note: initialContact.quick_phrase || `Payment to ${initialContact.name}`
      });
      speak(`Loaded ${initialContact.name} into Payment Simulator.`);
    }
  }, [initialContact, speak]);

  // Form Field Validation
  const validateForm = () => {
    const newErrors = {};

    // 1. Recipient Name Validation
    if (!formData.recipient_name || !formData.recipient_name.trim()) {
      newErrors.recipient_name = t('errRecipientRequired', 'Recipient name is required.');
    } else if (formData.recipient_name.trim().length < 2) {
      newErrors.recipient_name = t('errRecipientRequired', 'Recipient name must be at least 2 characters.');
    }

    // 2. Recipient UPI ID Validation
    const cleanUpi = (formData.recipient_upi || '').trim();
    if (!cleanUpi) {
      newErrors.recipient_upi = t('errUpiRequired', 'Recipient UPI ID is required (e.g. name@bank).');
    } else if (!cleanUpi.includes('@') || cleanUpi.startsWith('@') || cleanUpi.endsWith('@')) {
      newErrors.recipient_upi = t('errUpiRequired', 'Please enter a valid UPI format containing @ (e.g. shop@paytm or name@okaxis).');
    }

    // 3. Amount Field Validation (Reject zero, negative, invalid, excessive)
    const rawAmt = formData.amount;
    const numAmt = parseFloat(rawAmt);

    if (rawAmt === '' || rawAmt === null || rawAmt === undefined) {
      newErrors.amount = t('errAmountInvalid', 'Payment amount is required.');
    } else if (isNaN(numAmt)) {
      newErrors.amount = t('errAmountInvalid', 'Invalid amount: Please enter numbers only.');
    } else if (numAmt === 0) {
      newErrors.amount = t('errAmountZero', 'Invalid amount: Zero (₹0) payments are rejected. Please enter an amount greater than zero.');
    } else if (numAmt < 0) {
      newErrors.amount = t('errAmountNegative', 'Invalid amount: Negative amounts are rejected. Payment must be greater than zero.');
    } else if (numAmt > 50000) {
      newErrors.amount = 'Maximum simulated transaction limit is ₹50,000.';
    } else if (activeUser && numAmt > activeUser.balance) {
      newErrors.amount = t('errAmountExcess', `Insufficient simulated balance: Current balance is ₹${activeUser.balance.toLocaleString('en-IN')}, requested ₹${numAmt.toLocaleString('en-IN')}.`);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Quick Preset Click Handler
  const handleApplyPreset = (preset) => {
    setFormData({
      recipient_name: preset.name,
      recipient_upi: preset.upi,
      amount: preset.amount,
      category: preset.category,
      note: preset.note
    });
    setErrors({});
    speak(`Loaded preset for ${preset.name}, amount ₹${preset.amount}.`);
  };

  // Cancel Payment Handler (Return to Form safely)
  const handleCancelPayment = () => {
    setStage('FORM');
    setDemoConfirmed(false);
    setHighRiskConfirmed(false);
    setWarningsReviewed(false);
    const msg = t('paymentCancelledNotice', 'Simulated payment was cancelled safely. No money was sent.');
    setCancelledMessage(msg);
    speak(msg);
    triggerVisualAlert('info', msg);
  };

  // Scroll to Safety Review section smoothly
  const handleScrollToReview = () => {
    const el = document.getElementById('safety-review-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Proceed from Form -> Confirmation
  const handleProceedToConfirmation = async (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      speak('Please fix the errors in the payment form before proceeding.');
      return;
    }

    // Trigger backend risk assessment
    setAssessing(true);
    setAssessment(null);
    setAssessmentError(null);
    setStage('CONFIRMATION');
    setDemoConfirmed(false);
    setHighRiskConfirmed(false);
    setWarningsReviewed(false);
    setCancelledMessage(null);

    try {
      const risk = await api.analyzePayment(activeUser?.id || 1, {
        recipient_name: formData.recipient_name.trim(),
        recipient_upi: formData.recipient_upi.trim(),
        amount: parseFloat(formData.amount),
        note: formData.note.trim()
      });
      setAssessment(risk);

      if (risk.is_serious_risk || risk.risk_level === 'HIGH_RISK_SCAM') {
        speak(`Payment paused! Serious fraud risk detected. Please review all safety warnings and advice carefully before deciding.`, true);
        triggerVisualAlert('danger', `Payment Paused: High Risk Scam Detected`);
      } else if (risk.risk_level === 'CAUTION') {
        speak(`Caution: New recipient detected. Review details before proceeding.`);
        triggerVisualAlert('warning', 'Caution: Please review recipient details');
      } else {
        speak(`Reviewing simulated payment of ₹${formData.amount} to ${formData.recipient_name}.`);
      }
    } catch (err) {
      console.warn('Risk assessment query notice:', err);
      setAssessmentError(err.message || 'Security check unavailable.');
    } finally {
      setAssessing(false);
    }
  };

  // Execute Simulated Payment (FastAPI + SQLite)
  const handleConfirmExecute = async () => {
    if (submitting) return;

    const isSerious = assessment?.is_serious_risk || assessment?.risk_level === 'HIGH_RISK_SCAM';

    if (!demoConfirmed) {
      alert(t('demoAcknowledgment', "Please confirm the demo checkbox before simulating this payment."));
      return;
    }

    if (isSerious && !warningsReviewed) {
      alert(t('iHaveReviewedWarnings', "Please review all the scam warnings above and tick the review confirmation box."));
      return;
    }

    if (isSerious && !highRiskConfirmed) {
      alert(t('highRiskWarningNotice', "This payment has been flagged as HIGH RISK FRAUD. Please check the deliberate risk confirmation box to simulate this test."));
      return;
    }

    setSubmitting(true);
    setExecutionError(null);

    try {
      const payload = {
        recipient_name: formData.recipient_name.trim(),
        recipient_upi: formData.recipient_upi.trim(),
        amount: parseFloat(formData.amount),
        note: formData.note.trim(),
        category: formData.category,
        emergency_override: highRiskConfirmed
      };

      const response = await api.executePayment(activeUser?.id || 1, payload);
      setExecutionResult(response);
      setStage('RESULT');

      // Refresh global context balance and user data from SQLite
      try {
        await refreshUserData();
      } catch {
        // Ignore background balance refresh failure
      }

      // Suppress animation when Silent Mode is active
      if (!silentMode) {
        try {
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        } catch {
          // Ignore confetti errors
        }
      }

      speak(`Simulated payment of ${response.amount} rupees to ${response.recipient_name} completed successfully! Your demo transaction ID is ${response.demo_transaction_id || ('DEMO-' + response.transaction_id)}.`, true);
      triggerVisualAlert('success', `Simulated payment of ₹${response.amount} saved to SQLite ledger!`);
    } catch (err) {
      console.error('Payment execution error:', err);
      let friendlyError = err.message || 'An unexpected error occurred while connecting to the backend.';
      
      if (err.status === 403) {
        friendlyError = t('errWalletFrozen', 'Wallet is currently FROZEN in Emergency SOS Mode. Outgoing transfers are locked to prevent loss.');
      } else if (err.status === 400) {
        friendlyError = err.details?.detail || err.message || 'Invalid payment parameters.';
      } else if (err.status === 422) {
        if (err.details?.detail?.message) {
          friendlyError = `${err.details.detail.message}: ${err.details.detail.reasons?.join(', ') || ''}`;
        } else {
          friendlyError = 'Validation failed: Check that recipient and amount values are valid.';
        }
      }

      setExecutionError(friendlyError);
      setStage('RESULT');
      speak(`Payment simulation failed: ${friendlyError}`, true);
      triggerVisualAlert('danger', friendlyError);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form for another payment
  const handleReset = () => {
    setFormData({
      recipient_name: '',
      recipient_upi: '',
      amount: '',
      category: 'Vendor',
      note: ''
    });
    setErrors({});
    setAssessment(null);
    setExecutionResult(null);
    setExecutionError(null);
    setStage('FORM');
    speak('Payment Simulator ready for new transaction.');
  };

  // Copy transaction ID to clipboard
  const handleCopyTxnId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(String(id));
    setCopiedId(true);
    triggerVisualAlert('success', 'Transaction ID copied to clipboard!');
    setTimeout(() => setCopiedId(false), 2500);
  };

  return (
    <div className="payment-simulator-container" style={{ maxWidth: '850px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* =========================================================================
          STAGE 1: CLEAN, ACCESSIBLE PAYMENT FORM
          ========================================================================= */}
      {stage === 'FORM' && (
        <div>
          {/* Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#eff6ff', color: '#1d4ed8', padding: '0.35rem 0.8rem', borderRadius: '999px', fontSize: 'var(--font-sm)', fontWeight: 700 }}>
                <Send size={16} />
                <span>{t('step1Details', 'Step 1: Enter Payment Details')}</span>
              </div>

              {/* Read instructions aloud button */}
              <ReadAloudButton 
                text={`${t('step1Details', 'Step 1: Enter Payment Details')}. ${t('paymentFormInstructions', 'Enter recipient name, UPI ID, and amount. SafePay checks for scams and validates your balance.')} ${t('typingAlternativeNotice', 'All voice features are optional. You can always type directly with the keyboard.')}`}
                label={t('readInstructions', 'Read instructions aloud')}
              />
            </div>

            <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, margin: '0 0 0.4rem 0', color: 'var(--text-primary)' }}>
              {paymentMode === 'send' ? t('navMakePayment', 'Payments — Send Money') : 'Payments — Request Money'}
            </h1>
            <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', margin: 0 }}>
              {t('paymentFormInstructions', 'Simulate UPI digital payments in a safe, risk-free educational environment. No real money is transferred.')}
            </p>
          </div>

          {/* Uizard Style Segmented Tab Switcher: Send Money / Request Money */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', maxWidth: '340px', background: 'var(--bg-tertiary)', padding: '0.35rem', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => { setPaymentMode('send'); setRequestSent(false); }}
              style={{
                flex: 1,
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: paymentMode === 'send' ? 'var(--brand-gradient)' : 'transparent',
                color: paymentMode === 'send' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: 'var(--font-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                transition: 'all 0.2s ease',
                boxShadow: paymentMode === 'send' ? '0 4px 12px var(--color-brand-glow)' : 'none'
              }}
            >
              <Send size={15} />
              <span>Send Money</span>
            </button>
            <button
              type="button"
              onClick={() => { setPaymentMode('request'); }}
              style={{
                flex: 1,
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: paymentMode === 'request' ? 'var(--brand-gradient)' : 'transparent',
                color: paymentMode === 'request' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: 'var(--font-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                transition: 'all 0.2s ease',
                boxShadow: paymentMode === 'request' ? '0 4px 12px var(--color-brand-glow)' : 'none'
              }}
            >
              <RotateCcw size={15} />
              <span>Request Money</span>
            </button>
          </div>

          {paymentMode === 'request' ? (
            <div className="card" style={{ padding: '2rem', marginBottom: '2rem', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <RotateCcw size={28} color="var(--color-brand)" />
                <div>
                  <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, margin: 0 }}>
                    Request Money Simulator (UPI Collect)
                  </h2>
                  <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
                    Practice creating payment requests safely. Learn how collect requests work and how to recognize collect request fraud.
                  </p>
                </div>
              </div>

              {/* Crucial Cyber Warning Banner */}
              <div style={{
                background: 'rgba(244, 63, 94, 0.1)',
                border: '2px solid var(--color-brand)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '0.9rem',
                alignItems: 'flex-start'
              }}>
                <ShieldAlert size={28} color="var(--color-brand)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ fontSize: 'var(--font-md)', color: 'var(--color-brand)', display: 'block', marginBottom: '0.35rem' }}>
                    🚨 GOLDEN RULE: You NEVER need to enter a UPI PIN to receive money!
                  </strong>
                  <p style={{ margin: 0, fontSize: 'var(--font-sm)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    Fraudsters often call online sellers (e.g., on OLX or WhatsApp) saying: <em>"I sent you an advance payment request, just enter your UPI PIN to accept it!"</em><br />
                    <strong>This is 100% fraud.</strong> Entering your UPI PIN always authorizes an <strong>outgoing transfer</strong> from your account to the scammer.
                  </p>
                </div>
              </div>

              {requestSent ? (
                <div style={{
                  background: 'var(--color-safe-bg)',
                  border: '2px solid var(--color-safe-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <CheckCircle2 size={42} color="var(--color-safe)" style={{ margin: '0 auto 0.75rem' }} />
                  <h3 style={{ fontSize: 'var(--font-xl)', color: 'var(--color-safe)', margin: '0 0 0.5rem' }}>
                    Simulated Collect Request Created!
                  </h3>
                  <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-primary)', margin: '0 0 1rem' }}>
                    Requested <strong>₹{parseFloat(requestData.amount || '0').toLocaleString('en-IN')}</strong> from <strong>{requestData.payer_upi || 'payer@okhdfcbank'}</strong>.
                  </p>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 1.5rem' }}>
                    In a real UPI app, the payer receives a notification on their smartphone asking them to approve and enter their UPI PIN to complete the transfer to you.
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      setRequestSent(false);
                      setRequestData({ payer_upi: '', amount: '', note: '' });
                    }}
                  >
                    Create Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!requestData.payer_upi || !requestData.amount) {
                    alert('Please enter payer UPI ID and requested amount');
                    return;
                  }
                  setRequestSent(true);
                  speak(`Simulated request of ${requestData.amount} rupees sent to ${requestData.payer_upi}`);
                }}>
                  <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: 'var(--font-sm)', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                        Payer UPI ID / Mobile Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. payer.name@okaxis or 9876543210"
                        value={requestData.payer_upi}
                        onChange={(e) => setRequestData({ ...requestData, payer_upi: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1.5px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: 'var(--font-md)'
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: 'var(--font-sm)', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                        Amount to Request (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 500"
                        min="1"
                        max="100000"
                        value={requestData.amount}
                        onChange={(e) => setRequestData({ ...requestData, amount: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1.5px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: 'var(--font-md)'
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: 'var(--font-sm)', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                        Reason / Note (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dinner bill split / Book sale"
                        value={requestData.note}
                        onChange={(e) => setRequestData({ ...requestData, note: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1.5px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: 'var(--font-md)'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.95rem',
                      fontSize: 'var(--font-md)',
                      fontWeight: 800,
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    Simulate Sending Collect Request
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
          {/* Voice & Typing Accessibility Notice */}
          <div 
            style={{
              background: 'var(--bg-secondary)',
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1.15rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              fontSize: 'var(--font-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <Lock size={16} color="var(--color-brand)" />
              <span>{t('typingAlternativeNotice', 'All voice features are optional. You can always type directly with the keyboard.')}</span>
            </div>
            <span style={{ color: '#047857', fontWeight: 700, fontSize: '0.85rem' }}>
              🛡️ {t('voiceNeverAuthorizes', 'Safety rule: Voice recognition will NEVER authorize or send a payment.')}
            </span>
          </div>

          {/* Cancellation Feedback Banner */}
          {cancelledMessage && (
            <div 
              style={{
                background: '#f0fdf4',
                border: '2px solid #22c55e',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.85rem'
              }}
              role="alert"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={24} color="#16a34a" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--font-md)', color: '#15803d', fontWeight: 700 }}>
                  {cancelledMessage}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCancelledMessage(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#15803d', padding: '0.2rem 0.5rem' }}
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          )}

          {/* Prominent Demo Disclaimer Banner */}
          <div 
            style={{
              background: '#eff6ff',
              border: '2px solid #3b82f6',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}
            role="note"
            aria-label="Simulation notice"
          >
            <Info size={24} color="#2563eb" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#1d4ed8', display: 'block', fontSize: 'var(--font-md)' }}>
                {t('demoNotice', 'DEMO APPLICATION • NO REAL MONEY IS TRANSFERRED')}
              </strong>
              <span style={{ fontSize: 'var(--font-sm)', color: '#1e40af' }}>
                {t('simulationBanner', 'All balances, recipients, and receipts are synthetic simulations stored in SQLite. Never enter real bank account passwords or UPI PINs.')}
              </span>
            </div>
          </div>

          {/* Current Available Demo Balance Box */}
          <div 
            style={{
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('balanceRemaining', 'Available Simulated Balance')} ({activeUser?.name || 'Active User'})
              </span>
              <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--color-brand)' }}>
                ₹{activeUser?.balance ? activeUser.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
              </div>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={resetDemoBalance}
              style={{ fontSize: 'var(--font-sm)', padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              title="Replenish demo balance to ₹15,000"
            >
              <RotateCcw size={14} />
              <span>Reset Balance (₹15,000)</span>
            </button>
          </div>

          {/* Quick-Fill Testing Presets Bar */}
          <div style={{ marginBottom: '1.75rem' }}>
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
              ⚡ 1-Click Test Presets (Safe vs Fraud Demos):
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.65rem' }}>
              {quickPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  style={{
                    textAlign: 'left',
                    padding: '0.75rem 0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${preset.type === 'safe' ? 'var(--color-safe-border)' : 'var(--color-danger-border)'}`,
                    background: preset.type === 'safe' ? 'var(--color-safe-bg)' : 'var(--color-danger-bg)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={preset.hint}
                >
                  <strong style={{ fontSize: 'var(--font-sm)', display: 'block', color: preset.type === 'safe' ? 'var(--color-safe)' : 'var(--color-danger)' }}>
                    {preset.label}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {preset.upi} • {preset.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Payment Form Card */}
          <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <form onSubmit={handleProceedToConfirmation} noValidate>
              
              {/* Field 1: Recipient Name */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label htmlFor="sim-recipient-name" style={{ fontWeight: 700, fontSize: 'var(--font-md)' }}>
                    {t('recipientName', 'Recipient Name')} *
                  </label>
                  {contacts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowContactPicker(!showContactPicker)}
                      style={{ fontSize: 'var(--font-sm)', color: 'var(--color-brand)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {showContactPicker ? 'Hide Saved Contacts' : t('selectRecipient', 'Pick from Trusted Contacts')}
                    </button>
                  )}
                </div>

                {/* Optional Contact Quick-Picker Dropdown */}
                {showContactPicker && (
                  <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                      {t('selectRecipient', 'Choose a verified contact:')}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {contacts.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="toggle-chip"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              recipient_name: c.name,
                              recipient_upi: c.upi_id,
                              amount: c.quick_amount ? String(c.quick_amount) : prev.amount,
                              category: c.category || 'Vendor'
                            }));
                            setShowContactPicker(false);
                            speak(`Selected contact ${c.name}.`);
                          }}
                        >
                          {c.name} ({c.upi_id})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <input
                  id="sim-recipient-name"
                  type="text"
                  required
                  placeholder="e.g. Gopal Cow Milk Dairy or Ramesh Kumar"
                  value={formData.recipient_name}
                  onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    fontSize: 'var(--font-md)',
                    borderRadius: 'var(--radius-sm)',
                    border: errors.recipient_name ? '2px solid var(--color-danger)' : '2px solid var(--border-color)',
                    background: 'var(--bg-primary)'
                  }}
                  aria-invalid={Boolean(errors.recipient_name)}
                  aria-describedby={errors.recipient_name ? 'recipient-name-error' : undefined}
                />
                {errors.recipient_name && (
                  <p id="recipient-name-error" style={{ color: 'var(--color-danger)', fontSize: 'var(--font-sm)', marginTop: '0.3rem', fontWeight: 600 }}>
                    ⚠️ {errors.recipient_name}
                  </p>
                )}
              </div>

              {/* Field 2: Recipient UPI ID */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="sim-recipient-upi" style={{ display: 'block', fontWeight: 700, fontSize: 'var(--font-md)', marginBottom: '0.35rem' }}>
                  {t('recipientUpi', 'Recipient UPI ID (VPA)')} *
                </label>
                <input
                  id="sim-recipient-upi"
                  type="text"
                  required
                  placeholder="e.g. gopal.dairy@paytm or name@okaxis"
                  value={formData.recipient_upi}
                  onChange={(e) => setFormData({ ...formData, recipient_upi: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    fontSize: 'var(--font-md)',
                    borderRadius: 'var(--radius-sm)',
                    border: errors.recipient_upi ? '2px solid var(--color-danger)' : '2px solid var(--border-color)',
                    background: 'var(--bg-primary)'
                  }}
                  aria-invalid={Boolean(errors.recipient_upi)}
                  aria-describedby={errors.recipient_upi ? 'recipient-upi-error' : undefined}
                />
                {errors.recipient_upi ? (
                  <p id="recipient-upi-error" style={{ color: 'var(--color-danger)', fontSize: 'var(--font-sm)', marginTop: '0.3rem', fontWeight: 600 }}>
                    ⚠️ {errors.recipient_upi}
                  </p>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Standard UPI handle format (e.g. username@bank).
                  </span>
                )}
              </div>

              {/* Field 3: Amount with Strict Validation */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="sim-amount" style={{ display: 'block', fontWeight: 700, fontSize: 'var(--font-md)', marginBottom: '0.35rem' }}>
                  {t('amountInRupees', 'Simulated Amount (₹)')} *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-muted)' }}>
                    ₹
                  </span>
                  <input
                    id="sim-amount"
                    type="number"
                    step="any"
                    min="1"
                    max="50000"
                    required
                    placeholder="e.g. 150"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem 0.85rem 2.5rem',
                      fontSize: 'var(--font-2xl)',
                      fontWeight: 800,
                      borderRadius: 'var(--radius-sm)',
                      border: errors.amount ? '2px solid var(--color-danger)' : '2px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                    aria-invalid={Boolean(errors.amount)}
                    aria-describedby={errors.amount ? 'amount-error' : 'amount-hint'}
                  />
                </div>
                {errors.amount ? (
                  <p id="amount-error" style={{ color: 'var(--color-danger)', fontSize: 'var(--font-sm)', marginTop: '0.35rem', fontWeight: 700 }}>
                    ⚠️ {errors.amount}
                  </p>
                ) : (
                  <span id="amount-hint" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Zero, negative, or excessive amounts are strictly rejected by both client and backend.
                  </span>
                )}
              </div>

              {/* Field 4: Category Dropdown */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="sim-category" style={{ display: 'block', fontWeight: 700, fontSize: 'var(--font-md)', marginBottom: '0.35rem' }}>
                  Payment Category
                </label>
                <select
                  id="sim-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    fontSize: 'var(--font-md)',
                    borderRadius: 'var(--radius-sm)',
                    border: '2px solid var(--border-color)',
                    background: 'var(--bg-primary)'
                  }}
                >
                  <option value="Vendor">Vendor & Daily Essentials (Milk, Kirana)</option>
                  <option value="Healthcare">Healthcare & Pharmacy Medicines</option>
                  <option value="Family">Family & Personal Transfer</option>
                  <option value="Utilities">Utilities & Bills (Simulated)</option>
                  <option value="General">General Transfer</option>
                </select>
              </div>

              {/* Field 5: Note / Purpose */}
              <div style={{ marginBottom: '1.75rem' }}>
                <label htmlFor="sim-note" style={{ display: 'block', fontWeight: 700, fontSize: 'var(--font-md)', marginBottom: '0.35rem' }}>
                  Payment Purpose / Note (Optional)
                </label>
                <input
                  id="sim-note"
                  type="text"
                  placeholder={t('notePlaceholder', 'e.g. Daily Milk Payment or Medicine for cold')}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    fontSize: 'var(--font-md)',
                    borderRadius: 'var(--radius-sm)',
                    border: '2px solid var(--border-color)',
                    background: 'var(--bg-primary)'
                  }}
                />
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {onReturnToDashboard && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={onReturnToDashboard}
                    style={{ padding: '0.85rem 1.4rem', fontSize: 'var(--font-md)' }}
                  >
                    {t('cancelPayment', 'Cancel')}
                  </button>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '0.95rem 2rem',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>{t('btnReviewPayment', 'Review Simulated Payment')}</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </form>
          </div>
          </>
          )}
        </div>
      )}

      {/* =========================================================================
          STAGE 2: CONFIRMATION SCREEN BEFORE PAYMENT SIMULATION
          ========================================================================= */}
      {stage === 'CONFIRMATION' && (
        <div>
          {/* Top Bar with Clear Options to Go Back, Cancel, or Listen */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStage('FORM')}
                disabled={submitting}
                style={{ fontSize: 'var(--font-sm)', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <ArrowLeft size={16} />
                <span>{t('btnBackEdit', 'Back to Edit')}</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelPayment}
                disabled={submitting}
                style={{ fontSize: 'var(--font-sm)', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-danger)' }}
              >
                <XCircle size={16} />
                <span>{t('btnCancelPayment', 'Cancel Payment')}</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('step2Confirm', 'Step 2: Review & Confirm')}
              </span>
              <ReadAloudButton 
                text={`${t('step2Confirm', 'Step 2: Review & Confirm')}. ${t('confirmationInstructions', 'Carefully review all details. Voice alone never sends money. Check the confirmation box and tap Confirm.')} Paying ${formData.amount} rupees to ${formData.recipient_name}. ${assessment?.spoken_warning || ''}`}
                label={t('readInstructions', 'Read instructions aloud')}
              />
            </div>
          </div>

          {/* FEATURE 1: CONDITIONAL SCAM-RISK INTERFACE (LOW, MEDIUM, HIGH, CRITICAL) */}
          <ConditionalScamRiskInterface
            assessment={assessment}
            formData={formData}
            onProceed={() => {
              const confirmBlock = document.getElementById('final-confirm-block');
              if (confirmBlock) confirmBlock.scrollIntoView({ behavior: 'smooth' });
            }}
            onCancel={handleCancelPayment}
            onReviewAgain={() => {
              setStage('FORM');
              speak('Returning to payment form to review details.');
            }}
            onGetSafetyAdvice={() => {
              const safetySec = document.getElementById('safety-review-section');
              if (safetySec) safetySec.scrollIntoView({ behavior: 'smooth' });
            }}
            isSubmitting={submitting}
            error={assessmentError}
          />

          {/* SAFETY REVIEW CARD (Recipient, UPI ID, Amount, Purpose) */}
          <div 
            id="safety-review-section"
            className="card" 
            tabIndex="-1"
            style={{ padding: '2rem', marginBottom: '2rem' }}
          >
            <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={26} color="var(--color-brand)" />
                  <span>{t('safetyReviewTitle', 'Safety Review of Payment Details')}</span>
                </h3>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 0 }}>
                  {t('safetyReviewSubtitle', 'Please carefully review the recipient, UPI ID, and amount before confirmation.')}
                </p>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleScrollToReview}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                🔍 {t('btnReviewPaymentDetails', 'Review Details')}
              </button>
            </div>

            {/* 3 Review Pillars: Recipient, UPI ID, Amount */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
              
              {/* Pillar 1: Recipient Identity */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                  1. Recipient Identity
                </span>
                <strong style={{ fontSize: 'var(--font-lg)', display: 'block', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  {formData.recipient_name}
                </strong>
                <div style={{ marginBottom: '0.5rem' }}>
                  {assessment?.is_trusted_contact ? (
                    <span style={{ display: 'inline-block', fontSize: '0.8rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--color-safe-bg)', color: 'var(--color-safe)' }}>
                      🟢 {t('verifiedContactBadge', 'Verified Trusted Contact')}
                    </span>
                  ) : assessment?.is_known_scam ? (
                    <span style={{ display: 'inline-block', fontSize: '0.8rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                      🔴 {t('blacklistedContactBadge', 'High Danger: Blacklisted Scam Handle')}
                    </span>
                  ) : (
                    <span style={{ display: 'inline-block', fontSize: '0.8rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--color-caution-bg)', color: 'var(--color-caution)' }}>
                      🟡 {t('unverifiedContactBadge', 'Unknown Recipient (First Time)')}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                  {assessment?.recipient_safety_note || (assessment?.is_trusted_contact ? 'Verified contact in your address book.' : 'First time paying this recipient. Verify their phone number carefully.')}
                </p>
              </div>

              {/* Pillar 2: UPI Handle */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                  2. UPI Address / Handle
                </span>
                <code style={{ fontSize: 'var(--font-md)', fontWeight: 800, display: 'block', marginBottom: '0.5rem', color: 'var(--color-brand)', wordBreak: 'break-all' }}>
                  {formData.recipient_upi}
                </code>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                  {assessment?.upi_safety_note || 'Standard UPI address format. Confirm spelling before paying.'}
                </p>
              </div>

              {/* Pillar 3: Amount & Balance Impact */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                  3. Payment Amount
                </span>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  ₹{parseFloat(formData.amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <span>Current Demo Balance: <strong>₹{activeUser?.balance ? activeUser.balance.toLocaleString('en-IN') : '0.00'}</strong></span>
                  <span>After Transfer: <strong style={{ color: 'var(--color-brand)' }}>₹{(activeUser ? activeUser.balance - parseFloat(formData.amount || '0') : 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                </div>
              </div>
            </div>

            {/* Note / Purpose if present */}
            {formData.note && (
              <div style={{ background: 'var(--bg-primary)', border: '1px dashed var(--border-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.75rem', fontSize: 'var(--font-sm)' }}>
                <strong style={{ color: 'var(--text-muted)' }}>Payment Purpose: </strong>
                <span>{formData.note}</span>
              </div>
            )}

            {/* SCAM DETECTOR FINDINGS: WHY FLAGGED & WHAT TO DO NEXT */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 800, marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
                {t('safePayScore', 'SafePay Security Findings & Explanations')}:
              </h4>

              {assessing ? (
                <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={18} className="spin-animate" color="var(--color-brand)" />
                  <span>Scanning recipient handle and note against fraud rules...</span>
                </div>
              ) : assessmentError ? (
                <div style={{ padding: '1rem 1.25rem', background: 'var(--color-caution-bg)', border: '1px solid var(--color-caution-border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AlertCircle size={24} color="var(--color-caution)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'var(--color-caution)', display: 'block', fontSize: 'var(--font-md)' }}>
                      Security Check Advisory
                    </strong>
                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                      {assessmentError}
                    </span>
                  </div>
                </div>
              ) : assessment && assessment.flags && assessment.flags.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {assessment.flags.map((flag, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--radius-sm)',
                        background: flag.severity === 'HIGH' || flag.severity === 'CRITICAL' ? 'var(--color-danger-bg)' : 'var(--color-caution-bg)',
                        border: `1px solid ${flag.severity === 'HIGH' || flag.severity === 'CRITICAL' ? '#fca5a5' : '#fcd34d'}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <strong style={{ fontSize: 'var(--font-md)', color: flag.severity === 'HIGH' || flag.severity === 'CRITICAL' ? '#991b1b' : '#92400e' }}>
                          ⚠️ {flag.title}
                        </strong>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-xs)', background: flag.severity === 'HIGH' || flag.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b', color: '#ffffff' }}>
                          {flag.category || flag.severity}
                        </span>
                      </div>

                      {/* Plain-language explanation: Why this was flagged */}
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: 'var(--font-sm)', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                        <strong>{t('warningWhyFlagged', 'Why this was flagged:')}</strong> {flag.description}
                      </p>

                      {/* Clear action: What you should do next */}
                      <div style={{ background: '#ffffff', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(0,0,0,0.08)', fontSize: 'var(--font-sm)' }}>
                        <strong style={{ color: '#1e40af' }}>👉 {t('warningWhatToDoNext', 'What you should do next:')} </strong>
                        <span style={{ color: '#1f2937' }}>{flag.what_to_do_next || 'Do not send money. Verify independently with your bank or trusted family member.'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1rem 1.25rem', background: 'var(--color-safe-bg)', border: '1px solid var(--color-safe-border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShieldCheck size={24} color="var(--color-safe)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'var(--color-safe)', display: 'block', fontSize: 'var(--font-md)' }}>
                      No Recognized Scam Patterns Detected
                    </strong>
                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                      Recipient and purpose do not match known fraud catalogs or phishing indicators.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* PLAIN-LANGUAGE SAFETY CHECKLIST FOR OLDER ADULTS */}
            <div style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
              <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 800, margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-brand)' }}>
                <ShieldCheck size={20} />
                <span>{t('safetyChecklistTitle', 'Safety Checklist: What You Need to Know')}</span>
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: 'var(--font-sm)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                <li><strong>🔑 Requests for OTP or UPI PIN:</strong> {t('checklistOtpPin', 'Never share your OTP or enter your UPI PIN to receive money. UPI PIN is only typed to send money.')}</li>
                <li><strong>📱 Remote-Access Applications:</strong> {t('checklistRemoteAccess', 'Never install AnyDesk, TeamViewer, or QuickSupport on instructions from an unknown caller.')}</li>
                <li><strong>🔗 Suspicious Links & Unknown URLs:</strong> {t('checklistSuspiciousLinks', 'Do not click on unverified links, shortened URLs (like bit.ly), or payment links received in messages.')}</li>
                <li><strong>🎁 Fake Refunds, Prizes & Lotteries:</strong> {t('checklistFakeRefunds', 'Legitimate refunds are credited directly to your bank account without any fee or PIN requirement.')}</li>
                <li><strong>⏳ Pressure to Pay Urgently:</strong> {t('checklistUrgentPressure', 'Beware of threats of immediate power cuts (15 minutes) or account blocking. Real utility boards never demand instant UPI transfers.')}</li>
              </ul>
            </div>

            {/* NEVER CLAIM GUARANTEED SAFE DISCLAIMER */}
            <div 
              style={{
                background: '#eff6ff',
                border: '1px solid #93c5fd',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: 'var(--font-xs)',
                color: '#1e40af'
              }}
            >
              <Info size={18} color="#2563eb" style={{ flexShrink: 0 }} />
              <span>
                {assessment?.disclaimer || t('detectorNoGuarantee', 'Automated CyberCare warning: This rule-based check analyzes known fraud indicators. It cannot guarantee that any transaction is completely safe. Always verify unknown recipients independently.')}
              </span>
            </div>

            {/* Security Guardrail Notice */}
            <div 
              style={{
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: 'var(--font-sm)'
              }}
            >
              <Lock size={18} color="#b45309" style={{ flexShrink: 0 }} />
              <span style={{ color: '#92400e', fontWeight: 600 }}>
                <strong>{t('voiceNeverAuthorizes', 'Safety rule: Voice recognition will NEVER authorize or send a payment.')}</strong> Manual checkbox confirmation and physical tap are strictly mandatory.
              </span>
            </div>

            {/* Required Confirmations & Overrides */}
            <div id="final-confirm-block" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-md)'
                }}
              >
                <input
                  type="checkbox"
                  checked={demoConfirmed}
                  onChange={(e) => setDemoConfirmed(e.target.checked)}
                  style={{ width: '22px', height: '22px', marginTop: '2px', accentColor: 'var(--color-brand)' }}
                />
                <span>
                  <strong>{t('demoAcknowledgment', 'I understand this is a DEMO payment.')}</strong> {t('demoNotice', 'No real money will be transferred or debited from any real bank account.')}
                </span>
              </label>

              {/* Serious Risk Warning Review Checkbox */}
              {(assessment?.is_serious_risk || assessment?.risk_level === 'HIGH_RISK_SCAM') && (
                <label 
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    background: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-md)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={warningsReviewed}
                    onChange={(e) => setWarningsReviewed(e.target.checked)}
                    style={{ width: '22px', height: '22px', marginTop: '2px', accentColor: '#dc2626' }}
                  />
                  <span style={{ color: '#991b1b' }}>
                    <strong>{t('iHaveReviewedWarnings', 'I have read and understood all the scam warnings and advice above.')}</strong>
                  </span>
                </label>
              )}

              {/* Deliberate Test Override Checkbox */}
              {(assessment?.risk_level === 'HIGH_RISK_SCAM' || assessment?.is_serious_risk) && (
                <label 
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    background: 'var(--color-danger-bg)',
                    border: '1px solid var(--color-danger-border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-md)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={highRiskConfirmed}
                    onChange={(e) => setHighRiskConfirmed(e.target.checked)}
                    style={{ width: '22px', height: '22px', marginTop: '2px', accentColor: '#dc2626' }}
                  />
                  <span style={{ color: '#991b1b' }}>
                    <strong>{t('highRiskWarningNotice', 'Deliberate Demo Override:')}</strong> {t('highRiskDeliberateConfirmation', 'I acknowledge SafePay flagged this as high risk fraud, and wish to simulate this transaction for testing purposes.')}
                  </span>
                </label>
              )}
            </div>

            {/* Clear Action Buttons: Back, Cancel, Review Details, Confirm */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStage('FORM')}
                disabled={submitting}
                style={{ padding: '0.9rem 1.4rem', fontSize: 'var(--font-md)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <ArrowLeft size={18} />
                <span>{t('btnBackEdit', 'Back to Edit')}</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelPayment}
                disabled={submitting}
                style={{ padding: '0.9rem 1.4rem', fontSize: 'var(--font-md)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-danger)' }}
              >
                <XCircle size={18} />
                <span>{t('btnCancelPayment', 'Cancel Payment')}</span>
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmExecute}
                disabled={
                  submitting || 
                  !demoConfirmed || 
                  ((assessment?.is_serious_risk || assessment?.risk_level === 'HIGH_RISK_SCAM') && (!warningsReviewed || !highRiskConfirmed))
                }
                style={{
                  padding: '1rem 2.2rem',
                  fontSize: 'var(--font-lg)',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: (
                    !demoConfirmed || 
                    ((assessment?.is_serious_risk || assessment?.risk_level === 'HIGH_RISK_SCAM') && (!warningsReviewed || !highRiskConfirmed))
                  ) ? 0.6 : 1
                }}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={20} className="spin-animate" />
                    <span>Executing Simulated Transfer...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>{t('btnConfirmSimulate', 'Confirm & Simulate Payment')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 3: RESULT SCREEN (SUCCESS OR FAILURE)
          ========================================================================= */}
      {stage === 'RESULT' && (
        <div>
          {/* SUCCESS STATE */}
          {executionResult && !executionError && (
            <div className="card" style={{ padding: '2.5rem 2rem', border: '3px solid var(--color-safe)', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <ReadAloudButton 
                  text={`${t('paymentSuccessful', 'Simulated Payment Successful!')} ${executionResult.amount} rupees to ${executionResult.recipient_name}. ${t('demoTxnIdLabel', 'Demo Transaction ID')}: ${executionResult.demo_transaction_id || ('DEMO-' + executionResult.transaction_id)}.`}
                  label={t('readInstructions', 'Read instructions aloud')}
                />
              </div>

              <div 
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  background: 'var(--color-safe-bg)',
                  color: 'var(--color-safe)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  border: '3px solid var(--color-safe-border)'
                }}
              >
                <CheckCircle2 size={44} />
              </div>

              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-safe)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('paymentSuccessful', 'Simulated Payment Successful')}
              </span>

              <div style={{ fontSize: 'clamp(2.5rem, 6vw, 3.8rem)', fontWeight: 900, color: 'var(--color-safe)', margin: '0.4rem 0' }}>
                ₹{parseFloat(String(executionResult.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>

              <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                {t('confirmAndPay', 'Paid to')}: {executionResult.recipient_name}
              </h2>
              <span style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)' }}>
                {executionResult.recipient_upi}
              </span>

              {/* Unique Demo Transaction ID Badge */}
              <div 
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  margin: '1.75rem auto',
                  maxWidth: '520px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>
                    {t('demoTxnIdLabel', 'Unique Demo Transaction ID')}:
                  </span>
                  <strong style={{ fontFamily: 'monospace', fontSize: 'var(--font-lg)', color: 'var(--color-brand)' }}>
                    {executionResult.demo_transaction_id || `DEMO-TXN-${executionResult.transaction_id}`}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyTxnId(executionResult.demo_transaction_id || `DEMO-TXN-${executionResult.transaction_id}`)}
                  className="btn-secondary"
                  style={{ fontSize: 'var(--font-sm)', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  {copiedId ? <Check size={14} color="var(--color-safe)" /> : <Copy size={14} />}
                  <span>{copiedId ? t('copied', 'Copied') : t('btnCopyTxnId', 'Copy ID')}</span>
                </button>
              </div>

              {/* Receipt Details List */}
              <div 
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  maxWidth: '520px',
                  margin: '0 auto 1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  textAlign: 'left',
                  fontSize: 'var(--font-md)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                  <strong style={{ color: 'var(--color-safe)' }}>✓ {executionResult.status} (Saved to SQLite)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t('balanceRemaining', 'Remaining Demo Balance')}:</span>
                  <strong style={{ color: 'var(--color-brand)' }}>
                    ₹{Number(executionResult.new_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span>
                  <span>{new Date(executionResult.timestamp).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Simulation Notice:</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('demoNotice', 'No real money transferred')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {onViewHistory && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={onViewHistory}
                    style={{
                      padding: '0.95rem 1.8rem',
                      fontSize: 'var(--font-md)',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <History size={18} />
                    <span>{t('btnViewHistory', 'View in Transaction History')}</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleReset}
                  style={{
                    padding: '0.95rem 1.6rem',
                    fontSize: 'var(--font-md)',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Send size={18} />
                  <span>{t('btnMakeAnother', 'Simulate Another Payment')}</span>
                </button>
              </div>
            </div>
          )}

          {/* FAILURE STATE */}
          {executionError && (
            <div className="card" style={{ padding: '2.5rem 2rem', border: '3px solid var(--color-danger)', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <ReadAloudButton 
                  text={`${t('errScamBlocked', 'Payment Simulation Blocked')}: ${executionError}`}
                  label={t('readInstructions', 'Read instructions aloud')}
                />
              </div>

              <div 
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  background: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  border: '3px solid var(--color-danger-border)'
                }}
              >
                <AlertCircle size={44} />
              </div>

              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-danger)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('errScamBlocked', 'Payment Simulation Blocked / Failed')}
              </span>

              <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--color-danger)', margin: '0.4rem 0 1rem' }}>
                Unable to Complete Simulated Payment
              </h2>

              <div 
                style={{
                  background: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  maxWidth: '560px',
                  margin: '0 auto 1.75rem',
                  textAlign: 'left'
                }}
              >
                <strong style={{ display: 'block', marginBottom: '0.35rem', color: '#991b1b' }}>
                  Reason for Failure:
                </strong>
                <p style={{ margin: 0, fontSize: 'var(--font-md)', color: '#7f1d1d' }}>
                  {executionError}
                </p>
                <div style={{ marginTop: '0.75rem', fontSize: 'var(--font-sm)', color: '#991b1b', borderTop: '1px dashed var(--color-danger-border)', paddingTop: '0.5rem' }}>
                  Your simulated balance was <strong>not debited</strong> and no funds were moved.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setStage('FORM')}
                  style={{ padding: '0.9rem 1.6rem', fontSize: 'var(--font-md)', fontWeight: 800 }}
                >
                  {t('btnBackEdit', 'Edit Payment Details')}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleReset}
                  style={{ padding: '0.9rem 1.4rem', fontSize: 'var(--font-md)' }}
                >
                  {t('cancelPayment', 'Start Over')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
