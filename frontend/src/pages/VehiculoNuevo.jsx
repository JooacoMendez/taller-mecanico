import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createVehiculo } from '../api/vehiculos';
import { getClientes } from '../api/clientes';

export default function VehiculoNuevo() {
  const token = null;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preClienteId = searchParams.get('cliente_id');

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    cliente_id: preClienteId || '',
    patente: '',
    marca: '',
    modelo: '',
    anio: '',
    km_actuales: '',
  });

  useEffect(() => {
    getClientes(token).then(setClientes).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.cliente_id) { setError('Seleccioná un cliente'); return; }
    if (!form.patente.trim()) { setError('La patente es requerida'); return; }
    setSaving(true);
    try {
      const v = await createVehiculo(token, {
        ...form,
        km_actuales: form.km_actuales ? parseInt(form.km_actuales) : null
      });
      navigate(`/clientes/${v.cliente_id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" />Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => preClienteId ? navigate(`/clientes/${preClienteId}`) : navigate('/clientes')}
            style={{ marginBottom: 8 }}
          >
            ← Volver
          </button>
          <h1 className="page-title">Nuevo vehículo</h1>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Cliente *</label>
            <select
              className="form-control"
              name="cliente_id"
              value={form.cliente_id}
              onChange={handleChange}
              required
            >
              <option value="">— Seleccioná un cliente —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Patente *</label>
            <input
              className="form-control"
              name="patente"
              value={form.patente}
              onChange={e => setForm(f => ({ ...f, patente: e.target.value.replace(/\s/g, '').toUpperCase() }))}
              placeholder="ABC123"
              required
              autoFocus={!preClienteId}
            />
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Marca</label>
              <input className="form-control" name="marca" value={form.marca} onChange={handleChange} placeholder="Toyota" />
            </div>
            <div className="form-group">
              <label className="form-label">Modelo</label>
              <input className="form-control" name="modelo" value={form.modelo} onChange={handleChange} placeholder="Corolla" />
            </div>
            <div className="form-group">
              <label className="form-label">Año</label>
              <input className="form-control" name="anio" type="number" min="1900" max="2100" value={form.anio} onChange={handleChange} placeholder="2018" />
            </div>
            <div className="form-group">
              <label className="form-label">Km actuales</label>
              <input className="form-control" name="km_actuales" type="number" min="0" value={form.km_actuales} onChange={handleChange} placeholder="85000" />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : '✓ Guardar vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
