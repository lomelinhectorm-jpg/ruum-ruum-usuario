'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { REGIMENES_FISCALES, USOS_CFDI } from '@/lib/constants/fiscal'

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type Step = 'welcome' | 'register' | 'login' | 'documents' | 'legal'
type DocFile = { file: File; preview: string } | null

const TIPOS_USUARIO = ['Personal','Empresarial','Agencia','Lote','Flotilla','Arrendadora','Taller','Aseguradora','Entrega al cliente']

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const iCls = (err?: string) =>
  `w-full border ${err ? 'border-red-400 bg-red-50' : 'border-slate-300'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC400]`

function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
      {children}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-500 mt-0.5">{msg}</p> : null
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {open
        ? <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>
        : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
      }
    </svg>
  )
}

function Sec({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">{children}</p>
}

function UploadBox({ label, value, onChange, error, accept = 'image/*,.pdf' }: {
  label: string; value: DocFile; onChange: (f: DocFile) => void; error?: string; accept?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const handle = (file: File) => {
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    onChange({ file, preview })
  }
  return (
    <div>
      <Label>{label}</Label>
      <div
        onClick={() => ref.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[90px] ${
          error ? 'border-red-400 bg-red-50' : value ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
        }`}
      >
        {value ? (
          <div className="flex items-center gap-3 w-full">
            {value.preview
              ? <img src={value.preview} alt="" className="w-14 h-14 object-cover rounded-lg" />
              : <div className="w-14 h-14 bg-slate-200 rounded-lg flex items-center justify-center text-2xl">📄</div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-green-700 truncate">{value.file.name}</p>
              <p className="text-xs text-slate-400">{(value.file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button onClick={e => { e.stopPropagation(); onChange(null) }}
              className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 text-red-500 text-xs font-bold">✕</button>
          </div>
        ) : (
          <>
            <span className="text-2xl mb-1">📎</span>
            <p className="text-xs text-slate-500 text-center">Toca para subir<br /><span className="text-slate-400">JPG, PNG o PDF</span></p>
          </>
        )}
        <input ref={ref} type="file" accept={accept} className="hidden"
          onChange={e => e.target.files?.[0] && handle(e.target.files[0])} />
      </div>
      <Err msg={error} />
    </div>
  )
}

// ─── PANTALLA 1: BIENVENIDA ───────────────────────────────────────────────────
function StepWelcome({ onRegister, onLogin }: { onRegister: () => void; onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-[#151515] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 text-center py-10 sm:py-12">
        <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
          <span className="text-5xl">🚗</span>
        </div>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 bg-[#FFC400]/20 rounded-lg flex items-center justify-center">
            <span className="text-[#FFC400] font-black text-xs">RR</span>
          </div>
          <span className="text-white/60 text-xs font-medium tracking-widest uppercase">Ruum Ruum</span>
        </div>
        <h1 className="text-3xl font-black text-white mb-4 leading-tight">Tu auto en buenas manos</h1>
        <p className="text-white/70 text-sm leading-relaxed max-w-xs">
          Traslada tu vehículo de forma segura con conductores certificados y evidencia fotográfica en cada viaje.
        </p>
        <div className="mt-8 space-y-3 w-full max-w-xs">
          {[
            { icon: '📍', text: 'Seguimiento en tiempo real' },
            { icon: '📷', text: 'Evidencia fotográfica del estado de tu auto' },
            { icon: '✅', text: 'Conductores verificados y certificados' },
          ].map(b => (
            <div key={b.text} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <span className="text-xl">{b.icon}</span>
              <span className="text-white/85 text-sm font-medium">{b.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 sm:px-8 pb-8 sm:pb-12 space-y-3">
        <button onClick={onRegister}
          className="w-full bg-[#FFC400] text-[#151515] font-bold py-4 rounded-2xl text-base shadow-xl hover:bg-white/90 transition-all active:scale-95">
          Crear mi cuenta
        </button>
        <button onClick={onLogin}
          className="w-full border-2 border-[#FFC400]/60 text-[#FFC400] font-semibold py-4 rounded-2xl text-base hover:bg-[#FFC400]/10 transition-all active:scale-95">
          Ya tengo cuenta
        </button>
      </div>
    </div>
  )
}

// ─── PANTALLA 2: REGISTRO ─────────────────────────────────────────────────────
interface RegData {
  nombre: string; apellido: string; curp: string; email: string; telefono: string; tipo: string
  calle: string; numero: string; colonia: string; municipio: string; estadoGeo: string; codigoPostal: string
  requiereFactura: boolean; razonSocial: string; rfc: string; regimenFiscal: string; cfdi: string
  fiscalCalle: string; fiscalNumero: string; fiscalColonia: string; fiscalMunicipio: string; fiscalEstado: string; fiscalCp: string
  password: string; confirmar: string
}

function StepRegister({ onBack, onNext }: {
  onBack: () => void
  onNext: (data: RegData) => void
}) {
  const [form, setForm] = useState<RegData>({
    nombre: '', apellido: '', curp: '', email: '', telefono: '', tipo: '',
    calle: '', numero: '', colonia: '', municipio: '', estadoGeo: '', codigoPostal: '',
    requiereFactura: false,
    razonSocial: '', rfc: '', regimenFiscal: '', cfdi: '',
    fiscalCalle: '', fiscalNumero: '', fiscalColonia: '', fiscalMunicipio: '', fiscalEstado: '', fiscalCp: '',
    password: '', confirmar: '',
  })
  const [show, setShow] = useState(false)
  const [showC, setShowC] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof RegData, string>>>({})

  const set = (k: keyof RegData, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const fmtTel = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 10)
    return d.length <= 3 ? d : d.length <= 6 ? `${d.slice(0,3)}-${d.slice(3)}` : `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`
  }

  const validate = () => {
    const e: Partial<Record<keyof RegData, string>> = {}
    if (!form.nombre.trim())   e.nombre   = 'Requerido'
    if (!form.apellido.trim()) e.apellido = 'Requerido'
    if (!form.email)           e.email    = 'Requerido'
    if (form.telefono.replace(/\D/g,'').length < 10) e.telefono = 'Ingresa 10 dígitos'
    if (!form.tipo)            e.tipo     = 'Requerido'
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      e.password = 'Mínimo 8 caracteres, una letra y un número'
    }
    if (form.password !== form.confirmar)        e.confirmar = 'Las contraseñas no coinciden'
    if (form.requiereFactura) {
      if (!form.razonSocial)   e.razonSocial   = 'Requerido'
      if (!form.rfc)           e.rfc           = 'Requerido'
      if (!form.regimenFiscal) e.regimenFiscal = 'Requerido'
      if (!form.cfdi)          e.cfdi          = 'Requerido'
      if (!form.fiscalCalle)   e.fiscalCalle   = 'Requerido'
      if (!form.fiscalCp)      e.fiscalCp      = 'Requerido'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-[#151515] px-5 sm:px-6 pt-8 sm:pt-12 pb-6">
        <button onClick={onBack} className="text-[#F8F8F5]/70 text-sm mb-4 flex items-center gap-1 hover:text-[#FFC400]">← Regresar</button>
        <h2 className="text-2xl font-black text-white">Crear mi cuenta</h2>
        <p className="text-white/60 text-sm mt-1">Completa tus datos para comenzar</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

        {/* Datos personales */}
        <div>
          <Sec>👤 Datos personales</Sec>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label req>Nombre(s)</Label>
                <input type="text" value={form.nombre} placeholder="NOMBRE(S)"
                  onChange={e => set('nombre', e.target.value.toUpperCase())} className={iCls(errors.nombre)} />
                <Err msg={errors.nombre} />
              </div>
              <div>
                <Label req>Apellido(s)</Label>
                <input type="text" value={form.apellido} placeholder="APELLIDO(S)"
                  onChange={e => set('apellido', e.target.value.toUpperCase())} className={iCls(errors.apellido)} />
                <Err msg={errors.apellido} />
              </div>
            </div>
            <div>
              <Label>CURP</Label>
              <input type="text" value={form.curp} placeholder="18 CARACTERES" maxLength={18}
                onChange={e => set('curp', e.target.value.toUpperCase())} className={iCls()} />
            </div>
            <div>
              <Label req>Tipo de usuario</Label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={iCls(errors.tipo)}>
                <option value="">Seleccionar...</option>
                {TIPOS_USUARIO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <Err msg={errors.tipo} />
            </div>
            <div>
              <Label req>Correo electrónico</Label>
              <input type="email" value={form.email} placeholder="correo@ejemplo.com"
                onChange={e => set('email', e.target.value)} className={iCls(errors.email)} />
              <Err msg={errors.email} />
            </div>
            <div>
              <Label req>Teléfono</Label>
              <div className="flex flex-col min-[380px]:flex-row gap-2">
                <div className="px-3 py-3 border border-slate-300 rounded-xl text-sm text-slate-600 bg-slate-50 whitespace-nowrap">🇲🇽 +52</div>
                <input type="tel" value={form.telefono} placeholder="55-0000-0000"
                  onChange={e => set('telefono', fmtTel(e.target.value))} className={`flex-1 ${iCls(errors.telefono)}`} />
              </div>
              <Err msg={errors.telefono} />
            </div>
          </div>
        </div>

        {/* Domicilio general */}
        <div>
          <Sec>🏠 Domicilio</Sec>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Calle</Label>
              <input type="text" value={form.calle} placeholder="NOMBRE DE LA CALLE"
                onChange={e => set('calle', e.target.value.toUpperCase())} className={iCls()} />
            </div>
            <div>
              <Label>Número</Label>
              <input type="text" value={form.numero} placeholder="EXT / INT"
                onChange={e => set('numero', e.target.value.toUpperCase())} className={iCls()} />
            </div>
            <div>
              <Label>Colonia</Label>
              <input type="text" value={form.colonia} placeholder="COLONIA"
                onChange={e => set('colonia', e.target.value.toUpperCase())} className={iCls()} />
            </div>
            <div>
              <Label>Código Postal</Label>
              <input type="text" value={form.codigoPostal} placeholder="00000" maxLength={5}
                onChange={e => set('codigoPostal', e.target.value.replace(/\D/g,'').slice(0,5))} className={iCls()} />
            </div>
            <div>
              <Label>Municipio / Alcaldía</Label>
              <input type="text" value={form.municipio} placeholder="MUNICIPIO"
                onChange={e => set('municipio', e.target.value.toUpperCase())} className={iCls()} />
            </div>
            <div>
              <Label>Estado</Label>
              <input type="text" value={form.estadoGeo} placeholder="ESTADO"
                onChange={e => set('estadoGeo', e.target.value.toUpperCase())} className={iCls()} />
            </div>
          </div>
        </div>

        {/* Toggle facturación */}
        <button type="button" onClick={() => set('requiereFactura', !form.requiereFactura)}
          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
            form.requiereFactura ? 'border-[#FFC400] bg-[#FFC400]/5' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
          }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${form.requiereFactura ? 'bg-[#FFC400]/20' : 'bg-slate-200'}`}>🧾</div>
            <div className="text-left">
              <p className={`text-sm font-semibold ${form.requiereFactura ? 'text-[#151515] font-bold' : 'text-slate-700'}`}>Requiero facturación</p>
              <p className="text-xs text-slate-400">Activa para capturar tus datos fiscales</p>
            </div>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors relative ${form.requiereFactura ? 'bg-[#FFC400]' : 'bg-slate-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${form.requiereFactura ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </button>

        {/* Datos fiscales */}
        {form.requiereFactura && (
          <div className="border border-[#FFC400]/20 bg-[#FFC400]/5 rounded-xl p-4 space-y-3">
            <Sec>🧾 Información fiscal</Sec>
            <div>
              <Label req>Razón social</Label>
              <input type="text" value={form.razonSocial} placeholder="NOMBRE O RAZÓN SOCIAL COMPLETA"
                onChange={e => set('razonSocial', e.target.value.toUpperCase())} className={iCls(errors.razonSocial)} />
              <Err msg={errors.razonSocial} />
            </div>
            <div>
              <Label req>RFC</Label>
              <input type="text" value={form.rfc} placeholder="RFC 12 O 13 CARACTERES" maxLength={13}
                onChange={e => set('rfc', e.target.value.toUpperCase())} className={iCls(errors.rfc)} />
              <Err msg={errors.rfc} />
            </div>
            <div>
              <Label req>Régimen fiscal</Label>
              <select value={form.regimenFiscal} onChange={e => set('regimenFiscal', e.target.value)} className={iCls(errors.regimenFiscal)}>
                <option value="">Seleccionar régimen...</option>
                {REGIMENES_FISCALES.map(r => <option key={r.clave} value={r.clave}>{r.desc}</option>)}
              </select>
              <Err msg={errors.regimenFiscal} />
            </div>
            <div>
              <Label req>Uso de CFDI</Label>
              <select value={form.cfdi} onChange={e => set('cfdi', e.target.value)} className={iCls(errors.cfdi)}>
                <option value="">Seleccionar uso de CFDI...</option>
                {USOS_CFDI.map(c => <option key={c.clave} value={c.clave}>{c.desc}</option>)}
              </select>
              <Err msg={errors.cfdi} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Domicilio fiscal</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <Label req>Calle</Label>
                  <input type="text" value={form.fiscalCalle} placeholder="NOMBRE DE LA CALLE"
                    onChange={e => set('fiscalCalle', e.target.value.toUpperCase())} className={iCls(errors.fiscalCalle)} />
                  <Err msg={errors.fiscalCalle} />
                </div>
                <div>
                  <Label>Número</Label>
                  <input type="text" value={form.fiscalNumero} placeholder="EXT/INT"
                    onChange={e => set('fiscalNumero', e.target.value.toUpperCase())} className={iCls()} />
                </div>
                <div>
                  <Label>Colonia</Label>
                  <input type="text" value={form.fiscalColonia} placeholder="COLONIA"
                    onChange={e => set('fiscalColonia', e.target.value.toUpperCase())} className={iCls()} />
                </div>
                <div>
                  <Label req>Código Postal</Label>
                  <input type="text" value={form.fiscalCp} placeholder="00000" maxLength={5}
                    onChange={e => set('fiscalCp', e.target.value.replace(/\D/g,'').slice(0,5))} className={iCls(errors.fiscalCp)} />
                  <Err msg={errors.fiscalCp} />
                </div>
                <div>
                  <Label>Municipio / Alcaldía</Label>
                  <input type="text" value={form.fiscalMunicipio} placeholder="MUNICIPIO"
                    onChange={e => set('fiscalMunicipio', e.target.value.toUpperCase())} className={iCls()} />
                </div>
                <div>
                  <Label>Estado</Label>
                  <input type="text" value={form.fiscalEstado} placeholder="ESTADO"
                    onChange={e => set('fiscalEstado', e.target.value.toUpperCase())} className={iCls()} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contraseña */}
        <div>
          <Sec>🔒 Acceso a la cuenta</Sec>
          <div className="space-y-3">
            <div>
              <Label req>Contraseña</Label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} value={form.password} placeholder="8 caracteres, letra y número"
                  onChange={e => set('password', e.target.value)} className={iCls(errors.password)} />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  <EyeIcon open={show} />
                </button>
              </div>
              <Err msg={errors.password} />
            </div>
            <div>
              <Label req>Confirmar contraseña</Label>
              <div className="relative">
                <input type={showC ? 'text' : 'password'} value={form.confirmar} placeholder="Repite tu contraseña"
                  onChange={e => set('confirmar', e.target.value)} className={iCls(errors.confirmar)} />
                <button type="button" onClick={() => setShowC(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  <EyeIcon open={showC} />
                </button>
              </div>
              <Err msg={errors.confirmar} />
            </div>
          </div>
        </div>

      </div>

      <div className="p-5 sm:p-6 border-t border-slate-100">
        <button onClick={() => { if (validate()) onNext(form) }}
          className="w-full bg-[#FFC400] text-[#151515] font-bold py-4 rounded-2xl text-base hover:brightness-95 transition-all active:scale-95">
          Continuar →
        </button>
      </div>
    </div>
  )
}

// ─── PANTALLA 3: DOCUMENTOS ───────────────────────────────────────────────────
type TipoIne = 'INE / IFE' | 'Pasaporte' | 'Cédula Profesional' | ''

interface DocsData {
  ineTipo: TipoIne
  ineNumero: string
  ineVigencia: string
  ineFrente: DocFile
  ineReverso: DocFile
  domicilio: DocFile
}

function StepDocuments({ onBack, onNext }: { onBack: () => void; onNext: (data: DocsData) => void }) {
  const [ineType, setIneType] = useState<TipoIne>('')
  const [ineNumero, setIneNumero] = useState('')
  const [ineVigencia, setIneVigencia] = useState('')
  const [ineFrente, setIneFrente] = useState<DocFile>(null)
  const [ineReverso, setIneReverso] = useState<DocFile>(null)
  const [domicilio, setDomicilio] = useState<DocFile>(null)
  const [errors, setErrors] = useState<Record<string,string>>({})

  const validate = () => {
    const e: Record<string,string> = {}
    if (!ineType)        e.ineType    = 'Selecciona el tipo'
    if (!ineNumero)      e.ineNumero  = 'Requerido'
    if (!ineVigencia)    e.ineVigencia= 'Requerido'
    if (!ineFrente)      e.ineFrente  = 'Sube la imagen'
    if (!ineReverso)     e.ineReverso = 'Sube la imagen'
    if (!domicilio)      e.domicilio  = 'Sube el comprobante'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-[#151515] px-5 sm:px-6 pt-8 sm:pt-12 pb-6">
        <button onClick={onBack} className="text-[#F8F8F5]/70 text-sm mb-4 flex items-center gap-1 hover:text-[#FFC400]">← Regresar</button>
        <h2 className="text-2xl font-black text-white">Tus documentos</h2>
        <p className="text-white/60 text-sm mt-1">Los revisaremos en menos de 24 horas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

        {/* Identificación oficial */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-lg">🪪</span>
            <p className="text-sm font-bold text-slate-800">Identificación oficial</p>
          </div>
          <div>
            <Label req>Tipo de documento</Label>
            <select value={ineType} onChange={e => { setIneType(e.target.value as TipoIne); setErrors(er => ({ ...er, ineType: '' })) }}
              className={iCls(errors.ineType)}>
              <option value="">Seleccionar...</option>
              {(['INE / IFE','Pasaporte','Cédula Profesional'] as TipoIne[]).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <Err msg={errors.ineType} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label req>Número / Folio</Label>
              <input type="text" value={ineNumero} placeholder="NÚMERO DE FOLIO"
                onChange={e => { setIneNumero(e.target.value.toUpperCase()); setErrors(er => ({ ...er, ineNumero: '' })) }}
                className={iCls(errors.ineNumero)} />
              <Err msg={errors.ineNumero} />
            </div>
            <div>
              <Label req>Vigencia</Label>
              <input type="date" value={ineVigencia}
                onChange={e => { setIneVigencia(e.target.value); setErrors(er => ({ ...er, ineVigencia: '' })) }}
                className={iCls(errors.ineVigencia)} />
              <Err msg={errors.ineVigencia} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UploadBox label="Frente" value={ineFrente}
              onChange={v => { setIneFrente(v); setErrors(er => ({ ...er, ineFrente: '' })) }}
              error={errors.ineFrente} />
            <UploadBox label="Reverso" value={ineReverso}
              onChange={v => { setIneReverso(v); setErrors(er => ({ ...er, ineReverso: '' })) }}
              error={errors.ineReverso} />
          </div>
        </div>

        {/* Comprobante domicilio */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-lg">🏠</span>
            <p className="text-sm font-bold text-slate-800">Comprobante de domicilio</p>
            <span className="text-xs text-slate-400">(máx. 3 meses)</span>
          </div>
          <UploadBox label="Foto o PDF del comprobante" accept="image/*,.pdf" value={domicilio}
            onChange={v => { setDomicilio(v); setErrors(er => ({ ...er, domicilio: '' })) }}
            error={errors.domicilio} />
        </div>

        {Object.keys(errors).length > 0 && (
          <p className="text-xs text-red-500 text-center font-medium">Completa todos los campos marcados antes de continuar</p>
        )}
      </div>

      <div className="p-5 sm:p-6 border-t border-slate-100">
        <button onClick={() => { if (validate()) onNext({ ineTipo: ineType, ineNumero, ineVigencia, ineFrente, ineReverso, domicilio }) }}
          className="w-full bg-[#FFC400] text-[#151515] font-bold py-4 rounded-2xl text-base hover:brightness-95 transition-all active:scale-95">
          Continuar →
        </button>
      </div>
    </div>
  )
}

// ─── PANTALLA 4: TÉRMINOS LEGALES ─────────────────────────────────────────────
function StepLegal({ onBack, onAccept, loading }: { onBack: () => void; onAccept: () => void; loading: boolean }) {
  const [checks, setChecks] = useState({ terminos: false, privacidad: false, datos: false })
  const toggle = (k: keyof typeof checks) => setChecks(c => ({ ...c, [k]: !c[k] }))
  const allChecked = Object.values(checks).every(Boolean)

  const items = [
    { key: 'terminos' as const, title: 'Términos y condiciones', desc: 'Acepto los términos de uso del servicio Ruum Ruum, incluyendo las políticas de traslado, cancelación y responsabilidad sobre el vehículo.' },
    { key: 'privacidad' as const, title: 'Aviso de privacidad', desc: 'Autorizo el tratamiento de mis datos personales conforme al aviso de privacidad de MoviliaX S.A. de C.V.' },
    { key: 'datos' as const, title: 'Autorización de datos del vehículo', desc: 'Confirmo que soy propietario o tengo autorización para trasladar el vehículo indicado y que los datos proporcionados son verídicos.' },
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-[#151515] px-5 sm:px-6 pt-8 sm:pt-12 pb-6">
        <button onClick={onBack} className="text-[#F8F8F5]/70 text-sm mb-4 flex items-center gap-1 hover:text-[#FFC400]">← Regresar</button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-xl">🛡️</div>
          <div>
            <h2 className="text-2xl font-black text-white">Documentos legales</h2>
            <p className="text-white/60 text-sm">Último paso para activar tu cuenta</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
        {items.map(item => (
          <button key={item.key} onClick={() => toggle(item.key)}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-colors ${
              checks[item.key] ? 'border-[#FFC400] bg-[#FFC400]/5' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
            }`}>
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                checks[item.key] ? 'border-[#FFC400] bg-[#FFC400]' : 'border-slate-300 bg-white'
              }`}>
                {checks[item.key] && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <div>
                <p className={`text-sm font-bold mb-1 ${checks[item.key] ? 'text-[#151515] font-semibold' : 'text-slate-800'}`}>{item.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          </button>
        ))}
        {!allChecked && <p className="text-xs text-slate-400 text-center">Acepta todos los documentos para activar tu cuenta</p>}
      </div>

      <div className="p-5 sm:p-6 border-t border-slate-100">
        <button onClick={onAccept} disabled={!allChecked || loading}
          className={`w-full font-bold py-4 rounded-2xl text-base transition-all active:scale-95 ${
            allChecked && !loading
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}>
          {loading ? 'Creando cuenta...' : '✓ Activar mi cuenta'}
        </button>
      </div>
    </div>
  )
}

// ─── PANTALLA: LOGIN ──────────────────────────────────────────────────────────
function StepLogin({ onBack, onAuth }: { onBack: () => void; onAuth: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { setError('Completa todos los campos'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError('Correo o contraseña incorrectos'); return }
    onAuth()
  }

  const handleForgot = async () => {
    if (!email) { setError('Ingresa tu correo primero'); return }
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar-password`,
    })
    setForgotSent(true)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-[#151515] px-5 sm:px-6 pt-8 sm:pt-12 pb-6">
        <button onClick={onBack} className="text-[#F8F8F5]/70 text-sm mb-4 flex items-center gap-1 hover:text-[#FFC400]">← Regresar</button>
        <h2 className="text-2xl font-black text-white">Iniciar sesión</h2>
        <p className="text-white/60 text-sm mt-1">Bienvenido de nuevo</p>
      </div>

      <div className="flex-1 p-5 sm:p-6 space-y-4">
        <div>
          <Label req>Correo electrónico</Label>
          <input type="email" value={email} placeholder="correo@ejemplo.com"
            onChange={e => setEmail(e.target.value)} className={iCls(error ? ' ' : '')}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>
        <div>
          <Label req>Contraseña</Label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} value={password} placeholder="Tu contraseña"
              onChange={e => setPassword(e.target.value)} className={iCls(error ? ' ' : '')}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <EyeIcon open={show} />
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

        {forgotSent
          ? <p className="text-xs text-green-600 font-medium">✓ Te enviamos un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.</p>
          : <button onClick={handleForgot} className="text-sm text-[#151515] font-semibold hover:underline">¿Olvidaste tu contraseña?</button>
        }
      </div>

      <div className="p-5 sm:p-6 border-t border-slate-100">
        <button onClick={handleLogin} disabled={loading}
          className="w-full bg-[#151515] text-[#F8F8F5] font-bold py-4 rounded-2xl text-base hover:bg-[#2a2a2a] disabled:opacity-60 transition-all active:scale-95">
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}

// ─── ORQUESTADOR PRINCIPAL ────────────────────────────────────────────────────
interface Props {
  onAuth: () => void
}

export default function ViewOnboardingUsuario({ onAuth }: Props) {
  const [step, setStep] = useState<Step>('welcome')
  const [regData, setRegData] = useState<RegData | null>(null)
  const [docsData, setDocsData] = useState<DocsData | null>(null)
  const [legalLoading, setLegalLoading] = useState(false)

  const handleAcceptLegal = async () => {
    if (!regData) return
    setLegalLoading(true)
    try {
      const domicilioFiscal = regData.requiereFactura
        ? [regData.fiscalCalle, regData.fiscalNumero, regData.fiscalColonia, regData.fiscalMunicipio, regData.fiscalEstado, regData.fiscalCp]
            .filter(Boolean).join(', ').toUpperCase()
        : null

      const perfilUsuario = {
        nombre:           regData.nombre.toUpperCase(),
        apellido:         regData.apellido.toUpperCase(),
        curp:             regData.curp?.toUpperCase() || null,
        email:            regData.email.toLowerCase(),
        telefono:         regData.telefono,
        tipo:             regData.tipo,
        estatus:          'Activo',
        calle:            regData.calle.toUpperCase() || null,
        numero:           regData.numero.toUpperCase() || null,
        colonia:          regData.colonia.toUpperCase() || null,
        municipio:        regData.municipio.toUpperCase() || null,
        estado_geo:       regData.estadoGeo.toUpperCase() || null,
        codigo_postal:    regData.codigoPostal || null,
        razon_social:     regData.requiereFactura ? regData.razonSocial.toUpperCase() : null,
        rfc:              regData.requiereFactura ? regData.rfc.toUpperCase() : null,
        regimen_fiscal:   regData.requiereFactura ? regData.regimenFiscal : null,
        cfdi:             regData.requiereFactura ? regData.cfdi : null,
        domicilio_fiscal: domicilioFiscal,
      }

      const formData = new FormData()
      formData.append('password', regData.password)
      formData.append('perfilUsuario', JSON.stringify(perfilUsuario))
      if (docsData) {
        formData.append('ineTipo', docsData.ineTipo)
        formData.append('ineNumero', docsData.ineNumero)
        formData.append('ineVigencia', docsData.ineVigencia)
        if (docsData.ineFrente) formData.append('ineFrente', docsData.ineFrente.file)
        if (docsData.ineReverso) formData.append('ineReverso', docsData.ineReverso.file)
        if (docsData.domicilio) formData.append('domicilio', docsData.domicilio.file)
      }

      const registro = await fetch('/api/registro-usuario', {
        method: 'POST',
        body: formData,
      })

      if (!registro.ok) {
        const data = await registro.json().catch(() => null) as { error?: string } | null
        throw new Error(data?.error ?? 'No se pudo crear la cuenta.')
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: regData.email,
        password: regData.password,
      })
      if (loginError) throw loginError

      localStorage.setItem('ruum_usuario_onboarding', '1')
      onAuth()
    } catch (e) {
      console.error('Error en registro:', e)
      alert('Ocurrió un error al crear tu cuenta. Intenta de nuevo.')
    } finally {
      setLegalLoading(false)
    }
  }

  switch (step) {
    case 'welcome':
      return <StepWelcome onRegister={() => setStep('register')} onLogin={() => setStep('login')} />
    case 'register':
      return <StepRegister onBack={() => setStep('welcome')} onNext={data => { setRegData(data); setStep('documents') }} />
    case 'documents':
      return <StepDocuments onBack={() => setStep('register')} onNext={data => { setDocsData(data); setStep('legal') }} />
    case 'legal':
      return <StepLegal onBack={() => setStep('documents')} onAccept={handleAcceptLegal} loading={legalLoading} />
    case 'login':
      return <StepLogin onBack={() => setStep('welcome')} onAuth={onAuth} />
  }
}
