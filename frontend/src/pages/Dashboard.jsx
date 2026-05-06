import React, { useEffect, useState } from 'react';
import { Truck, Factory, Package, MapPin, Store, Cpu } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/stats/counts')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Suppliers',     key: 'Supplier',           icon: Truck,   color: '#38bdf8' },
    { label: 'Manufacturers', key: 'Manufacturer',        icon: Factory, color: '#a78bfa' },
    { label: 'Products',      key: 'Product',             icon: Package, color: '#34d399' },
    { label: 'Dist. Centers', key: 'DistributionCenter',  icon: MapPin,  color: '#fb923c' },
    { label: 'Retailers',     key: 'Retailer',            icon: Store,   color: '#f472b6' },
    { label: 'Components',    key: 'Component',           icon: Cpu,     color: '#facc15' },
  ];

  return (
    <div>
      <div className="page-header" style={{ marginTop: '1.5rem' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen de la cadena de suministros en Neo4j</p>
        </div>
      </div>

      <div className="stat-grid">
        {cards.map(({ label, key, icon: Icon, color }) => (
          <div className="stat-card" key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">{label}</div>
                <div className="stat-value">{loading ? '—' : (stats?.[key] ?? 0).toLocaleString()}</div>
              </div>
              <Icon size={20} color={color} style={{ opacity: 0.8, marginTop: 4 }}/>
            </div>
          </div>
        ))}
      </div>

      <div className="section" style={{ marginTop: '1rem' }}>
        <div className="section-title">Tipos de relaciones en el grafo</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {['SUPPLIES','REQUIRES','MANUFACTURES','SHIPS_TO','SOURCES_FROM','RECEIVES_FROM','SELLS','REJECTS','PROMOTES','AUDITS'].map(r => (
            <span key={r} className="badge badge-blue">{r}</span>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">Labels de nodos</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {['Supplier','Component','Manufacturer','Product','DistributionCenter','Retailer','PreferredSupplier'].map(l => (
            <span key={l} className="badge badge-green">{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
