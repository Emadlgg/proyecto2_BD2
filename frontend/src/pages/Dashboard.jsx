import React, { useEffect, useState } from 'react';
import { getStats } from '../services/api';
import { Truck, Package, Factory, MapPin } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    suppliers: 0,
    manufacturers: 0,
    products: 0,
    centers: 0,
    loading: true
  });

  useEffect(() => {
    getStats()
      .then(data => {
        setStats({ 
          suppliers: data.Supplier || 0,
          manufacturers: data.Manufacturer || 0,
          products: data.Product || 0,
          centers: data.DistributionCenter || 0,
          loading: false 
        });
      })
      .catch(() => setStats({ suppliers: 0, manufacturers: 0, products: 0, centers: 0, loading: false }));
  }, []);

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Resumen de Cadena de Suministros</h1>
          <p className="text-muted" style={{ color: 'var(--text-muted)' }}>Bienvenido al Dashboard del Grafo Global Neo4j.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card glass-panel">
          <Truck size={32} color="var(--primary-color)" />
          <div className="stat-value">{stats.loading ? '...' : stats.suppliers}</div>
          <div className="stat-label">Proveedores Totales</div>
        </div>
        <div className="stat-card glass-panel">
          <Factory size={32} color="var(--secondary-color)" />
          <div className="stat-value">{stats.loading ? '...' : stats.manufacturers}</div>
          <div className="stat-label">Fabricantes</div>
        </div>
        <div className="stat-card glass-panel">
          <Package size={32} color="#10b981" />
          <div className="stat-value">{stats.loading ? '...' : stats.products}</div>
          <div className="stat-label">Productos</div>
        </div>
        <div className="stat-card glass-panel">
          <MapPin size={32} color="#f59e0b" />
          <div className="stat-value">{stats.loading ? '...' : stats.centers}</div>
          <div className="stat-label">Centros de Distribución</div>
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: '2rem', padding: '2rem' }}>
        <h2>Actividad Reciente en la Red</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Métricas en tiempo real desde la instancia de AuraDB.
        </p>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Tiempo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Sincronización de Datos</td>
                <td><span className="badge badge-success">Ingestión</span></td>
                <td>Completado</td>
                <td>Justo ahora</td>
              </tr>
              <tr>
                <td>Análisis de Ruta Más Corta</td>
                <td><span className="badge badge-warning">Consulta</span></td>
                <td>Ejecutando</td>
                <td>Hace 2 mins</td>
              </tr>
              <tr>
                <td>Actualización de Retailer</td>
                <td><span className="badge badge-success">Mutación</span></td>
                <td>Completado</td>
                <td>Hace 15 mins</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
