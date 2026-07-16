import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FaCalendarAlt, FaUsers, FaCheckCircle, FaTimesCircle,
  FaCheck, FaTimes, FaVideo, FaFileAlt, FaDownload, FaClock, FaPlus,
  FaCalendarCheck, FaTrash
} from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DoctorPanel = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [showModal, setShowModal] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rxForm, setRxForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [leaves, setLeaves] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ leave_start: '', leave_end: '', reason: '' });
  const [leaveLoading, setLeaveLoading] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const isSessionActive = (appt) => {
    if (appt.status !== 'Confirmed' || appt.meeting_type !== 'Online' || !appt.meeting_link) return false;
    const now = new Date();
    const apptDate = new Date(appt.appointment_date);
    const [h, m] = (appt.appointment_time || '00:00:00').split(':').map(Number);
    const start = new Date(apptDate); start.setHours(h, m, 0, 0);
    return now >= new Date(start.getTime() - 5*60*1000) && now <= new Date(start.getTime() + 60*60*1000);
  };

  const isSessionExpired = (appt) => {
    if (appt.meeting_type !== 'Online' || !appt.meeting_link) return false;
    const apptDate = new Date(appt.appointment_date);
    const [h, m] = (appt.appointment_time || '00:00:00').split(':').map(Number);
    const start = new Date(apptDate); start.setHours(h, m, 0, 0);
    return new Date() > new Date(start.getTime() + 60*60*1000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsR, todayR, apptR, patientsR, leavesR] = await Promise.all([
        api.get('/api/doctor/appointments/stats'),
        api.get('/api/doctor/appointments/today'),
        api.get('/api/doctor/appointments'),
        api.get('/api/doctor/patients'),
        api.get('/api/doctor/leaves'),
      ]);
      setStats(statsR.data.data || {});
      setTodayAppointments(todayR.data.data || []);
      setAppointments(apptR.data.data || []);
      setPatients(patientsR.data.data || []);
      setLeaves(leavesR.data.data || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const loadPatientRecords = async (patientId) => {
    try {
      const r = await api.get(`/api/doctor/patients/${patientId}/records`);
      setPatientRecords(r.data.data || []);
    } catch { toast.error('Failed to load records'); }
  };

  const approveAppointment = async (id) => {
    try {
      const r = await api.put(`/api/doctor/appointments/${id}/approve`);
      toast.success('Appointment approved!');
      if (r.data.data?.meeting_link) {
        toast.success(`Meeting link: ${r.data.data.meeting_link}`, { duration: 5000 });
      }
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const cancelAppointment = async () => {
    if (!cancelReason.trim()) return toast.error('Please provide a cancellation reason');
    try {
      await api.put(`/api/doctor/appointments/${selectedAppt}/cancel`, { reason: cancelReason });
      toast.success('Appointment cancelled');
      setShowModal(null); setCancelReason(''); fetchAll();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const completeAppointment = async (id) => {
    try {
      await api.put(`/api/doctor/appointments/${id}/complete`);
      toast.success('Appointment completed');
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  const createPrescription = async () => {
    if (!rxForm.diagnosis || !rxForm.prescription) return toast.error('Diagnosis and prescription required');
    try {
      const r = await api.post('/api/doctor/medical-records', {
        ...rxForm,
        appointment_id: rxForm.appointment_id || null,
        record_date: new Date().toISOString().split('T')[0],
      });
      toast.success('Prescription created!');
      setShowModal(null); setRxForm({});
      fetchAll();
      return r.data.data?.record_id;
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const downloadPDF = async (recordId) => {
    try {
      const response = await api.get(`/api/doctor/medical-records/${recordId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription_${recordId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Prescription downloaded!');
    } catch { toast.error('Download failed'); }
  };

  const getStatusBadge = (status) => {
    const m = { Pending: 'badge-pending', Confirmed: 'badge-confirmed', Completed: 'badge-completed', Cancelled: 'badge-cancelled' };
    return <span className={`badge ${m[status] || ''}`}>{status}</span>;
  };

  const filteredAppointments = appointments.filter(a => !filterStatus || a.status === filterStatus);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaCalendarAlt /> },
    { id: 'appointments', label: 'Appointments', icon: <FaCalendarAlt /> },
    { id: 'patients', label: 'Patients', icon: <FaUsers /> },
    { id: 'records', label: 'Medical Records', icon: <FaFileAlt /> },
    { id: 'leaves', label: 'Leave Requests', icon: <FaCalendarCheck /> },
  ];

  return (
    <div>
      <div className="page-header-gradient">
        <h1>🩺 Doctor Panel</h1>
        <p>Welcome, {user?.full_name} — {user?.doctor_profile?.specialization || 'General Medicine'}</p>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner"/></div> : (
        <>
          {/* ── DASHBOARD TAB ── */}
          {tab === 'dashboard' && (
            <div>
              <div className="stats-grid">
                {[
                  {label:"Today's Appointments", value:stats.today||0, icon:<FaCalendarAlt/>, gradient:'linear-gradient(135deg,#667eea,#764ba2)'},
                  {label:'Pending', value:stats.pending||0, icon:<FaClock/>, gradient:'linear-gradient(135deg,#f59e0b,#d97706)'},
                  {label:'Confirmed', value:stats.confirmed||0, icon:<FaCheckCircle/>, gradient:'linear-gradient(135deg,#3b82f6,#2563eb)'},
                  {label:'Completed', value:stats.completed||0, icon:<FaCheck/>, gradient:'linear-gradient(135deg,#10b981,#059669)'},
                  {label:'Cancelled', value:stats.cancelled||0, icon:<FaTimesCircle/>, gradient:'linear-gradient(135deg,#ef4444,#dc2626)'},
                  {label:'Total Patients', value:stats.total_patients||0, icon:<FaUsers/>, gradient:'linear-gradient(135deg,#8b5cf6,#6d28d9)'},
                ].map((s,i) => (
                  <div key={i} className="stat-card">
                    <div className="stat-icon" style={{background:s.gradient}}>{s.icon}</div>
                    <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
                  </div>
                ))}
              </div>

              <h2 className="section-title"><FaCalendarAlt style={{color:'var(--primary)'}}/>Today's Schedule</h2>
              {todayAppointments.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <div className="icon">📅</div>
                    <h3>No appointments today</h3>
                    <p>You have a free day!</p>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  {todayAppointments.map(a => (
                    <div key={a.appointment_id} className="appointment-item">
                      <div style={{
                        width:50, height:50, borderRadius:12, flexShrink:0,
                        background:'linear-gradient(135deg,#667eea,#764ba2)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color:'white', fontSize:13, fontWeight:700
                      }}>
                        {a.appointment_time?.slice(0,5)}
                      </div>
                      <div className="appt-info" style={{flex:1}}>
                        <h3>{a.patient_name}</h3>
                        <p>{a.chief_complaint}</p>
                        <div className="tags">
                          {getStatusBadge(a.status)}
                          <span className="badge" style={{background:'rgba(102,126,234,0.1)',color:'var(--primary)'}}>{a.meeting_type}</span>
                          {a.meeting_type === 'Online' && a.meeting_link && (
                            isSessionActive(a) ? (
                              <a href={a.meeting_link} target="_blank" rel="noreferrer" className="video-call-btn" style={{animation:'pulse 2s infinite'}}>
                                <FaVideo /> Join Meeting <span style={{background:'rgba(255,255,255,0.25)',borderRadius:20,padding:'1px 6px',fontSize:10,fontWeight:700}}>LIVE</span>
                              </a>
                            ) : isSessionExpired(a) ? (
                              <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:8,background:'rgba(107,114,128,0.1)',border:'1px solid rgba(107,114,128,0.2)',fontSize:11,color:'var(--text-secondary)'}}>🔒 Session ended</span>
                            ) : (
                              <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:8,background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.2)',fontSize:11,color:'#2563eb'}}>📅 Opens at {a.appointment_time?.slice(0,5)}</span>
                            )
                          )}
                        </div>
                      </div>
                      <div className="action-row">
                        {a.status === 'Pending' && (
                          <>
                            <button className="btn btn-sm btn-success" onClick={() => approveAppointment(a.appointment_id)} title="Approve">
                              <FaCheck />
                            </button>
                            <button className="btn btn-sm btn-danger"
                              onClick={() => { setSelectedAppt(a.appointment_id); setShowModal('cancel'); }} title="Cancel">
                              <FaTimes />
                            </button>
                          </>
                        )}
                        {a.status === 'Confirmed' && (
                          <button className="btn btn-sm btn-primary" onClick={() => completeAppointment(a.appointment_id)}>
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── APPOINTMENTS TAB ── */}
          {tab === 'appointments' && (
            <div className="card">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12}}>
                <h2 style={{fontSize:18, fontWeight:700}}>All Appointments ({filteredAppointments.length})</h2>
                <select className="form-select" style={{width:'auto'}} value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {filteredAppointments.map(a => (
                  <div key={a.appointment_id} style={{
                    border:'1px solid var(--border)', borderRadius:12,
                    padding:16, background:'var(--bg)',
                    display:'flex', alignItems:'center', gap:14, flexWrap:'wrap'
                  }}>
                    <div className="appt-date-box" style={{flexShrink:0}}>
                      <div className="day">{new Date(a.appointment_date).getDate()}</div>
                      <div className="month">{new Date(a.appointment_date).toLocaleString('default',{month:'short'})}</div>
                    </div>
                    <div style={{flex:1, minWidth:200}}>
                      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                        <strong style={{fontSize:15}}>{a.patient_name}</strong>
                        {getStatusBadge(a.status)}
                        <span className="badge" style={{background:'rgba(102,126,234,0.1)',color:'var(--primary)'}}>{a.meeting_type}</span>
                      </div>
                      <p style={{fontSize:13, color:'var(--text-secondary)'}}>{a.appointment_time?.slice(0,5)} • {a.chief_complaint}</p>
                      {a.cancellation_reason && (
                        <p style={{fontSize:12, color:'var(--danger)', marginTop:4}}>Reason: {a.cancellation_reason}</p>
                      )}
                      {a.meeting_type === 'Online' && a.meeting_link && (
                        isSessionActive(a) ? (
                          <a href={a.meeting_link} target="_blank" rel="noreferrer" className="video-call-btn" style={{marginTop:6,display:'inline-flex',animation:'pulse 2s infinite'}}>
                            <FaVideo /> Join Video Call <span style={{background:'rgba(255,255,255,0.25)',borderRadius:20,padding:'1px 6px',fontSize:10,fontWeight:700}}>LIVE</span>
                          </a>
                        ) : isSessionExpired(a) ? (
                          <span style={{marginTop:6,display:'inline-flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:8,background:'rgba(107,114,128,0.1)',border:'1px solid rgba(107,114,128,0.2)',fontSize:11,color:'var(--text-secondary)'}}>🔒 Session ended</span>
                        ) : (
                          <span style={{marginTop:6,display:'inline-flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:8,background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.2)',fontSize:11,color:'#2563eb'}}>📅 Opens at {a.appointment_time?.slice(0,5)}</span>
                        )
                      )}
                    </div>
                    <div className="action-row">
                      {a.status === 'Pending' && (
                        <>
                          <button className="btn btn-sm btn-success" onClick={() => approveAppointment(a.appointment_id)}>
                            <FaCheck /> Approve
                          </button>
                          <button className="btn btn-sm btn-danger"
                            onClick={() => { setSelectedAppt(a.appointment_id); setShowModal('cancel'); }}>
                            <FaTimes /> Cancel
                          </button>
                        </>
                      )}
                      {a.status === 'Confirmed' && (
                        <>
                          <button className="btn btn-sm btn-primary" onClick={() => completeAppointment(a.appointment_id)}>
                            <FaCheck /> Complete
                          </button>
                          <button className="btn btn-sm btn-warning" onClick={() => {
                            setRxForm({patient_id: a.patient_id, appointment_id: a.appointment_id, patient_name: a.patient_name});
                            setShowModal('prescription');
                          }}>
                            <FaFileAlt /> Prescription
                          </button>
                        </>
                      )}
                      {a.status === 'Completed' && (
                        <button className="btn btn-sm btn-info" onClick={() => {
                          setRxForm({patient_id: a.patient_id, appointment_id: a.appointment_id, patient_name: a.patient_name});
                          setShowModal('prescription');
                        }}>
                          <FaPlus /> Add Record
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PATIENTS TAB ── */}
          {tab === 'patients' && (
            <div>
              <h2 className="section-title" style={{marginBottom:16}}><FaUsers style={{color:'var(--primary)'}}/>My Patients ({patients.length})</h2>
              <div className="doctors-grid">
                {patients.map(p => (
                  <div key={p.user_id} className="doctor-card" style={{cursor:'pointer'}}
                    onClick={() => { setSelectedPatient(p); loadPatientRecords(p.user_id); }}>
                    <div className="doctor-card-avatar">
                      {p.profile_image ? <img src={`http://localhost:5000${p.profile_image}`} alt="" /> : p.full_name?.[0]}
                    </div>
                    <h3>{p.full_name}</h3>
                    <p className="spec">{p.role?.charAt(0).toUpperCase()+p.role?.slice(1)} • {p.department || 'N/A'}</p>
                    <div className="doctor-card-info">
                      <span>📧 {p.email}</span>
                      <span>📞 {p.phone || 'N/A'}</span>
                      <span>🆔 {p.student_id || 'N/A'}</span>
                      <span>🏥 {p.total_visits} visits • Last: {p.last_visit ? new Date(p.last_visit).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <button className="btn btn-outline btn-sm btn-full" onClick={e => {
                      e.stopPropagation();
                      setRxForm({patient_id: p.user_id, patient_name: p.full_name});
                      setShowModal('prescription');
                    }}>
                      <FaFileAlt /> Create Record
                    </button>
                  </div>
                ))}
              </div>

              {selectedPatient && (
                <div style={{marginTop:24}}>
                  <h2 className="section-title">
                    📋 Records for {selectedPatient.full_name}
                    <button className="btn btn-sm btn-outline" style={{marginLeft:'auto'}} onClick={() => setSelectedPatient(null)}>
                      <FaTimes /> Close
                    </button>
                  </h2>
                  {patientRecords.length === 0 ? (
                    <div className="card"><div className="empty-state"><h3>No records found</h3></div></div>
                  ) : (
                    <div style={{display:'flex', flexDirection:'column', gap:12}}>
                      {patientRecords.map(r => (
                        <div key={r.record_id} className="card">
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                            <div style={{flex:1}}>
                              <p style={{fontSize:12, color:'var(--text-secondary)'}}>{new Date(r.record_date).toLocaleDateString()}</p>
                              <h3 style={{fontSize:15, fontWeight:700, margin:'6px 0'}}>Diagnosis: {r.diagnosis}</h3>
                              <p style={{fontSize:13, color:'var(--text-secondary)'}}>Rx: {r.prescription}</p>
                              {r.doctor_notes && <p style={{fontSize:13, color:'var(--text-secondary)', marginTop:4}}>Notes: {r.doctor_notes}</p>}
                              {r.follow_up_date && <p style={{fontSize:12, color:'var(--primary)', marginTop:4}}>Follow-up: {new Date(r.follow_up_date).toLocaleDateString()}</p>}
                            </div>
                            <button className="btn btn-sm btn-info" onClick={() => downloadPDF(r.record_id)}>
                              <FaDownload /> PDF
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── RECORDS TAB ── */}
          {tab === 'records' && (
            <div className="card">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
                <h2 style={{fontSize:18, fontWeight:700}}>Create Medical Record</h2>
              </div>
              <div style={{maxWidth:600}}>
                <div className="form-group">
                  <label className="form-label">Patient</label>
                  <select className="form-select" value={rxForm.patient_id||''}
                    onChange={e => setRxForm({...rxForm, patient_id: e.target.value})}>
                    <option value="">Select patient</option>
                    {patients.map(p => <option key={p.user_id} value={p.user_id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Diagnosis *</label>
                  <textarea className="form-textarea" placeholder="Enter diagnosis..."
                    value={rxForm.diagnosis||''} onChange={e => setRxForm({...rxForm, diagnosis: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Prescription (℞) *</label>
                  <textarea className="form-textarea" placeholder="Medicine name - Dosage - Duration..."
                    value={rxForm.prescription||''} onChange={e => setRxForm({...rxForm, prescription: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Doctor's Notes</label>
                  <textarea className="form-textarea" rows={2}
                    value={rxForm.doctor_notes||''} onChange={e => setRxForm({...rxForm, doctor_notes: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Follow-up Date</label>
                  <input type="date" className="form-input"
                    value={rxForm.follow_up_date||''} onChange={e => setRxForm({...rxForm, follow_up_date: e.target.value})} />
                </div>
                <button className="btn btn-primary" onClick={createPrescription}>
                  <FaFileAlt /> Create Record
                </button>
              </div>
            </div>
          )}

          {/* ── LEAVES TAB ── */}
          {tab === 'leaves' && (
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start'}}>

              {/* Apply for leave */}
              <div className="card">
                <h3 style={{fontWeight:700, marginBottom:16, display:'flex', alignItems:'center', gap:8}}>
                  <FaCalendarCheck style={{color:'var(--primary)'}} /> Apply for Leave
                </h3>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input type="date" className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                    value={leaveForm.leave_start}
                    onChange={e => setLeaveForm(f => ({...f, leave_start: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input type="date" className="form-input"
                    min={leaveForm.leave_start || new Date().toISOString().split('T')[0]}
                    value={leaveForm.leave_end}
                    onChange={e => setLeaveForm(f => ({...f, leave_end: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason *</label>
                  <textarea className="form-textarea" rows={4}
                    placeholder={'Provide a valid reason (e.g., Medical treatment, Family emergency, Conference)\nMinimum 20 characters required.'}
                    value={leaveForm.reason}
                    onChange={e => setLeaveForm(f => ({...f, reason: e.target.value}))} />
                </div>
                <div style={{fontSize:12, color:'var(--text-secondary)', marginBottom:12, padding:'8px 12px',
                  background:'rgba(102,126,234,0.07)', borderRadius:8}}>
                  ℹ️ Approved leaves automatically block your appointment slots for those dates.
                </div>
                <button className="btn btn-primary btn-full" disabled={leaveLoading}
                  onClick={async () => {
                    if (!leaveForm.leave_start || !leaveForm.leave_end || !leaveForm.reason.trim())
                      return toast.error('All fields are required');
                    if (leaveForm.reason.trim().length < 20)
                      return toast.error('Please provide a more detailed reason (min 20 characters)');
                    setLeaveLoading(true);
                    try {
                      await api.post('/api/doctor/leaves', leaveForm);
                      toast.success('Leave request submitted successfully!');
                      setLeaveForm({ leave_start: '', leave_end: '', reason: '' });
                      fetchAll();
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to submit leave');
                    } finally { setLeaveLoading(false); }
                  }}>
                  {leaveLoading ? 'Submitting...' : <><FaCalendarCheck /> Submit Leave Request</>}
                </button>
              </div>

              {/* Leave history */}
              <div>
                <h3 style={{fontWeight:700, marginBottom:16, display:'flex', alignItems:'center', gap:8}}>
                  <FaFileAlt style={{color:'var(--primary)'}} /> My Leave History
                </h3>
                {leaves.length === 0 ? (
                  <div className="card" style={{textAlign:'center', color:'var(--text-secondary)', padding:32}}>
                    No leave requests yet.
                  </div>
                ) : (
                  <div style={{display:'flex', flexDirection:'column', gap:12}}>
                    {leaves.map(lv => {
                      const statusColor = lv.status === 'approved' ? '#10b981'
                        : lv.status === 'rejected' ? '#ef4444' : '#f59e0b';
                      const statusBg = lv.status === 'approved' ? 'rgba(16,185,129,0.1)'
                        : lv.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
                      const startD = new Date(lv.leave_start + 'T00:00:00');
                      const endD   = new Date(lv.leave_end   + 'T00:00:00');
                      const startFmt = startD.toLocaleDateString('en-US', {month:'short', day:'numeric'});
                      const endFmt   = endD.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
                      const days = Math.round((endD - startD) / (1000*60*60*24)) + 1;
                      return (
                        <div key={lv.leave_id} className="card" style={{padding:16}}>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8}}>
                            <div style={{flex:1}}>
                              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
                                <span style={{
                                  padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                                  color: statusColor, background: statusBg, textTransform:'uppercase'
                                }}>{lv.status}</span>
                                <span style={{fontSize:12, color:'var(--text-secondary)'}}>
                                  {days} day{days !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <p style={{fontWeight:600, fontSize:14}}>{startFmt} → {endFmt}</p>
                              <p style={{fontSize:12, color:'var(--text-secondary)', marginTop:4}}>{lv.reason}</p>
                              {lv.admin_note && (
                                <p style={{
                                  fontSize:12, marginTop:6, padding:'6px 10px',
                                  background: lv.status === 'approved' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                  borderRadius:6, color: statusColor
                                }}>
                                  <strong>Admin note:</strong> {lv.admin_note}
                                </p>
                              )}
                              <p style={{fontSize:11, color:'var(--text-secondary)', marginTop:6}}>
                                Submitted: {new Date(lv.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            {lv.status === 'pending' && (
                              <button
                                onClick={async () => {
                                  if (!window.confirm('Cancel this leave request?')) return;
                                  try {
                                    await api.delete('/api/doctor/leaves/' + lv.leave_id);
                                    toast.success('Leave request cancelled');
                                    fetchAll();
                                  } catch (err) {
                                    toast.error(err.response?.data?.message || 'Failed');
                                  }
                                }}
                                title="Cancel request"
                                style={{
                                  background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
                                  color:'#ef4444', borderRadius:8, padding:'6px 10px', cursor:'pointer',
                                  fontSize:13, flexShrink:0
                                }}>
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Cancel Modal ── */}
      {showModal === 'cancel' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Cancel Appointment</h2>
              <button className="modal-close" onClick={() => setShowModal(null)}><FaTimes /></button>
            </div>
            <p style={{color:'var(--text-secondary)', marginBottom:16, fontSize:14}}>
              ⚠️ Please provide a reason for cancellation. This will be visible to the patient.
            </p>
            <div className="form-group">
              <label className="form-label">Cancellation Reason *</label>
              <textarea className="form-textarea" rows={3}
                placeholder="e.g., Emergency surgery scheduled, doctor unavailable..."
                value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
            </div>
            <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={() => setShowModal(null)}>Back</button>
              <button className="btn btn-danger" onClick={cancelAppointment}><FaTimes /> Cancel Appointment</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Prescription Modal ── */}
      {showModal === 'prescription' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(null)}>
          <div className="modal" style={{maxWidth:560}}>
            <div className="modal-header">
              <h2 className="modal-title">Create Prescription {rxForm.patient_name ? `— ${rxForm.patient_name}` : ''}</h2>
              <button className="modal-close" onClick={() => setShowModal(null)}><FaTimes /></button>
            </div>
            {!rxForm.patient_id && (
              <div className="form-group">
                <label className="form-label">Patient *</label>
                <select className="form-select" value={rxForm.patient_id||''}
                  onChange={e => setRxForm({...rxForm, patient_id: e.target.value})}>
                  <option value="">Select patient</option>
                  {patients.map(p => <option key={p.user_id} value={p.user_id}>{p.full_name}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Diagnosis *</label>
              <textarea className="form-textarea" placeholder="Enter diagnosis..."
                value={rxForm.diagnosis||''} onChange={e => setRxForm({...rxForm, diagnosis: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Prescription (℞) *</label>
              <textarea className="form-textarea" placeholder={'Tab. Paracetamol 500mg - 1 tab TID x 5 days\n...'}
                value={rxForm.prescription||''} onChange={e => setRxForm({...rxForm, prescription: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Doctor's Notes</label>
              <textarea className="form-textarea" rows={2}
                value={rxForm.doctor_notes||''} onChange={e => setRxForm({...rxForm, doctor_notes: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Follow-up Date</label>
              <input type="date" className="form-input"
                value={rxForm.follow_up_date||''} onChange={e => setRxForm({...rxForm, follow_up_date: e.target.value})} />
            </div>
            <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={() => setShowModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                const rid = await createPrescription();
                if (rid) downloadPDF(rid);
              }}>
                <FaDownload /> Save & Download PDF
              </button>
              <button className="btn btn-success" onClick={createPrescription}>
                <FaFileAlt /> Save Only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPanel;