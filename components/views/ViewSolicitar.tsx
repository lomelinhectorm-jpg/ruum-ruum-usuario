'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faSpinner, faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import type { StepId } from '@/lib/types'
import { RRButton, RRCard } from '@/components/rr'
import { TRANSMISIONES } from '@/lib/constants/vehiculo'
//import { getCatalogoTiposVehiculo } from '@/lib/queries/usuario'//
import { getCatalogoTiposVehiculo, getCatalogoTiposServicio } from '../../lib/queries/usuario';    // relativa (ajusta según la ubicación real de ViewSolicitar)




function StepIndicator({ step, currentStep }: { step: number; currentStep: number }) {
  const active = step <= currentStep
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
        active ? 'bg-rr-primary text-rr-secondary' : 'bg-rr-gray200 text-rr-gray500'
      }`}>
        {step}
      </div>
      <span className={`text-[10px] font-medium ${active ? 'text-rr-primary' : 'text-rr-gray500'}`}>
        {step === 1 ? 'Vehículo' : step === 2 ? 'Ruta' : 'Confirmar'}
      </span>
    </div>
  )
}

const inputCls = 'w-full border border-rr-gray200 rounded-rrMd bg-white px-4 py-3 text-sm text-rr-black focus:outline-none focus:ring-2 focus:ring-rr-primary/20 focus:border-rr-primary'
const labelCls = 'block text-xs font-bold uppercase tracking-wide text-rr-gray500 mb-1'

export default function ViewSolicitar() {
  const { showView, currentStep, setStep, solicitarViaje } = useApp()
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const [tiposVehiculo, setTiposVehiculo] = useState<{ id: string; nombre: string }[]>([])
  const [tiposServicio, setTiposServicio] = useState<{ id: string; nombre: string; descripcion: string }[]>([])

  useEffect(() => {
    let activo = true
    getCatalogoTiposVehiculo()
      .then(data => { if (activo) setTiposVehiculo(data) })
      .catch(e => console.error('Error cargando tipos de vehículo:', e))
    // Catálogo de tipos de servicio (Configuración → Tipos de servicio en
    // Torre). Si no hay ninguno activo configurado, el selector simplemente
    // no se muestra — no bloqueamos la solicitud por esto.
    getCatalogoTiposServicio()
      .then(data => { if (activo) setTiposServicio(data) })
      .catch(e => console.error('Error cargando tipos de servicio:', e))
    return () => { activo = false }
  }, [])

  // Datos del formulario
  const [form, setForm] = useState({
    // Vehículo
    marca: '', modelo: '', anio: '', color: '', placas: '', vin: '', transmision: '', alias: '',
    tipoVehiculo: '',
    tipoServicioId: '',
    // Ruta
    origen_calle: '', origen_numero: '', origen_colonia: '', origen_municipio: '', origen_estado: '', origen_cp: '',
    origen_contacto: '', origen_telefono: '',
    destino_calle: '', destino_numero: '', destino_colonia: '', destino_municipio: '', destino_estado: '', destino_cp: '',
    destino_contacto: '', destino_telefono: '',
    referencias: '', instrucciones: '',
    fecha_programada: '', hora_programada: '', kmEstimado: '',
  })

  const set = (k: keyof typeof form, v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  const nextStep = (step: StepId) => setStep(step)

  const confirmar = async () => {
    setEnviando(true)
    const ok = await solicitarViaje({
      ...form,
      kmEstimado: form.kmEstimado ? Number(form.kmEstimado) : undefined,
    })
    setEnviando(false)
    if (ok) {
      setExito(true)
      setTimeout(() => {
        setExito(false)
        setStep(1)
        showView('view-mis-viajes')
      }, 2500)
    }
  }

  if (exito) {
    return (
      <div className="fade-in p-5 pb-24 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-rr-successLight rounded-full flex items-center justify-center mb-4">
          <FontAwesomeIcon icon={faCheckCircle} className="text-rr-success text-4xl" />
        </div>
        <h3 className="text-xl font-black text-rr-black mb-2">¡Solicitud enviada!</h3>
        <p className="text-sm text-rr-gray500">
          Hemos recibido tu solicitud. Nuestro equipo está asignando al mejor conductor certificado para ti.
        </p>
      </div>
    )
  }

  return (
    <div className="fade-in p-5 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => showView('view-inicio')} className="text-rr-gray500 hover:text-rr-black">
          <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
        </button>
        <h2 className="text-xl font-black text-rr-black">Solicitar traslado</h2>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-6 px-2">
        <StepIndicator step={1} currentStep={currentStep} />
        <div className="flex-1 h-0.5 bg-rr-gray200 mx-2" />
        <StepIndicator step={2} currentStep={currentStep} />
        <div className="flex-1 h-0.5 bg-rr-gray200 mx-2" />
        <StepIndicator step={3} currentStep={currentStep} />
      </div>

      {/* PASO 1 — Vehículo */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-rr-black">¿Qué vehículo vamos a mover?</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Marca *</label>
                <input type="text" value={form.marca}
                  onChange={e => set('marca', e.target.value.toUpperCase())}
                  placeholder="TOYOTA" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Modelo *</label>
                <input type="text" value={form.modelo}
                  onChange={e => set('modelo', e.target.value.toUpperCase())}
                  placeholder="HILUX" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Año</label>
                <input type="text" value={form.anio}
                  onChange={e => set('anio', e.target.value)}
                  placeholder="2022" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Color</label>
                <input type="text" value={form.color}
                  onChange={e => set('color', e.target.value.toUpperCase())}
                  placeholder="BLANCO" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Placas *</label>
              <input type="text" value={form.placas}
                onChange={e => set('placas', e.target.value.toUpperCase())}
                placeholder="XYZ-987" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tipo de vehículo *</label>
                <select value={form.tipoVehiculo} onChange={e => set('tipoVehiculo', e.target.value)}
                  className={`${inputCls} bg-white`}>
                  <option value="">Seleccionar...</option>
                  {tiposVehiculo.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Transmisión</label>
                <select value={form.transmision} onChange={e => set('transmision', e.target.value)}
                  className={`${inputCls} bg-white`}>
                  <option value="">Seleccionar...</option>
                  {TRANSMISIONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {tiposServicio.length > 0 && (
              <div>
                <label className={labelCls}>Tipo de servicio</label>
                <select value={form.tipoServicioId} onChange={e => set('tipoServicioId', e.target.value)}
                  className={`${inputCls} bg-white`}>
                  <option value="">Sin preferencia</option>
                  {tiposServicio.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className={labelCls}>VIN</label>
              <input type="text" value={form.vin}
                onChange={e => set('vin', e.target.value.toUpperCase())}
                placeholder="17 CARACTERES" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Alias / Apodo</label>
              <input type="text" value={form.alias}
                onChange={e => set('alias', e.target.value.toUpperCase())}
                placeholder="EJ. CAMIONETA GRIS 1" className={inputCls} />
            </div>
          </div>
          <RRButton
            onClick={() => nextStep(2)}
            disabled={!form.marca || !form.modelo || !form.placas || !form.tipoVehiculo}
            fullWidth
            className="mt-4"
          >
            Siguiente → Ruta
          </RRButton>
        </div>
      )}

      {/* PASO 2 — Ruta */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-rr-black">¿De dónde a dónde?</h3>

          <RRCard elevated={false} className="bg-rr-successLight/60 border-rr-successLight p-4 space-y-3">
            <p className="text-xs font-bold text-rr-success uppercase tracking-wide">📍 Origen</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Calle *</label>
                <input type="text" value={form.origen_calle}
                  onChange={e => set('origen_calle', e.target.value.toUpperCase())}
                  placeholder="AV. REFORMA" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Número</label>
                <input type="text" value={form.origen_numero}
                  onChange={e => set('origen_numero', e.target.value.toUpperCase())}
                  placeholder="222" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Colonia</label>
                <input type="text" value={form.origen_colonia}
                  onChange={e => set('origen_colonia', e.target.value.toUpperCase())}
                  placeholder="CUAUHTÉMOC" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>CP</label>
                <input type="text" value={form.origen_cp}
                  onChange={e => set('origen_cp', e.target.value.replace(/\D/g,'').slice(0,5))}
                  placeholder="06600" maxLength={5} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Municipio / Alcaldía</label>
                <input type="text" value={form.origen_municipio}
                  onChange={e => set('origen_municipio', e.target.value.toUpperCase())}
                  placeholder="CUAUHTÉMOC" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <input type="text" value={form.origen_estado}
                  onChange={e => set('origen_estado', e.target.value.toUpperCase())}
                  placeholder="CIUDAD DE MÉXICO" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Nombre del responsable de entrega</label>
              <input type="text" value={form.origen_contacto}
                onChange={e => set('origen_contacto', e.target.value.toUpperCase())}
                placeholder="NOMBRE DEL CONTACTO" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Teléfono del responsable de entrega</label>
              <input type="tel" value={form.origen_telefono} maxLength={12}
                onChange={e => {
                  const d = e.target.value.replace(/\D/g,'').slice(0,10)
                  set('origen_telefono', d.length<=3?d:d.length<=6?`${d.slice(0,3)}-${d.slice(3)}`:`${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`)
                }}
                placeholder="55-0000-0000" className={inputCls} />
            </div>
          </RRCard>

          <RRCard elevated={false} className="bg-rr-warningLight/70 border-rr-warningLight p-4 space-y-3">
            <p className="text-xs font-bold text-rr-warning uppercase tracking-wide">🏁 Destino</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Calle *</label>
                <input type="text" value={form.destino_calle}
                  onChange={e => set('destino_calle', e.target.value.toUpperCase())}
                  placeholder="TALLER NORTE" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Número</label>
                <input type="text" value={form.destino_numero}
                  onChange={e => set('destino_numero', e.target.value.toUpperCase())}
                  placeholder="100" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Colonia</label>
                <input type="text" value={form.destino_colonia}
                  onChange={e => set('destino_colonia', e.target.value.toUpperCase())}
                  placeholder="SATÉLITE" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>CP</label>
                <input type="text" value={form.destino_cp}
                  onChange={e => set('destino_cp', e.target.value.replace(/\D/g,'').slice(0,5))}
                  placeholder="53100" maxLength={5} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Municipio / Alcaldía</label>
                <input type="text" value={form.destino_municipio}
                  onChange={e => set('destino_municipio', e.target.value.toUpperCase())}
                  placeholder="NAUCALPAN" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <input type="text" value={form.destino_estado}
                  onChange={e => set('destino_estado', e.target.value.toUpperCase())}
                  placeholder="ESTADO DE MÉXICO" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Nombre del responsable de recepción</label>
              <input type="text" value={form.destino_contacto}
                onChange={e => set('destino_contacto', e.target.value.toUpperCase())}
                placeholder="NOMBRE DEL CONTACTO" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Teléfono del responsable de recepción</label>
              <input type="tel" value={form.destino_telefono} maxLength={12}
                onChange={e => {
                  const d = e.target.value.replace(/\D/g,'').slice(0,10)
                  set('destino_telefono', d.length<=3?d:d.length<=6?`${d.slice(0,3)}-${d.slice(3)}`:`${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`)
                }}
                placeholder="55-0000-0000" className={inputCls} />
            </div>
          </RRCard>

          <div>
            <label className={labelCls}>Fecha del traslado</label>
            <input type="date" value={form.fecha_programada}
              onChange={e => set('fecha_programada', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Hora</label>
            <input type="time" value={form.hora_programada}
              onChange={e => set('hora_programada', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Distancia aproximada (km) *</label>
            <input type="number" min="1" value={form.kmEstimado}
              onChange={e => set('kmEstimado', e.target.value.replace(/[^\d.]/g, ''))}
              placeholder="30" className={inputCls} />
            <p className="text-xs text-rr-gray500 mt-1">
              Solo para darte una cotización estimada. El conductor confirma la distancia real al recoger el vehículo.
            </p>
          </div>
          <div>
            <label className={labelCls}>Referencias del lugar</label>
            <input type="text" value={form.referencias}
              onChange={e => set('referencias', e.target.value.toUpperCase())}
              placeholder="ENTRE CALLES, PUNTO DE REFERENCIA, COLOR DE FACHADA..."
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Instrucciones especiales</label>
            <textarea value={form.instrucciones}
              onChange={e => set('instrucciones', e.target.value)}
              placeholder="Llamar 10 min antes, acceso por calle lateral..."
              rows={3} className={inputCls} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <RRButton onClick={() => nextStep(1)}
              variant="secondary"
              className="flex-1">
              ← Vehículo
            </RRButton>
            <RRButton onClick={() => nextStep(3)}
              disabled={!form.origen_calle || !form.destino_calle || !form.kmEstimado}
              className="flex-1">
              Confirmar →
            </RRButton>
          </div>
        </div>
      )}

      {/* PASO 3 — Confirmación */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-rr-black">Confirma tu solicitud</h3>

          <RRCard className="p-4 space-y-3">
            <p className="text-xs font-bold text-rr-gray500 uppercase">🚗 Vehículo</p>
            <p className="font-semibold">{form.marca} {form.modelo} · {form.placas}</p>
            {form.alias && <p className="text-sm text-rr-gray500">&quot;{form.alias}&quot;</p>}
            {form.color && <p className="text-sm text-rr-gray500">{form.color} · {form.transmision || 'Sin especificar'}</p>}
            {form.tipoVehiculo && <p className="text-sm text-rr-gray500">Tipo: {form.tipoVehiculo}</p>}
            {form.tipoServicioId && (
              <p className="text-sm text-rr-gray500">
                Servicio: {tiposServicio.find(t => t.id === form.tipoServicioId)?.nombre ?? '—'}
              </p>
            )}
          </RRCard>

          <RRCard className="p-4 space-y-3">
            <p className="text-xs font-bold text-rr-gray500 uppercase">📍 Ruta</p>
            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <div className="w-2 h-2 rounded-full bg-rr-success" />
                <div className="w-0.5 h-8 bg-rr-gray200 my-1" />
                <div className="w-2 h-2 rounded-full bg-rr-warning" />
              </div>
              <div>
                <p className="text-sm font-semibold">{form.origen_calle}{form.origen_numero ? ` ${form.origen_numero}` : ''}, {form.origen_colonia}</p>
                {(form.origen_municipio || form.origen_estado) && (
                  <p className="text-xs text-rr-gray500">{[form.origen_municipio, form.origen_estado].filter(Boolean).join(', ')}</p>
                )}
                <p className="text-sm font-semibold mt-3">{form.destino_calle}{form.destino_numero ? ` ${form.destino_numero}` : ''}, {form.destino_colonia}</p>
                {(form.destino_municipio || form.destino_estado) && (
                  <p className="text-xs text-rr-gray500">{[form.destino_municipio, form.destino_estado].filter(Boolean).join(', ')}</p>
                )}
              </div>
            </div>
            {form.kmEstimado && <p className="text-sm text-rr-gray500">📏 ~{form.kmEstimado} km estimados</p>}
            {form.fecha_programada && (
              <p className="text-sm text-rr-gray500">📅 {form.fecha_programada} {form.hora_programada && `· ${form.hora_programada}`}</p>
            )}
          </RRCard>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <RRButton onClick={() => nextStep(2)}
              variant="secondary"
              className="flex-1">
              ← Ruta
            </RRButton>
            <RRButton onClick={confirmar} disabled={enviando}
              className="flex-1">
              {enviando
                ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Enviando...</>
                : '✓ Solicitar traslado'
              }
            </RRButton>
          </div>
        </div>
      )}
    </div>
  )
}