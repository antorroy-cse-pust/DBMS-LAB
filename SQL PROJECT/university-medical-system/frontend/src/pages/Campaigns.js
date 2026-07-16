import React, { useEffect, useState } from 'react';
import { FaBullhorn, FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaTag } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const typeColors = {
  'Vaccination': { bg: 'rgba(16,185,129,0.12)', color: '#059669', icon: '💉' },
  'Health Screening': { bg: 'rgba(59,130,246,0.12)', color: '#2563eb', icon: '🏥' },
  'Awareness': { bg: 'rgba(139,92,246,0.12)', color: '#7c3aed', icon: '📢' },
  'Fitness': { bg: 'rgba(245,158,11,0.12)', color: '#d97706', icon: '🏃' },
  'Mental Health': { bg: 'rgba(236,72,153,0.12)', color: '#db2777', icon: '🧠' },
};

const Campaigns = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAll, setShowAll] = useState(user?.role === 'admin');

  useEffect(() => {
    api.get('/api/campaigns')
      .then(r => setCampaigns(r.data.data || []))
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setLoading(false));
  }, []);

  const allTypes = [...new Set(campaigns.map(c => c.campaign_type).filter(Boolean))];

  const filtered = campaigns.filter(c => {
    // Non-admins: show active campaigns + option to show all
    if (!showAll && !c.is_active) return false;
    const matchSearch = !search ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || c.campaign_type === typeFilter;
    return matchSearch && matchType;
  });

  const activeCampaigns = campaigns.filter(c => c.is_active);

  const isOngoing = (c) => {
    const today = new Date();
    const start = c.start_date ? new Date(c.start_date) : null;
    const end = c.end_date ? new Date(c.end_date) : null;
    if (start && end) return today >= start && today <= end;
    return c.is_active;
  };

  const isUpcoming = (c) => {
    const today = new Date();
    const start = c.start_date ? new Date(c.start_date) : null;
    return start && start > today;
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"/></div>;

  return (
    <div>
      <div className="page-header-gradient">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <h1>📢 Health Campaigns</h1>
            <p>{activeCampaigns.length} active campaigns • Stay informed and participate</p>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            {user?.role !== 'admin' && (
              <button
                className={`btn btn-sm ${showAll ? 'btn-warning' : 'btn-outline'}`}
                style={{borderColor:'white',color:'white'}}
                onClick={() => setShowAll(p => !p)}
              >
                {showAll ? '📋 Active Only' : '📋 Show All'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{marginBottom:24}}>
        {[
          { label:'Active Campaigns', value: activeCampaigns.length, color:'linear-gradient(135deg,#10b981,#059669)', icon:'✅' },
          { label:'Ongoing Now', value: campaigns.filter(isOngoing).length, color:'linear-gradient(135deg,#667eea,#764ba2)', icon:'🔄' },
          { label:'Upcoming', value: campaigns.filter(isUpcoming).length, color:'linear-gradient(135deg,#f59e0b,#d97706)', icon:'📅' },
          { label:'Total Campaigns', value: campaigns.length, color:'linear-gradient(135deg,#3b82f6,#2563eb)', icon:'📊' },
        ].map((s,i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{background:s.color,fontSize:22}}>{s.icon}</div>
            <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-wrapper" style={{flex:1}}>
          <FaSearch className="search-icon"/>
          <input className="search-input" placeholder="Search campaigns..."
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="form-select" style={{width:'auto'}}
          value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Campaign Cards */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon"><FaBullhorn /></div>
            <h3>No campaigns found</h3>
            <p>{showAll ? 'No campaigns match your search' : 'No active campaigns at the moment'}</p>
            {!showAll && user?.role !== 'admin' && (
              <button className="btn btn-outline btn-sm" style={{marginTop:12}} onClick={() => setShowAll(true)}>
                View All Campaigns
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:20}}>
          {filtered.map(c => {
            const typeStyle = typeColors[c.campaign_type] || { bg:'rgba(102,126,234,0.1)', color:'var(--primary)', icon:'📋' };
            const ongoing = isOngoing(c);
            const upcoming = isUpcoming(c);
            return (
              <div key={c.campaign_id} className="card" style={{
                borderLeft: `4px solid ${c.is_active ? typeStyle.color : '#9ca3af'}`,
                opacity: c.is_active ? 1 : 0.7,
                position:'relative',overflow:'hidden'
              }}>
                {/* Status ribbon */}
                {ongoing && c.is_active && (
                  <div style={{
                    position:'absolute',top:12,right:12,
                    background:'linear-gradient(135deg,#10b981,#059669)',
                    color:'white',fontSize:10,fontWeight:700,
                    padding:'3px 8px',borderRadius:20
                  }}>🔴 LIVE NOW</div>
                )}
                {upcoming && c.is_active && (
                  <div style={{
                    position:'absolute',top:12,right:12,
                    background:'linear-gradient(135deg,#f59e0b,#d97706)',
                    color:'white',fontSize:10,fontWeight:700,
                    padding:'3px 8px',borderRadius:20
                  }}>📅 UPCOMING</div>
                )}
                {!c.is_active && (
                  <div style={{
                    position:'absolute',top:12,right:12,
                    background:'#9ca3af',color:'white',
                    fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20
                  }}>INACTIVE</div>
                )}

                <div style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:14}}>
                  <div style={{
                    width:52,height:52,borderRadius:12,flexShrink:0,
                    background: typeStyle.bg,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:26
                  }}>{typeStyle.icon}</div>
                  <div style={{flex:1,paddingRight:70}}>
                    <h3 style={{fontSize:16,fontWeight:700,color:'var(--text)',marginBottom:4}}>{c.title}</h3>
                    {c.campaign_type && (
                      <span style={{
                        fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,
                        background:typeStyle.bg, color:typeStyle.color
                      }}>{c.campaign_type}</span>
                    )}
                  </div>
                </div>

                {c.description && (
                  <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:14}}>
                    {c.description}
                  </p>
                )}

                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {c.location && (
                    <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--text-secondary)'}}>
                      <FaMapMarkerAlt style={{color:typeStyle.color,flexShrink:0}}/>
                      <span>{c.location}</span>
                    </div>
                  )}
                  {(c.start_date || c.end_date) && (
                    <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--text-secondary)'}}>
                      <FaCalendarAlt style={{color:typeStyle.color,flexShrink:0}}/>
                      <span>
                        {c.start_date ? new Date(c.start_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '?'}
                        {' → '}
                        {c.end_date ? new Date(c.end_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '?'}
                      </span>
                    </div>
                  )}
                  {c.created_by_name && (
                    <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'var(--text-secondary)'}}>
                      <FaTag style={{color:typeStyle.color,flexShrink:0}}/>
                      <span>Organized by {c.created_by_name}</span>
                    </div>
                  )}
                </div>

                {c.is_active && (
                  <div style={{
                    marginTop:14,padding:'10px 14px',borderRadius:10,
                    background: typeStyle.bg, textAlign:'center'
                  }}>
                    <p style={{fontSize:12,fontWeight:600,color:typeStyle.color}}>
                      {ongoing ? '✅ This campaign is currently running — participate today!' :
                       upcoming ? `⏰ Starting ${c.start_date ? new Date(c.start_date).toLocaleDateString() : 'soon'}` :
                       '📋 Campaign information'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Campaigns;

