import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  ShieldCheck, 
  Lock, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  Eye, 
  ArrowRight
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import ReadAloudButton from '../components/ReadAloudButton';
import api from '../services/api';

/**
 * FEATURE 3: PRIVACY-CONSCIOUS CAMERA AND FACE FEATURES
 * Demonstrates local camera stream, client-side face detection (Identity Unknown),
 * consent-based in-memory face-matching prototype, zero SQLite storage,
 * stream release on stop, and manual alternatives.
 */
export default function FaceCameraDemo({ onNavigatePayment }) {
  const { speak, triggerVisualAlert } = useAccessibility();

  // Camera Stream State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [detectionStatus, setDetectionStatus] = useState('IDLE'); // 'IDLE' | 'DETECTING' | 'FACE_DETECTED' | 'NO_FACE'
  const [detectionLabel, setDetectionLabel] = useState('Camera Off');
  const [faceBoundingBox, setFaceBoundingBox] = useState(null);

  // Consent-based Face Matching Prototype State (In-Memory Only)
  const [consentGiven, setConsentGiven] = useState(false);
  const [enrolledSignature, setEnrolledSignature] = useState(null);
  const [matchResult, setMatchResult] = useState(null); // null | 'MATCH' | 'NO_MATCH'
  const [matchScore, setMatchScore] = useState(0);

  // Manual alternative tab toggle
  const [showManualAlternative, setShowManualAlternative] = useState(false);
  const [manualPinInput, setManualPinInput] = useState('');
  const [manualVerified, setManualVerified] = useState(false);

  // Server-verified privacy status
  const [serverPrivacyStatus, setServerPrivacyStatus] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // STOP CAMERA STREAM & RELEASE HARDWARE
  const stopCameraStream = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      // Release every media track immediately
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setDetectionStatus('IDLE');
    setDetectionLabel('Camera Stopped & Hardware Released');
    setFaceBoundingBox(null);
    speak('Camera stopped and camera hardware released.');
  }, [speak]);

  // Fetch backend camera privacy verification on mount
  useEffect(() => {
    api.getCameraStatus()
      .then(data => setServerPrivacyStatus(data))
      .catch(() => {});
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // START CAMERA
  const handleStartCamera = async () => {
    setCameraError(null);
    setDetectionStatus('DETECTING');
    setDetectionLabel('Requesting camera permission...');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API (getUserMedia) is not supported by your browser or environment.');
      setDetectionStatus('IDLE');
      setDetectionLabel('Camera Unsupported');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false // STRICT PRIVACY: NEVER REQUEST AUDIO
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
          setDetectionLabel('Detecting face locally...');
          speak('Camera started. Analyzing video frame locally.');
          startDetectionLoop();
        };
      }
    } catch (err) {
      console.warn('Camera access denied or error:', err);
      let errMsg = 'Camera permission denied or camera device is in use by another application.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission was denied. SafePay will never access your camera without your explicit permission. You can use the manual alternative below.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No webcam or video capture device was detected on your system.';
      }
      setCameraError(errMsg);
      setDetectionStatus('IDLE');
      setDetectionLabel('Camera Inactive');
      speak(errMsg);
    }
  };

  // LOCAL CLIENT-SIDE DETECTION LOOP
  const startDetectionLoop = () => {
    const detectFrame = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.videoWidth > 0 && canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let faceFound = false;
        let box = null;

        // 1. Try Browser Shape Detection API (window.FaceDetector)
        if ('FaceDetector' in window) {
          try {
            const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
            const faces = await detector.detect(video);
            if (faces && faces.length > 0) {
              faceFound = true;
              const f = faces[0].boundingBox;
              box = { x: f.x, y: f.y, width: f.width, height: f.height };
            }
          } catch {
            // Fall through to canvas analysis
          }
        }

        // 2. Canvas Geometric Pixel Analysis Fallback
        if (!faceFound) {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            // Simple fast skin tone & head-region luminance variance check
            let skinPixels = 0;
            let sumX = 0;
            let sumY = 0;
            const totalSampled = (canvas.width * canvas.height) / 16;

            for (let i = 0; i < data.length; i += 16) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Skin luminance & chroma bounds
              if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
                skinPixels++;
                const pxIndex = i / 4;
                sumX += pxIndex % canvas.width;
                sumY += Math.floor(pxIndex / canvas.width);
              }
            }

            const skinRatio = skinPixels / totalSampled;
            if (skinRatio > 0.08 && skinRatio < 0.65) {
              faceFound = true;
              const avgX = sumX / skinPixels;
              const avgY = sumY / skinPixels;
              const boxWidth = Math.min(canvas.width * 0.45, 220);
              const boxHeight = Math.min(canvas.height * 0.55, 260);
              box = {
                x: Math.max(10, avgX - boxWidth / 2),
                y: Math.max(10, avgY - boxHeight / 2),
                width: boxWidth,
                height: boxHeight
              };
            }
          } catch {
            // Canvas security or read error fallback
          }
        }

        // Render detected box on canvas
        if (faceFound && box) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 4;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Draw label: Face detected (Identity Unknown)
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('Face detected (Identity Unknown)', box.x, Math.max(25, box.y - 10));

          setDetectionStatus('FACE_DETECTED');
          setDetectionLabel('Face detected (Identity Unknown)');
          setFaceBoundingBox(box);

          // In-memory prototype match check if enrolled
          if (enrolledSignature && canvas) {
            evaluatePrototypeMatch(ctx, box);
          }
        } else {
          setDetectionStatus('NO_FACE');
          setDetectionLabel('Looking for face in camera frame...');
          setFaceBoundingBox(null);
          setMatchResult(null);
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    animationFrameRef.current = requestAnimationFrame(detectFrame);
  };

  // ENROL FACE IN SESSION MEMORY (Consent-based Prototype)
  const handleEnrolFace = () => {
    if (!consentGiven) {
      alert("Please check the voluntary consent box before enrolling your face signature for this demo session.");
      return;
    }

    if (!cameraActive || detectionStatus !== 'FACE_DETECTED') {
      alert("Please ensure your camera is running and your face is visible in the frame before enrolling.");
      return;
    }

    // Capture small downscaled 8x8 luminance grid signature (64 bytes in JavaScript memory only)
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const box = faceBoundingBox || { x: 50, y: 50, width: 200, height: 200 };
      const sample = ctx.getImageData(box.x, box.y, box.width, box.height);

      const vector = [];
      const step = Math.floor(sample.data.length / 64);
      for (let i = 0; i < 64; i++) {
        const idx = i * step;
        const lum = (sample.data[idx] * 0.299 + sample.data[idx + 1] * 0.587 + sample.data[idx + 2] * 0.114) / 255;
        vector.push(lum);
      }

      setEnrolledSignature(vector);
      speak('Enrolled temporary prototype signature in session memory. Zero data saved to database.');
      triggerVisualAlert('success', 'Face enrolled in temporary browser memory (Zero database retention)');
    } catch (e) {
      alert("Unable to enrol face frame: " + e.message);
    }
  };

  // EVALUATE PROTOTYPE MATCH (In-Memory Euclidean Similarity)
  const evaluatePrototypeMatch = (ctx, box) => {
    if (!enrolledSignature) return;

    try {
      const sample = ctx.getImageData(box.x, box.y, box.width, box.height);
      const currentVector = [];
      const step = Math.floor(sample.data.length / 64);
      for (let i = 0; i < 64; i++) {
        const idx = i * step;
        const lum = (sample.data[idx] * 0.299 + sample.data[idx + 1] * 0.587 + sample.data[idx + 2] * 0.114) / 255;
        currentVector.push(lum);
      }

      let diffSum = 0;
      for (let i = 0; i < 64; i++) {
        diffSum += Math.abs(currentVector[i] - enrolledSignature[i]);
      }
      const avgDiff = diffSum / 64;
      const similarity = Math.max(0, Math.min(100, Math.round((1 - avgDiff * 2) * 100)));

      setMatchScore(similarity);
      if (similarity >= 65) {
        setMatchResult('MATCH');
      } else {
        setMatchResult('NO_MATCH');
      }
    } catch {
      // Ignore frame read failures
    }
  };

  // PURGE / RESET BIOMETRICS
  const handleResetBiometrics = async () => {
    setEnrolledSignature(null);
    setMatchResult(null);
    setMatchScore(0);
    setConsentGiven(false);

    try {
      await api.resetCameraBiometrics();
      speak('All temporary biometric data deleted and reset.');
      triggerVisualAlert('info', 'All temporary session biometrics purged. 0 records retained.');
    } catch {
      speak('Local session biometrics cleared.');
    }
  };

  // MANUAL PIN SIMULATION (Accessible Alternative Without Camera)
  const handleVerifyManualPin = (e) => {
    e.preventDefault();
    if (manualPinInput.trim().length === 4) {
      setManualVerified(true);
      speak('Manual verification successful. No camera required.');
      triggerVisualAlert('success', 'Manual PIN verified successfully.');
    } else {
      alert('Please enter a 4-digit demo PIN (e.g. 1234).');
    }
  };

  return (
    <div className="face-camera-page" style={{ padding: '1rem 0' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', color: '#047857', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            <Eye size={16} />
            <span>Feature 3: Privacy-Conscious Computer Vision</span>
          </div>
          <h1 style={{ margin: '0 0 0.35rem', fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            Face & Camera Demo
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)' }}>
            Experience local client-side computer-vision presence detection with strict zero-data privacy boundaries.
          </p>
        </div>

        <ReadAloudButton 
          text="Face and Camera Demo. All camera processing stays strictly inside your browser. No photos or biometric data are stored in SQLite. Face detection verifies presence only and never authorizes payments."
          label="Listen to Camera Guide"
        />
      </div>

      {/* STRICT ZERO-DATA PRIVACY GUARANTEE BANNER */}
      <div 
        style={{
          background: 'var(--bg-secondary)',
          border: '1.5px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.35rem',
          marginBottom: '1.75rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <strong style={{ color: 'var(--text-primary)', fontSize: '1rem', display: 'block', marginBottom: '0.25rem' }}>
              Zero SQLite Biometric Storage
            </strong>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              All camera streams are processed locally in your browser memory. No photos, video frames, or facial templates are stored in the SQLite database or sent off-device.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'var(--color-safe-bg)', color: 'var(--color-safe)' }}>
            <Lock size={26} />
          </div>
          <div>
            <strong style={{ color: 'var(--text-primary)', fontSize: '1rem', display: 'block', marginBottom: '0.25rem' }}>
              Safety Guardrail: Face Never Authorizes Payments
            </strong>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              SafePay NEVER uses face recognition alone to authorize transactions or prove consent. Manual visual review is always strictly mandatory.
            </span>
          </div>
        </div>
      </div>

      {/* Camera Error Alert */}
      {cameraError && (
        <div 
          style={{ 
            padding: '1.25rem', 
            background: '#fef2f2', 
            border: '2px solid #ef4444', 
            borderRadius: '12px', 
            marginBottom: '1.5rem', 
            color: '#991b1b',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}
          role="alert"
        >
          <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.25rem' }}>
              Camera Access Issue
            </strong>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.45 }}>
              {cameraError}
            </p>
          </div>
        </div>
      )}

      {/* MAIN CAMERA STAGE CARD */}
      <div 
        className="card"
        style={{
          padding: '1.75rem',
          borderRadius: '20px',
          marginBottom: '2rem',
          border: '1.5px solid var(--border-color)',
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        {/* Controls & Status Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Hardware Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div 
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: cameraActive ? '#10b981' : '#94a3b8',
                boxShadow: cameraActive ? '0 0 12px #10b981' : 'none'
              }}
            />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: cameraActive ? '#10b981' : 'var(--text-muted)' }}>
              {cameraActive ? '🟢 Camera-On: Active Local Stream' : '⚪ Camera Off'}
            </span>
          </div>

          {/* Action Buttons: Start Camera / Stop Camera */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {!cameraActive ? (
              <button
                type="button"
                onClick={handleStartCamera}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.6rem',
                  fontSize: '1rem',
                  fontWeight: 900,
                  borderRadius: '12px'
                }}
              >
                <Camera size={20} />
                <span>Start Camera</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCameraStream}
                className="btn-danger"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.6rem',
                  fontSize: '1rem',
                  fontWeight: 900,
                  borderRadius: '12px'
                }}
              >
                <CameraOff size={20} />
                <span>Stop Camera</span>
              </button>
            )}
          </div>
        </div>

        {/* Video Viewport Area */}
        <div 
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '640px',
            margin: '0 auto',
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#0f172a',
            minHeight: '340px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }}
        >
          {/* Live Video Element */}
          <video 
            ref={videoRef}
            playsInline
            muted
            style={{
              width: '100%',
              height: 'auto',
              display: cameraActive ? 'block' : 'none',
              transform: 'scaleX(-1)' // Mirror for natural interaction
            }}
          />

          {/* Overlay Canvas for Bounding Box & Annotations */}
          <canvas 
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: cameraActive ? 'block' : 'none',
              transform: 'scaleX(-1)', // Match mirrored video
              pointerEvents: 'none'
            }}
          />

          {/* Camera Off Placeholder */}
          {!cameraActive && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              <Camera size={56} style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
              <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                Camera Is Currently Off
              </p>
              <p style={{ margin: '0.4rem 0 1.25rem', fontSize: '0.92rem', color: '#94a3b8' }}>
                Press "Start Camera" above to test local face presence detection.
              </p>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.08)', padding: '0.35rem 0.8rem', borderRadius: '999px' }}>
                🔒 SafePay never turns on your camera automatically
              </span>
            </div>
          )}
        </div>

        {/* Detection Status Badge */}
        {cameraActive && (
          <div 
            style={{
              marginTop: '1.25rem',
              padding: '1rem',
              borderRadius: '10px',
              background: detectionStatus === 'FACE_DETECTED' ? '#f0fdf4' : '#fffbeb',
              border: `2px solid ${detectionStatus === 'FACE_DETECTED' ? '#10b981' : '#f59e0b'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {detectionStatus === 'FACE_DETECTED' ? (
                <CheckCircle2 size={24} color="#16a34a" />
              ) : (
                <RefreshCw size={24} className="spin-animate" color="#d97706" />
              )}
              <div>
                <strong style={{ fontSize: '1.05rem', color: detectionStatus === 'FACE_DETECTED' ? '#166534' : '#92400e', display: 'block' }}>
                  {detectionLabel}
                </strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {detectionStatus === 'FACE_DETECTED' 
                    ? "SafePay verifies presence only. We do NOT know who you are and do not claim identity recognition."
                    : "Position your face in front of the camera in good lighting."}
                </span>
              </div>
            </div>

            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Client-Side Shape Detection
            </span>
          </div>
        )}
      </div>

      {/* OPTIONAL CONSENT-BASED FACE MATCHING PROTOTYPE (CLEARLY SEPARATED) */}
      <div 
        className="card"
        style={{
          padding: '1.75rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          border: '2px solid #93c5fd',
          background: '#f8fafc'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
          <UserCheck size={26} color="var(--color-brand)" />
          <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            Optional Consent-Based Face Matching Prototype
          </h3>
        </div>

        <p style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong>Clear Separation:</strong> Presence detection (above) only checks if a human is in front of the lens. 
          This prototype demonstrates consent-based in-memory template matching for hackathon testing.
        </p>

        {/* Explicit Consent Requirement */}
        <div 
          style={{
            background: '#ffffff',
            border: '2px solid #cbd5e1',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}
        >
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer' }}>
            <input 
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              style={{ width: '22px', height: '22px', marginTop: '0.1rem' }}
            />
            <span style={{ fontSize: '0.92rem', color: '#1e293b', fontWeight: 700, lineHeight: 1.4 }}>
              I voluntarily give consent to store a temporary session signature in browser JavaScript memory for this demonstration. 
              I understand that no biometric data is written to SQLite or sent off-device.
            </span>
          </label>
        </div>

        {/* Enrollment & Match Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={handleEnrolFace}
            disabled={!consentGiven || !cameraActive || detectionStatus !== 'FACE_DETECTED'}
            style={{
              padding: '0.75rem 1.4rem',
              fontWeight: 800,
              fontSize: '0.95rem',
              borderRadius: '10px',
              background: (consentGiven && cameraActive && detectionStatus === 'FACE_DETECTED') ? 'var(--color-brand)' : '#cbd5e1',
              color: '#ffffff',
              border: 'none',
              cursor: (consentGiven && cameraActive && detectionStatus === 'FACE_DETECTED') ? 'pointer' : 'not-allowed'
            }}
          >
            Enrol Face in Session Memory
          </button>

          <button
            type="button"
            onClick={handleResetBiometrics}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.75rem 1.25rem',
              fontWeight: 800,
              fontSize: '0.95rem',
              borderRadius: '10px',
              background: '#ffffff',
              border: '2px solid #ef4444',
              color: '#dc2626',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={16} />
            <span>Delete & Reset Biometrics</span>
          </button>
        </div>

        {/* Live Match Comparison Feedback */}
        {enrolledSignature && (
          <div 
            style={{
              padding: '1.1rem',
              background: matchResult === 'MATCH' ? '#ecfdf5' : '#fff7ed',
              border: `2px solid ${matchResult === 'MATCH' ? '#10b981' : '#f97316'}`,
              borderRadius: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: matchResult === 'MATCH' ? '#047857' : '#c2410c' }}>
                {matchResult === 'MATCH' ? '✓ Prototype Session Match' : '⚡ No Match with Enrolled Session Signature'}
              </div>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Similarity: <strong>{matchScore}%</strong> (Threshold: 65%)
              </span>
            </div>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.88rem', color: '#334155' }}>
              This similarity score is computed from 64 in-memory luminance descriptors. 
              SafePay never uses this prototype to bypass payment security or debit money.
            </p>
          </div>
        )}
      </div>

      {/* COMPLETE MANUAL ALTERNATIVE (FOR USERS WHO DO NOT WISH TO USE CAMERA) */}
      <div 
        className="card"
        style={{
          padding: '1.75rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          border: '2px solid var(--border-color)',
          background: '#ffffff'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              Accessible Manual Alternative (No Camera Required)
            </h3>
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              For users with visual sensitivities, physical constraints, or who prefer not to use camera hardware.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowManualAlternative(!showManualAlternative)}
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: '8px',
              border: '2px solid var(--color-brand)',
              background: showManualAlternative ? 'var(--color-brand)' : '#ffffff',
              color: showManualAlternative ? '#ffffff' : 'var(--color-brand)',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            {showManualAlternative ? 'Hide Manual Flow' : 'Show Manual Alternative'}
          </button>
        </div>

        {showManualAlternative && (
          <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <p style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              Test standard non-biometric manual verification using demo PIN:
            </p>

            <form onSubmit={handleVerifyManualPin} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input 
                type="password"
                maxLength={4}
                value={manualPinInput}
                onChange={(e) => setManualPinInput(e.target.value)}
                placeholder="Enter 4-digit demo PIN (e.g. 1234)"
                aria-label="Enter 4-digit demo PIN for manual verification"
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  letterSpacing: '0.2em',
                  borderRadius: '8px',
                  border: '2px solid var(--border-color)',
                  width: '260px'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.75rem 1.4rem',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  borderRadius: '8px',
                  background: 'var(--color-brand)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Verify Manually
              </button>
            </form>

            {manualVerified && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#ecfdf5', borderRadius: '8px', color: '#047857', fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <span>✓ Manual PIN verification confirmed! You can proceed to Make Payment without touching any camera or facial feature.</span>
                {onNavigatePayment && (
                  <button
                    type="button"
                    onClick={onNavigatePayment}
                    className="btn-primary"
                    style={{ fontSize: '0.85rem', padding: '0.45rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <span>Proceed to Make Payment</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DOCUMENTED PRIVACY SAFEGUARDS & LIMITATIONS */}
      <div 
        style={{
          padding: '1.25rem',
          background: '#f1f5f9',
          borderRadius: '12px',
          border: '1px solid #cbd5e1',
          fontSize: '0.88rem',
          color: '#475569',
          lineHeight: 1.55
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
          Documented Privacy Safeguards & Limitations:
        </h4>
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          <li><strong>Zero Cloud Upload:</strong> Live camera frames are drawn on an HTML5 canvas in client browser memory and never uploaded to any server.</li>
          <li><strong>Zero SQLite Biometric Data:</strong> {serverPrivacyStatus?.biometrics_stored_count !== undefined ? `Verified by backend: ${serverPrivacyStatus.biometrics_stored_count} biometric records stored in SQLite.` : 'No facial templates, photos, or biometric IDs exist in the SQLite database.'}</li>
          <li><strong>Presence vs Identity:</strong> Detection verifies physical presence only. It does not establish legal identity.</li>
          <li><strong>Stream Release:</strong> Clicking "Stop Camera" immediately terminates all hardware tracks (`MediaStreamTrack.stop()`), ensuring the webcam indicator light turns off.</li>
        </ul>
      </div>
    </div>
  );
}
