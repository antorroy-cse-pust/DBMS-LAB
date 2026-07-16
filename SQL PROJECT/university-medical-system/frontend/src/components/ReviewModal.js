import React, { useState } from 'react';
import { FaStar, FaTimes, FaPaperPlane } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

const ReviewModal = ({ appointment, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!rating) return toast.error('Please select a rating');
    setLoading(true);
    try {
      await api.post('/api/reviews', {
        doctor_id: appointment.doctor_id,
        appointment_id: appointment.appointment_id,
        rating,
        review_text: reviewText,
      });
      toast.success('Review submitted! Thank you.');
      onSubmitted && onSubmitted();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit review');
    } finally { setLoading(false); }
  };

  const labels = { 1:'Poor', 2:'Fair', 3:'Good', 4:'Very Good', 5:'Excellent' };
  const colors = { 1:'#ef4444', 2:'#f97316', 3:'#f59e0b', 4:'#3b82f6', 5:'#10b981' };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h2 className="modal-title">⭐ Rate Your Appointment</h2>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>

        {/* Doctor Info */}
        <div style={{
          background: 'var(--bg)', borderRadius: 12, padding: 14,
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg,#667eea,#764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 18, overflow: 'hidden'
          }}>
            {appointment.doctor_image
              ? <img src={`http://localhost:5000${appointment.doctor_image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : appointment.doctor_name?.[0]
            }
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Dr. {appointment.doctor_name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{appointment.specialization || 'General Medicine'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              {new Date(appointment.appointment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Stars */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>How was your experience?</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 38, padding: 4,
                  color: star <= (hovered || rating) ? '#f59e0b' : 'var(--border)',
                  transform: star <= (hovered || rating) ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.15s'
                }}>
                <FaStar />
              </button>
            ))}
          </div>
          {(hovered || rating) > 0 && (
            <div style={{
              marginTop: 8, fontSize: 15, fontWeight: 700,
              color: colors[hovered || rating]
            }}>
              {labels[hovered || rating]}
            </div>
          )}
        </div>

        {/* Review text */}
        <div className="form-group">
          <label className="form-label">Your Review (optional)</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Share your experience with this doctor..."
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>Skip</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            <FaPaperPlane /> {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
