import { useState } from 'react';
import { registrarPago } from '../api/ordenes';
import { useAuth } from '../context/AuthContext';

export default function ModalPago({ ordenId, onClose, onSuccess }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ monto: '', forma_pago: 'efectivo' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.monto || parseFloat(form.monto) <= 0) {
      setError('Ingresá un monto válido');
      return;
    }
    setLoading(true);
    try {
      await registrarPago(token, ordenId, form);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">💳 Registrar pago</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Monto ($)</label>
            <input
              className="form-control"
              type="number"
              name="monto"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.monto}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Forma de pago</label>
            <select className="form-control" name="forma_pago" value={form.forma_pago} onChange={handleChange}>
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">🏦 Transferencia</option>
              <option value="tarjeta">💳 Tarjeta</option>
              <option value="otro">🔁 Otro</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : '✓ Registrar pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
