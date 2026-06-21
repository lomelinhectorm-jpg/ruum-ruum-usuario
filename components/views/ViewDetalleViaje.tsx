'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { cancelarViajeUsuario } from '@/lib/queries/usuario'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faSatelliteDish, faStar, faHeadset, faCheckCircle, faClock, faCircle, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import SoporteModal from '@/components/SoporteModal'

// Mapa de eventos del timeline por status
const TIMELINE_STEPS = [
  { key: 'Solicitud recibida',           label: 'Solicitud confirmada' },
  { key: 'Pendiente de asignación',      label: 'Pendiente de asignación' },
  { key: 'Conductor asignado',           label: 'Conductor asignado' },
  { key: 'Conductor en camino',          label: 'Conductor en origen' },
  { key: 'Evidencia inicial pendiente',  label: 'Evidencia inicial pendiente' },
  { key: 'Traslado en curso',            label: 'Traslado en curso' },
  { key: 'Entrega en proceso',           label: 'Llegada a destino' },
  { key: 'Evidencia final pendiente',    label: 'Evidencia final pendiente' },
  { key: 'Finalizado',                   label: 'Viaje finalizado' },
]

const STATUS_ORDER = TIMELINE_STEPS.map(s => s.key)

const statusColor: Record<string, string> = {
  'Solicitud recibida':         'bg-slate-100 text-slate-600',
  'Pendiente de asignación':    'bg-amber-100 text-amber-700',
  'Conductor asignado':         'bg-blue-100 text-blue-700',
  'Conductor en camino':        'bg-blue-100 text-blue-700',
  'Traslado en curso':          'bg-purple-100 text-purple-700',
  'Finalizado':                 'bg-green-100 text-green-700',
  'Cancelado':                  'bg-red-100 text-red-600',
  'En revisión por incidencia': 'bg-rose-100 text-rose-700',
}

export default function ViewDetalleViaje() {
  const { showView, viajeSeleccionado, setViajeSeleccionado, recargarViajes, usuario } = useApp()
  const [cancelando, setCancelando] = useState(false)
  const [errorCancelacion, setErrorCancelacion] = useState('')
  const [mostrarDetalleConductor, setMostrarDetalleConductor] = useState(false)
  const [mostrarSoporte, setMostrarSoporte] = useState(false)
  const viaje = viajeSeleccionado

  if (!viaje) {
    return (
      <div className="fade-in p-5 pb-24 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-slate-400 text-sm">No hay viaje seleccionado.</p>
        <button
          onClick={() => showView('view-mis-viajes')}
          className="mt-4 text-blue-600 text-sm font-medium"
        >
          ← Ver mis viajes
        </button>
      </div>
    )
  }

  // Determinar el índice actual en el timeline
  const currentIdx = STATUS_ORDER.indexOf(viaje.status)
  const esFinalizado = viaje.status === 'Finalizado'
  const esCancelado = viaje.status === 'Cancelado'
  const puedeCancelar = ['Solicitud recibida', 'Pendiente de asignación', 'Conductor asignado'].includes(viaje.status)
  const tienePenalizacion = viaje.status === 'Conductor asignado'
  const penalizacionEstimada = tienePenalizacion ? Number(viaje.tarifa_cliente ?? 0) * 0.10 : 0

  const cancelar = async () => {
    if (!usuario || !puedeCancelar) return
    const detalle = tienePenalizacion
      ? `Se aplicará una penalización de $${penalizacionEstimada.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN (10% de la tarifa).`
      : 'Esta cancelación no genera penalización.'
    if (!window.confirm(`¿Confirmas que deseas cancelar el viaje?\n\n${detalle}`)) return

    setCancelando(true)
    setErrorCancelacion('')
    try {
      await cancelarViajeUsuario(viaje.id)
      setViajeSeleccionado({ ...viaje, status: 'Cancelado' })
      await recargarViajes()
    } catch (e) {
      console.error('Error cancelando viaje:', e)
      setErrorCancelacion('No se pudo cancelar. El viaje pudo haber avanzado; actualiza e intenta de nuevo o contacta a soporte.')
    } finally {
      setCancelando(false)
    }
  }

  const conductor = viaje.conductores
  const vehiculo = viaje.vehiculos
  const fotoConductor = conductor?.foto_url?.startsWith('http')
    ? conductor.foto_url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(`${conductor?.nombre ?? ''} ${conductor?.apellido ?? ''}`)}&background=0D8ABC&color=fff&size=256`
  const certificacionActiva = conductor?.certificacion === 'Activo'

  return (
    <div className="fade-in pb-24">
      {conductor && mostrarDetalleConductor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center sm:p-4" onClick={() => setMostrarDetalleConductor(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Conductor asignado</p>
                <h3 className="text-lg font-bold text-slate-900">Detalle operativo</h3>
              </div>
              <button onClick={() => setMostrarDetalleConductor(false)} className="w-9 h-9 rounded-full bg-slate-100 text-slate-500">✕</button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4 mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fotoConductor} alt={`${conductor.nombre} ${conductor.apellido}`} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow" />
                <div className="min-w-0">
                  <p className="text-lg font-bold text-slate-900">{conductor.nombre} {conductor.apellido}</p>
                  <span className={`inline-flex mt-1 px-2 py-1 rounded-full text-[10px] font-bold ${certificacionActiva ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {conductor.certificacion ?? 'Pendiente de validación'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400">Calificación</p>
                  <p className="font-bold text-slate-800"><FontAwesomeIcon icon={faStar} className="text-amber-400 mr-1" />{Number(conductor.calificacion ?? 0).toFixed(1)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400">Viajes realizados</p>
                  <p className="font-bold text-slate-800">{conductor.viajes_realizados ?? 0}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400">Disponibilidad</p>
                  <p className="font-bold text-slate-800">{conductor.disponibilidad ?? '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400">Zona</p>
                  <p className="font-bold text-slate-800 truncate">{[conductor.municipio, conductor.estado_geo].filter(Boolean).join(', ') || '—'}</p>
                </div>
              </div>
              {conductor.telefono && (
                <a href={`tel:${conductor.telefono}`} className="block w-full bg-slate-900 text-white text-center font-semibold py-3 rounded-xl">
                  Llamar al conductor · {conductor.telefono}
                </a>
              )}
              <p className="text-[10px] text-slate-400 text-center mt-3">ID operativo: {conductor.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>
      )}
      {/* Header — mapa simulado */}
      <div className="bg-slate-200 h-44 md:h-56 relative flex items-center justify-center">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Línea de ruta simulada */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 176" preserveAspectRatio="none">
          <path d="M 60 140 Q 200 80 340 40" stroke="#3b82f6" strokeWidth="3" fill="none" strokeDasharray="8 4" opacity="0.6" />
          <circle cx="60" cy="140" r="8" fill="#22c55e" />
          <circle cx="340" cy="40" r="8" fill="#ef4444" />
        </svg>
        <button
          onClick={() => showView('view-mis-viajes')}
          className="absolute top-6 left-5 md:left-8 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 z-10"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        {!esFinalizado && !esCancelado && (
          <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm text-sm font-semibold text-slate-800 z-10">
            <FontAwesomeIcon icon={faSatelliteDish} className="text-blue-600 mr-2 animate-pulse" />
            Rastreo en tiempo real
          </div>
        )}
        {esFinalizado && (
          <div className="bg-green-600/90 backdrop-blur px-4 py-2 rounded-full shadow-sm text-sm font-semibold text-white z-10">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
            Viaje completado
          </div>
        )}
      </div>

      <div className="p-5 md:px-8 -mt-6 relative z-10">
        {/* Tarjeta de estatus */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-4 mb-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor[viaje.status] ?? 'bg-slate-100 text-slate-600'}`}>
              {viaje.status.toUpperCase()}
            </span>
            <span className="text-xs text-slate-400">{viaje.folio ?? '—'}</span>
          </div>
          <div className="flex gap-3 mt-3">
            <div className="flex flex-col items-center pt-1">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <div className="w-0.5 h-6 bg-slate-200 my-1" />
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500">Origen</p>
              <p className="text-sm font-semibold text-slate-800 leading-tight truncate">
                {[viaje.origen_calle, viaje.origen_colonia].filter(Boolean).join(', ')}
              </p>
              <p className="text-xs text-slate-500 mt-2">Destino</p>
              <p className="text-sm font-semibold text-slate-800 leading-tight truncate">
                {[viaje.destino_calle, viaje.destino_colonia].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
          {(viaje.fecha_programada || viaje.hora_programada) && (
            <div className="border-t border-slate-100 mt-3 pt-3 flex items-center gap-2 text-slate-500">
              <FontAwesomeIcon icon={faClock} className="text-xs" />
              <span className="text-xs">
                {viaje.fecha_programada ?? ''} {viaje.hora_programada ? `· ${viaje.hora_programada.slice(0, 5)}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Conductor */}
        {conductor ? (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Tu conductor asignado</h4>
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fotoConductor}
                className="w-14 h-14 rounded-full border-2 border-white shadow-sm"
                alt={`${conductor.nombre} ${conductor.apellido}`}
              />
            <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-slate-800">{conductor.nombre} {conductor.apellido}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${certificacionActiva ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{conductor.certificacion ?? 'Pendiente de validación'}</span>
                  <span className="text-xs text-slate-500">
                    <FontAwesomeIcon icon={faStar} className="text-amber-400" /> {conductor.calificacion}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => setMostrarDetalleConductor(true)} className="w-full mt-3 pt-3 border-t border-slate-100 text-sm font-semibold text-blue-600 flex items-center justify-between">
              Ver detalle del conductor
              <FontAwesomeIcon icon={faChevronRight} className="text-slate-400" />
            </button>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold text-amber-800">⏳ Asignando conductor</p>
            <p className="text-xs text-amber-600 mt-1">Nuestro equipo está seleccionando al conductor más adecuado para tu traslado.</p>
          </div>
        )}

        {/* Vehículo */}
        {vehiculo && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Vehículo</h4>
            <p className="text-sm font-semibold text-slate-800">
              {vehiculo.marca} {vehiculo.modelo}
            </p>
            <p className="text-xs text-slate-500 mt-1">Placas: <span className="font-mono font-bold">{vehiculo.placas}</span></p>
          </div>
        )}

        {/* Evidencia fotográfica */}
        {(Boolean(viaje.evidencias?.length) || currentIdx >= STATUS_ORDER.indexOf('Evidencia inicial pendiente')) && (
          <button onClick={() => showView('view-evidencia')}
            className="w-full bg-white border border-slate-200 rounded-xl p-4 mb-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800">Ver evidencia del traslado</p>
              <p className="text-xs text-slate-500 mt-0.5">Fotos del estado del vehículo, kilometraje y combustible</p>
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="text-slate-400" />
          </button>
        )}

        {/* Timeline del viaje */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Progreso del viaje</h4>
          {esCancelado ? (
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <p className="text-sm font-semibold">Viaje cancelado</p>
            </div>
          ) : (
            <div className="relative pl-4 space-y-5">
              <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-200" />
              {TIMELINE_STEPS.map((step, i) => {
                const done = currentIdx >= i
                const active = currentIdx === i
                return (
                  <div key={step.key} className={`relative flex gap-4 ${!done ? 'opacity-40' : ''}`}>
                    <div
                      className={`w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 mt-0.5 shrink-0 ${
                        done && !active ? 'bg-green-500'
                        : active ? 'bg-rr-primary ring-4 ring-rr-primaryLight animate-pulse'
                        : 'bg-slate-300'
                      }`}
                    />
                    <p className={`text-sm ${active ? 'font-bold text-blue-700' : done ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                      {step.label}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Cancelación */}
        {puedeCancelar && (
          <div className="bg-white rounded-xl border border-red-100 p-4 mb-4">
            <p className="text-sm font-semibold text-slate-800">¿Necesitas cancelar?</p>
            <p className={`text-xs mt-1 ${tienePenalizacion ? 'text-amber-700' : 'text-slate-500'}`}>
              {tienePenalizacion
                ? `El conductor ya fue asignado. Se aplicará una penalización del 10% ($${penalizacionEstimada.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN).`
                : 'Puedes cancelar sin penalización antes de que se asigne un conductor.'}
            </p>
            {errorCancelacion && <p className="text-xs text-red-600 mt-2">{errorCancelacion}</p>}
            <button onClick={cancelar} disabled={cancelando}
              className="w-full mt-3 border border-red-300 text-red-600 font-semibold py-2.5 rounded-xl hover:bg-red-50 disabled:opacity-60 transition-colors">
              {cancelando ? 'Cancelando...' : 'Cancelar viaje'}
            </button>
          </div>
        )}
        {!esFinalizado && !esCancelado && !puedeCancelar && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-amber-800">Cancelación desde soporte</p>
            <p className="text-xs text-amber-700 mt-1">El conductor ya inició la operación. Contacta a soporte para revisar tu caso.</p>
          </div>
        )}

        {/* Soporte */}
        <button onClick={() => setMostrarSoporte(true)}
          className="w-full bg-white border border-slate-300 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
          <FontAwesomeIcon icon={faHeadset} /> Contactar a soporte
        </button>
      </div>

      {mostrarSoporte && <SoporteModal onClose={() => setMostrarSoporte(false)} />}
    </div>
  )
}
