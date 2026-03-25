const pool = require('../db/pool');

async function agregarItem(req, res) {
  const { id: orden_id } = req.params;
  let { descripcion, tipo, precio_unitario, cantidad } = req.body;

  if (tipo === 'mano_de_obra') {
    descripcion = 'Mano de obra';
    cantidad = 1;
  }

  if (!descripcion || !tipo || !precio_unitario) {
    return res.status(400).json({ error: 'descripcion, tipo y precio_unitario son requeridos' });
  }

  if (!['repuesto', 'mano_de_obra'].includes(tipo)) {
    return res.status(400).json({ error: 'tipo debe ser "repuesto" o "mano_de_obra"' });
  }

  try {
    const check = await pool.query('SELECT estado, COALESCE(presupuesto_finalizado, false) AS presupuesto_finalizado FROM ordenes WHERE id = $1', [orden_id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Orden no encontrada' });
    if (check.rows[0].estado === 'entregada' || check.rows[0].presupuesto_finalizado) {
      return res.status(400).json({ error: 'No se pueden agregar ítems a una orden finalizada o entregada' });
    }

    const { rows } = await pool.query(
      `INSERT INTO items_orden (orden_id, descripcion, tipo, precio_unitario, cantidad)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [orden_id, descripcion, tipo, precio_unitario, cantidad || 1]
    );

    if (check.rows[0].estado === 'nueva') {
      await pool.query("UPDATE ordenes SET estado = 'presupuestada' WHERE id = $1", [orden_id]);
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar ítem' });
  }
}

async function editarItem(req, res) {
  const { id } = req.params;
  let { descripcion, tipo, precio_unitario, cantidad } = req.body;

  if (tipo === 'mano_de_obra') {
    descripcion = 'Mano de obra';
    cantidad = 1;
  }

  try {
    const checkItem = await pool.query('SELECT orden_id FROM items_orden WHERE id = $1', [id]);
    if (checkItem.rows.length === 0) return res.status(404).json({ error: 'Ítem no encontrado' });

    const check = await pool.query('SELECT estado, COALESCE(presupuesto_finalizado, false) AS presupuesto_finalizado FROM ordenes WHERE id = $1', [checkItem.rows[0].orden_id]);
    if (check.rows[0].estado === 'entregada' || check.rows[0].presupuesto_finalizado) {
      return res.status(400).json({ error: 'No se pueden editar ítems de una orden finalizada o entregada' });
    }

    const { rows } = await pool.query(
      `UPDATE items_orden SET
        descripcion = COALESCE($1, descripcion),
        tipo = COALESCE($2, tipo),
        precio_unitario = COALESCE($3, precio_unitario),
        cantidad = COALESCE($4, cantidad)
       WHERE id = $5 RETURNING *`,
      [descripcion, tipo, precio_unitario, cantidad, id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al editar ítem' });
  }
}

async function eliminarItem(req, res) {
  const { id } = req.params;

  try {
    const checkItem = await pool.query('SELECT orden_id FROM items_orden WHERE id = $1', [id]);
    if (checkItem.rows.length === 0) return res.status(404).json({ error: 'Ítem no encontrado' });

    const ordenId = checkItem.rows[0].orden_id;

    const checkSaldos = await pool.query(`
      SELECT 
        COALESCE((SELECT SUM(monto) FROM pagos WHERE orden_id = $1), 0) AS pagado,
        COALESCE((SELECT SUM(subtotal) FROM items_orden WHERE orden_id = $1 AND id != $2), 0) AS nuevo_total
    `, [ordenId, id]);
    
    if (Number(checkSaldos.rows[0].pagado) > Number(checkSaldos.rows[0].nuevo_total)) {
      return res.status(400).json({ error: 'No se puede eliminar el ítem porque el total de la orden quedaría por debajo de lo ya abonado' });
    }

    const check = await pool.query('SELECT estado, COALESCE(presupuesto_finalizado, false) AS presupuesto_finalizado FROM ordenes WHERE id = $1', [ordenId]);
    if (check.rows[0].estado === 'entregada' || check.rows[0].presupuesto_finalizado) {
      return res.status(400).json({ error: 'No se pueden eliminar ítems de una orden finalizada o entregada' });
    }

    await pool.query('DELETE FROM items_orden WHERE id = $1', [id]);
    res.json({ message: 'Ítem eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar ítem' });
  }
}

module.exports = { agregarItem, editarItem, eliminarItem };
