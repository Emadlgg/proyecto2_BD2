import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Network, Database, Activity, Home, Package } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Nodes from './pages/Nodes';
import Analysis from './pages/Analysis';

const Navbar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar glass-panel">
      <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Network size={28} />
        SupplyGraph
      </Link>
      <ul className="nav-links">
        <li>
          <Link to="/" className={`nav-link ${isActive('/')}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Home size={18} /> Dashboard
          </Link>
        </li>
        <li>
          <Link to="/nodes" className={`nav-link ${isActive('/nodes')}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={18} /> Entities
          </Link>
        </li>
        <li>
          <Link to="/analysis" className={`nav-link ${isActive('/analysis')}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} /> Analysis
          </Link>
        </li>
      </ul>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/nodes" element={<Nodes />} />
          <Route path="/analysis" element={<Analysis />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
