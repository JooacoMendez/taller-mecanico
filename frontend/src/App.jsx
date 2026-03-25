import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import ClienteDetalle from './pages/ClienteDetalle';
import ClienteNuevo from './pages/ClienteNuevo';
import VehiculoPatente from './pages/VehiculoPatente';
import VehiculoNuevo from './pages/VehiculoNuevo';
import Ordenes from './pages/Ordenes';
import OrdenNueva from './pages/OrdenNueva';
import OrdenDetalle from './pages/OrdenDetalle';

function ProtectedLayout({ children }) {
  const { isAuth } = useAuth();
  if (!isAuth) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { isAuth } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuth ? <Navigate to="/" replace /> : <Login />} />

      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/clientes" element={<ProtectedLayout><Clientes /></ProtectedLayout>} />
      <Route path="/clientes/nuevo" element={<ProtectedLayout><ClienteNuevo /></ProtectedLayout>} />
      <Route path="/clientes/:id" element={<ProtectedLayout><ClienteDetalle /></ProtectedLayout>} />
      <Route path="/vehiculos/nuevo" element={<ProtectedLayout><VehiculoNuevo /></ProtectedLayout>} />
      <Route path="/vehiculos/patente" element={<ProtectedLayout><VehiculoPatente /></ProtectedLayout>} />
      <Route path="/vehiculos/patente/:patente" element={<ProtectedLayout><VehiculoPatente /></ProtectedLayout>} />
      <Route path="/ordenes" element={<ProtectedLayout><Ordenes /></ProtectedLayout>} />
      <Route path="/ordenes/nueva" element={<ProtectedLayout><OrdenNueva /></ProtectedLayout>} />
      <Route path="/ordenes/:id" element={<ProtectedLayout><OrdenDetalle /></ProtectedLayout>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
