import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVehiculoPorPatente } from '../api/vehiculos';
import { useAuth } from '../context/AuthContext';
import BadgeEstado from '../components/BadgeEstado';
import TablaPaginada from '../components/TablaPaginada';

export default function VehiculoPatente() {
  const { patente } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!patente);
  const [search, setSearch] = useState(patente ?? '');
  const [error, setError] = useState('');

  const buscar = async (p) => {
    if (!p.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await getVehiculoPorPatente(token, p.trim().toUpperCase());
      setData(res);
      navigate(`/vehiculos/patente/${p.trim().toUpperCase()}`, { replace: true });
    } catch (err) {
      setError('Patente no encontrada');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (patente) buscar(patente); }, []);

  const handleSearch = e => {
    e.preventDefault();
    buscar(search);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🔍 Buscar por patente</h1>
          <p className="page-subtitle">Ver historial completo de un vehículo</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, maxWidth: 500 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            className="search-input form-control"
            placeholder="Ej: AB123CD"
            value={search}
            onChange={(e) => setSearch(e.target.value.replace(/\s/g, '').toUpperCase())}
            style={{ flex: 1, textAlign: 'left', paddingLeft: 12 }}
            autoFocus
          />
          <button type="submit" className="btn btn-primary">Buscar</button>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading-wrap"><div className="spinner" />Buscando...</div>}

      {data && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ marginBottom: 16 }}>
              {data.marca} {data.modelo}
              <span style={{ marginLeft: 12, fontSize: '0.8em', color: 'var(--text-secondary)' }}>{data.patente}</span>
            </h2>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">Patente</div>
                <div className="detail-value" style={{ fontWeight: 700, fontSize: '1.1rem' }}>{data.patente}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Cliente</div>
                <div className="detail-value">
                  <a href={`/clientes/${data.cliente_id}`} onClick={e => { e.preventDefault(); navigate(`/clientes/${data.cliente_id}`); }}>
                    {data.cliente_nombre}
                  </a>
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Marca / Modelo</div>
                <div className="detail-value">{data.marca} {data.modelo}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Año</div>
                <div className="detail-value">{data.anio || '—'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Km actuales</div>
                <div className="detail-value">{data.km_actuales ? data.km_actuales.toLocaleString('es-AR') + ' km' : '—'}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: 16 }}>Historial de órdenes ({data.ordenes?.length ?? 0})</h2>
            <TablaPaginada
              columns={[
                { key: 'id', label: '#', muted: true, render: r => '#' + r.id },
                { key: 'problema_reportado', label: 'Problema', render: r => <div style={{maxWidth:280,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.problema_reportado||'—'}</div> },
                { key: 'estado', label: 'Estado', render: r => <BadgeEstado estado={r.estado} /> },
                { key: 'fecha_ingreso', label: 'Ingreso', muted: true, render: r => new Date(r.fecha_ingreso).toLocaleDateString('es-AR') },
                { key: 'fecha_entrega', label: 'Entrega', muted: true, render: r => r.fecha_entrega ? new Date(r.fecha_entrega).toLocaleDateString('es-AR') : '—' },
                { key: 'total_orden', label: 'Total', render: r => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(r.total_orden ?? 0) }
              ]}
              data={data.ordenes || []}
              onRowClick={r => navigate(`/ordenes/${r.id}`)}
              emptyText="Sin órdenes registradas"
            />
          </div>
        </>
      )}
    </div>
  );
}
