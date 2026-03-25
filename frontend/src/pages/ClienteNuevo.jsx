import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCliente } from '../api/clientes';
import { createVehiculo } from '../api/vehiculos';
import { createOrden } from '../api/ordenes';
import { useAuth } from '../context/AuthContext';

export default function ClienteNuevo() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('cliente'); // 'cliente' | 'vehiculo'
  const [clienteId, setClienteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [clienteForm, setClienteForm] = useState({ nombre: '', telefono: '', email: '' });
  const [vehiculoForm, setVehiculoForm] = useState({ patente: '', marca: '', modelo: '', anio: '', km_actuales: '' });
  const [problema, setProblema] = useState('');

  const handleClienteChange = e => setClienteForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleVehiculoChange = e => setVehiculoForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleClienteSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await createCliente(token, clienteForm);
      setClienteId(data.id);
      setStep('vehiculo');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVehiculoSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const vehiculo = await createVehiculo(token, {
        ...vehiculoForm,
        patente: vehiculoForm.patente.replace(/\s/g, '').toUpperCase(),
        cliente_id: clienteId,
        km_actuales: vehiculoForm.km_actuales ? parseInt(vehiculoForm.km_actuales) : null
      });
      // Automatically create an order for the new vehicle
      const orden = await createOrden(token, {
        vehiculo_id: vehiculo.id,
        problema_reportado: problema || null
      });
      navigate(`/ordenes/${orden.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const skipVehiculo = () => navigate(`/clientes/${clienteId}`);

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/clientes')} style={{ marginBottom: 8 }}>
            ← Volver
          </button>
          <h1 className="page-title">Nuevo cliente</h1>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <div className={`chip ${step === 'cliente' || clienteId ? 'active' : ''}`}>1. Datos del cliente</div>
        <div className={`chip ${step === 'vehiculo' ? 'active' : ''}`}>2. Vehículo y primera orden</div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {step === 'cliente' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h2 style={{ marginBottom: 20 }}>Datos del cliente</h2>
          <form onSubmit={handleClienteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Nombre completo *</label>
              <input className="form-control" name="nombre" value={clienteForm.nombre} onChange={handleClienteChange} required autoFocus />
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-control" name="telefono" type="tel" value={clienteForm.telefono} onChange={handleClienteChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" name="email" type="email" value={clienteForm.email} onChange={handleClienteChange} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/clientes')}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar y continuar →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'vehiculo' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h2 style={{ marginBottom: 4 }}>Vehículo y primera orden</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
            Al guardar el vehículo se creará automáticamente la primera orden de trabajo.
          </p>
          <form onSubmit={handleVehiculoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Patente *</label>
              <input
                className="form-control"
                name="patente"
                value={vehiculoForm.patente}
                onChange={e => setVehiculoForm(f => ({ ...f, patente: e.target.value.replace(/\s/g, '').toUpperCase() }))}
                placeholder="ABC123"
                required
                autoFocus
              />
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Marca</label>
                <input className="form-control" name="marca" value={vehiculoForm.marca} onChange={handleVehiculoChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Modelo</label>
                <input className="form-control" name="modelo" value={vehiculoForm.modelo} onChange={handleVehiculoChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Año</label>
                <input className="form-control" name="anio" type="number" min="1900" max="2100" value={vehiculoForm.anio} onChange={handleVehiculoChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Km actuales</label>
                <input className="form-control" name="km_actuales" type="number" min="0" value={vehiculoForm.km_actuales} onChange={handleVehiculoChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Problema reportado (opcional)</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Describí el motivo del ingreso..."
                value={problema}
                onChange={e => setProblema(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={skipVehiculo}>Omitir vehículo</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : '✓ Guardar y crear orden'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
