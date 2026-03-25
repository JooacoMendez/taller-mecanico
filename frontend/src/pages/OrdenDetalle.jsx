import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrden, cambiarEstadoOrden, addItem, deleteItem, deleteOrden, finalizarPresupuesto } from '../api/ordenes';
import BadgeEstado from '../components/BadgeEstado';
import ModalPago from '../components/ModalPago';

const ESTADOS_FLOW = ['nueva', 'presupuestada', 'en_proceso', 'lista', 'entregada'];

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n ?? 0);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function OrdenDetalle() {
  const { id } = useParams();
  const token = null; const user = null;
  const navigate = useNavigate();

  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPago, setShowPago] = useState(false);
  const [savingEstado, setSavingEstado] = useState(false);
  const [error, setError] = useState('');

  // New item inline form
  const [itemForm, setItemForm] = useState({ descripcion: '', tipo: 'repuesto', precio_unitario: '', cantidad: 1 });
  const [addingItem, setAddingItem] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);

  const reload = () => getOrden(token, id).then(setOrden).catch(console.error);

  useEffect(() => {
    setLoading(true);
    getOrden(token, id).then(setOrden).catch(console.error).finally(() => setLoading(false));
  }, [token, id]);

  const handleEstado = async (nuevoEstado) => {
    setSavingEstado(true);
    setError('');
    try {
      await cambiarEstadoOrden(token, id, nuevoEstado);
      reload();
    } catch (err) { setError(err.message); }
    finally { setSavingEstado(false); }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemForm.descripcion.trim() || !itemForm.precio_unitario) return;
    setAddingItem(true);
    try {
      await addItem(token, id, {
        ...itemForm,
        precio_unitario: parseFloat(itemForm.precio_unitario),
        cantidad: parseInt(itemForm.cantidad) || 1
      });
      setItemForm({ descripcion: '', tipo: 'repuesto', precio_unitario: '', cantidad: 1 });
      setShowItemForm(false);
      reload();
    } catch (err) { setError(err.message); }
    finally { setAddingItem(false); }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('¿Eliminar este ítem?')) return;
    try { await deleteItem(token, itemId); reload(); }
    catch (err) { setError(err.message); }
  };

  const handleDeleteOrden = async () => {
    if (!confirm('¿Eliminar esta orden determinadamente?')) return;
    try {
      await deleteOrden(token, id);
      navigate('/ordenes');
    } catch (err) { setError(err.message); }
  };

  const handleDescargarPDF = () => {
    window.open(`/api/ordenes/${id}/recibo?token=${token}`, '_blank');
  };

  const handleFinalizarPresupuesto = async () => {
    if (!confirm('¿Confirmar presupuesto? Ya no se podrán agregar, modificar o eliminar ítems.')) return;
    setSavingEstado(true);
    setError('');
    try {
      await finalizarPresupuesto(token, id);
      reload();
    } catch (err) { setError(err.message); }
    finally { setSavingEstado(false); }
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" />Cargando orden...</div>;
  if (!orden) return <div className="loading-wrap">Orden no encontrada</div>;

  const totalOrden = orden.items?.reduce((s, i) => s + parseFloat(i.subtotal ?? 0), 0) ?? 0;
  const totalPagado = orden.pagos?.reduce((s, p) => s + parseFloat(p.monto), 0) ?? 0;
  const saldo = totalOrden - totalPagado;
  const estadoIdx = ESTADOS_FLOW.indexOf(orden.estado);
  const nextEstado = ESTADOS_FLOW[estadoIdx + 1];
  const prevEstado = ESTADOS_FLOW[estadoIdx - 1];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/ordenes')} style={{ marginBottom: 8 }}>← Volver</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <h1 className="page-title">Orden #{orden.id}</h1>
            <BadgeEstado estado={orden.estado} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {orden.estado !== 'entregada' && (!orden.pagos || orden.pagos.length === 0) && (
            <button className="btn btn-danger btn-sm" onClick={handleDeleteOrden}>🗑 Eliminar</button>
          )}
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={handleDescargarPDF}
            disabled={saldo > 0}
            title={saldo > 0 ? "El recibo solo se puede generar cuando el presupuesto está pagado completamente" : "Descargar PDF"}
          >
            📄 PDF
          </button>
          {['en_proceso', 'lista'].includes(orden.estado) && saldo > 0 && (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => handleEstado('presupuestada')} 
              disabled={savingEstado}
              title="Volver a Presupuestada para agregar/quitar ítems"
            >
              ← Volver a Presupuestada
            </button>
          )}
          {orden.estado === 'en_proceso' && (
            <button className="btn btn-primary btn-sm" onClick={() => handleEstado('lista')} disabled={savingEstado}>
              Avanzar: lista →
            </button>
          )}
          {orden.estado === 'lista' && (
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => handleEstado('entregada')} 
              disabled={savingEstado || saldo > 0}
              title={saldo > 0 ? "Se requiere pago total para entregar" : "Entregar vehículo"}
            >
              Avanzar: entregada →
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Vehicle & client info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">Cliente</div>
            <div className="detail-value">
              {orden.cliente_id && orden.cliente_activo ? (
                <a href={`/clientes/${orden.cliente_id}`} onClick={e => { e.preventDefault(); navigate(`/clientes/${orden.cliente_id}`); }}>
                  {orden.cliente_nombre}
                </a>
              ) : (
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {orden.cliente_nombre || 'Cliente Anónimo'} <span style={{ fontSize: '0.8em', fontStyle: 'italic', color: 'var(--text-muted)' }}>(Eliminado)</span>
                </span>
              )}
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Teléfono</div>
            <div className="detail-value">{orden.cliente_activo ? (orden.cliente_telefono || '—') : '—'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Patente</div>
            <div className="detail-value" style={{ fontWeight: 700 }}>
              <a href={`/vehiculos/patente/${orden.patente}`} onClick={e => { e.preventDefault(); navigate(`/vehiculos/patente/${orden.patente}`); }}>
                {orden.patente}
              </a>
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Vehículo</div>
            <div className="detail-value">{orden.marca} {orden.modelo} {orden.anio ? `(${orden.anio})` : ''}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Ingreso</div>
            <div className="detail-value">{fmtDate(orden.fecha_ingreso)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Entrega</div>
            <div className="detail-value">{fmtDate(orden.fecha_entrega)}</div>
          </div>
        </div>

        {orden.problema_reportado && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
            <div className="detail-label" style={{ marginBottom: 4 }}>Problema reportado</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{orden.problema_reportado}</div>
          </div>
        )}
        {orden.diagnostico_final && (
          <div style={{ marginTop: 12 }}>
            <div className="detail-label" style={{ marginBottom: 4 }}>Diagnóstico final</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{orden.diagnostico_final}</div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2>Presupuesto / Ítems</h2>
          {!orden.presupuesto_finalizado && orden.estado !== 'entregada' && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowItemForm(v => !v)}>
              {showItemForm ? '× Cancelar' : '+ Agregar ítem'}
            </button>
          )}
        </div>

        {showItemForm && (
          <form onSubmit={handleAddItem} style={{ background: 'var(--bg-hover)', borderRadius: 8, padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px 80px auto', gap: 10, alignItems: 'end' }}>
              <div className="form-group">
                <label className="form-label">Descripción *</label>
                <input 
                  className="form-control" 
                  value={itemForm.descripcion} 
                  onChange={e => setItemForm(f => ({ ...f, descripcion: e.target.value }))} 
                  required autoFocus 
                  disabled={itemForm.tipo === 'mano_de_obra'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select 
                  className="form-control" 
                  value={itemForm.tipo} 
                  onChange={e => {
                    const newTipo = e.target.value;
                    if (newTipo === 'mano_de_obra') {
                      setItemForm(f => ({ ...f, tipo: newTipo, descripcion: 'Mano de obra', cantidad: 1 }));
                    } else {
                      setItemForm(f => ({ ...f, tipo: newTipo }));
                    }
                  }}
                >
                  <option value="repuesto">Repuesto</option>
                  <option value="mano_de_obra">Mano de obra</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Precio unit.</label>
                <input className="form-control" type="number" step="0.01" min="0" value={itemForm.precio_unitario} onChange={e => setItemForm(f => ({ ...f, precio_unitario: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Cant.</label>
                <input 
                  className="form-control" 
                  type="number" min="1" 
                  value={itemForm.cantidad} 
                  onChange={e => setItemForm(f => ({ ...f, cantidad: e.target.value }))} 
                  disabled={itemForm.tipo === 'mano_de_obra'}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={addingItem} style={{ alignSelf: 'flex-end' }}>
                {addingItem ? '...' : '✓'}
              </button>
            </div>
          </form>
        )}

        {(!orden.items || orden.items.length === 0) ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-text">Sin ítems</div>
            <div className="empty-state-sub">Agregá repuestos y mano de obra</div>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Descripción</th><th>Tipo</th><th>Cant.</th><th>P. Unit.</th><th>Subtotal</th><th width="40"></th></tr>
                </thead>
                <tbody>
                  {orden.items.map(item => (
                    <tr key={item.id}>
                      <td>{item.descripcion}</td>
                      <td><span className={`tag tag-${item.tipo}`}>{item.tipo === 'repuesto' ? 'Repuesto' : 'Mano de obra'}</span></td>
                      <td className="muted">{item.cantidad}</td>
                      <td className="muted">{fmt(item.precio_unitario)}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(item.subtotal)}</td>
                      <td>
                        {!orden.presupuesto_finalizado && orden.estado !== 'entregada' && (
                          <button 
                            className="btn btn-danger btn-icon btn-sm" 
                            onClick={() => handleDeleteItem(item.id)} 
                            title={(totalOrden - (item.subtotal || 0)) < totalPagado ? "No se puede eliminar (el saldo quedaría negativo)" : "Eliminar"}
                            disabled={(totalOrden - (item.subtotal || 0)) < totalPagado}
                          >×</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="total-row">
              <span className="total-label">Total presupuesto</span>
              <span className="total-value">{fmt(totalOrden)}</span>
            </div>
            {!orden.presupuesto_finalizado && orden.estado !== 'entregada' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="btn btn-primary" onClick={handleFinalizarPresupuesto} disabled={savingEstado}>
                  ✓ Finalizar presupuesto
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payments */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2>Pagos</h2>
          {['en_proceso', 'lista', 'entregada'].includes(orden.estado) && saldo > 0 ? (
            <button className="btn btn-success btn-sm" onClick={() => setShowPago(true)}>
              + Registrar pago
            </button>
          ) : saldo <= 0 && totalOrden > 0 ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
              Pagado en su totalidad
            </span>
          ) : (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Disponible desde "En proceso"
            </span>
          )}
        </div>

        {(!orden.pagos || orden.pagos.length === 0) ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <div className="empty-state-icon">💳</div>
            <div className="empty-state-text">Sin pagos registrados</div>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Recibo</th><th>Forma de pago</th><th>Fecha</th><th>Monto</th></tr>
                </thead>
                <tbody>
                  {orden.pagos.map(p => (
                    <tr key={p.id}>
                      <td className="muted">{p.nro_recibo || '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{p.forma_pago}</td>
                      <td className="muted">{fmtDate(p.fecha_pago)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>{fmt(p.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 12, padding: '12px 14px', background: 'var(--bg-hover)', borderRadius: 8 }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginRight: 8 }}>Total pagado:</span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(totalPagado)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginRight: 8 }}>Saldo:</span>
                <span style={{ fontWeight: 700, color: saldo > 0 ? 'var(--warning)' : 'var(--success)' }}>{fmt(saldo)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {showPago && (
        <ModalPago
          ordenId={id}
          onClose={() => setShowPago(false)}
          onSuccess={() => { reload(); }}
        />
      )}
    </div>
  );
}
