import React, { useState } from 'react';
import { Share2, Plus, Edit3, Trash2, Link as LinkIcon, Unlink, Eye } from 'lucide-react';

const API = 'http://localhost:3000/api/relationships';

// ─── Config de los 10 tipos de relaciones ──────────────────────────────────
const REL_TYPES = [
  {
    key: 'supplies', label: 'SUMINISTRA', color: '#6366f1',
    desc: 'Proveedor → Componente',
    fields: [
      { key: 'supplierId', label: 'ID Proveedor', placeholder: 'SUP1' },
      { key: 'componentId', label: 'ID Componente', placeholder: 'CMP1' },
      { key: 'unitPrice', label: 'Precio Unitario', type: 'number' },
      { key: 'leadTimeDays', label: 'Días de Entrega', type: 'number' },
      { key: 'contractEnd', label: 'Fin Contrato', type: 'date' },
    ],
  },
  {
    key: 'ships-to', label: 'ENVÍA_A', color: '#10b981',
    desc: 'Centro Dist. → Minorista',
    fields: [
      { key: 'centerId', label: 'ID Centro', placeholder: 'DC1' },
      { key: 'retailerId', label: 'ID Minorista', placeholder: 'RET1' },
      { key: 'avgDeliveryDays', label: 'Días Entrega Promedio', type: 'number' },
      { key: 'shippingCost', label: 'Costo de Envío', type: 'number' },
      { key: 'route', label: 'Ruta', type: 'select', options: ['Terrestre', 'Aérea', 'Marítima'] },
    ],
  },
  {
    key: 'requires', label: 'REQUIERE', color: '#f59e0b',
    desc: 'Producto → Componente',
    fields: [
      { key: 'productId', label: 'ID Producto', placeholder: 'PROD1' },
      { key: 'componentId', label: 'ID Componente', placeholder: 'CMP1' },
      { key: 'quantity', label: 'Cantidad', type: 'number' },
      { key: 'isCritical', label: 'Es Crítico', type: 'select', options: ['sí', 'no'] },
      { key: 'specification', label: 'Especificación', placeholder: 'Estándar' },
    ],
  },
  {
    key: 'manufactures', label: 'FABRICA', color: '#ec4899',
    desc: 'Fabricante → Producto',
    fields: [
      { key: 'manufacturerId', label: 'ID Fabricante', placeholder: 'MAN1' },
      { key: 'productId', label: 'ID Producto', placeholder: 'PROD1' },
      { key: 'unitsPerDay', label: 'Unidades/Día', type: 'number' },
      { key: 'startDate', label: 'Fecha Inicio', type: 'date' },
      { key: 'qualityScore', label: 'Score Calidad', type: 'number' },
    ],
  },
  {
    key: 'sources-from', label: 'SE_ORIGINA_EN', color: '#8b5cf6',
    desc: 'Fabricante → Proveedor',
    fields: [
      { key: 'manufacturerId', label: 'ID Fabricante', placeholder: 'MAN1' },
      { key: 'supplierId', label: 'ID Proveedor', placeholder: 'SUP1' },
      { key: 'annualVolume', label: 'Volumen Anual', type: 'number' },
      { key: 'since', label: 'Desde', type: 'date' },
      { key: 'preferredSupplier', label: 'Proveedor Preferido', type: 'select', options: ['sí', 'no'] },
    ],
  },
  {
    key: 'receives-from', label: 'RECIBE_DE', color: '#06b6d4',
    desc: 'Centro Dist. → Fabricante',
    fields: [
      { key: 'centerId', label: 'ID Centro', placeholder: 'DC1' },
      { key: 'manufacturerId', label: 'ID Fabricante', placeholder: 'MAN1' },
      { key: 'frequency', label: 'Frecuencia', type: 'select', options: ['Diario', 'Semanal', 'Mensual'] },
      { key: 'lastDelivery', label: 'Última Entrega', type: 'date' },
      { key: 'batchSize', label: 'Tamaño Lote', type: 'number' },
    ],
  },
  {
    key: 'sells', label: 'VENDE', color: '#f97316',
    desc: 'Minorista → Producto',
    fields: [
      { key: 'retailerId', label: 'ID Minorista', placeholder: 'RET1' },
      { key: 'productId', label: 'ID Producto', placeholder: 'PROD1' },
      { key: 'sellingPrice', label: 'Precio Venta', type: 'number' },
      { key: 'monthlySales', label: 'Ventas Mensuales', type: 'number' },
      { key: 'isExclusive', label: 'Es Exclusivo', type: 'select', options: ['sí', 'no'] },
    ],
  },
  {
    key: 'rejects', label: 'RECHAZA', color: '#ef4444',
    desc: 'Fabricante → Componente',
    fields: [
      { key: 'manufacturerId', label: 'ID Fabricante', placeholder: 'MAN1' },
      { key: 'componentId', label: 'ID Componente', placeholder: 'CMP1' },
      { key: 'reason', label: 'Razón', placeholder: 'Defecto' },
      { key: 'rejectDate', label: 'Fecha Rechazo', type: 'date' },
      { key: 'batchNumber', label: 'Número Lote', placeholder: 'LOTE-001' },
    ],
  },
  {
    key: 'promotes', label: 'PROMUEVE', color: '#84cc16',
    desc: 'Minorista → Producto',
    fields: [
      { key: 'retailerId', label: 'ID Minorista', placeholder: 'RET1' },
      { key: 'productId', label: 'ID Producto', placeholder: 'PROD1' },
      { key: 'campaignName', label: 'Nombre Campaña', placeholder: 'Oferta Verano' },
      { key: 'budget', label: 'Presupuesto', type: 'number' },
      { key: 'startDate', label: 'Fecha Inicio', type: 'date' },
    ],
  },
  {
    key: 'audits', label: 'AUDITA', color: '#a855f7',
    desc: 'Centro Dist. → Proveedor',
    fields: [
      { key: 'centerId', label: 'ID Centro', placeholder: 'DC1' },
      { key: 'supplierId', label: 'ID Proveedor', placeholder: 'SUP1' },
      { key: 'auditorName', label: 'Nombre Auditor', placeholder: 'Juan Pérez' },
      { key: 'auditDate', label: 'Fecha Auditoría', type: 'date' },
      { key: 'passed', label: 'Pasó Auditoría', type: 'select', options: ['sí', 'no'] },
    ],
  },
];

const emptyForm = (fields) => Object.fromEntries(fields.map(f => [f.key, '']));

const FieldInput = ({ field, value, onChange }) => {
  if (field.type === 'select') return (
    <select className="form-input form-select" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">-- Seleccionar --</option>
      {field.options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  return <input type={field.type || 'text'} step={field.type === 'number' ? 'any' : undefined} className="form-input" value={value || ''} placeholder={field.placeholder || ''} onChange={e => onChange(e.target.value)} required/>;
};

const Relationships = () => {
  const [activeTab, setActiveTab] = useState('supplies');
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState({});
  const [updateForm, setUpdateForm] = useState({});
  const [deleteIds, setDeleteIds] = useState({});
  const [bulkRoute, setBulkRoute] = useState('Ground');
  const [message, setMessage] = useState('');

  const cfg = REL_TYPES.find(r => r.key === activeTab);

  const showMsg = (m) => { setMessage(m); setTimeout(() => setMessage(''), 5000); };

  React.useEffect(() => {
    setCreateForm(emptyForm(cfg.fields));
    setUpdateForm({});
    setDeleteIds({});
    fetchRelationships();
  }, [activeTab]);

  const fetchRelationships = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setRelationships(Array.isArray(data) ? data : []);
      } else {
        setRelationships([]);
      }
    } catch { 
      setRelationships([]);
    } finally { 
      setLoading(false); 
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const body = { ...createForm };
    cfg.fields.forEach(f => {
      if (f.type === 'number') body[f.key] = parseFloat(body[f.key]) || 0;
      if (f.type === 'select' && (body[f.key] === 'true' || body[f.key] === 'false')) body[f.key] = body[f.key] === 'true';
    });
    const res = await fetch(`${API}/${cfg.key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { showMsg(`✅ Relación ${cfg.label} creada exitosamente`); setCreateForm(emptyForm(cfg.fields)); fetchRelationships(); }
    else showMsg('❌ Error: verifica que los IDs existan en la BD');
  };

  const handleIndividualUpdate = async (e) => {
    e.preventDefault();
    const { id1, id2, ...props } = updateForm;
    if (!id1 || !id2) return showMsg('❌ Ingresa ambos IDs');
    
    // Convert numerical values
    const processedProps = {};
    Object.entries(props).forEach(([k, v]) => {
      const field = cfg.fields.find(f => f.key === k);
      if (field && field.type === 'number') processedProps[k] = parseFloat(v) || 0;
      else processedProps[k] = v;
    });

    const res = await fetch(`${API}/${cfg.key}/${id1}/${id2}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(processedProps)
    });

    if (res.ok) {
      showMsg(`✅ Relación ${cfg.label} actualizada`);
      fetchRelationships();
    } else {
      showMsg('❌ No se encontró la relación o error en el servidor');
    }
  };

  const handleDeleteSingle = async () => {
    const { id1, id2 } = deleteIds;
    if (!id1 || !id2) return showMsg('❌ Ingresa ambos IDs');
    if (!window.confirm('¿Eliminar esta relación de forma permanente?')) return;
    
    const res = await fetch(`${API}/${cfg.key}/${id1}/${id2}`, { method: 'DELETE' });
    if (res.ok) {
      showMsg('✅ Relación eliminada exitosamente');
      fetchRelationships();
    } else {
      showMsg('❌ No se encontró la relación');
    }
  };

  const handleBulkUpdate = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/ships-to/bulk/by-route`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ route: bulkRoute, shippingCost: 99.99 }) });
    if (res.ok) { const d = await res.json(); showMsg(`✅ Se actualizaron ${d.updated} relaciones SHIPS_TO`); fetchRelationships(); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`¿Eliminar TODAS las relaciones SHIPS_TO con ruta ${bulkRoute}?`)) return;
    const res = await fetch(`${API}/ships-to/bulk/by-route/${encodeURIComponent(bulkRoute)}`, { method: 'DELETE' });
    if (res.ok) { const d = await res.json(); showMsg(`✅ Se eliminaron ${d.deleted} relaciones`); fetchRelationships(); }
  };

  const handleBulkDeleteProp = async () => {
    if (!window.confirm(`¿Eliminar la propiedad shippingCost de TODAS las SHIPS_TO con ruta ${bulkRoute}?`)) return;
    const res = await fetch(`${API}/ships-to/bulk/properties`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ route: bulkRoute, fields: ['shippingCost'] }) });
    if (res.ok) { showMsg('✅ Propiedades eliminadas masivamente'); fetchRelationships(); }
  };

  const formatPropVal = (v) => {
    if (v === null || v === undefined) return <em style={{ color: 'var(--text-muted)' }}>null</em>;
    if (typeof v === 'object' && v.year) return `${v.year.low || v.year}-${v.month.low || v.month}-${v.day.low || v.day}`;
    if (typeof v === 'object' && v.low !== undefined) return v.low;
    return String(v);
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Relaciones</h1>
          <p className="page-subtitle">Gestión de conexiones entre entidades del grafo</p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{message}</div>
      )}

      {/* Tabla de relaciones existentes */}
      <div className="section" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title">Vista Previa de Conexiones (Muestra)</div>
        {loading ? <div className="loader"/> : (
          <div className="table-wrap" style={{ maxHeight: '260px', overflowY: 'auto' }}>
            <table>
              <thead><tr><th>Origen</th><th>Tipo</th><th>Destino</th><th>Propiedades</th></tr></thead>
              <tbody>
                {relationships.length === 0
                  ? <tr><td colSpan="4" className="empty">No hay relaciones registradas en esta vista</td></tr>
                  : relationships.map((rel, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{rel.source}</td>
                      <td><span className="badge badge-blue">{rel.type}</span></td>
                      <td>{rel.target}</td>
                      <td style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                        {Object.entries(rel.props || {}).map(([k, v]) => `${k}: ${formatPropVal(v)}`).join(' · ')}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {REL_TYPES.map(r => (
          <button key={r.key} className={`tab${activeTab === r.key ? ' active' : ''}`}
            onClick={() => setActiveTab(r.key)}
            style={activeTab === r.key ? { color: r.color, borderBottomColor: r.color } : {}}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid-3">
        {/* CREATE */}
        <div className="section">
          <div className="section-title">Crear {cfg.label}</div>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem' }}>{cfg.desc}</p>
          <form onSubmit={handleCreate}>
            {cfg.fields.map(f => (
              <div className="form-group" key={f.key}>
                <label className="form-label">{f.label}</label>
                <FieldInput field={f} value={createForm[f.key]} onChange={v => setCreateForm(p => ({ ...p, [f.key]: v }))}/>
              </div>
            ))}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.25rem' }}>Crear Relación</button>
          </form>
        </div>

        {/* UPDATE individual */}
        <div className="section">
          <div className="section-title">Actualizar Individual</div>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem' }}>Modifica una relación específica entre dos nodos.</p>
          <form onSubmit={handleIndividualUpdate}>
            <div className="form-group">
              <label className="form-label">ID Origen</label>
              <input className="form-input" value={updateForm.id1 || ''} onChange={e => setUpdateForm(p => ({ ...p, id1: e.target.value }))} placeholder="ID del primer nodo" required/>
            </div>
            <div className="form-group">
              <label className="form-label">ID Destino</label>
              <input className="form-input" value={updateForm.id2 || ''} onChange={e => setUpdateForm(p => ({ ...p, id2: e.target.value }))} placeholder="ID del segundo nodo" required/>
            </div>
            {cfg.fields.slice(2).map(f => (
              <div className="form-group" key={f.key}>
                <label className="form-label">{f.label} (Nuevo)</label>
                <FieldInput field={f} value={updateForm[f.key]} onChange={v => setUpdateForm(p => ({ ...p, [f.key]: v }))}/>
              </div>
            ))}
            <button type="submit" className="btn btn-warning" style={{ width: '100%', marginTop: '0.25rem' }}>Actualizar Propiedades</button>
          </form>
        </div>

        {/* DELETE + BULK */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="section">
            <div className="section-title">Eliminar Relación</div>
            <div className="form-group">
              <label className="form-label">ID Origen</label>
              <input className="form-input" value={deleteIds.id1 || ''} onChange={e => setDeleteIds(p => ({ ...p, id1: e.target.value }))} placeholder="ID origen"/>
            </div>
            <div className="form-group">
              <label className="form-label">ID Destino</label>
              <input className="form-input" value={deleteIds.id2 || ''} onChange={e => setDeleteIds(p => ({ ...p, id2: e.target.value }))} placeholder="ID destino"/>
            </div>
            <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleDeleteSingle}>Eliminar Definitivamente</button>
          </div>

          {activeTab === 'ships-to' && (
            <div className="section">
              <div className="section-title">Operaciones Masivas</div>
              <div className="form-group">
                <label className="form-label">Filtrar por Ruta</label>
                <select className="form-input form-select" value={bulkRoute} onChange={e => setBulkRoute(e.target.value)}>
                  <option value="Ground">Terrestre (Ground)</option>
                  <option value="Air">Aérea (Air)</option>
                  <option value="Sea">Marítima (Sea)</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="btn btn-warning btn-sm" onClick={handleBulkUpdate}>Actualizar Costos ($99.99)</button>
                <button className="btn btn-secondary btn-sm" style={{ color: '#ef4444' }} onClick={handleBulkDeleteProp}>Limpiar Propiedad Costo</button>
                <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>Eliminar Todas ({bulkRoute})</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Relationships;
