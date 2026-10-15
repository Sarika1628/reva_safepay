import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight, 
  Phone, 
  AtSign, 
  UserCheck,
  Mic,
  MicOff
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useAccessibility } from '../context/AccessibilityContext';
import api from '../services/api';

export default function SelectRecipient({ onSelectRecipient, onBack }) {
  const { activeUser } = useUser();
  const { speak, isListening, startSpeechRecognition, stopSpeechRecognition, triggerVisualAlert } = useAccessibility();
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [voiceNotice, setVoiceNotice] = useState(null);
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPayee, setNewPayee] = useState({
    name: '',
    upi_id: '',
    phone: '',
    relationship: 'Friend',
    category: 'General'
  });

  useEffect(() => {
    if (activeUser?.id) {
      setLoading(true);
      api.getContacts(activeUser.id)
        .then((data) => setContacts(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [activeUser?.id]);

  const categories = ['ALL', 'Family', 'Healthcare', 'Vendor', 'Groceries'];

  const filteredContacts = contacts.filter((c) => {
    const matchesCategory = category === 'ALL' || c.category?.toLowerCase() === category.toLowerCase() || c.relationship?.toLowerCase() === category.toLowerCase();
    const matchesSearch = !search || 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.upi_id.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search));
    return matchesCategory && matchesSearch;
  });

  const handleVoiceSearch = () => {
    if (isListening) {
      stopSpeechRecognition();
      return;
    }

    setVoiceNotice("Listening... say recipient name (e.g. 'Gopal' or 'Pooja')");
    speak("Please speak the contact name or shop to search.");

    startSpeechRecognition(
      (transcript) => {
        const clean = transcript.trim();
        setSearch(clean);
        const notice = `Voice recognized: "${clean}". Please review the filtered contacts and select carefully. Voice alone NEVER authorizes payments.`;
        setVoiceNotice(notice);
        speak(notice);
        triggerVisualAlert('info', `Voice searched: "${clean}"`);
      },
      (err) => {
        setVoiceNotice(err);
        triggerVisualAlert('warning', err);
      }
    );
  };

  const handleAddNewPayee = async (e) => {
    e.preventDefault();
    if (!newPayee.name || !newPayee.upi_id) return;
    try {
      const added = await api.addContact(activeUser.id, newPayee);
      setContacts(prev => [...prev, added]);
      setShowAddForm(false);
      speak(`Added ${added.name} to directory.`);
      onSelectRecipient(added);
    } catch (err) {
      alert(err.message || 'Failed to add contact');
    }
  };

  return (
    <div className="select-recipient-page" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onBack}
          style={{ fontSize: 'var(--font-sm)', padding: '0.4rem 0.8rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Payment Methods</span>
        </button>
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
          Step 1 of 4: Recipient
        </span>
      </div>

      <div className="card-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: 'var(--font-2xl)' }}>
            <Users size={30} color="var(--color-brand)" />
            <span>Select Recipient</span>
          </h2>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Choose a verified contact from your directory or add a new person.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ fontSize: 'var(--font-sm)', padding: '0.5rem 0.95rem' }}
        >
          <Plus size={16} />
          <span>Add New Payee</span>
        </button>
      </div>

      {/* Add Payee Inline Modal/Form */}
      {showAddForm && (
        <form onSubmit={handleAddNewPayee} className="card" style={{ border: '2px solid var(--color-brand)', marginBottom: '1.5rem', background: 'var(--bg-tertiary)' }}>
          <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, marginBottom: '0.75rem' }}>
            Add a New Person to Pay:
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.3rem' }}>Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Dairy"
                value={newPayee.name}
                onChange={(e) => setNewPayee({ ...newPayee, name: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.3rem' }}>UPI ID (e.g. name@bank) *</label>
              <input
                type="text"
                required
                placeholder="e.g. ramesh@okaxis"
                value={newPayee.upi_id}
                onChange={(e) => setNewPayee({ ...newPayee, upi_id: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '0.3rem' }}>Category</label>
              <select
                value={newPayee.category}
                onChange={(e) => setNewPayee({ ...newPayee, category: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
              >
                <option value="Family">Family</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Vendor">Vendor</option>
                <option value="Groceries">Groceries</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save & Select Payee</button>
          </div>
        </form>
      )}

      {/* Search & Category Filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by name, UPI ID, or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', fontSize: 'var(--font-md)', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-color)' }}
            />
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleVoiceSearch}
            title="Voice search recipient"
            style={{
              padding: '0.8rem 1rem',
              color: isListening ? '#ef4444' : 'var(--color-brand)',
              border: isListening ? '2px solid #ef4444' : '2px solid var(--border-color)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            <span>{isListening ? 'Listening...' : 'Voice Search'}</span>
          </button>
        </div>

        {voiceNotice && (
          <div style={{ padding: '0.6rem', background: '#eff6ff', borderRadius: 'var(--radius-sm)', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: 'var(--font-sm)', fontWeight: 600 }}>
            🎙️ {voiceNotice}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`toggle-chip ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
              style={{ fontSize: 'var(--font-sm)' }}
            >
              {cat === 'ALL' ? 'All Contacts' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Contact Cards List */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading verified directory...</p>
      ) : filteredContacts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p style={{ fontSize: 'var(--font-lg)', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            No contacts found matching "{search}".
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              // Direct entry of search as a UPI handle
              onSelectRecipient({
                name: search || 'New Recipient',
                upi_id: search.includes('@') ? search : `${search}@upi`,
                category: 'New Payee',
                relationship: 'Unverified'
              });
            }}
          >
            Pay "{search}" Directly as UPI
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => {
                speak(`Selected ${contact.name}`);
                onSelectRecipient(contact);
              }}
              className="card"
              style={{
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              role="button"
              tabIndex={0}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="contact-avatar">
                  {contact.name.charAt(0)}
                </div>
                <div>
                  <strong style={{ fontSize: 'var(--font-lg)', display: 'block' }}>
                    {contact.name}
                  </strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-safe)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={15} /> {contact.relationship}
                    </span>
                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                      {contact.upi_id}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {contact.quick_amount && (
                  <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                    Default: ₹{contact.quick_amount}
                  </span>
                )}
                <div style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)', padding: '0.5rem 0.9rem', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Select</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
