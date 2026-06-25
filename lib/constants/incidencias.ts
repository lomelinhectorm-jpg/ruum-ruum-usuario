// lib/constants/incidencias.ts — usuario-ruum
//
// Mismo catálogo de tipos que usa admin-web (app/components/IncidenciasView.tsx)
// para que una incidencia generada desde la app de usuario aparezca con el
// mismo `tipo` que el panel de administración espera, sin valores huérfanos.

export const CATALOGO_INCIDENCIAS = {
  'Cliente no responde': { prioridad: 'Media', requiereFotos: false, bloqueaViaje: false, slaHoras: 4 },
  'Daño previo no registrado': { prioridad: 'Media', requiereFotos: true, bloqueaViaje: false, slaHoras: 4 },
  'Vehículo no disponible': { prioridad: 'Alta', requiereFotos: true, bloqueaViaje: true, slaHoras: 2 },
  'Falla mecánica': { prioridad: 'Alta', requiereFotos: true, bloqueaViaje: true, slaHoras: 2 },
  'Accidente': { prioridad: 'Crítica', requiereFotos: true, bloqueaViaje: true, slaHoras: 1 },
  'Robo / riesgo personal': { prioridad: 'Crítica', requiereFotos: false, bloqueaViaje: true, slaHoras: 1 },
  'Daños reportados': { prioridad: 'Alta', requiereFotos: true, bloqueaViaje: true, slaHoras: 2 },
  'Retraso': { prioridad: 'Media', requiereFotos: false, bloqueaViaje: false, slaHoras: 6 },
  'Falta de evidencia': { prioridad: 'Alta', requiereFotos: false, bloqueaViaje: true, slaHoras: 2 },
  'Contacto no disponible': { prioridad: 'Media', requiereFotos: false, bloqueaViaje: false, slaHoras: 4 },
  'Problema con documentación': { prioridad: 'Media', requiereFotos: true, bloqueaViaje: false, slaHoras: 8 },
  'Problema con pago': { prioridad: 'Media', requiereFotos: false, bloqueaViaje: false, slaHoras: 24 },
  'Cancelación': { prioridad: 'Alta', requiereFotos: false, bloqueaViaje: true, slaHoras: 2 },
  'Diferencia de kilometraje': { prioridad: 'Media', requiereFotos: true, bloqueaViaje: false, slaHoras: 8 },
  'Diferencia de combustible': { prioridad: 'Media', requiereFotos: true, bloqueaViaje: false, slaHoras: 8 },
  'Problema con conductor': { prioridad: 'Alta', requiereFotos: false, bloqueaViaje: true, slaHoras: 2 },
  'Problema con usuario': { prioridad: 'Media', requiereFotos: false, bloqueaViaje: false, slaHoras: 4 },
  'Otro': { prioridad: 'Media', requiereFotos: false, bloqueaViaje: false, slaHoras: 8 },
} as const

export const TIPOS_INCIDENCIA = Object.keys(CATALOGO_INCIDENCIAS) as (keyof typeof CATALOGO_INCIDENCIAS)[]

export type TipoIncidencia = keyof typeof CATALOGO_INCIDENCIAS
export type PrioridadIncidencia = typeof CATALOGO_INCIDENCIAS[TipoIncidencia]['prioridad']
export type ConfigIncidencia = typeof CATALOGO_INCIDENCIAS[TipoIncidencia]

export function getConfigIncidencia(tipo: string): ConfigIncidencia {
  return CATALOGO_INCIDENCIAS[tipo as TipoIncidencia] ?? CATALOGO_INCIDENCIAS.Otro
}
