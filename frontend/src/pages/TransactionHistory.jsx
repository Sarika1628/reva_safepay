import React, { useState, useEffect } from 'react';
import { History, ShieldAlert, CheckCircle2, AlertOctagon, Filter, ShieldCheck } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useAccessibility } from '../context/AccessibilityContext';
import ReadAloudButton from '../components/ReadAloudButton';
import api from '../services/api';

export default function TransactionHistory() {
  const { activeUser } = useUser();
  const { t } = useAccessibility();
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, SAFE, SCAM
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeUser?.id) {
      setLoading(true);
      api.getTransactionHistory(activeUser.id)
        .then((data) => setTransactions(data))
        .catch((err) => console.error('Failed to load txns:', err))
        .finally(() => setLoading(false));
    }
  }, [activeUser?.id]);

  const filtered = transactions.filter((t) => {
    if (filter === 'SAFE') return t.status === 'SUCCESS';
    if (filter === 'SCAM') return t.status === 'BLOCKED_SCAM' || t.status === 'FROZEN_REJECTED';
    return true;
  });

  return (
    <div className="history-page">
      <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: 'var(--font-2xl)' }}>
            <History size={32} color="var(--color-brand)" />
            <span>{t('navHistory')} — {t('receipt')} & Audit</span>
          </h2>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {t('historyDesc')}
          </p>
        </div>

        <ReadAloudButton 
          text={`${t('navHistory')}. ${t('historyDesc')}`}
        />
      </div>

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={`toggle-chip ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          All Activity ({transactions.length})
        </button>
          <button
            type="button"
            className={`toggle-chip ${filter === 'SAFE' ? 'active' : ''}`}
            onClick={() => setFilter('SAFE')}
          >
            Safe Payments
          </button>
          <button
            type="button"
            className={`toggle-chip ${filter === 'SCAM' ? 'active' : ''}`}
            onClick={() => setFilter('SCAM')}
          >
            Blocked Scams
          </button>
        </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading history...</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <ShieldCheck size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <p style={{ fontSize: 'var(--font-lg)', color: 'var(--text-muted)' }}>
            No simulated transactions found matching this filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((txn) => {
            const isBlocked = txn.status === 'BLOCKED_SCAM' || txn.status === 'FROZEN_REJECTED';
            let reasons = [];
            try {
              reasons = JSON.parse(txn.risk_reasons || '[]');
            } catch (e) {
              reasons = [txn.risk_reasons];
            }

            return (
              <div
                key={txn.id}
                className="card"
                style={{
                  borderLeft: `8px solid ${isBlocked ? 'var(--color-danger)' : 'var(--color-safe)'}`,
                  margin: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isBlocked ? (
                      <div style={{ padding: '0.6rem', borderRadius: '50%', background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                        <ShieldAlert size={28} />
                      </div>
                    ) : (
                      <div style={{ padding: '0.6rem', borderRadius: '50%', background: 'var(--color-safe-bg)', color: 'var(--color-safe)' }}>
                        <CheckCircle2 size={28} />
                      </div>
                    )}
                    <div>
                      <strong style={{ fontSize: 'var(--font-xl)', display: 'block' }}>
                        {txn.recipient_name}
                      </strong>
                      <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                        {txn.recipient_upi} • {new Date(txn.timestamp).toLocaleString('en-IN')}
                      </span>
                      <div style={{ marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.78rem', background: 'var(--bg-tertiary)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontFamily: 'monospace', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                          Ref ID: #{txn.id} • DEMO-TXN-{new Date(txn.timestamp).toISOString().slice(0, 10).replace(/-/g, '')}-{String(txn.id).padStart(4, '0')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: isBlocked ? 'var(--color-danger)' : 'var(--color-brand)' }}>
                      ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        background: isBlocked ? 'var(--color-danger)' : 'var(--color-safe-bg)',
                        color: isBlocked ? '#ffffff' : 'var(--color-safe)'
                      }}
                    >
                      {isBlocked ? 'FRAUD INTERCEPTED' : 'SIMULATED SUCCESS'}
                    </span>
                  </div>
                </div>

                {txn.note && (
                  <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '0.6rem 0.9rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                    <strong>Note:</strong> {txn.note}
                  </p>
                )}

                {isBlocked && reasons.length > 0 && (
                  <div style={{ background: 'var(--color-danger-bg)', padding: '0.6rem 0.9rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', fontSize: 'var(--font-sm)', color: 'var(--color-danger)' }}>
                    <strong>Why SafePay Shield Intercepted This:</strong>
                    <ul style={{ paddingLeft: '1.2rem', marginTop: '0.25rem' }}>
                      {reasons.map((r, i) => (
                        <li key={i}>{typeof r === 'string' ? r : JSON.stringify(r)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <ReadAloudButton
                    text={isBlocked
                      ? `Blocked transaction. Amount: ${txn.amount} rupees to ${txn.recipient_name}. Reason: Intercepted by SafePay scam shield.`
                      : `Simulated payment. Amount: ${txn.amount} rupees to ${txn.recipient_name}. Status: Successful.`
                    }
                    buttonStyle={{ fontSize: 'var(--font-sm)', padding: '0.4rem 0.8rem' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
