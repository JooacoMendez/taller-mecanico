require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const clientesRoutes = require('./src/routes/clientes');
const vehiculosRoutes = require('./src/routes/vehiculos');
const ordenesRoutes = require('./src/routes/ordenes');
const itemsRoutes = require('./src/routes/items');
const dashboardRoutes = require('./src/routes/dashboard');
const pool = require('./src/db/pool');

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ── Initialize Database ─────────────────────────────
async function initializeDatabase() {
  try {
    console.log('🔧 Inicializando base de datos...');
    
    // Conectar a la base de datos
    await pool.connect();
    
    // Verificar si las tablas existen
    const result = await pool.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='clientes' LIMIT 1"
    );
    
    if (result.rows.length === 0) {
      console.log('📋 Creando tablas desde init.sql...');
      const initSqlPath = path.join(__dirname, 'src', 'db', 'init.sql');
      if (fs.existsSync(initSqlPath)) {
        const sql = fs.readFileSync(initSqlPath, 'utf8');
        // Execute each statement separately
        const statements = sql.split(';').filter(stmt => stmt.trim());
        for (const statement of statements) {
          if (statement.trim()) {
            pool.exec(statement.trim());
          }
        }
        console.log('✅ Base de datos inicializada');
      } else {
        console.warn('⚠️ Archivo init.sql no encontrado');
      }
    } else {
      console.log('✅ Base de datos ya existe');
    }
  } catch (err) {
    console.error('❌ Error al inicializar la base de datos:', err.message);
    // No lanzar el error, permitir que continúe
  }
}

// ── Routes ──────────────────────────────────────────────

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
const PORT = process.env.PORT || 3001;

// Inicializar la base de datos antes de escuchar
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('❌ Error fatal al iniciar:', err);
  process.exit(1);
});

