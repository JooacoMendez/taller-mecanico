import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrdenes } from '../api/ordenes';
import BadgeEstado from '../components/BadgeEstado';
import TablaPaginada from '../components/TablaPaginada';

const ESTADOS = ['todos', 'nueva', 'presupuestada', 'en_proceso', 'lista', 'entregada'];
const ESTADO_LABELS = { todos: 'Todas', nueva: 'Nueva', presupuestada: 'Presupuestada', en_proceso: 'En proceso', lista: 'Lista', entregada: 'Entregada' };

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

export default function Ordenes() {
  const token = null;
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = estadoFiltro !== 'todos' ? { estado: estadoFiltro } : {};
    getOrdenes(token, params).then(setOrdenes).catch(console.error).finally(() => setLoading(false));
  }, [token, estadoFiltro]);

  const filtered = ordenes.filter(o => {
    const q = search.toLowerCase();
    return !q || o.cliente_nombre?.toLowerCase().includes(q) || o.patente?.toLowerCase().includes(q) ||
      o.marca?.toLowerCase().includes(q) || o.modelo?.toLowerCase().includes(q);
  });

  const cols = [
    { key: 'id', label: '#', width: 50, render: r => <span className="muted">#{r.id}</span> },
    { key: 'cliente_nombre', label: 'Cliente' },
    { key: 'vehiculo', label: 'Vehículo', render: r => `${r.patente} — ${r.marca ?? ''} ${r.modelo ?? ''}`.trim() },
    { key: 'estado', label: 'Estado', render: r => <BadgeEstado estado={r.estado} /> },
    { key: 'fecha_ingreso', label: 'Ingreso', muted: true, render: r => new Date(r.fecha_ingreso).toLocaleDateString('es-AR') },
    { key: 'total_orden', label: 'Total', render: r => fmt(r.total_orden ?? 0) },
    { key: 'total_pagado', label: 'Pagado', muted: true, render: r => fmt(r.total_pagado ?? 0) },
  ];

  if (loading) return <div className="loading-wrap"><div className="spinner" />Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Órdenes de trabajo</h1>
          <p className="page-subtitle">{ordenes.length} orden{ordenes.length !== 1 ? 'es' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/ordenes/nueva')}>
          + Nueva orden
        </button>
      </div>

      <div className="filter-chips">
        {ESTADOS.map(e => (
          <button key={e} className={`chip ${estadoFiltro === e ? 'active' : ''}`} onClick={() => setEstadoFiltro(e)}>
            {ESTADO_LABELS[e]}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="search-bar">
          <div className="search-input-wrap" style={{ flex: 1 }}>
            <span className="search-icon">🔍</span>
            <input
              className="form-control search-input"
              placeholder="Buscar por cliente, patente o vehículo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <TablaPaginada
          columns={cols}
          data={filtered}
          emptyText="No hay órdenes"
          onRowClick={row => navigate(`/ordenes/${row.id}`)}
        />
      </div>
    </div>
  );
}
