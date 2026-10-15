import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, AlertTriangle, Plus, Volume2, CheckCircle2, XCircle } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import api from '../services/api';

export default function ScamDatabase() {
  const { speak } = useAccessibility();
  const [scams, setScams] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [newReport, setNewReport] = useState({
    title: '',
    upi_id: '',
    phone: '',
    category: 'Electricity Threat',
    description: '',
    sample_message: ''
  });

  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const loadCatalog = (query = '') => {
    setLoading(true);
    api.getScamCatalog(query)
      .then((data) => setScams(data))
      .catch((err) => console.error('Failed to load scam catalog:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCatalog(search);
  };

  const handleVerifyVpa = async (e) => {
    e.preventDefault();
    if (!verifyInput) return;
    setVerifying(true);
    try {
      const res = await api.verifyVpa(verifyInput);
      setVerifyResult(res);
      if (res.is_blacklisted) {
        speak(`Warning! ${verifyInput} matches a known reported scam: ${res.title}. Do not transfer any money!`, true);
      } else {
        speak(`${verifyInput} is not currently in the blacklist. However, always verify unknown recipients.`);
      }
    } catch (err) {
      alert('Verification failed: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!newReport.title || !newReport.description) return;
    try {
      const created = await api.reportScam(newReport);
      setScams(prev => [created, ...prev]);
      setShowReportForm(false);
      setNewReport({ title: '', upi_id: '', phone: '', category: 'Electricity Threat', description: '', sample_message: '' });
      speak(`Thank you. Your report about ${created.title} has been recorded to protect other seniors.`);
      alert('Scam reported successfully! Community alert created.');
    } catch (err) {
      alert('Report submission failed: ' + err.message);
    }
  };

  return (
    <div className="scam-database-page">
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: 'var(--font-2xl)' }}>
            <ShieldAlert size={32} color="var(--color-danger)" />
            <span>Community Scam Warning Registry</span>
          </h2>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Search known fraudulent numbers, fake electricity threat handles, and report suspicious calls.
          </p>
        </div>

        <button
          type="button"
          className="btn-danger"
          onClick={() => setShowReportForm(!showReportForm)}
          style={{ fontSize: 'var(--font-sm)', padding: '0.5rem 1rem' }}
        >
          <Plus size={16} />
          <span>Report a Suspicious Number / UPI</span>
        </button>
      </div>

      {/* 1. Fast VPA Verification Bar */}
      <div className="card" style={{ background: 'var(--bg-tertiary)', border: '2px solid var(--border-color)', marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, marginBottom: '0.6rem' }}>
          Check any UPI ID against Blacklist:
        </h3>
        <form onSubmit={handleVerifyVpa} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            required
            placeholder="Type UPI ID (e.g. bses.electricity.disconnection@upi)"
            value={verifyInput}
            onChange={(e) => setVerifyInput(e.target.value)}
            style={{ flex: 1, minWidth: '240px', padding: '0.8rem', fontSize: 'var(--font-md)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
          />
          <button type="submit" className="btn-primary" disabled={verifying}>
            {verifying ? 'Checking...' : 'Check Blacklist'}
          </button>
        </form>

        {verifyResult && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              background: verifyResult.is_blacklisted ? 'var(--color-danger-bg)' : 'var(--color-safe-bg)',
              border: `2px solid ${verifyResult.is_blacklisted ? 'var(--color-danger-border)' : 'var(--color-safe-border)'}`,
              color: verifyResult.is_blacklisted ? 'var(--color-danger)' : 'var(--color-safe)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: 'var(--font-lg)' }}>
              {verifyResult.is_blacklisted ? <XCircle size={24} /> : <CheckCircle2 size={24} />}
              <span>{verifyResult.is_blacklisted ? 'CRITICAL BLACKLIST MATCH' : 'NOT FOUND IN BLACKLIST'}</span>
            </div>
            <p style={{ marginTop: '0.4rem', color: 'var(--text-primary)', fontSize: 'var(--font-md)' }}>
              {verifyResult.warning}
            </p>
          </div>
        )}
      </div>

      {/* 2. Report Scam Form (Collapsible) */}
      {showReportForm && (
        <form onSubmit={handleReportSubmit} className="card" style={{ border: '2px solid var(--color-danger)', marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--color-danger)', marginBottom: '1rem' }}>
            Report a Fraud Caller or Suspicious Payment Request:
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.3rem' }}>Scam Incident Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Call claiming electricity cut tonight"
                value={newReport.title}
                onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.3rem' }}>Category</label>
              <select
                value={newReport.category}
                onChange={(e) => setNewReport({ ...newReport, category: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
              >
                <option value="Electricity Threat">Electricity Disconnection Threat</option>
                <option value="Lottery / Prize">Fake Lottery / Prize Draw</option>
                <option value="KYC Suspension">KYC Suspension / Bank Block</option>
                <option value="Remote Access / AnyDesk">Remote Screen Sharing (AnyDesk)</option>
                <option value="Fake Customer Care">Fake Helpline / Impersonation</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.3rem' }}>Suspicious UPI ID (if given)</label>
              <input
                type="text"
                placeholder="e.g. power.desk@upi"
                value={newReport.upi_id}
                onChange={(e) => setNewReport({ ...newReport, upi_id: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.3rem' }}>Caller Phone Number</label>
              <input
                type="text"
                placeholder="+91 9XXXX XXXXX"
                value={newReport.phone}
                onChange={(e) => setNewReport({ ...newReport, phone: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.3rem' }}>Detailed Description of Trick *</label>
            <textarea
              required
              rows={3}
              placeholder="Describe what the caller said or demanded..."
              value={newReport.description}
              onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
              style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowReportForm(false)}>Cancel</button>
            <button type="submit" className="btn-danger">Submit Public Safety Report</button>
          </div>
        </form>
      )}

      {/* 3. Search and Catalog Cards */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search by keyword, trick name, or UPI ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: '0.85rem', fontSize: 'var(--font-md)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
        />
        <button type="submit" className="btn-primary">
          <Search size={18} />
          <span>Search Registry</span>
        </button>
      </form>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading scam database...</p>
      ) : scams.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No reports found.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {scams.map((scam) => (
            <div
              key={scam.id}
              className="card"
              style={{
                borderTop: '6px solid var(--color-danger)',
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-danger-bg)',
                      color: 'var(--color-danger)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {scam.category}
                  </span>
                  <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Reported {scam.reported_count}x
                  </span>
                </div>

                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, marginBottom: '0.5rem' }}>
                  {scam.title}
                </h3>

                {scam.upi_id && (
                  <p style={{ fontSize: 'var(--font-sm)', fontFamily: 'monospace', color: 'var(--color-danger)', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Blacklisted VPA: {scam.upi_id}
                  </p>
                )}

                <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {scam.description}
                </p>

                {scam.sample_message && (
                  <div style={{ background: 'var(--bg-tertiary)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', fontStyle: 'italic', fontSize: 'var(--font-sm)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                    "{scam.sample_message}"
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => speak(`Scam Warning: ${scam.title}. ${scam.description}`, true)}
                style={{ fontSize: 'var(--font-sm)', padding: '0.45rem' }}
              >
                <Volume2 size={16} />
                <span>Listen to Warning</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
