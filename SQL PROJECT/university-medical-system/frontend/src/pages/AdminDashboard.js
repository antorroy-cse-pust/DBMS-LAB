import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  FaUsers, FaPills, FaBullhorn, FaCog, FaExclamationTriangle, FaUserMd,
  FaPlus, FaTrash, FaCheck, FaTimes, FaSearch, FaToggleOn, FaToggleOff,
  FaBan, FaUpload, FaImage, FaEdit, FaEye, FaPhone, FaEnvelope,
  FaCheckCircle, FaTimesCircle, FaChartBar, FaCalendarCheck, FaUmbrellaBeach
} from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id:'users', label:'Users', icon:<FaUsers /> },
  { id:'pharmacy', label:'Pharmacy', icon:<FaPills /> },
  { id:'campaigns', label:'Campaigns', icon:<FaBullhorn /> },
  { id:'emergency', label:'Emergency', icon:<FaExclamationTriangle /> },
  { id:'banners', label:'Banners', icon:<FaBullhorn /> },
  { id:'complaints', label:'Complaints', icon:<FaExclamationTriangle /> },
  { id:'leaves', label:'Doctor Leaves', icon:<FaCalendarCheck /> },
  { id:'settings', label:'Settings', icon:<FaCog /> },
];

const AdminDashboard = () => {
  const { updateSettings: updateGlobalSettings } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(null);
  const [formData, setFormData] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [stats, setStats] = useState({});
  const [banners, setBanners] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [settingsEditMed, setSettingsEditMed] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveFilter, setLeaveFilter] = useState('pending');
  const [leaveNote, setLeaveNote] = useState('');
  const [leaveActionId, setLeaveActionId] = useState(null);
  const [settingsEditForm, setSettingsEditForm] = useState({});
  const [landingForm, setLandingForm] = useState({});
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroPreview, setHeroPreview] = useState(null);
  const heroRef = useRef();
  const logoRef = useRef();

  useEffect(() => { loadTab(tab); }, [tab]);
  useEffect(() => { api.get('/api/dashboard/stats').then(r=>setStats(r.data.data||{})).catch(()=>{}); }, []);

  const loadEmergencyContacts = async () => {
    try {
      const r = await api.get('/api/emergency/contacts');
      setEmergencyContacts(r.data.data || []);
    } catch {}
  };

  const loadTab = async (t) => {
    setLoading(true);
    try {
      if (t==='users') { const r=await api.get('/api/admin/users'); setUsers(r.data.data||[]); }
      else if (t==='pharmacy') { const r=await api.get('/api/pharmacy/medicines'); setMedicines(r.data.data||[]); }
      else if (t==='campaigns') { const r=await api.get('/api/campaigns'); setCampaigns(r.data.data||[]); }
      else if (t==='emergency') { const r=await api.get('/api/admin/emergency/alerts'); setEmergencies(r.data.data||[]); }
      else if (t==='banners') { const r=await api.get('/api/banners'); setBanners(r.data.data||[]); }
      else if (t==='complaints') { const r=await api.get('/api/admin/complaints'); setAllComplaints(r.data.data||[]); }
      else if (t==='leaves') { const r=await api.get('/api/admin/leaves?status=pending'); setLeaves(r.data.data||[]); }
      else if (t==='settings') {
        const r=await api.get('/api/settings'); setSettings(r.data.data||{}); setFormData(r.data.data||{});
        if (r.data.data?.university_logo) setLogoPreview(`http://localhost:5000${r.data.data.university_logo}`);
        loadEmergencyContacts();
        const mr=await api.get('/api/pharmacy/medicines'); setMedicines(mr.data.data||[]);
        const lr=await api.get('/api/landing'); const ld=lr.data.data?.landing||{}; setLandingForm(ld); if(ld.hero_bg_url) setHeroPreview('http://localhost:5000'+ld.hero_bg_url);
      }
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const openEditUser = async (user) => {
    try {
      const r = await api.get(`/api/admin/users/${user.user_id}`);
      setFormData(r.data.data || user);
      setShowModal('editUser');
    } catch { setFormData(user); setShowModal('editUser'); }
  };

  const saveUser = async () => {
    try {
      await api.put(`/api/admin/users/${formData.user_id}`, formData);
      toast.success('User updated!'); setShowModal(null); setFormData({}); loadTab('users');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const blockUser = async (id, isActive) => {
    try {
      await api.put(`/api/admin/users/${id}/${isActive?'block':'unblock'}`);
      toast.success(isActive?'User blocked':'User unblocked'); loadTab('users');
    } catch { toast.error('Failed'); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Permanently delete this user?')) return;
    try { await api.delete(`/api/admin/users/${id}`); toast.success('Deleted'); loadTab('users'); }
    catch { toast.error('Failed'); }
  };

  const deleteMedicine = async (id) => {
    if (!window.confirm('Delete this medicine?')) return;
    try { await api.delete(`/api/admin/medicines/${id}`); toast.success('Deleted'); loadTab('pharmacy'); }
    catch { toast.error('Failed'); }
  };

  const addMedicine = async () => {
    if (!formData.generic_name) return toast.error('Generic name required');
    try {
      await api.post('/api/admin/medicines', formData);
      toast.success('Medicine added!'); setShowModal(null); setFormData({}); loadTab('pharmacy');
    } catch (e) { toast.error(e.response?.data?.message||'Failed'); }
  };

  const saveCampaign = async () => {
    if (!formData.title) return toast.error('Title required');
    try {
      if (formData.campaign_id) {
        await api.put(`/api/admin/campaigns/${formData.campaign_id}/edit`, formData);
        toast.success('Campaign updated!');
      } else {
        await api.post('/api/admin/campaigns', formData);
        toast.success('Campaign created!');
      }
      setShowModal(null); setFormData({}); loadTab('campaigns');
    } catch (e) { toast.error(e.response?.data?.message||'Failed'); }
  };

  const toggleCampaign = async (id) => {
    try { await api.put(`/api/admin/campaigns/${id}/toggle`); loadTab('campaigns'); }
    catch { toast.error('Failed'); }
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm('Delete campaign?')) return;
    try { await api.delete(`/api/admin/campaigns/${id}`); toast.success('Deleted'); loadTab('campaigns'); }
    catch { toast.error('Failed'); }
  };

  const respondEmergency = async (id) => {
    try {
      await api.put(`/api/admin/emergency/alerts/${id}/respond`, {response_notes:'Response team dispatched'}, {headers:{'Content-Type':'application/json'}});
      toast.success('Marked as responded'); loadTab('emergency');
    } catch { toast.error('Failed'); }
  };

  const resolveEmergency = async (id) => {
    try {
      await api.put(`/api/admin/emergency/alerts/${id}/resolve`, {}, {headers:{'Content-Type':'application/json'}});
      toast.success('Emergency resolved'); loadTab('emergency');
    } catch { toast.error('Failed'); }
  };

  const handleLogoSelect = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
    setLogoUploading(true);
    const fd = new FormData(); fd.append('logo', file);
    try {
      const r = await api.post('/api/admin/settings/upload-logo', fd, {headers:{'Content-Type':'multipart/form-data'}});
      toast.success('Logo uploaded!');
      setFormData(prev => ({...prev, university_logo: r.data.data.logo_url}));
    } catch { toast.error('Logo upload failed'); }
    finally { setLogoUploading(false); }
  };

  const saveLanding = async () => {
    try {
      await api.put('/api/admin/landing', landingForm);
      toast.success('Landing page updated!');
    } catch { toast.error('Failed'); }
  };

  const uploadHeroImage = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setHeroPreview(ev.target.result);
    reader.readAsDataURL(file);
    setHeroUploading(true);
    const fd = new FormData(); fd.append('image', file);
    try {
      const r = await api.post('/api/admin/landing/upload-hero', fd, {headers:{'Content-Type':'multipart/form-data'}});
      setLandingForm(p => ({...p, hero_bg_url: r.data.data.url}));
      toast.success('Hero image uploaded!');
    } catch { toast.error('Upload failed'); }
    finally { setHeroUploading(false); }
  };

  const saveEmergencyContact = async () => {
    if (!formData.label || !formData.number) return toast.error('Label and number required');
    try {
      if (formData._isNew) {
        await api.post('/api/admin/emergency/contacts', formData);
        toast.success('Contact added!');
      } else {
        await api.put('/api/admin/emergency/contacts/' + formData.contact_id, formData);
        toast.success('Contact updated!');
      }
      setShowModal(null); setFormData({});
      loadEmergencyContacts();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      const r = await api.put('/api/admin/settings', formData);
      toast.success('Settings saved! Changes visible everywhere.');
      updateGlobalSettings(r.data.data);
      loadTab('settings');
    } catch { toast.error('Failed to save'); }
  };

  const createDoctor = async () => {
    if (!formData.full_name || !formData.email || !formData.password || !formData.username)
      return toast.error('Name, username, email and password required');
    try {
      await api.post('/api/admin/doctors', {
        ...formData,
        doctor_profile: {
          specialization:formData.specialization, qualifications:formData.qualifications,
          experience_years:formData.experience_years, consultation_fee:formData.consultation_fee,
          available_days:formData.available_days||'Monday,Tuesday,Wednesday,Thursday,Friday',
          bio:formData.bio, hospital_affiliation:formData.hospital_affiliation
        }
      });
      toast.success('Doctor account created!'); setShowModal(null); setFormData({}); loadTab('users');
    } catch (e) { toast.error(e.response?.data?.message||'Failed'); }
  };

  const filteredUsers = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role) => {
    const map = {admin:{c:'#f59e0b'},doctor:{c:'#3b82f6'},student:{c:'#10b981'},teacher:{c:'#8b5cf6'},staff:{c:'#06b6d4'}};
    const m = map[role]||{c:'#6b7280'};
    return <span className="badge" style={{color:m.c,background:m.c+'22',textTransform:'capitalize'}}>{role}</span>;
  };

  const getEmergencyBadge = (status) => {
    const map = {Active:{c:'#ef4444',bg:'#fef2f2'},Responded:{c:'#f59e0b',bg:'#fffbeb'},Resolved:{c:'#6b7280',bg:'#f9fafb'}};
    const m = map[status]||{c:'#6b7280',bg:'#f9fafb'};
    return <span className="badge" style={{color:m.c,background:m.bg}}>{status}</span>;
  };

  const f = (k, v) => setFormData(p => ({...p, [k]:v}));
  const fd = (k, v) => setFormData(p => ({...p, doctor_profile:{...(p.doctor_profile||{}), [k]:v}}));

  // ── Stats bar ───────────────────────────────────────
  const statItems = [
    {label:'Total Users', value:stats.total_users||0, color:'#667eea', icon:'👥'},
    {label:'Doctors', value:stats.total_doctors||0, color:'#3b82f6', icon:'🩺'},
    {label:"Today's Appts", value:stats.today_appointments||0, color:'#10b981', icon:'📅'},
    {label:'Emergencies', value:stats.active_emergencies||0, color:'#ef4444', icon:'🚨'},
    {label:'Low Stock', value:stats.low_stock_medicines||0, color:'#f59e0b', icon:'💊'},
    {label:'Campaigns', value:stats.active_campaigns||0, color:'#8b5cf6', icon:'📢'},
  ];

  return (
    <div>
      {/* Header */}
      <div style={{
        background:'linear-gradient(135deg,#1a3c6e,#2563eb)',
        borderRadius:16, padding:'24px 28px', marginBottom:24, color:'white',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12
      }}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,margin:0}}>👑 Admin Control Panel</h1>
          <p style={{opacity:0.85,margin:'4px 0 0',fontSize:13}}>Full system management — users, pharmacy, campaigns & more</p>
        </div>
        <button className="btn" style={{background:'rgba(255,255,255,0.2)',color:'white',border:'1px solid rgba(255,255,255,0.3)'}}
          onClick={() => { setShowModal('doctor'); setFormData({}); }}>
          <FaUserMd /> Add Doctor
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:14,marginBottom:24}}>
        {statItems.map((s,i) => (
          <div key={i} style={{
            background:'var(--bg-card)', borderRadius:12, padding:'14px 16px',
            border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12
          }}>
            <span style={{fontSize:24}}>{s.icon}</span>
            <div>
              <div style={{fontSize:22,fontWeight:700,color:s.color,lineHeight:1}}>{s.value}</div>
              <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:2}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
            {t.id==='emergency' && stats.active_emergencies>0 && (
              <span style={{background:'#ef4444',color:'white',borderRadius:20,padding:'1px 6px',fontSize:10,fontWeight:700,marginLeft:4}}>
                {stats.active_emergencies}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner"/></div> : (
        <>
          {/* ── USERS TAB ── */}
          {tab==='users' && (
            <div className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18,flexWrap:'wrap',gap:12}}>
                <h2 style={{fontSize:18,fontWeight:700}}>All Users <span style={{color:'var(--text-secondary)',fontSize:14,fontWeight:400}}>({filteredUsers.length})</span></h2>
                <div className="search-wrapper" style={{width:260}}>
                  <FaSearch className="search-icon"/>
                  <input className="search-input" placeholder="Search by name, email, role..."
                    value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th style={{textAlign:'center'}}>Actions</th></tr></thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.user_id}>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#667eea,#764ba2)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:14,overflow:'hidden',flexShrink:0}}>
                              {u.profile_image
                                ? <img src={`http://localhost:5000${u.profile_image}`} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                                : u.full_name?.[0]?.toUpperCase()
                              }
                            </div>
                            <div>
                              <div style={{fontWeight:600,fontSize:14}}>{u.full_name}</div>
                              <div style={{fontSize:11,color:'var(--text-secondary)'}}>@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{fontSize:13}}>{u.email}</td>
                        <td>{getRoleBadge(u.role)}</td>
                        <td style={{fontSize:13,color:'var(--text-secondary)'}}>{u.department||'—'}</td>
                        <td>
                          <span style={{
                            display:'inline-flex',alignItems:'center',gap:4,
                            padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,
                            background:u.is_active?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)',
                            color:u.is_active?'#059669':'#dc2626'
                          }}>
                            {u.is_active ? <FaCheckCircle/> : <FaTimesCircle/>}
                            {u.is_active?'Active':'Blocked'}
                          </span>
                        </td>
                        <td>
                          <div style={{display:'flex',gap:6,justifyContent:'center'}}>
                            <button className="btn btn-sm btn-info" onClick={() => openEditUser(u)} title="Edit user">
                              <FaEdit />
                            </button>
                            <button className={`btn btn-sm ${u.is_active?'btn-warning':'btn-success'}`}
                              onClick={() => blockUser(u.user_id, u.is_active)}
                              title={u.is_active?'Block':'Unblock'}>
                              {u.is_active ? <FaBan /> : <FaCheck />}
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => deleteUser(u.user_id)} title="Delete">
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PHARMACY TAB ── */}
          {tab==='pharmacy' && (
            <div className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
                <h2 style={{fontSize:18,fontWeight:700}}>Medicines <span style={{color:'var(--text-secondary)',fontSize:14,fontWeight:400}}>({medicines.length})</span></h2>
                <button className="btn btn-primary" onClick={() => { setShowModal('medicine'); setFormData({}); }}>
                  <FaPlus /> Add Medicine
                </button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Medicine</th><th>Brand</th><th>Category</th><th>Stock</th><th>Min Stock</th><th>Price</th><th>Actions</th></tr></thead>
                  <tbody>
                    {medicines.map(m => (
                      <tr key={m.medicine_id}>
                        <td><div style={{fontWeight:600}}>{m.generic_name}</div><div style={{fontSize:11,color:'var(--text-secondary)'}}>{m.unit}</div></td>
                        <td style={{fontSize:13}}>{m.brand_name||'—'}</td>
                        <td style={{fontSize:13}}>{m.category||'—'}</td>
                        <td>
                          <span style={{
                            padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,
                            background:m.current_stock===0?'rgba(239,68,68,0.12)':m.current_stock<m.minimum_stock?'rgba(245,158,11,0.12)':'rgba(16,185,129,0.12)',
                            color:m.current_stock===0?'#dc2626':m.current_stock<m.minimum_stock?'#d97706':'#059669'
                          }}>
                            {m.current_stock===0?'Out of Stock':m.current_stock<m.minimum_stock?`Low: ${m.current_stock}`:`${m.current_stock}`}
                          </span>
                        </td>
                        <td style={{fontSize:13}}>{m.minimum_stock}</td>
                        <td style={{fontWeight:600,color:'var(--primary)'}}>${Number(m.selling_price).toFixed(2)}</td>
                        <td>
                          <button className="btn btn-sm btn-danger" onClick={() => deleteMedicine(m.medicine_id)}><FaTrash /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CAMPAIGNS TAB ── */}
          {tab==='campaigns' && (
            <div className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
                <h2 style={{fontSize:18,fontWeight:700}}>Campaigns <span style={{color:'var(--text-secondary)',fontSize:14,fontWeight:400}}>({campaigns.length})</span></h2>
                <button className="btn btn-primary" onClick={() => { setShowModal('campaign'); setFormData({}); }}>
                  <FaPlus /> Create Campaign
                </button>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {campaigns.map(c => (
                  <div key={c.campaign_id} style={{border:'1px solid var(--border)',borderRadius:12,padding:'16px 20px',background:'var(--bg)',display:'flex',alignItems:'center',gap:16}}>
                    <div style={{width:44,height:44,borderRadius:10,background:'linear-gradient(135deg,#667eea,#764ba2)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:18,flexShrink:0}}>
                      <FaBullhorn />
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                        <h3 style={{fontSize:15,fontWeight:700,margin:0}}>{c.title}</h3>
                        <span style={{padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700,background:c.is_active?'rgba(16,185,129,0.15)':'rgba(107,114,128,0.15)',color:c.is_active?'#059669':'#6b7280'}}>
                          {c.is_active?'● ACTIVE':'○ INACTIVE'}
                        </span>
                        {c.campaign_type && <span style={{padding:'2px 8px',borderRadius:20,fontSize:10,background:'rgba(102,126,234,0.12)',color:'var(--primary)'}}>{c.campaign_type}</span>}
                      </div>
                      <p style={{fontSize:13,color:'var(--text-secondary)',margin:'0 0 4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.description}</p>
                      <p style={{fontSize:12,color:'var(--text-secondary)',margin:0}}>📍 {c.location||'N/A'} &nbsp;|&nbsp; 📅 {c.start_date} → {c.end_date}</p>
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      <button className="btn btn-sm btn-info" onClick={() => { setFormData(c); setShowModal('campaign'); }} title="Edit"><FaEdit /></button>
                      <button className="btn btn-sm" style={{background:c.is_active?'rgba(245,158,11,0.15)':' rgba(16,185,129,0.15)',color:c.is_active?'#d97706':'#059669',border:'none'}}
                        onClick={() => toggleCampaign(c.campaign_id)} title="Toggle">
                        {c.is_active ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteCampaign(c.campaign_id)} title="Delete"><FaTrash /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── EMERGENCY TAB ── */}
          {tab==='emergency' && (
            <div className="card">
              <h2 style={{fontSize:18,fontWeight:700,marginBottom:18}}>
                🚨 Emergency Alerts
                {emergencies.filter(e=>e.status==='Active').length > 0 && (
                  <span style={{marginLeft:10,background:'#ef4444',color:'white',borderRadius:20,padding:'2px 10px',fontSize:12,fontWeight:700,animation:'pulse 1.5s infinite'}}>
                    {emergencies.filter(e=>e.status==='Active').length} ACTIVE
                  </span>
                )}
              </h2>
              {emergencies.length===0
                ? <div className="empty-state"><div className="icon">✅</div><h3>No emergencies</h3><p>All clear!</p></div>
                : <div style={{display:'flex',flexDirection:'column',gap:14}}>
                    {emergencies.map(e => (
                      <div key={e.alert_id} style={{
                        borderRadius:12, padding:18, overflow:'hidden',
                        border:e.status==='Active'?'2px solid #ef4444':'1px solid var(--border)',
                        background:e.status==='Active'?'rgba(239,68,68,0.04)':'var(--bg)',
                        position:'relative'
                      }}>
                        {e.status==='Active' && (
                          <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#ef4444,#dc2626)',animation:'pulse 1.5s infinite'}}/>
                        )}
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
                          <div style={{flex:1}}>
                            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,flexWrap:'wrap'}}>
                              <span style={{fontSize:22}}>🚨</span>
                              <strong style={{fontSize:16}}>{e.patient_name}</strong>
                              {getEmergencyBadge(e.status)}
                              <span style={{fontSize:12,color:'var(--text-secondary)'}}>⏰ {new Date(e.alert_time).toLocaleString()}</span>
                            </div>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 16px',fontSize:13}}>
                              <div><span style={{color:'var(--text-secondary)'}}>Symptoms: </span><strong>{e.symptoms}</strong></div>
                              <div><span style={{color:'var(--text-secondary)'}}>Location: </span><strong>{e.location}</strong></div>
                              <div><span style={{color:'var(--text-secondary)'}}><FaPhone style={{marginRight:4}}/></span>{e.patient_phone||'N/A'}</div>
                              <div><span style={{color:'var(--text-secondary)'}}><FaEnvelope style={{marginRight:4}}/></span>{e.patient_email}</div>
                            </div>
                            {e.response_notes && (
                              <div style={{marginTop:8,padding:'8px 12px',background:'rgba(16,185,129,0.08)',borderRadius:8,fontSize:13,color:'#059669'}}>
                                <strong>Response:</strong> {e.response_notes}
                              </div>
                            )}
                          </div>
                          <div style={{display:'flex',gap:8,flexShrink:0}}>
                            {e.status==='Active' && (
                              <button className="btn btn-sm btn-warning" onClick={() => respondEmergency(e.alert_id)}>
                                Respond
                              </button>
                            )}
                            {e.status!=='Resolved' && (
                              <button className="btn btn-sm btn-success" onClick={() => resolveEmergency(e.alert_id)}>
                                <FaCheck /> Resolve
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}


          {/* ── BANNERS TAB ── */}
          {tab==='banners' && (
            <div className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
                <h2 style={{fontSize:18,fontWeight:700}}>📢 Floating Banners & Notices</h2>
                <button className="btn btn-primary" onClick={() => { setShowModal('banner'); setFormData({}); }}>
                  <FaPlus /> Add Banner
                </button>
              </div>
              <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:16,padding:'10px 14px',background:'rgba(102,126,234,0.06)',borderRadius:10}}>
                These banners rotate automatically at the bottom of all pages for all logged-in users.
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {banners.map(b => {
                  const typeGradients = {info:'linear-gradient(135deg,#3b82f6,#2563eb)',warning:'linear-gradient(135deg,#f59e0b,#d97706)',success:'linear-gradient(135deg,#10b981,#059669)',campaign:'linear-gradient(135deg,#8b5cf6,#6d28d9)',health_tip:'linear-gradient(135deg,#06b6d4,#0891b2)',emergency:'linear-gradient(135deg,#ef4444,#dc2626)'};
                  const typeIcons = {info:'ℹ️',warning:'⚠️',success:'✅',campaign:'📢',health_tip:'💡',emergency:'🚨'};
                  return (
                    <div key={b.banner_id} style={{border:'1px solid var(--border)',borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'center',gap:14,background:'var(--bg)'}}>
                      <div style={{width:40,height:40,borderRadius:10,background:typeGradients[b.banner_type]||typeGradients.info,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                        {typeIcons[b.banner_type]||'ℹ️'}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{margin:0,fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.message}</p>
                        <div style={{display:'flex',gap:8,marginTop:4}}>
                          <span style={{fontSize:11,color:'var(--primary)',fontWeight:600}}>{b.banner_type}</span>
                          {b.link && <span style={{fontSize:11,color:'var(--text-secondary)'}}>→ {b.link}</span>}
                          <span style={{fontSize:11,color:b.is_active?'#059669':'#6b7280',fontWeight:600}}>{b.is_active?'Active':'Inactive'}</span>
                        </div>
                      </div>
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        <button className="btn btn-sm btn-info" onClick={() => { setFormData(b); setShowModal('banner'); }}><FaEdit /></button>
                        <button className="btn btn-sm btn-danger" onClick={async () => { if(window.confirm('Delete banner?')){ await api.delete('/api/admin/banners/'+b.banner_id); loadTab('banners'); toast.success('Deleted'); }}}><FaTrash /></button>
                      </div>
                    </div>
                  );
                })}
                {banners.length===0 && <div className="empty-state"><div className="icon">📢</div><h3>No banners yet</h3></div>}
              </div>
            </div>
          )}

          {/* ── COMPLAINTS TAB ── */}
          {tab==='complaints' && (
            <div className="card">
              <h2 style={{fontSize:18,fontWeight:700,marginBottom:18}}>📋 Patient Complaints <span style={{color:'var(--text-secondary)',fontSize:14,fontWeight:400}}>({allComplaints.length})</span></h2>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
                {['Pending','Under Review','Resolved','Dismissed'].map(s => {
                  const sc = {Pending:{c:'#d97706',bg:'rgba(245,158,11,0.1)'},'Under Review':{c:'#2563eb',bg:'rgba(59,130,246,0.1)'},Resolved:{c:'#059669',bg:'rgba(16,185,129,0.1)'},Dismissed:{c:'#6b7280',bg:'rgba(107,114,128,0.1)'}};
                  return (
                    <div key={s} style={{background:sc[s]?.bg,borderRadius:12,padding:'14px 16px',border:`1px solid ${sc[s]?.c}33`}}>
                      <div style={{fontSize:22,fontWeight:800,color:sc[s]?.c}}>{allComplaints.filter(c=>c.status===s).length}</div>
                      <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:3}}>{s}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {allComplaints.map(c => (
                  <div key={c.complaint_id} style={{border:'1px solid var(--border)',borderRadius:12,padding:'16px 18px',background:'var(--bg)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                          <h3 style={{fontSize:14,fontWeight:700,margin:0}}>{c.subject}</h3>
                          <span style={{padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:600,background:{Pending:'rgba(245,158,11,0.1)','Under Review':'rgba(59,130,246,0.1)',Resolved:'rgba(16,185,129,0.1)',Dismissed:'rgba(107,114,128,0.1)'}[c.status],color:{Pending:'#d97706','Under Review':'#2563eb',Resolved:'#059669',Dismissed:'#6b7280'}[c.status]}}>{c.status}</span>
                        </div>
                        <div style={{fontSize:12,color:'var(--text-secondary)'}}>
                          👤 {c.patient_name} → Dr. {c.doctor_name} ({c.specialization}) · {new Date(c.created_at).toLocaleDateString()}
                        </div>
                        <p style={{fontSize:13,color:'var(--text-secondary)',margin:'6px 0 0',lineHeight:1.5}}>{c.description?.slice(0,100)}{c.description?.length>100?'...':''}</p>
                        {c.proof_url && <a href={"http://localhost:5000"+c.proof_url} target="_blank" rel="noreferrer" style={{fontSize:12,color:'var(--primary)',marginTop:4,display:'inline-block'}}>📎 View Proof</a>}
                      </div>
                      <button className="btn btn-sm btn-primary" onClick={() => { setFormData({...c,_type:'complaint'}); setShowModal('complaint'); }}>Review</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {/* LEAVES TAB */}
          {tab === 'leaves' && (
            <div>
              {/* Filter bar */}
              <div style={{display:'flex', gap:8, marginBottom:20, flexWrap:'wrap'}}>
                {['pending','approved','rejected','all'].map(s => (
                  <button key={s}
                    onClick={async () => {
                      setLeaveFilter(s);
                      setLoading(true);
                      try {
                        const r = await api.get('/api/admin/leaves?status=' + s);
                        setLeaves(r.data.data || []);
                      } catch { toast.error('Failed to load'); }
                      finally { setLoading(false); }
                    }}
                    style={{
                      padding:'7px 18px', borderRadius:20, fontWeight:600, fontSize:13, cursor:'pointer',
                      border: leaveFilter===s ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: leaveFilter===s ? 'var(--gradient)' : 'var(--bg)',
                      color: leaveFilter===s ? 'white' : 'var(--text)', transition:'all 0.15s',
                      textTransform:'capitalize'
                    }}>
                    {s === 'all' ? 'All Requests' : s}
                  </button>
                ))}
              </div>

              {leaves.length === 0 ? (
                <div className="card" style={{textAlign:'center', padding:48, color:'var(--text-secondary)'}}>
                  <FaCalendarCheck style={{fontSize:40, marginBottom:12, opacity:0.3}} />
                  <p>No {leaveFilter === 'all' ? '' : leaveFilter} leave requests.</p>
                </div>
              ) : (
                <div style={{display:'flex', flexDirection:'column', gap:16}}>
                  {leaves.map(lv => {
                    const statusColor = lv.status === 'approved' ? '#10b981'
                      : lv.status === 'rejected' ? '#ef4444' : '#f59e0b';
                    const statusBg = lv.status === 'approved' ? 'rgba(16,185,129,0.1)'
                      : lv.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
                    const startD = new Date(lv.leave_start + 'T00:00:00');
                    const endD   = new Date(lv.leave_end   + 'T00:00:00');
                    const startFmt = startD.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
                    const endFmt   = endD.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
                    const days = Math.round((endD - startD)/(1000*60*60*24)) + 1;
                    return (
                      <div key={lv.leave_id} className="card" style={{padding:20}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap'}}>
                          <div style={{flex:1, minWidth:260}}>
                            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:8}}>
                              <div style={{
                                width:40, height:40, borderRadius:'50%', flexShrink:0,
                                background:'linear-gradient(135deg,#667eea,#764ba2)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                color:'white', fontWeight:700, fontSize:16
                              }}>{lv.doctor_name?.[0]}</div>
                              <div>
                                <p style={{fontWeight:700, fontSize:15}}>Dr. {lv.doctor_name}</p>
                                <p style={{fontSize:12, color:'var(--primary)'}}>{lv.specialization || 'General Medicine'}</p>
                              </div>
                              <span style={{
                                marginLeft:'auto', padding:'4px 12px', borderRadius:20,
                                fontSize:11, fontWeight:700, textTransform:'uppercase',
                                color: statusColor, background: statusBg
                              }}>{lv.status}</span>
                            </div>
                            <div style={{
                              padding:'10px 14px', background:'var(--bg)', borderRadius:8,
                              marginBottom:10, display:'flex', gap:16, flexWrap:'wrap'
                            }}>
                              <div>
                                <p style={{fontSize:11, color:'var(--text-secondary)', marginBottom:2}}>FROM</p>
                                <p style={{fontWeight:600, fontSize:13}}>{startFmt}</p>
                              </div>
                              <div style={{borderLeft:'1px solid var(--border)', paddingLeft:16}}>
                                <p style={{fontSize:11, color:'var(--text-secondary)', marginBottom:2}}>TO</p>
                                <p style={{fontWeight:600, fontSize:13}}>{endFmt}</p>
                              </div>
                              <div style={{borderLeft:'1px solid var(--border)', paddingLeft:16}}>
                                <p style={{fontSize:11, color:'var(--text-secondary)', marginBottom:2}}>DURATION</p>
                                <p style={{fontWeight:600, fontSize:13}}>{days} day{days!==1?'s':''}</p>
                              </div>
                            </div>
                            <p style={{fontSize:13, marginBottom:6}}><strong>Reason:</strong> {lv.reason}</p>
                            <p style={{fontSize:11, color:'var(--text-secondary)'}}>
                              Submitted: {new Date(lv.created_at).toLocaleString()}
                              {lv.reviewed_at && <> &nbsp;•&nbsp; Reviewed: {new Date(lv.reviewed_at).toLocaleString()}</>}
                            </p>
                            {lv.admin_note && (
                              <p style={{
                                fontSize:12, marginTop:8, padding:'6px 10px',
                                background: lv.status==='approved' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                borderRadius:6, color: statusColor
                              }}>
                                <strong>Admin note:</strong> {lv.admin_note}
                              </p>
                            )}
                          </div>

                          {/* Action panel — only for pending */}
                          {lv.status === 'pending' && (
                            <div style={{minWidth:220, display:'flex', flexDirection:'column', gap:8}}>
                              {leaveActionId === lv.leave_id ? (
                                <>
                                  <textarea
                                    className="form-textarea" rows={3}
                                    placeholder="Optional note to doctor…"
                                    value={leaveNote}
                                    onChange={e => setLeaveNote(e.target.value)}
                                    style={{fontSize:13}} />
                                  <div style={{display:'flex', gap:8}}>
                                    <button className="btn btn-success" style={{flex:1, padding:'8px'}}
                                      onClick={async () => {
                                        try {
                                          await api.put('/api/admin/leaves/' + lv.leave_id + '/approve', {admin_note: leaveNote});
                                          toast.success('Leave approved');
                                          setLeaveActionId(null); setLeaveNote('');
                                          const r = await api.get('/api/admin/leaves?status=' + leaveFilter);
                                          setLeaves(r.data.data || []);
                                        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
                                      }}>
                                      <FaCheck /> Approve
                                    </button>
                                    <button className="btn btn-danger" style={{flex:1, padding:'8px'}}
                                      onClick={async () => {
                                        if (!leaveNote.trim()) return toast.error('Rejection reason is required');
                                        try {
                                          await api.put('/api/admin/leaves/' + lv.leave_id + '/reject', {admin_note: leaveNote});
                                          toast.success('Leave rejected');
                                          setLeaveActionId(null); setLeaveNote('');
                                          const r = await api.get('/api/admin/leaves?status=' + leaveFilter);
                                          setLeaves(r.data.data || []);
                                        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
                                      }}>
                                      <FaTimes /> Reject
                                    </button>
                                  </div>
                                  <button style={{
                                    background:'none', border:'none', cursor:'pointer',
                                    color:'var(--text-secondary)', fontSize:12, textAlign:'center'
                                  }} onClick={() => { setLeaveActionId(null); setLeaveNote(''); }}>
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button className="btn btn-primary"
                                  onClick={() => { setLeaveActionId(lv.leave_id); setLeaveNote(''); }}
                                  style={{padding:'10px 16px'}}>
                                  Review Request
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab==='settings' && (
            <div style={{maxWidth:740}}>

              {/* ── University Branding ── */}
              <div className="card" style={{marginBottom:20}}>
                <h3 style={{fontSize:16,fontWeight:700,marginBottom:6,display:'flex',alignItems:'center',gap:8}}>
                  🏥 University Branding
                </h3>
                <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:18}}>
                  Logo and name appear on the login page, sidebar, and all PDF prescriptions instantly after saving.
                </p>
                <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:24,padding:16,background:'var(--bg)',borderRadius:12,border:'1px solid var(--border)'}}>
                  <div style={{width:88,height:88,borderRadius:14,border:'2px dashed var(--border)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0,background:'white'}}>
                    {logoPreview ? <img src={logoPreview} alt="logo" style={{width:'100%',height:'100%',objectFit:'contain'}}/> : <span style={{fontSize:36}}>🏥</span>}
                  </div>
                  <div>
                    <p style={{fontSize:14,fontWeight:600,margin:'0 0 4px'}}>University Logo</p>
                    <p style={{fontSize:12,color:'var(--text-secondary)',margin:'0 0 12px'}}>PNG, JPG or WEBP · Max 5MB · Recommended 200×200px</p>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => logoRef.current?.click()} disabled={logoUploading}>
                      <FaUpload /> {logoUploading ? 'Uploading...' : 'Upload Logo'}
                    </button>
                  </div>
                  <input ref={logoRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleLogoSelect}/>
                </div>
                <form onSubmit={saveSettings}>
                  <div className="form-group">
                    <label className="form-label">University Name</label>
                    <input type="text" className="form-input" placeholder="e.g. Bangladesh University of Engineering"
                      value={formData.university_name||''} onChange={e=>f('university_name',e.target.value)}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <textarea className="form-textarea" rows={2} placeholder="Full address..."
                      value={formData.university_address||''} onChange={e=>f('university_address',e.target.value)}/>
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label"><FaPhone style={{marginRight:6}}/>Contact Phone</label>
                      <input type="text" className="form-input" placeholder="+880-..."
                        value={formData.contact_phone||''} onChange={e=>f('contact_phone',e.target.value)}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label"><FaEnvelope style={{marginRight:6}}/>Contact Email</label>
                      <input type="email" className="form-input" placeholder="medical@university.edu"
                        value={formData.contact_email||''} onChange={e=>f('contact_email',e.target.value)}/>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary"><FaCheck /> Save Settings</button>
                </form>
              </div>


              {/* ── Landing Page Editor ── */}
              <div className="card" style={{marginBottom:20}}>
                <h3 style={{fontSize:16,fontWeight:700,marginBottom:6,display:'flex',alignItems:'center',gap:8}}>
                  🌐 Landing Page Editor
                </h3>
                <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:18}}>
                  Control what visitors see on your public homepage before they log in.
                </p>

                {/* Hero Background Image */}
                <div style={{marginBottom:20}}>
                  <label className="form-label">Hero Background Image</label>
                  <div style={{
                    position:'relative', borderRadius:14, overflow:'hidden',
                    height:160, background:'linear-gradient(135deg,#667eea,#764ba2)',
                    marginBottom:10, cursor:'pointer'
                  }} onClick={() => heroRef.current?.click()}>
                    {heroPreview && <img src={heroPreview} alt="hero" style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
                    <div style={{
                      position:'absolute',inset:0,display:'flex',alignItems:'center',
                      justifyContent:'center',flexDirection:'column',gap:8,
                      background:'rgba(0,0,0,0.35)',color:'white'
                    }}>
                      <FaUpload style={{fontSize:24}}/>
                      <span style={{fontSize:13,fontWeight:600}}>{heroUploading?'Uploading...':'Click to change hero image'}</span>
                    </div>
                  </div>
                  <input ref={heroRef} type="file" accept="image/*" style={{display:'none'}} onChange={uploadHeroImage}/>
                  <p style={{fontSize:12,color:'var(--text-secondary)'}}>Recommended: 1920×1080px landscape photo. This appears as the main background behind your hero text.</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Hero Title</label>
                  <input type="text" className="form-input"
                    placeholder="e.g. Excellence in University Healthcare"
                    value={landingForm.hero_title||''} onChange={e=>setLandingForm(p=>({...p,hero_title:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Hero Subtitle</label>
                  <textarea className="form-textarea" rows={3}
                    placeholder="Brief description shown under the title..."
                    value={landingForm.hero_subtitle||''} onChange={e=>setLandingForm(p=>({...p,hero_subtitle:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">About Section Text</label>
                  <textarea className="form-textarea" rows={4}
                    placeholder="Describe your medical center..."
                    value={landingForm.about_text||''} onChange={e=>setLandingForm(p=>({...p,about_text:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Announcement Bar (leave blank to hide)</label>
                  <input type="text" className="form-input"
                    placeholder="e.g. 📢 Vaccination drive ongoing! Walk-ins welcome."
                    value={landingForm.announcement||''} onChange={e=>setLandingForm(p=>({...p,announcement:e.target.value}))}/>
                </div>

                {/* Toggle Sections */}
                <div style={{marginBottom:20}}>
                  <label className="form-label">Visible Sections</label>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    {[
                      {key:'show_stats',label:'📊 Live Stats Bar'},
                      {key:'show_doctors',label:'👨‍⚕️ Our Doctors'},
                      {key:'show_campaigns',label:'📢 Campaigns'},
                      {key:'show_contact',label:'📞 Contact Form'},
                    ].map(item => (
                      <label key={item.key} style={{
                        display:'flex',alignItems:'center',gap:10,
                        padding:'12px 14px',borderRadius:10,cursor:'pointer',
                        border:'1px solid var(--border)',background:'var(--bg)',
                        fontWeight:500,fontSize:13
                      }}>
                        <input type="checkbox"
                          checked={landingForm[item.key] !== false}
                          onChange={e=>setLandingForm(p=>({...p,[item.key]:e.target.checked}))}
                          style={{width:16,height:16,accentColor:'var(--primary)'}}/>
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{display:'flex',gap:10}}>
                  <button className="btn btn-primary" onClick={saveLanding}><FaCheck /> Save Landing Page</button>
                  <a href="/" target="_blank" rel="noreferrer" className="btn btn-outline" style={{textDecoration:'none'}}>
                    👁️ Preview
                  </a>
                </div>
              </div>

              {/* ── Emergency Contacts Manager ── */}
              <div className="card" style={{marginBottom:20}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                  <div>
                    <h3 style={{fontSize:16,fontWeight:700,margin:0,display:'flex',alignItems:'center',gap:8}}>
                      🚨 Emergency Contacts
                    </h3>
                    <p style={{fontSize:12,color:'var(--text-secondary)',marginTop:4}}>
                      These contacts appear on the Emergency page for all users.
                    </p>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => {
                    setShowModal('emergencyContact');
                    setFormData({label:'',number:'',icon:'🏥',color:'#667eea',display_order:0,_isNew:true});
                  }}>
                    <FaPlus /> Add Contact
                  </button>
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {emergencyContacts.map((c,idx) => (
                    <div key={c.contact_id} style={{
                      display:'flex',alignItems:'center',gap:14,
                      padding:'12px 16px',borderRadius:12,
                      border:'1px solid var(--border)',background:'var(--bg)'
                    }}>
                      <div style={{
                        width:44,height:44,borderRadius:10,flexShrink:0,
                        background:c.color+'22',display:'flex',alignItems:'center',
                        justifyContent:'center',fontSize:22,border:`1px solid ${c.color}44`
                      }}>{c.icon}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:14}}>{c.label}</div>
                        <div style={{fontSize:13,color:c.color,fontWeight:600,marginTop:2}}>{c.number}</div>
                      </div>
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        <button className="btn btn-sm btn-info" onClick={() => {
                          setFormData({...c,_isNew:false});
                          setShowModal('emergencyContact');
                        }} title="Edit"><FaEdit /></button>
                        <button className="btn btn-sm btn-danger" onClick={async() => {
                          if(!window.confirm('Delete this contact?')) return;
                          try {
                            await api.delete('/api/admin/emergency/contacts/'+c.contact_id);
                            toast.success('Contact deleted');
                            loadEmergencyContacts();
                          } catch { toast.error('Failed'); }
                        }} title="Delete"><FaTrash /></button>
                      </div>
                    </div>
                  ))}
                  {emergencyContacts.length===0 && (
                    <div style={{textAlign:'center',padding:24,color:'var(--text-secondary)',fontSize:13}}>
                      No emergency contacts yet. Add one above.
                    </div>
                  )}
                </div>
              </div>

              {/* ── Pharmacy Quick Stock Update ── */}
              <div className="card">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                  <div>
                    <h3 style={{fontSize:16,fontWeight:700,margin:0,display:'flex',alignItems:'center',gap:8}}>
                      💊 Pharmacy — Quick Edit
                    </h3>
                    <p style={{fontSize:12,color:'var(--text-secondary)',marginTop:4}}>
                      Update medicine names, prices, quantity and details directly here.
                    </p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => {
                    setShowModal('medicine');
                    setFormData({});
                  }}>
                    <FaPlus /> Add Medicine
                  </button>
                </div>

                <div style={{overflowX:'auto',borderRadius:12,border:'1px solid var(--border)'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead>
                      <tr>
                        {['Generic Name','Brand','Category','Stock','Min','Price ($)','Unit','Actions'].map(h => (
                          <th key={h} style={{
                            background:'linear-gradient(135deg,#667eea,#764ba2)',
                            color:'white',fontWeight:600,fontSize:12,
                            padding:'11px 14px',textAlign:'left',whiteSpace:'nowrap'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.map(m => {
                        const isRowEditing = settingsEditMed === m.medicine_id;
                        return (
                          <tr key={m.medicine_id} style={{background: isRowEditing ? 'rgba(102,126,234,0.05)' : 'transparent'}}>
                            {isRowEditing ? (
                              <>
                                <td style={{padding:'8px 10px'}}><input type="text" className="form-input" style={{padding:'5px 8px',fontSize:12,minWidth:120}} value={settingsEditForm.generic_name||''} onChange={e=>setSettingsEditForm(p=>({...p,generic_name:e.target.value}))}/></td>
                                <td style={{padding:'8px 10px'}}><input type="text" className="form-input" style={{padding:'5px 8px',fontSize:12,minWidth:100}} value={settingsEditForm.brand_name||''} onChange={e=>setSettingsEditForm(p=>({...p,brand_name:e.target.value}))}/></td>
                                <td style={{padding:'8px 10px'}}><input type="text" className="form-input" style={{padding:'5px 8px',fontSize:12,minWidth:100}} value={settingsEditForm.category||''} onChange={e=>setSettingsEditForm(p=>({...p,category:e.target.value}))}/></td>
                                <td style={{padding:'8px 10px'}}><input type="number" className="form-input" style={{padding:'5px 8px',fontSize:12,width:70}} value={settingsEditForm.current_stock||0} onChange={e=>setSettingsEditForm(p=>({...p,current_stock:e.target.value}))}/></td>
                                <td style={{padding:'8px 10px'}}><input type="number" className="form-input" style={{padding:'5px 8px',fontSize:12,width:60}} value={settingsEditForm.minimum_stock||0} onChange={e=>setSettingsEditForm(p=>({...p,minimum_stock:e.target.value}))}/></td>
                                <td style={{padding:'8px 10px'}}><input type="number" step="0.01" className="form-input" style={{padding:'5px 8px',fontSize:12,width:70}} value={settingsEditForm.selling_price||0} onChange={e=>setSettingsEditForm(p=>({...p,selling_price:e.target.value}))}/></td>
                                <td style={{padding:'8px 10px'}}><select className="form-select" style={{padding:'5px 8px',fontSize:12}} value={settingsEditForm.unit||'tablets'} onChange={e=>setSettingsEditForm(p=>({...p,unit:e.target.value}))}>
                                  <option value="tablets">tablets</option>
                                  <option value="capsules">capsules</option>
                                  <option value="ml">ml</option>
                                  <option value="mg">mg</option>
                                  <option value="units">units</option>
                                </select></td>
                                <td style={{padding:'8px 10px'}}>
                                  <div style={{display:'flex',gap:4}}>
                                    <button className="btn btn-sm btn-success" onClick={async()=>{
                                      try {
                                        await api.put('/api/admin/medicines/'+m.medicine_id, settingsEditForm);
                                        toast.success('Updated!'); setSettingsEditMed(null); loadTab('settings');
                                      } catch { toast.error('Failed'); }
                                    }}><FaCheck /></button>
                                    <button className="btn btn-sm btn-danger" onClick={()=>setSettingsEditMed(null)}><FaTimes /></button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{padding:'10px 14px',fontWeight:600,fontSize:13}}>{m.generic_name}</td>
                                <td style={{padding:'10px 14px',fontSize:13}}>{m.brand_name||'—'}</td>
                                <td style={{padding:'10px 14px',fontSize:13}}>{m.category||'—'}</td>
                                <td style={{padding:'10px 14px'}}>
                                  <span style={{
                                    padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,
                                    background: m.current_stock===0?'rgba(239,68,68,0.12)':m.current_stock<m.minimum_stock?'rgba(245,158,11,0.12)':'rgba(16,185,129,0.12)',
                                    color: m.current_stock===0?'#dc2626':m.current_stock<m.minimum_stock?'#d97706':'#059669'
                                  }}>{m.current_stock}</span>
                                </td>
                                <td style={{padding:'10px 14px',fontSize:13}}>{m.minimum_stock}</td>
                                <td style={{padding:'10px 14px',fontWeight:600,color:'var(--primary)',fontSize:13}}>${Number(m.selling_price).toFixed(2)}</td>
                                <td style={{padding:'10px 14px',fontSize:13}}>{m.unit}</td>
                                <td style={{padding:'10px 14px'}}>
                                  <div style={{display:'flex',gap:4}}>
                                    <button className="btn btn-sm btn-info" onClick={()=>{
                                      setSettingsEditMed(m.medicine_id);
                                      setSettingsEditForm({...m});
                                    }} title="Edit"><FaEdit /></button>
                                    <button className="btn btn-sm btn-danger" onClick={()=>deleteMedicine(m.medicine_id)} title="Delete"><FaTrash /></button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </>
      )}

      {/* ════ MODALS ════ */}

      {/* EDIT USER MODAL */}
      {showModal==='editUser' && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(null)}>
          <div className="modal" style={{maxWidth:580}}>
            <div className="modal-header">
              <h2 className="modal-title">✏️ Edit User — {formData.full_name}</h2>
              <button className="modal-close" onClick={()=>setShowModal(null)}><FaTimes /></button>
            </div>
            <div style={{marginBottom:12,padding:'8px 12px',background:'rgba(102,126,234,0.08)',borderRadius:8,fontSize:12,color:'var(--text-secondary)'}}>
              Editing: <strong>{formData.email}</strong> · Role: <strong>{formData.role}</strong>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={formData.full_name||''} onChange={e=>f('full_name',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Email</label>
                <input type="email" className="form-input" value={formData.email||''} onChange={e=>f('email',e.target.value)}/></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Phone</label>
                <input type="text" className="form-input" value={formData.phone||''} onChange={e=>f('phone',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Role</label>
                <select className="form-select" value={formData.role||''} onChange={e=>f('role',e.target.value)}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="staff">Staff</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Department</label>
                <input type="text" className="form-input" value={formData.department||''} onChange={e=>f('department',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Student/Staff ID</label>
                <input type="text" className="form-input" value={formData.student_id||''} onChange={e=>f('student_id',e.target.value)}/></div>
            </div>
            <div className="form-group"><label className="form-label">New Password <span style={{color:'var(--text-secondary)',fontWeight:400}}>(leave blank to keep current)</span></label>
              <input type="password" className="form-input" placeholder="••••••••" value={formData.password||''} onChange={e=>f('password',e.target.value)}/></div>

            {formData.role==='doctor' && (
              <div style={{padding:14,background:'var(--bg)',borderRadius:10,border:'1px solid var(--border)',marginBottom:12}}>
                <p style={{fontSize:13,fontWeight:600,marginBottom:10,color:'var(--primary)'}}>🩺 Doctor Profile</p>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Specialization</label>
                    <input type="text" className="form-input" value={formData.doctor_profile?.specialization||''} onChange={e=>fd('specialization',e.target.value)}/></div>
                  <div className="form-group"><label className="form-label">Experience (yrs)</label>
                    <input type="number" className="form-input" value={formData.doctor_profile?.experience_years||''} onChange={e=>fd('experience_years',e.target.value)}/></div>
                </div>
                <div className="form-group"><label className="form-label">Qualifications</label>
                  <input type="text" className="form-input" value={formData.doctor_profile?.qualifications||''} onChange={e=>fd('qualifications',e.target.value)}/></div>
                <div className="form-group"><label className="form-label">Consultation Fee ($)</label>
                  <input type="number" className="form-input" value={formData.doctor_profile?.consultation_fee||''} onChange={e=>fd('consultation_fee',e.target.value)}/></div>
              </div>
            )}

            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={()=>setShowModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveUser}><FaCheck /> Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MEDICINE MODAL */}
      {showModal==='medicine' && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">💊 Add Medicine</h2>
              <button className="modal-close" onClick={()=>setShowModal(null)}><FaTimes /></button>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Generic Name *</label>
                <input type="text" className="form-input" value={formData.generic_name||''} onChange={e=>f('generic_name',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Brand Name</label>
                <input type="text" className="form-input" value={formData.brand_name||''} onChange={e=>f('brand_name',e.target.value)}/></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Category</label>
                <input type="text" className="form-input" value={formData.category||''} onChange={e=>f('category',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Unit</label>
                <select className="form-select" value={formData.unit||'tablets'} onChange={e=>f('unit',e.target.value)}>
                  <option value="tablets">Tablets</option><option value="capsules">Capsules</option>
                  <option value="ml">ml</option><option value="mg">mg</option><option value="units">Units</option>
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Current Stock</label>
                <input type="number" className="form-input" value={formData.current_stock||0} onChange={e=>f('current_stock',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Min Stock Alert</label>
                <input type="number" className="form-input" value={formData.minimum_stock||10} onChange={e=>f('minimum_stock',e.target.value)}/></div>
            </div>
            <div className="form-group"><label className="form-label">Price ($)</label>
              <input type="number" step="0.01" className="form-input" value={formData.selling_price||0} onChange={e=>f('selling_price',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Description</label>
              <textarea className="form-textarea" rows={2} value={formData.description||''} onChange={e=>f('description',e.target.value)}/></div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={()=>setShowModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={addMedicine}><FaPlus /> Add Medicine</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT CAMPAIGN MODAL */}
      {showModal==='campaign' && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{formData.campaign_id ? '✏️ Edit Campaign' : '📢 Create Campaign'}</h2>
              <button className="modal-close" onClick={()=>setShowModal(null)}><FaTimes /></button>
            </div>
            <div className="form-group"><label className="form-label">Title *</label>
              <input type="text" className="form-input" value={formData.title||''} onChange={e=>f('title',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Description</label>
              <textarea className="form-textarea" rows={3} value={formData.description||''} onChange={e=>f('description',e.target.value)}/></div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Type</label>
                <select className="form-select" value={formData.campaign_type||''} onChange={e=>f('campaign_type',e.target.value)}>
                  <option value="">Select type</option>
                  <option value="Vaccination">Vaccination</option>
                  <option value="Health Screening">Health Screening</option>
                  <option value="Awareness">Awareness</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Mental Health">Mental Health</option>
                  <option value="Dental">Dental</option>
                  <option value="Blood Donation">Blood Donation</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Location</label>
                <input type="text" className="form-input" value={formData.location||''} onChange={e=>f('location',e.target.value)}/></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={formData.start_date||''} onChange={e=>f('start_date',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">End Date</label>
                <input type="date" className="form-input" value={formData.end_date||''} onChange={e=>f('end_date',e.target.value)}/></div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={()=>setShowModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveCampaign}>
                {formData.campaign_id ? <><FaCheck /> Update</> : <><FaPlus /> Create</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD DOCTOR MODAL */}
      {showModal==='doctor' && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(null)}>
          <div className="modal" style={{maxWidth:600}}>
            <div className="modal-header">
              <h2 className="modal-title">🩺 Create Doctor Account</h2>
              <button className="modal-close" onClick={()=>setShowModal(null)}><FaTimes /></button>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Full Name *</label><input type="text" className="form-input" value={formData.full_name||''} onChange={e=>f('full_name',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Username *</label><input type="text" className="form-input" value={formData.username||''} onChange={e=>f('username',e.target.value)}/></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-input" value={formData.email||''} onChange={e=>f('email',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Password *</label><input type="password" className="form-input" value={formData.password||''} onChange={e=>f('password',e.target.value)}/></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Phone</label><input type="text" className="form-input" value={formData.phone||''} onChange={e=>f('phone',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Specialization</label><input type="text" className="form-input" value={formData.specialization||''} onChange={e=>f('specialization',e.target.value)}/></div>
            </div>
            <div className="form-group"><label className="form-label">Qualifications</label><input type="text" className="form-input" placeholder="MBBS, MD..." value={formData.qualifications||''} onChange={e=>f('qualifications',e.target.value)}/></div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Experience (yrs)</label><input type="number" className="form-input" value={formData.experience_years||0} onChange={e=>f('experience_years',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Consultation Fee ($)</label><input type="number" className="form-input" value={formData.consultation_fee||0} onChange={e=>f('consultation_fee',e.target.value)}/></div>
            </div>
            <div className="form-group"><label className="form-label">Bio</label><textarea className="form-textarea" rows={2} value={formData.bio||''} onChange={e=>f('bio',e.target.value)}/></div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={()=>setShowModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={createDoctor}><FaUserMd /> Create Doctor</button>
            </div>
          </div>
        </div>
      )}
      {/* ADD/EDIT BANNER MODAL */}
      {showModal==='banner' && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{formData.banner_id ? '✏️ Edit Banner' : '📢 Add Banner'}</h2>
              <button className="modal-close" onClick={()=>setShowModal(null)}><FaTimes /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Message *</label>
              <textarea className="form-textarea" rows={3} placeholder="e.g., 💉 Vaccination drive ongoing! Walk-ins welcome."
                value={formData.message||''} onChange={e=>f('message',e.target.value)}/>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={formData.banner_type||'info'} onChange={e=>f('banner_type',e.target.value)}>
                  <option value="info">ℹ️ Info</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="success">✅ Success</option>
                  <option value="campaign">📢 Campaign</option>
                  <option value="health_tip">💡 Health Tip</option>
                  <option value="emergency">🚨 Emergency</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Link (optional)</label>
                <input type="text" className="form-input" placeholder="/campaigns"
                  value={formData.link||''} onChange={e=>f('link',e.target.value)}/>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Display Order</label>
                <input type="number" className="form-input" value={formData.display_order||0} onChange={e=>f('display_order',e.target.value)}/>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={formData.is_active===false?'false':'true'} onChange={e=>f('is_active',e.target.value==='true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={()=>setShowModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={async()=>{
                if(!formData.message) return toast.error('Message required');
                try {
                  if(formData.banner_id) { await api.put('/api/admin/banners/'+formData.banner_id,formData); toast.success('Banner updated!'); }
                  else { await api.post('/api/admin/banners',formData); toast.success('Banner created!'); }
                  setShowModal(null); setFormData({}); loadTab('banners');
                } catch(e) { toast.error(e.response?.data?.message||'Failed'); }
              }}>
                {formData.banner_id ? <><FaCheck/> Update</> : <><FaPlus/> Create</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW COMPLAINT MODAL */}
      {showModal==='complaint' && formData._type==='complaint' && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(null)}>
          <div className="modal" style={{maxWidth:560}}>
            <div className="modal-header">
              <h2 className="modal-title">🔍 Review Complaint #{formData.complaint_id}</h2>
              <button className="modal-close" onClick={()=>setShowModal(null)}><FaTimes /></button>
            </div>
            <div style={{background:'var(--bg)',borderRadius:12,padding:14,marginBottom:16,fontSize:13}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div><span style={{color:'var(--text-secondary)'}}>Patient: </span><strong>{formData.patient_name}</strong></div>
                <div><span style={{color:'var(--text-secondary)'}}>Doctor: </span><strong>Dr. {formData.doctor_name}</strong></div>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Subject</label>
              <div style={{padding:'10px 14px',background:'var(--bg)',borderRadius:10,fontSize:14,fontWeight:600}}>{formData.subject}</div></div>
            <div className="form-group"><label className="form-label">Description</label>
              <div style={{padding:'10px 14px',background:'var(--bg)',borderRadius:10,fontSize:13,lineHeight:1.6,maxHeight:120,overflowY:'auto'}}>{formData.description}</div></div>
            {formData.proof_url && (
              <div className="form-group"><label className="form-label">Proof</label>
                <a href={"http://localhost:5000"+formData.proof_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">📎 View Proof</a>
              </div>
            )}
            <div className="form-group"><label className="form-label">Update Status</label>
              <select className="form-select" value={formData.status||'Pending'} onChange={e=>f('status',e.target.value)}>
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Resolved">Resolved</option>
                <option value="Dismissed">Dismissed</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Admin Notes (visible to patient)</label>
              <textarea className="form-textarea" rows={3} placeholder="Outcome or action taken..."
                value={formData.admin_notes||''} onChange={e=>f('admin_notes',e.target.value)}/></div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={()=>setShowModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={async()=>{
                try {
                  await api.put('/api/admin/complaints/'+formData.complaint_id,{status:formData.status,admin_notes:formData.admin_notes});
                  toast.success('Complaint updated!'); setShowModal(null); setFormData({}); loadTab('complaints');
                } catch { toast.error('Failed'); }
              }}><FaCheck/> Save Decision</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMERGENCY CONTACT MODAL ── */}
      {showModal==='emergencyContact' && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(null)}>
          <div className="modal" style={{maxWidth:480}}>
            <div className="modal-header">
              <h2 className="modal-title">{formData._isNew ? '➕ Add Emergency Contact' : '✏️ Edit Emergency Contact'}</h2>
              <button className="modal-close" onClick={()=>setShowModal(null)}><FaTimes /></button>
            </div>

            <div className="form-group">
              <label className="form-label">Label *</label>
              <input type="text" className="form-input" placeholder="e.g., Campus Medical Center"
                value={formData.label||''} onChange={e=>f('label',e.target.value)}/>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input type="text" className="form-input" placeholder="+1-555-0100"
                value={formData.number||''} onChange={e=>f('number',e.target.value)}/>
            </div>

            <div className="form-group">
              <label className="form-label">Icon</label>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:4}}>
                {['🏥','🚑','🛡️','🧠','🚒','👮','💊','🩺','📞','🏫','🔥','⚕️'].map(ic => (
                  <button key={ic} type="button" onClick={()=>f('icon',ic)} style={{
                    width:40,height:40,borderRadius:8,fontSize:20,cursor:'pointer',
                    border: formData.icon===ic ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: formData.icon===ic ? 'rgba(102,126,234,0.12)' : 'var(--bg)',
                    transition:'all 0.15s'
                  }}>{ic}</button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Color</label>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <input type="color" value={formData.color||'#667eea'}
                  onChange={e=>f('color',e.target.value)}
                  style={{width:48,height:40,border:'1px solid var(--border)',borderRadius:8,cursor:'pointer',padding:3}}/>
                <div style={{
                  flex:1,padding:'10px 14px',borderRadius:8,
                  background:(formData.color||'#667eea')+'22',
                  border:`1px solid ${formData.color||'#667eea'}44`,
                  display:'flex',alignItems:'center',gap:10
                }}>
                  <span style={{fontSize:20}}>{formData.icon||'🏥'}</span>
                  <div>
                    <div style={{fontWeight:600,fontSize:13}}>{formData.label||'Contact Name'}</div>
                    <div style={{fontSize:12,color:formData.color||'#667eea',fontWeight:600}}>{formData.number||'+1-555-0000'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Display Order (lower = first)</label>
              <input type="number" className="form-input" value={formData.display_order||0}
                onChange={e=>f('display_order',parseInt(e.target.value))}/>
            </div>

            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={()=>setShowModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={saveEmergencyContact}>
                <FaCheck /> {formData._isNew ? 'Add Contact' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;