import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaCalendarAlt, FaPlus, FaTimes, FaVideo, FaSearch, FaStar, FaLock } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCancel, setShowCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reviewAppt, setReviewAppt] = useState(null);
  const [reviewedAppts, setReviewedAppts] = useState(new Set());

  useEffect(() => { fetchAppointments(); fetchMyReviews(); }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/appointments');
      setAppointments(r.data.data || []);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  };

  const fetchMyReviews = async () => {
    if (user?.role === 'doctor' || user?.role === 'admin') return;
    try {
      const r = await api.get('/api/my/reviews');
      setReviewedAppts(new Set((r.data.data || []).map(rv => rv.appointment_id)));
    } catch {}
  };

  const cancelAppointment = async () => {
    try {
      await api.put(`/api/appointments/${showCancel}/cancel`, { reason: cancelReason || 'Cancelled by patient' });
      toast.success('Appointment cancelled');
      setShowCancel(null); setCancelReason('');
      fetchAppointments();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const getStatusBadge = (status) => {
    const m = {
      Pending: 'badge-pending',
      Confirmed: 'badge-confirmed',
      Completed: 'badge-completed',
      Cancelled: 'badge-cancelled'
    };
    return <span className={`badge ${m[status] || ''}`}>{status}</span>;
  };

  // Check if appointment is currently active (within scheduled time window)
  const isSessionActive = (appt) => {
    if (appt.status !== 'Confirmed' || appt.meeting_type !== 'Online' || !appt.meeting_link) return false;

    const now = new Date();
    const apptDate = new Date(appt.appointment_date);

    // Parse appointment time
    const [hours, minutes] = (appt.appointment_time || '00:00').split(':').map(Number);
    const sessionStart = new Date(apptDate);
    sessionStart.setHours(hours, minutes, 0, 0);

    // Session is active from 5 minutes before until 60 minutes after start
    const windowStart = new Date(sessionStart.getTime() - 5 * 60 * 1000);
    const windowEnd = new Date(sessionStart.getTime() + 60 * 60 * 1000);

    return now >= windowStart && now <= windowEnd;
  };

  // Check if session window has passed (appointment time + 60 min is in the past)
  const isSessionExpired = (appt) => {
    if (appt.meeting_type !== 'Online' || !appt.meeting_link) return false;

    const apptDate = new Date(appt.appointment_date);
    const [hours, minutes] = (appt.appointment_time || '00:00').split(':').map(Number);
    const sessionStart = new Date(apptDate);
    sessionStart.setHours(hours, minutes, 0, 0);
    const windowEnd = new Date(sessionStart.getTime() + 60 * 60 * 1000);

    return new Date() > windowEnd;
  };

  const filtered = appointments.filter(a => {
    const matchStatus = !filter || a.status === filter;
    const matchSearch = !search ||
      (a.doctor_name || a.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.chief_complaint || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const today = new Date().toISOString().split('T')[0];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📅 Appointments</h1>
          <p className="page-subtitle">{appointments.length} total appointments</p>
        </div>
        {user?.role !== 'doctor' && user?.role !== 'admin' && (
          <Link to="/app/book-appointment" className="btn btn-primary">
            <FaPlus /> Book Appointment
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-wrapper" style={{ flex: 1 }}>
          <FaSearch className="search-icon" />
          <input className="search-input"
            placeholder="Search by doctor, patient or complaint..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto' }}
          value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon"><FaCalendarAlt /></div>
            <h3>No appointments found</h3>
            {user?.role !== 'doctor' && user?.role !== 'admin' && (
              <Link to="/app/book-appointment" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
                <FaPlus /> Book Appointment
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(appt => {
            const d = new Date(appt.appointment_date);
            const isUpcoming = appt.appointment_date >= today;
            const canReview = user?.role !== 'doctor' && user?.role !== 'admin' &&
              appt.status === 'Completed' && !reviewedAppts.has(appt.appointment_id);
            const sessionActive = isSessionActive(appt);
            const sessionExpired = isSessionExpired(appt);

            return (
              <div key={appt.appointment_id} className="card" style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

                  {/* Date box */}
                  <div className="appt-date-box" style={{ flexShrink: 0 }}>
                    <div className="day">{d.getDate()}</div>
                    <div className="month">{d.toLocaleString('default', { month: 'short' })}</div>
                    <div style={{ fontSize: 10, opacity: 0.8 }}>{d.getFullYear()}</div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                        {user?.role === 'doctor'
                          ? appt.patient_name
                          : appt.doctor_name ? `Dr. ${appt.doctor_name}` : 'Doctor'}
                      </h3>
                      {getStatusBadge(appt.status)}
                      <span className="badge" style={{ background: 'rgba(102,126,234,0.1)', color: 'var(--primary)' }}>
                        {appt.meeting_type}
                      </span>
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                      ⏰ {appt.appointment_time?.slice(0, 5)}
                      {appt.specialization && ` · ${appt.specialization}`}
                    </p>

                    {appt.chief_complaint && (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        📋 {appt.chief_complaint}
                      </p>
                    )}

                    {appt.cancellation_reason && (
                      <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>
                        ❌ Reason: {appt.cancellation_reason}
                      </p>
                    )}

                    {/* ── VIDEO CALL SECTION ── */}
                    {appt.meeting_type === 'Online' && (
                      <div style={{ marginTop: 10 }}>
                        {sessionActive ? (
                          /* Session is LIVE — show join button */
                          <a href={appt.meeting_link} target="_blank" rel="noreferrer"
                            className="video-call-btn"
                            style={{ animation: 'pulse 2s infinite' }}>
                            <FaVideo /> Join Video Call
                            <span style={{
                              background: 'rgba(255,255,255,0.25)',
                              borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700
                            }}>LIVE</span>
                          </a>
                        ) : sessionExpired && appt.status === 'Confirmed' ? (
                          /* Session window has PASSED — show ended message */
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 7,
                            padding: '6px 12px', borderRadius: 8,
                            background: 'rgba(107,114,128,0.1)',
                            border: '1px solid rgba(107,114,128,0.2)',
                            fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500
                          }}>
                            <FaLock style={{ fontSize: 11 }} />
                            Session ended
                          </div>
                        ) : appt.status === 'Confirmed' && !sessionActive ? (
                          /* Session UPCOMING — show scheduled info */
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 7,
                            padding: '6px 12px', borderRadius: 8,
                            background: 'rgba(59,130,246,0.08)',
                            border: '1px solid rgba(59,130,246,0.2)',
                            fontSize: 12, color: '#2563eb', fontWeight: 500
                          }}>
                            <FaVideo style={{ fontSize: 11 }} />
                            Video call opens at {appt.appointment_time?.slice(0, 5)}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="action-row">
                    {/* Cancel for patients */}
                    {(appt.status === 'Pending' || appt.status === 'Confirmed') &&
                      isUpcoming && user?.role !== 'doctor' && user?.role !== 'admin' && (
                        <button className="btn btn-sm btn-danger"
                          onClick={() => setShowCancel(appt.appointment_id)}>
                          <FaTimes /> Cancel
                        </button>
                      )}

                    {/* Rate button after completion */}
                    {canReview && (
                      <button className="btn btn-sm btn-warning" onClick={() => setReviewAppt(appt)}>
                        <FaStar /> Rate
                      </button>
                    )}

                    {/* Already reviewed */}
                    {user?.role !== 'doctor' && user?.role !== 'admin' &&
                      appt.status === 'Completed' && reviewedAppts.has(appt.appointment_id) && (
                        <span className="badge badge-success">
                          <FaStar /> Reviewed
                        </span>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancel && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCancel(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Cancel Appointment</h2>
              <button className="modal-close" onClick={() => setShowCancel(null)}><FaTimes /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Reason (optional)</label>
              <textarea className="form-textarea" rows={3}
                placeholder="Let the doctor know why you're cancelling..."
                value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowCancel(null)}>
                Keep Appointment
              </button>
              <button className="btn btn-danger" onClick={cancelAppointment}>
                <FaTimes /> Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewAppt && (
        <ReviewModal
          appointment={reviewAppt}
          onClose={() => setReviewAppt(null)}
          onSubmitted={() => { fetchMyReviews(); fetchAppointments(); }}
        />
      )}
    </div>
  );
};

export default Appointments;