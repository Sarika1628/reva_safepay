import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Languages, 
  Mic, 
  MicOff, 
  Keyboard, 
  ShieldCheck, 
  Lock, 
  BellOff, 
  Play, 
  Sparkles,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import ReadAloudButton from '../components/ReadAloudButton';
import SafePayVoiceAssistant from '../components/SafePayVoiceAssistant';

export default function VoiceLanguageAssist({ onNavigateTab }) {
  const { 
    language, 
    setLanguage, 
    availableLanguages, 
    t, 
    voiceEnabled, 
    setVoiceEnabled, 
    silentMode, 
    setSilentMode, 
    speak,
    startSpeechRecognition,
    stopSpeechRecognition,
    isListening,
    triggerVisualAlert
  } = useAccessibility();

  const [speechSpeed, setSpeechSpeed] = useState(0.85); // 0.7 to 1.1
  const [typedQuery, setTypedQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [voiceNotice, setVoiceNotice] = useState('');

  // Sample quick questions for older adults
  const quickQuestions = [
    { text: "Is it safe to pay milk vendor?", response: "Yes. Gopal Dairy is in your verified Trusted Contacts directory. SafePay verifies their UPI handle as safe." },
    { text: "Do I ever enter PIN to receive money?", response: "Never! Golden Rule: You only enter your UPI PIN to SEND money, never to RECEIVE money. Anyone asking for your PIN to send you money is a scammer." },
    { text: "What is the Cyber Crime Helpline number?", response: "The national cyber financial fraud helpline is 1930. You can also visit cybercrime.gov.in immediately if money was stolen." },
    { text: "What does Silent Mode do?", response: "Silent Mode mutes all automatic speech narration and stops all animations and transitions, giving you a quiet, steady screen." }
  ];

  const handleTestGreeting = () => {
    const greeting = language === 'kn' ? 'ನಮಸ್ಕಾರ! ಈಸಿಪೇ ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನ ಸಿದ್ಧವಾಗಿದೆ.' :
                     language === 'hi' ? 'नमस्ते! ईज़ीपे वॉयस मार्गदर्शन सहायता के लिए तैयार है।' :
                     language === 'te' ? 'నమస్కారం! EasyPay వాయిస్ మార్గదర్శకత్వం సహాయం చేయడానికి సిద్ధంగా ఉంది.' :
                     'Hello! EasyPay voice guidance is ready to assist you.';
    speak(greeting, true);
  };

  const handleProcessQuery = (queryText) => {
    const clean = queryText.trim();
    if (!clean) return;

    // Check pre-programmed answers or give helpful general guidance
    const matched = quickQuestions.find(q => q.text.toLowerCase() === clean.toLowerCase());
    let answer = matched ? matched.response : `EasyPay advice for "${clean}": Always double check the recipient name and amount before confirming. SafePay protects you against known fraud handles.`;
    
    setAssistantResponse(answer);
    speak(answer);
  };

  const handleStartVoice = () => {
    setVoiceNotice("Listening to your voice... Speak your question clearly.");
    const started = startSpeechRecognition(
      (transcript) => {
        setVoiceNotice(`Recognized: "${transcript}"`);
        setTypedQuery(transcript);
        handleProcessQuery(transcript);
      },
      (err) => {
        setVoiceNotice(`Voice note: ${err}`);
      }
    );
    if (!started) {
      setVoiceNotice("Voice input not supported in this browser. Please type below.");
    }
  };

  return (
    <div className="voice-language-page" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Header with Read Aloud Button */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#eff6ff', color: '#1d4ed8', padding: '0.35rem 0.8rem', borderRadius: '999px', fontSize: 'var(--font-sm)', fontWeight: 700 }}>
            <Languages size={16} />
            <span>{t('navVoice', 'Voice Guidance & Regional Languages')}</span>
          </div>

          <ReadAloudButton 
            text={`${t('navVoice', 'Voice Guidance & Regional Languages')}. Select your preferred language: English, Kannada, Hindi, or Telugu. All voice features are optional. You can always type directly with the keyboard.`}
            label={t('readInstructions', 'Read instructions aloud')}
          />
        </div>

        <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
          {t('navVoice', 'Voice Guidance & Regional Languages')}
        </h1>
        <p style={{ fontSize: 'var(--font-lg)', color: 'var(--text-secondary)', margin: 0 }}>
          Listen to spoken payment steps, select your regional mother tongue, and access typing alternatives for all voice interactions.
        </p>
      </div>

      {/* Mandatory Security Notice: Never use voice to authorize payment */}
      <div 
        style={{
          background: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: 'var(--radius-md)',
          padding: '1.15rem 1.35rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}
        role="alert"
      >
        <Lock size={28} color="#b45309" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#92400e', display: 'block', fontSize: 'var(--font-md)' }}>
            🛡️ {t('voiceNeverAuthorizes', 'Safety Rule: Voice recognition will NEVER authorize or confirm a payment.')}
          </strong>
          <span style={{ fontSize: 'var(--font-sm)', color: '#78350f' }}>
            To safeguard older adults against background noise, accents, or accidental commands, payments strictly require deliberate physical checkbox confirmation and manual tap.
          </span>
        </div>
      </div>

      {/* Privacy Guarantee: 100% Local Browser Engine */}
      <div 
        style={{
          background: '#f0fdf4',
          border: '1.5px solid #86efac',
          borderRadius: 'var(--radius-md)',
          padding: '0.9rem 1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: 'var(--font-sm)',
          color: '#166534'
        }}
      >
        <ShieldCheck size={22} color="#16a34a" style={{ flexShrink: 0 }} />
        <div>
          <strong>100% Private & Local:</strong> Spoken audio and text-to-speech are processed strictly within your browser using the local Web Speech API. No voice recordings or text are sent to external servers or cloud services.
        </div>
      </div>

      {/* Two-Way Interactive Voice & AI Assistant */}
      <div style={{ marginBottom: '2rem' }}>
        <SafePayVoiceAssistant embedded={true} onNavigateTab={onNavigateTab} />
      </div>

      {/* 1. Regional Language Selection */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Languages size={22} color="var(--color-brand)" />
              <span>Select Regional Language</span>
            </h2>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              Choose your comfortable language for buttons, error messages, and spoken instructions.
            </p>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleTestGreeting}
            style={{ fontSize: 'var(--font-sm)', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Play size={16} />
            <span>Hear Sample Greeting</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.85rem' }}>
          {availableLanguages.map((l) => {
            const isSelected = language === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLanguage(l.code);
                  const msg = l.code === 'kn' ? 'ಕನ್ನಡ ಭಾಷೆ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ.' :
                              l.code === 'hi' ? 'हिंदी भाषा चुनी गई है।' :
                              l.code === 'te' ? 'తెలుగు భాష ఎంచుకోబడింది.' :
                              'English language selected.';
                  speak(msg, true);
                  triggerVisualAlert('success', `Language changed to ${l.nativeName}`);
                }}
                className={`toggle-chip ${isSelected ? 'active' : ''}`}
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  border: isSelected ? '2.5px solid var(--color-brand)' : '2px solid var(--border-color)',
                  background: isSelected ? '#eff6ff' : 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
                aria-pressed={isSelected}
              >
                <span style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: isSelected ? 'var(--color-brand)' : 'var(--text-primary)' }}>
                  {l.nativeName}
                </span>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  {l.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Silent Mode & Automatic Speech Settings */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '1.75rem' }}>
        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BellOff size={22} color="var(--color-brand)" />
          <span>{t('silentMode', 'Silent Mode & Audio Control')}</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Silent Mode Switch */}
          <div 
            style={{ 
              background: silentMode ? '#f1f5f9' : 'var(--bg-secondary)', 
              border: `2px solid ${silentMode ? '#475569' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)', 
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <BellOff size={18} color={silentMode ? '#0f172a' : 'var(--text-secondary)'} />
                <strong style={{ fontSize: 'var(--font-md)' }}>Silent Mode (Quiet & Still)</strong>
              </div>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 0 }}>
                Disables automatic speech and completely stops animations, confetti, and transitions for sensory calm.
              </p>
            </div>

            <button
              type="button"
              className={silentMode ? 'btn-primary' : 'btn-secondary'}
              onClick={() => {
                const next = !silentMode;
                setSilentMode(next);
                if (!next) speak("Silent mode turned off. Audio active.", true);
              }}
              style={{ width: '100%', fontSize: 'var(--font-sm)' }}
            >
              {silentMode ? '✓ Silent Mode is ON' : 'Turn ON Silent Mode'}
            </button>
          </div>

          {/* Voice Guidance Toggle */}
          <div 
            style={{ 
              background: 'var(--bg-secondary)', 
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-md)', 
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Volume2 size={18} color="var(--color-brand)" />
                <strong style={{ fontSize: 'var(--font-md)' }}>General Voice Read-Aloud</strong>
              </div>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 0 }}>
                Spoken narration for payment steps and safety warning banners.
              </p>
            </div>

            <button
              type="button"
              className={voiceEnabled ? 'btn-primary' : 'btn-secondary'}
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                speak(next ? "Voice guidance turned on." : "Voice muted.", true);
              }}
              style={{ width: '100%', fontSize: 'var(--font-sm)' }}
            >
              {voiceEnabled ? '✓ Voice Guidance ON' : 'Turn Voice Guidance ON'}
            </button>
          </div>
        </div>

        {/* Speech Pacing Slider */}
        <div style={{ background: 'var(--bg-tertiary)', padding: '1.15rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>Senior-Friendly Speech Pacing:</span>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-brand)', fontWeight: 800 }}>
              {speechSpeed}x {speechSpeed <= 0.85 ? '(Gentle / Senior Friendly)' : '(Standard)'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700 }}>Slow (0.7x)</span>
            <input 
              type="range"
              min="0.7"
              max="1.1"
              step="0.05"
              value={speechSpeed}
              onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
              style={{ flex: 1, height: '8px', cursor: 'pointer' }}
              aria-label="Adjust voice speaking speed"
            />
            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700 }}>Fast (1.1x)</span>
          </div>
        </div>
      </div>

      {/* 3. Typing Alternative for All Voice Features */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <Keyboard size={24} color="var(--color-brand)" />
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: 0 }}>
            Typing Alternative for Assistant & Help
          </h2>
        </div>
        <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          {t('typingAlternativeNotice', 'All voice features are optional. You can always type directly with the keyboard.')}
        </p>

        {/* Preset sample questions */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
            💡 Quick questions (tap to ask):
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                className="toggle-chip"
                onClick={() => {
                  setTypedQuery(q.text);
                  handleProcessQuery(q.text);
                }}
                style={{ fontSize: 'var(--font-sm)', padding: '0.5rem 0.85rem' }}
              >
                "{q.text}"
              </button>
            ))}
          </div>
        </div>

        {/* Typing Box */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleProcessQuery(typedQuery);
          }}
          style={{ marginBottom: '1.25rem' }}
        >
          <label htmlFor="typed-query-input" style={{ display: 'block', fontWeight: 700, fontSize: 'var(--font-sm)', marginBottom: '0.4rem' }}>
            Type your question or request with keyboard:
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              id="typed-query-input"
              type="text"
              placeholder="e.g. Can I pay the chemist shop safely?"
              value={typedQuery}
              onChange={(e) => setTypedQuery(e.target.value)}
              style={{
                flex: '1 1 300px',
                padding: '0.85rem 1rem',
                fontSize: 'var(--font-md)',
                borderRadius: 'var(--radius-sm)',
                border: '2px solid var(--border-color)',
                background: 'var(--bg-primary)'
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '0.85rem 1.6rem', fontSize: 'var(--font-md)', fontWeight: 800 }}
            >
              Ask via Keyboard
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleStartVoice}
              disabled={isListening}
              style={{ padding: '0.85rem 1.25rem', fontSize: 'var(--font-md)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              title="Optional microphone input"
            >
              <Mic size={18} />
              <span>{isListening ? 'Listening...' : 'Optional Voice'}</span>
            </button>
          </div>
        </form>

        {voiceNotice && (
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-brand)', fontWeight: 600, marginBottom: '1rem' }}>
            🎙️ {voiceNotice}
          </div>
        )}

        {/* Assistant Response Box */}
        {assistantResponse && (
          <div 
            style={{
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-xs)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-brand)' }}>
                EasyPay CyberCare Response
              </span>
              <ReadAloudButton 
                text={assistantResponse}
                label={t('readInstructions', 'Read response aloud')}
                variant="chip"
              />
            </div>
            <p style={{ margin: 0, fontSize: 'var(--font-md)', lineHeight: 1.5, color: 'var(--text-primary)' }}>
              {assistantResponse}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
