import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientes, deleteCliente } from '../api/clientes';
import { useAuth } from '../context/AuthContext';
import TablaPaginada from '../components/TablaPaginada';

export default function Clientes() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const reload = () => getClientes(token).then(setClientes).catch(console.error).finally(() => setLoading(false));

  useEffect(() => { reload(); }, [token]);

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // prevent row click from navigating
    if (!confirm('¿Eliminar este cliente? Se eliminarán también sus vehículos.')) return;
    try {
      await deleteCliente(token, id);
      setClientes(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err.message || 'Error al eliminar cliente');
    }
  };

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (c.telefono || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const cols = [
    { key: 'nombre', label: 'Nombre' },
    {
      key: 'telefono', label: 'Teléfono', muted: true,
      render: row => row.telefono || '—'
    },
    {
      key: 'email', label: 'Email', muted: true,
      render: row => row.email || '—'
    },
    {
      key: 'created_at', label: 'Registrado', muted: true,
      render: row => new Date(row.created_at).toLocaleDateString('es-AR')
    },
    {
      key: '_delete', label: '',
      render: row => user?.rol === 'dueno' ? (
        <button
          className="btn btn-danger btn-icon btn-sm"
          title="Eliminar cliente"
          onClick={e => handleDelete(e, row.id)}
          style={{ lineHeight: 1 }}
        >×</button>
      ) : null
    },
  ];

  if (loading) return <div className="loading-wrap"><div className="spinner" />Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/clientes/nuevo')}>
          + Nuevo cliente
        </button>
      </div>

      <div className="card">
        <div className="search-bar">
          <div className="search-input-wrap" style={{ flex: 1 }}>
            <span className="search-icon">🔍</span>
            <input
              className="form-control search-input"
              placeholder="Buscar por nombre, teléfono o email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <TablaPaginada
          columns={cols}
          data={filtered}
          emptyText="No se encontraron clientes"
          onRowClick={row => navigate(`/clientes/${row.id}`)}
        />
      </div>
    </div>
  );
}
