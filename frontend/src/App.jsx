import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';

// Pages
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import ClienteDetalle from './pages/ClienteDetalle';
import ClienteNuevo from './pages/ClienteNuevo';
import VehiculoPatente from './pages/VehiculoPatente';
import VehiculoNuevo from './pages/VehiculoNuevo';
import Ordenes from './pages/Ordenes';
import OrdenNueva from './pages/OrdenNueva';
import OrdenDetalle from './pages/OrdenDetalle';

function Layout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/clientes" element={<Layout><Clientes /></Layout>} />
      <Route path="/clientes/nuevo" element={<Layout><ClienteNuevo /></Layout>} />
      <Route path="/clientes/:id" element={<Layout><ClienteDetalle /></Layout>} />
      <Route path="/vehiculos/nuevo" element={<Layout><VehiculoNuevo /></Layout>} />
      <Route path="/vehiculos/patente" element={<Layout><VehiculoPatente /></Layout>} />
      <Route path="/vehiculos/patente/:patente" element={<Layout><VehiculoPatente /></Layout>} />
      <Route path="/ordenes" element={<Layout><Ordenes /></Layout>} />
      <Route path="/ordenes/nueva" element={<Layout><OrdenNueva /></Layout>} />
      <Route path="/ordenes/:id" element={<Layout><OrdenDetalle /></Layout>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
