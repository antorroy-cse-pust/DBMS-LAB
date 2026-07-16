import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaUserMd, FaCalendarAlt, FaPlus, FaPills, FaExclamationTriangle,
  FaUsers, FaShieldAlt, FaCheckCircle, FaClipboardList, FaHeartbeat,
  FaStethoscope, FaBullhorn, FaChevronRight, FaArrowUp
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const StatCard = ({ icon, label, value, color, gradient, trend }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{background: gradient || color}}>
      {icon}
    </div>
    <div className="stat-info">
      <h3>{value}</h3>
      <p>{label}</p>
      {trend && (
        <div style={{display:'flex',alignItems:'center',gap:4,marginTop:4,fontSize:11,color:'#10b981',fontWeight:600}}>
          <FaArrowUp style={{fontSize:9}}/> {trend}
        </div>
      )}
    </div>
  </div>
);

const QuickCard = ({ to, icon, label, desc, gradient, badge }) => (
  <Link to={to} style={{textDecoration:'none'}}>
    <div style={{
      background:'var(--bg-card)', borderRadius:14, padding:'18px 20px',
      border:'1px solid var(--border)', cursor:'pointer',
      display:'flex', alignItems:'center', gap:14,
      transition:'all 0.25s', boxShadow:'var(--shadow)',
    }}
    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='var(--shadow-lg)';}}
    onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='var(--shadow)';}}>
      <div style={{
        width:48, height:48, borderRadius:12, flexShrink:0,
        background: gradient, display:'flex', alignItems:'center',
        justifyContent:'center', color:'white', fontSize:20,
        boxShadow:`0 4px 14px ${gradient.includes('ef4444')?'rgba(239,68,68,0.35)':'rgba(102,126,234,0.35)'}`
      }}>{icon}</div>
      <div style={{flex:1}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <h3 style={{fontSize:14,fontWeight:700,color:'var(--text)',margin:0}}>{label}</h3>
          {badge && <span style={{background:'rgba(239,68,68,0.12)',color:'#dc2626',borderRadius:20,padding:'1px 7px',fontSize:10,fontWeight:700}}>{badge}</span>}
        </div>
        <p style={{fontSize:12,color:'var(--text-secondary)',marginTop:2}}>{desc}</p>
      </div>
      <FaChevronRight style={{color:'var(--text-secondary)',fontSize:12,flexShrink:0}}/>
    </div>
  </Link>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, apptRes, campRes] = await Promise.all([
        api.get('/api/dashboard/stats'),
        api.get('/api/appointments'),
        api.get('/api/campaigns'),
      ]);
      setStats(statsRes.data.data || {});
      setRecentAppointments((apptRes.data.data || []).slice(0, 4));
      setCampaigns((campRes.data.data || []).filter(c=>c.is_active).slice(0, 3));
    } catch {}
    finally { setLoading(false); }
  };

  const getStatusBadge = (status) => {
    const m = {Pending:'badge-pending',Confirmed:'badge-confirmed',Completed:'badge-completed',Cancelled:'badge-cancelled'};
    return <span className={`badge ${m[status]||''}`}>{status}</span>;
  };

  const getRoleEmoji = () => user?.role==='admin'?'👑':user?.role==='doctor'?'🩺':'🎓';

  const adminStats = [
    {label:'Total Users',value:stats.total_users||0,icon:<FaUsers/>,gradient:'linear-gradient(135deg,#667eea,#764ba2)'},
    {label:'Doctors',value:stats.total_doctors||0,icon:<FaUserMd/>,gradient:'linear-gradient(135deg,#3b82f6,#2563eb)'},
    {label:"Today's Appointments",value:stats.today_appointments||0,icon:<FaCalendarAlt/>,gradient:'linear-gradient(135deg,#10b981,#059669)'},
    {label:'Active Emergencies',value:stats.active_emergencies||0,icon:<FaExclamationTriangle/>,gradient:'linear-gradient(135deg,#ef4444,#dc2626)'},
    {label:'Low Stock Medicines',value:stats.low_stock_medicines||0,icon:<FaPills/>,gradient:'linear-gradient(135deg,#f59e0b,#d97706)'},
    {label:'Active Campaigns',value:stats.active_campaigns||0,icon:<FaBullhorn/>,gradient:'linear-gradient(135deg,#8b5cf6,#6d28d9)'},
  ];
  const doctorStats = [
    {label:"Today",value:stats.today||0,icon:<FaCalendarAlt/>,gradient:'linear-gradient(135deg,#667eea,#764ba2)'},
    {label:'Pending',value:stats.pending||0,icon:<FaClipboardList/>,gradient:'linear-gradient(135deg,#f59e0b,#d97706)'},
    {label:'Confirmed',value:stats.confirmed||0,icon:<FaCheckCircle/>,gradient:'linear-gradient(135deg,#3b82f6,#2563eb)'},
    {label:'Completed',value:stats.completed||0,icon:<FaStethoscope/>,gradient:'linear-gradient(135deg,#10b981,#059669)'},
    {label:'Total Patients',value:stats.total_patients||0,icon:<FaUsers/>,gradient:'linear-gradient(135deg,#8b5cf6,#6d28d9)'},
  ];
  const userStats = [
    {label:'My Appointments',value:stats.my_appointments||0,icon:<FaCalendarAlt/>,gradient:'linear-gradient(135deg,#667eea,#764ba2)'},
    {label:'Pending',value:stats.pending||0,icon:<FaClipboardList/>,gradient:'linear-gradient(135deg,#f59e0b,#d97706)'},
    {label:'Upcoming',value:stats.upcoming||0,icon:<FaCheckCircle/>,gradient:'linear-gradient(135deg,#10b981,#059669)'},
    {label:'Available Doctors',value:stats.total_doctors||0,icon:<FaUserMd/>,gradient:'linear-gradient(135deg,#3b82f6,#2563eb)'},
    {label:'Active Campaigns',value:stats.active_campaigns||0,icon:<FaBullhorn/>,gradient:'linear-gradient(135deg,#8b5cf6,#6d28d9)'},
  ];

  const statItems = user?.role==='admin'?adminStats:user?.role==='doctor'?doctorStats:userStats;

  const adminActions = [
    {to:'/app/admin',icon:<FaShieldAlt/>,label:'Admin Panel',desc:'Manage users, pharmacy & settings',gradient:'linear-gradient(135deg,#667eea,#764ba2)',badge:stats.active_emergencies>0?`${stats.active_emergencies} alerts`:null},
    {to:'/app/appointments',icon:<FaCalendarAlt/>,label:'All Appointments',desc:'View and manage all bookings',gradient:'linear-gradient(135deg,#10b981,#059669)',badge:stats.pending_appointments>0?`${stats.pending_appointments} pending`:null},
  ];
  const doctorActions = [
    {to:'/app/doctor',icon:<FaStethoscope/>,label:'Doctor Panel',desc:'Appointments, patients & prescriptions',gradient:'linear-gradient(135deg,#667eea,#764ba2)',badge:stats.pending>0?`${stats.pending} new`:null},
    {to:'/app/pharmacy',icon:<FaPills/>,label:'Pharmacy',desc:'View medicines and stock',gradient:'linear-gradient(135deg,#10b981,#059669)'},
    {to:'/app/campaigns',icon:<FaBullhorn/>,label:'Campaigns',desc:'Active health campaigns',gradient:'linear-gradient(135deg,#8b5cf6,#6d28d9)'},
  ];
  const userActions = [
    {to:'/app/book-appointment',icon:<FaPlus/>,label:'Book Appointment',desc:'Schedule with a doctor',gradient:'linear-gradient(135deg,#667eea,#764ba2)'},
    {to:'/app/appointments',icon:<FaCalendarAlt/>,label:'My Appointments',desc:'View all your bookings',gradient:'linear-gradient(135deg,#3b82f6,#2563eb)'},
    {to:'/app/doctors',icon:<FaUserMd/>,label:'Our Doctors',desc:'Find the right specialist',gradient:'linear-gradient(135deg,#10b981,#059669)'},
    {to:'/app/emergency',icon:<FaExclamationTriangle/>,label:'Emergency Alert',desc:'Get immediate medical help',gradient:'linear-gradient(135deg,#ef4444,#dc2626)'},
    {to:'/app/pharmacy',icon:<FaPills/>,label:'Pharmacy',desc:'View available medicines',gradient:'linear-gradient(135deg,#f59e0b,#d97706)'},
    {to:'/app/campaigns',icon:<FaBullhorn/>,label:'Campaigns',desc:'Active health programs',gradient:'linear-gradient(135deg,#8b5cf6,#6d28d9)'},
  ];
  const quickActions = user?.role==='admin'?adminActions:user?.role==='doctor'?doctorActions:userActions;

  if (loading) return <div className="loading-spinner"><div className="spinner"/></div>;

  return (
    <div>
      {/* Header */}
      <div style={{
        background:'linear-gradient(135deg,#1a3c6e 0%,#2563eb 60%,#764ba2 100%)',
        borderRadius:16, padding:'26px 28px', marginBottom:24, color:'white',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexWrap:'wrap', gap:16, position:'relative', overflow:'hidden',
        boxShadow:'0 8px 32px rgba(37,99,235,0.35)'
      }}>
        <div style={{position:'absolute',top:-50,right:-50,width:200,height:200,background:'rgba(255,255,255,0.05)',borderRadius:'50%'}}/>
        <div style={{position:'absolute',bottom:-80,right:120,width:280,height:280,background:'rgba(255,255,255,0.03)',borderRadius:'50%'}}/>
        <div style={{position:'relative',zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{fontSize:42}}>{getRoleEmoji()}</div>
            <div>
              <h1 style={{fontSize:22,fontWeight:800,margin:0}}>Welcome back, {user?.full_name?.split(' ')[0]}!</h1>
              <p style={{opacity:0.82,margin:'5px 0 0',fontSize:13}}>
                {user?.role==='admin'?'System Administrator — Full control':''}
                {user?.role==='doctor'?`Dr. ${user?.full_name} — Medical Professional`:''}
                {user?.role==='student'?`Student · ${user?.department||'University'}  · ${user?.student_id||''}` :''}
                {user?.role==='teacher'?`Faculty · ${user?.department||'University'}`:''}
                {user?.role==='staff'?`Staff Member · ${user?.department||'University'}`:''}
              </p>
            </div>
          </div>
        </div>
        <div style={{position:'relative',zIndex:1,display:'flex',gap:10}}>
          {user?.role !== 'admin' && user?.role !== 'doctor' && (
            <Link to="/app/book-appointment" className="btn" style={{background:'rgba(255,255,255,0.2)',color:'white',border:'1px solid rgba(255,255,255,0.3)',backdropFilter:'blur(8px)'}}>
              <FaPlus /> Book Appointment
            </Link>
          )}
          {user?.role === 'doctor' && (
            <Link to="/app/doctor" className="btn" style={{background:'rgba(255,255,255,0.2)',color:'white',border:'1px solid rgba(255,255,255,0.3)'}}>
              <FaStethoscope /> Doctor Panel
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/app/admin" className="btn" style={{background:'rgba(255,255,255,0.2)',color:'white',border:'1px solid rgba(255,255,255,0.3)'}}>
              <FaShieldAlt /> Admin Panel
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statItems.map((s,i) => <StatCard key={i} {...s} />)}
      </div>

      <div style={{display:'grid', gridTemplateColumns: campaigns.length>0 ? '1fr 1fr' : '1fr', gap:24}}>
        {/* Quick Actions */}
        <div>
          <h2 className="section-title" style={{marginBottom:14}}>⚡ Quick Actions</h2>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {quickActions.map((a,i) => <QuickCard key={i} {...a} />)}
          </div>
        </div>

        {/* Right column */}
        <div style={{display:'flex',flexDirection:'column',gap:24}}>
          {/* Recent Appointments */}
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <h2 className="section-title" style={{margin:0}}>📅 Recent Appointments</h2>
              <Link to="/app/appointments" style={{fontSize:12,color:'var(--primary)',fontWeight:600,textDecoration:'none'}}>View All →</Link>
            </div>
            {recentAppointments.length === 0 ? (
              <div className="card" style={{textAlign:'center',padding:32}}>
                <div style={{fontSize:40,marginBottom:10,opacity:0.3}}>📅</div>
                <p style={{color:'var(--text-secondary)',fontSize:14,marginBottom:12}}>No appointments yet</p>
                {user?.role !== 'doctor' && user?.role !== 'admin' && (
                  <Link to="/app/book-appointment" className="btn btn-primary btn-sm">
                    <FaPlus /> Book Now
                  </Link>
                )}
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {recentAppointments.map(appt => {
                  const d = new Date(appt.appointment_date);
                  return (
                    <div key={appt.appointment_id} style={{
                      background:'var(--bg-card)', border:'1px solid var(--border)',
                      borderRadius:12, padding:'12px 16px',
                      display:'flex', alignItems:'center', gap:12,
                      transition:'all 0.2s', cursor:'pointer'
                    }}
                    onClick={() => navigate('/app/appointments')}
                    onMouseEnter={e=>{e.currentTarget.style.boxShadow='var(--shadow)';e.currentTarget.style.transform='translateY(-1px)';}}
                    onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}>
                      <div style={{
                        background:'var(--gradient)', borderRadius:10,
                        padding:'8px 10px', color:'white', textAlign:'center', flexShrink:0
                      }}>
                        <div style={{fontSize:16,fontWeight:800,lineHeight:1}}>{d.getDate()}</div>
                        <div style={{fontSize:9,opacity:0.88,textTransform:'uppercase'}}>{d.toLocaleString('default',{month:'short'})}</div>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,fontSize:13,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {user?.role==='doctor' ? appt.patient_name : (appt.doctor_name ? `Dr. ${appt.doctor_name}` : 'Doctor')}
                        </div>
                        <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:2}}>
                          {appt.appointment_time?.slice(0,5)} · {appt.meeting_type}
                        </div>
                      </div>
                      {getStatusBadge(appt.status)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Campaigns */}
          {campaigns.length > 0 && (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <h2 className="section-title" style={{margin:0}}>📢 Active Campaigns</h2>
                <Link to="/app/campaigns" style={{fontSize:12,color:'var(--primary)',fontWeight:600,textDecoration:'none'}}>View All →</Link>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {campaigns.map(c => (
                  <div key={c.campaign_id} style={{
                    background:'var(--bg-card)', border:'1px solid var(--border)',
                    borderRadius:12, padding:'12px 16px',
                    display:'flex', alignItems:'center', gap:12
                  }}>
                    <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,#8b5cf6,#6d28d9)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:16,flexShrink:0}}>
                      <FaBullhorn/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.title}</div>
                      <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:2}}>📍 {c.location||'University Campus'}</div>
                    </div>
                    <span style={{background:'rgba(16,185,129,0.12)',color:'#059669',borderRadius:20,padding:'2px 8px',fontSize:10,fontWeight:700,flexShrink:0}}>ACTIVE</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Health tip */}
      {user?.role !== 'admin' && (
        <div style={{
          marginTop:24, padding:'16px 20px', borderRadius:14,
          background:'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(5,150,105,0.08))',
          border:'1px solid rgba(16,185,129,0.2)',
          display:'flex', alignItems:'center', gap:14
        }}>
          <FaHeartbeat style={{fontSize:28,color:'#10b981',flexShrink:0}}/>
          <div style={{flex:1}}>
            <h3 style={{fontSize:14,fontWeight:700,color:'var(--text)',margin:'0 0 3px'}}>💡 Health Tip of the Day</h3>
            <p style={{fontSize:12,color:'var(--text-secondary)',margin:0}}>
              Regular health checkups catch problems early. Schedule your annual health screening today — prevention is better than cure!
            </p>
          </div>
          {user?.role !== 'doctor' && (
            <Link to="/app/book-appointment" className="btn btn-success btn-sm" style={{flexShrink:0}}>
              Book Now
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;