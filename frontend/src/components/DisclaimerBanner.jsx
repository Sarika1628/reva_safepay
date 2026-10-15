import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function DisclaimerBanner() {
  const [healthState, setHealthState] = useState({
    status: 'loading', // 'loading' | 'online' | 'error'
    data: null,
    error: null,
    lastChecked: null
  });

  const checkHealth = useCallback(async () => {
    setHealthState(prev => ({ ...prev, status: 'loading', error: null }));
    try {
      const data = await api.getHealth();
      setHealthState({
        status: 'online',
        data,
        error: null,
        lastChecked: new Date()
      });
    } catch (err) {
      setHealthState({
        status: 'error',
        data: null,
        error: err.message || 'Cannot reach FastAPI backend at /api/health',
        lastChecked: new Date()
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <aside 
      className="disclaimer-banner"
      role="region"
      aria-label="Safety and simulation disclaimer"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <span className="disclaimer-badge">DEMO SIMULATION</span>
        <p style={{ display: 'inline', margin: 0, fontWeight: 700 }}>
          Demo application. No real money is transferred.
        </p>
      </div>

      <div 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginLeft: 'auto',
          fontSize: '0.82rem',
          background: 'rgba(0,0,0,0.22)',
          padding: '0.2rem 0.65rem',
          borderRadius: '999px',
          flexWrap: 'wrap'
        }}
      >
        {healthState.status === 'loading' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#93c5fd' }}>
            <RefreshCw size={13} className="spin-animate" />
            <span>Checking FastAPI /api/health...</span>
          </span>
        )}

        {healthState.status === 'online' && (
          <span 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#4ade80' }}
            title={`FastAPI Online: ${healthState.data?.app || 'SafePay'} (v${healthState.data?.version || '1.0.0'})`}
          >
            <Wifi size={14} color="#4ade80" />
            <span>FastAPI Backend Online</span>
          </span>
        )}

        {healthState.status === 'error' && (
          <span 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#fca5a5' }}
            title={healthState.error}
          >
            <WifiOff size={14} color="#f87171" />
            <span>Backend Offline: /api/health unreachable</span>
            <button 
              type="button" 
              onClick={checkHealth}
              style={{
                background: '#dc2626',
                color: '#fff',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                fontSize: '0.72rem',
                marginLeft: '0.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
              aria-label="Retry backend connection"
            >
              <RefreshCw size={10} />
              Retry
            </button>
          </span>
        )}
      </div>
    </aside>
  );
}
