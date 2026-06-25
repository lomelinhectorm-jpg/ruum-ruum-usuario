import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { checkRegistrationRequest, isAcceptablePassword } from '@/lib/server/registration-security'

type PerfilUsuario = {
  nombre: string
  apellido: string
  curp: string | null
  email: string
  telefono: string | null
  tipo: string
  estatus: string
  calle: string | null
  numero: string | null
  colonia: string | null
  municipio: string | null
  estado_geo: string | null
  codigo_postal: string | null
  razon_social: string | null
  rfc: string | null
  regimen_fiscal: string | null
  cfdi: string | null
  domicilio_fiscal: string | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const MAX_FILE_BYTES = 3 * 1024 * 1024
const MAX_REQUEST_BYTES = 10 * 1024 * 1024
const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function parsePerfil(raw: string | null) {
  if (!raw) return null
  try {
    return JSON.parse(raw) as Partial<PerfilUsuario>
  } catch {
    return null
  }
}

function authErrorMessage(message?: string) {
  const normalized = message?.toLowerCase() ?? ''
  if (normalized.includes('already') || normalized.includes('registered') || normalized.includes('exists')) {
    return 'Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.'
  }
  return message ?? 'No se pudo crear el usuario de autenticación.'
}

// Sube un documento al bucket privado `documentos` bajo usuarios/{auth_id}/{nombre}.{ext}
async function subirDocumento(
  admin: SupabaseClient,
  authId: string,
  file: File,
  nombreArchivo: string
): Promise<string | null> {
  const ext = EXTENSION_BY_TYPE[file.type]
  if (!ext || file.size <= 0 || file.size > MAX_FILE_BYTES) return null
  const path = `usuarios/${authId}/${nombreArchivo}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await admin.storage.from('documentos').upload(path, buffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: true,
  })
  if (error) {
    console.error(`Error subiendo ${nombreArchivo}:`, error)
    return null
  }
  return path
}

export async function POST(request: Request) {
  if (!supabaseUrl || !serviceRoleKey) {
    return badRequest('Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.', 500)
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > MAX_REQUEST_BYTES) return badRequest('Solicitud demasiado grande.', 413)
  const access = checkRegistrationRequest(request, 'usuario')
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.message },
      { status: access.status, headers: access.retryAfter ? { 'Retry-After': String(access.retryAfter) } : undefined },
    )
  }

  const form = await request.formData().catch(() => null)
  if (!form) return badRequest('No se pudo leer el formulario.')

  const password = form.get('password') as string | null
  const perfilRaw = form.get('perfilUsuario') as string | null
  const perfil = parsePerfil(perfilRaw)

  const ineTipo = (form.get('ineTipo') as string | null) || null
  const ineNumero = (form.get('ineNumero') as string | null) || null
  const ineVigencia = (form.get('ineVigencia') as string | null) || null
  const ineFrente = form.get('ineFrente') as File | null
  const ineReverso = form.get('ineReverso') as File | null
  const domicilio = form.get('domicilio') as File | null

  if (!perfil?.email || !password) return badRequest('Correo y contraseña son requeridos.')
  if (!perfil.nombre || !perfil.apellido || !perfil.tipo) return badRequest('Datos personales incompletos.')
  if (!isAcceptablePassword(password)) {
    return badRequest('La contraseña debe tener al menos 8 caracteres, una letra y un número.')
  }

  for (const file of [ineFrente, ineReverso, domicilio]) {
    if (!file || file.size === 0) continue
    if (file.size > MAX_FILE_BYTES) return badRequest('Cada documento debe pesar máximo 3 MB.', 413)
    if (!EXTENSION_BY_TYPE[file.type]) return badRequest('Formato de documento no permitido.', 415)
  }

  const email = String(perfil.email).toLowerCase().trim()
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const usuarioPayload: PerfilUsuario = {
    nombre: String(perfil.nombre),
    apellido: String(perfil.apellido),
    curp: perfil.curp ? String(perfil.curp) : null,
    email,
    telefono: perfil.telefono ? String(perfil.telefono) : null,
    tipo: String(perfil.tipo),
    estatus: String(perfil.estatus ?? 'Activo'),
    calle: perfil.calle ? String(perfil.calle) : null,
    numero: perfil.numero ? String(perfil.numero) : null,
    colonia: perfil.colonia ? String(perfil.colonia) : null,
    municipio: perfil.municipio ? String(perfil.municipio) : null,
    estado_geo: perfil.estado_geo ? String(perfil.estado_geo) : null,
    codigo_postal: perfil.codigo_postal ? String(perfil.codigo_postal) : null,
    razon_social: perfil.razon_social ? String(perfil.razon_social) : null,
    rfc: perfil.rfc ? String(perfil.rfc) : null,
    regimen_fiscal: perfil.regimen_fiscal ? String(perfil.regimen_fiscal) : null,
    cfdi: perfil.cfdi ? String(perfil.cfdi) : null,
    domicilio_fiscal: perfil.domicilio_fiscal ? String(perfil.domicilio_fiscal) : null,
  }

  // ── 1. Crear la cuenta de autenticación ─────────────────────────────────────
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { usuario_perfil: usuarioPayload },
  })

  if (authError || !authData.user) {
    return badRequest(authErrorMessage(authError?.message), 422)
  }

  // ── 2. Vincular el perfil de negocio en `usuarios` ──────────────────────────
  // Si el admin ya había creado este correo antes (NuevoViajeForm o
  // UsuariosView, con auth_id null porque nunca pasó por un alta real de
  // Auth), no insertamos una fila duplicada: reclamamos esa fila existente
  // con el auth_id que se acaba de crear, y refrescamos sus datos con lo
  // que la persona capturó aquí (más confiable que lo que el admin pudo
  // haber llenado a distancia). requiere_cambio_password se limpia: la
  // contraseña que se está guardando en este registro ya es la que la
  // persona eligió, no queda nada provisional por cambiar.
  const { data: filaExistente } = await admin
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .is('auth_id', null)
    .maybeSingle()

  let nuevoUsuario: { id: string } | null = null
  let dbError: { message: string } | null = null

  if (filaExistente) {
    const { data, error } = await admin
      .from('usuarios')
      .update({ auth_id: authData.user.id, requiere_cambio_password: false, ...usuarioPayload })
      .eq('id', filaExistente.id)
      .select('id')
      .single()
    nuevoUsuario = data
    dbError = error
  } else {
    const { data, error } = await admin
      .from('usuarios')
      .insert({ auth_id: authData.user.id, ...usuarioPayload })
      .select('id')
      .single()
    nuevoUsuario = data
    dbError = error
  }

  if (dbError || !nuevoUsuario) {
    await admin.auth.admin.deleteUser(authData.user.id).catch(() => undefined)
    return badRequest(dbError?.message ?? 'No se pudo crear el perfil de usuario.', 422)
  }

  // ── 3. Subir documentos (si vienen) y registrarlos en `documentos` ─────────
  // No bloqueamos el registro si falla la subida de documentos: la cuenta ya
  // existe y el usuario puede volver a subirlos después desde la app.
  const registrarDocumento = async (
    file: File | null, nombreArchivo: string, tipoDoc: string,
    folio: string | null = null, vigencia: string | null = null
  ) => {
    if (!file || file.size === 0) return
    const path = await subirDocumento(admin, authData.user.id, file, nombreArchivo)
    if (!path) return
    const { error } = await admin.from('documentos').insert({
      tipo_doc: tipoDoc,
      entidad_tipo: 'Usuario',
      entidad_id: nuevoUsuario.id,
      folio,
      fecha_vencimiento: vigencia,
      estatus: 'Pendiente',
      archivo_url: path,
    })
    if (error) console.error(`Error registrando documento ${nombreArchivo}:`, error)
  }

  const tipoDocIne = ineTipo || 'INE / Pasaporte'
  await Promise.all([
    registrarDocumento(ineFrente, 'ine-frente', tipoDocIne, ineNumero, ineVigencia),
    registrarDocumento(ineReverso, 'ine-reverso', tipoDocIne, ineNumero, ineVigencia),
    registrarDocumento(domicilio, 'comprobante-domicilio', 'Comprobante domicilio'),
  ])

  return NextResponse.json({ ok: true, userId: authData.user.id })
}
