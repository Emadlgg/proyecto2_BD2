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
          <h1>Supply Chain Overview</h1>
          <p className="text-muted" style={{ color: 'var(--text-muted)' }}>Welcome to the Neo4j Global Supply Graph Dashboard.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card glass-panel">
          <Truck size={32} color="var(--primary-color)" />
          <div className="stat-value">{stats.loading ? '...' : stats.suppliers}</div>
          <div className="stat-label">Total Suppliers</div>
        </div>
        <div className="stat-card glass-panel">
          <Factory size={32} color="var(--secondary-color)" />
          <div className="stat-value">{stats.loading ? '...' : stats.manufacturers}</div>
          <div className="stat-label">Manufacturers</div>
        </div>
        <div className="stat-card glass-panel">
          <Package size={32} color="#10b981" />
          <div className="stat-value">{stats.loading ? '...' : stats.products}</div>
          <div className="stat-label">Products</div>
        </div>
        <div className="stat-card glass-panel">
          <MapPin size={32} color="#f59e0b" />
          <div className="stat-value">{stats.loading ? '...' : stats.centers}</div>
          <div className="stat-label">Distribution Centers</div>
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: '2rem', padding: '2rem' }}>
        <h2>Recent Network Activity</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Real-time metrics from the AuraDB instance.
        </p>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Type</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data Sync</td>
                <td><span className="badge badge-success">Ingestion</span></td>
                <td>Completed</td>
                <td>Just now</td>
              </tr>
              <tr>
                <td>Shortest Path Analysis</td>
                <td><span className="badge badge-warning">Query</span></td>
                <td>Running</td>
                <td>2 mins ago</td>
              </tr>
              <tr>
                <td>Retailer Update</td>
                <td><span className="badge badge-success">Mutation</span></td>
                <td>Completed</td>
                <td>15 mins ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
