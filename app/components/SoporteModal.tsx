'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { crearIncidenciaUsuario } from '@/lib/queries/usuario'
import { TIPOS_INCIDENCIA } from '@/lib/constants/incidencias'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark, faArrowLeft, faTriangleExclamation, faEnvelope, faComments,
  faChevronRight, faSpinner, faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'

const WHATSAPP_SOPORTE = '525669522178' // 52 + 10 dígitos (5669522178)
const CORREO_SOPORTE = 'ruum.ruum.mx@gmail.com'

type Vista = 'menu' | 'incidencia'

function abrirWhatsApp() {
  const texto = encodeURIComponent('Hola, necesito ayuda con mi cuenta de Ruum Ruum.')
  window.open(`https://wa.me/${WHATSAPP_SOPORTE}?text=${texto}`, '_blank', 'noopener,noreferrer')
}

function abrirCorreo() {
  window.location.href = `mailto:${CORREO_SOPORTE}?subject=${encodeURIComponent('Soporte Ruum Ruum')}`
}

export default function SoporteModal({ onClose }: { onClose: () => void }) {
  const { misViajes, viajeSeleccionado } = useApp()
  const [vista, setVista] = useState<Vista>('menu')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-rr-gray200 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            {vista === 'incidencia' && (
              <button onClick={() => setVista('menu')} className="w-8 h-8 flex items-center justify-center rounded-full text-rr-gray500 hover:bg-rr-gray100">
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            )}
            <h2 className="text-base font-bold text-rr-black">
              {vista === 'menu' ? 'Contactar a soporte' : 'Generar incidencia'}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-rr-gray500 hover:bg-rr-gray100">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {vista === 'menu' ? (
          <div className="p-5 space-y-3">
            <button
              onClick={abrirWhatsApp}
              className="w-full bg-white border border-rr-gray200 rounded-rrLg p-4 flex items-center gap-3 hover:bg-rr-gray100 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-rrSm flex items-center justify-center text-lg">
                <FontAwesomeIcon icon={faComments} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-rr-black">WhatsApp</p>
                <p className="text-xs text-rr-gray500">Respuesta más rápida · 56 6952 2178</p>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="text-rr-gray400 text-xs" />
            </button>

            <button
              onClick={() => setVista('incidencia')}
              className="w-full bg-white border border-rr-gray200 rounded-rrLg p-4 flex items-center gap-3 hover:bg-rr-gray100 transition-colors"
            >
              <div className="w-10 h-10 bg-rr-primaryLight text-rr-primary rounded-rrSm flex items-center justify-center text-lg">
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-rr-black">Generar incidencia</p>
                <p className="text-xs text-rr-gray500">Reporta un problema con tu viaje o tu cuenta</p>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="text-rr-gray400 text-xs" />
            </button>

            <button
              onClick={abrirCorreo}
              className="w-full bg-white border border-rr-gray200 rounded-rrLg p-4 flex items-center gap-3 hover:bg-rr-gray100 transition-colors"
            >
              <div className="w-10 h-10 bg-rr-gray100 text-rr-gray700 rounded-rrSm flex items-center justify-center text-lg">
                <FontAwesomeIcon icon={faEnvelope} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-rr-black">Correo electrónico</p>
                <p className="text-xs text-rr-gray500">{CORREO_SOPORTE}</p>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="text-rr-gray400 text-xs" />
            </button>
          </div>
        ) : (
          <FormIncidencia
            misViajes={misViajes}
            viajeSugerido={viajeSeleccionado?.id ?? null}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}

function FormIncidencia({ misViajes, viajeSugerido, onClose }: {
  misViajes: { id: string; folio: string | null; status: string }[]
  viajeSugerido: string | null
  onClose: () => void
}) {
  const [viajeId, setViajeId] = useState(viajeSugerido ?? '')
  const [tipo, setTipo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState('')
  const [exito, setExito] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!tipo) e.tipo = 'Selecciona un tipo'
    if (!descripcion.trim()) e.descripcion = 'Describe lo que ocurrió'
    else if (descripcion.trim().length < 10) e.descripcion = 'Cuéntanos un poco más (mínimo 10 caracteres)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const enviar = async () => {
    if (!validate()) return
    setEnviando(true)
    setErrorGeneral('')
    try {
      await crearIncidenciaUsuario({ viajeId: viajeId || null, tipo, descripcion: descripcion.trim() })
      setExito(true)
    } catch (e) {
      setErrorGeneral(e instanceof Error ? e.message : 'No se pudo registrar la incidencia.')
    }
    setEnviando(false)
  }

  if (exito) {
    return (
      <div className="p-8 text-center">
        <div className="w-14 h-14 bg-rr-successLight text-rr-success rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
          <FontAwesomeIcon icon={faCircleCheck} />
        </div>
        <p className="text-sm font-bold text-rr-black">Incidencia registrada</p>
        <p className="text-xs text-rr-gray500 mt-2">
          Nuestro equipo la revisará y se pondrá en contacto contigo. Si es urgente, también puedes escribirnos por WhatsApp.
        </p>
        <button
          onClick={onClose}
          className="w-full mt-5 bg-rr-secondary text-white font-semibold py-3 rounded-rrMd hover:bg-rr-secondaryLight transition-colors"
        >
          Listo
        </button>
      </div>
    )
  }

  return (
    <div className="p-5 space-y-4">
      <div>
        <label className="block text-xs font-semibold text-rr-gray500 mb-1 uppercase tracking-wide">Viaje relacionado</label>
        <select
          value={viajeId} onChange={e => setViajeId(e.target.value)}
          className="w-full border border-rr-gray200 rounded-rrMd px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rr-primary bg-white"
        >
          <option value="">No relacionado a un viaje específico</option>
          {misViajes.map(v => (
            <option key={v.id} value={v.id}>{v.folio ?? v.id.slice(0, 8)} · {v.status}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-rr-gray500 mb-1 uppercase tracking-wide">
          Tipo de incidencia<span className="text-red-500 ml-0.5">*</span>
        </label>
        <select
          value={tipo} onChange={e => { setTipo(e.target.value); setErrors(er => ({ ...er, tipo: '' })) }}
          className={`w-full border ${errors.tipo ? 'border-red-400 bg-red-50' : 'border-rr-gray200'} rounded-rrMd px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rr-primary bg-white`}
        >
          <option value="">Seleccionar...</option>
          {TIPOS_INCIDENCIA.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {errors.tipo && <p className="text-xs text-red-500 mt-0.5">{errors.tipo}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-rr-gray500 mb-1 uppercase tracking-wide">
          Descripción<span className="text-red-500 ml-0.5">*</span>
        </label>
        <textarea
          rows={4} value={descripcion}
          onChange={e => { setDescripcion(e.target.value); setErrors(er => ({ ...er, descripcion: '' })) }}
          placeholder="Cuéntanos con detalle qué ocurrió..."
          className={`w-full border ${errors.descripcion ? 'border-red-400 bg-red-50' : 'border-rr-gray200'} rounded-rrMd px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rr-primary`}
        />
        {errors.descripcion && <p className="text-xs text-red-500 mt-0.5">{errors.descripcion}</p>}
      </div>

      {errorGeneral && <p className="text-xs text-red-500 font-medium">{errorGeneral}</p>}

      <button
        onClick={enviar} disabled={enviando}
        className="w-full bg-rr-secondary text-white font-semibold py-3 rounded-rrMd hover:bg-rr-secondaryLight disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
      >
        {enviando && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
        {enviando ? 'Registrando...' : 'Registrar incidencia'}
      </button>
    </div>
  )
}
