import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const { inscrito_id } = await request.json()

  if (!inscrito_id) {
    return NextResponse.json({ error: 'inscrito_id requerido' }, { status: 400 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: inscrito, error } = await supabase
    .from('inscritos')
    .select('*')
    .eq('id', inscrito_id)
    .single()

  if (error || !inscrito) {
    return NextResponse.json({ error: 'Inscrito no encontrado' }, { status: 404 })
  }

  if (inscrito.estado_pago !== 'aprobado') {
    return NextResponse.json({ error: 'El pago no está aprobado' }, { status: 400 })
  }

  const urlQR = `${process.env.NEXT_PUBLIC_APP_URL}/checkin/${inscrito.qr_token}`
  const qrBase64 = await QRCode.toDataURL(urlQR, {
    width: 400,
    margin: 2,
    color: { dark: '#1e3a8a', light: '#ffffff' },
  })
  const qrImageBase64 = qrBase64.replace(/^data:image\/png;base64,/, '')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Quinquenio ASEDUIS 2025 <noreply@tudominio.com>',
      to: [inscrito.correo],
      subject: '🎓 Tu código QR de ingreso — Quinquenio ASEDUIS 2025',
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:36px 40px;text-align:center;">
                    <p style="margin:0;color:#93c5fd;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Universidad Industrial de Santander</p>
                    <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:700;">Quinquenio ASEDUIS 2025</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:36px 40px 24px;">
                    <p style="margin:0;color:#374151;font-size:16px;">Estimado/a <strong>${inscrito.nombre}</strong>,</p>
                    <p style="margin:12px 0 0;color:#6b7280;font-size:15px;line-height:1.6;">
                      Tu inscripción ha sido <strong style="color:#16a34a;">aprobada</strong>. A continuación encontrarás tu código QR de ingreso al evento.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 24px;text-align:center;">
                    <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:16px;padding:32px;display:inline-block;">
                      <img src="cid:qr-code" alt="Código QR" width="220" height="220" style="display:block;border-radius:8px;" />
                      <p style="margin:16px 0 0;color:#1e40af;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Código de ingreso único</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:20px;">
                      <tr><td>
                        <table width="100%">
                          <tr>
                            <td style="color:#6b7280;font-size:13px;width:40%;padding:5px 0;">Nombre</td>
                            <td style="color:#111827;font-size:13px;font-weight:600;padding:5px 0;">${inscrito.nombre}</td>
                          </tr>
                          <tr>
                            <td style="color:#6b7280;font-size:13px;padding:5px 0;">Cédula</td>
                            <td style="color:#111827;font-size:13px;font-weight:600;padding:5px 0;">${inscrito.cedula}</td>
                          </tr>
                          <tr>
                            <td style="color:#6b7280;font-size:13px;padding:5px 0;">Programa</td>
                            <td style="color:#111827;font-size:13px;font-weight:600;padding:5px 0;">${inscrito.programa1}</td>
                          </tr>
                          ${inscrito.acompanantes > 0 ? `
                          <tr>
                            <td style="color:#6b7280;font-size:13px;padding:5px 0;">Acompañantes</td>
                            <td style="color:#1d4ed8;font-size:13px;font-weight:600;padding:5px 0;">${inscrito.acompanantes} persona${inscrito.acompanantes > 1 ? 's' : ''}</td>
                          </tr>` : ''}
                        </table>
                      </td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 32px;">
                    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;">
                        <p style="margin:0;color:#92400e;font-size:13px;font-weight:600;">📋 Instrucciones de ingreso</p>
                        <ul style="margin:8px 0 0;padding-left:16px;color:#78350f;font-size:13px;line-height:1.8;">
                          <li><strong>Lugar:</strong> Aula Máxima de Ciencias – UIS</li>
                          <li><strong>Fecha:</strong> 14 de agosto del 2026</li>
                          <li><strong>Hora:</strong> 06:15 pm</li>
                          <li>Presenta este QR en la entrada del evento</li>
                          <li>El código es de uso único e intransferible</li>
                          <li>Puedes presentarlo desde tu celular o impreso</li>
                          ${inscrito.acompanantes > 0 ? `<li>Puedes ingresar con <strong>${inscrito.acompanantes} acompañante${inscrito.acompanantes > 1 ? 's' : ''}</strong></li>` : ''}
                        </ul>
                      </div>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;">
                      Correo automático del sistema de inscripciones.<br>
                      Quinquenio ASEDUIS 2025 — Asociación de Egresados
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
      attachments: [
  {
    filename: `QR-ingreso-${inscrito.cedula}.png`,
    content: qrImageBase64,
  },
],
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    console.error('Resend error:', err)
    return NextResponse.json({ error: 'Error al enviar el correo' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, mensaje: 'Correo enviado correctamente' })
}