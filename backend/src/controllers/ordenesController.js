const pool = require('../db/pool');

async function listarOrdenes(req, res) {
  const { estado, fecha_desde, fecha_hasta } = req.query;

  let query = `
    SELECT o.*,
      v.patente, v.marca, v.modelo,
      COALESCE(c.nombre, o.cliente_nombre) AS cliente_nombre,
      u.nombre AS mecanico_nombre,
      COALESCE((SELECT SUM(i.subtotal) FROM items_orden i WHERE i.orden_id = o.id), 0) AS total_orden,
      COALESCE((SELECT SUM(p.monto) FROM pagos p WHERE p.orden_id = o.id), 0) AS total_pagado
    FROM ordenes o
    LEFT JOIN vehiculos v ON o.vehiculo_id = v.id
    LEFT JOIN clientes c ON o.cliente_id = c.id
    LEFT JOIN usuarios u ON o.usuario_id = u.id
    WHERE 1=1
  `;
  const params = [];
  let i = 1;

  if (estado) {
    query += ` AND o.estado = $${i++}`;
    params.push(estado);
  }
  if (fecha_desde) {
    query += ` AND o.fecha_ingreso >= $${i++}`;
    params.push(fecha_desde);
  }
  if (fecha_hasta) {
    query += ` AND o.fecha_ingreso <= $${i++}`;
    params.push(fecha_hasta);
  }

  query += ' ORDER BY o.created_at DESC';

  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar órdenes' });
  }
}

async function obtenerOrden(req, res) {
  const { id } = req.params;

  try {
    const ordenRes = await pool.query(`
      SELECT o.*,
        v.patente, v.marca, v.modelo, v.anio, v.km_actuales,
        c.id AS cliente_id, 
        COALESCE(c.nombre, o.cliente_nombre) AS cliente_nombre,
        c.telefono AS cliente_telefono, c.email AS cliente_email,
        u.nombre AS mecanico_nombre
      FROM ordenes o
      LEFT JOIN vehiculos v ON o.vehiculo_id = v.id
      LEFT JOIN clientes c ON o.cliente_id = c.id
      LEFT JOIN usuarios u ON o.usuario_id = u.id
      WHERE o.id = $1
    `, [id]);

    if (ordenRes.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const [itemsRes, pagosRes] = await Promise.all([
      pool.query('SELECT * FROM items_orden WHERE orden_id = $1 ORDER BY id', [id]),
      pool.query('SELECT * FROM pagos WHERE orden_id = $1 ORDER BY fecha_pago DESC', [id]),
    ]);

    res.json({
      ...ordenRes.rows[0],
      items: itemsRes.rows,
      pagos: pagosRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener orden' });
  }
}

async function crearOrden(req, res) {
  const { vehiculo_id, usuario_id, problema_reportado } = req.body;

  if (!vehiculo_id) {
    return res.status(400).json({ error: 'vehiculo_id es requerido' });
  }

  try {
    const vehiculoData = await pool.query('SELECT v.cliente_id, c.nombre FROM vehiculos v LEFT JOIN clientes c ON v.cliente_id = c.id WHERE v.id = $1', [vehiculo_id]);
    const cliente_id = vehiculoData.rows.length > 0 ? vehiculoData.rows[0].cliente_id : null;
    const cliente_nombre = vehiculoData.rows.length > 0 ? vehiculoData.rows[0].nombre : null;

    const { rows } = await pool.query(
      `INSERT INTO ordenes (vehiculo_id, usuario_id, problema_reportado, cliente_id, cliente_nombre)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [vehiculo_id, usuario_id || null, problema_reportado, cliente_id, cliente_nombre]
    );
    
    // Auto-create initial state if needed, though default is 'nueva'
    
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear orden' });
  }
}

async function editarOrden(req, res) {
  const { id } = req.params;
  const { problema_reportado, diagnostico_final, usuario_id, fecha_entrega } = req.body;

  try {
    const check = await pool.query('SELECT estado FROM ordenes WHERE id = $1', [id]);
    if (check.rows.length > 0 && check.rows[0].estado === 'entregada') {
      return res.status(400).json({ error: 'No se puede editar una orden entregada' });
    }

    const { rows } = await pool.query(
      `UPDATE ordenes SET
        problema_reportado = COALESCE($1, problema_reportado),
        diagnostico_final = COALESCE($2, diagnostico_final),
        usuario_id = COALESCE($3, usuario_id),
        fecha_entrega = COALESCE($4, fecha_entrega)
       WHERE id = $5 RETURNING *`,
      [problema_reportado, diagnostico_final, usuario_id, fecha_entrega, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al editar orden' });
  }
}

async function cambiarEstado(req, res) {
  const { id } = req.params;
  const { estado } = req.body;

  const estadosValidos = ['nueva', 'presupuestada', 'en_proceso', 'lista', 'entregada'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    if (estado === 'entregada') {
      const pagoCheck = await pool.query(
        `SELECT 
          COALESCE((SELECT SUM(monto) FROM pagos WHERE orden_id = $1), 0) AS pagado,
          COALESCE((SELECT SUM(subtotal) FROM items_orden WHERE orden_id = $1), 0) AS total
         FROM ordenes WHERE id = $1`, [id]
      );
      if (pagoCheck.rows.length === 0) return res.status(404).json({ error: 'Orden no encontrada' });
      if (Number(pagoCheck.rows[0].pagado) < Number(pagoCheck.rows[0].total)) {
        return res.status(400).json({ error: 'No se puede entregar la orden sin registrar el pago total' });
      }
    }

    let extraUpdate = '';
    if (estado === 'entregada') extraUpdate = ', fecha_entrega = NOW()';
    if (estado === 'presupuestada') extraUpdate = ', presupuesto_finalizado = false';

    const { rows } = await pool.query(
      `UPDATE ordenes SET estado = $1${extraUpdate} WHERE id = $2 RETURNING *`,
      [estado, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
}

async function eliminarOrden(req, res) {
  const { id } = req.params;

  try {
    const check = await pool.query("SELECT estado FROM ordenes WHERE id = $1", [id]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (check.rows[0].estado === 'entregada') {
      return res.status(400).json({ error: 'No se puede eliminar una orden entregada' });
    }

    const checkPagos = await pool.query('SELECT COUNT(*) FROM pagos WHERE orden_id = $1', [id]);
    if (parseInt(checkPagos.rows[0].count) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar la orden porque tiene pagos registrados' });
    }

    await pool.query('DELETE FROM ordenes WHERE id = $1', [id]);
    res.json({ message: 'Orden eliminada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar orden' });
  }
}

async function finalizarPresupuesto(req, res) {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT estado, COALESCE(presupuesto_finalizado, false) AS presupuesto_finalizado FROM ordenes WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Orden no encontrada' });
    if (check.rows[0].estado === 'entregada') return res.status(400).json({ error: 'No se puede finalizar el presupuesto de una orden entregada' });
    if (check.rows[0].presupuesto_finalizado) return res.status(400).json({ error: 'El presupuesto ya está finalizado' });

    const { rows } = await pool.query(
      `UPDATE ordenes SET 
         presupuesto_finalizado = true,
         estado = 'en_proceso'
       WHERE id = $1 RETURNING *`,
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al finalizar presupuesto' });
  }
}

module.exports = { listarOrdenes, obtenerOrden, crearOrden, editarOrden, cambiarEstado, eliminarOrden, finalizarPresupuesto };
