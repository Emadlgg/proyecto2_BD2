import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

const API = 'http://localhost:3000/api';

const TYPES = [
  { key: 'suppliers',           label: 'Proveedores',         cols: 'supplierId, name, country, rating, isActive, certifications, joinedDate' },
  { key: 'components',          label: 'Componentes',        cols: 'componentId, name, category, material, unitWeight, isHazardous, manufactureDate' },
  { key: 'manufacturers',       label: 'Fabricantes',        cols: 'manufacturerId, name, region, rating, isActive, foundedYear, complianceList' },
  { key: 'products',            label: 'Productos',          cols: 'productId, name, description, launchDate, isDiscontinued, dimensions' },
  { key: 'distribution-centers',label: 'Centros Dist.',      cols: 'centerId, location, capacity, isActive, openedDate, contactEmail' },
  { key: 'retailers',           label: 'Minoristas',         cols: 'retailerId, storeName, city, type, isActive, rating' },
];

export default function UploadPage() {
  const [type, setType] = useState('suppliers');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const cfg = TYPES.find(t => t.key === type);

  const doUpload = async () => {
    if (!file) return alert('Selecciona un archivo CSV');
    setLoading(true); setResult(null); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch(`${API}/upload/${type}`, { method: 'POST', body: fd });
      if (r.ok) setResult(await r.json());
      else setError('Error procesando el archivo. Verifica el formato.');
    } catch { setError('Error de conexión con el servidor'); }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Importar CSV</h1>
          <p className="page-subtitle">Carga masiva de nodos desde archivo</p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '1.5rem', alignItems: 'start' }}>
        {/* Izquierda */}
        <div>
          <div className="section">
            <div className="section-title">Tipo de entidad</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {TYPES.map(t => (
                <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '6px', background: type === t.key ? 'rgba(56,189,248,0.1)' : 'transparent', border: `1px solid ${type === t.key ? '#38bdf8' : 'transparent'}`, cursor: 'pointer' }}>
                  <input type="radio" name="type" value={t.key} checked={type === t.key} onChange={() => { setType(t.key); setResult(null); setError(''); }} style={{ accentColor: '#38bdf8' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: type === t.key ? 600 : 400, color: type === t.key ? '#38bdf8' : '#d1d5db' }}>{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-title">Columnas esperadas</div>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.7, fontFamily: 'monospace', background: '#111827', padding: '0.75rem', borderRadius: '6px' }}>
              {cfg.cols}
            </p>
          </div>
        </div>

        {/* Derecha */}
        <div>
          <div className="section">
            <div className="section-title">Archivo CSV</div>
            <label htmlFor="csv" style={{ display: 'block', border: `2px dashed ${file ? '#38bdf8' : '#374151'}`, borderRadius: '8px', padding: '2rem', textAlign: 'center', cursor: 'pointer', marginBottom: '1rem', background: file ? 'rgba(56,189,248,0.05)' : '#111827' }}>
              {file ? (
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>{file.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{(file.size/1024).toFixed(1)} KB — Click para cambiar</div>
                </div>
              ) : (
                <div>
                  <Upload size={24} color="#4b5563" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Click para seleccionar archivo .csv</div>
                </div>
              )}
              <input id="csv" type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { setFile(e.target.files[0]); setResult(null); setError(''); }} />
            </label>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={doUpload} disabled={loading || !file}>
              {loading ? 'Procesando...' : 'Importar'}
            </button>
          </div>

          {result && (
            <div className="section" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CheckCircle size={18} color="#10b981" />
                <span style={{ fontWeight: 600, color: '#10b981' }}>Importación completada</span>
              </div>
              <div className="grid-2">
                {[['Total en CSV', result.total], ['Nodos creados', result.created]].map(([k, v]) => (
                  <div key={k} style={{ background: '#111827', borderRadius: '6px', padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{v}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{k}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
