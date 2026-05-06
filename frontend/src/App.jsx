import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Network, Database, Share2, Activity, Upload } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Nodes from './pages/Nodes';
import Relationships from './pages/Relationships';
import Analysis from './pages/Analysis';
import UploadPage from './pages/Upload';

const Navbar = () => (
  <nav className="navbar">
    <a href="/" className="navbar-brand">
      <Network size={18} />
      Supply<span>Graph</span>
    </a>
    <ul className="nav-links">
      {[
        { to: '/',              label: 'Dashboard',  icon: null },
        { to: '/nodes',         label: 'Entidades',  icon: null },
        { to: '/relationships', label: 'Relaciones', icon: null },
        { to: '/analysis',      label: 'Análisis',   icon: null },
        { to: '/upload',        label: 'Importar',   icon: null },
      ].map(({ to, label }) => (
        <li key={to}>
          <NavLink to={to} end={to === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/"              element={<Dashboard />} />
          <Route path="/nodes"         element={<Nodes />} />
          <Route path="/relationships" element={<Relationships />} />
          <Route path="/analysis"      element={<Analysis />} />
          <Route path="/upload"        element={<UploadPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
