import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getClientes } from '../api/clientes';
import { getVehiculos, createVehiculo } from '../api/vehiculos';
import { createOrden } from '../api/ordenes';
import { useAuth } from '../context/AuthContext';

export default function OrdenNueva() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preClienteId = searchParams.get('cliente_id');

  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [clienteId, setClienteId] = useState(preClienteId || '');
  const [vehiculoId, setVehiculoId] = useState('');
  const [problema, setProblema] = useState('');
  const [showNuevoVehiculo, setShowNuevoVehiculo] = useState(false);
  const [nvForm, setNvForm] = useState({ patente: '', marca: '', modelo: '', anio: '', km_actuales: '' });

  useEffect(() => {
    getClientes(token).then(setClientes).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!clienteId) { setVehiculos([]); setVehiculoId(''); return; }
    getVehiculos(token).then(vs => {
      const filtered = vs.filter(v => String(v.cliente_id) === String(clienteId));
      setVehiculos(filtered);
      setVehiculoId('');
    }).catch(console.error);
  }, [token, clienteId]);

  const handleNvChange = e => setNvForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCrearVehiculo = async () => {
    if (!nvForm.patente.trim()) { setError('La patente es requerida'); return; }
    setSaving(true);
    setError('');
    try {
      const v = await createVehiculo(token, { ...nvForm, cliente_id: clienteId });
      setVehiculos(vs => [...vs, v]);
      setVehiculoId(String(v.id));
      setShowNuevoVehiculo(false);
      setNvForm({ patente: '', marca: '', modelo: '', anio: '', km_actuales: '' });
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!vehiculoId) { setError('Seleccioná un vehículo'); return; }
    setSaving(true);
    setError('');
    try {
      const orden = await createOrden(token, { vehiculo_id: vehiculoId, problema_reportado: problema });
      navigate(`/ordenes/${orden.id}`);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" />Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/ordenes')} style={{ marginBottom: 8 }}>← Volver</button>
          <h1 className="page-title">Nueva orden de trabajo</h1>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Cliente *</label>
            <select className="form-control" value={clienteId} onChange={e => setClienteId(e.target.value)} required>
              <option value="">— Seleccioná un cliente —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          {clienteId && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className="form-label">Vehículo *</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowNuevoVehiculo(v => !v)}>
                  {showNuevoVehiculo ? '× Cancelar' : '+ Nuevo vehículo'}
                </button>
              </div>
              <select className="form-control" value={vehiculoId} onChange={e => setVehiculoId(e.target.value)} required disabled={showNuevoVehiculo}>
                <option value="">— Seleccioná un vehículo —</option>
                {vehiculos.map(v => <option key={v.id} value={v.id}>{v.patente} — {v.marca} {v.modelo}</option>)}
              </select>

              {showNuevoVehiculo && (
                <div style={{ marginTop: 12, padding: 16, background: 'var(--bg-hover)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-grid form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Patente *</label>
                      <input className="form-control" name="patente" value={nvForm.patente} onChange={e => setNvForm(f => ({ ...f, patente: e.target.value.replace(/\s/g, '').toUpperCase() }))} placeholder="ABC 123" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Marca</label>
                      <input className="form-control" name="marca" value={nvForm.marca} onChange={handleNvChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Modelo</label>
                      <input className="form-control" name="modelo" value={nvForm.modelo} onChange={handleNvChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Año</label>
                      <input className="form-control" name="anio" type="number" value={nvForm.anio} onChange={handleNvChange} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleCrearVehiculo} disabled={saving}>
                      Guardar vehículo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Problema reportado</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Describí el problema que trajo el cliente..."
              value={problema}
              onChange={e => setProblema(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/ordenes')}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !vehiculoId}>
              {saving ? 'Creando...' : '✓ Crear orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
