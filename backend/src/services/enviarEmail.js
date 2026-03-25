const { Resend } = require('resend');

async function enviarEmail(destinatario, pdfBuffer, nroRecibo) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const tallerNombre = process.env.TALLER_NOMBRE || 'Taller Mecánico';

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
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
        content: pdfBuffer.toString('base64'),
      },
    ],
  });

  if (error) {
    throw new Error(`Error al enviar email: ${error.message}`);
  }
}

module.exports = { enviarEmail };
