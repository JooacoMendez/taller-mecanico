import { NavLink, useNavigate } from "react-router-dom";

const navItems = [
    { to: "/", icon: "📊", label: "Dashboard", exact: true },
    { to: "/clientes", icon: "👥", label: "Clientes" },
    { to: "/ordenes", icon: "🔧", label: "Órdenes" },
];

export default function Navbar() {
    const user = null;
    const navigate = useNavigate();

    const handleExport = () => {
        window.location.href = "/api/dashboard/export";
    };

    const initials = user?.nombre
        ? user.nombre
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
        : "U";

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
                        className={({ isActive }) =>
                            `nav-link${isActive ? " active" : ""}`
                        }
                    >
                        <span className="nav-link-icon">{icon}</span>
                        {label}
                    </NavLink>
                ))}

                <span
                    className="sidebar-section-label"
                    style={{ marginTop: 16 }}
                >
                    Búsqueda
                </span>
                <NavLink
                    to="/vehiculos/patente"
                    className={({ isActive }) =>
                        `nav-link${isActive ? " active" : ""}`
                    }
                >
                    <span className="nav-link-icon">🚗</span>
                    Buscar por patente
                </NavLink>

                <button
                    onClick={handleExport}
                    className="nav-link"
                    style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        color: "inherit",
                        marginTop: "8px",
                    }}
                >
                    <span className="nav-link-icon">📄</span>
                    Exportar a Excel
                </button>
            </nav>

            {/* <div className="sidebar-footer">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-info-name">{user?.nombre || 'Usuario'}</div>
          <div className="user-info-role">{user?.rol || ''}</div>
        </div>
      </div>*/}
        </aside>
    );
}
