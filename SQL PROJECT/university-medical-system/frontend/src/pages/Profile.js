import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { FaCamera, FaUser, FaEnvelope, FaPhone, FaEdit, FaSave, FaStethoscope, FaDownload } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    student_id: user?.student_id || '',
    doctor_profile: {
      specialization: user?.doctor_profile?.specialization || '',
      qualifications: user?.doctor_profile?.qualifications || '',
      experience_years: user?.doctor_profile?.experience_years || 0,
      consultation_fee: user?.doctor_profile?.consultation_fee || 0,
      available_days: user?.doctor_profile?.available_days || 'Monday,Tuesday,Wednesday,Thursday,Friday',
      bio: user?.doctor_profile?.bio || '',
      hospital_affiliation: user?.doctor_profile?.hospital_affiliation || '',
    }
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [records, setRecords] = useState([]);
  const [showRecords, setShowRecords] = useState(false);
  const fileRef = useRef();

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg','image/png','image/gif','image/webp'].includes(file.type))
      return toast.error('Only JPG, PNG, GIF, WEBP allowed');
    if (file.size > 5 * 1024 * 1024)
      return toast.error('File must be under 5MB');

    const reader = new FileReader();
    reader.onload = (ev) => setPreviewImage(ev.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const r = await api.post('/api/users/upload-image', fd, {
        headers: {'Content-Type': 'multipart/form-data'}
      });
      updateUser({ profile_image: r.data.data.image_url });
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Upload failed');
      setPreviewImage(null);
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await api.put('/api/users/profile', form);
      updateUser(r.data.data);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const loadRecords = async () => {
    try {
      const r = await api.get('/api/medical-records');
      setRecords(r.data.data || []);
      setShowRecords(true);
    } catch { toast.error('Failed to load records'); }
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
      toast.success('Downloaded!');
    } catch { toast.error('Download failed'); }
  };

  const avatarSrc = previewImage || (user?.profile_image ? `http://localhost:5000${user.profile_image}` : null);
  const avatarLetter = user?.full_name?.[0]?.toUpperCase() || 'U';

  const roleColors = {
    admin: '#f59e0b', doctor: '#3b82f6',
    student: '#10b981', teacher: '#8b5cf6', staff: '#06b6d4'
  };
  const roleColor = roleColors[user?.role] || '#667eea';

  return (
    <div style={{maxWidth:780, margin:'0 auto'}}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information</p>
        </div>
        {!editing ? (
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            <FaEdit /> Edit Profile
          </button>
        ) : (
          <div style={{display:'flex', gap:10}}>
            <button className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-success" onClick={handleSave} disabled={saving}>
              <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Avatar Section */}
      <div className="card" style={{marginBottom:20}}>
        <div className="profile-avatar-section">
          <div className="profile-avatar" style={{position:'relative'}}>
            {avatarSrc
              ? <img src={avatarSrc} alt="profile" />
              : <span>{avatarLetter}</span>}
            <button
              className="avatar-upload-btn"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Change photo"
            >
              {uploading ? '...' : <FaCamera />}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}}
            onChange={handleImageSelect} />
          <h2 style={{fontSize:22, fontWeight:700, marginTop:8}}>{user?.full_name}</h2>
          <span className="badge" style={{
            fontSize:13, padding:'4px 14px',
            color: roleColor, background: roleColor + '22', marginTop:4
          }}>
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
          </span>
          <p style={{fontSize:13, color:'var(--text-secondary)', marginTop:6}}>
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {month:'long', year:'numeric'}) : 'N/A'}
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            className="btn btn-outline btn-sm" style={{marginTop:12}}
          >
            <FaCamera /> {uploading ? 'Uploading...' : 'Change Photo'}
          </button>
        </div>
      </div>

      {/* Personal Info */}
      <div className="card" style={{marginBottom:20}}>
        <h3 style={{fontSize:16, fontWeight:700, marginBottom:18, display:'flex', alignItems:'center', gap:8}}>
          <FaUser style={{color:'var(--primary)'}}/> Personal Information
        </h3>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            {editing
              ? <input type="text" className="form-input" value={form.full_name}
                  onChange={e => setForm({...form, full_name: e.target.value})} />
              : <p style={{padding:'10px 14px', background:'var(--bg)', borderRadius:10, fontSize:14}}>{user?.full_name}</p>
            }
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <p style={{padding:'10px 14px', background:'var(--bg)', borderRadius:10, fontSize:14, color:'var(--text-secondary)'}}>
              <FaEnvelope style={{marginRight:6}} />{user?.email}
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            {editing
              ? <input type="tel" className="form-input" value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})} />
              : <p style={{padding:'10px 14px', background:'var(--bg)', borderRadius:10, fontSize:14}}>
                  {user?.phone || <span style={{color:'var(--text-secondary)'}}>Not set</span>}
                </p>
            }
          </div>
          <div className="form-group">
            <label className="form-label">Username</label>
            <p style={{padding:'10px 14px', background:'var(--bg)', borderRadius:10, fontSize:14, color:'var(--text-secondary)'}}>
              @{user?.username}
            </p>
          </div>
          {user?.role !== 'doctor' && user?.role !== 'admin' && (
            <>
              <div className="form-group">
                <label className="form-label">Department</label>
                {editing
                  ? <input type="text" className="form-input" value={form.department}
                      onChange={e => setForm({...form, department: e.target.value})} />
                  : <p style={{padding:'10px 14px', background:'var(--bg)', borderRadius:10, fontSize:14}}>
                      {user?.department || <span style={{color:'var(--text-secondary)'}}>Not set</span>}
                    </p>
                }
              </div>
              <div className="form-group">
                <label className="form-label">Student/Staff ID</label>
                {editing
                  ? <input type="text" className="form-input" value={form.student_id}
                      onChange={e => setForm({...form, student_id: e.target.value})} />
                  : <p style={{padding:'10px 14px', background:'var(--bg)', borderRadius:10, fontSize:14}}>
                      {user?.student_id || <span style={{color:'var(--text-secondary)'}}>Not set</span>}
                    </p>
                }
              </div>
            </>
          )}
        </div>
      </div>

      {/* Doctor Profile Section */}
      {user?.role === 'doctor' && (
        <div className="card" style={{marginBottom:20}}>
          <h3 style={{fontSize:16, fontWeight:700, marginBottom:18, display:'flex', alignItems:'center', gap:8}}>
            <FaStethoscope style={{color:'var(--primary)'}}/> Doctor Profile
          </h3>
          <div className="grid-2">
            {[
              {label:'Specialization', key:'specialization', type:'text'},
              {label:'Hospital Affiliation', key:'hospital_affiliation', type:'text'},
              {label:'Experience (years)', key:'experience_years', type:'number'},
              {label:'Consultation Fee ($)', key:'consultation_fee', type:'number'},
              {label:'Qualifications', key:'qualifications', type:'text'},
              {label:'Available Days', key:'available_days', type:'text'},
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                {editing
                  ? <input type={f.type} className="form-input"
                      value={form.doctor_profile[f.key] || ''}
                      onChange={e => setForm({...form, doctor_profile:{...form.doctor_profile, [f.key]:e.target.value}})} />
                  : <p style={{padding:'10px 14px', background:'var(--bg)', borderRadius:10, fontSize:14}}>
                      {user?.doctor_profile?.[f.key] || <span style={{color:'var(--text-secondary)'}}>Not set</span>}
                    </p>
                }
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            {editing
              ? <textarea className="form-textarea" value={form.doctor_profile.bio || ''}
                  onChange={e => setForm({...form, doctor_profile:{...form.doctor_profile, bio:e.target.value}})} />
              : <p style={{padding:'10px 14px', background:'var(--bg)', borderRadius:10, fontSize:14, lineHeight:1.6}}>
                  {user?.doctor_profile?.bio || <span style={{color:'var(--text-secondary)'}}>No bio added</span>}
                </p>
            }
          </div>
        </div>
      )}

      {/* Medical Records for patients */}
      {user?.role !== 'admin' && user?.role !== 'doctor' && (
        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
            <h3 style={{fontSize:16, fontWeight:700}}>📋 My Medical Records</h3>
            <button className="btn btn-outline btn-sm" onClick={loadRecords}>
              View Records
            </button>
          </div>
          {showRecords && (
            records.length === 0
              ? <p style={{color:'var(--text-secondary)', fontSize:14}}>No medical records found.</p>
              : <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  {records.map(r => (
                    <div key={r.record_id} style={{
                      padding:16, background:'var(--bg)', borderRadius:10,
                      border:'1px solid var(--border)',
                      display:'flex', justifyContent:'space-between', alignItems:'flex-start'
                    }}>
                      <div>
                        <p style={{fontSize:12, color:'var(--text-secondary)'}}>{new Date(r.record_date).toLocaleDateString()}</p>
                        <h4 style={{fontSize:14, fontWeight:600, margin:'4px 0'}}>Dr. {r.doctor_name} • {r.specialization}</h4>
                        <p style={{fontSize:13, color:'var(--text-secondary)'}}>Diagnosis: {r.diagnosis}</p>
                      </div>
                      <button className="btn btn-sm btn-info" onClick={() => downloadPDF(r.record_id)}>
                        <FaDownload /> PDF
                      </button>
                    </div>
                  ))}
                </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;

