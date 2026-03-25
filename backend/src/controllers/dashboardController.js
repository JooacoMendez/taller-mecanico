const pool = require('../db/pool');

async function getDashboard(req, res) {
  try {
    const [
      ordenesAbiertasRes,
      ingresosMesRes,
      ordenesPorEstadoRes,
      ordenesRecientesRes,
    ] = await Promise.all([
      // Órdenes abiertas hoy
      pool.query(`
        SELECT COUNT(*) AS total
        FROM ordenes
        WHERE DATE_TRUNC('day', fecha_ingreso) = DATE_TRUNC('day', NOW())
      `),
      // Ingresos del mes actual
      pool.query(`
        SELECT COALESCE(SUM(monto), 0) AS total
        FROM pagos
        WHERE DATE_TRUNC('month', fecha_pago) = DATE_TRUNC('month', NOW())
      `),
      // Órdenes por estado
      pool.query(`
        SELECT estado, COUNT(*) AS cantidad
        FROM ordenes
        GROUP BY estado
        ORDER BY estado
      `),
      // Últimas 10 órdenes con detalle
      pool.query(`
        SELECT o.id, o.estado, o.fecha_ingreso,
          v.patente, v.marca, v.modelo,
          COALESCE(c.nombre, o.cliente_nombre) AS cliente_nombre,
          COALESCE((SELECT SUM(i.subtotal) FROM items_orden i WHERE i.orden_id = o.id), 0) AS total_orden
        FROM ordenes o
        LEFT JOIN vehiculos v ON o.vehiculo_id = v.id
        LEFT JOIN clientes c ON o.cliente_id = c.id
        ORDER BY o.created_at DESC
        LIMIT 10
      `),
    ]);

    // Convert por_estado array to object keyed by estado name
    const por_estado = {};
    ordenesPorEstadoRes.rows.forEach(r => {
      por_estado[r.estado] = parseInt(r.cantidad);
    });

    res.json({
      ordenes_hoy: parseInt(ordenesAbiertasRes.rows[0].total),
      ingresos_mes: parseFloat(ingresosMesRes.rows[0].total),
      por_estado,
      recientes: ordenesRecientesRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cargar dashboard' });
  }
}

module.exports = { getDashboard };
