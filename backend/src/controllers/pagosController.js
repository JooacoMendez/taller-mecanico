const pool = require('../db/pool');

async function registrarPago(req, res) {
  const { id: orden_id } = req.params;
  const { monto, forma_pago } = req.body;

  if (!monto || !forma_pago) {
    return res.status(400).json({ error: 'monto y forma_pago son requeridos' });
  }

  try {
    // Generar número de recibo autoincremental
    const countRes = await pool.query('SELECT COUNT(*) FROM pagos');
    const nroRecibo = `REC-${String(parseInt(countRes.rows[0].count) + 1).padStart(4, '0')}`;

    const { rows } = await pool.query(
      `INSERT INTO pagos (orden_id, monto, forma_pago, nro_recibo)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [orden_id, monto, forma_pago, nroRecibo]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar pago' });
  }
}

async function listarPagos(req, res) {
  const { id: orden_id } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT * FROM pagos WHERE orden_id = $1 ORDER BY fecha_pago DESC',
      [orden_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar pagos' });
  }
}

module.exports = { registrarPago, listarPagos };
