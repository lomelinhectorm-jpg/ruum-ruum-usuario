// lib/constants/fiscal.ts — listas compartidas por el onboarding de usuario
// y la sección de "Datos fiscales" en Mi Cuenta, para que ambos formularios
// ofrezcan exactamente las mismas opciones.
//
// Este catálogo está alineado 1:1 con el de la Torre de Control
// (app/components/UsuariosView.tsx) para que el campo que se guarda en
// `usuarios.regimen_fiscal` / `usuarios.cfdi` sea siempre la clave SAT
// (p. ej. "606"), sin importar si el registro lo crea el propio usuario
// desde la app o un admin desde la Torre.

export const REGIMENES_FISCALES = [
  { clave: '601', desc: '601 - General de Ley Personas Morales' },
  { clave: '603', desc: '603 - Personas Morales con Fines no Lucrativos' },
  { clave: '605', desc: '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { clave: '606', desc: '606 - Arrendamiento' },
  { clave: '607', desc: '607 - Régimen de Enajenación o Adquisición de Bienes' },
  { clave: '608', desc: '608 - Demás Ingresos' },
  { clave: '610', desc: '610 - Residentes en el Extranjero sin Establecimiento Permanente en México' },
  { clave: '611', desc: '611 - Ingresos por Dividendos (socios y accionistas)' },
  { clave: '612', desc: '612 - Personas Físicas con Actividades Empresariales y Profesionales' },
  { clave: '614', desc: '614 - Ingresos por intereses' },
  { clave: '615', desc: '615 - Régimen de los ingresos por obtención de premios' },
  { clave: '616', desc: '616 - Sin obligaciones fiscales' },
  { clave: '620', desc: '620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos' },
  { clave: '621', desc: '621 - Incorporación Fiscal' },
  { clave: '622', desc: '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { clave: '623', desc: '623 - Opcional para Grupos de Sociedades' },
  { clave: '624', desc: '624 - Coordinados' },
  { clave: '625', desc: '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { clave: '626', desc: '626 - Régimen Simplificado de Confianza' },
] as const

export const USOS_CFDI = [
  { clave: 'G01', desc: 'G01 - Adquisición de mercancias' },
  { clave: 'G02', desc: 'G02 - Devoluciones, descuentos o bonificaciones' },
  { clave: 'G03', desc: 'G03 - Gastos en general' },
  { clave: 'I01', desc: 'I01 - Construcciones' },
  { clave: 'I02', desc: 'I02 - Mobilario y equipo de oficina por inversiones' },
  { clave: 'I03', desc: 'I03 - Equipo de transporte' },
  { clave: 'I04', desc: 'I04 - Equipo de computo y accesorios' },
  { clave: 'I05', desc: 'I05 - Dados, troqueles, moldes, matrices y herramental' },
  { clave: 'I06', desc: 'I06 - Comunicaciones telefónicas' },
  { clave: 'I07', desc: 'I07 - Comunicaciones satelitales' },
  { clave: 'I08', desc: 'I08 - Otra maquinaria y equipo' },
  { clave: 'D01', desc: 'D01 - Honorarios médicos, dentales y gastos hospitalarios' },
  { clave: 'D02', desc: 'D02 - Gastos médicos por incapacidad o discapacidad' },
  { clave: 'D03', desc: 'D03 - Gastos funerales' },
  { clave: 'D04', desc: 'D04 - Donativos' },
  { clave: 'D05', desc: 'D05 - Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)' },
  { clave: 'D06', desc: 'D06 - Aportaciones voluntarias al SAR' },
  { clave: 'D07', desc: 'D07 - Primas por seguros de gastos médicos' },
  { clave: 'D08', desc: 'D08 - Gastos de transportación escolar obligatoria' },
  { clave: 'D09', desc: 'D09 - Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones' },
  { clave: 'D10', desc: 'D10 - Pagos por servicios educativos (colegiaturas)' },
  { clave: 'S01', desc: 'S01 - Sin efectos fiscales' },
  { clave: 'CP01', desc: 'CP01 - Pagos' },
  { clave: 'CN01', desc: 'CN01 - Nómina' },
] as const
