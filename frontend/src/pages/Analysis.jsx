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
    <div className="analysis-page">
      <div className="page-header">
        <div>
          <h1>Análisis de la Cadena de Suministro</h1>
          <p className="text-muted" style={{ color: 'var(--text-muted)' }}>Algoritmos Avanzados de Data Science en Grafos y Consultas.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* SHORTEST PATH */}
        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3><Zap size={20} color="var(--primary-color)" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/> Algoritmo de Ruta Más Corta</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Encuentra la ruta más eficiente desde un Proveedor (Supplier) hasta un Minorista (Retailer) a través de la red utilizando un equivalente al algoritmo de Dijkstra en Cypher.
            </p>

            <div className="form-group">
              <label className="form-label">Supplier ID</label>
              <input 
                type="text" 
                className="form-control" 
                value={supplierId} 
                onChange={e => setSupplierId(e.target.value)}
                placeholder="e.g. SUP1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Retailer ID</label>
              <input 
                type="text" 
                className="form-control" 
                value={retailerId} 
                onChange={e => setRetailerId(e.target.value)}
                placeholder="e.g. RET1"
              />
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={runAnalysis}
              disabled={loading}
            >
              {loading ? 'Analizando...' : <><Play size={18} /> Ejecutar Algoritmo</>}
            </button>

            {error && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '8px', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <h3>Resultados del Camino</h3>
            <div className="graph-container" style={{ alignItems: pathData ? 'flex-start' : 'center', overflowY: 'auto', padding: pathData ? '1rem' : '0' }}>
              {loading ? (
                <div className="loader"></div>
              ) : pathData ? (
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <h4 style={{ color: 'var(--secondary-color)', marginBottom: '2rem', marginTop: '1rem' }}>¡Ruta Encontrada!</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {pathData.nodes.map((node, i) => (
                      <React.Fragment key={i}>
                        <div style={{ 
                          padding: '1rem', 
                          background: 'rgba(30, 41, 59, 0.8)', 
                          borderRadius: '12px', 
                          border: '2px solid var(--primary-color)', 
                          minWidth: '220px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                        }}>
                          <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'white' }}>{node.labels[0]}</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            ID: {node.props.supplierId || node.props.componentId || node.props.manufacturerId || node.props.productId || node.props.centerId || node.props.retailerId}
                          </div>
                        </div>
                        
                        {i < pathData.relationships.length && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.5rem 0' }}>
                            <div style={{ width: '2px', height: '15px', background: 'var(--secondary-color)' }}></div>
                            <span style={{ 
                              background: 'var(--bg-dark)', 
                              color: 'var(--secondary-color)', 
                              padding: '4px 12px', 
                              borderRadius: '20px', 
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              border: '1px solid var(--secondary-color)',
                              letterSpacing: '1px'
                            }}>
                              {pathData.relationships[i].type}
                            </span>
                            <div style={{ width: '2px', height: '15px', background: 'var(--secondary-color)' }}></div>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                  <Activity size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>Ejecuta un algoritmo para ver la visualización aquí.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TOP SUPPLIERS & COUNTRY STATS */}
        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3><Star size={20} color="#f59e0b" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/> Mejores Proveedores (Centralidad)</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Los proveedores más importantes de la red basados en sus conexiones totales (inbound y outbound).
            </p>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Supplier ID</th>
                    <th>Nombre</th>
                    <th>Conexiones (Grado)</th>
                  </tr>
                </thead>
                <tbody>
                  {topSuppliers.map((s, i) => (
                    <tr key={i}>
                      <td><strong>{s.supplierId}</strong></td>
                      <td>{s.name}</td>
                      <td><span className="badge badge-success">{s.degree} rels</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3><Globe size={20} color="#10b981" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/> Estadísticas de Proveedores por País</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Agrupación por país calculando el rating promedio y el total de proveedores.
            </p>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>País</th>
                    <th>Rating Promedio</th>
                    <th>Total de Proveedores</th>
                  </tr>
                </thead>
                <tbody>
                  {countryStats.slice(0, 10).map((c, i) => (
                    <tr key={i}>
                      <td>{c.country}</td>
                      <td>{c.avgRating ? c.avgRating.toFixed(2) : 'N/A'}</td>
                      <td>{c.total}</td>
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

