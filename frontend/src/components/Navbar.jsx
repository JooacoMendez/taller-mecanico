import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', icon: '📊', label: 'Dashboard', exact: true },
  { to: '/clientes', icon: '👥', label: 'Clientes' },
  { to: '/ordenes', icon: '🔧', label: 'Órdenes' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🔧</div>
        <div className="sidebar-logo-text">
          TallerApp
          <span>Sistema de gestión</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Navegación</span>
        {navItems.map(({ to, icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="nav-link-icon">{icon}</span>
            {label}
          </NavLink>
        ))}

        <span className="sidebar-section-label" style={{ marginTop: 16 }}>Búsqueda</span>
        <NavLink
          to="/vehiculos/patente"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <span className="nav-link-icon">🚗</span>
          Buscar por patente
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-info-name">{user?.nombre || 'Usuario'}</div>
          <div className="user-info-role">{user?.rol || ''}</div>
        </div>
        <button className="btn-logout" onClick={handleLogout} title="Cerrar sesión">⎋</button>
      </div>
    </aside>
  );
}
