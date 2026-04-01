const nodemailer = require('nodemailer');

async function enviarEmail(destinatario, pdfBuffer, nroRecibo) {
  const tallerNombre = process.env.TALLER_NOMBRE || 'Taller Mecánico';

  // Create transporter using SMTP config from env
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_FROM,
      pass: process.env.SMTP_PASS || '',
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'taller@ejemplo.com',
    to: destinatario,
    subject: `Recibo ${nroRecibo} - ${tallerNombre}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${tallerNombre}</h2>
        <p>Adjunto encontrará el recibo <strong>${nroRecibo}</strong> de su último servicio.</p>
        <p>Gracias por su confianza. Ante cualquier consulta, no dude en contactarnos.</p>
        <br/>
        <p style="color: #888;">El equipo de ${tallerNombre}</p>
      </div>
    `,
    attachments: [
      {
        filename: `${nroRecibo}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email enviado: ${info.messageId}`);
}

module.exports = { enviarEmail };
