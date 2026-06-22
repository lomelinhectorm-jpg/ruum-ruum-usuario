'use client'

import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'
import {
  getVehiculosUsuario, agregarVehiculoUsuario, eliminarVehiculoUsuario,
  getDocumentosUsuario, getUrlDocumento, subirDocumentoUsuario,
  getCatalogoMetodosPago, getMetodosPagoUsuario, agregarMetodoPagoUsuario,
  actualizarMetodoPagoUsuario, eliminarMetodoPagoUsuario, marcarMetodoPagoPredeterminado,
  crearSetupIntentTarjeta, guardarMetodoPagoTarjeta,
  type MetodoPagoUsuario,
} from '@/lib/queries/usuario'
import { getStripeBrowserClient } from '@/app/lib/stripe-client'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { REGIMENES_FISCALES, USOS_CFDI } from '@/lib/constants/fiscal'
import { TRANSMISIONES } from '@/lib/constants/vehiculo'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faChevronRight, faChevronDown, faChevronUp, faPen,
  faIdCard, faPhone, faMapMarkerAlt, faCar, faPlus, faTrash,
  faFileInvoiceDollar, faUpload, faCreditCard, faQuestionCircle, faLock,
  faSignOutAlt, faSpinner, faCheckCircle, faEye, faEyeSlash, faHeadset, faStar,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

type Seccion =
  | 'menu' | 'perfil' | 'direccion' | 'vehiculos' | 'fiscal'
  | 'documentos' | 'pagos' | 'faq' | 'password'

type VehiculoRow = {
  id: string; marca: string; modelo: string; anio: string | null
  color: string | null; placas: string; vin: string | null; transmision: string | null
  alias: string | null; created_at: string
}

type DocumentoRow = {
  id: string; tipo_doc: string; entidad_tipo: string; entidad_id: string
  folio: string | null; fecha_vencimiento: string | null
  estatus: string; archivo_url: string; created_at: string
}

// ─── Helpers de UI compartidos por las sub-secciones ──────────────────────────
const inputCls = (err?: string) =>
  `w-full border ${err ? 'border-red-400 bg-red-50' : 'border-slate-300'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`

function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
      {children}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function ErrMsg({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-500 mt-0.5">{msg}</p> : null
}

function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={onBack}
        className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 flex-shrink-0"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    </div>
  )
}

function MenuRow({ icon, label, sublabel, onClick }: {
  icon: IconDefinition; label: string; sublabel?: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 flex-shrink-0">
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="min-w-0 text-left">
          <span className="text-sm font-medium text-slate-700 block truncate">{label}</span>
          {sublabel && <span className="text-xs text-slate-400">{sublabel}</span>}
        </div>
      </div>
      <FontAwesomeIcon icon={faChevronRight} className="text-slate-400 text-xs flex-shrink-0" />
    </button>
  )
}

const ESTATUS_DOC_COLOR: Record<string, string> = {
  Pendiente: 'bg-amber-100 text-amber-700',
  Aprobado: 'bg-green-100 text-green-700',
  Rechazado: 'bg-red-100 text-red-600',
}

// Casilla de subida/visualización de un documento. Se usa tanto en la
// sección "Documentos" (INE, comprobante) como en "Datos fiscales"
// (constancia de situación fiscal) — todas viven en la misma tabla
// `documentos`, identificadas por el nombre de archivo dentro de su path.
function DocSlot({ label, slot, tipoDoc, documento, onUploaded }: {
  label: string
  slot: 'ine-frente' | 'ine-reverso' | 'comprobante-domicilio' | 'constancia-fiscal'
  tipoDoc: string
  documento?: DocumentoRow
  onUploaded: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  const verArchivo = async () => {
    if (!documento) return
    setError('')
    try {
      const url = await getUrlDocumento(documento.archivo_url)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      setError('No se pudo abrir el archivo.')
    }
  }

  const subir = async (file: File) => {
    setSubiendo(true)
    setError('')
    try {
      await subirDocumentoUsuario(file, slot, tipoDoc)
      onUploaded()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir el archivo.')
    }
    setSubiendo(false)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {documento && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${ESTATUS_DOC_COLOR[documento.estatus] ?? 'bg-slate-100 text-slate-600'}`}>
            {documento.estatus.toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {documento && (
          <button onClick={verArchivo} className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1">
            <FontAwesomeIcon icon={faEye} /> Ver archivo
          </button>
        )}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="text-xs font-medium text-slate-600 hover:underline flex items-center gap-1 disabled:opacity-60 ml-auto"
        >
          <FontAwesomeIcon icon={subiendo ? faSpinner : faUpload} className={subiendo ? 'animate-spin' : ''} />
          {subiendo ? 'Subiendo...' : documento ? 'Reemplazar' : 'Subir'}
        </button>
        <input
          ref={inputRef} type="file" accept="image/*,.pdf" className="hidden"
          onChange={e => e.target.files?.[0] && subir(e.target.files[0])}
        />
      </div>
      {!documento && !subiendo && <p className="text-xs text-slate-400 mt-2">Aún no has subido este documento.</p>}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}

// ─── 1. Cabecera: perfil del usuario ───────────────────────────────────────────
function PerfilEditor({ onBack }: { onBack: () => void }) {
  const { usuario, actualizarPerfil } = useApp()
  const [form, setForm] = useState({
    nombre: usuario?.nombre ?? '',
    apellido: usuario?.apellido ?? '',
    curp: usuario?.curp ?? '',
    telefono: usuario?.telefono ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState('')

  const set = (k: keyof typeof form, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
    setExito(false)
  }

  const fmtTel = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 10)
    return d.length <= 3 ? d : d.length <= 6 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (!form.apellido.trim()) e.apellido = 'Requerido'
    if (form.telefono && form.telefono.replace(/\D/g, '').length < 10) e.telefono = 'Ingresa 10 dígitos'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const guardar = async () => {
    if (!validate()) return
    setGuardando(true)
    setErrorGeneral('')
    setExito(false)
    const ok = await actualizarPerfil({
      nombre: form.nombre.toUpperCase(),
      apellido: form.apellido.toUpperCase(),
      curp: form.curp ? form.curp.toUpperCase() : null,
      telefono: form.telefono || null,
    })
    setGuardando(false)
    if (ok) setExito(true)
    else setErrorGeneral('No se pudo guardar. Intenta de nuevo.')
  }

  return (
    <div className="fade-in p-5 pb-24">
      <SubHeader title="Perfil del usuario" onBack={onBack} />
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label req>Nombre(s)</Label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value.toUpperCase())} className={inputCls(errors.nombre)} />
            <ErrMsg msg={errors.nombre} />
          </div>
          <div>
            <Label req>Apellido(s)</Label>
            <input value={form.apellido} onChange={e => set('apellido', e.target.value.toUpperCase())} className={inputCls(errors.apellido)} />
            <ErrMsg msg={errors.apellido} />
          </div>
        </div>
        <div>
          <Label>CURP</Label>
          <input value={form.curp} maxLength={18} placeholder="18 CARACTERES"
            onChange={e => set('curp', e.target.value.toUpperCase())} className={inputCls()} />
        </div>
        <div>
          <Label>Teléfono</Label>
          <div className="flex flex-col min-[380px]:flex-row gap-2">
            <div className="px-3 py-3 border border-slate-300 rounded-xl text-sm text-slate-600 bg-slate-50 whitespace-nowrap">🇲🇽 +52</div>
            <input value={form.telefono} placeholder="55-0000-0000"
              onChange={e => set('telefono', fmtTel(e.target.value))} className={`flex-1 ${inputCls(errors.telefono)}`} />
          </div>
          <ErrMsg msg={errors.telefono} />
        </div>

        {errorGeneral && <p className="text-xs text-red-500 font-medium">{errorGeneral}</p>}
        {exito && <p className="text-xs text-green-600 font-medium">✓ Cambios guardados.</p>}

        <button
          onClick={guardar} disabled={guardando}
          className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-60 transition-colors"
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

// ─── 2. Dirección ───────────────────────────────────────────────────────────────
function DireccionEditor({ onBack }: { onBack: () => void }) {
  const { usuario, actualizarPerfil } = useApp()
  const [form, setForm] = useState({
    calle: usuario?.calle ?? '',
    numero: usuario?.numero ?? '',
    colonia: usuario?.colonia ?? '',
    municipio: usuario?.municipio ?? '',
    estado_geo: usuario?.estado_geo ?? '',
    codigo_postal: usuario?.codigo_postal ?? '',
  })
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState('')

  const set = (k: keyof typeof form, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setExito(false)
  }

  const guardar = async () => {
    setGuardando(true)
    setErrorGeneral('')
    setExito(false)
    const ok = await actualizarPerfil({
      calle: form.calle.toUpperCase() || null,
      numero: form.numero.toUpperCase() || null,
      colonia: form.colonia.toUpperCase() || null,
      municipio: form.municipio.toUpperCase() || null,
      estado_geo: form.estado_geo.toUpperCase() || null,
      codigo_postal: form.codigo_postal || null,
    })
    setGuardando(false)
    if (ok) setExito(true)
    else setErrorGeneral('No se pudo guardar. Intenta de nuevo.')
  }

  return (
    <div className="fade-in p-5 pb-24">
      <SubHeader title="Dirección" onBack={onBack} />
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label>Calle</Label>
            <input value={form.calle} placeholder="NOMBRE DE LA CALLE"
              onChange={e => set('calle', e.target.value.toUpperCase())} className={inputCls()} />
          </div>
          <div>
            <Label>Número</Label>
            <input value={form.numero} placeholder="EXT / INT"
              onChange={e => set('numero', e.target.value.toUpperCase())} className={inputCls()} />
          </div>
          <div>
            <Label>Colonia</Label>
            <input value={form.colonia} placeholder="COLONIA"
              onChange={e => set('colonia', e.target.value.toUpperCase())} className={inputCls()} />
          </div>
          <div>
            <Label>Municipio / Alcaldía</Label>
            <input value={form.municipio} placeholder="MUNICIPIO"
              onChange={e => set('municipio', e.target.value.toUpperCase())} className={inputCls()} />
          </div>
          <div>
            <Label>Estado</Label>
            <input value={form.estado_geo} placeholder="ESTADO"
              onChange={e => set('estado_geo', e.target.value.toUpperCase())} className={inputCls()} />
          </div>
          <div>
            <Label>Código Postal</Label>
            <input value={form.codigo_postal} maxLength={5} placeholder="00000"
              onChange={e => set('codigo_postal', e.target.value.replace(/\D/g, '').slice(0, 5))} className={inputCls()} />
          </div>
        </div>

        {errorGeneral && <p className="text-xs text-red-500 font-medium">{errorGeneral}</p>}
        {exito && <p className="text-xs text-green-600 font-medium">✓ Dirección actualizada.</p>}

        <button
          onClick={guardar} disabled={guardando}
          className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-60 transition-colors"
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

// ─── 3. Vehículos registrados ───────────────────────────────────────────────────
function VehiculosSeccion({ onBack }: { onBack: () => void }) {
  const { usuario } = useApp()
  const [vehiculos, setVehiculos] = useState<VehiculoRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ marca: '', modelo: '', anio: '', color: '', placas: '', vin: '', transmision: '', alias: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState('')

  const cargar = async () => {
    if (!usuario) return
    setCargando(true)
    try {
      const data = await getVehiculosUsuario(usuario.id)
      setVehiculos(data as VehiculoRow[])
    } catch (e) {
      console.error('Error cargando vehículos:', e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (!usuario?.id) return
    let activo = true
    getVehiculosUsuario(usuario.id)
      .then(data => { if (activo) setVehiculos(data as VehiculoRow[]) })
      .catch(e => console.error('Error cargando vehículos:', e))
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [usuario?.id])

  const set = (k: keyof typeof form, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.marca.trim()) e.marca = 'Requerido'
    if (!form.modelo.trim()) e.modelo = 'Requerido'
    if (!form.placas.trim()) e.placas = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const agregar = async () => {
    if (!usuario || !validate()) return
    setGuardando(true)
    setErrorGeneral('')
    try {
      await agregarVehiculoUsuario(usuario.id, form)
      setForm({ marca: '', modelo: '', anio: '', color: '', placas: '', vin: '', transmision: '', alias: '' })
      setMostrarForm(false)
      await cargar()
    } catch (e) {
      console.error('Error agregando vehículo:', e)
      setErrorGeneral('No se pudo agregar el vehículo. Intenta de nuevo.')
    }
    setGuardando(false)
  }

  const eliminar = async (id: string) => {
    if (!window.confirm('¿Eliminar este vehículo de tu cuenta?')) return
    try {
      await eliminarVehiculoUsuario(id)
      await cargar()
    } catch (e) {
      console.error('Error eliminando vehículo:', e)
    }
  }

  return (
    <div className="fade-in p-5 pb-24">
      <SubHeader title="Vehículos registrados" onBack={onBack} />

      {cargando ? (
        <div className="space-y-3 mb-4">
          {[1, 2].map(i => <div key={i} className="h-20 animate-pulse bg-slate-100 rounded-xl" />)}
        </div>
      ) : vehiculos.length === 0 && !mostrarForm ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center mb-4">
          <FontAwesomeIcon icon={faCar} className="text-3xl text-slate-300 mb-2" />
          <p className="text-sm font-medium text-slate-600">Aún no tienes vehículos registrados.</p>
        </div>
      ) : vehiculos.length > 0 ? (
        <div className="space-y-3 mb-4">
          {vehiculos.map(v => (
            <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 flex-shrink-0">
                  <FontAwesomeIcon icon={faCar} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {v.alias ? `${v.alias} · ` : ''}{v.marca} {v.modelo}{v.anio ? ` (${v.anio})` : ''}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {v.placas}{v.color ? ` · ${v.color}` : ''}{v.transmision ? ` · ${v.transmision}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => eliminar(v.id)}
                className="text-slate-400 hover:text-red-500 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50"
              >
                <FontAwesomeIcon icon={faTrash} className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {mostrarForm ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label req>Marca</Label>
              <input value={form.marca} placeholder="MARCA" onChange={e => set('marca', e.target.value.toUpperCase())} className={inputCls(errors.marca)} />
              <ErrMsg msg={errors.marca} />
            </div>
            <div>
              <Label req>Modelo</Label>
              <input value={form.modelo} placeholder="MODELO" onChange={e => set('modelo', e.target.value.toUpperCase())} className={inputCls(errors.modelo)} />
              <ErrMsg msg={errors.modelo} />
            </div>
            <div>
              <Label>Año</Label>
              <input value={form.anio} maxLength={4} placeholder="2024" onChange={e => set('anio', e.target.value.replace(/\D/g, '').slice(0, 4))} className={inputCls()} />
            </div>
            <div>
              <Label>Color</Label>
              <input value={form.color} placeholder="COLOR" onChange={e => set('color', e.target.value.toUpperCase())} className={inputCls()} />
            </div>
            <div>
              <Label req>Placas</Label>
              <input value={form.placas} placeholder="ABC-1234" onChange={e => set('placas', e.target.value.toUpperCase())} className={inputCls(errors.placas)} />
              <ErrMsg msg={errors.placas} />
            </div>
            <div>
              <Label>VIN</Label>
              <input value={form.vin} placeholder="17 CARACTERES" onChange={e => set('vin', e.target.value.toUpperCase())} className={inputCls()} />
            </div>
            <div>
              <Label>Transmisión</Label>
              <select value={form.transmision} onChange={e => set('transmision', e.target.value)} className={`${inputCls()} bg-white`}>
                <option value="">Seleccionar...</option>
                {TRANSMISIONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Label>Alias / Apodo</Label>
              <input value={form.alias} placeholder="EJ. CAMIONETA GRIS 1" onChange={e => set('alias', e.target.value.toUpperCase())} className={inputCls()} />
            </div>
          </div>

          {errorGeneral && <p className="text-xs text-red-500 font-medium">{errorGeneral}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setMostrarForm(false); setErrors({}); setErrorGeneral('') }}
              className="flex-1 border border-slate-300 text-slate-600 font-medium py-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={agregar} disabled={guardando}
              className="flex-1 bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-60 transition-colors"
            >
              {guardando ? 'Guardando...' : 'Guardar vehículo'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setMostrarForm(true)}
          className="w-full border-2 border-dashed border-slate-300 text-slate-500 font-medium py-3 rounded-xl hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} /> Agregar vehículo
        </button>
      )}
    </div>
  )
}

// ─── 4. Datos fiscales ───────────────────────────────────────────────────────────
function FiscalSeccion({ onBack }: { onBack: () => void }) {
  const { usuario, actualizarPerfil } = useApp()
  const [requiereFactura, setRequiereFactura] = useState(!!usuario?.rfc)
  const [form, setForm] = useState({
    razon_social: usuario?.razon_social ?? '',
    nombre_comercial: usuario?.nombre_comercial ?? '',
    rfc: usuario?.rfc ?? '',
    regimen_fiscal: usuario?.regimen_fiscal ?? '',
    cfdi: usuario?.cfdi ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState('')
  const [documentos, setDocumentos] = useState<DocumentoRow[]>([])

  const cargarDocs = async () => {
    if (!usuario) return
    try {
      setDocumentos(await getDocumentosUsuario(usuario.id) as DocumentoRow[])
    } catch (e) {
      console.error('Error cargando documentos fiscales:', e)
    }
  }
  useEffect(() => {
    if (!usuario?.id) return
    let activo = true
    getDocumentosUsuario(usuario.id)
      .then(data => { if (activo) setDocumentos(data as DocumentoRow[]) })
      .catch(e => console.error('Error cargando documentos fiscales:', e))
    return () => { activo = false }
  }, [usuario?.id])

  const set = (k: keyof typeof form, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
    setExito(false)
  }

  const validate = () => {
    if (!requiereFactura) return true
    const e: Record<string, string> = {}
    if (!form.razon_social.trim()) e.razon_social = 'Requerido'
    if (!form.rfc.trim()) e.rfc = 'Requerido'
    if (!form.regimen_fiscal) e.regimen_fiscal = 'Requerido'
    if (!form.cfdi) e.cfdi = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const guardar = async () => {
    if (!validate()) return
    setGuardando(true)
    setErrorGeneral('')
    setExito(false)
    const ok = await actualizarPerfil(requiereFactura ? {
      razon_social: form.razon_social.toUpperCase(),
      nombre_comercial: form.nombre_comercial ? form.nombre_comercial.toUpperCase() : null,
      rfc: form.rfc.toUpperCase(),
      regimen_fiscal: form.regimen_fiscal,
      cfdi: form.cfdi,
    } : {
      razon_social: null, nombre_comercial: null, rfc: null, regimen_fiscal: null, cfdi: null,
    })
    setGuardando(false)
    if (ok) setExito(true)
    else setErrorGeneral('No se pudo guardar. Intenta de nuevo.')
  }

  const constancia = documentos.find(d => d.archivo_url.includes('/constancia-fiscal.'))

  return (
    <div className="fade-in p-5 pb-24">
      <SubHeader title="Datos fiscales" onBack={onBack} />

      <button
        type="button" onClick={() => setRequiereFactura(r => !r)}
        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors mb-4 ${
          requiereFactura ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-3 text-left">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${requiereFactura ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
            <FontAwesomeIcon icon={faFileInvoiceDollar} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Requiero facturación</p>
            <p className="text-xs text-slate-400">Activa para capturar tus datos fiscales</p>
          </div>
        </div>
        <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${requiereFactura ? 'bg-blue-600' : 'bg-slate-300'}`}>
          <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${requiereFactura ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
      </button>

      {requiereFactura && (
        <>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 mb-4">
            <div>
              <Label req>Razón social</Label>
              <input value={form.razon_social} placeholder="NOMBRE O RAZÓN SOCIAL COMPLETA"
                onChange={e => set('razon_social', e.target.value.toUpperCase())} className={inputCls(errors.razon_social)} />
              <ErrMsg msg={errors.razon_social} />
            </div>
            <div>
              <Label>Nombre comercial</Label>
              <input value={form.nombre_comercial} placeholder="NOMBRE COMERCIAL (OPCIONAL)"
                onChange={e => set('nombre_comercial', e.target.value.toUpperCase())} className={inputCls()} />
            </div>
            <div>
              <Label req>RFC</Label>
              <input value={form.rfc} maxLength={13} placeholder="RFC 12 O 13 CARACTERES"
                onChange={e => set('rfc', e.target.value.toUpperCase())} className={inputCls(errors.rfc)} />
              <ErrMsg msg={errors.rfc} />
            </div>
            <div>
              <Label req>Régimen fiscal</Label>
              <select value={form.regimen_fiscal} onChange={e => set('regimen_fiscal', e.target.value)} className={inputCls(errors.regimen_fiscal)}>
                <option value="">Seleccionar régimen...</option>
                {REGIMENES_FISCALES.map(r => <option key={r.clave} value={r.clave}>{r.desc}</option>)}
              </select>
              <ErrMsg msg={errors.regimen_fiscal} />
            </div>
            <div>
              <Label req>Destino del CFDI</Label>
              <select value={form.cfdi} onChange={e => set('cfdi', e.target.value)} className={inputCls(errors.cfdi)}>
                <option value="">Seleccionar uso de CFDI...</option>
                {USOS_CFDI.map(c => <option key={c.clave} value={c.clave}>{c.desc}</option>)}
              </select>
              <ErrMsg msg={errors.cfdi} />
            </div>
          </div>

          <div className="mb-4">
            <DocSlot
              label="Constancia de situación fiscal" slot="constancia-fiscal" tipoDoc="Constancia fiscal"
              documento={constancia} onUploaded={cargarDocs}
            />
          </div>
        </>
      )}

      {errorGeneral && <p className="text-xs text-red-500 font-medium mb-2">{errorGeneral}</p>}
      {exito && <p className="text-xs text-green-600 font-medium mb-2">✓ Datos fiscales actualizados.</p>}

      <button
        onClick={guardar} disabled={guardando}
        className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-60 transition-colors"
      >
        {guardando ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  )
}

// ─── 5. Documentos (INE y comprobante de domicilio) ─────────────────────────────
function DocumentosSeccion({ onBack }: { onBack: () => void }) {
  const { usuario } = useApp()
  const [documentos, setDocumentos] = useState<DocumentoRow[]>([])
  const [cargando, setCargando] = useState(true)

  const cargar = async () => {
    if (!usuario) return
    setCargando(true)
    try {
      setDocumentos(await getDocumentosUsuario(usuario.id) as DocumentoRow[])
    } catch (e) {
      console.error('Error cargando documentos:', e)
    } finally {
      setCargando(false)
    }
  }
  useEffect(() => {
    if (!usuario?.id) return
    let activo = true
    getDocumentosUsuario(usuario.id)
      .then(data => { if (activo) setDocumentos(data as DocumentoRow[]) })
      .catch(e => console.error('Error cargando documentos:', e))
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [usuario?.id])

  const buscar = (slot: string) => documentos.find(d => d.archivo_url.includes(`/${slot}.`))

  return (
    <div className="fade-in p-5 pb-24">
      <SubHeader title="Documentos" onBack={onBack} />
      {cargando ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse bg-slate-100 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          <DocSlot label="INE / identificación — frente" slot="ine-frente" tipoDoc="INE / IFE" documento={buscar('ine-frente')} onUploaded={cargar} />
          <DocSlot label="INE / identificación — reverso" slot="ine-reverso" tipoDoc="INE / IFE" documento={buscar('ine-reverso')} onUploaded={cargar} />
          <DocSlot label="Comprobante de domicilio" slot="comprobante-domicilio" tipoDoc="Comprobante domicilio" documento={buscar('comprobante-domicilio')} onUploaded={cargar} />
        </div>
      )}
    </div>
  )
}

// ─── 6. Métodos de pago ──────────────────────────────────────────────────────────
// El catálogo (qué métodos existen y cuáles están activos) lo define Torre
// de Control en Configuración → Métodos de pago (tabla `metodos_pago`).
// Las tarjetas se capturan y tokenizan con Stripe (ver lib/stripe-client.ts
// y app/api/stripe/*) -- el número de tarjeta nunca pasa por este
// servidor ni se guarda en Supabase, solo la marca y los últimos 4
// dígitos que regresa Stripe. Métodos sin tarjeta (Efectivo, Transferencia
// SPEI) se guardan directo, sin Stripe.
const esMetodoTarjeta = (nombre?: string | null) => /tarjeta/i.test(nombre ?? '')

const stripeElementOptions = {
  style: {
    base: { fontSize: '14px', color: '#1e293b', '::placeholder': { color: '#94a3b8' } },
    invalid: { color: '#ef4444' },
  },
}

// Formulario de alta de una tarjeta nueva. Vive dentro de <Elements> para
// poder usar useStripe/useElements. El flujo es: 1) pide un SetupIntent al
// servidor, 2) confirma la tarjeta directo con Stripe.js (stripe.com nunca
// pasa por nuestro servidor), 3) ya con el SetupIntent confirmado, le pide
// al servidor que verifique y guarde el resultado.
function FormularioNuevaTarjeta({ metodoPagoId, onSaved, onCancel }: {
  metodoPagoId: string
  onSaved: (predeterminado: boolean) => void | Promise<void>
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [alias, setAlias] = useState('')
  const [titular, setTitular] = useState('')
  const [predeterminado, setPredeterminado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const guardar = async () => {
    if (!stripe || !elements) return
    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    setGuardando(true)
    setError('')
    try {
      const { clientSecret } = await crearSetupIntentTarjeta()
      const resultado = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: titular.trim() ? { name: titular.trim() } : undefined,
        },
      })

      if (resultado.error) {
        setError(resultado.error.message ?? 'Stripe rechazó la tarjeta. Verifica los datos.')
        setGuardando(false)
        return
      }
      const setupIntentId = resultado.setupIntent?.id
      if (!setupIntentId) {
        setError('No se pudo confirmar la captura de la tarjeta.')
        setGuardando(false)
        return
      }

      const nuevo = await guardarMetodoPagoTarjeta({ setupIntentId, metodoPagoId, alias })
      if (predeterminado) await marcarMetodoPagoPredeterminado(nuevo.id)
      await onSaved(predeterminado)
    } catch (e) {
      console.error('Error guardando tarjeta:', e)
      setError(e instanceof Error ? e.message : 'No se pudo guardar la tarjeta. Intenta de nuevo.')
    }
    setGuardando(false)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <div>
        <Label>Datos de la tarjeta</Label>
        <div className={inputCls() + ' py-3'}>
          <CardElement options={stripeElementOptions} />
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Tu tarjeta se captura directo con Stripe; nunca pasa por nuestros servidores.
        </p>
      </div>
      <div>
        <Label>Nombre del titular</Label>
        <input
          value={titular} placeholder="COMO APARECE EN LA TARJETA"
          onChange={e => setTitular(e.target.value.toUpperCase())} className={inputCls()}
        />
      </div>
      <div>
        <Label>Alias</Label>
        <input
          value={alias} placeholder="EJ. TARJETA PRINCIPAL"
          onChange={e => setAlias(e.target.value.toUpperCase())} className={inputCls()}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600 pt-1">
        <input
          type="checkbox" checked={predeterminado}
          onChange={e => setPredeterminado(e.target.checked)} className="rounded border-slate-300"
        />
        Usar como método predeterminado
      </label>

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 border border-slate-300 text-slate-600 font-medium py-3 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={guardar} disabled={guardando || !stripe}
          className="flex-1 bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-60 transition-colors"
        >
          {guardando ? 'Guardando...' : 'Guardar tarjeta'}
        </button>
      </div>
    </div>
  )
}

function PagosSeccion({ onBack }: { onBack: () => void }) {
  const { usuario } = useApp()
  const [catalogo, setCatalogo] = useState<{ id: string; nombre: string; descripcion: string | null }[]>([])
  const [metodos, setMetodos] = useState<MetodoPagoUsuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [nuevoMetodoPagoId, setNuevoMetodoPagoId] = useState('')
  const [form, setForm] = useState({ alias: '', predeterminado: false })
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const cargar = async () => {
    if (!usuario) return
    setCargando(true)
    try {
      const [cat, propios] = await Promise.all([getCatalogoMetodosPago(), getMetodosPagoUsuario(usuario.id)])
      setCatalogo(cat ?? [])
      setMetodos(propios)
    } catch (e) {
      console.error('Error cargando métodos de pago:', e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (!usuario?.id) return
    let activo = true
    Promise.all([getCatalogoMetodosPago(), getMetodosPagoUsuario(usuario.id)])
      .then(([cat, propios]) => {
        if (!activo) return
        setCatalogo(cat ?? [])
        setMetodos(propios)
      })
      .catch(e => console.error('Error cargando métodos de pago:', e))
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [usuario?.id])

  const abrirNuevo = () => {
    setEditId(null)
    setNuevoMetodoPagoId(catalogo[0]?.id ?? '')
    setForm({ alias: '', predeterminado: metodos.length === 0 })
    setErrorGeneral('')
    setMostrarForm(true)
  }

  const abrirEditar = (m: MetodoPagoUsuario) => {
    setEditId(m.id)
    setForm({ alias: m.alias ?? '', predeterminado: m.predeterminado })
    setErrorGeneral('')
    setMostrarForm(true)
  }

  const cerrarForm = () => {
    setMostrarForm(false)
    setEditId(null)
    setErrorGeneral('')
  }

  const metodoNuevoSeleccionado = catalogo.find(c => c.id === nuevoMetodoPagoId)
  const esNuevaTarjeta = !editId && esMetodoTarjeta(metodoNuevoSeleccionado?.nombre)

  // Guarda métodos SIN tarjeta (Efectivo, Transferencia...) y la edición
  // de alias/predeterminado de cualquier método ya existente. La captura
  // de tarjetas nuevas la maneja FormularioNuevaTarjeta por separado,
  // porque necesita el flujo de Stripe.
  const guardarSimple = async () => {
    if (!usuario) return
    setGuardando(true)
    setErrorGeneral('')
    try {
      let idAfectado = editId
      if (editId) {
        await actualizarMetodoPagoUsuario(editId, { alias: form.alias })
      } else {
        const creado = await agregarMetodoPagoUsuario(usuario.id, { metodoPagoId: nuevoMetodoPagoId, alias: form.alias })
        idAfectado = creado.id
      }
      if (form.predeterminado && idAfectado) await marcarMetodoPagoPredeterminado(idAfectado)
      cerrarForm()
      await cargar()
    } catch (e) {
      console.error('Error guardando método de pago:', e)
      setErrorGeneral('No se pudo guardar el método de pago. Intenta de nuevo.')
    }
    setGuardando(false)
  }

  const tarjetaGuardada = async () => {
    cerrarForm()
    await cargar()
  }

  const eliminar = async (id: string) => {
    try {
      await eliminarMetodoPagoUsuario(id)
      setConfirmDelete(null)
      await cargar()
    } catch (e) {
      console.error('Error eliminando método de pago:', e)
    }
  }

  const marcarPredeterminado = async (id: string) => {
    try {
      await marcarMetodoPagoPredeterminado(id)
      await cargar()
    } catch (e) {
      console.error('Error marcando método predeterminado:', e)
    }
  }

  return (
    <div className="fade-in p-5 pb-24">
      <SubHeader title="Métodos de pago" onBack={onBack} />

      {cargando ? (
        <div className="space-y-3 mb-4">
          {[1, 2].map(i => <div key={i} className="h-20 animate-pulse bg-slate-100 rounded-xl" />)}
        </div>
      ) : catalogo.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center mb-4">
          <FontAwesomeIcon icon={faCreditCard} className="text-3xl text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">Aún no hay métodos de pago disponibles</p>
          <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">
            El administrador todavía no habilita formas de pago en la plataforma. Por ahora, el cobro de cada viaje se acuerda con soporte.
          </p>
        </div>
      ) : (
        <>
          {metodos.length === 0 && !mostrarForm && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center mb-4">
              <FontAwesomeIcon icon={faCreditCard} className="text-3xl text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">Aún no tienes métodos de pago guardados.</p>
            </div>
          )}

          {metodos.length > 0 && (
            <div className="space-y-3 mb-4">
              {metodos.map(m => (
                <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 flex-shrink-0">
                      <FontAwesomeIcon icon={faCreditCard} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate flex items-center gap-2">
                        <span className="truncate">{m.alias || m.metodos_pago?.nombre || 'Método de pago'}</span>
                        {m.predeterminado && (
                          <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex-shrink-0">
                            Predeterminado
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {m.marca ? m.marca.toUpperCase() : m.metodos_pago?.nombre}
                        {m.ultimos_digitos ? ` · •••• ${m.ultimos_digitos}` : ''}
                        {m.titular ? ` · ${m.titular}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!m.predeterminado && (
                      <button
                        onClick={() => marcarPredeterminado(m.id)} title="Marcar como predeterminado"
                        className="text-slate-400 hover:text-blue-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-50"
                      >
                        <FontAwesomeIcon icon={faStar} className="text-xs" />
                      </button>
                    )}
                    <button
                      onClick={() => abrirEditar(m)}
                      className="text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"
                    >
                      <FontAwesomeIcon icon={faPen} className="text-xs" />
                    </button>
                    {confirmDelete === m.id ? (
                      <span className="inline-flex items-center gap-1.5 text-xs flex-shrink-0">
                        <button onClick={() => eliminar(m.id)} className="text-red-600 font-medium hover:underline">Sí</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-slate-400 hover:underline">No</button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(m.id)}
                        className="text-slate-400 hover:text-red-500 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {mostrarForm ? (
            !editId && (
              <div className="mb-3">
                <Label req>Método de pago</Label>
                <select
                  value={nuevoMetodoPagoId} onChange={e => setNuevoMetodoPagoId(e.target.value)}
                  className={inputCls()}
                >
                  {catalogo.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                {metodoNuevoSeleccionado?.descripcion && (
                  <p className="text-xs text-slate-400 mt-1">{metodoNuevoSeleccionado.descripcion}</p>
                )}
              </div>
            )
          ) : null}

          {mostrarForm && esNuevaTarjeta ? (
            <Elements stripe={getStripeBrowserClient()}>
              <FormularioNuevaTarjeta
                metodoPagoId={nuevoMetodoPagoId}
                onSaved={tarjetaGuardada}
                onCancel={cerrarForm}
              />
            </Elements>
          ) : mostrarForm ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div>
                <Label>Alias</Label>
                <input
                  value={form.alias} placeholder="EJ. EFECTIVO EN SITIO"
                  onChange={e => setForm(f => ({ ...f, alias: e.target.value.toUpperCase() }))}
                  className={inputCls()}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 pt-1">
                <input
                  type="checkbox" checked={form.predeterminado}
                  onChange={e => setForm(f => ({ ...f, predeterminado: e.target.checked }))}
                  className="rounded border-slate-300"
                />
                Usar como método predeterminado
              </label>

              {errorGeneral && <p className="text-xs text-red-500 font-medium">{errorGeneral}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={cerrarForm}
                  className="flex-1 border border-slate-300 text-slate-600 font-medium py-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarSimple} disabled={guardando}
                  className="flex-1 bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-60 transition-colors"
                >
                  {guardando ? 'Guardando...' : 'Guardar método'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={abrirNuevo}
              className="w-full border-2 border-dashed border-slate-300 text-slate-500 font-medium py-3 rounded-xl hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} /> Agregar método de pago
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ─── 7. FAQs y legal ─────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: '¿Cómo funciona el servicio de Ruum Ruum?',
    a: 'Solicitas el traslado de tu vehículo indicando origen y destino; te asignamos un conductor certificado que documenta el estado del auto antes y después del viaje.',
  },
  {
    q: '¿Qué pasa si mi vehículo sufre un daño durante el traslado?',
    a: 'Cada viaje queda respaldado con evidencia fotográfica al inicio y al final. Si detectas una diferencia, contacta a soporte desde el detalle de tu viaje para iniciar una revisión.',
  },
  {
    q: '¿Puedo cancelar un viaje ya solicitado?',
    a: 'Sí, mientras el conductor no haya iniciado la operación. Dependiendo de la etapa del viaje puede aplicar una penalización, que verás reflejada antes de confirmar la cancelación.',
  },
  {
    q: '¿Dónde veo la evidencia fotográfica de mi viaje?',
    a: 'Desde "Mis viajes" entra al detalle del viaje y selecciona "Ver evidencias", o usa el acceso rápido en la pantalla de inicio.',
  },
  {
    q: '¿Qué documentos necesito para mi cuenta?',
    a: 'Una identificación oficial vigente (INE, pasaporte o cédula profesional) y un comprobante de domicilio. Si requieres factura, también tus datos fiscales y tu constancia de situación fiscal.',
  },
  {
    q: '¿Cómo actualizo mis datos fiscales?',
    a: 'Desde Mi cuenta → Datos fiscales puedes actualizar tu razón social, RFC, régimen fiscal, destino del CFDI y subir tu constancia de situación fiscal.',
  },
]

const LEGAL_DOCS = [
  { title: 'Términos y condiciones', desc: 'Aceptaste los términos de uso del servicio Ruum Ruum, incluyendo las políticas de traslado, cancelación y responsabilidad sobre el vehículo.' },
  { title: 'Aviso de privacidad', desc: 'Autorizaste el tratamiento de tus datos personales conforme al aviso de privacidad de MoviliaX S.A. de C.V.' },
  { title: 'Autorización de datos del vehículo', desc: 'Confirmaste ser propietario o tener autorización para trasladar el vehículo indicado y que los datos proporcionados son verídicos.' },
]

function FaqSeccion({ onBack }: { onBack: () => void }) {
  const [abierto, setAbierto] = useState<number | null>(null)

  return (
    <div className="fade-in p-5 pb-24">
      <SubHeader title="FAQs y legal" onBack={onBack} />

      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Preguntas frecuentes</h3>
      <div className="space-y-2 mb-6">
        {FAQS.map((f, i) => (
          <div key={f.q} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button onClick={() => setAbierto(a => a === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
              <span className="text-sm font-medium text-slate-700 pr-3">{f.q}</span>
              <FontAwesomeIcon icon={abierto === i ? faChevronUp : faChevronDown} className="text-slate-400 text-xs flex-shrink-0" />
            </button>
            {abierto === i && <p className="px-4 pb-4 text-xs text-slate-500 leading-relaxed">{f.a}</p>}
          </div>
        ))}
      </div>

      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Legal</h3>
      <div className="space-y-2 mb-6">
        {LEGAL_DOCS.map(doc => (
          <div key={doc.title} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-sm font-semibold text-slate-700">{doc.title}</p>
              <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                <FontAwesomeIcon icon={faCheckCircle} /> Aceptado
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{doc.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3">
        <FontAwesomeIcon icon={faHeadset} className="text-slate-500 mt-1" />
        <div>
          <p className="text-sm font-semibold text-slate-700">¿No encontraste lo que buscabas?</p>
          <p className="text-xs text-slate-500 mt-1">Contacta a soporte desde el detalle de tu viaje o desde la pantalla de inicio.</p>
        </div>
      </div>
    </div>
  )
}

// ─── 8. Cambiar contraseña ───────────────────────────────────────────────────────
function PasswordSeccion({ onBack }: { onBack: () => void }) {
  const { cambiarPasswordObligatorio } = useApp()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [show, setShow] = useState(false)
  const [showC, setShowC] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmar?: string }>({})
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState('')

  const validate = () => {
    const e: { password?: string; confirmar?: string } = {}
    if (password.length < 8) e.password = 'Mínimo 8 caracteres'
    if (password !== confirmar) e.confirmar = 'Las contraseñas no coinciden'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const guardar = async () => {
    if (!validate()) return
    setGuardando(true)
    setErrorGeneral('')
    setExito(false)
    const ok = await cambiarPasswordObligatorio(password)
    setGuardando(false)
    if (ok) { setExito(true); setPassword(''); setConfirmar('') }
    else setErrorGeneral('No se pudo actualizar tu contraseña. Intenta de nuevo.')
  }

  return (
    <div className="fade-in p-5 pb-24">
      <SubHeader title="Cambiar contraseña" onBack={onBack} />
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div>
          <Label req>Nueva contraseña</Label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'} value={password} placeholder="Mínimo 8 caracteres"
              onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: undefined })); setExito(false) }}
              className={inputCls(errors.password)}
            />
            <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <FontAwesomeIcon icon={show ? faEyeSlash : faEye} />
            </button>
          </div>
          <ErrMsg msg={errors.password} />
        </div>

        <div>
          <Label req>Confirmar contraseña</Label>
          <div className="relative">
            <input
              type={showC ? 'text' : 'password'} value={confirmar} placeholder="Repite tu contraseña"
              onChange={e => { setConfirmar(e.target.value); setErrors(er => ({ ...er, confirmar: undefined })); setExito(false) }}
              onKeyDown={e => e.key === 'Enter' && guardar()}
              className={inputCls(errors.confirmar)}
            />
            <button type="button" onClick={() => setShowC(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <FontAwesomeIcon icon={showC ? faEyeSlash : faEye} />
            </button>
          </div>
          <ErrMsg msg={errors.confirmar} />
        </div>

        {errorGeneral && <p className="text-xs text-red-500 font-medium">{errorGeneral}</p>}
        {exito && <p className="text-xs text-green-600 font-medium">✓ Tu contraseña se actualizó correctamente.</p>}

        <button
          onClick={guardar} disabled={guardando}
          className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-60 transition-colors"
        >
          {guardando ? 'Guardando...' : 'Actualizar contraseña'}
        </button>
      </div>
    </div>
  )
}

// ─── Menú principal de Mi Cuenta ─────────────────────────────────────────────────
function MenuPrincipal({ onNavigate, onLogout }: {
  onNavigate: (s: Seccion) => void; onLogout: () => void
}) {
  const { usuario } = useApp()
  const iniciales = usuario ? `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}` : 'RR'

  return (
    <div className="fade-in p-5 pb-24">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Mi Cuenta</h2>

      {/* 1. Cabecera — Perfil del usuario */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 flex flex-col text-center sm:flex-row sm:text-left items-center gap-4 relative">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shrink-0">
          {iniciales}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-800 truncate">
            {usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Cargando...'}
          </h3>
          <p className="text-sm text-slate-500 truncate">{usuario?.email ?? '—'}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 mt-2">
            <span className="text-xs text-slate-500">
              <FontAwesomeIcon icon={faIdCard} className="mr-1 text-slate-400" />
              CURP: {usuario?.curp || 'No registrada'}
            </span>
            <span className="text-xs text-slate-500">
              <FontAwesomeIcon icon={faPhone} className="mr-1 text-slate-400" />
              {usuario?.telefono || 'Teléfono no registrado'}
            </span>
          </div>
        </div>
        <button
          onClick={() => onNavigate('perfil')}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Editar perfil"
        >
          <FontAwesomeIcon icon={faPen} className="text-xs" />
        </button>
      </div>

      <div className="space-y-2 mb-6">
        <MenuRow icon={faMapMarkerAlt} label="Dirección" onClick={() => onNavigate('direccion')} />
        <MenuRow icon={faCar} label="Vehículos registrados" onClick={() => onNavigate('vehiculos')} />
        <MenuRow icon={faFileInvoiceDollar} label="Datos fiscales" onClick={() => onNavigate('fiscal')} />
        <MenuRow icon={faIdCard} label="Documentos" sublabel="INE y comprobante de domicilio" onClick={() => onNavigate('documentos')} />
        <MenuRow icon={faCreditCard} label="Métodos de pago" onClick={() => onNavigate('pagos')} />
        <MenuRow icon={faQuestionCircle} label="FAQs y legal" onClick={() => onNavigate('faq')} />
        <MenuRow icon={faLock} label="Cambiar contraseña" onClick={() => onNavigate('password')} />
      </div>

      {/* 9. Cerrar sesión */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 text-red-500 font-medium text-sm py-3 hover:bg-red-50 rounded-xl transition-colors border border-red-100"
      >
        <FontAwesomeIcon icon={faSignOutAlt} />
        Cerrar sesión
      </button>
    </div>
  )
}

// ─── Orquestador principal de la sección Cuenta ─────────────────────────────────
export default function ViewCuenta() {
  const [seccion, setSeccion] = useState<Seccion>('menu')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // La página se recargará y AppContext detectará que no hay sesión
    window.location.reload()
  }

  const volver = () => setSeccion('menu')

  switch (seccion) {
    case 'perfil':
      return <PerfilEditor onBack={volver} />
    case 'direccion':
      return <DireccionEditor onBack={volver} />
    case 'vehiculos':
      return <VehiculosSeccion onBack={volver} />
    case 'fiscal':
      return <FiscalSeccion onBack={volver} />
    case 'documentos':
      return <DocumentosSeccion onBack={volver} />
    case 'pagos':
      return <PagosSeccion onBack={volver} />
    case 'faq':
      return <FaqSeccion onBack={volver} />
    case 'password':
      return <PasswordSeccion onBack={volver} />
    default:
      return <MenuPrincipal onNavigate={setSeccion} onLogout={handleLogout} />
  }
}