import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUserMd, FaCalendarAlt, FaPills, FaExclamationTriangle,
  FaFileAlt, FaVideo, FaBullhorn, FaPhone, FaEnvelope,
  FaMapMarkerAlt, FaBars, FaTimes, FaArrowRight, FaStar,
  FaChevronDown, FaPaperPlane, FaHeartbeat, FaShieldAlt,
  FaUsers, FaCheckCircle, FaAward, FaClock
} from 'react-icons/fa';
import api from '../services/api';

const API_BASE = 'http://localhost:5000';

/* ── tiny reusable components ── */
const StarRating = ({ rating }) => (
  <span style={{ color: '#f59e0b', fontSize: 13 }}>
    {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
    <span style={{ color: '#94a3b8', marginLeft: 4, fontSize: 12 }}>{Number(rating).toFixed(1)}</span>
  </span>
);

const Landing = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const heroRef = useRef();

  useEffect(() => {
    api.get('/api/landing').then(r => setData(r.data.data)).catch(() => {});
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      // update active nav based on scroll
      const sections = ['home','services','doctors','campaigns','about','contact'];
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 100) {
          setActiveNav(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const sendContact = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setSending(true);
    try {
      await api.post('/api/contact', contactForm);
      setSent(true);
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch {}
    finally { setSending(false); }
  };

  const settings = data?.settings || {};
  const landing = data?.landing || {};
  const doctors = data?.doctors || [];
  const campaigns = data?.campaigns || [];
  const stats = data?.stats || {};
  const uniName = settings.university_name || 'University Medical Center';
  const uniLogo = settings.university_logo ? `${API_BASE}${settings.university_logo}` : null;
  const heroBg = landing.hero_bg_url
    ? `${API_BASE}${landing.hero_bg_url}`
    : 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&q=80';

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services' },
    { id: 'doctors', label: 'Doctors' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  const services = [
    { icon: <FaCalendarAlt />, title: 'Appointment Booking', desc: 'Book online or in-person consultations with our specialist doctors at your convenience.', color: '#667eea' },
    { icon: <FaVideo />, title: 'Telemedicine', desc: 'Connect with doctors via secure video calls from anywhere on campus or at home.', color: '#06b6d4' },
    { icon: <FaPills />, title: 'Pharmacy Services', desc: 'Access medicines and health supplies with real-time stock availability and pricing.', color: '#10b981' },
    { icon: <FaExclamationTriangle />, title: 'Emergency Response', desc: 'One-tap emergency alerts with GPS location sent directly to our medical team.', color: '#ef4444' },
    { icon: <FaFileAlt />, title: 'Medical Records', desc: 'Secure digital prescriptions and medical history accessible anytime, anywhere.', color: '#8b5cf6' },
    { icon: <FaBullhorn />, title: 'Health Campaigns', desc: 'Stay updated on vaccination drives, health screenings and wellness programs.', color: '#f59e0b' },
  ];

  const whyUs = [
    { icon: <FaAward />, title: 'Experienced Doctors', desc: 'Board-certified specialists with years of clinical experience' },
    { icon: <FaShieldAlt />, title: 'Confidential & Secure', desc: 'Your health data is encrypted and fully protected' },
    { icon: <FaClock />, title: '24/7 Emergency', desc: 'Round-the-clock emergency response for the university community' },
    { icon: <FaCheckCircle />, title: 'Comprehensive Care', desc: 'From routine checkups to specialist consultations under one roof' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1a1a2e', overflowX: 'hidden' }}>

      {/* ══════════════ ANNOUNCEMENT BAR ══════════════ */}
      {landing.announcement && (
        <div style={{
          background: 'linear-gradient(135deg,#667eea,#764ba2)',
          color: 'white', padding: '8px 20px',
          textAlign: 'center', fontSize: 13, fontWeight: 500
        }}>
          📢 {landing.announcement}
        </div>
      )}

      {/* ══════════════ NAVBAR ══════════════ */}
      <nav style={{
        position: 'fixed', top: landing.announcement ? 36 : 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        boxShadow: scrolled ? '0 2px 30px rgba(0,0,0,0.1)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.3s ease',
        padding: '0 5%',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 72, gap: 32 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: '0 0 auto' }}
            onClick={() => scrollTo('home')}>
            {uniLogo
              ? <img src={uniLogo} alt="logo" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
              : <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏥</div>
            }
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: scrolled ? '#1a1a2e' : 'white', lineHeight: 1.1, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {uniName}
              </div>
              <div style={{ fontSize: 10, color: scrolled ? '#667eea' : 'rgba(255,255,255,0.8)', fontWeight: 600, letterSpacing: 1 }}>
                MEDICAL CENTER
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}
            className="desktop-nav">
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 14px', borderRadius: 8, fontSize: 13.5, fontWeight: 600,
                color: activeNav === l.id
                  ? '#667eea'
                  : scrolled ? '#374151' : 'rgba(255,255,255,0.9)',
                borderBottom: activeNav === l.id ? '2px solid #667eea' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (activeNav !== l.id) e.target.style.color = '#667eea'; }}
              onMouseLeave={e => { if (activeNav !== l.id) e.target.style.color = scrolled ? '#374151' : 'rgba(255,255,255,0.9)'; }}>
                {l.label}
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <button onClick={() => navigate('/login')} style={{
              background: 'none', border: `2px solid ${scrolled ? '#667eea' : 'rgba(255,255,255,0.7)'}`,
              color: scrolled ? '#667eea' : 'white',
              padding: '8px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#667eea'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#667eea'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = scrolled ? '#667eea' : 'white'; e.currentTarget.style.borderColor = scrolled ? '#667eea' : 'rgba(255,255,255,0.7)'; }}>
              Sign In
            </button>
            <button onClick={() => navigate('/register')} style={{
              background: 'linear-gradient(135deg,#667eea,#764ba2)',
              border: 'none', color: 'white',
              padding: '9px 22px', borderRadius: 8, fontWeight: 700, fontSize: 13,
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(102,126,234,0.4)'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Get Started
            </button>
            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(p => !p)} style={{
              display: 'none', background: 'none', border: 'none',
              color: scrolled ? '#1a1a2e' : 'white', fontSize: 22, cursor: 'pointer'
            }} className="mobile-hamburger">
              {menuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div style={{
            background: 'white', borderTop: '1px solid #e5e7eb',
            padding: '16px 5%', display: 'flex', flexDirection: 'column', gap: 4
          }}>
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)} style={{
                background: activeNav === l.id ? 'rgba(102,126,234,0.08)' : 'none',
                border: 'none', textAlign: 'left', padding: '12px 16px',
                borderRadius: 8, fontSize: 14, fontWeight: 600,
                color: activeNav === l.id ? '#667eea' : '#374151', cursor: 'pointer'
              }}>{l.label}</button>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => navigate('/login')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '2px solid #667eea', color: '#667eea', background: 'none', fontWeight: 700, cursor: 'pointer' }}>Sign In</button>
              <button onClick={() => navigate('/register')} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <section id="home" ref={heroRef} style={{
        minHeight: '100vh', position: 'relative',
        display: 'flex', alignItems: 'center',
        background: `linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(102,126,234,0.75) 50%, rgba(118,75,162,0.8) 100%), url('${heroBg}') center/cover no-repeat`,
      }}>
        {/* Animated blobs */}
        <div style={{ position: 'absolute', top: '15%', right: '8%', width: 400, height: 400, background: 'rgba(102,126,234,0.15)', borderRadius: '50%', filter: 'blur(80px)', animation: 'pulse 4s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '5%', width: 300, height: 300, background: 'rgba(118,75,162,0.15)', borderRadius: '50%', filter: 'blur(60px)', animation: 'pulse 6s ease-in-out infinite' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 5% 80px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 700 }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(102,126,234,0.25)', border: '1px solid rgba(102,126,234,0.4)',
              borderRadius: 100, padding: '6px 16px', marginBottom: 24,
              backdropFilter: 'blur(10px)'
            }}>
              <FaHeartbeat style={{ color: '#a5b4fc', fontSize: 13 }} />
              <span style={{ color: '#c7d2fe', fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>
                UNIVERSITY HEALTH PORTAL
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, color: 'white',
              lineHeight: 1.1, marginBottom: 20, letterSpacing: -1
            }}>
              {landing.hero_title || `Excellence in\nUniversity Healthcare`}
            </h1>

            <p style={{
              fontSize: 18, color: 'rgba(255,255,255,0.82)', lineHeight: 1.7,
              marginBottom: 36, maxWidth: 560
            }}>
              {landing.hero_subtitle || 'Comprehensive medical services for students, faculty and staff. Book appointments, access pharmacy, and get emergency support.'}
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/register')} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'linear-gradient(135deg,#667eea,#764ba2)',
                color: 'white', border: 'none', padding: '14px 28px',
                borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(102,126,234,0.5)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(102,126,234,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(102,126,234,0.5)'; }}>
                Get Started Free <FaArrowRight style={{ fontSize: 13 }} />
              </button>
              <button onClick={() => scrollTo('services')} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.3)',
                color: 'white', padding: '14px 28px', borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                backdropFilter: 'blur(10px)', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}>
                Explore Services
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <button onClick={() => scrollTo('stats')} style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '50%', width: 44, height: 44, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', animation: 'bounce 2s infinite', zIndex: 1
        }}>
          <FaChevronDown />
        </button>
      </section>

      {/* ══════════════ LIVE STATS ══════════════ */}
      {(landing.show_stats !== false) && (
        <section id="stats" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', padding: '56px 5%' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 0 }}>
            {[
              { value: stats.total_doctors || 0, label: 'Expert Doctors', icon: <FaUserMd />, suffix: '+' },
              { value: stats.total_patients || 0, label: 'Registered Patients', icon: <FaUsers />, suffix: '+' },
              { value: stats.total_appointments || 0, label: 'Appointments Served', icon: <FaCheckCircle />, suffix: '+' },
              { value: stats.active_campaigns || 0, label: 'Active Campaigns', icon: <FaBullhorn />, suffix: '' },
            ].map((s, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '24px 20px',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.15)' : 'none',
              }}>
                <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 'clamp(36px,4vw,52px)', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                  {s.value}{s.suffix}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 14, fontWeight: 500, marginTop: 6 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════ SERVICES ══════════════ */}
      <section id="services" style={{ padding: '96px 5%', background: '#f8faff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ display: 'inline-block', background: 'rgba(102,126,234,0.1)', color: '#667eea', borderRadius: 100, padding: '6px 18px', fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>
              OUR SERVICES
            </div>
            <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800, margin: '0 0 16px', color: '#0f172a' }}>
              Comprehensive Healthcare Services
            </h2>
            <p style={{ fontSize: 17, color: '#64748b', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              Everything you need for your health and wellbeing, all in one integrated platform.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 24 }}>
            {services.map((s, i) => (
              <div key={i} onClick={() => navigate('/register')} style={{
                background: 'white', borderRadius: 20, padding: '32px 28px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.06)',
                cursor: 'pointer', transition: 'all 0.3s',
                display: 'flex', alignItems: 'flex-start', gap: 20
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 48px ${s.color}22`; e.currentTarget.style.borderColor = s.color + '44'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                  background: s.color + '18', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 24, color: s.color
                }}>{s.icon}</div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ WHY CHOOSE US ══════════════ */}
      <section style={{ padding: '80px 5%', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(102,126,234,0.1)', color: '#667eea', borderRadius: 100, padding: '6px 18px', fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>
              WHY CHOOSE US
            </div>
            <h2 style={{ fontSize: 'clamp(26px,3vw,40px)', fontWeight: 800, margin: '0 0 16px', color: '#0f172a', lineHeight: 1.2 }}>
              Healthcare You Can Trust
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, marginBottom: 36 }}>
              {landing.about_text || 'Our University Medical Center is dedicated to providing world-class healthcare to the university community.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {whyUs.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, flexShrink: 0 }}>
                    {w.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>{w.title}</h4>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{w.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/register')} style={{
              marginTop: 32, display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white',
              border: 'none', padding: '13px 28px', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(102,126,234,0.4)', transition: 'all 0.2s'
            }}>
              Join Us Today <FaArrowRight style={{ fontSize: 12 }} />
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{
              background: 'linear-gradient(135deg,#667eea18,#764ba218)',
              borderRadius: 24, padding: 32,
              border: '1px solid rgba(102,126,234,0.15)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Doctors', value: stats.total_doctors || 0, color: '#667eea', bg: '#667eea12', icon: '🩺' },
                  { label: 'Patients', value: stats.total_patients || 0, color: '#10b981', bg: '#10b98112', icon: '👥' },
                  { label: 'Appointments', value: stats.total_appointments || 0, color: '#f59e0b', bg: '#f59e0b12', icon: '📅' },
                  { label: 'Campaigns', value: stats.active_campaigns || 0, color: '#8b5cf6', bg: '#8b5cf612', icon: '📢' },
                ].map((item, i) => (
                  <div key={i} style={{ background: item.bg, borderRadius: 16, padding: '20px 18px', border: `1px solid ${item.color}22`, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.value}</div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 4 }}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, padding: '16px 20px', background: 'white', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20 }}>
                  <FaHeartbeat />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Always Available</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Emergency response 24 hours, 7 days a week</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ DOCTORS ══════════════ */}
      {(landing.show_doctors !== false) && doctors.length > 0 && (
        <section id="doctors" style={{ padding: '96px 5%', background: '#f8faff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ display: 'inline-block', background: 'rgba(102,126,234,0.1)', color: '#667eea', borderRadius: 100, padding: '6px 18px', fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>
                MEET OUR TEAM
              </div>
              <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800, margin: '0 0 16px', color: '#0f172a' }}>
                Our Expert Doctors
              </h2>
              <p style={{ fontSize: 17, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>
                Qualified and experienced medical professionals dedicated to your health
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 24 }}>
              {doctors.slice(0, 6).map(doc => (
                <div key={doc.user_id} style={{
                  background: 'white', borderRadius: 20, overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)',
                  transition: 'all 0.3s', cursor: 'pointer'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(102,126,234,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; }}>
                  {/* Card Header */}
                  <div style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', padding: '28px 20px', textAlign: 'center', position: 'relative' }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: '50%', margin: '0 auto',
                      border: '3px solid rgba(255,255,255,0.4)',
                      overflow: 'hidden', background: 'rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 28, fontWeight: 700
                    }}>
                      {doc.profile_image
                        ? <img src={`${API_BASE}${doc.profile_image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : doc.full_name?.[0]
                      }
                    </div>
                  </div>
                  {/* Card Body */}
                  <div style={{ padding: '20px 20px 24px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
                      Dr. {doc.full_name}
                    </h3>
                    <p style={{ fontSize: 13, color: '#667eea', fontWeight: 600, margin: '0 0 10px' }}>
                      {doc.specialization || 'General Medicine'}
                    </p>
                    {doc.avg_rating > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <StarRating rating={doc.avg_rating} />
                        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>({doc.total_reviews})</span>
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
                      {doc.experience_years || 0} years experience
                      {doc.qualifications ? ` • ${doc.qualifications}` : ''}
                    </div>
                    <button onClick={() => navigate('/register')} style={{
                      width: '100%', padding: '10px', borderRadius: 8,
                      background: 'linear-gradient(135deg,#667eea,#764ba2)',
                      color: 'white', border: 'none', fontWeight: 700, fontSize: 13,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {doctors.length > 6 && (
              <div style={{ textAlign: 'center', marginTop: 36 }}>
                <button onClick={() => navigate('/register')} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'none', border: '2px solid #667eea', color: '#667eea',
                  padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#667eea'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#667eea'; }}>
                  View All {doctors.length} Doctors <FaArrowRight style={{ fontSize: 12 }} />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════════════ CAMPAIGNS ══════════════ */}
      {(landing.show_campaigns !== false) && campaigns.length > 0 && (
        <section id="campaigns" style={{ padding: '96px 5%', background: 'white' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ display: 'inline-block', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', borderRadius: 100, padding: '6px 18px', fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>
                HEALTH CAMPAIGNS
              </div>
              <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800, margin: '0 0 16px', color: '#0f172a' }}>
                Active Health Programs
              </h2>
              <p style={{ fontSize: 17, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>
                Participate in our ongoing health initiatives and stay healthy
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24 }}>
              {campaigns.map((c, i) => {
                const typeColors = {
                  'Vaccination': '#10b981', 'Health Screening': '#3b82f6',
                  'Awareness': '#8b5cf6', 'Fitness': '#f59e0b',
                  'Mental Health': '#ec4899', 'Dental': '#06b6d4', 'Blood Donation': '#ef4444'
                };
                const color = typeColors[c.campaign_type] || '#667eea';
                const icons = { 'Vaccination':'💉','Health Screening':'🏥','Awareness':'📢','Fitness':'🏃','Mental Health':'🧠','Dental':'🦷','Blood Donation':'🩸' };
                const icon = icons[c.campaign_type] || '📋';
                return (
                  <div key={c.campaign_id} style={{
                    background: 'white', borderRadius: 20,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    overflow: 'hidden', transition: 'all 0.3s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 40px ${color}22`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; }}>
                    <div style={{ background: color + '12', padding: '24px 24px 20px', borderBottom: `3px solid ${color}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 32 }}>{icon}</span>
                        <div>
                          {c.campaign_type && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: color, letterSpacing: 1, textTransform: 'uppercase' }}>{c.campaign_type}</span>
                          )}
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '2px 0 0' }}>{c.title}</h3>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '18px 24px 24px' }}>
                      {c.description && <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px', lineHeight: 1.6 }}>{c.description}</p>}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                        {c.location && <span>📍 {c.location}</span>}
                        {c.start_date && <span>📅 {new Date(c.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} → {c.end_date ? new Date(c.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'Ongoing'}</span>}
                      </div>
                      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>Active Now</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ ABOUT ══════════════ */}
      <section id="about" style={{
        padding: '96px 5%',
        background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, background: 'rgba(102,126,234,0.08)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-block', background: 'rgba(102,126,234,0.2)', color: '#a5b4fc', borderRadius: 100, padding: '6px 18px', fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 20 }}>
                ABOUT US
              </div>
              <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800, color: 'white', margin: '0 0 20px', lineHeight: 1.2 }}>
                About {uniName}
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', lineHeight: 1.8, marginBottom: 28 }}>
                {landing.about_text || 'Our University Medical Center is dedicated to providing world-class healthcare to the university community. With experienced doctors, modern facilities, and compassionate care, we ensure your health and wellbeing.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: '🏥', text: settings.university_address || 'University Campus, Medical Building' },
                  { icon: '📞', text: settings.contact_phone || '+1-555-0100' },
                  { icon: '✉️', text: settings.contact_email || 'medical@university.edu' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/register')} style={{
                marginTop: 32, display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white',
                border: 'none', padding: '13px 28px', borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 6px 24px rgba(102,126,234,0.4)', transition: 'all 0.2s'
              }}>
                Register Now <FaArrowRight style={{ fontSize: 12 }} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { icon: '🩺', title: 'Expert Care', desc: 'Qualified doctors and medical staff' },
                { icon: '💊', title: 'Full Pharmacy', desc: 'Medicines always available on campus' },
                { icon: '📱', title: 'Digital First', desc: 'Book, track and manage online' },
                { icon: '🚨', title: 'Emergency Ready', desc: '24/7 emergency response system' },
              ].map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16, padding: '24px 20px', textAlign: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(102,126,234,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, color: 'white', fontSize: 14, marginBottom: 6 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ CONTACT ══════════════ */}
      {(landing.show_contact !== false) && (
        <section id="contact" style={{ padding: '96px 5%', background: '#f8faff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ display: 'inline-block', background: 'rgba(102,126,234,0.1)', color: '#667eea', borderRadius: 100, padding: '6px 18px', fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>
                GET IN TOUCH
              </div>
              <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800, margin: '0 0 16px', color: '#0f172a' }}>Contact Us</h2>
              <p style={{ fontSize: 17, color: '#64748b', maxWidth: 480, margin: '0 auto' }}>
                Have a question or need help? We're here for you.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 48, alignItems: 'start' }}>
              {/* Contact Info */}
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 24px', color: '#0f172a' }}>
                  Reach Out To Us
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 36 }}>
                  {[
                    { icon: <FaMapMarkerAlt />, label: 'Address', value: settings.university_address || 'University Campus, Medical Building', color: '#667eea' },
                    { icon: <FaPhone />, label: 'Phone', value: settings.contact_phone || '+1-555-0100', color: '#10b981' },
                    { icon: <FaEnvelope />, label: 'Email', value: settings.contact_email || 'medical@university.edu', color: '#f59e0b' },
                    { icon: <FaClock />, label: 'Hours', value: 'Mon–Fri: 8AM–6PM | Emergency: 24/7', color: '#8b5cf6' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: item.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, fontSize: 18, flexShrink: 0 }}>
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{item.label}</div>
                        <div style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: 16, padding: 24, color: 'white' }}>
                  <div style={{ fontSize: 22, marginBottom: 10 }}>🚨</div>
                  <h4 style={{ fontWeight: 800, margin: '0 0 6px', fontSize: 16 }}>Medical Emergency?</h4>
                  <p style={{ opacity: 0.85, margin: '0 0 14px', fontSize: 13 }}>For immediate medical assistance, use our emergency alert system or call directly.</p>
                  <a href={`tel:${settings.contact_phone || '911'}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white', padding: '10px 20px', borderRadius: 8,
                    textDecoration: 'none', fontWeight: 700, fontSize: 14
                  }}>
                    <FaPhone /> Call Now
                  </a>
                </div>
              </div>

              {/* Contact Form */}
              <div style={{ background: 'white', borderRadius: 24, padding: 36, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>
                {sent ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                    <h3 style={{ fontWeight: 800, fontSize: 22, color: '#10b981', margin: '0 0 8px' }}>Message Sent!</h3>
                    <p style={{ color: '#64748b', fontSize: 14 }}>We'll get back to you within 24 hours.</p>
                    <button onClick={() => setSent(false)} style={{ marginTop: 16, background: 'none', border: '2px solid #667eea', color: '#667eea', padding: '10px 24px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                      Send Another
                    </button>
                  </div>
                ) : (
                  <form onSubmit={sendContact}>
                    <h3 style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', margin: '0 0 24px' }}>Send a Message</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      {[
                        { label: 'Your Name', key: 'name', type: 'text', placeholder: 'John Doe' },
                        { label: 'Email Address', key: 'email', type: 'email', placeholder: 'john@university.edu' },
                      ].map(field => (
                        <div key={field.key}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>{field.label}</label>
                          <input type={field.type} placeholder={field.placeholder}
                            value={contactForm[field.key]}
                            onChange={e => setContactForm(p => ({ ...p, [field.key]: e.target.value }))}
                            required style={{
                              width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb',
                              borderRadius: 10, fontSize: 14, outline: 'none',
                              fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                              transition: 'border-color 0.2s'
                            }}
                            onFocus={e => e.target.style.borderColor = '#667eea'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                        </div>
                      ))}
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Subject</label>
                      <input type="text" placeholder="How can we help you?"
                        value={contactForm.subject}
                        onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))}
                        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                        onFocus={e => e.target.style.borderColor = '#667eea'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Message</label>
                      <textarea placeholder="Write your message here..."
                        value={contactForm.message} required rows={5}
                        onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', resize: 'vertical', minHeight: 120, transition: 'border-color 0.2s' }}
                        onFocus={e => e.target.style.borderColor = '#667eea'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                    </div>
                    <button type="submit" disabled={sending} style={{
                      width: '100%', padding: '14px', borderRadius: 10,
                      background: 'linear-gradient(135deg,#667eea,#764ba2)',
                      color: 'white', border: 'none', fontWeight: 700, fontSize: 15,
                      cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.8 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      boxShadow: '0 6px 20px rgba(102,126,234,0.4)', transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      <FaPaperPlane style={{ fontSize: 14 }} />
                      {sending ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={{ background: '#0a0f1e', color: 'rgba(255,255,255,0.65)', padding: '48px 5% 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                {uniLogo
                  ? <img src={uniLogo} alt="logo" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                  : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏥</div>
                }
                <div>
                  <div style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>{uniName}</div>
                  <div style={{ fontSize: 10, color: '#667eea', fontWeight: 600, letterSpacing: 1 }}>MEDICAL CENTER</div>
                </div>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 280, margin: 0 }}>
                Providing comprehensive healthcare services to the university community with compassion and excellence.
              </p>
            </div>
            {[
              { title: 'Quick Links', links: [{ label: 'Home', id: 'home' }, { label: 'Services', id: 'services' }, { label: 'Our Doctors', id: 'doctors' }, { label: 'About Us', id: 'about' }] },
              { title: 'Services', links: [{ label: 'Book Appointment', id: 'services' }, { label: 'Telemedicine', id: 'services' }, { label: 'Pharmacy', id: 'services' }, { label: 'Emergency', id: 'services' }] },
              { title: 'Contact', links: [{ label: settings.contact_phone || '+1-555-0100', id: 'contact' }, { label: settings.contact_email || 'medical@university.edu', id: 'contact' }, { label: 'Get Directions', id: 'contact' }] },
            ].map((col, i) => (
              <div key={i}>
                <h4 style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{col.title}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map((l, j) => (
                    <button key={j} onClick={() => scrollTo(l.id)} style={{
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)',
                      fontSize: 13, cursor: 'pointer', textAlign: 'left', padding: 0,
                      transition: 'color 0.2s', fontFamily: 'Inter, sans-serif'
                    }}
                    onMouseEnter={e => e.target.style.color = '#667eea'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13 }}>
              © {new Date().getFullYear()} {uniName}. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: 20 }}>
              <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Sign In</button>
              <button onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: '#667eea', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Register</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-8px)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.6} }
        @media(max-width:768px){
          .desktop-nav{display:none!important}
          .mobile-hamburger{display:flex!important}
          section > div > div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}
          section > div > div[style*="grid-template-columns: 1fr 1.4fr"]{grid-template-columns:1fr!important}
          section > div > div[style*="grid-template-columns: 2fr 1fr 1fr 1fr"]{grid-template-columns:1fr 1fr!important}
        }
        @media(max-width:480px){
          section > div > div[style*="grid-template-columns: 2fr 1fr 1fr 1fr"]{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  );
};

export default Landing;