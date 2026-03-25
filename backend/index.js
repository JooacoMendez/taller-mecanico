require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const clientesRoutes = require('./src/routes/clientes');
const vehiculosRoutes = require('./src/routes/vehiculos');
const ordenesRoutes = require('./src/routes/ordenes');
const itemsRoutes = require('./src/routes/items');
const dashboardRoutes = require('./src/routes/dashboard');

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Health check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Start ───────────────────────────────────────────────
const pool = require('./src/db/pool');

const PORT = process.env.PORT || 3001;

// Auto-migration
pool.query(`
  ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
  ALTER TABLE vehiculos DROP CONSTRAINT IF EXISTS vehiculos_patente_key;
  CREATE UNIQUE INDEX IF NOT EXISTS vehiculos_patente_activo_idx ON vehiculos(patente) WHERE activo = true;
  UPDATE vehiculos SET patente = SPLIT_PART(patente, '-borrado-', 1) WHERE patente LIKE '%-borrado-%';
  
  ALTER TABLE clientes ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

  ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL;
  ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS cliente_nombre VARCHAR(255);
  
  UPDATE ordenes SET 
    cliente_id = v.cliente_id,
    cliente_nombre = c.nombre
  FROM vehiculos v 
  LEFT JOIN clientes c ON v.cliente_id = c.id
  WHERE ordenes.vehiculo_id = v.id AND ordenes.cliente_id IS NULL;
`)
  .then(() => {
    console.log('✅ Base de datos actualizada: Soporte histórico estricto de clientes en órdenes');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error de migración:', err);
  });
