-- ============================================================
-- Taller Mecánico - Esquema de base de datos v1
-- ============================================================

-- Usuarios del sistema (dueño y mecánicos)
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('dueno', 'mecanico')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clientes del taller
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(30),
  email VARCHAR(150),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vehículos (un cliente puede tener varios)
CREATE TABLE IF NOT EXISTS vehiculos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  patente VARCHAR(20) UNIQUE NOT NULL,
  marca VARCHAR(80),
  modelo VARCHAR(80),
  anio INTEGER,
  km_actuales INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Órdenes de trabajo
CREATE TABLE IF NOT EXISTS ordenes (
  id SERIAL PRIMARY KEY,
  vehiculo_id INTEGER REFERENCES vehiculos(id) ON DELETE RESTRICT,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'nueva'
    CHECK (estado IN ('nueva', 'presupuestada', 'en_proceso', 'lista', 'entregada')),
  problema_reportado TEXT,
  diagnostico_final TEXT,
  fecha_ingreso TIMESTAMP DEFAULT NOW(),
  fecha_entrega TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ítems de cada orden (repuestos y mano de obra)
CREATE TABLE IF NOT EXISTS items_orden (
  id SERIAL PRIMARY KEY,
  orden_id INTEGER REFERENCES ordenes(id) ON DELETE CASCADE,
  descripcion VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('repuesto', 'mano_de_obra')),
  precio_unitario NUMERIC(12,2) NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC(12,2) GENERATED ALWAYS AS (precio_unitario * cantidad) STORED
);

-- Pagos por orden
CREATE TABLE IF NOT EXISTS pagos (
  id SERIAL PRIMARY KEY,
  orden_id INTEGER REFERENCES ordenes(id) ON DELETE RESTRICT,
  monto NUMERIC(12,2) NOT NULL,
  forma_pago VARCHAR(30) CHECK (forma_pago IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
  nro_recibo VARCHAR(50) UNIQUE,
  fecha_pago TIMESTAMP DEFAULT NOW()
);
