-- ============================================================
-- Taller Mecánico - Esquema de base de datos v1
-- ============================================================



-- Clientes del taller
CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(30),
  email VARCHAR(150),
  activo BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

-- Vehículos (un cliente puede tener varios)
CREATE TABLE IF NOT EXISTS vehiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  patente VARCHAR(20) NOT NULL,
  marca VARCHAR(80),
  modelo VARCHAR(80),
  anio INTEGER,
  km_actuales INTEGER,
  activo BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE UNIQUE INDEX IF NOT EXISTS vehiculos_patente_activo_idx ON vehiculos(patente) WHERE activo = true;

-- Órdenes de trabajo
CREATE TABLE IF NOT EXISTS ordenes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehiculo_id INTEGER REFERENCES vehiculos(id) ON DELETE RESTRICT,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre VARCHAR(255),
  presupuesto_finalizado BOOLEAN DEFAULT false,

  estado VARCHAR(30) NOT NULL DEFAULT 'nueva'
    CHECK (estado IN ('nueva', 'presupuestada', 'en_proceso', 'lista', 'entregada')),
  problema_reportado TEXT,
  diagnostico_final TEXT,
  fecha_ingreso DATETIME DEFAULT (datetime('now', 'localtime')),
  fecha_entrega DATETIME,
  created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

-- Ítems de cada orden (repuestos y mano de obra)
CREATE TABLE IF NOT EXISTS items_orden (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER REFERENCES ordenes(id) ON DELETE CASCADE,
  descripcion VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('repuesto', 'mano_de_obra')),
  precio_unitario REAL NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  subtotal REAL GENERATED ALWAYS AS (precio_unitario * cantidad) STORED
);

-- Pagos por orden
CREATE TABLE IF NOT EXISTS pagos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER REFERENCES ordenes(id) ON DELETE RESTRICT,
  monto REAL NOT NULL,
  forma_pago VARCHAR(30) CHECK (forma_pago IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
  nro_recibo VARCHAR(50) UNIQUE,
  fecha_pago DATETIME DEFAULT (datetime('now', 'localtime'))
);
