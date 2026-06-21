import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const SLOTS_VALIDOS = ['ine-frente', 'ine-reverso', 'comprobante-domicilio', 'constancia-fiscal'] as const
type Slot = typeof SLOTS_VALIDOS[number]

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Re-sube (o reemplaza) un documento del usuario YA AUTENTICADO, después
// del registro inicial. Usa la misma carpeta `usuarios/{auth_id}/...` que
// /api/registro-usuario para que el upsert sobrescriba el archivo anterior
// del mismo slot, y reutiliza la service role key porque el bucket
// `documentos` es privado.
export async function POST(request: Request) {
  if (!supabaseUrl || !serviceRoleKey) {
    return badRequest('Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.', 500)
  }

  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return badRequest('Falta el token de sesión.', 401)

  const form = await request.formData().catch(() => null)
  if (!form) return badRequest('No se pudo leer el formulario.')

  const file = form.get('file') as File | null
  const slot = form.get('slot') as string | null
  const tipoDoc = (form.get('tipoDoc') as string | null) || 'Documento'
  const folio = (form.get('folio') as string | null) || null
  const vigencia = (form.get('vigencia') as string | null) || null

  if (!file || file.size === 0) return badRequest('Falta el archivo a subir.')
  if (!slot || !SLOTS_VALIDOS.includes(slot as Slot)) return badRequest('Tipo de documento inválido.')

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Verificar la sesión y resolver el id de `usuarios` desde el auth_id —
  // nunca se confía en un usuarioId enviado por el cliente.
  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData.user) return badRequest('Sesión no válida o expirada.', 401)

  const { data: usuarioRow, error: usuarioError } = await admin
    .from('usuarios')
    .select('id')
    .eq('auth_id', authData.user.id)
    .maybeSingle()

  if (usuarioError || !usuarioRow) return badRequest('No se encontró el perfil de usuario.', 404)

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `usuarios/${authData.user.id}/${slot}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage.from('documentos').upload(path, buffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: true,
  })
  if (uploadError) return badRequest(`No se pudo subir el archivo: ${uploadError.message}`, 500)

  // Si ya existía un registro de este mismo slot (mismo archivo_url),
  // se actualiza en vez de duplicarlo.
  const { data: existente } = await admin
    .from('documentos')
    .select('id')
    .eq('entidad_tipo', 'Usuario')
    .eq('entidad_id', usuarioRow.id)
    .eq('archivo_url', path)
    .maybeSingle()

  if (existente) {
    const { error: updateError } = await admin
      .from('documentos')
      .update({ tipo_doc: tipoDoc, folio, fecha_vencimiento: vigencia, estatus: 'Pendiente' })
      .eq('id', existente.id)
    if (updateError) return badRequest(`No se pudo actualizar el documento: ${updateError.message}`, 500)
  } else {
    const { error: insertError } = await admin.from('documentos').insert({
      tipo_doc: tipoDoc,
      entidad_tipo: 'Usuario',
      entidad_id: usuarioRow.id,
      folio,
      fecha_vencimiento: vigencia,
      estatus: 'Pendiente',
      archivo_url: path,
    })
    if (insertError) return badRequest(`No se pudo registrar el documento: ${insertError.message}`, 500)
  }

  return NextResponse.json({ ok: true, path })
}
