import React, { useState, useEffect } from 'react';
import { getSuppliers } from '../services/api';
import { Search, Plus, Trash2, Edit, X } from 'lucide-react';

const Nodes = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newNode, setNewNode] = useState({ name: '', country: '', rating: '', isActive: true });
  const [editingNode, setEditingNode] = useState({ id: '', name: '', country: '', rating: '', isActive: true });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    getSuppliers()
      .then(data => {
        setSuppliers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleAddNode = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: `SUP-${Math.floor(Math.random() * 10000)}`,
          name: newNode.name,
          country: newNode.country,
          rating: parseFloat(newNode.rating) || 5.0,
          isActive: newNode.isActive,
          certifications: ['ISO9001'],
          joinedDate: new Date().toISOString().split('T')[0]
        })
      });
      if (response.ok) {
        setShowAddModal(false);
        setNewNode({ name: '', country: '', rating: '', isActive: true });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding node:', error);
    }
  };

  const handleEditNode = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/api/suppliers/${editingNode.id}/properties`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingNode.name,
          country: editingNode.country,
          rating: parseFloat(editingNode.rating),
          isActive: editingNode.isActive
        })
      });
      if (response.ok) {
        setShowEditModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error editing node:', error);
    }
  };

  const openEditModal = (sup) => {
    setEditingNode({
      id: sup.supplierId || sup.id,
      name: sup.name || '',
      country: sup.country || '',
      rating: sup.rating || '',
      isActive: sup.isActive !== undefined ? sup.isActive : true
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if(window.confirm('¿Estás seguro de eliminar este nodo?')) {
      try {
        await fetch(`http://localhost:3000/api/suppliers/${id}`, { method: 'DELETE' });
        fetchData();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  const filteredSuppliers = suppliers.filter(sup => 
    (sup.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sup.country || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="nodes-page">
      <div className="page-header">
        <div>
          <h1>Entity Management</h1>
          <p className="text-muted" style={{ color: 'var(--text-muted)' }}>View and manage nodes in the graph.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Add Node
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Filter by name or country in real-time..." 
              style={{ paddingLeft: '2.5rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loader"></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Country</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.slice(0, 10).map((sup, idx) => {
                  const actualId = sup.supplierId || sup.id || `SUP-${idx}`;
                  return (
                  <tr key={idx}>
                    <td><strong>{actualId}</strong></td>
                    <td>{sup.name || 'Unknown'}</td>
                    <td>{sup.country || 'N/A'}</td>
                    <td>{sup.rating ? sup.rating.toFixed(1) : '-'}</td>
                    <td>
                      <span className={`badge ${sup.isActive ? 'badge-success' : 'badge-warning'}`}>
                        {sup.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openEditModal(sup)}><Edit size={16} /></button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(actualId)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setShowAddModal(false)} 
              style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Supplier</h2>
            <form onSubmit={handleAddNode}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input required type="text" className="form-control" value={newNode.name} onChange={e => setNewNode({...newNode, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <input required type="text" className="form-control" value={newNode.country} onChange={e => setNewNode({...newNode, country: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Rating (1.0 - 5.0)</label>
                <input required type="number" step="any" min="1" max="5" className="form-control" value={newNode.rating} onChange={e => setNewNode({...newNode, rating: e.target.value})} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <input type="checkbox" id="addStatus" checked={newNode.isActive} onChange={e => setNewNode({...newNode, isActive: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                <label htmlFor="addStatus" className="form-label" style={{ marginBottom: 0 }}>Supplier is Active</label>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Create Supplier</button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setShowEditModal(false)} 
              style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '1.5rem' }}>Edit Supplier</h2>
            <form onSubmit={handleEditNode}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input required type="text" className="form-control" value={editingNode.name} onChange={e => setEditingNode({...editingNode, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <input required type="text" className="form-control" value={editingNode.country} onChange={e => setEditingNode({...editingNode, country: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Rating (1.0 - 5.0)</label>
                <input required type="number" step="any" min="1" max="5" className="form-control" value={editingNode.rating} onChange={e => setEditingNode({...editingNode, rating: e.target.value})} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <input type="checkbox" id="editStatus" checked={editingNode.isActive} onChange={e => setEditingNode({...editingNode, isActive: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                <label htmlFor="editStatus" className="form-label" style={{ marginBottom: 0 }}>Supplier is Active</label>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nodes;
