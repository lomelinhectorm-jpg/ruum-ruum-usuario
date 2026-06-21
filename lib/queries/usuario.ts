// lib/queries/usuario.ts — usuario-ruum

import { supabase } from '@/lib/supabase'

// ── AUTH ────────────────────────────────────────────────────

export async function loginConTelefono(telefono: string) {
  // Normalizar: si viene 55-1234-5678 → +5255-1234-5678
  const numero = '+52' + telefono.replace(/\D/g, '')
  const { data, error } = await supabase.auth.signInWithOtp({ phone: numero })
  if (error) throw error
  return data
}

export async function verificarOTP(telefono: string, token: string) {
  const numero = '+52' + telefono.replace(/\D/g, '')
  const { data, error } = await supabase.auth.verifyOtp({
    phone: numero, token, type: 'sms',
  })
  if (error) throw error
  return data
}

export async function logout() {
  await supabase.auth.signOut()
}

// ── PERFIL ──────────────────────────────────────────────────

// Recibe authId ya resuelto (de la sesión/listener), igual que el
// resto de funciones de este módulo — no se re-deriva aquí dentro
// vía supabase.auth.getUser() para no duplicar esa responsabilidad.
export async function getPerfilUsuario(authId: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      id, nombre, apellido, email, telefono, requiere_cambio_password,
      curp, calle, numero, colonia, municipio, estado_geo, codigo_postal,
      razon_social, nombre_comercial, rfc, regimen_fiscal, cfdi, domicilio_fiscal
    `)
    .eq('auth_id', authId)
    .maybeSingle()

  // Importante: SIEMPRE se revisa el error. Antes se ignoraba y un error de
  // consulta (p. ej. una columna que no existe todavía en la base) se
  // interpretaba como "el usuario no tiene perfil", lo que disparaba un
  // intento de INSERT duplicado sobre una fila que sí existía.
  if (error) throw error
  return data
}

// Cambia la contraseña de la sesión activa y limpia el flag de cuenta
// provisional. auth.updateUser() requiere una sesión válida (no el
// auth_id ni la contraseña anterior) — quien llama esta función ya
// pasó por signInWithPassword con la contraseña provisional, así que
// hay sesión activa por definición.
export async function completarCambioPassword(usuarioId: string, nuevaPassword: string) {
  const { error: authError } = await supabase.auth.updateUser({ password: nuevaPassword })
  if (authError) throw authError

  const { error: dbError } = await supabase
    .from('usuarios')
    .update({ requiere_cambio_password: false })
    .eq('id', usuarioId)

  if (dbError) throw dbError
}

// Actualiza campos del perfil del usuario (datos personales, dirección o
// datos fiscales). Recibe solo las llaves que se quieren modificar y
// devuelve el registro completo ya actualizado, con el mismo shape que
// getPerfilUsuario, para que el contexto pueda reemplazar el estado local
// sin volver a pedir todo el perfil.
export type CamposPerfilEditable = Partial<{
  nombre: string; apellido: string; curp: string | null; telefono: string | null
  calle: string | null; numero: string | null; colonia: string | null
  municipio: string | null; estado_geo: string | null; codigo_postal: string | null
  razon_social: string | null; nombre_comercial: string | null; rfc: string | null
  regimen_fiscal: string | null; cfdi: string | null; domicilio_fiscal: string | null
}>

export async function actualizarPerfilUsuario(usuarioId: string, datos: CamposPerfilEditable) {
  const { data, error } = await supabase
    .from('usuarios')
    .update(datos)
    .eq('id', usuarioId)
    .select(`
      id, nombre, apellido, email, telefono, requiere_cambio_password,
      curp, calle, numero, colonia, municipio, estado_geo, codigo_postal,
      razon_social, nombre_comercial, rfc, regimen_fiscal, cfdi, domicilio_fiscal
    `)
    .single()

  if (error) throw error
  return data
}

// Crea la fila en `usuarios` a partir de los datos que quedaron en
// user_metadata durante el registro (paso previo a la verificación
// de OTP). Si no hay metadata de perfil o falta nombre/apellido, no
// hace nada — ese caso lo maneja el flujo de "completar registro".
export async function crearPerfilDesdeAuth(user: {
  id: string; email?: string | null
  user_metadata?: Record<string, unknown>
}) {
  const metadata = user.user_metadata ?? {}
  const perfil = metadata.usuario_perfil as Record<string, unknown> | undefined
  if (!perfil?.nombre || !perfil?.apellido) return null

  const email = String(perfil.email ?? user.email ?? '')
  if (!email) return null

  const { error } = await supabase.from('usuarios').insert({
    auth_id: user.id,
    nombre: String(perfil.nombre),
    apellido: String(perfil.apellido),
    curp: perfil.curp ? String(perfil.curp) : null,
    email,
    telefono: perfil.telefono ? String(perfil.telefono) : null,
    tipo: String(perfil.tipo ?? 'Personal'),
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
  })

  if (error) {
    console.error('Error creando perfil de usuario:', error)
    return null
  }

  return getPerfilUsuario(user.id)
}

// ── VIAJES ──────────────────────────────────────────────────

export async function getMisViajes(usuarioId: string) {
  const { data, error } = await supabase
    .from('viajes')
    .select(`
      id, folio, status, fecha_programada, hora_programada,
      origen_calle, origen_colonia,
      destino_calle, destino_colonia,
      tarifa_cliente, created_at,
      conductores(id, nombre, apellido, calificacion, foto_url, telefono, certificacion, disponibilidad, viajes_realizados, municipio, estado_geo),
      vehiculos(marca, modelo, placas),
      evidencias(id)
    `)
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getDetalleViaje(viajeId: string) {
  const { data, error } = await supabase
    .from('viajes')
    .select(`
      *,
      conductores(id, nombre, apellido, calificacion, foto_url, telefono, certificacion, disponibilidad, viajes_realizados, municipio, estado_geo),
      vehiculos(marca, modelo, anio, color, placas),
      evidencias(*),
      timeline_viaje(evento, actor, actor_tipo, created_at)
    `)
    .eq('id', viajeId)
    .single()

  if (error) throw error
  return data
}

export async function cancelarViajeUsuario(viajeId: string) {
  const { data, error } = await supabase.rpc('cancelar_viaje_usuario', {
    p_viaje_id: viajeId,
  })

  if (error) throw error
  return data as { viaje_id: string; status: 'Cancelado'; penalizacion: number }
}

export async function solicitarViaje(
  usuario: { id: string; nombre: string; apellido: string },
  payload: {
    marca: string; modelo: string; anio?: string
    color?: string; placas: string; vin?: string; transmision?: string; alias?: string
    origen_calle: string; origen_numero?: string; origen_colonia?: string
    origen_municipio?: string; origen_estado?: string; origen_cp?: string
    origen_contacto?: string; origen_telefono?: string
    destino_calle: string; destino_numero?: string; destino_colonia?: string
    destino_municipio?: string; destino_estado?: string; destino_cp?: string
    destino_contacto?: string; destino_telefono?: string
    referencias?: string; instrucciones?: string
    fecha_programada?: string; hora_programada?: string
  }
) {
  // Igual que en la Torre de Control: Municipio y Estado se capturan por
  // separado en el formulario pero se guardan combinados en la misma
  // columna `origen_estado` / `destino_estado` de la tabla `viajes`.
  const origenEstado = [payload.origen_municipio, payload.origen_estado].filter(Boolean).join(', ')
  const destinoEstado = [payload.destino_municipio, payload.destino_estado].filter(Boolean).join(', ')

  // Crear vehículo si no existe
  const { data: vehiculo } = await supabase
    .from('vehiculos')
    .insert({
      usuario_id: usuario.id,
      marca: payload.marca.toUpperCase(),
      modelo: payload.modelo.toUpperCase(),
      anio: payload.anio ?? null,
      color: payload.color?.toUpperCase() ?? null,
      placas: payload.placas.toUpperCase(),
      vin: payload.vin?.toUpperCase() || null,
      transmision: payload.transmision ?? null,
      alias: payload.alias?.toUpperCase() || null,
    })
    .select()
    .single()

  // Crear viaje
  const { data: viaje, error } = await supabase
    .from('viajes')
    .insert({
      usuario_id: usuario.id,
      vehiculo_id: vehiculo?.id ?? null,
      origen_calle: payload.origen_calle.toUpperCase(),
      origen_numero: payload.origen_numero ?? null,
      origen_colonia: payload.origen_colonia?.toUpperCase() ?? null,
      origen_estado: origenEstado.toUpperCase() || null,
      origen_cp: payload.origen_cp ?? null,
      origen_contacto: payload.origen_contacto?.toUpperCase() ?? null,
      origen_telefono: payload.origen_telefono ?? null,
      destino_calle: payload.destino_calle.toUpperCase(),
      destino_numero: payload.destino_numero ?? null,
      destino_colonia: payload.destino_colonia?.toUpperCase() ?? null,
      destino_estado: destinoEstado.toUpperCase() || null,
      destino_cp: payload.destino_cp ?? null,
      destino_contacto: payload.destino_contacto?.toUpperCase() ?? null,
      destino_telefono: payload.destino_telefono ?? null,
      referencias: payload.referencias ?? null,
      instrucciones: payload.instrucciones ?? null,
      fecha_programada: payload.fecha_programada ?? null,
      hora_programada: payload.hora_programada ?? null,
      status: 'Solicitud recibida',
    })
    .select()
    .single()

  if (error) throw error

  // Timeline inicial — actor es el nombre real del usuario, no un
  // marcador genérico, para que el historial sea legible para Admin.
  await supabase.from('timeline_viaje').insert({
    viaje_id: viaje.id,
    evento: 'Solicitud creada por el usuario',
    actor: `${usuario.nombre} ${usuario.apellido}`,
    actor_tipo: 'usuario',
  })

  return viaje
}

// ── REALTIME ────────────────────────────────────────────────

// Suscripción real usada por AppContext: todos los viajes del usuario,
// cualquier evento, simplemente dispara un refetch de la lista.
export function suscribirMisViajes(usuarioId: string, callback: () => void) {
  return supabase
    .channel(`viajes-usuario-${usuarioId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'viajes', filter: `usuario_id=eq.${usuarioId}` },
      callback
    )
    .subscribe()
}

// Suscripción a UN viaje específico, con el row actualizado entregado
// directo al callback. Pensada para una futura vista de detalle con
// actualización en vivo (hoy ViewDetalleViaje no la usa — solo muestra
// lo que ya está cargado en la lista). No se modifica ni se conecta
// aquí: eso es una decisión de producto, no de esta migración.
export function suscribirMiViaje(
  viajeId: string,
  callback: (viaje: Record<string, unknown>) => void,
) {
  return supabase
    .channel(`usuario-viaje-${viajeId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'viajes', filter: `id=eq.${viajeId}` },
      (payload) => callback(payload.new as Record<string, unknown>)
    )
    .subscribe()
}

// ── EVIDENCIA ───────────────────────────────────────────────

// La evidencia puede estar repartida entre conductores después de una
// reasignación. Para el usuario se consolida por etapa sin reatribuir filas.
export async function getEvidenciaViaje(viajeId: string) {
  const { data, error } = await supabase
    .from('evidencias')
    .select(`
      km_inicial, km_final, combustible_inicial, combustible_final,
      danos_iniciales, danos_finales, created_at,
      foto_frente_i, foto_piloto_i, foto_copiloto_i, foto_trasera_i, foto_tablero_i,
      foto_frente_f, foto_piloto_f, foto_copiloto_f, foto_trasera_f, foto_tablero_f
    `)
    .eq('viaje_id', viajeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!data?.length) return null

  const campos = [
    'km_inicial', 'km_final', 'combustible_inicial', 'combustible_final',
    'danos_iniciales', 'danos_finales',
    'foto_frente_i', 'foto_piloto_i', 'foto_copiloto_i', 'foto_trasera_i', 'foto_tablero_i',
    'foto_frente_f', 'foto_piloto_f', 'foto_copiloto_f', 'foto_trasera_f', 'foto_tablero_f',
  ] as const
  const consolidada: Record<string, unknown> = { created_at: data[0].created_at }
  campos.forEach(campo => {
    const fila = data.find(e => e[campo] !== null && e[campo] !== undefined && e[campo] !== '')
    consolidada[campo] = fila?.[campo] ?? null
  })
  return consolidada
}

// ── INCIDENCIAS ─────────────────────────────────────────────

// Crea una incidencia desde la app de usuario, alineada con la tabla
// `incidencias` que ya usa admin-web (mismas columnas: viaje_id, usuario_id,
// conductor_id, tipo, descripcion, estatus, prioridad, responsable_interno).
// Va por una ruta API con service role — igual que la subida de documentos —
// porque las políticas RLS de esa tabla solo permiten escritura a admins
// (ver docs/security-rls-checklist.md de admin-web); el servidor valida la
// sesión y resuelve usuario_id/conductor_id por su cuenta, sin confiar en
// los ids que mande el cliente.
export async function crearIncidenciaUsuario(datos: {
  viajeId: string | null
  tipo: string
  descripcion: string
}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sesión no válida.')

  const res = await fetch('/api/crear-incidencia', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(datos),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => null) as { error?: string } | null
    throw new Error(data?.error ?? 'No se pudo registrar la incidencia.')
  }
  return res.json() as Promise<{ ok: true; id: string }>
}

// El bucket es privado (igual que `documentos`) — toda foto se muestra
// vía signed URL generada al momento de verla, nunca se guarda una URL
// pública ni una signed URL ya armada en la base.
export async function getUrlFotoEvidencia(path: string) {
  const { data, error } = await supabase.storage.from('evidencias-viaje').createSignedUrl(path, 3600)
  if (error) throw error
  return data?.signedUrl ?? null
}

// ── VEHÍCULOS ───────────────────────────────────────────────

export async function getVehiculosUsuario(usuarioId: string) {
  const { data, error } = await supabase
    .from('vehiculos')
    .select('id, marca, modelo, anio, color, placas, vin, transmision, alias, created_at')
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function agregarVehiculoUsuario(usuarioId: string, datos: {
  marca: string; modelo: string; anio?: string; color?: string
  placas: string; vin?: string; transmision?: string; alias?: string
}) {
  const { data, error } = await supabase
    .from('vehiculos')
    .insert({
      usuario_id: usuarioId,
      marca: datos.marca.toUpperCase(),
      modelo: datos.modelo.toUpperCase(),
      anio: datos.anio ?? null,
      color: datos.color?.toUpperCase() ?? null,
      placas: datos.placas.toUpperCase(),
      vin: datos.vin?.toUpperCase() || null,
      transmision: datos.transmision ?? null,
      alias: datos.alias?.toUpperCase() || null,
    })
    .select('id, marca, modelo, anio, color, placas, vin, transmision, alias, created_at')
    .single()

  if (error) throw error
  return data
}

export async function eliminarVehiculoUsuario(vehiculoId: string) {
  const { error } = await supabase.from('vehiculos').delete().eq('id', vehiculoId)
  if (error) throw error
}

// ── DOCUMENTOS ──────────────────────────────────────────────

// Documentos del usuario (INE, comprobante de domicilio, constancia
// fiscal). entidad_id apunta al id de `usuarios`, igual que se registra
// desde /api/registro-usuario durante el alta.
export async function getDocumentosUsuario(usuarioId: string) {
  const { data, error } = await supabase
    .from('documentos')
    .select('id, tipo_doc, entidad_tipo, entidad_id, folio, fecha_vencimiento, estatus, archivo_url, created_at')
    .eq('entidad_tipo', 'Usuario')
    .eq('entidad_id', usuarioId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// El bucket `documentos` es privado — misma lógica que las fotos de
// evidencia: se firma la URL al momento de mostrarla.
export async function getUrlDocumento(path: string) {
  const { data, error } = await supabase.storage.from('documentos').createSignedUrl(path, 3600)
  if (error) throw error
  return data?.signedUrl ?? null
}

// Sube (o reemplaza) un documento del usuario ya autenticado. El bucket
// `documentos` es privado y las subidas durante el registro las hace el
// servidor con la service role key; para subidas posteriores desde la app
// reutilizamos ese mismo patrón vía una ruta API que valida la sesión.
export async function subirDocumentoUsuario(
  file: File,
  slot: 'ine-frente' | 'ine-reverso' | 'comprobante-domicilio' | 'constancia-fiscal',
  tipoDoc: string,
) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sesión no válida.')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('slot', slot)
  formData.append('tipoDoc', tipoDoc)

  const res = await fetch('/api/subir-documento-usuario', {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => null) as { error?: string } | null
    throw new Error(data?.error ?? 'No se pudo subir el documento.')
  }
  return res.json() as Promise<{ ok: true; path: string }>
}
