import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaExclamationTriangle, FaPhone, FaMapMarkerAlt, FaHeartbeat, FaEdit, FaCheck, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Emergency = () => {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState('');
  const [location, setLocation] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [editingContact, setEditingContact] = useState(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm, setContactForm] = useState({ label: '', number: '', icon: '🏥', color: '#667eea' });

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    try {
      const r = await api.get('/api/emergency/contacts');
      setContacts(r.data.data || []);
    } catch {
      // Fallback contacts if API fails
      setContacts([
        { contact_id: 1, label: 'Campus Medical Center', number: '+1-555-0100', icon: '🏥', color: '#667eea' },
        { contact_id: 2, label: 'Campus Security', number: '+1-555-0911', icon: '🛡️', color: '#f59e0b' },
        { contact_id: 3, label: 'Ambulance / 911', number: '911', icon: '🚑', color: '#ef4444' },
        { contact_id: 4, label: 'Mental Health Crisis', number: '+1-555-0200', icon: '🧠', color: '#8b5cf6' },
      ]);
    }
  };

  const sendEmergency = async () => {
    setLoading(true);
    try {
      await api.post('/api/emergency/alert', {
        symptoms: symptoms || 'Emergency - Immediate help needed',
        location: location || 'Location not specified'
      });
      setSent(true);
      toast.success('🚨 Emergency alert sent! Help is on the way!', { duration: 6000 });
    } catch {
      toast.error('Failed to send alert. Call 911 immediately!');
    } finally { setLoading(false); }
  };

  const getLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        toast.success('Location detected!');
      },
      () => toast.error('Could not get location')
    );
  };

  const saveContact = async () => {
    if (!contactForm.label || !contactForm.number) return toast.error('Label and number required');
    try {
      if (editingContact) {
        await api.put(`/api/admin/emergency/contacts/${editingContact}`, contactForm);
        toast.success('Contact updated!');
      } else {
        await api.post('/api/admin/emergency/contacts', contactForm);
        toast.success('Contact added!');
      }
      setEditingContact(null); setShowAddContact(false);
      setContactForm({ label: '', number: '', icon: '🏥', color: '#667eea' });
      fetchContacts();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const deleteContact = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    try {
      await api.delete(`/api/admin/emergency/contacts/${id}`);
      toast.success('Deleted'); fetchContacts();
    } catch { toast.error('Failed'); }
  };

  const startEdit = (contact) => {
    setEditingContact(contact.contact_id);
    setContactForm({ label: contact.label, number: contact.number, icon: contact.icon, color: contact.color });
    setShowAddContact(true);
  };

  const iconOptions = ['🏥', '🚑', '🛡️', '🧠', '🚒', '👮', '💊', '🩺', '📞', '🏫'];

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 24, color: 'white',
        boxShadow: '0 8px 32px rgba(239,68,68,0.4)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>🚨 Emergency Alert System</h1>
        <p style={{ opacity: 0.88, margin: '5px 0 0', fontSize: 13 }}>
          One-click emergency alert to the university medical team
        </p>
      </div>

      {sent ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>Alert Sent Successfully!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            The medical team has been notified and help is on the way. Please stay calm and remain at your location.
          </p>
          <div style={{ display: 'inline-block', padding: '16px 24px', background: 'rgba(16,185,129,0.08)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)', marginBottom: 24 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: '#059669' }}>
              📞 If no response in 2 minutes, call directly: <strong>911</strong>
            </p>
          </div>
          <br />
          <button className="btn btn-danger btn-lg" onClick={() => { setSent(false); setSymptoms(''); setLocation(''); }}>
            Send Another Alert
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Emergency Button */}
          <div>
            <div className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ marginBottom: 20, paddingTop: 16 }}>
                <button className="emergency-btn" onClick={sendEmergency} disabled={loading}>
                  <FaExclamationTriangle style={{ fontSize: 48 }} />
                  <span style={{ fontSize: 18 }}>{loading ? 'SENDING...' : 'EMERGENCY'}</span>
                  <span style={{ fontSize: 11, opacity: 0.88 }}>Tap to Alert Medical Team</span>
                </button>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Press the button above to immediately alert the medical team
              </p>
            </div>

            {/* Extra Info */}
            <div className="card">
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaHeartbeat style={{ color: '#ef4444' }} /> Additional Details (Optional)
              </h3>
              <div className="form-group">
                <label className="form-label">Describe Your Emergency</label>
                <textarea className="form-textarea" rows={3}
                  placeholder="e.g., Chest pain, difficulty breathing, severe headache..."
                  value={symptoms} onChange={e => setSymptoms(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label"><FaMapMarkerAlt style={{ marginRight: 6 }} />Your Location</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" className="form-input"
                    placeholder="e.g., Library Building, 2nd Floor"
                    value={location} onChange={e => setLocation(e.target.value)} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={getLocation} style={{ flexShrink: 0 }}>
                    📍 GPS
                  </button>
                </div>
              </div>
              <button className="btn btn-danger btn-full btn-lg" onClick={sendEmergency} disabled={loading}>
                <FaExclamationTriangle /> {loading ? 'Sending...' : 'Send Emergency Alert'}
              </button>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <FaPhone style={{ color: 'var(--primary)' }} /> Emergency Contacts
                </h3>
                {user?.role === 'admin' && (
                  <button className="btn btn-primary btn-sm" onClick={() => { setShowAddContact(true); setEditingContact(null); setContactForm({ label: '', number: '', icon: '🏥', color: '#667eea' }); }}>
                    <FaPlus /> Add
                  </button>
                )}
              </div>

              {/* Add/Edit Contact Form */}
              {showAddContact && user?.role === 'admin' && (
                <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                    {editingContact ? '✏️ Edit Contact' : '➕ Add Contact'}
                  </h4>
                  <div className="grid-2" style={{ gap: 10 }}>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label className="form-label">Label</label>
                      <input type="text" className="form-input" placeholder="e.g., Campus Medical"
                        value={contactForm.label} onChange={e => setContactForm(p => ({ ...p, label: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label className="form-label">Phone Number</label>
                      <input type="text" className="form-input" placeholder="+1-555-0100"
                        value={contactForm.number} onChange={e => setContactForm(p => ({ ...p, number: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label className="form-label">Icon</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {iconOptions.map(ic => (
                        <button key={ic} onClick={() => setContactForm(p => ({ ...p, icon: ic }))}
                          style={{
                            width: 36, height: 36, borderRadius: 8, border: contactForm.icon === ic ? '2px solid var(--primary)' : '1px solid var(--border)',
                            background: contactForm.icon === ic ? 'rgba(102,126,234,0.1)' : 'var(--bg-card)',
                            cursor: 'pointer', fontSize: 18
                          }}>{ic}</button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Color</label>
                    <input type="color" value={contactForm.color} onChange={e => setContactForm(p => ({ ...p, color: e.target.value }))}
                      style={{ width: 60, height: 36, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => { setShowAddContact(false); setEditingContact(null); }}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={saveContact}><FaCheck /> Save</button>
                  </div>
                </div>
              )}

              {/* Contact List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {contacts.map(c => (
                  <div key={c.contact_id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: 12,
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                        background: c.color + '22', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 20, border: `1px solid ${c.color}44`
                      }}>{c.icon}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.label}</div>
                        <div style={{ fontSize: 12, color: c.color, fontWeight: 600, marginTop: 2 }}>{c.number}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <a href={`tel:${c.number}`} className="btn btn-sm" style={{
                        background: c.color + '22', color: c.color,
                        border: `1px solid ${c.color}44`, fontWeight: 700
                      }}>
                        <FaPhone /> Call
                      </a>
                      {user?.role === 'admin' && (
                        <>
                          <button className="btn btn-sm btn-info" onClick={() => startEdit(c)} title="Edit"><FaEdit /></button>
                          <button className="btn btn-sm btn-danger" onClick={() => deleteContact(c.contact_id)} title="Delete"><FaTrash /></button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Tips */}
            <div className="card" style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🛡️ Emergency Safety Tips</h3>
              {[
                'Stay calm and remain at your location',
                'Describe your symptoms clearly when asked',
                'Keep your phone accessible and charged',
                'Do not take medications without medical advice',
                'If unconscious, someone nearby should call for help',
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <span style={{ color: '#10b981', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Emergency;
