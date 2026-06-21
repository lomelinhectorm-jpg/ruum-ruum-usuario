'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlusCircle, faCamera, faHeadset, faShieldAlt, faChevronDown, faChevronUp,
  faSpinner, faPhone, faCar,
} from '@fortawesome/free-solid-svg-icons'
import { RRBadge, RRButton, RRCard } from '@/components/rr'
import SoporteModal from '@/components/SoporteModal'

export default function ViewInicio() {
  const { showView, misViajes, cargandoViajes, usuario, setViajeSeleccionado } = useApp()
  const [mostrarConductor, setMostrarConductor] = useState(false)
  const [mostrarSoporte, setMostrarSoporte] = useState(false)

  // Viaje activo = el más reciente que no esté finalizado ni cancelado
  const viajeActivo = misViajes.find(v =>
    !['Finalizado', 'Cancelado'].includes(v.status)
  )

  return (
    <div className="fade-in p-5 pb-24">
      {/* Saludo */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-rr-black">
          {usuario ? `Hola, ${usuario.nombre}.` : 'Mueve tu auto sin soltar el control.'}
        </h2>
        <p className="text-sm text-rr-gray500 mt-1">Tecnología para mover vehículos con confianza.</p>
      </div>

      {/* Botón Principal */}
      <RRButton
        onClick={() => showView('view-solicitar')}
        fullWidth
        className="mb-6"
      >
        <FontAwesomeIcon icon={faPlusCircle} className="text-xl" />
        Solicitar traslado
      </RRButton>

      {/* Viaje Activo */}
      {cargandoViajes ? (
        <RRCard className="mb-6 flex items-center justify-center gap-2 p-6 text-rr-gray500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          <span className="text-sm">Cargando tus viajes...</span>
        </RRCard>
      ) : viajeActivo ? (
        <RRCard
          className="mb-6 cursor-pointer border-rr-primaryLight p-4"
          onClick={() => { setViajeSeleccionado(viajeActivo); showView('view-detalle-viaje') }}
        >
          <h3 className="text-base font-bold text-rr-black mb-3">Traslado en curso</h3>
          <div className="flex justify-between items-start mb-3">
            <RRBadge variant="process" pulse>
              {viajeActivo.status.toUpperCase()}
            </RRBadge>
            <span className="text-xs text-rr-gray500">{viajeActivo.folio}</span>
          </div>
          <div className="flex gap-3 mb-3">
            <div className="flex flex-col items-center pt-1">
              <div className="w-2.5 h-2.5 rounded-full bg-rr-success" />
              <div className="w-0.5 h-6 bg-rr-gray200 my-1" />
              <div className="w-2.5 h-2.5 rounded-full bg-rr-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-rr-gray500">Origen</p>
              <p className="text-sm font-bold text-rr-black leading-tight">
                {[viajeActivo.origen_calle, viajeActivo.origen_colonia].filter(Boolean).join(', ')}
              </p>
              <p className="text-xs text-rr-gray500 mt-2">Destino</p>
              <p className="text-sm font-bold text-rr-black leading-tight">
                {[viajeActivo.destino_calle, viajeActivo.destino_colonia].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
          {viajeActivo.conductores ? (
            <div className="border-t border-rr-gray200 pt-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMostrarConductor(m => !m) }}
                className="w-full flex items-center gap-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://ui-avatars.com/api/?name=${viajeActivo.conductores.nombre}+${viajeActivo.conductores.apellido}&background=0D8ABC&color=fff`}
                  className="w-8 h-8 rounded-full flex-shrink-0" alt="Conductor"
                />
                <span className="flex-1 text-left text-sm font-semibold text-rr-black">
                  Conoce a tu conductor
                </span>
                <FontAwesomeIcon icon={mostrarConductor ? faChevronUp : faChevronDown} className="text-rr-gray400 text-xs" />
              </button>

              {mostrarConductor && (
                <div
                  className="mt-3 bg-rr-gray100 rounded-rrSm p-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://ui-avatars.com/api/?name=${viajeActivo.conductores.nombre}+${viajeActivo.conductores.apellido}&background=0D8ABC&color=fff&size=64`}
                      className="w-12 h-12 rounded-full" alt="Conductor"
                    />
                    <div>
                      <p className="text-sm font-bold text-rr-black">
                        {viajeActivo.conductores.nombre} {viajeActivo.conductores.apellido}
                      </p>
                      <span className="text-[10px] bg-rr-successLight text-rr-success px-1.5 py-0.5 rounded">
                        ★ {viajeActivo.conductores.calificacion}
                      </span>
                      {viajeActivo.conductores.certificacion === 'Activo' && (
                        <span className="text-[10px] bg-rr-primaryLight text-rr-primary px-1.5 py-0.5 rounded ml-1">
                          <FontAwesomeIcon icon={faShieldAlt} className="mr-0.5" />
                          Certificado
                        </span>
                      )}
                    </div>
                  </div>
                  {viajeActivo.vehiculos && (
                    <p className="text-xs text-rr-gray700 mb-1.5 flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faCar} className="text-rr-gray500" />
                      {viajeActivo.vehiculos.marca} {viajeActivo.vehiculos.modelo} · {viajeActivo.vehiculos.placas}
                    </p>
                  )}
                  {viajeActivo.conductores.telefono && (
                    <a
                      href={`tel:${viajeActivo.conductores.telefono}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-semibold text-rr-primary inline-flex items-center gap-1.5"
                    >
                      <FontAwesomeIcon icon={faPhone} />
                      {viajeActivo.conductores.telefono}
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="border-t border-rr-gray200 pt-3">
              <p className="text-xs text-rr-warning font-medium">
                ⏳ Asignando conductor certificado...
              </p>
            </div>
          )}
        </RRCard>
      ) : misViajes.length > 0 ? null : (
        <RRCard elevated={false} className="mb-6 bg-rr-gray100 p-4 text-center">
          <p className="text-sm text-rr-gray500">Aún no tienes viajes activos.</p>
          <p className="text-xs text-rr-gray500 mt-1">¡Solicita tu primer traslado!</p>
        </RRCard>
      )}

      {/* Accesos Rápidos */}
      <h3 className="text-sm font-bold text-rr-gray700 mb-3">Accesos rápidos</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => showView('view-evidencia')}
          className="bg-white border border-rr-gray200 p-4 rounded-rrLg shadow-rrCard flex flex-col items-center gap-2 hover:bg-rr-primaryLight transition-colors"
        >
          <div className="w-10 h-10 bg-rr-primaryLight text-rr-primary rounded-rrSm flex items-center justify-center">
            <FontAwesomeIcon icon={faCamera} />
          </div>
          <span className="text-sm font-medium text-rr-gray700">Ver evidencias</span>
        </button>
        <button
          onClick={() => setMostrarSoporte(true)}
          className="bg-white border border-rr-gray200 p-4 rounded-rrLg shadow-rrCard flex flex-col items-center gap-2 hover:bg-rr-primaryLight transition-colors"
        >
          <div className="w-10 h-10 bg-rr-primaryLight text-rr-primary rounded-rrSm flex items-center justify-center">
            <FontAwesomeIcon icon={faHeadset} />
          </div>
          <span className="text-sm font-medium text-rr-gray700">Contactar a soporte</span>
        </button>
      </div>

      {/* Mensaje de Confianza */}
      <div className="bg-rr-primaryLight border border-rr-gray200 rounded-rrLg p-4 flex gap-3 shadow-rrCard">
        <FontAwesomeIcon icon={faShieldAlt} className="text-rr-primary mt-1" />
        <div>
          <p className="text-sm font-semibold text-rr-secondary">Tu vehículo está protegido</p>
          <p className="text-xs text-rr-gray700 mt-1">
            Todos nuestros conductores pasan por un riguroso proceso de certificación y cada etapa queda documentada.
          </p>
        </div>
      </div>

      {mostrarSoporte && <SoporteModal onClose={() => setMostrarSoporte(false)} />}
    </div>
  )
}