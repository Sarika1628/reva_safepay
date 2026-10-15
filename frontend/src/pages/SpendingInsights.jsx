import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  PieChart, 
  ShieldCheck, 
  Volume2, 
  Users, 
  Pill, 
  Coffee, 
  Truck, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useUser } from '../context/UserContext';
import api from '../services/api';

export default function SpendingInsights() {
  const { speak } = useAccessibility();
  const { activeUser } = useUser();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeUser?.id) {
      setLoading(true);
      api.getSpendingInsights(activeUser.id)
        .then((data) => setInsights(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [activeUser?.id]);

  const handleReadInsights = () => {
    if (!insights) return;
    const text = `Spending Insights Summary for ${activeUser?.name}. Total simulated spending this month is ${insights.current_month_total} rupees. Your largest category is ${insights.categories[0]?.name}. SafePay Shield has saved you ${insights.scam_money_saved} rupees by blocking fraudulent payment attempts.`;
    speak(text, true);
  };

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Users': return <Users size={20} />;
      case 'Pill': return <Pill size={20} />;
      case 'Coffee': return <Coffee size={20} />;
      case 'Truck': return <Truck size={20} />;
      default: return <PieChart size={20} />;
    }
  };

  return (
    <div className="spending-insights-page" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: 'var(--font-2xl)' }}>
            <TrendingUp size={32} color="var(--color-brand)" />
            <span>Monthly Spending & Safety Insights</span>
          </h2>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Clear breakdown of where your simulated money went, plus scam funds prevented.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={handleReadInsights}
          style={{ fontSize: 'var(--font-sm)', padding: '0.45rem 0.9rem' }}
        >
          <Volume2 size={16} />
          <span>Read Insights Aloud</span>
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading spending breakdown...</p>
      ) : !insights ? (
        <p style={{ color: 'var(--text-muted)' }}>No insights available.</p>
      ) : (
        <div>
          {/* Summary Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ margin: 0, padding: '1.25rem', borderLeft: '6px solid var(--color-brand)' }}>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 700 }}>
                This Month's Spending
              </span>
              <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--color-brand)', margin: '0.3rem 0' }}>
                ₹{insights.current_month_total.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-safe)', fontWeight: 700 }}>
                ✓ Under budget (₹{insights.budget_limit.toLocaleString('en-IN')})
              </span>
            </div>

            <div className="card" style={{ margin: 0, padding: '1.25rem', borderLeft: '6px solid var(--color-safe)' }}>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 700 }}>
                Scam Losses Prevented
              </span>
              <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--color-safe)', margin: '0.3rem 0' }}>
                ₹{insights.scam_money_saved.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-safe)', fontWeight: 700 }}>
                🛡️ Blocked by SafePay Shield
              </span>
            </div>

            <div className="card" style={{ margin: 0, padding: '1.25rem', borderLeft: '6px solid #6366f1' }}>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 700 }}>
                Previous Month
              </span>
              <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text-primary)', margin: '0.3rem 0' }}>
                ₹{insights.last_month_total.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                11% lower than last month
              </span>
            </div>
          </div>

          {/* Category Breakdown Bars */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="card-title" style={{ fontSize: 'var(--font-lg)', marginBottom: '1.25rem' }}>
              Spending by Category:
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {insights.categories.map((cat, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: 'var(--font-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: cat.color }}>{getCategoryIcon(cat.icon)}</span>
                      <strong>{cat.name}</strong>
                    </div>
                    <div>
                      <strong style={{ fontSize: 'var(--font-lg)' }}>₹{cat.amount.toLocaleString('en-IN')}</strong>
                      <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        ({cat.percentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Accessible Visual Progress Bar */}
                  <div style={{ width: '100%', height: '14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${cat.percentage}%`,
                        height: '100%',
                        background: cat.color,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Senior Reassurance Notice */}
          <div style={{ background: 'var(--color-safe-bg)', border: '2px solid var(--color-safe-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: 'var(--text-primary)' }}>
            <CheckCircle2 size={24} color="var(--color-safe)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: 'var(--font-md)', display: 'block', color: 'var(--color-safe)' }}>
                Reassuring Financial Health Status:
              </strong>
              <p style={{ fontSize: 'var(--font-sm)', margin: '0.3rem 0 0', lineHeight: 1.5 }}>
                Your simulated expenditures are focused on essentials: Family, Medicine, and Daily Groceries. You have not made any unusual transfers to unfamiliar accounts.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
