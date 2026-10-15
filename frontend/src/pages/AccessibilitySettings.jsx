import React from 'react';
import { 
  Sliders, 
  Eye, 
  Volume2, 
  Sparkles, 
  RotateCcw, 
  ZoomIn, 
  SunMedium,
  Languages,
  BellOff
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useUser } from '../context/UserContext';

export default function AccessibilitySettings() {
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
    silentMode,
    setSilentMode,
    speak 
  } = useAccessibility();

  const { activeUser } = useUser();

  const handleResetDefaults = () => {
    setLanguage('en');
    setFontSize('large');
    setContrastMode('normal');
    setVoiceEnabled(true);
    setSlowMode(true);
    setSilentMode(false);
    speak("Accessibility preferences reset to default senior-friendly settings.");
  };

  return (
    <div className="accessibility-settings-page" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: 'var(--font-2xl)' }}>
            <Sliders size={32} color="var(--color-brand)" />
            <span>Accessibility & Visual Settings</span>
          </h2>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Adjust readability, contrast, voice, and pacing for {activeUser?.name || 'your profile'}.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={handleResetDefaults}
          style={{ fontSize: 'var(--font-sm)', padding: '0.45rem 0.9rem' }}
        >
          <RotateCcw size={16} />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* 1. Text Size Scaling */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title" style={{ fontSize: 'var(--font-lg)', marginBottom: '0.5rem' }}>
          <ZoomIn size={22} color="var(--color-brand)" />
          <span>Text & Touch Size:</span>
        </h3>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Scale buttons, icons, and fonts for effortless reading without squinting.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            className={`toggle-chip ${fontSize === 'standard' ? 'active' : ''}`}
            onClick={() => {
              setFontSize('standard');
              speak("Standard text size selected");
            }}
            style={{ justifyContent: 'center', padding: '1rem', fontSize: '1rem', fontWeight: 700 }}
          >
            Standard (16px base)
          </button>
          <button
            type="button"
            className={`toggle-chip ${fontSize === 'large' ? 'active' : ''}`}
            onClick={() => {
              setFontSize('large');
              speak("Large text size selected");
            }}
            style={{ justifyContent: 'center', padding: '1rem', fontSize: '1.15rem', fontWeight: 800 }}
          >
            Large (19px base) ★ Recommended
          </button>
          <button
            type="button"
            className={`toggle-chip ${fontSize === 'xlarge' ? 'active' : ''}`}
            onClick={() => {
              setFontSize('xlarge');
              speak("Extra Large text size selected");
            }}
            style={{ justifyContent: 'center', padding: '1rem', fontSize: '1.35rem', fontWeight: 900 }}
          >
            Extra Large (22px base)
          </button>
        </div>

        <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: 'var(--font-md)' }}>
          <strong>Live Preview:</strong> "EasyPay guarantees you will never enter your UPI PIN to receive money."
        </div>
      </div>

      {/* 2. Contrast & Visual Theme */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title" style={{ fontSize: 'var(--font-lg)', marginBottom: '0.5rem' }}>
          <Eye size={22} color="var(--color-brand)" />
          <span>High-Contrast & Color Modes:</span>
        </h3>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Enhanced contrast colors for cataracts, low vision, and outdoor sunlight readability.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          <button
            type="button"
            className={`toggle-chip ${contrastMode === 'normal' ? 'active' : ''}`}
            onClick={() => {
              setContrastMode('normal');
              speak("Default clean blue theme active");
            }}
            style={{ justifyContent: 'center', padding: '1rem' }}
          >
            Default Banking Blue
          </button>

          <button
            type="button"
            className={`toggle-chip ${contrastMode === 'high-contrast' ? 'active' : ''}`}
            onClick={() => {
              setContrastMode('high-contrast');
              speak("High contrast yellow on black active");
            }}
            style={{ justifyContent: 'center', padding: '1rem', fontWeight: 800 }}
          >
            <SunMedium size={18} />
            High Contrast (Yellow / Black)
          </button>

          <button
            type="button"
            className={`toggle-chip ${contrastMode === 'dark' ? 'active' : ''}`}
            onClick={() => {
              setContrastMode('dark');
              speak("Dark navy theme active");
            }}
            style={{ justifyContent: 'center', padding: '1rem' }}
          >
            Dark Navy Mode
          </button>
        </div>
      </div>

      {/* 3. Slow-Pay Step Reassurance */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong style={{ fontSize: 'var(--font-lg)', display: 'block' }}>
              Step-by-Step "Slow Pay" Mode:
            </strong>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
              Splits payment into 3 reassuring cards instead of one rushed form.
            </span>
          </div>

          <button
            type="button"
            className={slowMode ? 'btn-primary' : 'btn-secondary'}
            onClick={() => {
              const next = !slowMode;
              setSlowMode(next);
              speak(next ? "Slow Pay mode activated" : "Standard payment speed");
            }}
            style={{ padding: '0.75rem 1.4rem' }}
          >
            <Sparkles size={18} />
            <span>{slowMode ? 'Slow-Pay ON' : 'Turn Slow-Pay ON'}</span>
          </button>
        </div>
      </div>

      {/* 4. Language Selection */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title" style={{ fontSize: 'var(--font-lg)', marginBottom: '0.5rem' }}>
          <Languages size={22} color="var(--color-brand)" />
          <span>Regional Language Selection:</span>
        </h3>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Available in English, Kannada, Hindi, and Telugu with native script labels.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {availableLanguages.map((l) => (
            <button
              key={l.code}
              type="button"
              className={`toggle-chip ${language === l.code ? 'active' : ''}`}
              onClick={() => {
                setLanguage(l.code);
                const msg = l.code === 'kn' ? 'ಕನ್ನಡ ಭಾಷೆ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ.' :
                            l.code === 'hi' ? 'हिंदी भाषा चुनी गई है।' :
                            l.code === 'te' ? 'తెలుగు భాష ఎంచుకోబడింది.' :
                            'English language selected.';
                speak(msg, true);
              }}
              style={{ justifyContent: 'center', padding: '0.9rem', fontSize: 'var(--font-md)', fontWeight: language === l.code ? 800 : 600 }}
            >
              {l.nativeName} ({l.name})
            </button>
          ))}
        </div>
      </div>

      {/* 5. Silent Mode (Quiet & Still) */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong style={{ fontSize: 'var(--font-lg)', display: 'block' }}>
              <BellOff size={18} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />
              Silent Mode (Quiet & Still):
            </strong>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
              Disables automatic speech narration and eliminates all animations/transitions for a quiet, distraction-free experience.
            </span>
          </div>

          <button
            type="button"
            className={silentMode ? 'btn-primary' : 'btn-secondary'}
            onClick={() => {
              const next = !silentMode;
              setSilentMode(next);
              if (!next) speak("Silent mode turned off.", true);
            }}
            style={{ padding: '0.75rem 1.4rem' }}
          >
            <BellOff size={18} />
            <span>{silentMode ? 'Silent Mode ON' : 'Turn Silent Mode ON'}</span>
          </button>
        </div>
      </div>

      {/* 6. Voice Guidance Toggle */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong style={{ fontSize: 'var(--font-lg)', display: 'block' }}>
              Web Speech Narration:
            </strong>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
              Reads buttons, fraud alerts, and payment receipts out loud through device speakers.
            </span>
          </div>

          <button
            type="button"
            className={voiceEnabled ? 'btn-primary' : 'btn-secondary'}
            onClick={() => {
              const next = !voiceEnabled;
              setVoiceEnabled(next);
              speak(next ? "Voice narration active." : "Voice muted.", true);
            }}
            style={{ padding: '0.75rem 1.4rem' }}
          >
            <Volume2 size={18} />
            <span>{voiceEnabled ? 'Voice Guidance ON' : 'Turn Voice ON'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
