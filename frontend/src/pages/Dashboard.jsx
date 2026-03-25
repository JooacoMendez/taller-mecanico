import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/dashboard';
import BadgeEstado from '../components/BadgeEstado';
import TablaPaginada from '../components/TablaPaginada';

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function Dashboard() {
  const token = null;
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard(token).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="loading-wrap"><div className="spinner" />Cargando...</div>;

  const kpis = [
    { label: 'Órdenes abiertas hoy', value: data?.ordenes_hoy ?? 0, icon: '📋', color: 'blue' },
    { label: 'Ingresos del mes', value: fmt(data?.ingresos_mes ?? 0), icon: '💰', color: 'green' },
    { label: 'En proceso', value: data?.por_estado?.en_proceso ?? 0, icon: '⚙️', color: 'yellow' },
    { label: 'Listas para entregar', value: data?.por_estado?.lista ?? 0, icon: '✅', color: 'purple' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen del taller</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/ordenes/nueva')}>
          + Nueva orden
        </button>
      </div>

      <div className="kpi-grid">
        {kpis.map(k => (
          <div key={k.label} className={`kpi-card ${k.color}`}>
            <div className="kpi-icon">{k.icon}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2>Órdenes recientes</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/ordenes')}>
            Ver todas →
          </button>
        </div>
        <TablaPaginada
          columns={[
            { key: 'id', label: '#', muted: true, render: r => '#' + r.id },
            { key: 'cliente_nombre', label: 'Cliente' },
            { key: 'vehiculo', label: 'Vehículo', render: r => `${r.patente} — ${r.marca} ${r.modelo}` },
            { key: 'estado', label: 'Estado', render: r => <BadgeEstado estado={r.estado} /> },
            { key: 'fecha_ingreso', label: 'Ingreso', muted: true, render: r => fmtDate(r.fecha_ingreso) },
            { key: 'total_orden', label: 'Total', render: r => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(r.total_orden ?? 0) }
          ]}
          data={data.recientes || []}
          onRowClick={r => navigate(`/ordenes/${r.id}`)}
          emptyText="Sin órdenes recientes"
        />
      </div>
    </div>
  );
}
