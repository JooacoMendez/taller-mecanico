const pool = require('../db/pool');

async function listarVehiculos(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT v.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono
      FROM vehiculos v
      JOIN clientes c ON v.cliente_id = c.id
      WHERE v.activo = true
      ORDER BY v.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar vehículos' });
  }
}

async function obtenerVehiculo(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT v.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.email AS cliente_email
      FROM vehiculos v
      JOIN clientes c ON v.cliente_id = c.id
      WHERE v.id = $1 AND v.activo = true
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener vehículo' });
  }
}
async function buscarPorPatente(req, res) {
  const { patente } = req.params;
  const patenteLimpia = patente.replace(/\s+/g, '').toUpperCase();
  try {
    const vehiculoRes = await pool.query(`
      SELECT v.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.email AS cliente_email
      FROM vehiculos v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE REPLACE(v.patente, ' ', '') = $1
      ORDER BY v.activo DESC, v.created_at DESC
      LIMIT 1
    `, [patenteLimpia]);

    if (vehiculoRes.rows.length === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    const vehiculo = vehiculoRes.rows[0];

    const ordenesRes = await pool.query(`
      SELECT o.*,
        u.nombre AS mecanico_nombre,
        COALESCE(
          (SELECT SUM(p.monto) FROM pagos p WHERE p.orden_id = o.id), 0
        ) AS total_pagado,
        COALESCE(
          (SELECT SUM(i.subtotal) FROM items_orden i WHERE i.orden_id = o.id), 0
        ) AS total_orden
      FROM ordenes o
      LEFT JOIN usuarios u ON o.usuario_id = u.id
      WHERE o.vehiculo_id IN (
        SELECT id FROM vehiculos WHERE REPLACE(patente, ' ', '') = $1
      )
      ORDER BY o.fecha_ingreso DESC
    `, [patenteLimpia]);

    res.json({ ...vehiculo, ordenes: ordenesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al buscar por patente' });
  }
}

async function crearVehiculo(req, res) {
  const { cliente_id, patente, marca, modelo, anio, km_actuales } = req.body;

  if (!cliente_id || !patente) {
    return res.status(400).json({ error: 'cliente_id y patente son requeridos' });
  }

  const patenteLimpia = patente.replace(/\s+/g, '').toUpperCase();

  try {
    const checkExistent = await pool.query("SELECT * FROM vehiculos WHERE REPLACE(patente, ' ', '') = $1 AND activo = true", [patenteLimpia]);

    if (checkExistent.rows.length > 0) {
      const existing = checkExistent.rows[0];
      if (existing.cliente_id) {
        return res.status(400).json({ error: 'La patente ya está registrada y pertenece a otro cliente activo' });
      } else {
        // Adopt orphaned vehicle
        const updated = await pool.query(`
          UPDATE vehiculos SET 
            cliente_id = $1, marca = $2, modelo = $3, anio = $4, km_actuales = $5
          WHERE id = $6 RETURNING *
        `, [cliente_id, marca, modelo, anio || null, km_actuales, existing.id]);
        return res.status(201).json(updated.rows[0]);
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO vehiculos (cliente_id, patente, marca, modelo, anio, km_actuales)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [cliente_id, patenteLimpia, marca, modelo, anio || null, km_actuales]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'La patente ya está registrada' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al crear vehículo' });
  }
}

async function editarVehiculo(req, res) {
  const { id } = req.params;
  const { marca, modelo, anio, km_actuales } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE vehiculos SET
        marca = COALESCE($1, marca),
        modelo = COALESCE($2, modelo),
        anio = COALESCE($3, anio),
        km_actuales = COALESCE($4, km_actuales)
       WHERE id = $5 RETURNING *`,
      [marca, modelo, anio, km_actuales, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al editar vehículo' });
  }
}


async function eliminarVehiculo(req, res) {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT estado FROM ordenes WHERE vehiculo_id = $1', [id]);
    const tieneNoEntregada = check.rows.some(r => r.estado !== 'entregada');
    
    if (tieneNoEntregada) {
      return res.status(400).json({ error: 'No se puede eliminar: el vehículo tiene órdenes activas asociadas' });
    }

    const { rowCount } = await pool.query(
      `UPDATE vehiculos SET activo = false WHERE id = $1`,
      [id]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'Vehículo no encontrado' });
    
    res.json({ message: 'Vehículo eliminado correctamente (historial conservado)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar vehículo' });
  }
}

module.exports = { listarVehiculos, obtenerVehiculo, buscarPorPatente, crearVehiculo, editarVehiculo, eliminarVehiculo };
