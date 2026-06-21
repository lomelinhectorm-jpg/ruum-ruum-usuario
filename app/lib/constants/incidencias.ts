// lib/constants/incidencias.ts — usuario-ruum
//
// Mismo catálogo de tipos que usa admin-web (app/components/IncidenciasView.tsx)
// para que una incidencia generada desde la app de usuario aparezca con el
// mismo `tipo` que el panel de administración espera, sin valores huérfanos.

export const TIPOS_INCIDENCIA = [
  'Daños reportados',
  'Retraso',
  'Falta de evidencia',
  'Contacto no disponible',
  'Problema con documentación',
  'Problema con pago',
  'Cancelación',
  'Diferencia de kilometraje',
  'Diferencia de combustible',
  'Problema con conductor',
  'Problema con usuario',
  'Otro',
] as const

export type TipoIncidencia = typeof TIPOS_INCIDENCIA[number]
