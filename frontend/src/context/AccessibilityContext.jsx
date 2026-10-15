import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { TRANSLATIONS, AVAILABLE_LANGUAGES } from '../data/translations';

const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  // Language: 'en' | 'kn' | 'hi' | 'te'
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('easypay_language') || 'en';
  });

  // Font Size: 'standard' | 'large' | 'xlarge'
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('easypay_font_size') || 'large';
  });

  // Contrast Mode: 'dark' (Default EasySafePay Uizard Theme) | 'normal' | 'high-contrast' | 'yellow-black'
  const [contrastMode, setContrastMode] = useState(() => {
    return localStorage.getItem('easypay_contrast_mode') || 'dark';
  });

  // Voice Guidance (Speech Synthesis)
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('easypay_voice_enabled') !== 'false';
  });

  // Step-by-Step Slow Pay Mode (reassurance for seniors)
  const [slowMode, setSlowMode] = useState(() => {
    return localStorage.getItem('easypay_slow_mode') !== 'false';
  });

  // Sign & Secure visual-first mode (zero audio dependency)
  const [signSecureMode, setSignSecureMode] = useState(() => {
    return localStorage.getItem('easypay_sign_secure') === 'true';
  });

  // Silent Mode: Disables automatic speech and eliminates unnecessary animation
  const [silentMode, setSilentMode] = useState(() => {
    return localStorage.getItem('easypay_silent_mode') === 'true';
  });

  // Track if text-to-speech is currently playing
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Deaf-friendly visual flash notification state
  const [visualFlash, setVisualFlash] = useState(null);

  // Speech Recognition instance ref
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  // Translation lookup helper (never crashes)
  const t = useCallback((key, fallback = '') => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || fallback || key;
  }, [language]);

  // Synchronize localStorage & document root classes
  useEffect(() => {
    localStorage.setItem('easypay_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('easypay_font_size', fontSize);
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('easypay_contrast_mode', contrastMode);
    document.documentElement.setAttribute('data-contrast-mode', contrastMode);
  }, [contrastMode]);

  useEffect(() => {
    localStorage.setItem('easypay_voice_enabled', voiceEnabled);
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem('easypay_slow_mode', slowMode);
  }, [slowMode]);

  useEffect(() => {
    localStorage.setItem('easypay_sign_secure', signSecureMode);
  }, [signSecureMode]);

  useEffect(() => {
    localStorage.setItem('easypay_silent_mode', silentMode);
    document.documentElement.setAttribute('data-silent-mode', String(silentMode));
  }, [silentMode]);

  // Web Speech API wrapper (strictly local browser engine; zero external transmission)
  const speak = useCallback((text, userRequested = false) => {
    if (!text) return;
    // Silent mode mutes automatic speech; only allows explicit user-requested click
    if (silentMode && !userRequested) return;
    // Sign & Secure mode silences audio unless user explicitly requested speech
    if (signSecureMode && !userRequested) return;
    // If voice guidance toggle is off, do not speak unless explicitly requested by user
    if (!voiceEnabled && !userRequested) return;

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85; // Clear, senior-friendly pacing
        utterance.pitch = 1.0;
        const langObj = AVAILABLE_LANGUAGES.find(l => l.code === language);
        utterance.lang = langObj ? langObj.speechCode : 'en-IN';

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        setIsSpeaking(false);
        console.warn('Speech synthesis error:', e);
      }
    }
  }, [voiceEnabled, signSecureMode, silentMode, language]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Browser Speech Recognition (Input)
  const startSpeechRecognition = useCallback((onResult, onError) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError('Speech recognition is not supported in this browser. Please type directly.');
      return false;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      const recognition = new SpeechRecognition();
      const langObj = AVAILABLE_LANGUAGES.find(l => l.code === language);
      recognition.lang = langObj ? langObj.speechCode : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        setIsListening(false);
        const transcript = event.results[0]?.[0]?.transcript || '';
        if (onResult) onResult(transcript);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (onError) onError(event.error || 'Voice input error. Please type directly.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch (err) {
      setIsListening(false);
      if (onError) onError(err.message || 'Could not start speech recognition. Please type.');
      return false;
    }
  }, [language]);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Visual cues for Deaf/Hard of Hearing users
  const triggerVisualAlert = useCallback((type = 'info', message = '') => {
    setVisualFlash({ type, message });
    if (navigator.vibrate) {
      try {
        if (type === 'danger') navigator.vibrate([200, 100, 200]);
        else navigator.vibrate(100);
      } catch (e) {}
    }
    setTimeout(() => setVisualFlash(null), 3500);
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        language,
        setLanguage,
        availableLanguages: AVAILABLE_LANGUAGES,
        t,
        fontSize,
        setFontSize,
        contrastMode,
        setContrastMode,
        voiceEnabled,
        setVoiceEnabled,
        slowMode,
        setSlowMode,
        signSecureMode,
        setSignSecureMode,
        silentMode,
        setSilentMode,
        isSpeaking,
        speak,
        stopSpeaking,
        isListening,
        startSpeechRecognition,
        stopSpeechRecognition,
        visualFlash,
        triggerVisualAlert
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}
