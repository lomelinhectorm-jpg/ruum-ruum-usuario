'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faCheckCircle, faSpinner, faPlus } from '@fortawesome/free-solid-svg-icons'

type Tab = 'Activos' | 'Programados' | 'Finalizados'

const ACTIVOS = ['Solicitud recibida','Pendiente de asignación','Conductor asignado','Conductor en camino','Recolección en proceso','Evidencia inicial pendiente','Traslado en curso','Entrega en proceso','Evidencia final pendiente','En revisión por incidencia']
const PROGRAMADOS = ['Conductor asignado']
const FINALIZADOS = ['Finalizado','Cancelado']

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

export default function ViewMisViajes() {
  const { showView, misViajes, cargandoViajes, setViajeSeleccionado } = useApp()
  const [activeTab, setActiveTab] = useState<Tab>('Activos')
  const tabs: Tab[] = ['Activos', 'Programados', 'Finalizados']

  const filtrados = misViajes.filter(v => {
    if (activeTab === 'Activos') return ACTIVOS.includes(v.status)
    if (activeTab === 'Programados') return PROGRAMADOS.includes(v.status)
    return FINALIZADOS.includes(v.status)
  })

  return (
    <div className="fade-in p-5 pb-24">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Mis viajes</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab}
            {misViajes.filter(v =>
              tab === 'Activos' ? ACTIVOS.includes(v.status) :
              tab === 'Programados' ? PROGRAMADOS.includes(v.status) :
              FINALIZADOS.includes(v.status)
            ).length > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-white/20' : 'bg-slate-100'}`}>
                {misViajes.filter(v =>
                  tab === 'Activos' ? ACTIVOS.includes(v.status) :
                  tab === 'Programados' ? PROGRAMADOS.includes(v.status) :
                  FINALIZADOS.includes(v.status)
                ).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {cargandoViajes && (
        <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          <span className="text-sm">Cargando viajes...</span>
        </div>
      )}

      {/* Empty state */}
      {!cargandoViajes && filtrados.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm mb-4">
            {activeTab === 'Activos' ? 'No tienes viajes activos en este momento.' :
             activeTab === 'Programados' ? 'No tienes viajes programados.' :
             'No tienes viajes finalizados aún.'}
          </p>
          <button
            onClick={() => showView('view-solicitar')}
            className="bg-rr-primary text-rr-secondary text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2 mx-auto"
          >
            <FontAwesomeIcon icon={faPlus} />
            Solicitar traslado
          </button>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-4">
        {filtrados.map((viaje) => (
          <div
            key={viaje.id}
            className={`bg-white border rounded-xl p-4 shadow-sm cursor-pointer ${
              ACTIVOS.includes(viaje.status) && viaje.status !== 'Solicitud recibida'
                ? 'border-blue-100'
                : 'border-slate-200'
            }`}
            onClick={() => { setViajeSeleccionado(viaje); showView('view-detalle-viaje') }}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start mb-3">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor[viaje.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {viaje.status.toUpperCase()}
              </span>
              <span className="text-xs text-slate-400">{viaje.folio}</span>
            </div>
            <div className="flex gap-3 mb-3">
              <div className="flex flex-col items-center pt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <div className="w-0.5 h-6 bg-slate-200 my-1" />
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {[viaje.origen_calle, viaje.origen_colonia].filter(Boolean).join(', ')}
                </p>
                <p className="text-xs text-slate-400 mt-1 truncate">
                  → {[viaje.destino_calle, viaje.destino_colonia].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              {viaje.conductores ? (
                <div className="flex min-w-0 items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://ui-avatars.com/api/?name=${viaje.conductores.nombre}&background=0D8ABC&color=fff`}
                    className="w-6 h-6 rounded-full" alt="Conductor"
                  />
                  <span className="truncate text-xs font-medium text-slate-600">
                    {viaje.conductores.nombre} {viaje.conductores.apellido}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-amber-600 font-medium">⏳ Asignando conductor...</span>
              )}
              <span className="text-xs font-bold text-blue-600 flex items-center gap-1 sm:justify-end">
                Ver detalle <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
