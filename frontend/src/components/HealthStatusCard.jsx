import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2, Server } from 'lucide-react';
import api from '../services/api';

export default function HealthStatusCard() {
  const [health, setHealth] = useState({
    status: 'loading', // 'loading' | 'success' | 'error'
    data: null,
    error: null,
    lastChecked: null
  });

  const fetchHealth = useCallback(async () => {
    setHealth(prev => ({ ...prev, status: 'loading', error: null }));
    try {
      const data = await api.getHealth();
      setHealth({
        status: 'success',
        data,
        error: null,
        lastChecked: new Date()
      });
    } catch (err) {
      setHealth({
        status: 'error',
        data: null,
        error: err.message || 'Failed to connect to FastAPI backend at http://localhost:8000/api/health',
        lastChecked: new Date()
      });
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return (
    <div 
      className="card health-status-card"
      style={{
        marginBottom: '1.75rem',
        background: 'var(--bg-card)',
        border: health.status === 'success' 
          ? '1.5px solid var(--color-safe-border)' 
          : health.status === 'error'
          ? '1.5px solid var(--color-danger-border)'
          : '1.5px solid var(--border-color)',
        padding: '1.35rem 1.6rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)'
      }}
      aria-live="polite"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Server size={22} color="var(--color-brand)" />
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, margin: 0 }}>
            FastAPI Backend Service Health Check
          </h2>
          <code style={{ fontSize: '0.78rem', background: 'var(--bg-tertiary)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
            GET /api/health
          </code>
        </div>

        <button
          type="button"
          onClick={fetchHealth}
          disabled={health.status === 'loading'}
          className="btn-secondary"
          style={{ fontSize: 'var(--font-sm)', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          title="Query FastAPI /api/health endpoint again"
        >
          <RefreshCw size={14} className={health.status === 'loading' ? 'spin-animate' : ''} />
          <span>{health.status === 'loading' ? 'Checking...' : 'Refresh Status'}</span>
        </button>
      </div>

      {/* Loading State */}
      {health.status === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
          <RefreshCw size={20} className="spin-animate" color="var(--color-brand)" />
          <div>
            <strong style={{ fontSize: 'var(--font-md)', color: 'var(--color-brand)' }}>
              Querying FastAPI Backend (/api/health)...
            </strong>
            <p style={{ margin: 0, fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
              Establishing connection with http://localhost:8000 and verifying SQLite database readiness.
            </p>
          </div>
        </div>
      )}

      {/* Success State */}
      {health.status === 'success' && health.data && (
        <div style={{ background: 'var(--color-safe-bg)', border: '1px solid var(--color-safe-border)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={20} color="var(--color-safe)" />
              <strong style={{ fontSize: 'var(--font-md)', color: 'var(--color-safe)' }}>
                System Operational: {health.data.app || 'EasyPay & SafePay API'} (v{health.data.version || '1.0.0'})
              </strong>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Last Verified: {health.lastChecked ? health.lastChecked.toLocaleTimeString() : 'Just now'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: 'var(--font-sm)', marginTop: '0.5rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Status: </span>
              <strong style={{ color: 'var(--color-safe)', textTransform: 'uppercase' }}>{health.data.status} (200 OK)</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Simulation Mode: </span>
              <strong>{health.data.simulation_mode ? 'Active (Safe Sandbox)' : 'Live'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Server Clock: </span>
              <span>{health.data.timestamp ? new Date(health.data.timestamp).toLocaleTimeString() : 'Synced'}</span>
            </div>
          </div>

          {health.data.disclaimer && (
            <div style={{ marginTop: '0.6rem', fontSize: '0.82rem', color: 'var(--text-secondary)', borderTop: '1px dashed var(--color-safe-border)', paddingTop: '0.5rem' }}>
              <strong>Server Notice: </strong> {health.data.disclaimer}
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {health.status === 'error' && (
        <div style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
            <AlertCircle size={22} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: 'var(--font-md)', color: 'var(--color-danger)', display: 'block', marginBottom: '0.2rem' }}>
                Backend Offline: Could Not Reach FastAPI Health Check
              </strong>
              <p style={{ margin: 0, fontSize: 'var(--font-sm)', color: '#991b1b' }}>
                {health.error}
              </p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#7f1d1d' }}>
                <strong>Troubleshooting Tip: </strong> Start the FastAPI server using <code>npm run backend:dev</code> or <code>uvicorn backend.app.main:app --port 8000</code>.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
