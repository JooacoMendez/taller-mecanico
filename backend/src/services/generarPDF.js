const PDFDocument = require('pdfkit');

function generarPDF(orden) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const tallerNombre = process.env.TALLER_NOMBRE || 'Taller Mecánico';
      const tallerDireccion = process.env.TALLER_DIRECCION || '';
      const tallerTelefono = process.env.TALLER_TELEFONO || '';

      // ── MEMBRETE ──────────────────────────────────────────
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(tallerNombre, 50, 50, { align: 'left' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#555555')
        .text(tallerDireccion, 50, 75)
        .text(`Tel: ${tallerTelefono}`, 50, 88);

      // Número de recibo (derecha)
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text(`RECIBO Nº ${orden.nro_recibo || '---'}`, 350, 50, { align: 'right', width: 200 });

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#555555')
        .text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 350, 70, { align: 'right', width: 200 });

      // Línea separadora
      doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#cccccc').stroke();

      // ── DATOS DEL CLIENTE / VEHÍCULO ──────────────────────
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text('CLIENTE', 50, 125);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Nombre: ${orden.cliente_nombre || '---'}`, 50, 142)
        .text(`Teléfono: ${orden.cliente_telefono || '---'}`, 50, 155)
        .text(`Email: ${orden.cliente_email || '---'}`, 50, 168);

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('VEHÍCULO', 300, 125);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Patente: ${orden.patente || '---'}`, 300, 142)
        .text(`Marca/Modelo: ${orden.marca || ''} ${orden.modelo || ''}`, 300, 155)
        .text(`Año: ${orden.anio || '---'}`, 300, 168);

      // ── TABLA DE ÍTEMS ────────────────────────────────────
      let y = 210;

      doc.moveTo(50, 195).lineTo(545, 195).strokeColor('#cccccc').stroke();

      // Encabezado tabla
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .rect(50, 198, 495, 16)
        .fill('#333333');

      doc
        .fillColor('#ffffff')
        .text('Descripción', 55, 202, { width: 220 })
        .text('Tipo', 280, 202, { width: 80 })
        .text('Cant.', 360, 202, { width: 40, align: 'center' })
        .text('P. Unit.', 405, 202, { width: 70, align: 'right' })
        .text('Subtotal', 475, 202, { width: 70, align: 'right' });

      y = 220;

      let totalOrden = 0;
      const items = orden.items || [];

      items.forEach((item, idx) => {
        if (idx % 2 === 0) {
          doc.rect(50, y - 2, 495, 16).fill('#f9f9f9');
        }

        const subtotal = parseFloat(item.subtotal) || parseFloat(item.precio_unitario) * parseInt(item.cantidad);
        totalOrden += subtotal;

        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#111111')
          .text(item.descripcion, 55, y, { width: 220 })
          .text(item.tipo === 'repuesto' ? 'Repuesto' : 'Mano de obra', 280, y, { width: 80 })
          .text(String(item.cantidad), 360, y, { width: 40, align: 'center' })
          .text(`$${parseFloat(item.precio_unitario).toFixed(2)}`, 405, y, { width: 70, align: 'right' })
          .text(`$${subtotal.toFixed(2)}`, 475, y, { width: 70, align: 'right' });

        y += 18;
      });

      // Línea cierre tabla
      doc.moveTo(50, y + 2).lineTo(545, y + 2).strokeColor('#cccccc').stroke();

      // ── TOTAL ─────────────────────────────────────────────
      y += 15;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text('TOTAL:', 380, y)
        .text(`$${totalOrden.toFixed(2)}`, 475, y, { width: 70, align: 'right' });

      // Forma de pago
      if (orden.forma_pago) {
        const formaLabels = {
          efectivo: 'Efectivo',
          transferencia: 'Transferencia',
          tarjeta: 'Tarjeta',
          otro: 'Otro',
        };
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#555555')
          .text(`Forma de pago: ${formaLabels[orden.forma_pago] || orden.forma_pago}`, 50, y + 2);
      }

      // ── PIE DE PÁGINA ──────────────────────────────────────
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#888888')
        .text('Gracias por su visita', 50, 750, { align: 'center', width: 495 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generarPDF };
