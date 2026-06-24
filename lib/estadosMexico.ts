// lib/estadosMexico.ts
//
// Catálogo fijo de las 32 entidades federativas de México. Se usa para:
//   - El multi-select de "estados cubiertos" en Configuración → Zonas (Torre).
//   - El selector de Estado en el formulario de solicitud de viaje (usuario-ruum).
//
// Por qué un catálogo fijo y no texto libre: la validación de cobertura
// compara el estado capturado en la solicitud contra los estados marcados
// en cada zona. Si el cliente puede escribir cualquier variante ("CDMX",
// "Ciudad de México", "Distrito Federal", con o sin acentos...) la
// comparación de texto se vuelve poco confiable. Forzar un catálogo fijo
// en ambos lados elimina ese problema de raíz.
//
// Este archivo se duplica idéntico en torre/admin-web (no hay paquete
// compartido entre los 3 repos). Si agregas o renombras un estado aquí,
// haz el mismo cambio ahí — y revisa zonas.estados ya guardadas en
// Supabase, porque la comparación es por texto exacto (normalizado).

export const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango',
  'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco',
  'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
  'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora',
  'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
] as const

export type EstadoMexico = typeof ESTADOS_MEXICO[number]

// Normaliza para comparar sin importar acentos/mayúsculas/espacios extra.
// "Ciudad de México", "CIUDAD DE MEXICO" y "ciudad   de méxico" deben
// considerarse el mismo valor.
export function normalizarEstado(valor: string | null | undefined): string {
  return (valor ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}
