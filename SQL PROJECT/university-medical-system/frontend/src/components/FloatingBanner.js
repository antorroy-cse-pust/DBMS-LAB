import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaExternalLinkAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const typeStyles = {
  info:       { bg: 'linear-gradient(135deg,#3b82f6,#2563eb)', icon: 'ℹ️' },
  warning:    { bg: 'linear-gradient(135deg,#f59e0b,#d97706)', icon: '⚠️' },
  success:    { bg: 'linear-gradient(135deg,#10b981,#059669)', icon: '✅' },
  campaign:   { bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', icon: '📢' },
  health_tip: { bg: 'linear-gradient(135deg,#06b6d4,#0891b2)', icon: '💡' },
  emergency:  { bg: 'linear-gradient(135deg,#ef4444,#dc2626)', icon: '🚨' },
};

const FloatingBanner = () => {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/banners').then(r => {
      const data = r.data.data || [];
      if (data.length > 0) setBanners(data);
    }).catch(() => {});
  }, []);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent(p => (p + 1) % banners.length);
        setVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  if (dismissed || banners.length === 0) return null;

  const banner = banners[current];
  const style = typeStyles[banner.banner_type] || typeStyles.info;

  const goTo = dir => {
    setVisible(false);
    setTimeout(() => {
      setCurrent(p => (p + dir + banners.length) % banners.length);
      setVisible(true);
    }, 300);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 999, width: '90%', maxWidth: 680,
      transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(16px)',
    }}>
      <div style={{
        background: style.bg,
        borderRadius: 16, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(10px)',
      }}>
        {/* Icon */}
        <span style={{ fontSize: 22, flexShrink: 0 }}>{style.icon}</span>

        {/* Message */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            color: 'white', fontSize: 13.5, fontWeight: 500,
            margin: 0, lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {banner.message}
          </p>
          {banners.length > 1 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              {banners.map((_, i) => (
                <div key={i} onClick={() => { setVisible(false); setTimeout(() => { setCurrent(i); setVisible(true); }, 300); }}
                  style={{
                    width: i === current ? 20 : 6, height: 6,
                    borderRadius: 3, cursor: 'pointer',
                    background: i === current ? 'white' : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.3s'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Link button */}
        {banner.link && (
          <button onClick={() => navigate(banner.link)} style={{
            background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 8, padding: '6px 12px', color: 'white',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
            View <FaExternalLinkAlt style={{ fontSize: 10 }} />
          </button>
        )}

        {/* Prev/Next */}
        {banners.length > 1 && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button onClick={() => goTo(-1)} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: 8, width: 28, height: 28, cursor: 'pointer',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11
            }}><FaChevronLeft /></button>
            <button onClick={() => goTo(1)} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: 8, width: 28, height: 28, cursor: 'pointer',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11
            }}><FaChevronRight /></button>
          </div>
        )}

        {/* Dismiss */}
        <button onClick={() => setDismissed(true)} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: 8, width: 28, height: 28, cursor: 'pointer',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, flexShrink: 0
        }}><FaTimes /></button>
      </div>
    </div>
  );
};

export default FloatingBanner;
