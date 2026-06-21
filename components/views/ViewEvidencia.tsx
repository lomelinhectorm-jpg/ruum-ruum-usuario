'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { getEvidenciaViaje, getUrlFotoEvidencia } from '@/lib/queries/usuario'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faShieldAlt, faClock, faSearchPlus, faGasPump, faTachometerAlt } from '@fortawesome/free-solid-svg-icons'

const SLOTS = [
  { columna: 'frente',   label: 'Vista frontal' },
  { columna: 'piloto',   label: 'Lado piloto' },
  { columna: 'copiloto', label: 'Lado copiloto' },
  { columna: 'trasera',  label: 'Vista trasera' },
  { columna: 'tablero',  label: 'Tablero' },
] as const

type EvidenciaData = {
  km_inicial: number | null
  km_final: number | null
  combustible_inicial: string | null
  combustible_final: string | null
  danos_iniciales: string | null
  danos_finales: string | null
  created_at: string | null
} & Record<string, unknown>

function SeccionEvidencia({
  titulo, activa, km, combustible, danos, urls,
}: {
  titulo: string
  activa: boolean
  km: number | null
  combustible: string | null
  danos: string | null
  urls: Record<string, string>
}) {
  if (!activa) {
    return (
      <div className="opacity-60">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-slate-400 rounded-full" /> {titulo}
        </h3>
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
          <FontAwesomeIcon icon={faClock} className="text-3xl text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-500">Pendiente</p>
          <p className="text-xs text-slate-400 mt-1">Las fotos estarán disponibles en cuanto el conductor las capture en esta etapa.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full" /> {titulo}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
        {SLOTS.map(s => {
          const url = urls[s.columna]
          return (
            <a key={s.columna} href={url ?? undefined} target="_blank" rel="noreferrer"
              className="aspect-square bg-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 border border-slate-300 relative overflow-hidden group cursor-pointer">
              {url ? (
                <>
                  <img src={url} alt={s.label} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FontAwesomeIcon icon={faSearchPlus} className="text-white text-xl" />
                  </div>
                  <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[10px] font-medium text-center py-0.5 truncate px-1">{s.label}</span>
                </>
              ) : (
                <span className="text-xs font-medium text-center px-1">{s.label}</span>
              )}
            </a>
          )
        })}
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap gap-4">
        {km != null && (
          <p className="text-xs text-slate-600 flex items-center gap-1.5">
            <FontAwesomeIcon icon={faTachometerAlt} className="text-slate-400" /> {km.toLocaleString('es-MX')} km
          </p>
        )}
        {combustible && (
          <p className="text-xs text-slate-600 flex items-center gap-1.5">
            <FontAwesomeIcon icon={faGasPump} className="text-slate-400" /> Combustible: {combustible}
          </p>
        )}
      </div>
      {danos && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2">
          <p className="text-xs text-slate-500 font-semibold mb-1">Observaciones del conductor:</p>
          <p className="text-sm text-slate-700">&quot;{danos}&quot;</p>
        </div>
      )}
    </div>
  )
}

export default function ViewEvidencia() {
  const { showView, viajeSeleccionado } = useApp()
  const [evidencia, setEvidencia] = useState<EvidenciaData | null>(null)
  const [urlsInicial, setUrlsInicial] = useState<Record<string, string>>({})
  const [urlsFinal, setUrlsFinal] = useState<Record<string, string>>({})
  const [viajeCargadoId, setViajeCargadoId] = useState<string | null>(null)
  const viaje = viajeSeleccionado
  const viajeId = viaje?.id ?? null
  const cargando = viajeId !== null && viajeCargadoId !== viajeId

  useEffect(() => {
    if (!viajeId) return
    let activo = true
    const cargar = async () => {
      try {
        const data = await getEvidenciaViaje(viajeId) as EvidenciaData | null
        if (!activo) return
        setEvidencia(data)
        if (data) {
          const pares: { columna: string; path: string; tipo: 'inicial' | 'final' }[] = []
          SLOTS.forEach(s => {
            const pathI = data[`foto_${s.columna}_i`] as string | null
            const pathF = data[`foto_${s.columna}_f`] as string | null
            if (pathI) pares.push({ columna: s.columna, path: pathI, tipo: 'inicial' })
            if (pathF) pares.push({ columna: s.columna, path: pathF, tipo: 'final' })
          })
          const resultados = await Promise.all(pares.map(p => getUrlFotoEvidencia(p.path).catch(() => null)))
          const nuevasInicial: Record<string, string> = {}
          const nuevasFinal: Record<string, string> = {}
          resultados.forEach((url, i) => {
            if (!url) return
            const p = pares[i]
            if (p.tipo === 'inicial') nuevasInicial[p.columna] = url
            else nuevasFinal[p.columna] = url
          })
          if (!activo) return
          setUrlsInicial(nuevasInicial)
          setUrlsFinal(nuevasFinal)
        } else {
          setUrlsInicial({})
          setUrlsFinal({})
        }
      } catch (e) {
        console.error('Error cargando evidencia:', e)
        if (activo) setEvidencia(null)
      } finally {
        if (activo) setViajeCargadoId(viajeId)
      }
    }
    void cargar()
    return () => { activo = false }
  }, [viajeId])

  if (!viaje) {
    return (
      <div className="fade-in p-5 pb-24 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-slate-400 text-sm">No hay viaje seleccionado.</p>
        <button onClick={() => showView('view-mis-viajes')} className="mt-4 text-blue-600 text-sm font-medium">
          ← Ver mis viajes
        </button>
      </div>
    )
  }

  return (
    <div className="fade-in p-5 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => showView('view-detalle-viaje')} className="text-slate-500 hover:text-slate-800">
          <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">Evidencia de tu auto</h2>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex gap-3">
        <FontAwesomeIcon icon={faShieldAlt} className="text-green-600 text-xl mt-1" />
        <div>
          <p className="text-sm font-bold text-green-800">Tranquilidad documentada</p>
          <p className="text-xs text-green-700 mt-1">Cada etapa del traslado queda registrada visualmente para tu total seguridad.</p>
        </div>
      </div>

      {cargando ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-32 animate-pulse bg-slate-100 rounded-xl" />)}
        </div>
      ) : (
        <>
          <SeccionEvidencia
            titulo="Evidencia inicial"
            activa={evidencia?.km_inicial != null}
            km={evidencia?.km_inicial ?? null}
            combustible={evidencia?.combustible_inicial ?? null}
            danos={evidencia?.danos_iniciales ?? null}
            urls={urlsInicial}
          />
          <SeccionEvidencia
            titulo="Evidencia final"
            activa={evidencia?.km_final != null}
            km={evidencia?.km_final ?? null}
            combustible={evidencia?.combustible_final ?? null}
            danos={evidencia?.danos_finales ?? null}
            urls={urlsFinal}
          />
        </>
      )}
    </div>
  )
}
