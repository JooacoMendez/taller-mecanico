const pool = require('../db/pool');

async function listarClientes(req, res) {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM clientes';
    const params = [];

    if (search) {
      query += ' WHERE nombre ILIKE $1 OR telefono ILIKE $1 OR email ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY nombre ASC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar clientes' });
  }
}

async function obtenerCliente(req, res) {
  const { id } = req.params;
  if (id === 'null' || isNaN(parseInt(id))) {
    return res.status(404).json({ error: 'Cliente no válido o eliminado' });
  }
  try {
    const clienteRes = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
    if (clienteRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const vehiculosRes = await pool.query(
      'SELECT * FROM vehiculos WHERE cliente_id = $1 AND activo = true ORDER BY created_at DESC',
      [id]
    );

    res.json({ ...clienteRes.rows[0], vehiculos: vehiculosRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
}

async function crearCliente(req, res) {
  const { nombre, telefono, email } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO clientes (nombre, telefono, email) VALUES ($1, $2, $3) RETURNING *',
      [nombre, telefono || null, email || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
}

async function editarCliente(req, res) {
  const { id } = req.params;
  const { nombre, telefono, email } = req.body;

  try {
    const { rows } = await pool.query(
      'UPDATE clientes SET nombre = COALESCE($1, nombre), telefono = COALESCE($2, telefono), email = COALESCE($3, email) WHERE id = $4 RETURNING *',
      [nombre, telefono, email, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al editar cliente' });
  }
}

async function eliminarCliente(req, res) {
  const { id } = req.params;

  try {
    // Verificar si tiene órdenes activas (no entregadas)
    const check = await pool.query(
      `SELECT o.id FROM ordenes o
       JOIN vehiculos v ON o.vehiculo_id = v.id
       WHERE v.cliente_id = $1 AND o.estado != 'entregada' LIMIT 1`,
      [id]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar: el cliente tiene órdenes de trabajo activas',
      });
    }

    // Desvincular vehículos para preservar el historial de órdenes entregadas
    await pool.query('UPDATE vehiculos SET cliente_id = NULL WHERE cliente_id = $1', [id]);

    const { rowCount } = await pool.query('DELETE FROM clientes WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
}

module.exports = { listarClientes, obtenerCliente, crearCliente, editarCliente, eliminarCliente };
