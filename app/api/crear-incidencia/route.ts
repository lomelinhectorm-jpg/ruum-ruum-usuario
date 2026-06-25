import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TIPOS_INCIDENCIA, getConfigIncidencia } from '@/lib/constants/incidencias'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Crea una fila en `incidencias`, la misma tabla que ya usa admin-web
// (app/components/IncidenciasView.tsx) — mismas columnas: viaje_id,
// usuario_id, conductor_id, tipo, descripcion, estatus, prioridad,
// responsable_interno. Las políticas RLS de esa tabla solo permiten
// escritura a admins, así que esto entra con la service role key, como
// /api/subir-documento-usuario: se valida la sesión y se resuelven los
// ids reales en el servidor, nunca confiando en lo que mande el cliente.
export async function POST(request: Request) {
  if (!supabaseUrl || !serviceRoleKey) {
    return badRequest('Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.', 500)
  }

  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return badRequest('Falta el token de sesión.', 401)

  const body = await request.json().catch(() => null) as {
    viajeId?: string | null; tipo?: string; descripcion?: string
  } | null
  if (!body) return badRequest('No se pudo leer la solicitud.')

  const { viajeId, tipo, descripcion } = body
  if (!tipo || !TIPOS_INCIDENCIA.includes(tipo as typeof TIPOS_INCIDENCIA[number])) {
    return badRequest('Tipo de incidencia inválido.')
  }
  if (!descripcion || !descripcion.trim()) return badRequest('Falta describir la incidencia.')
  const config = getConfigIncidencia(tipo)

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Resolver el usuario desde la sesión — nunca desde un id que mande el cliente.
  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData.user) return badRequest('Sesión no válida o expirada.', 401)

  const { data: usuarioRow, error: usuarioError } = await admin
    .from('usuarios')
    .select('id')
    .eq('auth_id', authData.user.id)
    .maybeSingle()
  if (usuarioError || !usuarioRow) return badRequest('No se encontró el perfil de usuario.', 404)

  // Si se indicó un viaje, confirmar que es del usuario y tomar su
  // conductor_id real — no el que pudiera mandar el cliente.
  let viaje_id: string | null = null
  let conductor_id: string | null = null
  if (viajeId) {
    const { data: viajeRow, error: viajeError } = await admin
      .from('viajes')
      .select('id, usuario_id, conductor_id')
      .eq('id', viajeId)
      .maybeSingle()
    if (viajeError || !viajeRow || viajeRow.usuario_id !== usuarioRow.id) {
      return badRequest('El viaje indicado no es válido.', 403)
    }
    viaje_id = viajeRow.id
    conductor_id = viajeRow.conductor_id
  }

  const { data: incidencia, error: insertError } = await admin
    .from('incidencias')
    .insert({
      viaje_id,
      usuario_id: usuarioRow.id,
      conductor_id,
      tipo,
      descripcion: descripcion.trim(),
      estatus: 'Nueva',
      prioridad: config.prioridad,
      bloquea_viaje: config.bloqueaViaje,
      requiere_respuesta_operaciones: config.bloqueaViaje || ['Crítica'].includes(config.prioridad),
      metadata: { requiere_fotos: config.requiereFotos, sla_horas: config.slaHoras, origen: 'usuario_app' },
      responsable_interno: '—',
    })
    .select('id')
    .single()

  if (insertError) return badRequest(`No se pudo registrar la incidencia: ${insertError.message}`, 500)

  if (viaje_id && config.bloqueaViaje) {
    await admin.from('viajes').update({ status: 'En revisión por incidencia' }).eq('id', viaje_id)
    await admin.from('timeline_viaje').insert({
      viaje_id,
      evento: `Incidencia bloqueante: ${tipo}`,
      actor: 'Sistema',
      actor_tipo: 'sistema',
    })
  }

  await admin.from('timeline_operativo').insert({
    entidad_tipo: 'incidencia',
    entidad_id: incidencia.id,
    viaje_id,
    conductor_id,
    actor_id: usuarioRow.id,
    actor_tipo: 'usuario',
    evento: `Incidencia creada: ${tipo}`,
    estado_nuevo: 'Nueva',
    metadata: { prioridad: config.prioridad, bloquea_viaje: config.bloqueaViaje },
  })

  return NextResponse.json({ ok: true, id: incidencia.id })
}
