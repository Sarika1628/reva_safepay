/**
 * Shared Risk-Threshold Configuration for EasyPay & SafePay CyberCare Intelligence.
 * Shared between Frontend UI and Backend Heuristic Engine.
 *
 * Threshold Tiers:
 * - CRITICAL: 80 - 100 (Blacklist match, OTP theft, reverse PIN trap, remote access tools)
 * - HIGH:     50 - 79  (Artificial urgency, disconnection threats, lottery lures, suspicious links)
 * - MEDIUM:   25 - 49  (Unknown payee with large amount, micro-charge test, generic unverified links)
 * - LOW:       0 - 24  (No recognized warning signs; verified trusted contact)
 */

export const RISK_THRESHOLDS = {
  CRITICAL: 80,
  HIGH: 50,
  MEDIUM: 25,
  LOW: 0
};

export const RISK_CATEGORIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function classifyRisk(score = 0, isCriticalFlag = false, hasKnownScam = false) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));

  if (isCriticalFlag || hasKnownScam || safeScore >= RISK_THRESHOLDS.CRITICAL) {
    return 'CRITICAL';
  } else if (safeScore >= RISK_THRESHOLDS.HIGH) {
    return 'HIGH';
  } else if (safeScore >= RISK_THRESHOLDS.MEDIUM) {
    return 'MEDIUM';
  }
  return 'LOW';
}

export const CATEGORY_UI_METADATA = {
  LOW: {
    category: 'LOW',
    label: 'Low Risk',
    title: 'No Major Warning Signs Detected',
    calmMessage: 'No major warning signs were detected in this payment request or message.',
    iconName: 'ShieldCheck',
    colorHex: '#10b981',
    bgColorHex: '#ecfdf5',
    borderColorHex: '#10b981',
    accentColor: '#059669',
    ariaLive: 'polite',
    badgeClass: 'risk-badge-low',
    verifyReminder: 'Always verify the recipient independently before transferring funds.',
    neverGuaranteeSafeNote: 'SafePay CyberCare reminder: Automated security checks never guarantee that a recipient or message is 100% safe.',
    allowedActions: ['PROCEED_TO_CONFIRMATION', 'REVIEW_DETAILS', 'CANCEL']
  },
  MEDIUM: {
    category: 'MEDIUM',
    label: 'Caution — Medium Risk',
    title: 'Visible Caution: Warning Signs Detected',
    calmMessage: 'Caution: Potential scam patterns or unverified payee factors were identified.',
    iconName: 'AlertTriangle',
    colorHex: '#f59e0b',
    bgColorHex: '#fffbeb',
    borderColorHex: '#f59e0b',
    accentColor: '#d97706',
    ariaLive: 'assertive',
    badgeClass: 'risk-badge-medium',
    reviewPrompt: 'Please carefully review the recipient name, UPI ID, payment amount, and purpose before taking any action.',
    verifyReminder: 'Do not pay if you received unexpected payment instructions from an unverified caller.',
    allowedActions: ['REVIEW_AGAIN', 'CANCEL', 'PROCEED_WITH_CAUTION']
  },
  HIGH: {
    category: 'HIGH',
    label: 'High Scam Risk',
    title: 'Stop and Check Before Proceeding',
    calmMessage: 'High risk indicators detected. Fraudsters commonly use these exact tactics to induce panic or offer fake rewards.',
    iconName: 'ShieldAlert',
    colorHex: '#ea580c',
    bgColorHex: '#fff7ed',
    borderColorHex: '#ea580c',
    accentColor: '#c2410c',
    ariaLive: 'assertive',
    badgeClass: 'risk-badge-high',
    reviewPrompt: 'Significant fraud patterns detected. You must explicitly acknowledge this warning before simulating this transfer.',
    verifyReminder: 'Call the official company number on your physical bill or card. Never trust numbers sent via SMS.',
    allowedActions: ['CANCEL_PAYMENT', 'GET_SAFETY_ADVICE', 'ACKNOWLEDGE_AND_SIMULATE']
  },
  CRITICAL: {
    category: 'CRITICAL',
    label: 'CRITICAL DANGER',
    title: 'STOP IMMEDIATELY — Critical Scam Detected',
    calmMessage: 'Extreme danger of immediate financial loss, credential theft, or complete device compromise.',
    iconName: 'XCircle',
    colorHex: '#dc2626',
    bgColorHex: '#fef2f2',
    borderColorHex: '#dc2626',
    accentColor: '#991b1b',
    ariaLive: 'assertive',
    badgeClass: 'risk-badge-critical',
    reviewPrompt: 'This payment is PAUSED. One-click bypass is strictly prohibited. You must independently verify through an official channel.',
    verifyReminder: 'Do NOT share any OTP or enter your UPI PIN. UPI PIN is ONLY entered to send money, never to receive refunds.',
    officialChannelAdvice: 'Contact your bank directly using the phone number printed on the back of your physical debit card, or report immediately to 1930 Cyber Helpline.',
    allowedActions: ['CANCEL_PAYMENT', 'GET_OFFICIAL_CONTACTS', 'DELIBERATE_TEST_REVIEW']
  }
};
