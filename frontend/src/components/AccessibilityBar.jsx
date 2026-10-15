import React from 'react';
import { Volume2, VolumeX, Eye, Sparkles, Languages, BellOff } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function AccessibilityBar() {
  const {
    language,
    setLanguage,
    availableLanguages,
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
    speak
  } = useAccessibility();

  const handleLanguageChange = (e) => {
    const langCode = e.target.value;
    setLanguage(langCode);
    const greeting = langCode === 'kn' ? 'ನಮಸ್ಕಾರ! ಕನ್ನಡ ಭಾಷೆ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ.' :
                     langCode === 'hi' ? 'नमस्ते! हिंदी भाषा सक्रिय कर दी गई है।' :
                     langCode === 'te' ? 'నమస్కారం! తెలుగు భాష ప్రారంభించబడింది.' :
                     'English language selected.';
    speak(greeting, true);
  };

  const handleFontChange = (size, label) => {
    setFontSize(size);
    speak(`Text size set to ${label}`);
  };

  const handleContrastChange = (mode, label) => {
    setContrastMode(mode);
    speak(`Contrast set to ${label}`);
  };

  const handleVoiceToggle = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    speak(next ? "Voice guidance activated" : "Voice guidance silenced", true);
  };

  const handleSlowModeToggle = () => {
    const next = !slowMode;
    setSlowMode(next);
    speak(next ? "Step-by-step Slow Pay mode turned on" : "Standard speed payment mode");
  };

  const handleSignSecureToggle = () => {
    const next = !signSecureMode;
    setSignSecureMode(next);
    speak(next ? "Sign & Secure visual-first mode enabled. Audio silenced." : "Sign & Secure mode disabled.", true);
  };

  const handleSilentModeToggle = () => {
    const next = !silentMode;
    setSilentMode(next);
    if (!next) {
      speak("Silent Mode disabled. Audio guidance and animations active.", true);
    }
  };

  return (
    <div className="accessibility-toolbar" role="region" aria-label="Accessibility Controls">
      {/* Language Selector (English, Kannada, Hindi, Telugu) */}
      <div className="toolbar-group" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Languages size={18} color="var(--color-brand)" />
        <label htmlFor="language-select" className="toolbar-label" style={{ margin: 0, fontWeight: 700 }}>
          Language:
        </label>
        <select
          id="language-select"
          className="persona-select"
          value={language}
          onChange={handleLanguageChange}
          style={{ padding: '0.35rem 0.6rem', fontSize: 'var(--font-sm)', fontWeight: 700, borderRadius: 'var(--radius-sm)' }}
          aria-label="Select Interface Language"
        >
          {availableLanguages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.nativeName} ({l.name})
            </option>
          ))}
        </select>
      </div>

      {/* Font Size Scaling */}
      <div className="toolbar-group">
        <span className="toolbar-label">{t('textSize', 'Text Size')}:</span>
        <button
          type="button"
          className={`toggle-chip ${fontSize === 'standard' ? 'active' : ''}`}
          onClick={() => handleFontChange('standard', 'Standard')}
          title="Standard Text Size"
          aria-pressed={fontSize === 'standard'}
        >
          A
        </button>
        <button
          type="button"
          className={`toggle-chip ${fontSize === 'large' ? 'active' : ''}`}
          onClick={() => handleFontChange('large', 'Large')}
          title="Large Text Size"
          aria-pressed={fontSize === 'large'}
          style={{ fontSize: '1.05rem', fontWeight: 700 }}
        >
          A+
        </button>
        <button
          type="button"
          className={`toggle-chip ${fontSize === 'xlarge' ? 'active' : ''}`}
          onClick={() => handleFontChange('xlarge', 'Extra Large')}
          title="Extra Large Text Size"
          aria-pressed={fontSize === 'xlarge'}
          style={{ fontSize: '1.25rem', fontWeight: 800 }}
        >
          A++
        </button>
      </div>

      {/* Contrast Presets */}
      <div className="toolbar-group">
        <span className="toolbar-label">{t('highContrast', 'Contrast')}:</span>
        <button
          type="button"
          className={`toggle-chip ${contrastMode === 'normal' ? 'active' : ''}`}
          onClick={() => handleContrastChange('normal', 'Standard Clean')}
          aria-pressed={contrastMode === 'normal'}
        >
          Default
        </button>
        <button
          type="button"
          className={`toggle-chip ${contrastMode === 'high-contrast' ? 'active' : ''}`}
          onClick={() => handleContrastChange('high-contrast', 'High Contrast Black and Yellow')}
          aria-pressed={contrastMode === 'high-contrast'}
          style={{ fontWeight: 800 }}
        >
          <Eye size={15} />
          High Contrast
        </button>
        <button
          type="button"
          className={`toggle-chip ${contrastMode === 'dark' ? 'active' : ''}`}
          onClick={() => handleContrastChange('dark', 'Dark Mode')}
          aria-pressed={contrastMode === 'dark'}
        >
          Dark
        </button>
      </div>

      {/* Voice, Slow Mode, and Sign & Secure Switches */}
      <div className="toolbar-group">
        <button
          type="button"
          className={`toggle-chip ${voiceEnabled ? 'active' : ''}`}
          onClick={handleVoiceToggle}
          aria-pressed={voiceEnabled}
          title="Toggle Read-Aloud Speech"
        >
          {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span>{voiceEnabled ? 'Voice ON' : 'Voice OFF'}</span>
        </button>

        <button
          type="button"
          className={`toggle-chip ${signSecureMode ? 'active' : ''}`}
          onClick={handleSignSecureToggle}
          aria-pressed={signSecureMode}
          title="Sign & Secure Mode: Zero audio dependency for Deaf users"
          style={signSecureMode ? { background: '#059669', color: '#fff', borderColor: '#059669' } : {}}
        >
          <span>🤟 Sign & Secure {signSecureMode ? 'ON' : 'OFF'}</span>
        </button>

        <button
          type="button"
          className={`toggle-chip ${silentMode ? 'active' : ''}`}
          onClick={handleSilentModeToggle}
          aria-pressed={silentMode}
          title={t('silentMode', 'Silent Mode (Quiet & Still: Mutes speech & animations)')}
          style={silentMode ? { background: '#475569', color: '#fff', borderColor: '#334155' } : {}}
        >
          <BellOff size={15} />
          <span>{silentMode ? t('silentModeOn', 'Silent ON') : t('silentModeOff', 'Silent Mode')}</span>
        </button>

        <button
          type="button"
          className={`toggle-chip ${slowMode ? 'active' : ''}`}
          onClick={handleSlowModeToggle}
          aria-pressed={slowMode}
          title="Step-by-step reassurance mode for seniors"
        >
          <Sparkles size={15} />
          <span>{slowMode ? 'Slow Safe Pay' : 'Fast Pay'}</span>
        </button>
      </div>
    </div>
  );
}
