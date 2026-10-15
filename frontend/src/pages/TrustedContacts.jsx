import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Phone, 
  AtSign, 
  Send, 
  ShieldCheck,
  Heart,
  Eye,
  Bell,
  X,
  Power
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useAccessibility } from '../context/AccessibilityContext';
import ConfirmationModal from '../components/ConfirmationModal';
import api from '../services/api';

export default function TrustedContacts({ onPayContact }) {
  const { activeUser } = useUser();
  const { speak, t } = useAccessibility();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [previewAlertContact, setPreviewAlertContact] = useState(null);

  // Caregiver consent global setting
  const [caregiverConsent, setCaregiverConsent] = useState(() => {
    return localStorage.getItem('easypay_caregiver_consent') !== 'false';
  });

  const [formData, setFormData] = useState({
    name: '',
    upi_id: '',
    phone: '',
    relationship: 'Family',
    category: 'Family',
    quick_amount: 100,
    quick_phrase: '',
    consent_alerts: true
  });

  const loadContacts = () => {
    if (activeUser?.id) {
      setLoading(true);
      api.getContacts(activeUser.id)
        .then((data) => setContacts(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadContacts();
  }, [activeUser?.id]);

  const handleToggleConsent = () => {
    const next = !caregiverConsent;
    setCaregiverConsent(next);
    localStorage.setItem('easypay_caregiver_consent', String(next));
    speak(next ? "Caregiver alert consent enabled" : "Caregiver alerts paused");
  };

  const handleToggleActiveState = (contact) => {
    const updated = contacts.map(c => {
      if (c.id === contact.id) {
        return { ...c, is_active: c.is_active === false ? true : false };
      }
      return c;
    });
    setContacts(updated);
    speak(`${contact.name} is now ${contact.is_active === false ? 'active' : 'disabled'}`);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.upi_id) return;
    try {
      await api.addContact(activeUser.id, formData);
      setShowAddModal(false);
      setFormData({ 
        name: '', 
        upi_id: '', 
        phone: '', 
        relationship: 'Family', 
        category: 'Family', 
        quick_amount: 100, 
        quick_phrase: '',
        consent_alerts: true
      });
      loadContacts();
      speak(`Added ${formData.name} to verified contacts.`);
    } catch (err) {
      alert('Failed to add contact: ' + err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return;
    try {
      await api.deleteContact(contactToDelete.id);
      setContacts(prev => prev.filter(c => c.id !== contactToDelete.id));
      speak(`Removed ${contactToDelete.name} from trusted list.`);
      setContactToDelete(null);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Mask phone number to avoid exposing full sensitive details
  const maskPhone = (phone) => {
    if (!phone) return 'Not Provided';
    const clean = phone.trim();
    if (clean.length <= 5) return '•••••';
    return clean.slice(0, 5) + ' •••••';
  };

  return (
    <div className="trusted-contacts-page" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: 'var(--font-2xl)' }}>
            <Users size={32} color="var(--color-brand)" />
            <span>{t('navContacts', 'Trusted Contacts & Care Circle')}</span>
          </h2>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {t('contactsDesc', 'Manage verified family and neighborhood vendors with caregiver safety consent.')}
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ fontSize: 'var(--font-sm)', padding: '0.5rem 1rem' }}
        >
          <Plus size={16} />
          <span>Add New Trusted Contact</span>
        </button>
      </div>

      {/* Explicit Consent Settings Card */}
      <div className="card" style={{ background: '#f8fafc', borderLeft: '6px solid var(--color-brand)', marginBottom: '1.75rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <Bell size={20} color="var(--color-brand)" />
              <strong style={{ fontSize: 'var(--font-md)' }}>
                Caregiver Safety Alert Consent Setting:
              </strong>
            </div>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0, maxWidth: '650px' }}>
              Allow SafePay to simulate alert notifications to designated family contacts if an unverified payment exceeding ₹2,000 or a high-risk transfer is attempted.
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0', fontStyle: 'italic' }}>
              * Privacy Guarantee: All alerts are strictly simulated in-app. No real SMS messages or cellular carrier costs are incurred.
            </p>
          </div>

          <button
            type="button"
            className={caregiverConsent ? 'btn-primary' : 'btn-secondary'}
            onClick={handleToggleConsent}
            style={{ fontSize: 'var(--font-sm)', padding: '0.5rem 1rem' }}
          >
            {caregiverConsent ? '✓ Consent Granted' : '✕ Alerts Disabled'}
          </button>
        </div>
      </div>

      {/* Contacts List */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading contacts...</p>
      ) : contacts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: 'var(--font-lg)', color: 'var(--text-muted)' }}>No trusted contacts saved yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {contacts.map((contact) => {
            const isDisabled = contact.is_active === false;
            return (
              <div
                key={contact.id}
                className="card"
                style={{
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: `6px solid ${isDisabled ? 'var(--text-muted)' : 'var(--color-safe)'}`,
                  opacity: isDisabled ? 0.7 : 1
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="contact-avatar" style={isDisabled ? { background: '#94a3b8' } : {}}>
                        {contact.name.charAt(0)}
                      </div>
                      <div>
                        <strong style={{ fontSize: 'var(--font-lg)', display: 'block' }}>
                          {contact.name}
                        </strong>
                        <span style={{ fontSize: 'var(--font-sm)', color: isDisabled ? 'var(--text-muted)' : 'var(--color-safe)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <CheckCircle2 size={14} /> {contact.relationship} {isDisabled && '(Disabled)'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleActiveState(contact)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
                        title={isDisabled ? "Enable contact" : "Disable contact"}
                      >
                        <Power size={16} color={isDisabled ? '#ef4444' : '#10b981'} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setContactToDelete(contact)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
                        title={`Delete ${contact.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: 'var(--font-sm)' }}>
                    <div style={{ marginBottom: '0.25rem', fontFamily: 'monospace' }}>
                      <strong>UPI:</strong> {contact.upi_id}
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>
                      <strong>Protected Phone:</strong> {maskPhone(contact.phone)}
                    </div>
                    {contact.quick_phrase && (
                      <div style={{ fontStyle: 'italic', marginTop: '0.4rem', color: 'var(--text-secondary)' }}>
                        "{contact.quick_phrase}"
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setPreviewAlertContact(contact)}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem' }}
                    title="Preview what a simulated SMS safety alert would look like"
                  >
                    <Bell size={14} />
                    <span>Preview Simulated Safety Alert</span>
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    disabled={isDisabled}
                    onClick={() => onPayContact && onPayContact(contact)}
                    style={{ width: '100%', fontSize: 'var(--font-sm)', padding: '0.65rem' }}
                  >
                    <Send size={16} />
                    <span>Pay {contact.name} (₹{contact.quick_amount || 100})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Simulated Alert Preview Modal */}
      {previewAlertContact && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-brand)' }}>
                <Bell size={24} />
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, margin: 0 }}>
                  Simulated Safety Alert Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAlertContact(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              If a payment to an unverified recipient over ₹2,000 is triggered, this is the simulated notification that would be generated for {previewAlertContact.name}:
            </p>

            {/* Mock SMS Notification Bubble */}
            <div style={{ background: '#0f172a', color: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '2px solid #334155', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              <div style={{ color: '#38bdf8', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: 700 }}>
                📱 IN-APP SMS SIMULATION (NO REAL SMS SENT)
              </div>
              <p style={{ margin: 0 }}>
                EASYPAY ALERT: Senior user initiated an unverified transfer of ₹2,500. SafePay Caregiver Alert triggered for {previewAlertContact.name} ({maskPhone(previewAlertContact.phone)}). If this was not authorized, please check in immediately.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setPreviewAlertContact(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: '1rem' }}>
              Add to Trusted Care Circle
            </h3>
            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.2rem' }}>Contact Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Dairy"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.2rem' }}>UPI ID (e.g. name@bank) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ramesh@okaxis"
                    value={formData.upi_id}
                    onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.2rem' }}>Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 98450 XXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.2rem' }}>Relationship</label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                    >
                      <option value="Daughter">Daughter</option>
                      <option value="Son">Son</option>
                      <option value="Family">Family Member</option>
                      <option value="Milk Vendor">Milk Vendor</option>
                      <option value="Pharmacist">Pharmacist</option>
                      <option value="Family Doctor">Family Doctor</option>
                      <option value="Grocery Store">Grocery Store</option>
                      <option value="Driver">Driver / Auto</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.2rem' }}>Default Quick Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quick_amount}
                    onChange={(e) => setFormData({ ...formData, quick_amount: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <input
                    type="checkbox"
                    id="consent_alerts"
                    checked={formData.consent_alerts}
                    onChange={(e) => setFormData({ ...formData, consent_alerts: e.target.checked })}
                  />
                  <label htmlFor="consent_alerts" style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                    Enable simulated safety alert previews for this contact
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(contactToDelete)}
        title="Remove Trusted Contact?"
        message={`Are you sure you want to remove ${contactToDelete?.name} from your trusted list?`}
        confirmText="Yes, Remove"
        cancelText="Keep"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setContactToDelete(null)}
      />
    </div>
  );
}
