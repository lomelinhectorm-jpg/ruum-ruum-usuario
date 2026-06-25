export const ESTADOS_VIAJE = [
  'Solicitud recibida',
  'Pendiente de asignacion',
  'Oferta enviada',
  'Conductor asignado',
  'Aceptado',
  'En camino al origen',
  'En origen',
  'Inspeccion inicial',
  'Evidencia inicial pendiente',
  'Listo para traslado',
  'Traslado en curso',
  'En destino',
  'Inspeccion final',
  'Evidencia final pendiente',
  'Entrega pendiente',
  'Finalizado',
  'Cancelado',
  'En revision por incidencia',
] as const

export const PAGO_STATUS = [
  'Por calcular',
  'Calculado',
  'En revision',
  'Aprobado',
  'Programado',
  'Pagado',
  'Retenido',
  'Disputado',
  'Ajustado',
  'Cancelado',
] as const

export type EstatusViaje =
  | typeof ESTADOS_VIAJE[number]
  | 'Pendiente de asignación'
  | 'Conductor en camino'
  | 'Recolección en proceso'
  | 'Entrega en proceso'
  | 'En revisión por incidencia'
export type PagoStatus = typeof PAGO_STATUS[number]

export const VIAJE_STATUS_COMPAT: Record<string, EstatusViaje> = {
  'Pendiente de asignación': 'Pendiente de asignacion',
  'Conductor en camino': 'En camino al origen',
  'Recolección en proceso': 'En origen',
  'Entrega en proceso': 'En destino',
  'En revisión por incidencia': 'En revision por incidencia',
}

export function normalizarEstatusViaje(status: string | null | undefined): EstatusViaje | null {
  if (!status) return null
  return (VIAJE_STATUS_COMPAT[status] ?? status) as EstatusViaje
}

export function esViajeActivo(viaje: { status: string }) {
  return [
    'Solicitud recibida',
    'Pendiente de asignacion',
    'Oferta enviada',
    'Conductor asignado',
    'Aceptado',
    'En camino al origen',
    'En origen',
    'Inspeccion inicial',
    'Evidencia inicial pendiente',
    'Listo para traslado',
    'Traslado en curso',
    'En destino',
    'Inspeccion final',
    'Evidencia final pendiente',
    'Entrega pendiente',
    'En revision por incidencia',
  ].includes(normalizarEstatusViaje(viaje.status) ?? '')
}
