const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
    process.exit(1);
  }
}

migrate();
