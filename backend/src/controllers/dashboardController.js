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
        WHERE date(fecha_ingreso) = date('now')
      `),
      // Ingresos del mes actual
      pool.query(`
        SELECT COALESCE(SUM(monto), 0) AS total
        FROM pagos
        WHERE strftime('%Y-%m', fecha_pago) = strftime('%Y-%m', 'now')
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

async function exportarExcel(req, res) {
  try {
    const xlsx = require('xlsx');

    const [clientesRes, vehiculosRes, ordenesRes, itemsRes, pagosRes] = await Promise.all([
      pool.query('SELECT * FROM clientes ORDER BY id'),
      pool.query('SELECT * FROM vehiculos ORDER BY id'),
      pool.query('SELECT * FROM ordenes ORDER BY id'),
      pool.query('SELECT * FROM items_orden ORDER BY id'),
      pool.query('SELECT * FROM pagos ORDER BY id')
    ]);

    const wb = xlsx.utils.book_new();

    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(clientesRes.rows), 'Clientes');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(vehiculosRes.rows), 'Vehiculos');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(ordenesRes.rows), 'Ordenes');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(itemsRes.rows), 'Items_Orden');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(pagosRes.rows), 'Pagos');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="BaseDeDatosTaller.xlsx"');
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al exportar base de datos a Excel' });
  }
}

module.exports = { getDashboard, exportarExcel };
