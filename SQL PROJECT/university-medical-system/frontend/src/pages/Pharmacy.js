import React, { useEffect, useState } from 'react';
import { FaPills, FaSearch, FaExclamationTriangle, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Pharmacy = () => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [editingMed, setEditingMed] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => { fetchMedicines(); }, []);

  const fetchMedicines = () => {
    api.get('/api/pharmacy/medicines')
      .then(r => setMedicines(r.data.data || []))
      .catch(() => toast.error('Failed to load medicines'))
      .finally(() => setLoading(false));
  };

  const startEdit = (med) => {
    setEditingMed(med.medicine_id);
    setEditForm({ ...med });
  };

  const saveEdit = async () => {
    try {
      await api.put(`/api/admin/medicines/${editingMed}`, editForm);
      toast.success('Medicine updated!');
      setEditingMed(null);
      fetchMedicines();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const categories = [...new Set(medicines.map(m => m.category).filter(Boolean))];

  const filtered = medicines.filter(m => {
    const matchSearch = !search ||
      m.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.brand_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || m.category === category;
    return matchSearch && matchCat;
  });

  const lowStock = medicines.filter(m => m.current_stock < m.minimum_stock).length;

  const getStockStatus = (m) => {
    if (m.current_stock === 0) return { label: 'Out of Stock', color: '#ef4444', pct: 0 };
    if (m.current_stock < m.minimum_stock) return { label: 'Low Stock', color: '#f59e0b', pct: Math.min(50, (m.current_stock / m.minimum_stock) * 50) };
    return { label: 'In Stock', color: '#10b981', pct: Math.min(100, (m.current_stock / (m.minimum_stock * 3)) * 100) };
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header-gradient" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>💊 Pharmacy</h1>
          <p>{medicines.length} medicines available · {lowStock} low stock alerts</p>
        </div>
        {lowStock > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(239,68,68,0.2)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.4)' }}>
            <FaExclamationTriangle style={{ color: '#fca5a5' }} />
            <span style={{ color: '#fca5a5', fontSize: 13, fontWeight: 600 }}>{lowStock} medicines need restocking</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Medicines', value: medicines.length, color: 'linear-gradient(135deg,#667eea,#764ba2)', icon: '💊' },
          { label: 'In Stock', value: medicines.filter(m => m.current_stock >= m.minimum_stock).length, color: 'linear-gradient(135deg,#10b981,#059669)', icon: '✅' },
          { label: 'Low Stock', value: medicines.filter(m => m.current_stock > 0 && m.current_stock < m.minimum_stock).length, color: 'linear-gradient(135deg,#f59e0b,#d97706)', icon: '⚠️' },
          { label: 'Out of Stock', value: medicines.filter(m => m.current_stock === 0).length, color: 'linear-gradient(135deg,#ef4444,#dc2626)', icon: '❌' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.color, fontSize: 22 }}>{s.icon}</div>
            <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-wrapper" style={{ flex: 1 }}>
          <FaSearch className="search-icon" />
          <input className="search-input" placeholder="Search medicines by name or brand..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto' }}
          value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Admin hint */}
      {user?.role === 'admin' && (
        <div style={{ padding: '10px 14px', background: 'rgba(102,126,234,0.08)', borderRadius: 10, marginBottom: 16, fontSize: 13, color: 'var(--primary)', border: '1px solid rgba(102,126,234,0.2)' }}>
          💡 <strong>Admin tip:</strong> Click the ✏️ edit button on any medicine card to update name, brand, quantity, price or description.
        </div>
      )}

      {/* Medicine Grid */}
      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="icon"><FaPills /></div>
          <h3>No medicines found</h3>
        </div></div>
      ) : (
        <div className="pharmacy-grid">
          {filtered.map(m => {
            const stock = getStockStatus(m);
            const isEditing = editingMed === m.medicine_id;
            return (
              <div key={m.medicine_id} className="medicine-card" style={{ position: 'relative' }}>
                {/* Edit button for admin */}
                {user?.role === 'admin' && !isEditing && (
                  <button onClick={() => startEdit(m)} style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'rgba(102,126,234,0.1)', border: '1px solid rgba(102,126,234,0.2)',
                    borderRadius: 8, width: 30, height: 30, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--primary)', fontSize: 13, transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--primary)' && (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(102,126,234,0.1)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  title="Edit medicine">
                    <FaEdit />
                  </button>
                )}

                {isEditing ? (
                  /* Edit Mode */
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>✏️ Editing</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-success" onClick={saveEdit}><FaCheck /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => setEditingMed(null)}><FaTimes /></button>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <label className="form-label" style={{ fontSize: 11 }}>Generic Name</label>
                      <input type="text" className="form-input" style={{ padding: '6px 10px', fontSize: 12 }}
                        value={editForm.generic_name || ''} onChange={e => setEditForm(p => ({ ...p, generic_name: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <label className="form-label" style={{ fontSize: 11 }}>Brand Name</label>
                      <input type="text" className="form-input" style={{ padding: '6px 10px', fontSize: 12 }}
                        value={editForm.brand_name || ''} onChange={e => setEditForm(p => ({ ...p, brand_name: e.target.value }))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>Stock</label>
                        <input type="number" className="form-input" style={{ padding: '6px 10px', fontSize: 12 }}
                          value={editForm.current_stock || 0} onChange={e => setEditForm(p => ({ ...p, current_stock: e.target.value }))} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>Min Stock</label>
                        <input type="number" className="form-input" style={{ padding: '6px 10px', fontSize: 12 }}
                          value={editForm.minimum_stock || 0} onChange={e => setEditForm(p => ({ ...p, minimum_stock: e.target.value }))} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>Price ($)</label>
                        <input type="number" step="0.01" className="form-input" style={{ padding: '6px 10px', fontSize: 12 }}
                          value={editForm.selling_price || 0} onChange={e => setEditForm(p => ({ ...p, selling_price: e.target.value }))} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>Category</label>
                        <input type="text" className="form-input" style={{ padding: '6px 10px', fontSize: 12 }}
                          value={editForm.category || ''} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 11 }}>Description</label>
                      <textarea className="form-textarea" style={{ padding: '6px 10px', fontSize: 12, minHeight: 60 }}
                        value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'linear-gradient(135deg,#667eea,#764ba2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 22, marginBottom: 12
                    }}>💊</div>
                    <h3>{m.generic_name}</h3>
                    <p className="brand">{m.brand_name || 'Generic'}</p>
                    {m.category && (
                      <span className="badge" style={{ background: 'rgba(102,126,234,0.1)', color: 'var(--primary)', marginBottom: 10, display: 'inline-block' }}>
                        {m.category}
                      </span>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Stock Level</span>
                      <span className="badge" style={{ background: stock.color + '22', color: stock.color, fontSize: 11 }}>
                        {stock.label}
                      </span>
                    </div>
                    <div className="stock-bar">
                      <div className="stock-fill" style={{ width: `${stock.pct}%`, background: stock.color }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {m.current_stock} / {m.minimum_stock} min {m.unit}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                        ${Number(m.selling_price).toFixed(2)}
                      </span>
                    </div>
                    {m.description && (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
                        {m.description}
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Pharmacy;
