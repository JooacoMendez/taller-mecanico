require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

console.log('Iniciando script wipe.js...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function wipeAndSeed() {
  try {
    console.log('Conectando a la base de datos...');
    const client = await pool.connect();
    console.log('Conexión exitosa. Limpiando tablas...');
    
    await client.query('TRUNCATE TABLE usuarios, clientes, vehiculos, ordenes, items_orden, pagos RESTART IDENTITY CASCADE');
    console.log('Tablas limpiadas.');

    console.log('Creando usuario administrador...');
    const hash = await bcrypt.hash('Admin1234', 10);
    await client.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4)',
      ['Administrador', 'admin@taller.com', hash, 'dueno']
    );
    console.log('Usuario administrador creado (admin@taller.com / Admin1234).');

    client.release();
    process.exit(0);
  } catch (err) {
    console.error('Error detallado:', err);
    process.exit(1);
  }
}

wipeAndSeed();
