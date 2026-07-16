import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUserMd, FaSearch, FaCalendarAlt, FaStar, FaClock, FaPhone, FaEnvelope, FaTimes } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

const StarRating = ({ rating, size = 14 }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(s => (
      <span key={s} style={{ color: s <= Math.round(rating) ? '#f59e0b' : 'var(--border)', fontSize: size }}>★</span>
    ))}
  </div>
);

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [spec, setSpec] = useState('');
  const [viewDoctor, setViewDoctor] = useState(null);
  const [doctorReviews, setDoctorReviews] = useState({});
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    api.get('/api/doctors')
      .then(r => setDoctors(r.data.data || []))
      .catch(() => toast.error('Failed to load doctors'))
      .finally(() => setLoading(false));
  }, []);

  const loadReviews = async (doctorId) => {
    if (doctorReviews[doctorId]) return;
    setReviewsLoading(true);
    try {
      const r = await api.get(`/api/doctors/${doctorId}/reviews`);
      setDoctorReviews(p => ({ ...p, [doctorId]: r.data.data }));
    } catch {}
    finally { setReviewsLoading(false); }
  };

  const openDoctor = (doc) => {
    setViewDoctor(doc);
    loadReviews(doc.user_id);
  };

  const specializations = [...new Set(doctors.map(d => d.specialization).filter(Boolean))];

  const filtered = doctors.filter(d => {
    const matchSearch = !search ||
      d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      d.qualifications?.toLowerCase().includes(search.toLowerCase());
    const matchSpec = !spec || d.specialization === spec;
    return matchSearch && matchSpec;
  });

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header-gradient">
        <h1>👨‍⚕️ Our Medical Team</h1>
        <p>{doctors.length} qualified doctors ready to help you</p>
      </div>

      <div className="filter-bar">
        <div className="search-wrapper" style={{ flex: 1 }}>
          <FaSearch className="search-icon" />
          <input className="search-input" placeholder="Search by name, specialization or qualification..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto' }}
          value={spec} onChange={e => setSpec(e.target.value)}>
          <option value="">All Specializations</option>
          {specializations.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="icon"><FaUserMd /></div>
          <h3>No doctors found</h3>
        </div></div>
      ) : (
        <div className="doctors-grid">
          {filtered.map(doc => {
            const reviews = doctorReviews[doc.user_id];
            const avgRating = reviews?.avg_rating || 0;
            const totalReviews = reviews?.total || 0;
            return (
              <div key={doc.user_id} className="doctor-card" style={{ cursor: 'pointer' }} onClick={() => openDoctor(doc)}>
                <div className="doctor-card-avatar">
                  {doc.profile_image
                    ? <img src={`http://localhost:5000${doc.profile_image}`} alt="" />
                    : doc.full_name?.[0] || 'D'}
                </div>
                <h3>Dr. {doc.full_name}</h3>
                <p className="spec">{doc.specialization || 'General Medicine'}</p>

                {/* Rating */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
                  <StarRating rating={avgRating} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {avgRating > 0 ? `${avgRating.toFixed(1)} (${totalReviews})` : 'No reviews yet'}
                  </span>
                </div>

                <div className="doctor-card-info">
                  {doc.qualifications && <span>🎓 {doc.qualifications}</span>}
                  <span><FaClock style={{ color: 'var(--primary)' }} /> {doc.experience_years || 0} years experience</span>
                  <span>💰 ${doc.consultation_fee || 0} consultation</span>
                  {doc.available_days && <span>📅 {doc.available_days.replace(/,/g, ', ')}</span>}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to="/app/book-appointment" className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={e => e.stopPropagation()}>
                    <FaCalendarAlt /> Book
                  </Link>
                  <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); openDoctor(doc); }}>
                    Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Doctor Profile Modal */}
      {viewDoctor && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewDoctor(null)}>
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <h2 className="modal-title">Doctor Profile</h2>
              <button className="modal-close" onClick={() => setViewDoctor(null)}><FaTimes /></button>
            </div>

            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg,#667eea,#764ba2)',
              borderRadius: 12, padding: 24, marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 18, color: 'white'
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 700, flexShrink: 0,
                border: '3px solid rgba(255,255,255,0.4)'
              }}>
                {viewDoctor.profile_image
                  ? <img src={`http://localhost:5000${viewDoctor.profile_image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : viewDoctor.full_name?.[0]
                }
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Dr. {viewDoctor.full_name}</h2>
                <p style={{ opacity: 0.88, margin: '4px 0 0', fontSize: 14 }}>{viewDoctor.specialization || 'General Medicine'}</p>
                {viewDoctor.qualifications && <p style={{ opacity: 0.75, margin: '2px 0 0', fontSize: 12 }}>{viewDoctor.qualifications}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  {doctorReviews[viewDoctor.user_id] && (
                    <>
                      <StarRating rating={doctorReviews[viewDoctor.user_id].avg_rating} size={16} />
                      <span style={{ fontSize: 13, opacity: 0.9 }}>
                        {doctorReviews[viewDoctor.user_id].avg_rating.toFixed(1)} ({doctorReviews[viewDoctor.user_id].total} reviews)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid-2" style={{ marginBottom: 18 }}>
              {[
                { label: 'Experience', value: `${viewDoctor.experience_years || 0} years` },
                { label: 'Consultation Fee', value: `$${viewDoctor.consultation_fee || 0}` },
                { label: 'Available Days', value: viewDoctor.available_days?.replace(/,/g, ', ') || 'Mon–Fri' },
                { label: 'Affiliation', value: viewDoctor.hospital_affiliation || 'University Medical Center' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {viewDoctor.bio && (
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 14, marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>About</div>
                <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: 'var(--text-secondary)' }}>{viewDoctor.bio}</p>
              </div>
            )}

            {/* Reviews */}
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>⭐ Patient Reviews</h3>
              {reviewsLoading ? (
                <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              ) : doctorReviews[viewDoctor.user_id]?.reviews?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)', fontSize: 13 }}>
                  No reviews yet. Be the first to review!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
                  {(doctorReviews[viewDoctor.user_id]?.reviews || []).map(rv => (
                    <div key={rv.review_id} style={{ background: 'var(--bg)', borderRadius: 10, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#667eea,#764ba2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: 13, fontWeight: 700, overflow: 'hidden', flexShrink: 0
                        }}>
                          {rv.patient_image
                            ? <img src={`http://localhost:5000${rv.patient_image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : rv.patient_name?.[0]
                          }
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{rv.patient_name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <StarRating rating={rv.rating} />
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              {new Date(rv.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {rv.review_text && (
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                          "{rv.review_text}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button className="btn btn-outline" onClick={() => setViewDoctor(null)} style={{ flex: 1 }}>Close</button>
              <Link to="/app/book-appointment" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setViewDoctor(null)}>
                <FaCalendarAlt /> Book Appointment
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;