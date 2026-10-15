import React from 'react';
import { Volume2, VolumeX, Square } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

/**
 * Accessible "Read instructions aloud" button using browser text-to-speech.
 * Fully localized for English, Kannada, Hindi, and Telugu.
 * Runs 100% locally in the browser; never sends user text or recordings to external servers.
 */
export default function ReadAloudButton({ 
  text, 
  label, 
  className = '', 
  style = {},
  variant = 'secondary' // 'primary' | 'secondary' | 'chip'
}) {
  const { speak, stopSpeaking, isSpeaking, t } = useAccessibility();
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupported) {
      alert(t('readAloudNotSupported', 'Browser speech synthesis is not supported on this device.'));
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
    } else if (text) {
      // Pass userRequested = true so it speaks even when Silent Mode or Sign & Secure is enabled
      speak(text, true);
    }
  };

  const buttonLabel = label || (isSpeaking ? t('stopReading', 'Stop reading') : t('readInstructions', 'Read instructions aloud'));

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    minHeight: '44px',
    padding: '0.6rem 1.1rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 700,
    fontSize: 'var(--font-sm)',
    cursor: isSupported ? 'pointer' : 'not-allowed',
    opacity: isSupported ? 1 : 0.6,
    transition: 'all 0.15s ease',
    ...style
  };

  const variantStyle = isSpeaking
    ? {
        background: '#ef4444',
        color: '#ffffff',
        border: '2px solid #dc2626',
        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.3)'
      }
    : variant === 'primary'
    ? {
        background: 'var(--color-brand)',
        color: '#ffffff',
        border: '2px solid var(--color-brand)'
      }
    : variant === 'chip'
    ? {
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '1.5px solid var(--border-color)',
        padding: '0.4rem 0.8rem',
        minHeight: '38px',
        fontSize: 'var(--font-xs)'
      }
    : {
        background: 'var(--color-brand-light)',
        color: 'var(--color-brand)',
        border: '1.5px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`read-aloud-btn ${className}`}
      style={{ ...baseStyle, ...variantStyle }}
      title={isSupported ? buttonLabel : t('readAloudNotSupported', 'Browser speech synthesis is not supported')}
      aria-label={buttonLabel}
      aria-pressed={isSpeaking}
    >
      {isSpeaking ? (
        <>
          <Square size={16} fill="currentColor" />
          <span>{buttonLabel}</span>
        </>
      ) : (
        <>
          <Volume2 size={18} />
          <span>{buttonLabel}</span>
        </>
      )}
    </button>
  );
}
