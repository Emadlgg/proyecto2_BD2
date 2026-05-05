import React, { useState } from 'react';
import { Share2, Plus, Edit3, Trash2, Link as LinkIcon, Unlink } from 'lucide-react';

const Relationships = () => {
  // SHIPS_TO (Bulk / Create)
  const [newRel, setNewRel] = useState({ centerId: '', retailerId: '', avgDeliveryDays: '', shippingCost: '', route: 'Ground' });
  const [newSupplies, setNewSupplies] = useState({ supplierId: '', componentId: '', unitPrice: '', leadTimeDays: '', contractEnd: '' });
  const [bulkUpdate, setBulkUpdate] = useState({ route: 'Ground', shippingCost: '' });
  const [bulkDeleteRoute, setBulkDeleteRoute] = useState('Ground');
  
  // SUPPLIES (Single CRUD)
  const [singleRel, setSingleRel] = useState({ supplierId: '', componentId: '', unitPrice: '' });
  const [singleDelete, setSingleDelete] = useState({ supplierId: '', componentId: '' });

  // SHIPS_TO (Single CRUD)
  const [singleShipsRel, setSingleShipsRel] = useState({ centerId: '', retailerId: '', shippingCost: '' });
  const [singleShipsDelete, setSingleShipsDelete] = useState({ centerId: '', retailerId: '' });

  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState('');

  const fetchRelationships = async () => {
    setLoading(true);
    try {
      const [res1, res2] = await Promise.all([
        fetch('http://localhost:3000/api/relationships/ships-to'),
        fetch('http://localhost:3000/api/relationships/supplies')
      ]);
      const data1 = await res1.json();
      const data2 = await res2.json();
      setRelationships([...data1, ...data2]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRelationships();
  }, []);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/relationships/ships-to', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centerId: newRel.centerId,
          retailerId: newRel.retailerId,
          avgDeliveryDays: parseInt(newRel.avgDeliveryDays),
          shippingCost: parseFloat(newRel.shippingCost),
          route: newRel.route
        })
      });
      if (response.ok) {
        showMessage('Relación SHIPS_TO creada exitosamente.');
        setNewRel({ centerId: '', retailerId: '', avgDeliveryDays: '', shippingCost: '', route: 'Ground' });
        fetchRelationships();
      } else {
        showMessage('Error al crear la relación. Verifica que los IDs existan.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/relationships/ships-to/bulk/by-route', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: bulkUpdate.route,
          shippingCost: parseFloat(bulkUpdate.shippingCost)
        })
      });
      if (response.ok) {
        const data = await response.json();
        showMessage(`Se actualizaron ${data.updated} relaciones exitosamente.`);
        setBulkUpdate({ ...bulkUpdate, shippingCost: '' });
        fetchRelationships();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDeleteProperty = async (e) => {
    e.preventDefault();
    if(window.confirm(`¿Estás seguro de ELIMINAR la propiedad 'shippingCost' de TODAS las relaciones SHIPS_TO con la ruta ${bulkDeleteRoute}?`)) {
      try {
        const response = await fetch(`http://localhost:3000/api/relationships/ships-to/bulk/properties`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ route: bulkDeleteRoute, fields: ['shippingCost'] })
        });
        if (response.ok) {
          showMessage(`Propiedad eliminada masivamente exitosamente.`);
          fetchRelationships();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleBulkDelete = async (e) => {
    e.preventDefault();
    if(window.confirm(`¿Estás seguro de eliminar TODAS las relaciones SHIPS_TO con la ruta ${bulkDeleteRoute}?`)) {
      try {
        const response = await fetch(`http://localhost:3000/api/relationships/ships-to/bulk/by-route/${encodeURIComponent(bulkDeleteRoute)}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          const data = await response.json();
          showMessage(`Se eliminaron ${data.deleted} relaciones exitosamente.`);
          fetchRelationships();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSingleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/api/relationships/supplies/${singleRel.supplierId}/${singleRel.componentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitPrice: parseFloat(singleRel.unitPrice) })
      });
      if (response.ok) {
        showMessage('Relación SUPPLIES actualizada exitosamente.');
        setSingleRel({ supplierId: '', componentId: '', unitPrice: '' });
        fetchRelationships();
      } else {
        showMessage('Error: No se encontró la relación.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSingleDeleteProperty = async (e) => {
    e.preventDefault();
    if(window.confirm('¿Estás seguro de ELIMINAR la propiedad unitPrice de esta relación específica?')) {
      try {
        const response = await fetch(`http://localhost:3000/api/relationships/supplies/${singleRel.supplierId}/${singleRel.componentId}/properties`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: ['unitPrice'] })
        });
        if (response.ok) {
          showMessage('Propiedad unitPrice eliminada exitosamente.');
          fetchRelationships();
        } else {
          showMessage('Error: No se encontró la relación.');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSingleDelete = async (e) => {
    e.preventDefault();
    if(window.confirm('¿Estás seguro de eliminar esta relación específica?')) {
      try {
        const response = await fetch(`http://localhost:3000/api/relationships/supplies/${singleDelete.supplierId}/${singleDelete.componentId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          showMessage('Relación SUPPLIES eliminada exitosamente.');
          setSingleDelete({ supplierId: '', componentId: '' });
          fetchRelationships();
        } else {
          showMessage('Error: No se encontró la relación.');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSingleShipsUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/api/relationships/ships-to/${singleShipsRel.centerId}/${singleShipsRel.retailerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingCost: parseFloat(singleShipsRel.shippingCost) })
      });
      if (response.ok) {
        showMessage('Relación SHIPS_TO actualizada exitosamente.');
        setSingleShipsRel({ centerId: '', retailerId: '', shippingCost: '' });
        fetchRelationships();
      } else {
        showMessage('Error: No se encontró la relación.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSingleShipsDeleteProperty = async (e) => {
    e.preventDefault();
    if(window.confirm('¿Estás seguro de ELIMINAR la propiedad shippingCost de esta relación específica?')) {
      try {
        const response = await fetch(`http://localhost:3000/api/relationships/ships-to/${singleShipsRel.centerId}/${singleShipsRel.retailerId}/properties`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: ['shippingCost'] })
        });
        if (response.ok) {
          showMessage('Propiedad shippingCost eliminada exitosamente.');
          fetchRelationships();
        } else {
          showMessage('Error: No se encontró la relación.');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSingleShipsDelete = async (e) => {
    e.preventDefault();
    if(window.confirm('¿Estás seguro de eliminar esta relación SHIPS_TO específica?')) {
      try {
        const response = await fetch(`http://localhost:3000/api/relationships/ships-to/${singleShipsDelete.centerId}/${singleShipsDelete.retailerId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          showMessage('Relación SHIPS_TO eliminada exitosamente.');
          setSingleShipsDelete({ centerId: '', retailerId: '' });
          fetchRelationships();
        } else {
          showMessage('Error: No se encontró la relación.');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="relationships-page">
      <div className="page-header">
        <div>
          <h1>Gestión de Relaciones</h1>
          <p className="text-muted" style={{ color: 'var(--text-muted)' }}>Administra las conexiones del grafo entre nodos (SHIPS_TO y SUPPLIES).</p>
        </div>
      </div>

      {message && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px' }}>
          {message}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3><LinkIcon size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--primary-color)' }}/> Relaciones Existentes (Visualización)</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Se muestran las relaciones SHIPS_TO y SUPPLIES para validar visualmente las propiedades.
        </p>
        
        {loading ? (
          <div className="loader"></div>
        ) : (
          <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ margin: 0 }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-dark)', zIndex: 1 }}>
                <tr>
                  <th>Origen (Source)</th>
                  <th>Tipo de Relación</th>
                  <th>Destino (Target)</th>
                  <th>Propiedades</th>
                </tr>
              </thead>
              <tbody>
                {relationships.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center' }}>No hay relaciones de estos tipos aún.</td></tr>
                ) : relationships.map((rel, idx) => (
                  <tr key={idx}>
                    <td><strong>{rel.source}</strong></td>
                    <td><span className="badge badge-success">{rel.type}</span></td>
                    <td><strong>{rel.target}</strong></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {Object.entries(rel.props).map(([k, v]) => (
                          <span key={k} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                            {k}: <strong>{v === null ? 'null' : (typeof v === 'object' ? (v.year ? `${v.year.low || v.year}-${v.month.low || v.month}-${v.day.low || v.day}` : (v.low !== undefined ? v.low : JSON.stringify(v))) : String(v))}</strong>
                          </span>
                        ))}
                        {Object.keys(rel.props).length === 0 && <span style={{ color: 'var(--text-muted)' }}>Ninguna (Propiedades eliminadas)</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        {/* CREATE SHIPS_TO */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3><Plus size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--primary-color)' }}/> Crear Relación (Múltiples Propiedades)</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            DistributionCenter -[SHIPS_TO]-&gt; Retailer
          </p>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Center ID</label>
              <input required type="text" className="form-control" placeholder="Ej. DC12" value={newRel.centerId} onChange={e => setNewRel({...newRel, centerId: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Retailer ID</label>
              <input required type="text" className="form-control" placeholder="Ej. RET85" value={newRel.retailerId} onChange={e => setNewRel({...newRel, retailerId: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Días de Entrega Promedio</label>
              <input required type="number" className="form-control" value={newRel.avgDeliveryDays} onChange={e => setNewRel({...newRel, avgDeliveryDays: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Costo de Envío</label>
              <input required type="number" step="0.01" className="form-control" value={newRel.shippingCost} onChange={e => setNewRel({...newRel, shippingCost: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Ruta</label>
              <select className="form-control" value={newRel.route} onChange={e => setNewRel({...newRel, route: e.target.value})}>
                <option value="Ground">Tierra (Ground)</option>
                <option value="Air">Aire (Air)</option>
                <option value="Sea">Mar (Sea)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Crear Relación</button>
          </form>
        </div>

        {/* CREATE SUPPLIES */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3><Plus size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--secondary-color)' }}/> Crear Relación SUPPLIES</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Supplier -[SUPPLIES]-&gt; Component
          </p>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const response = await fetch('http://localhost:3000/api/relationships/supplies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  supplierId: newSupplies.supplierId,
                  componentId: newSupplies.componentId,
                  unitPrice: parseFloat(newSupplies.unitPrice),
                  leadTimeDays: parseInt(newSupplies.leadTimeDays),
                  contractEnd: newSupplies.contractEnd
                })
              });
              if (response.ok) {
                showMessage('Relación SUPPLIES creada exitosamente.');
                setNewSupplies({ supplierId: '', componentId: '', unitPrice: '', leadTimeDays: '', contractEnd: '' });
                fetchRelationships();
              } else {
                showMessage('Error al crear la relación. Verifica que los IDs existan.');
              }
            } catch (err) { console.error(err); }
          }}>
            <div className="form-group">
              <label className="form-label">Supplier ID</label>
              <input required type="text" className="form-control" placeholder="Ej. SUP10" value={newSupplies.supplierId} onChange={e => setNewSupplies({...newSupplies, supplierId: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Component ID</label>
              <input required type="text" className="form-control" placeholder="Ej. CMP45" value={newSupplies.componentId} onChange={e => setNewSupplies({...newSupplies, componentId: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Precio Unitario (unitPrice)</label>
              <input required type="number" step="0.01" className="form-control" value={newSupplies.unitPrice} onChange={e => setNewSupplies({...newSupplies, unitPrice: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Días de Entrega (leadTimeDays)</label>
              <input required type="number" className="form-control" value={newSupplies.leadTimeDays} onChange={e => setNewSupplies({...newSupplies, leadTimeDays: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha Fin Contrato (contractEnd)</label>
              <input required type="date" className="form-control" value={newSupplies.contractEnd} onChange={e => setNewSupplies({...newSupplies, contractEnd: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', background: 'var(--secondary-color)', border: 'none' }}>Crear Relación SUPPLIES</button>
          </form>
        </div>

        {/* BULK ACTIONS SHIPS_TO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3><Edit3 size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: '#f59e0b' }}/> Actualización Masiva</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Actualiza el costo de envío para todas las relaciones basadas en la Ruta.
            </p>
            <form onSubmit={handleBulkUpdate}>
              <div className="form-group">
                <label className="form-label">Ruta Objetivo</label>
                <select className="form-control" value={bulkUpdate.route} onChange={e => setBulkUpdate({...bulkUpdate, route: e.target.value})}>
                  <option value="Ground">Tierra (Ground)</option>
                  <option value="Air">Aire (Air)</option>
                  <option value="Sea">Mar (Sea)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nuevo Costo de Envío</label>
                <input required type="number" step="0.01" className="form-control" value={bulkUpdate.shippingCost} onChange={e => setBulkUpdate({...bulkUpdate, shippingCost: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-outline" style={{ width: '100%', marginTop: '1rem', borderColor: '#f59e0b', color: '#f59e0b' }}>Actualizar Relaciones</button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3><Trash2 size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: '#ef4444' }}/> Eliminación Masiva</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Elimina TODAS las relaciones SHIPS_TO por su Ruta.
            </p>
            <form onSubmit={handleBulkDelete}>
              <div className="form-group">
                <label className="form-label">Ruta Objetivo</label>
                <select className="form-control" value={bulkDeleteRoute} onChange={e => setBulkDeleteRoute(e.target.value)}>
                  <option value="Ground">Tierra (Ground)</option>
                  <option value="Air">Aire (Air)</option>
                  <option value="Sea">Mar (Sea)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-danger" style={{ flex: 1 }}>Eliminar Relaciones</button>
                <button type="button" className="btn btn-outline" style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444' }} onClick={handleBulkDeleteProperty}>
                  Eliminar Propiedad
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SINGLE CRUD SUPPLIES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3><LinkIcon size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--secondary-color)' }}/> Actualizar Relación Individual</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Supplier -[SUPPLIES]-&gt; Component
            </p>
            <form onSubmit={handleSingleUpdate}>
              <div className="form-group">
                <label className="form-label">Supplier ID</label>
                <input required type="text" className="form-control" placeholder="Ej. SUP1" value={singleRel.supplierId} onChange={e => setSingleRel({...singleRel, supplierId: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Component ID</label>
                <input required type="text" className="form-control" placeholder="Ej. COMP1" value={singleRel.componentId} onChange={e => setSingleRel({...singleRel, componentId: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Nuevo Precio Unitario (unitPrice)</label>
                <input required type="number" step="0.01" className="form-control" value={singleRel.unitPrice} onChange={e => setSingleRel({...singleRel, unitPrice: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-outline" style={{ flex: 1, borderColor: 'var(--secondary-color)', color: 'var(--secondary-color)' }}>Actualizar Propiedad</button>
                <button type="button" className="btn btn-outline" style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444' }} onClick={handleSingleDeleteProperty}>
                  Eliminar Propiedad
                </button>
              </div>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3><Unlink size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: '#ef4444' }}/> Eliminar Relación Individual</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Elimina una relación SUPPLIES específica.
            </p>
            <form onSubmit={handleSingleDelete}>
              <div className="form-group">
                <label className="form-label">Supplier ID</label>
                <input required type="text" className="form-control" placeholder="Ej. SUP1" value={singleDelete.supplierId} onChange={e => setSingleDelete({...singleDelete, supplierId: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Component ID</label>
                <input required type="text" className="form-control" placeholder="Ej. COMP1" value={singleDelete.componentId} onChange={e => setSingleDelete({...singleDelete, componentId: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: '1rem' }}>Eliminar Relación Única</button>
            </form>
          </div>
        </div>

        {/* SINGLE CRUD SHIPS_TO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3><LinkIcon size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--primary-color)' }}/> Actualizar Relación Individual (SHIPS_TO)</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              DistributionCenter -[SHIPS_TO]-&gt; Retailer
            </p>
            <form onSubmit={handleSingleShipsUpdate}>
              <div className="form-group">
                <label className="form-label">Center ID</label>
                <input required type="text" className="form-control" placeholder="Ej. DC1" value={singleShipsRel.centerId} onChange={e => setSingleShipsRel({...singleShipsRel, centerId: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Retailer ID</label>
                <input required type="text" className="form-control" placeholder="Ej. RET1" value={singleShipsRel.retailerId} onChange={e => setSingleShipsRel({...singleShipsRel, retailerId: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Nuevo Costo de Envío (shippingCost)</label>
                <input required type="number" step="0.01" className="form-control" value={singleShipsRel.shippingCost} onChange={e => setSingleShipsRel({...singleShipsRel, shippingCost: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-outline" style={{ flex: 1, borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}>Actualizar Propiedad</button>
                <button type="button" className="btn btn-outline" style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444' }} onClick={handleSingleShipsDeleteProperty}>
                  Eliminar Propiedad
                </button>
              </div>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3><Unlink size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: '#ef4444' }}/> Eliminar Relación Individual (SHIPS_TO)</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Elimina una relación SHIPS_TO específica.
            </p>
            <form onSubmit={handleSingleShipsDelete}>
              <div className="form-group">
                <label className="form-label">Center ID</label>
                <input required type="text" className="form-control" placeholder="Ej. DC1" value={singleShipsDelete.centerId} onChange={e => setSingleShipsDelete({...singleShipsDelete, centerId: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Retailer ID</label>
                <input required type="text" className="form-control" placeholder="Ej. RET1" value={singleShipsDelete.retailerId} onChange={e => setSingleShipsDelete({...singleShipsDelete, retailerId: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: '1rem' }}>Eliminar Relación Única</button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Relationships;

