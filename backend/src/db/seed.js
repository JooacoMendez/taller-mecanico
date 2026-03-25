/**
 * Script de seed inicial.
 * Crea un usuario 'dueno' con email admin@taller.com y password: Admin1234
 * Ejecutar con: node src/db/seed.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seed() {
  try {
    const hash = await bcrypt.hash('Admin1234', 10);

    await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['Administrador', 'admin@taller.com', hash, 'dueno']
    );

    console.log('✅ Usuario seed creado: admin@taller.com / Admin1234');
    console.log('   ⚠️  Cambiá la contraseña luego del primer inicio de sesión.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en seed:', err.message);
    process.exit(1);
  }
}

seed();
