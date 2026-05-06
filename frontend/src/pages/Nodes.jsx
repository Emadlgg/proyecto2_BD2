import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit, X, RefreshCw } from 'lucide-react';

const API = 'http://localhost:3000/api';

// Formatea cualquier valor de Neo4j (fechas, enteros, booleanos, arrays)
const fmt = (v) => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (Array.isArray(v)) return v.join(', ');
  // Neo4j Integer: { low, high }
  if (typeof v === 'object' && 'low' in v && 'high' in v) return v.low;
  // Neo4j Date: { year, month, day }
  if (typeof v === 'object' && 'year' in v) {
    const y = fmt(v.year), m = String(fmt(v.month)).padStart(2,'0'), d = String(fmt(v.day)).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

const ENTITIES = {
  suppliers: {
    label: 'Proveedores', idField: 'supplierId', endpoint: `${API}/suppliers`,
    color: '#38bdf8', bulkField: 'country', bulkLabel: 'País',
    supports2Labels: true, secondLabel: 'PreferredSupplier',
    fields: [
      { key: 'supplierId', label: 'ID', required: true },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'country', label: 'País', required: true },
      { key: 'rating', label: 'Rating', type: 'number', required: true },
      { key: 'isActive', label: 'Activo', type: 'boolean' },
      { key: 'certifications', label: 'Certificaciones (sep ;)', placeholder: 'ISO9001;ISO14001' },
      { key: 'joinedDate', label: 'Fecha Ingreso', type: 'date', required: true },
    ],
  },
  components: {
    label: 'Componentes', idField: 'componentId', endpoint: `${API}/components`,
    color: '#facc15', bulkField: 'category', bulkLabel: 'Categoría',
    fields: [
      { key: 'componentId', label: 'ID', required: true },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'category', label: 'Categoría', required: true },
      { key: 'material', label: 'Material', required: true },
      { key: 'unitWeight', label: 'Peso', type: 'number', required: true },
      { key: 'isHazardous', label: 'Peligroso', type: 'boolean' },
      { key: 'manufactureDate', label: 'Fecha Fabr.', type: 'date', required: true },
    ],
  },
  manufacturers: {
    label: 'Fabricantes', idField: 'manufacturerId', endpoint: `${API}/manufacturers`,
    color: '#a78bfa', bulkField: 'region', bulkLabel: 'Región',
    fields: [
      { key: 'manufacturerId', label: 'ID', required: true },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'region', label: 'Región', required: true },
      { key: 'foundedYear', label: 'Año Fundación', type: 'number', required: true },
      { key: 'rating', label: 'Rating', type: 'number', required: true },
      { key: 'isActive', label: 'Activo', type: 'boolean' },
      { key: 'complianceList', label: 'Cumplimiento (sep ;)', placeholder: 'ISO9001;REACH' },
    ],
  },
  products: {
    label: 'Productos', idField: 'productId', endpoint: `${API}/products`,
    color: '#34d399', bulkField: 'description', bulkLabel: 'Descripción',
    fields: [
      { key: 'productId', label: 'ID', required: true },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'description', label: 'Descripción', required: true },
      { key: 'launchDate', label: 'Fecha Lanz.', type: 'date', required: true },
      { key: 'isDiscontinued', label: 'Descontinuado', type: 'boolean' },
      { key: 'dimensions', label: 'Dimensiones', placeholder: '10x20x30' },
    ],
  },
  'distribution-centers': {
    label: 'Centros Dist.', idField: 'centerId', endpoint: `${API}/distribution-centers`,
    color: '#fb923c', bulkField: 'location', bulkLabel: 'Ubicación',
    fields: [
      { key: 'centerId', label: 'ID', required: true },
      { key: 'location', label: 'Ubicación', required: true },
      { key: 'capacity', label: 'Capacidad', type: 'number', required: true },
      { key: 'isActive', label: 'Activo', type: 'boolean' },
      { key: 'openedDate', label: 'Fecha Apert.', type: 'date', required: true },
      { key: 'contactEmail', label: 'Email', type: 'email' },
    ],
  },
  retailers: {
    label: 'Minoristas', idField: 'retailerId', endpoint: `${API}/retailers`,
    color: '#f472b6', bulkField: 'city', bulkLabel: 'Ciudad',
    fields: [
      { key: 'retailerId', label: 'ID', required: true },
      { key: 'storeName', label: 'Nombre Tienda', required: true },
      { key: 'city', label: 'Ciudad', required: true },
      { key: 'type', label: 'Tipo', placeholder: 'Supermarket' },
      { key: 'isActive', label: 'Activo', type: 'boolean' },
      { key: 'rating', label: 'Rating', type: 'number', required: true },
    ],
  },
};

const emptyForm = (fields) => Object.fromEntries(fields.map(f => [f.key, f.type === 'boolean' ? false : '']));

const Field = ({ f, value, onChange }) => {
  if (f.type === 'boolean') return (
    <div className="check-row">
      <input type="checkbox" id={f.key} checked={!!value} onChange={e => onChange(e.target.checked)} />
      <label htmlFor={f.key}>{f.label}</label>
    </div>
  );
  return (
    <input
      type={f.type || 'text'}
      step={f.type === 'number' ? 'any' : undefined}
      className="form-input"
      value={value ?? ''}
      placeholder={f.placeholder || ''}
      onChange={e => onChange(e.target.value)}
    />
  );
};

export default function Nodes() {
  const [tab, setTab] = useState('suppliers');
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [addForm, setAddForm] = useState({});
  const [editForm, setEditForm] = useState({});
  const [editId, setEditId] = useState('');
  const [use2Labels, setUse2Labels] = useState(false);
  const [bulkVal, setBulkVal] = useState('');
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const cfg = ENTITIES[tab];

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(cfg.endpoint);
      const d = await r.json();
      setNodes(Array.isArray(d) ? d : []);
    } catch { setNodes([]); }
    setLoading(false);
  };

  useEffect(() => { setSearch(''); setAddForm(emptyForm(cfg.fields)); load(); }, [tab]);

  const doAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    const url = use2Labels && cfg.supports2Labels ? `${cfg.endpoint}/preferred` : cfg.endpoint;
    const body = { ...addForm };
    cfg.fields.forEach(f => {
      if (f.type === 'number') body[f.key] = parseFloat(body[f.key]) || 0;
      if (f.type === 'boolean') body[f.key] = !!body[f.key];
    });
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (r.ok) { 
        flash('Nodo creado exitosamente'); 
        setShowAdd(false); 
        setAddForm(emptyForm(cfg.fields)); 
        load(); 
      } else {
        flash('Error al crear el nodo', 'error');
      }
    } catch {
      flash('Error de conexión', 'error');
    }
    setSaving(false);
  };

  const doEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = { ...editForm, labels: use2Labels ? [cfg.secondLabel] : [] };
    delete body[cfg.idField];
    cfg.fields.forEach(f => {
      if (f.type === 'number' && body[f.key]) body[f.key] = parseFloat(body[f.key]) || 0;
      if (f.type === 'boolean') body[f.key] = !!body[f.key];
    });
    try {
      const r = await fetch(`${cfg.endpoint}/${editId}/properties`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (r.ok) { 
        flash('Nodo actualizado exitosamente'); 
        setShowEdit(false); 
        load(); 
      } else {
        flash('Error al actualizar', 'error');
      }
    } catch {
      flash('Error de conexión', 'error');
    }
    setSaving(false);
  };

  const doDelete = async (id) => {
    if (!confirm(`¿Eliminar ${id}?`)) return;
    await fetch(`${cfg.endpoint}/${id}`, { method: 'DELETE' });
    flash('Nodo eliminado'); load();
  };

  const doDeleteProp = async (id) => {
    const prop = cfg.fields.find(f => f.key !== cfg.idField && f.type !== 'boolean')?.key;
    if (!prop || !confirm(`¿Eliminar propiedad "${prop}" de ${id}?`)) return;
    await fetch(`${cfg.endpoint}/${id}/properties`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: [prop] }) });
    flash(`Propiedad eliminada`); load();
  };

  const [bulkProp, setBulkProp] = useState('');
  const [bulkPropVal, setBulkPropVal] = useState('');

  const doBulkUpdate = async () => {
    if (!bulkVal.trim()) return flash('Ingresa el valor del filtro (ej. Guatemala)', 'error');
    if (!bulkProp) return flash('Selecciona una propiedad para actualizar', 'error');
    
    // Procesar valor según el tipo de campo
    const field = cfg.fields.find(f => f.key === bulkProp);
    let val = bulkPropVal;
    if (field?.type === 'number') val = parseFloat(val) || 0;
    if (field?.type === 'boolean') val = (val.toLowerCase() === 'true' || val === '1');

    const r = await fetch(`${cfg.endpoint}/bulk/by-${cfg.bulkField}`, { 
      method: 'PATCH', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ [cfg.bulkField]: bulkVal, [bulkProp]: val }) 
    });
    if (r.ok) { 
      const d = await r.json(); 
      flash(`✅ Se actualizaron ${d.updated} registros exitosamente`); 
      load(); 
    } else {
      flash('❌ Error al realizar la actualización masiva', 'error');
    }
  };

  const doBulkDelete = async () => {
    if (!bulkVal.trim() || !confirm(`¿Eliminar todos los registros donde ${cfg.bulkLabel || cfg.bulkField} sea "${bulkVal}"?`)) return;
    const r = await fetch(`${cfg.endpoint}/bulk/by-${cfg.bulkField}/${encodeURIComponent(bulkVal)}`, { method: 'DELETE' });
    if (r.ok) { const d = await r.json(); flash(`✅ ${d.deleted} nodos eliminados`); load(); }
  };

  const doBulkDeleteProp = async () => {
    if (!bulkVal.trim()) return flash('Ingresa el valor del filtro', 'error');
    if (!bulkProp) return flash('Selecciona la propiedad que deseas limpiar', 'error');
    
    if (!confirm(`¿Estás seguro de ELIMINAR la propiedad "${bulkProp}" de todos los registros de "${bulkVal}"?`)) return;

    const r = await fetch(`${cfg.endpoint}/bulk/properties`, { 
      method: 'DELETE', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ [cfg.bulkField]: bulkVal, fields: [bulkProp] }) 
    });
    if (r.ok) {
      flash('✅ Propiedades eliminadas en masa'); 
      load();
    }
  };

  const openEdit = (n) => {
    setEditId(n[cfg.idField]);
    setUse2Labels(n.labels?.includes(cfg.secondLabel) || false);
    // Preparamos los datos para el formulario (aplanar objetos de Neo4j)
    const prepared = {};
    Object.entries(n).forEach(([k, v]) => {
      if (k === 'labels') return;
      if (v && typeof v === 'object' && 'year' in v) {
        // Formato YYYY-MM-DD para <input type="date">
        const y = fmt(v.year), m = String(fmt(v.month)).padStart(2,'0'), d = String(fmt(v.day)).padStart(2,'0');
        prepared[k] = `${y}-${m}-${d}`;
      } else if (v && typeof v === 'object' && 'low' in v) {
        prepared[k] = v.low;
      } else {
        prepared[k] = v;
      }
    });
    setEditForm(prepared);
    setShowEdit(true);
  };

  const filtered = nodes.filter(n =>
    !search || Object.values(n).some(v => String(fmt(v)).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Entidades</h1>
          <p className="page-subtitle">Gestión de nodos del grafo</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setAddForm(emptyForm(cfg.fields)); setUse2Labels(false); setShowAdd(true); }}>
          <Plus size={15}/> Nuevo
        </button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {/* Tabs */}
      <div className="tabs">
        {Object.entries(ENTITIES).map(([key, e]) => (
          <button key={key} className={`tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>
            {e.label}
          </button>
        ))}
      </div>

      {/* Operaciones masivas */}
      <div className="section" style={{ borderLeft: '4px solid #38bdf8' }}>
        <div className="section-title">Operaciones Masivas — Filtrar por {cfg.bulkLabel || cfg.bulkField}</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>1. Valor del Filtro (ej. {cfg.bulkField === 'country' ? 'Guatemala' : 'Electronics'})</label>
            <input type="text" className="form-input" value={bulkVal} onChange={e => setBulkVal(e.target.value)} placeholder="Filtrar por..." />
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>2. Seleccionar Propiedad</label>
            <select className="form-input" value={bulkProp} onChange={e => setBulkProp(e.target.value)}>
              <option value="">-- Elegir propiedad --</option>
              {cfg.fields.filter(f => f.key !== cfg.idField).map(f => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>3. Nuevo Valor (o dejar vacío para eliminar)</label>
            <input type="text" className="form-input" value={bulkPropVal} onChange={e => setBulkPropVal(e.target.value)} placeholder="Nuevo valor..." />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={doBulkUpdate}>Actualizar Todos</button>
            <button className="btn btn-warning btn-sm" style={{ color: '#ef4444' }} onClick={doBulkDeleteProp}>Limpiar Propiedad</button>
            <button className="btn btn-danger btn-sm" onClick={doBulkDelete}>Eliminar Grupo</button>
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.75rem' }}>
          * Las actualizaciones masivas afectan a todos los nodos que coincidan con el filtro del paso 1.
        </p>
      </div>

      {/* Table */}
      <div className="card">
        <div className="toolbar">
          <div className="search-box">
            <Search size={14} className="search-icon" />
            <input type="text" className="form-input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13}/></button>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{filtered.length} registros</span>
        </div>

        {loading ? <div className="loader" /> : (() => {
          // Columnas dinámicas: usa las llaves del primer nodo real
          const sample = filtered[0];
          const dynCols = sample
            ? Object.keys(sample).filter(k => k !== cfg.idField && k !== 'labels').slice(0, 7)
            : cfg.fields.filter(f => f.key !== cfg.idField).slice(0, 7).map(f => f.key);
          return (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 120 }}>ID</th>
                    {dynCols.map(k => {
                      // Buscamos si existe un label para esta propiedad en la config
                      const field = cfg.fields.find(f => f.key === k);
                      return <th key={k}>{field ? field.label : k}</th>;
                    })}
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={dynCols.length + 2} className="empty">No hay registros</td></tr>
                  )}
                  {filtered.slice(0, 20).map((n, i) => {
                    const id = fmt(n[cfg.idField]) ?? `#${i}`;
                    return (
                      <tr key={i}>
                        <td>
                          <div style={{ color: cfg.color, fontWeight: 600, fontSize: '0.85rem' }}>{id}</div>
                          {n.labels?.includes(cfg.secondLabel) && (
                            <div style={{ fontSize: '0.65rem', background: 'rgba(52,211,153,0.1)', color: '#34d399', padding: '1px 4px', borderRadius: '4px', display: 'inline-block', marginTop: '2px' }}>
                              Preferred
                            </div>
                          )}
                        </td>
                        {dynCols.map(k => {
                          const v = n[k];
                          const isBool = typeof v === 'boolean' || (typeof v === 'string' && (v === 'true' || v === 'false'));
                          return (
                            <td key={k}>
                              {isBool
                                ? <span className={`badge ${v === true || v === 'true' ? 'badge-green' : 'badge-yellow'}`}>{v === true || v === 'true' ? 'sí' : 'no'}</span>
                                : String(fmt(v)).slice(0, 32)}
                            </td>
                          );
                        })}
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(n)}>
                              <Edit size={13}/>
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => doDelete(n[cfg.idField])}>
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length > 20 && (
                <div style={{ padding: '0.65rem 1rem', fontSize: '0.8rem', color: '#6b7280', borderTop: '1px solid #374151' }}>
                  Mostrando 20 de {filtered.length} — usa el buscador para filtrar
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <div className="modal-title">
              Crear {cfg.label.slice(0, -1)}
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}><X size={14}/></button>
            </div>
            <form onSubmit={doAdd}>
              {cfg.fields.map(f => (
                <div className="form-group" key={f.key}>
                  {f.type !== 'boolean' && <label className="form-label">{f.label}</label>}
                  <Field f={f} value={addForm[f.key]} onChange={v => setAddForm(p => ({ ...p, [f.key]: v }))} />
                </div>
              ))}
              {cfg.supports2Labels && (
                <div className="check-row" style={{ marginBottom: '1rem' }}>
                  <input type="checkbox" id="lbl2" checked={use2Labels} onChange={e => setUse2Labels(e.target.checked)} />
                  <label htmlFor="lbl2">Agregar label extra: <b>{cfg.secondLabel}</b></label>
                </div>
              )}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
                {saving ? 'Procesando...' : 'Crear'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="modal">
            <div className="modal-title">
              Editar — {editId}
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(false)}><X size={14}/></button>
            </div>
            <form onSubmit={doEdit}>
              {cfg.fields.filter(f => f.key !== cfg.idField).map(f => (
                <div className="form-group" key={f.key}>
                  {f.type !== 'boolean' && <label className="form-label">{f.label}</label>}
                  <Field f={f} value={editForm[f.key]} onChange={v => setEditForm(p => ({ ...p, [f.key]: v }))} />
                </div>
              ))}
              {cfg.supports2Labels && (
                <div className="check-row" style={{ marginBottom: '1rem' }}>
                  <input type="checkbox" id="lbl2edit" checked={use2Labels} onChange={e => setUse2Labels(e.target.checked)} />
                  <label htmlFor="lbl2edit">Label extra: <b>{cfg.secondLabel}</b></label>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Procesando...' : 'Guardar'}
                </button>
                <button type="button" className="btn btn-warning" style={{ flex: 1 }} onClick={() => { doDeleteProp(editId); setShowEdit(false); }}>
                  Eliminar propiedad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
