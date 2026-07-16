import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaCalendarAlt, FaUserMd, FaClock, FaStethoscope, FaBan, FaInfoCircle } from 'react-icons/fa';
import api from '../services/api';

/* ─── Constants ───────────────────────────────────────────────── */
const ALL_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
  '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30',
  '17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30',
  '21:00','21:30',
];

// 4 = Friday (0=Sun,1=Mon,...,5=Sat,6=Sun in JS getDay)
const WEEKLY_HOLIDAY = 5; // Friday

const fmt12 = (t) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const isFriday = (dateStr) => {
  if (!dateStr) return false;
  // Use UTC to avoid timezone shift
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDay() === WEEKLY_HOLIDAY;
};

const isOnLeave = (dateStr, leaves) => {
  if (!dateStr || !leaves.length) return false;
  const d = new Date(dateStr + 'T00:00:00');
  return leaves.some(l => {
    const s = new Date(l.leave_start + 'T00:00:00');
    const e = new Date(l.leave_end + 'T00:00:00');
    return d >= s && d <= e;
  });
};

const isToday = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');
  return dateStr === todayStr;
};

// Returns true if the given "HH:MM" slot is already in the past for today's date
const isPastSlot = (dateStr, slot) => {
  if (!isToday(dateStr)) return false;
  const now = new Date();
  const [h, m] = slot.split(':').map(Number);
  const slotMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return slotMinutes <= nowMinutes;
};

/* ─── Component ───────────────────────────────────────────────── */
const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [form, setForm] = useState({
    doctor_id: '', appointment_date: '', appointment_time: '',
    meeting_type: 'Offline', chief_complaint: '', symptoms: ''
  });
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [doctorLeaves, setDoctorLeaves] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/doctors').then(r => setDoctors(r.data.data || [])).catch(() => {});
  }, []);

  // Fetch booked slots + approved leaves whenever doctor or date changes
  const fetchAvailability = useCallback(async (doctorId, date) => {
    if (!doctorId || !date) return;
    setSlotsLoading(true);
    try {
      const [slotsR, leavesR] = await Promise.all([
        api.get(`/api/doctors/${doctorId}/booked-slots?date=${date}`),
        api.get(`/api/doctors/${doctorId}/leaves`),
      ]);
      const rawSlots = slotsR.data.data || [];
      // Normalize: backend may return "09:00:00", we need "09:00"
      setBookedSlots(rawSlots.map(s => (typeof s === 'string' ? s : s).slice(0, 5)));
      setDoctorLeaves(leavesR.data.data || []);
    } catch {
      toast.error('Could not load availability');
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (form.doctor_id && form.appointment_date) {
      fetchAvailability(form.doctor_id, form.appointment_date);
      // Clear previously chosen time when date/doctor changes
      setForm(f => ({ ...f, appointment_time: '' }));
    }
  }, [form.doctor_id, form.appointment_date, fetchAvailability]);

  const handleDoctorSelect = (doc) => {
    setSelectedDoctor(doc);
    setBookedSlots([]);
    setDoctorLeaves([]);
    setForm(f => ({ ...f, doctor_id: doc.user_id, appointment_date: '', appointment_time: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.doctor_id) return toast.error('Please select a doctor');
    if (!form.appointment_date) return toast.error('Please select a date');
    if (isFriday(form.appointment_date)) return toast.error('Friday is a weekly holiday. Please choose another day.');
    if (isOnLeave(form.appointment_date, doctorLeaves))
      return toast.error('Doctor is on approved leave on this date.');
    if (!form.appointment_time) return toast.error('Please select a time slot');
    if (isPastSlot(form.appointment_date, form.appointment_time.slice(0,5)))
      return toast.error('This time slot has already passed today. Please select a later time.');
    if (!form.chief_complaint) return toast.error('Please describe your main complaint');

    setLoading(true);
    try {
      await api.post('/api/appointments', form);
      toast.success('Appointment booked successfully!');
      navigate('/app/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally { setLoading(false); }
  };

  // Min date = today; disable Friday in date picker via JS (HTML doesn't support day exclusion natively)
  const minDate = new Date().toISOString().split('T')[0];

  const dayBlocked = isFriday(form.appointment_date);
  const leaveBlocked = isOnLeave(form.appointment_date, doctorLeaves);
  const dateBlocked = dayBlocked || leaveBlocked;

  /* ── Slot status ── */
  const getSlotStatus = (slot) => {
    if (bookedSlots.includes(slot)) return 'booked';
    if (isPastSlot(form.appointment_date, slot)) return 'past';
    return 'available';
  };

  /* ── Leave banner text ── */
  const getLeaveBanner = () => {
    if (!form.appointment_date) return null;
    const leave = doctorLeaves.find(l => {
      const s = new Date(l.leave_start + 'T00:00:00');
      const e = new Date(l.leave_end + 'T00:00:00');
      const d = new Date(form.appointment_date + 'T00:00:00');
      return d >= s && d <= e;
    });
    if (!leave) return null;
    const start = new Date(leave.leave_start + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' });
    const end   = new Date(leave.leave_end   + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
    return `Dr. ${selectedDoctor?.full_name} is on approved leave from ${start} to ${end}. Please select a different date or choose another doctor.`;
  };

  return (
    <div>
      <div className="page-header-gradient">
        <h1>📅 Book Appointment</h1>
        <p>Schedule a consultation with our medical professionals</p>
      </div>

      {/* Clinic hours notice */}
      <div style={{
        background:'rgba(102,126,234,0.08)', border:'1px solid rgba(102,126,234,0.25)',
        borderRadius:10, padding:'10px 16px', marginBottom:20,
        display:'flex', alignItems:'center', gap:10, fontSize:13
      }}>
        <FaInfoCircle style={{color:'var(--primary)', flexShrink:0}} />
        <span>
          <strong>Clinic Hours:</strong> 9:00 AM – 10:00 PM &nbsp;•&nbsp;
          <strong>Weekly Holiday:</strong> Every Friday
        </span>
      </div>

      <div className="grid-2" style={{gap:24, alignItems:'start'}}>

        {/* ── Step 1: Select Doctor ── */}
        <div>
          <h2 className="section-title"><FaUserMd style={{color:'var(--primary)'}}/>Step 1: Select Doctor</h2>
          <div style={{display:'flex', flexDirection:'column', gap:12}}>
            {doctors.map(doc => (
              <div key={doc.user_id}
                onClick={() => handleDoctorSelect(doc)}
                style={{
                  padding:16, borderRadius:12, cursor:'pointer',
                  border: selectedDoctor?.user_id === doc.user_id
                    ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: selectedDoctor?.user_id === doc.user_id
                    ? 'rgba(102,126,234,0.08)' : 'var(--bg-card)',
                  transition:'all 0.2s', display:'flex', alignItems:'center', gap:14
                }}>
                <div style={{
                  width:52, height:52, borderRadius:'50%',
                  background:'linear-gradient(135deg,#667eea,#764ba2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'white', fontWeight:700, fontSize:20, flexShrink:0, overflow:'hidden'
                }}>
                  {doc.profile_image
                    ? <img src={`http://localhost:5000${doc.profile_image}`} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                    : doc.full_name?.[0]}
                </div>
                <div style={{flex:1}}>
                  <h3 style={{fontSize:15, fontWeight:700}}>Dr. {doc.full_name}</h3>
                  <p style={{fontSize:13, color:'var(--primary)', fontWeight:500}}>{doc.specialization || 'General Medicine'}</p>
                  <p style={{fontSize:12, color:'var(--text-secondary)'}}>
                    {doc.experience_years} yrs exp • ${doc.consultation_fee} fee
                  </p>
                  <p style={{fontSize:11, color:'var(--text-secondary)', marginTop:2}}>
                    📅 {doc.available_days || 'Sat–Thu'} &nbsp;|&nbsp; 🕘 9:00 AM – 10:00 PM
                  </p>
                </div>
                {selectedDoctor?.user_id === doc.user_id && (
                  <div style={{
                    width:28, height:28, borderRadius:'50%',
                    background:'var(--primary)', color:'white',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:14
                  }}>✓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Step 2: Appointment Details ── */}
        <div>
          <h2 className="section-title"><FaCalendarAlt style={{color:'var(--primary)'}}/>Step 2: Appointment Details</h2>
          <div className="card">
            {selectedDoctor && (
              <div style={{
                padding:'12px 16px', background:'rgba(102,126,234,0.1)',
                borderRadius:10, marginBottom:20, display:'flex', alignItems:'center', gap:10
              }}>
                <FaStethoscope style={{color:'var(--primary)'}} />
                <div>
                  <strong>Dr. {selectedDoctor.full_name}</strong>
                  <p style={{fontSize:12, color:'var(--text-secondary)'}}>{selectedDoctor.specialization}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Date */}
              <div className="form-group">
                <label className="form-label">📅 Appointment Date *</label>
                <input type="date" className="form-input" min={minDate}
                  value={form.appointment_date}
                  onChange={e => setForm({...form, appointment_date: e.target.value})} />

                {/* Friday warning */}
                {dayBlocked && (
                  <div style={{
                    marginTop:8, padding:'10px 14px', borderRadius:8,
                    background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
                    color:'#ef4444', fontSize:13, display:'flex', alignItems:'center', gap:8
                  }}>
                    <FaBan /> Friday is our weekly holiday. Please choose another date.
                  </div>
                )}

                {/* Doctor on leave warning */}
                {!dayBlocked && leaveBlocked && (
                  <div style={{
                    marginTop:8, padding:'10px 14px', borderRadius:8,
                    background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)',
                    color:'#d97706', fontSize:13, display:'flex', alignItems:'flex-start', gap:8
                  }}>
                    <FaBan style={{marginTop:2, flexShrink:0}} />
                    <span>{getLeaveBanner()}</span>
                  </div>
                )}
              </div>

              {/* Time Slots */}
              <div className="form-group">
                <label className="form-label">
                  <FaClock style={{marginRight:6}}/>
                  Time Slot * &nbsp;
                  <span style={{fontSize:11, color:'var(--text-secondary)', fontWeight:400}}>
                    (9:00 AM – 10:00 PM)
                  </span>
                </label>

                {dateBlocked ? (
                  <div style={{
                    padding:'16px', borderRadius:8, textAlign:'center',
                    background:'var(--bg)', border:'1px dashed var(--border)',
                    color:'var(--text-secondary)', fontSize:13
                  }}>
                    No slots available on this date.
                  </div>
                ) : slotsLoading ? (
                  <div style={{padding:16, textAlign:'center', color:'var(--text-secondary)', fontSize:13}}>
                    Loading availability…
                  </div>
                ) : (
                  <>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8}}>
                      {ALL_SLOTS.map(t => {
                        const status = getSlotStatus(t);
                        const isSelected = form.appointment_time === t + ':00';
                        const isBooked = status === 'booked';
                        const isPast = status === 'past';
                        const isDisabled = isBooked || isPast;
                        return (
                          <button key={t} type="button"
                            disabled={isDisabled || !form.appointment_date}
                            onClick={() => !isDisabled && setForm({...form, appointment_time: t + ':00'})}
                            title={isBooked ? 'Already booked' : isPast ? 'This time has already passed today' : fmt12(t)}
                            style={{
                              padding:'8px 4px', borderRadius:8, fontSize:12,
                              fontWeight:600, cursor: isDisabled ? 'not-allowed' : 'pointer',
                              border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                              background: isSelected ? 'var(--gradient)'
                                : isBooked ? 'rgba(239,68,68,0.08)'
                                : isPast ? 'rgba(107,114,128,0.08)' : 'var(--bg)',
                              color: isSelected ? 'white'
                                : isBooked ? '#ef4444'
                                : isPast ? 'var(--text-secondary)' : 'var(--text)',
                              opacity: isDisabled ? 0.6 : 1,
                              transition:'all 0.15s',
                              position:'relative'
                            }}>
                            {fmt12(t)}
                            {isBooked && (
                              <span style={{
                                display:'block', fontSize:9, marginTop:2,
                                color:'#ef4444', letterSpacing:0.3
                              }}>BOOKED</span>
                            )}
                            {isPast && !isBooked && (
                              <span style={{
                                display:'block', fontSize:9, marginTop:2,
                                color:'var(--text-secondary)', letterSpacing:0.3
                              }}>PASSED</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {form.appointment_date && (
                      <p style={{fontSize:11, color:'var(--text-secondary)', marginTop:8}}>
                        🔴 Red = already booked &nbsp;•&nbsp; ⚪ Grey = time passed &nbsp;•&nbsp; Click an available slot to select
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Meeting Type */}
              <div className="form-group">
                <label className="form-label">Meeting Type</label>
                <div style={{display:'flex', gap:10}}>
                  {['Offline', 'Online'].map(type => (
                    <button key={type} type="button"
                      onClick={() => setForm({...form, meeting_type: type})}
                      style={{
                        flex:1, padding:'10px', borderRadius:8, fontWeight:600, cursor:'pointer',
                        border: form.meeting_type === type ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: form.meeting_type === type ? 'var(--gradient)' : 'var(--bg)',
                        color: form.meeting_type === type ? 'white' : 'var(--text)', transition:'all 0.15s'
                      }}>
                      {type === 'Online' ? '📹' : '🏥'} {type}
                    </button>
                  ))}
                </div>
                {form.meeting_type === 'Online' && (
                  <p style={{fontSize:12, color:'var(--primary)', marginTop:6}}>
                    📹 A video call link will be generated upon doctor approval.
                  </p>
                )}
              </div>

              {/* Chief Complaint */}
              <div className="form-group">
                <label className="form-label">Chief Complaint *</label>
                <input type="text" className="form-input"
                  placeholder="e.g., Headache, Fever, Skin rash…"
                  value={form.chief_complaint}
                  onChange={e => setForm({...form, chief_complaint: e.target.value})} />
              </div>

              {/* Symptoms */}
              <div className="form-group">
                <label className="form-label">Symptoms (Optional)</label>
                <textarea className="form-textarea" rows={3}
                  placeholder="Describe your symptoms in detail…"
                  value={form.symptoms}
                  onChange={e => setForm({...form, symptoms: e.target.value})} />
              </div>

              <button type="submit" className="btn btn-primary btn-full"
                disabled={loading || dateBlocked}>
                {loading ? 'Booking…' : <><FaCalendarAlt /> Book Appointment</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;