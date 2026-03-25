require('dotenv').config();
const express = require('express');
const cors = require('cors');


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

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
