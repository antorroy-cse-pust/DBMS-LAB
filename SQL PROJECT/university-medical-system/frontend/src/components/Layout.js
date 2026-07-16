// import React, { useState, useEffect, useRef } from 'react';
// import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import {
//   FaHome, FaUserMd, FaCalendarAlt, FaPlus, FaPills,
//   FaExclamationTriangle, FaSignOutAlt, FaBars, FaTimes,
//   FaMoon, FaSun, FaUser, FaShieldAlt, FaStethoscope,
//   FaBell, FaBullhorn, FaChevronLeft, FaCheckCircle,
//   FaInfoCircle, FaTimesCircle, FaExclamationCircle,FaClipboardList
// } from 'react-icons/fa';
// import api from '../services/api';

// const Layout = () => {
//   const { user, logout, darkMode, toggleDarkMode } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [settings, setSettings] = useState(null);
//   const [showNotif, setShowNotif] = useState(false);
//   const [notifications, setNotifications] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [showWelcome, setShowWelcome] = useState(() => sessionStorage.getItem('welcomeDismissed') !== 'true');
//   const notifRef = useRef();

//   useEffect(() => {
//     api.get('/api/settings').then(r => setSettings(r.data.data)).catch(() => {});
//     fetchNotifications();
//     const interval = setInterval(fetchNotifications, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     const handler = (e) => {
//       if (notifRef.current && !notifRef.current.contains(e.target)) {
//         setShowNotif(false);
//       }
//     };
//     document.addEventListener('mousedown', handler);
//     return () => document.removeEventListener('mousedown', handler);
//   }, []);

//   const fetchNotifications = async () => {
//     try {
//       const endpoint = user?.role === 'admin' ? '/api/admin/notifications' : '/api/notifications';
//       const r = await api.get(endpoint);
//       if (user?.role === 'admin') {
//         const d = r.data.data;
//         const notifs = [];
//         if (d.counts.emergencies > 0) {
//           notifs.push({ id:'emg', type:'error', title:'Active Emergencies', message:`${d.counts.emergencies} emergency alert(s) need attention`, link:'/admin' });
//         }
//         if (d.counts.pending_appointments > 0) {
//           notifs.push({ id:'pend', type:'warning', title:'Pending Appointments', message:`${d.counts.pending_appointments} appointment(s) awaiting action`, link:'/appointments' });
//         }
//         if (d.counts.low_stock > 0) {
//           notifs.push({ id:'stock', type:'warning', title:'Low Medicine Stock', message:`${d.counts.low_stock} medicine(s) below minimum stock`, link:'/admin' });
//         }
//         d.emergency_alerts?.forEach(a => notifs.push({
//           id:`ea_${a.alert_id}`, type:'error',
//           title:`🚨 Emergency: ${a.patient_name}`,
//           message: a.symptoms, link:'/admin'
//         }));
//         setNotifications(notifs);
//         setUnreadCount(d.counts.total);
//       } else {
//         setNotifications(r.data.data || []);
//         setUnreadCount((r.data.data || []).length);
//       }
//     } catch {}
//   };

//   const handleLogout = () => { logout(); navigate('/'); };

//   const dismissWelcome = () => {
//     sessionStorage.setItem('welcomeDismissed', 'true');
//     setShowWelcome(false);
//   };

//   const canGoBack = location.pathname !== '/dashboard';

//   const getNavItems = () => {
//     if (user?.role === 'admin') return [
//       { to: '/dashboard', icon: <FaHome />, label: 'Dashboard' },
//       { to: '/admin', icon: <FaShieldAlt />, label: 'Admin Panel' },
//       { to: '/complaints', icon: <FaClipboardList />, label: 'Complaints' },
//       { to: '/profile', icon: <FaUser />, label: 'My Profile' },
//     ];
//     if (user?.role === 'doctor') return [
//       { to: '/dashboard', icon: <FaHome />, label: 'Dashboard' },
//       { to: '/doctor', icon: <FaStethoscope />, label: 'Doctor Panel' },
//       { to: '/pharmacy', icon: <FaPills />, label: 'Pharmacy' },
//       { to: '/campaigns', icon: <FaBullhorn />, label: 'Campaigns' },
//       { to: '/profile', icon: <FaUser />, label: 'Profile' },
//     ];
//     return [
//       { to: '/dashboard', icon: <FaHome />, label: 'Dashboard' },
//       { to: '/appointments', icon: <FaCalendarAlt />, label: 'Appointments' },
//       { to: '/book-appointment', icon: <FaPlus />, label: 'Book Appointment' },
//       { to: '/doctors', icon: <FaUserMd />, label: 'Doctors' },
//       { to: '/pharmacy', icon: <FaPills />, label: 'Pharmacy' },
//       { to: '/campaigns', icon: <FaBullhorn />, label: 'Campaigns' },
//       { to: '/emergency', icon: <FaExclamationTriangle />, label: 'Emergency', pulse: true },
//       { to: '/complaints', icon: <FaClipboardList />, label: 'Complaints' },
//       { to: '/profile', icon: <FaUser />, label: 'Profile' },
//     ];
//   };

//   const getRoleBadge = () => {
//     const badges = {
//       admin: { label: 'Admin', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)' },
//       doctor: { label: 'Doctor', color: '#3b82f6', bg: 'rgba(59,130,246,0.2)' },
//       student: { label: 'Student', color: '#10b981', bg: 'rgba(16,185,129,0.2)' },
//       teacher: { label: 'Teacher', color: '#8b5cf6', bg: 'rgba(139,92,246,0.2)' },
//       staff: { label: 'Staff', color: '#06b6d4', bg: 'rgba(6,182,212,0.2)' },
//     };
//     return badges[user?.role] || badges.student;
//   };

//   const getNotifIcon = (type) => {
//     if (type === 'error') return <FaTimesCircle style={{color:'#ef4444'}} />;
//     if (type === 'warning') return <FaExclamationCircle style={{color:'#f59e0b'}} />;
//     if (type === 'success') return <FaCheckCircle style={{color:'#10b981'}} />;
//     if (type === 'campaign') return <FaBullhorn style={{color:'#8b5cf6'}} />;
//     return <FaInfoCircle style={{color:'#3b82f6'}} />;
//   };

//   const badge = getRoleBadge();
//   const navItems = getNavItems();
//   const avatarLetter = user?.full_name?.[0]?.toUpperCase() || 'U';
//   const uniName = settings?.university_name || 'University Medical Center';
//   const uniLogo = settings?.university_logo ? `http://localhost:5000${settings.university_logo}` : null;

//   const getPageTitle = () => {
//     const map = {
//       '/dashboard': 'Dashboard', '/admin': 'Admin Panel',
//       '/doctor': 'Doctor Panel', '/appointments': 'Appointments',
//       '/book-appointment': 'Book Appointment', '/pharmacy': 'Pharmacy',
//       '/emergency': 'Emergency', '/doctors': 'Doctors',
//       '/profile': 'Profile', '/campaigns': 'Campaigns',
//     };
//     return map[location.pathname] || 'Dashboard';
//   };

//   return (
//     <div className={`layout-root ${darkMode ? 'dark' : ''}`}>
//       {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}

//       {/* ── SIDEBAR ── */}
//       <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'} ${mobileOpen ? 'mobile-visible' : ''}`}>
//         <div className="sidebar-header">
//           <div className="sidebar-logo">
//             {uniLogo
//               ? <img src={uniLogo} alt="logo" style={{width:36,height:36,borderRadius:8,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'} />
//               : <div className="logo-icon">🏥</div>
//             }
//             {sidebarOpen && (
//               <div className="logo-text">
//                 <span className="logo-name" title={uniName} style={{fontSize:11,lineHeight:1.2}}>
//                   {uniName.length > 22 ? uniName.slice(0,22)+'…' : uniName}
//                 </span>
//                 <span className="logo-sub">Medical System</span>
//               </div>
//             )}
//           </div>
//           <div className="sidebar-controls">
//             <button onClick={toggleDarkMode} className="icon-btn" title={darkMode?'Light mode':'Dark mode'}>
//               {darkMode ? <FaSun /> : <FaMoon />}
//             </button>
//             <button onClick={() => setSidebarOpen(p => !p)} className="icon-btn desktop-only"
//               title={sidebarOpen ? 'Collapse' : 'Expand'}>
//               {sidebarOpen ? <FaTimes /> : <FaBars />}
//             </button>
//             <button onClick={() => setMobileOpen(false)} className="icon-btn mobile-only"><FaTimes /></button>
//           </div>
//         </div>

//         <div className="sidebar-user">
//           <div className="user-avatar" onClick={() => navigate('/app/profile')} style={{cursor:'pointer'}}>
//             {user?.profile_image
//               ? <img src={`http://localhost:5000${user.profile_image}`} alt="avatar" />
//               : <span>{avatarLetter}</span>
//             }
//           </div>
//           {sidebarOpen && (
//             <div className="user-info">
//               <p className="user-name">{user?.full_name}</p>
//               <span className="role-badge" style={{color:badge.color, background:badge.bg}}>{badge.label}</span>
//             </div>
//           )}
//         </div>

//         <nav className="sidebar-nav">
//           {navItems.map(item => (
//             <NavLink key={item.to} to={item.to}
//               title={!sidebarOpen ? item.label : ''}
//               className={({isActive}) => `nav-item ${isActive?'active':''} ${item.pulse?'emergency-nav':''}`}
//               onClick={() => setMobileOpen(false)}>
//               <span className="nav-icon">{item.icon}</span>
//               {sidebarOpen && <span className="nav-label">{item.label}</span>}
//               {item.pulse && sidebarOpen && <span className="pulse-dot" />}
//             </NavLink>
//           ))}
//         </nav>

//         <button className="logout-btn" onClick={handleLogout}>
//           <FaSignOutAlt />
//           {sidebarOpen && <span>Logout</span>}
//         </button>
//       </aside>

//       {/* ── MAIN ── */}
//       <div className="main-wrapper">
//         {/* Top Bar */}
//         <header className="topbar">
//           <div className="topbar-left">
//             <button className="icon-btn mobile-only" onClick={() => setMobileOpen(true)}><FaBars /></button>
//             {!sidebarOpen && (
//               <button className="icon-btn desktop-only" onClick={() => setSidebarOpen(true)}
//                 style={{color:'var(--text-secondary)',marginRight:4}} title="Open sidebar">
//                 <FaBars />
//               </button>
//             )}
//             {canGoBack && (
//               <button onClick={() => navigate(-1)}
//                 style={{
//                   display:'flex', alignItems:'center', gap:6,
//                   background:'var(--bg)', border:'1px solid var(--border)',
//                   borderRadius:8, padding:'6px 12px', cursor:'pointer',
//                   color:'var(--text-secondary)', fontSize:13, fontWeight:500,
//                   marginRight:8, transition:'all 0.2s'
//                 }}
//                 onMouseEnter={e=>{e.target.style.color='var(--primary)';e.target.style.borderColor='var(--primary)';}}
//                 onMouseLeave={e=>{e.target.style.color='var(--text-secondary)';e.target.style.borderColor='var(--border)';}}
//               >
//                 <FaChevronLeft style={{fontSize:11}} /> Back
//               </button>
//             )}
//             <div>
//               <h2 style={{fontSize:17,fontWeight:700,color:'var(--text)'}}>{getPageTitle()}</h2>
//               <p style={{fontSize:11,color:'var(--text-secondary)'}}>
//                 {new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
//               </p>
//             </div>
//           </div>
//           <div className="topbar-right" style={{position:'relative'}} ref={notifRef}>
//             {/* Notification Bell */}
//             <button
//               onClick={() => { setShowNotif(p => !p); setUnreadCount(0); }}
//               style={{
//                 position:'relative', background:'transparent', border:'none',
//                 cursor:'pointer', padding:'8px', borderRadius:10,
//                 color:'var(--text-secondary)', fontSize:18, transition:'all 0.2s'
//               }}
//               title="Notifications"
//             >
//               <FaBell />
//               {unreadCount > 0 && (
//                 <span style={{
//                   position:'absolute', top:2, right:2,
//                   width:18, height:18, background:'#ef4444',
//                   color:'white', fontSize:10, fontWeight:700,
//                   borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
//                   animation: 'pulse 1.5s infinite'
//                 }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
//               )}
//             </button>

//             {/* Notifications Dropdown */}
//             {showNotif && (
//               <div style={{
//                 position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:1000,
//                 background:'var(--bg-card)', border:'1px solid var(--border)',
//                 borderRadius:16, width:340, boxShadow:'0 20px 60px rgba(0,0,0,0.15)',
//                 overflow:'hidden', animation:'fadeIn 0.2s ease'
//               }}>
//                 <div style={{
//                   padding:'16px 20px', borderBottom:'1px solid var(--border)',
//                   display:'flex', justifyContent:'space-between', alignItems:'center',
//                   background:'linear-gradient(135deg,#667eea,#764ba2)'
//                 }}>
//                   <div>
//                     <h3 style={{color:'white',fontSize:15,fontWeight:700,margin:0}}>Notifications</h3>
//                     <p style={{color:'rgba(255,255,255,0.8)',fontSize:11,margin:0}}>{notifications.length} alerts</p>
//                   </div>
//                   <button onClick={() => setShowNotif(false)} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:8,width:28,height:28,cursor:'pointer',color:'white',display:'flex',alignItems:'center',justifyContent:'center'}}>
//                     <FaTimes />
//                   </button>
//                 </div>
//                 <div style={{maxHeight:360, overflowY:'auto'}}>
//                   {notifications.length === 0 ? (
//                     <div style={{padding:32,textAlign:'center',color:'var(--text-secondary)'}}>
//                       <div style={{fontSize:40,marginBottom:8}}>🔔</div>
//                       <p style={{fontSize:14,fontWeight:500}}>All caught up!</p>
//                       <p style={{fontSize:12}}>No new notifications</p>
//                     </div>
//                   ) : notifications.map((n, i) => (
//                     <div key={n.id || i}
//                       onClick={() => { navigate(n.link || '/dashboard'); setShowNotif(false); }}
//                       style={{
//                         padding:'12px 16px', borderBottom:'1px solid var(--border)',
//                         cursor:'pointer', display:'flex', gap:12, alignItems:'flex-start',
//                         transition:'background 0.15s'
//                       }}
//                       onMouseEnter={e => e.currentTarget.style.background='var(--bg)'}
//                       onMouseLeave={e => e.currentTarget.style.background='transparent'}
//                     >
//                       <div style={{fontSize:18,flexShrink:0,marginTop:2}}>{getNotifIcon(n.type)}</div>
//                       <div style={{flex:1,minWidth:0}}>
//                         <p style={{fontSize:13,fontWeight:600,color:'var(--text)',margin:'0 0 2px'}}>{n.title}</p>
//                         <p style={{fontSize:12,color:'var(--text-secondary)',margin:0,lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{n.message}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//                 <div style={{padding:'10px 16px',borderTop:'1px solid var(--border)',textAlign:'center'}}>
//                   <button onClick={() => {navigate('/app/dashboard');setShowNotif(false);}}
//                     style={{background:'none',border:'none',color:'var(--primary)',fontSize:13,fontWeight:600,cursor:'pointer'}}>
//                     View All →
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* Avatar */}
//             <div onClick={() => navigate('/app/profile')} className="topbar-avatar" style={{cursor:'pointer'}} title="My Profile">
//               {user?.profile_image
//                 ? <img src={`http://localhost:5000${user.profile_image}`} alt="avatar" />
//                 : <span>{avatarLetter}</span>
//               }
//             </div>
//           </div>
//         </header>

//         {/* Welcome Banner */}
//         {showWelcome && (
//           <div style={{
//             margin:'16px 28px 0',
//             background:'linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.12))',
//             border:'1px solid rgba(102,126,234,0.25)',
//             borderRadius:14, padding:'14px 20px',
//             display:'flex', alignItems:'center', gap:16, animation:'fadeIn 0.4s ease'
//           }}>
//             <div style={{fontSize:32,flexShrink:0}}>
//               {user?.role==='admin'?'👑':user?.role==='doctor'?'🩺':'👋'}
//             </div>
//             <div style={{flex:1}}>
//               <h3 style={{fontSize:15,fontWeight:700,color:'var(--text)',margin:'0 0 3px'}}>
//                 Welcome back, {user?.full_name?.split(' ')[0]}!
//               </h3>
//               <p style={{fontSize:13,color:'var(--text-secondary)',margin:0}}>
//                 {user?.role==='admin'
//                   ? `You're managing ${uniName}. Check the admin panel for pending actions.`
//                   : user?.role==='doctor'
//                   ? `Ready to see patients today? Check your doctor panel for today's schedule.`
//                   : `Your health matters. Book an appointment or check your records anytime.`
//                 }
//               </p>
//             </div>
//             <button onClick={dismissWelcome} style={{
//               background:'rgba(102,126,234,0.15)', border:'1px solid rgba(102,126,234,0.3)',
//               borderRadius:8, width:32, height:32, cursor:'pointer',
//               color:'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'center',
//               flexShrink:0, transition:'all 0.2s', fontSize:14
//             }}
//             onMouseEnter={e=>e.currentTarget.style.background='rgba(102,126,234,0.3)'}
//             onMouseLeave={e=>e.currentTarget.style.background='rgba(102,126,234,0.15)'}
//             title="Dismiss">
//               <FaTimes />
//             </button>
//           </div>
//         )}

//         {/* Page Content */}
//         <main className="main-content">
//           <Outlet context={{ settings, uniName, uniLogo }} />
//         </main>
//       </div>
//     </div>
//   );
// };

// export default Layout;




import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaHome, FaUserMd, FaCalendarAlt, FaPlus, FaPills,
  FaExclamationTriangle, FaSignOutAlt, FaBars, FaTimes,
  FaMoon, FaSun, FaUser, FaShieldAlt, FaStethoscope,
  FaBell, FaBullhorn, FaChevronLeft, FaCheckCircle,
  FaInfoCircle, FaTimesCircle, FaExclamationCircle,FaClipboardList
} from 'react-icons/fa';
import api from '../services/api';

const Layout = () => {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showWelcome, setShowWelcome] = useState(() => sessionStorage.getItem('welcomeDismissed') !== 'true');
  const notifRef = useRef();

  useEffect(() => {
    api.get('/api/settings').then(r => setSettings(r.data.data)).catch(() => {});
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const endpoint = user?.role === 'admin' ? '/api/admin/notifications' : '/api/notifications';
      const r = await api.get(endpoint);
      if (user?.role === 'admin') {
        const d = r.data.data;
        const notifs = [];
        if (d.counts.emergencies > 0) {
          notifs.push({ id:'emg', type:'error', title:'Active Emergencies', message:`${d.counts.emergencies} emergency alert(s) need attention`, link:'/admin' });
        }
        if (d.counts.pending_appointments > 0) {
          notifs.push({ id:'pend', type:'warning', title:'Pending Appointments', message:`${d.counts.pending_appointments} appointment(s) awaiting action`, link:'/appointments' });
        }
        if (d.counts.low_stock > 0) {
          notifs.push({ id:'stock', type:'warning', title:'Low Medicine Stock', message:`${d.counts.low_stock} medicine(s) below minimum stock`, link:'/admin' });
        }
        d.emergency_alerts?.forEach(a => notifs.push({
          id:`ea_${a.alert_id}`, type:'error',
          title:`🚨 Emergency: ${a.patient_name}`,
          message: a.symptoms, link:'/admin'
        }));
        setNotifications(notifs);
        setUnreadCount(d.counts.total);
      } else {
        setNotifications(r.data.data || []);
        setUnreadCount((r.data.data || []).length);
      }
    } catch {}
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const dismissWelcome = () => {
    sessionStorage.setItem('welcomeDismissed', 'true');
    setShowWelcome(false);
  };

  const canGoBack = location.pathname !== '/app/dashboard';

  const getNavItems = () => {
    if (user?.role === 'admin') return [
      { to: '/app/dashboard', icon: <FaHome />, label: 'Dashboard' },
      { to: '/app/admin', icon: <FaShieldAlt />, label: 'Admin Panel' },
      { to: '/app/complaints', icon: <FaClipboardList />, label: 'Complaints' },
      { to: '/app/profile', icon: <FaUser />, label: 'My Profile' },
    ];
    if (user?.role === 'doctor') return [
      { to: '/app/dashboard', icon: <FaHome />, label: 'Dashboard' },
      { to: '/app/doctor', icon: <FaStethoscope />, label: 'Doctor Panel' },
      { to: '/app/pharmacy', icon: <FaPills />, label: 'Pharmacy' },
      { to: '/app/campaigns', icon: <FaBullhorn />, label: 'Campaigns' },
      { to: '/app/profile', icon: <FaUser />, label: 'Profile' },
    ];
    return [
      { to: '/app/dashboard', icon: <FaHome />, label: 'Dashboard' },
      { to: '/app/appointments', icon: <FaCalendarAlt />, label: 'Appointments' },
      { to: '/app/book-appointment', icon: <FaPlus />, label: 'Book Appointment' },
      { to: '/app/doctors', icon: <FaUserMd />, label: 'Doctors' },
      { to: '/app/pharmacy', icon: <FaPills />, label: 'Pharmacy' },
      { to: '/app/campaigns', icon: <FaBullhorn />, label: 'Campaigns' },
      { to: '/app/emergency', icon: <FaExclamationTriangle />, label: 'Emergency', pulse: true },
      { to: '/app/complaints', icon: <FaClipboardList />, label: 'Complaints' },
      { to: '/app/profile', icon: <FaUser />, label: 'Profile' },
    ];
  };

  const getRoleBadge = () => {
    const badges = {
      admin: { label: 'Admin', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)' },
      doctor: { label: 'Doctor', color: '#3b82f6', bg: 'rgba(59,130,246,0.2)' },
      student: { label: 'Student', color: '#10b981', bg: 'rgba(16,185,129,0.2)' },
      teacher: { label: 'Teacher', color: '#8b5cf6', bg: 'rgba(139,92,246,0.2)' },
      staff: { label: 'Staff', color: '#06b6d4', bg: 'rgba(6,182,212,0.2)' },
    };
    return badges[user?.role] || badges.student;
  };

  const getNotifIcon = (type) => {
    if (type === 'error') return <FaTimesCircle style={{color:'#ef4444'}} />;
    if (type === 'warning') return <FaExclamationCircle style={{color:'#f59e0b'}} />;
    if (type === 'success') return <FaCheckCircle style={{color:'#10b981'}} />;
    if (type === 'campaign') return <FaBullhorn style={{color:'#8b5cf6'}} />;
    return <FaInfoCircle style={{color:'#3b82f6'}} />;
  };

  const badge = getRoleBadge();
  const navItems = getNavItems();
  const avatarLetter = user?.full_name?.[0]?.toUpperCase() || 'U';
  const uniName = settings?.university_name || 'University Medical Center';
  const uniLogo = settings?.university_logo ? `http://localhost:5000${settings.university_logo}` : null;

  const getPageTitle = () => {
    const map = {
      '/app/dashboard': 'Dashboard', '/app/admin': 'Admin Panel',
      '/app/doctor': 'Doctor Panel', '/app/appointments': 'Appointments',
      '/app/book-appointment': 'Book Appointment', '/app/pharmacy': 'Pharmacy',
      '/app/emergency': 'Emergency', '/app/doctors': 'Doctors',
      '/app/profile': 'Profile', '/app/campaigns': 'Campaigns',
    };
    return map[location.pathname] || 'Dashboard';
  };

  return (
    <div className={`layout-root ${darkMode ? 'dark' : ''}`}>
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'} ${mobileOpen ? 'mobile-visible' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            {uniLogo
              ? <img src={uniLogo} alt="logo" style={{width:36,height:36,borderRadius:8,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'} />
              : <div className="logo-icon">🏥</div>
            }
            {sidebarOpen && (
              <div className="logo-text">
                <span className="logo-name" title={uniName} style={{fontSize:11,lineHeight:1.2}}>
                  {uniName.length > 22 ? uniName.slice(0,22)+'…' : uniName}
                </span>
                <span className="logo-sub">Medical System</span>
              </div>
            )}
          </div>
          <div className="sidebar-controls">
            <button onClick={toggleDarkMode} className="icon-btn" title={darkMode?'Light mode':'Dark mode'}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button onClick={() => setSidebarOpen(p => !p)} className="icon-btn desktop-only"
              title={sidebarOpen ? 'Collapse' : 'Expand'}>
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <button onClick={() => setMobileOpen(false)} className="icon-btn mobile-only"><FaTimes /></button>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar" onClick={() => navigate('/app/profile')} style={{cursor:'pointer'}}>
            {user?.profile_image
              ? <img src={`http://localhost:5000${user.profile_image}`} alt="avatar" />
              : <span>{avatarLetter}</span>
            }
          </div>
          {sidebarOpen && (
            <div className="user-info">
              <p className="user-name">{user?.full_name}</p>
              <span className="role-badge" style={{color:badge.color, background:badge.bg}}>{badge.label}</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              title={!sidebarOpen ? item.label : ''}
              className={({isActive}) => `nav-item ${isActive?'active':''} ${item.pulse?'emergency-nav':''}`}
              onClick={() => setMobileOpen(false)}>
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
              {item.pulse && sidebarOpen && <span className="pulse-dot" />}
            </NavLink>
          ))}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </aside>

      {/* ── MAIN ── */}
      <div className="main-wrapper">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn mobile-only" onClick={() => setMobileOpen(true)}><FaBars /></button>
            {!sidebarOpen && (
              <button className="icon-btn desktop-only" onClick={() => setSidebarOpen(true)}
                style={{color:'var(--text-secondary)',marginRight:4}} title="Open sidebar">
                <FaBars />
              </button>
            )}
            {canGoBack && (
              <button onClick={() => navigate(-1)}
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  background:'var(--bg)', border:'1px solid var(--border)',
                  borderRadius:8, padding:'6px 12px', cursor:'pointer',
                  color:'var(--text-secondary)', fontSize:13, fontWeight:500,
                  marginRight:8, transition:'all 0.2s'
                }}
                onMouseEnter={e=>{e.target.style.color='var(--primary)';e.target.style.borderColor='var(--primary)';}}
                onMouseLeave={e=>{e.target.style.color='var(--text-secondary)';e.target.style.borderColor='var(--border)';}}
              >
                <FaChevronLeft style={{fontSize:11}} /> Back
              </button>
            )}
            <div>
              <h2 style={{fontSize:17,fontWeight:700,color:'var(--text)'}}>{getPageTitle()}</h2>
              <p style={{fontSize:11,color:'var(--text-secondary)'}}>
                {new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
              </p>
            </div>
          </div>
          <div className="topbar-right" style={{position:'relative'}} ref={notifRef}>
            {/* Notification Bell */}
            <button
              onClick={() => { setShowNotif(p => !p); setUnreadCount(0); }}
              style={{
                position:'relative', background:'transparent', border:'none',
                cursor:'pointer', padding:'8px', borderRadius:10,
                color:'var(--text-secondary)', fontSize:18, transition:'all 0.2s'
              }}
              title="Notifications"
            >
              <FaBell />
              {unreadCount > 0 && (
                <span style={{
                  position:'absolute', top:2, right:2,
                  width:18, height:18, background:'#ef4444',
                  color:'white', fontSize:10, fontWeight:700,
                  borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  animation: 'pulse 1.5s infinite'
                }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotif && (
              <div style={{
                position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:1000,
                background:'var(--bg-card)', border:'1px solid var(--border)',
                borderRadius:16, width:340, boxShadow:'0 20px 60px rgba(0,0,0,0.15)',
                overflow:'hidden', animation:'fadeIn 0.2s ease'
              }}>
                <div style={{
                  padding:'16px 20px', borderBottom:'1px solid var(--border)',
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  background:'linear-gradient(135deg,#667eea,#764ba2)'
                }}>
                  <div>
                    <h3 style={{color:'white',fontSize:15,fontWeight:700,margin:0}}>Notifications</h3>
                    <p style={{color:'rgba(255,255,255,0.8)',fontSize:11,margin:0}}>{notifications.length} alerts</p>
                  </div>
                  <button onClick={() => setShowNotif(false)} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:8,width:28,height:28,cursor:'pointer',color:'white',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <FaTimes />
                  </button>
                </div>
                <div style={{maxHeight:360, overflowY:'auto'}}>
                  {notifications.length === 0 ? (
                    <div style={{padding:32,textAlign:'center',color:'var(--text-secondary)'}}>
                      <div style={{fontSize:40,marginBottom:8}}>🔔</div>
                      <p style={{fontSize:14,fontWeight:500}}>All caught up!</p>
                      <p style={{fontSize:12}}>No new notifications</p>
                    </div>
                  ) : notifications.map((n, i) => (
                    <div key={n.id || i}
                      onClick={() => { navigate('/app' + (n.link || '/dashboard')); setShowNotif(false); }}
                      style={{
                        padding:'12px 16px', borderBottom:'1px solid var(--border)',
                        cursor:'pointer', display:'flex', gap:12, alignItems:'flex-start',
                        transition:'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      <div style={{fontSize:18,flexShrink:0,marginTop:2}}>{getNotifIcon(n.type)}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:13,fontWeight:600,color:'var(--text)',margin:'0 0 2px'}}>{n.title}</p>
                        <p style={{fontSize:12,color:'var(--text-secondary)',margin:0,lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{padding:'10px 16px',borderTop:'1px solid var(--border)',textAlign:'center'}}>
                  <button onClick={() => {navigate('/app/dashboard'); setShowNotif(false);}}
                    style={{background:'none',border:'none',color:'var(--primary)',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                    View All →
                  </button>
                </div>
              </div>
            )}

            {/* Avatar */}
            <div onClick={() => navigate('/app/profile')} className="topbar-avatar" style={{cursor:'pointer'}} title="My Profile">
              {user?.profile_image
                ? <img src={`http://localhost:5000${user.profile_image}`} alt="avatar" />
                : <span>{avatarLetter}</span>
              }
            </div>
          </div>
        </header>

        {/* Welcome Banner */}
        {showWelcome && (
          <div style={{
            margin:'16px 28px 0',
            background:'linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.12))',
            border:'1px solid rgba(102,126,234,0.25)',
            borderRadius:14, padding:'14px 20px',
            display:'flex', alignItems:'center', gap:16, animation:'fadeIn 0.4s ease'
          }}>
            <div style={{fontSize:32,flexShrink:0}}>
              {user?.role==='admin'?'👑':user?.role==='doctor'?'🩺':'👋'}
            </div>
            <div style={{flex:1}}>
              <h3 style={{fontSize:15,fontWeight:700,color:'var(--text)',margin:'0 0 3px'}}>
                Welcome back, {user?.full_name?.split(' ')[0]}!
              </h3>
              <p style={{fontSize:13,color:'var(--text-secondary)',margin:0}}>
                {user?.role==='admin'
                  ? `You're managing ${uniName}. Check the admin panel for pending actions.`
                  : user?.role==='doctor'
                  ? `Ready to see patients today? Check your doctor panel for today's schedule.`
                  : `Your health matters. Book an appointment or check your records anytime.`
                }
              </p>
            </div>
            <button onClick={dismissWelcome} style={{
              background:'rgba(102,126,234,0.15)', border:'1px solid rgba(102,126,234,0.3)',
              borderRadius:8, width:32, height:32, cursor:'pointer',
              color:'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0, transition:'all 0.2s', fontSize:14
            }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(102,126,234,0.3)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(102,126,234,0.15)'}
            title="Dismiss">
              <FaTimes />
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="main-content">
          <Outlet context={{ settings, uniName, uniLogo }} />
        </main>
      </div>
    </div>
  );
};

export default Layout;