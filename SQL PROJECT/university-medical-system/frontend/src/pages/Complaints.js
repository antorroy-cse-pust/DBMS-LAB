import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaTimes, FaUpload, FaEye, FaCheck, FaUserMd, FaCalendarAlt, FaSearch } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusColors = {
  Pending: { bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
  'Under Review': { bg: 'rgba(59,130,246,0.12)', color: '#2563eb' },
  Resolved: { bg: 'rgba(16,185,129,0.12)', color: '#059669' },
  Dismissed: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
};

const Complaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewComplaint, setViewComplaint] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ doctor_id: '', appointment_id: '', subject: '', description: '' });
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [adminStatus, setAdminStatus] = useState('');
  const fileRef = useRef();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = user?.role === 'admin' ? '/api/admin/complaints' : '/api/my/complaints';
      const [complR, docR, apptR] = await Promise.all([
        api.get(endpoint),
        api.get('/api/doctors'),
        user?.role !== 'admin' ? api.get('/api/appointments') : Promise.resolve({ data: { data: [] } }),
      ]);
      setComplaints(complR.data.data || []);
      setDoctors(docR.data.data || []);
      setAppointments((apptR.data.data || []).filter(a => a.status === 'Completed'));
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) return toast.error('File must be under 50MB');
    setProofFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setProofPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setProofPreview(null);
    }
  };

  const submitComplaint = async () => {
    if (!form.doctor_id || !form.subject || !form.description)
      return toast.error('Doctor, subject and description are required');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('complaint_data', JSON.stringify(form));
      if (proofFile) fd.append('proof', proofFile);
      await api.post('/api/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Complaint submitted successfully!');
      setShowModal(false);
      setForm({ doctor_id: '', appointment_id: '', subject: '', description: '' });
      setProofFile(null); setProofPreview(null);
      fetchData();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const updateComplaint = async (id) => {
    try {
      await api.put(`/api/admin/complaints/${id}`, { status: adminStatus, admin_notes: adminNote });
      toast.success('Updated!');
      setViewComplaint(null);
      fetchData();
    } catch { toast.error('Failed'); }
  };

  const filtered = complaints.filter(c => {
    const matchSearch = !search ||
      c.subject?.toLowerCase().includes(search.toLowerCase()) ||
      c.doctor_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.patient_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const isImage = (url) => url && /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isVideo = (url) => url && /\.(mp4|mov|avi)$/i.test(url);
  const isAudio = (url) => url && /\.(mp3|wav|ogg)$/i.test(url);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg,#dc2626,#991b1b)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 24, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, boxShadow: '0 8px 32px rgba(220,38,38,0.3)'
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>📋 Complaints</h1>
          <p style={{ opacity: 0.88, margin: '5px 0 0', fontSize: 13 }}>
            {user?.role === 'admin' ? 'Review and manage all patient complaints' : 'Submit and track your complaints about doctors'}
          </p>
        </div>
        {user?.role !== 'admin' && (
          <button className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
            onClick={() => setShowModal(true)}>
            <FaPlus /> File a Complaint
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-wrapper" style={{ flex: 1 }}>
          <FaSearch className="search-icon" />
          <input className="search-input" placeholder="Search complaints..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto' }}
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Under Review">Under Review</option>
          <option value="Resolved">Resolved</option>
          <option value="Dismissed">Dismissed</option>
        </select>
      </div>

      {/* Stats row for admin */}
      {user?.role === 'admin' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          {['Pending', 'Under Review', 'Resolved', 'Dismissed'].map(s => (
            <div key={s} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: statusColors[s]?.color }}>{complaints.filter(c => c.status === s).length}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{s}</div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">📋</div>
            <h3>No complaints found</h3>
            <p>{user?.role !== 'admin' ? 'You have not filed any complaints yet.' : 'No complaints match your search.'}</p>
            {user?.role !== 'admin' && (
              <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setShowModal(true)}>
                <FaPlus /> File a Complaint
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(c => {
            const sc = statusColors[c.status] || statusColors.Pending;
            return (
              <div key={c.complaint_id} className="card" style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{c.subject}</h3>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                        {c.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      <span><FaUserMd style={{ marginRight: 4 }} />Dr. {c.doctor_name} {c.specialization ? `· ${c.specialization}` : ''}</span>
                      {user?.role === 'admin' && c.patient_name && <span>👤 {c.patient_name} ({c.patient_email})</span>}
                      <span><FaCalendarAlt style={{ marginRight: 4 }} />{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {c.description.length > 120 ? c.description.slice(0, 120) + '...' : c.description}
                    </p>
                    {c.proof_url && (
                      <div style={{ marginTop: 10 }}>
                        {isImage(c.proof_url) ? (
                          <img src={`http://localhost:5000${c.proof_url}`} alt="proof"
                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}
                            onClick={() => window.open(`http://localhost:5000${c.proof_url}`, '_blank')} />
                        ) : (
                          <a href={`http://localhost:5000${c.proof_url}`} target="_blank" rel="noreferrer"
                            className="btn btn-sm btn-outline" style={{ fontSize: 11 }}>
                            📎 View Proof
                          </a>
                        )}
                      </div>
                    )}
                    {c.admin_notes && (
                      <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(59,130,246,0.08)', borderRadius: 8, fontSize: 12, color: '#2563eb', borderLeft: '3px solid #2563eb' }}>
                        <strong>Admin Note:</strong> {c.admin_notes}
                      </div>
                    )}
                  </div>
                  {user?.role === 'admin' && (
                    <button className="btn btn-sm btn-info" onClick={() => {
                      setViewComplaint(c);
                      setAdminStatus(c.status);
                      setAdminNote(c.admin_notes || '');
                    }}>
                      <FaEye /> Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── File Complaint Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 className="modal-title">📋 File a Complaint</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, padding: '8px 12px', background: 'rgba(59,130,246,0.06)', borderRadius: 8 }}>
              ℹ️ Your complaint will be reviewed by the admin only. Doctors cannot see complaints filed against them.
            </p>
            <div className="form-group">
              <label className="form-label">Doctor *</label>
              <select className="form-select" value={form.doctor_id} onChange={e => setForm(p => ({ ...p, doctor_id: e.target.value }))}>
                <option value="">Select a doctor</option>
                {doctors.map(d => <option key={d.user_id} value={d.user_id}>Dr. {d.full_name} — {d.specialization || 'General'}</option>)}
              </select>
            </div>
            {appointments.length > 0 && (
              <div className="form-group">
                <label className="form-label">Related Appointment (optional)</label>
                <select className="form-select" value={form.appointment_id} onChange={e => setForm(p => ({ ...p, appointment_id: e.target.value }))}>
                  <option value="">Select appointment</option>
                  {appointments.filter(a => !form.doctor_id || String(a.doctor_id) === String(form.doctor_id)).map(a => (
                    <option key={a.appointment_id} value={a.appointment_id}>
                      {new Date(a.appointment_date).toLocaleDateString()} — Dr. {a.doctor_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input type="text" className="form-input" placeholder="Brief summary of your complaint"
                value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-textarea" rows={4}
                placeholder="Describe your complaint in detail — what happened, when, and how it affected you..."
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>

            {/* Proof Upload */}
            <div className="form-group">
              <label className="form-label">Attach Proof (optional)</label>
              <div style={{
                border: '2px dashed var(--border)', borderRadius: 12, padding: 20,
                textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                background: 'var(--bg)'
              }}
                onClick={() => fileRef.current?.click()}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(102,126,234,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; }}>
                {proofPreview ? (
                  <img src={proofPreview} alt="preview" style={{ maxWidth: 200, maxHeight: 120, borderRadius: 8, objectFit: 'cover' }} />
                ) : proofFile ? (
                  <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                    📎 {proofFile.name} ({(proofFile.size / 1024 / 1024).toFixed(1)} MB)
                  </div>
                ) : (
                  <div>
                    <FaUpload style={{ fontSize: 28, color: 'var(--text-secondary)', marginBottom: 8 }} />
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                      Click to upload photo, video, audio or PDF
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                      JPG, PNG, MP4, MOV, MP3, PDF · Max 50MB
                    </p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*,video/*,audio/*,.pdf"
                  style={{ display: 'none' }} onChange={handleFileSelect} />
              </div>
              {proofFile && (
                <button className="btn btn-sm btn-danger" style={{ marginTop: 8 }}
                  onClick={() => { setProofFile(null); setProofPreview(null); }}>
                  <FaTimes /> Remove
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={submitComplaint} disabled={submitting}>
                {submitting ? 'Submitting...' : '📋 Submit Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Review Modal ── */}
      {viewComplaint && user?.role === 'admin' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewComplaint(null)}>
          <div className="modal" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h2 className="modal-title">🔍 Review Complaint #{viewComplaint.complaint_id}</h2>
              <button className="modal-close" onClick={() => setViewComplaint(null)}><FaTimes /></button>
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div><span style={{ color: 'var(--text-secondary)' }}>Patient: </span><strong>{viewComplaint.patient_name}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Doctor: </span><strong>Dr. {viewComplaint.doctor_name}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Date: </span>{new Date(viewComplaint.created_at).toLocaleString()}</div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Email: </span>{viewComplaint.patient_email}</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
                {viewComplaint.subject}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, fontSize: 13, lineHeight: 1.6, maxHeight: 150, overflowY: 'auto' }}>
                {viewComplaint.description}
              </div>
            </div>

            {viewComplaint.proof_url && (
              <div className="form-group">
                <label className="form-label">Attached Proof</label>
                {isImage(viewComplaint.proof_url) ? (
                  <img src={`http://localhost:5000${viewComplaint.proof_url}`} alt="proof"
                    style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => window.open(`http://localhost:5000${viewComplaint.proof_url}`, '_blank')} />
                ) : isVideo(viewComplaint.proof_url) ? (
                  <video controls style={{ width: '100%', borderRadius: 10 }}>
                    <source src={`http://localhost:5000${viewComplaint.proof_url}`} />
                  </video>
                ) : isAudio(viewComplaint.proof_url) ? (
                  <audio controls style={{ width: '100%' }}>
                    <source src={`http://localhost:5000${viewComplaint.proof_url}`} />
                  </audio>
                ) : (
                  <a href={`http://localhost:5000${viewComplaint.proof_url}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                    📎 Open Proof File
                  </a>
                )}
              </div>
            )}

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Update Status</label>
                <select className="form-select" value={adminStatus} onChange={e => setAdminStatus(e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Dismissed">Dismissed</option>
                </select>
              </div>
              <div />
            </div>

            <div className="form-group">
              <label className="form-label">Admin Notes (visible to patient)</label>
              <textarea className="form-textarea" rows={3}
                placeholder="Add a note for the patient about the outcome..."
                value={adminNote} onChange={e => setAdminNote(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setViewComplaint(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => updateComplaint(viewComplaint.complaint_id)}>
                <FaCheck /> Save Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
