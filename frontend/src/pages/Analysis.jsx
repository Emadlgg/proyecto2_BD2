import React, { useState, useEffect } from 'react';
import { getShortestPath, getTopSuppliers, getStatsByCountry } from '../services/api';
import { Activity, Play, Zap, Star, Globe } from 'lucide-react';

const Analysis = () => {
  const [supplierId, setSupplierId] = useState('SUP1');
  const [retailerId, setRetailerId] = useState('RET1');
  const [pathData, setPathData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [topSuppliers, setTopSuppliers] = useState([]);
  const [countryStats, setCountryStats] = useState([]);

  useEffect(() => {
    getTopSuppliers().then(setTopSuppliers).catch(console.error);
    getStatsByCountry().then(setCountryStats).catch(console.error);
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getShortestPath(supplierId, retailerId);
      setPathData(data);
    } catch (err) {
      setError('Error: No se pudo encontrar una ruta. Asegúrate de que los IDs sean correctos y exista un camino.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Análisis de la Cadena de Suministro</h1>
          <p className="page-subtitle">Algoritmos Avanzados y Ciencia de Datos en Grafos</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* SHORTEST PATH */}
        <div className="grid-2" style={{ gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          <div className="section">
            <div className="section-title">
              <Zap size={18} color="#38bdf8" style={{ marginRight: '0.5rem' }}/> 
              Ruta Más Corta
            </div>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Encuentra la ruta más eficiente desde un Proveedor hasta un Minorista utilizando el algoritmo de Dijkstra.
            </p>

            <div className="form-group">
              <label className="form-label">ID Proveedor</label>
              <input 
                type="text" 
                className="form-input" 
                value={supplierId} 
                onChange={e => setSupplierId(e.target.value)}
                placeholder="Ej. SUP1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">ID Minorista</label>
              <input 
                type="text" 
                className="form-input" 
                value={retailerId} 
                onChange={e => setRetailerId(e.target.value)}
                placeholder="Ej. RET1"
              />
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={runAnalysis}
              disabled={loading}
            >
              {loading ? 'Analizando...' : <><Play size={16} style={{ marginRight: 6 }}/> Ejecutar</>}
            </button>

            {error && (
              <div className="alert alert-error" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                {error}
              </div>
            )}
          </div>

          <div className="section" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="section-title">Visualización del Camino</div>
            <div style={{ flex: 1, display: 'flex', alignItems: pathData ? 'flex-start' : 'center', justifyContent: 'center', overflowY: 'auto', minHeight: '300px' }}>
              {loading ? (
                <div className="loader"></div>
              ) : pathData ? (
                <div style={{ width: '100%', textAlign: 'center', padding: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {pathData.nodes.map((node, i) => (
                      <React.Fragment key={i}>
                        <div style={{ 
                          padding: '0.75rem 1.25rem', 
                          background: '#1e293b', 
                          borderRadius: '8px', 
                          border: '1px solid #38bdf8', 
                          minWidth: '200px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}>
                          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>{node.labels[0]}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.2rem' }}>
                            {node.props.supplierId || node.props.componentId || node.props.manufacturerId || node.props.productId || node.props.centerId || node.props.retailerId}
                          </div>
                        </div>
                        
                        {i < pathData.relationships.length && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.25rem 0' }}>
                            <div style={{ width: '1px', height: '12px', background: '#10b981' }}></div>
                            <span style={{ 
                              background: 'transparent', 
                              color: '#10b981', 
                              padding: '2px 8px', 
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              border: '1px solid rgba(16,185,129,0.3)',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}>
                              {pathData.relationships[i].type}
                            </span>
                            <div style={{ width: '1px', height: '12px', background: '#10b981' }}></div>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ color: '#4b5563', textAlign: 'center' }}>
                  <Activity size={40} style={{ opacity: 0.1, marginBottom: '0.5rem', margin: '0 auto' }} />
                  <p style={{ fontSize: '0.875rem' }}>Los resultados aparecerán aquí.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TOP SUPPLIERS & COUNTRY STATS */}
        <div className="grid-2" style={{ gap: '1.5rem' }}>
          <div className="section">
            <div className="section-title">
              <Star size={18} color="#facc15" style={{ marginRight: '0.5rem' }}/> 
              Importancia de Nodos
            </div>
            <div className="table-wrap" style={{ maxHeight: '300px' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Conexiones</th>
                  </tr>
                </thead>
                <tbody>
                  {topSuppliers.map((s, i) => (
                    <tr key={i}>
                      <td style={{ color: '#38bdf8', fontWeight: 600 }}>{s.supplierId}</td>
                      <td>{s.name}</td>
                      <td><span className="badge badge-blue">{s.degree}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="section">
            <div className="section-title">
              <Globe size={18} color="#10b981" style={{ marginRight: '0.5rem' }}/> 
              Rating por País
            </div>
            <div className="table-wrap" style={{ maxHeight: '300px' }}>
              <table>
                <thead>
                  <tr>
                    <th>País</th>
                    <th>Rating Promedio</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {countryStats.slice(0, 10).map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{c.country}</td>
                      <td>
                        <span className={`badge ${c.avgRating > 3 ? 'badge-green' : 'badge-yellow'}`}>
                          {c.avgRating ? c.avgRating.toFixed(2) : 'N/A'}
                        </span>
                      </td>
                      <td style={{ color: '#9ca3af' }}>{c.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;

