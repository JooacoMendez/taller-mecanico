const pool = require('../db/pool');
const { generarPDF } = require('../services/generarPDF');
const { enviarEmail } = require('../services/enviarEmail');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function descargarRecibo(req, res) {
  const { id } = req.params;

  try {
    const ordenRes = await pool.query(`
      SELECT o.*,
        v.patente, v.marca, v.modelo, v.anio,
        COALESCE(c.nombre, o.cliente_nombre) AS cliente_nombre, c.telefono AS cliente_telefono, c.email AS cliente_email,
        p.forma_pago, p.nro_recibo, p.monto AS monto_pagado,
        COALESCE((SELECT SUM(monto) FROM pagos WHERE orden_id = o.id), 0) AS total_pagado,
        COALESCE((SELECT SUM(subtotal) FROM items_orden WHERE orden_id = o.id), 0) AS total_orden
      FROM ordenes o
      LEFT JOIN vehiculos v ON o.vehiculo_id = v.id
      LEFT JOIN clientes c ON o.cliente_id = c.id
      LEFT JOIN pagos p ON p.orden_id = o.id
      WHERE o.id = $1
      ORDER BY p.fecha_pago DESC
      LIMIT 1
    `, [id]);

    if (ordenRes.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (Number(ordenRes.rows[0].total_pagado) < Number(ordenRes.rows[0].total_orden)) {
      return res.status(400).json({ error: 'La orden no está pagada completamente' });
    }

    const itemsRes = await pool.query(
      'SELECT * FROM items_orden WHERE orden_id = $1',
      [id]
    );

    const orden = { ...ordenRes.rows[0], items: itemsRes.rows };
    const patenteCarpeta = orden.patente || 'SinPatente';
    const dateStr = new Date().toISOString().split('T')[0];

    // Buscar si ya existe el PDF generado localmente
    try {
      const docsDir = path.join(os.homedir(), 'Documents');
      const dirDestino = path.join(docsDir, 'TallerApp', patenteCarpeta);
      if (fs.existsSync(dirDestino)) {
        const files = fs.readdirSync(dirDestino);
        const prefix = `${patenteCarpeta} - ${orden.id} `;
        const existingFile = files.find(f => f.startsWith(prefix) && f.endsWith('.pdf'));
        if (existingFile) {
          const filePath = path.join(dirDestino, existingFile);
          console.log(`Retornando recibo existente: ${filePath}`);
          const pdfBuffer = fs.readFileSync(filePath);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="recibo-${orden.nro_recibo || id}-${patenteCarpeta}-${dateStr}.pdf"`);
          return res.send(pdfBuffer);
        }
      }
    } catch (fsErr) {
      console.error('Error al comprobar PDF existente:', fsErr);
    }

    const pdfBuffer = await generarPDF(orden);

    // Guardar copia local en Documentos/TallerApp
    try {
      const docsDir = path.join(os.homedir(), 'Documents');
      const dirDestino = path.join(docsDir, 'TallerApp', patenteCarpeta);
      if (!fs.existsSync(dirDestino)) {
        fs.mkdirSync(dirDestino, { recursive: true });
      }

      const fileName = `recibo-${orden.nro_recibo}-${patenteCarpeta}-${dateStr}.pdf`;
      const filePath = path.join(dirDestino, fileName);

      fs.writeFileSync(filePath, pdfBuffer);
      console.log(`PDF guardado localmente en ${filePath}`);
    } catch (fsErr) {
      console.error('Error al guardar PDF localmente:', fsErr);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recibo-${orden.nro_recibo || id}-${patenteCarpeta}-${dateStr}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar PDF' });
  }
}

async function enviarRecibo(req, res) {
  const { id } = req.params;

  try {
    const ordenRes = await pool.query(`
      SELECT o.*,
        v.patente, v.marca, v.modelo, v.anio,
        COALESCE(c.nombre, o.cliente_nombre) AS cliente_nombre, c.telefono AS cliente_telefono, c.email AS cliente_email,
        p.forma_pago, p.nro_recibo, p.monto AS monto_pagado,
        COALESCE((SELECT SUM(monto) FROM pagos WHERE orden_id = o.id), 0) AS total_pagado,
        COALESCE((SELECT SUM(subtotal) FROM items_orden WHERE orden_id = o.id), 0) AS total_orden
      FROM ordenes o
      LEFT JOIN vehiculos v ON o.vehiculo_id = v.id
      LEFT JOIN clientes c ON o.cliente_id = c.id
      LEFT JOIN pagos p ON p.orden_id = o.id
      WHERE o.id = $1
      ORDER BY p.fecha_pago DESC
      LIMIT 1
    `, [id]);

    if (ordenRes.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (Number(ordenRes.rows[0].total_pagado) < Number(ordenRes.rows[0].total_orden)) {
      return res.status(400).json({ error: 'La orden no está pagada completamente' });
    }

    const orden = ordenRes.rows[0];

    if (!orden.cliente_email) {
      return res.status(400).json({ error: 'El cliente no tiene email registrado' });
    }

    const itemsRes = await pool.query('SELECT * FROM items_orden WHERE orden_id = $1', [id]);
    const ordenCompleta = { ...orden, items: itemsRes.rows };
    const patenteCarpeta = ordenCompleta.patente || 'SinPatente';
    const dateStr = new Date().toISOString().split('T')[0];
    
    let pdfBuffer;
    let fileExisted = false;

    // Buscar si ya existe el PDF generado localmente
    try {
      const docsDir = path.join(os.homedir(), 'Documents');
      const dirDestino = path.join(docsDir, 'TallerApp', patenteCarpeta);
      if (fs.existsSync(dirDestino)) {
        const files = fs.readdirSync(dirDestino);
        const prefix = `${patenteCarpeta} - ${ordenCompleta.id} `;
        const existingFile = files.find(f => f.startsWith(prefix) && f.endsWith('.pdf'));
        if (existingFile) {
          const filePath = path.join(dirDestino, existingFile);
          console.log(`Usando recibo existente para email: ${filePath}`);
          pdfBuffer = fs.readFileSync(filePath);
          fileExisted = true;
        }
      }
    } catch (fsErr) {
      console.error('Error al comprobar PDF existente para email:', fsErr);
    }

    if (!fileExisted) {
      pdfBuffer = await generarPDF(ordenCompleta);
    }

    if (!fileExisted) {
      // Guardar copia local en Documentos/TallerApp
      try {
        const docsDir = path.join(os.homedir(), 'Documents');
        const dirDestino = path.join(docsDir, 'TallerApp', patenteCarpeta);
        if (!fs.existsSync(dirDestino)) {
          fs.mkdirSync(dirDestino, { recursive: true });
        }

        const fileName = `recibo-${ordenCompleta.nro_recibo || id}-${patenteCarpeta}-${dateStr}.pdf`;
        const filePath = path.join(dirDestino, fileName);

        fs.writeFileSync(filePath, pdfBuffer);
        console.log(`PDF guardado localmente en ${filePath}`);
      } catch (fsErr) {
        console.error('Error al guardar PDF localmente:', fsErr);
      }
    }

    await enviarEmail(orden.cliente_email, pdfBuffer, orden.nro_recibo || `ORD-${id}`);

    res.json({ message: `Recibo enviado a ${orden.cliente_email}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar recibo por email' });
  }
}

module.exports = { descargarRecibo, enviarRecibo };
