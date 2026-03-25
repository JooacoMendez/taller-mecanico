import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCliente, deleteCliente } from '../api/clientes';
import { updateVehiculo, deleteVehiculo } from '../api/vehiculos';
import { useAuth } from '../context/AuthContext';

export default function ClienteDetalle() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inline vehicle edit state
  const [editingVehiculo, setEditingVehiculo] = useState(null); // vehiculo object being edited
  const [editForm, setEditForm] = useState({ marca: '', modelo: '', anio: '', km_actuales: '' });
  const [savingVehiculo, setSavingVehiculo] = useState(false);
  const [vehiculoError, setVehiculoError] = useState('');

  const reload = () =>
    getCliente(token, id).then(setCliente).catch(console.error).finally(() => setLoading(false));

  useEffect(() => { reload(); }, [token, id]);

  const handleDeleteCliente = async () => {
    if (!confirm('¿Eliminar este cliente? Solo es posible si no tiene órdenes asociadas.')) return;
    try {
      await deleteCliente(token, id);
      navigate('/clientes');
    } catch (err) {
      alert(err.message || 'Error al eliminar cliente');
    }
  };

  const startEditVehiculo = (v) => {
    setEditingVehiculo(v);
    setEditForm({ marca: v.marca || '', modelo: v.modelo || '', anio: v.anio || '', km_actuales: v.km_actuales || '' });
    setVehiculoError('');
  };

  const handleSaveVehiculo = async (e) => {
    e.preventDefault();
    setSavingVehiculo(true);
    setVehiculoError('');
    try {
      await updateVehiculo(token, editingVehiculo.id, {
        marca: editForm.marca || null,
        modelo: editForm.modelo || null,
        anio: editForm.anio ? parseInt(editForm.anio) : null,
        km_actuales: editForm.km_actuales ? parseInt(editForm.km_actuales) : null,
      });
      setEditingVehiculo(null);
      reload();
    } catch (err) {
      setVehiculoError(err.message || 'Error al guardar vehículo');
    } finally {
      setSavingVehiculo(false);
    }
  };

  const handleDeleteVehiculo = async (v, e) => {
    e.stopPropagation();
    if (!confirm(`¿Eliminar el vehículo ${v.patente}? Solo es posible si no tiene órdenes.`)) return;
    try {
      await deleteVehiculo(token, v.id);
      reload();
    } catch (err) {
      alert(err.message || 'Error al eliminar vehículo');
    }
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" />Cargando...</div>;
  if (!cliente) return <div className="loading-wrap">Cliente no encontrado</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/clientes')} style={{ marginBottom: 8 }}>
            ← Volver
          </button>
          <h1 className="page-title">{cliente.nombre}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {user?.rol === 'dueno' && (
            <button className="btn btn-danger btn-sm" onClick={handleDeleteCliente}>🗑 Eliminar</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/ordenes/nueva?cliente_id=${id}`)}>
            + Nueva orden
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 16 }}>Información del cliente</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">Nombre</div>
            <div className="detail-value">{cliente.nombre}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Teléfono</div>
            <div className="detail-value">{cliente.telefono || '—'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Email</div>
            <div className="detail-value">{cliente.email || '—'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Registrado</div>
            <div className="detail-value">{new Date(cliente.created_at).toLocaleDateString('es-AR')}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2>Vehículos</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/vehiculos/nuevo?cliente_id=${id}`)}>
            + Agregar vehículo
          </button>
        </div>

        {(!cliente.vehiculos || cliente.vehiculos.length === 0) ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚗</div>
            <div className="empty-state-text">Sin vehículos registrados</div>
            <div className="empty-state-sub">Agregá el primer vehículo del cliente</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cliente.vehiculos.map(v => (
              <div key={v.id}>
                {/* Vehicle card */}
                {editingVehiculo?.id !== v.id ? (
                  <div
                    className="card card-sm"
                    style={{ border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                    onClick={() => navigate(`/vehiculos/patente/${v.patente}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '1rem', marginRight: 10 }}>{v.patente}</span>
                        <span className="muted" style={{ color: 'var(--text-secondary)' }}>
                          {v.marca} {v.modelo} {v.anio ? `(${v.anio})` : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {v.km_actuales && (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                            {v.km_actuales.toLocaleString('es-AR')} km
                          </span>
                        )}
                        {user?.rol === 'dueno' && (
                          <>
                            <button
                              className="btn btn-secondary btn-icon btn-sm"
                              title="Editar vehículo"
                              onClick={e => { e.stopPropagation(); startEditVehiculo(v); }}
                            >✏</button>
                            <button
                              className="btn btn-danger btn-icon btn-sm"
                              title="Eliminar vehículo"
                              onClick={e => handleDeleteVehiculo(v, e)}
                            >×</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Inline edit form */
                  <div className="card card-sm" style={{ border: '1px solid var(--accent)', background: 'var(--bg-hover)' }}>
                    <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--accent)' }}>
                      ✏ Editando {v.patente}
                    </div>
                    {vehiculoError && <div className="alert alert-error" style={{ marginBottom: 10 }}>{vehiculoError}</div>}
                    <form onSubmit={handleSaveVehiculo}>
                      <div className="form-grid form-grid-2" style={{ gap: 10 }}>
                        <div className="form-group">
                          <label className="form-label">Marca</label>
                          <input className="form-control" value={editForm.marca}
                            onChange={e => setEditForm(f => ({ ...f, marca: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Modelo</label>
                          <input className="form-control" value={editForm.modelo}
                            onChange={e => setEditForm(f => ({ ...f, modelo: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Año</label>
                          <input className="form-control" type="number" min="1900" max="2100" value={editForm.anio}
                            onChange={e => setEditForm(f => ({ ...f, anio: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Km actuales</label>
                          <input className="form-control" type="number" min="0" value={editForm.km_actuales}
                            onChange={e => setEditForm(f => ({ ...f, km_actuales: e.target.value }))} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary btn-sm"
                          onClick={() => { setEditingVehiculo(null); setVehiculoError(''); }}>
                          Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={savingVehiculo}>
                          {savingVehiculo ? 'Guardando...' : '✓ Guardar'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
