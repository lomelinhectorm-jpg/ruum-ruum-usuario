'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Phase = 'phone' | 'otp' | 'name'

const inputCls = 'w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rr-primary'
const labelCls = 'block text-xs font-medium text-slate-500 mb-1'

interface Props {
  onAuth: () => void
}

export default function ViewLogin({ onAuth }: Props) {
  const [phase, setPhase] = useState<Phase>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isNew, setIsNew] = useState(false)

  // Formatear teléfono mientras escribe
  const handlePhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10)
    const fmt =
      digits.length <= 3 ? digits
      : digits.length <= 6 ? `${digits.slice(0, 3)}-${digits.slice(3)}`
      : `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    setPhone(fmt)
  }

  const enviarOTP = async () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) { setError('Ingresa un número de 10 dígitos'); return }
    setError('')
    setLoading(true)
    const fullPhone = `+52${digits}`
    const { error: err } = await supabase.auth.signInWithOtp({ phone: fullPhone })
    setLoading(false)
    if (err) { setError('No se pudo enviar el código. Intenta de nuevo.'); return }
    setPhase('otp')
  }

  const verificarOTP = async () => {
    if (otp.length < 6) { setError('Ingresa el código de 6 dígitos'); return }
    setError('')
    setLoading(true)
    const fullPhone = `+52${phone.replace(/\D/g, '')}`
    const { data, error: err } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp,
      type: 'sms',
    })
    if (err) { setLoading(false); setError('Código incorrecto o expirado'); return }

    // Verificar si ya existe en tabla usuarios
    const uid = data.user?.id
    if (!uid) { setLoading(false); setError('Error de autenticación'); return }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_id', uid)
      .single()

    setLoading(false)
    if (usuario) {
      // Ya registrado → entrar directo
      onAuth()
    } else {
      // Nuevo usuario → pedir nombre
      setIsNew(true)
      setPhase('name')
    }
  }

  const completarRegistro = async () => {
    if (!nombre.trim() || !apellido.trim()) { setError('Ingresa tu nombre completo'); return }
    setError('')
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); setError('Sesión expirada, intenta de nuevo'); return }

    const digits = phone.replace(/\D/g, '')
    const { error: err } = await supabase.from('usuarios').insert({
      auth_id: user.id,
      nombre: nombre.toUpperCase().trim(),
      apellido: apellido.toUpperCase().trim(),
      email: user.email ?? null,
      telefono: `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`,
      tipo: 'Personal',
      estatus: 'Activo',
    })

    setLoading(false)
    if (err) { setError('Error al guardar tus datos. Intenta de nuevo.'); return }
    onAuth()
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-rr-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-yellow-200">
          <span className="text-rr-secondary font-black text-2xl">RR</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Ruum Ruum</h1>
        <p className="text-sm text-slate-500 mt-1">Mueve tu auto con confianza</p>
      </div>

      {/* FASE 1 — Teléfono */}
      {phase === 'phone' && (
        <div className="w-full max-w-sm space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Ingresa tu número</h2>
            <p className="text-sm text-slate-500">Te enviaremos un código de verificación por SMS.</p>
          </div>

          <div>
            <label className={labelCls}>Teléfono celular</label>
            <div className="flex gap-2">
              <div className="px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 bg-slate-50 whitespace-nowrap">
                🇲🇽 +52
              </div>
              <input
                type="tel"
                value={phone}
                onChange={e => handlePhone(e.target.value)}
                placeholder="55-0000-0000"
                maxLength={12}
                className={inputCls}
                onKeyDown={e => e.key === 'Enter' && enviarOTP()}
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <button
            onClick={enviarOTP}
            disabled={loading || phone.replace(/\D/g,'').length < 10}
            className="w-full bg-rr-primary hover:bg-rr-primaryHover disabled:opacity-50 text-rr-secondary font-bold py-4 rounded-xl transition-all"
          >
            {loading ? 'Enviando...' : 'Enviar código →'}
          </button>

          <p className="text-xs text-center text-slate-400">
            Al continuar aceptas nuestros{' '}
            <span className="text-rr-trace">Términos de servicio</span>
          </p>
        </div>
      )}

      {/* FASE 2 — OTP */}
      {phase === 'otp' && (
        <div className="w-full max-w-sm space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Código de verificación</h2>
            <p className="text-sm text-slate-500">
              Ingresa el código de 6 dígitos enviado a{' '}
              <span className="font-semibold text-slate-700">+52 {phone}</span>
            </p>
          </div>

          <div>
            <label className={labelCls}>Código SMS</label>
            <input
              type="number"
              value={otp}
              onChange={e => setOtp(e.target.value.slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className={`${inputCls} text-center text-2xl font-bold tracking-widest`}
              onKeyDown={e => e.key === 'Enter' && verificarOTP()}
            />
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <button
            onClick={verificarOTP}
            disabled={loading || otp.length < 6}
            className="w-full bg-rr-primary hover:bg-rr-primaryHover disabled:opacity-50 text-rr-secondary font-bold py-4 rounded-xl transition-all"
          >
            {loading ? 'Verificando...' : 'Verificar código →'}
          </button>

          <button
            onClick={() => { setPhase('phone'); setOtp(''); setError('') }}
            className="w-full text-slate-500 text-sm py-2"
          >
            ← Cambiar número
          </button>

          <button
            onClick={enviarOTP}
            disabled={loading}
            className="w-full text-rr-trace text-sm font-medium py-2"
          >
            Reenviar código
          </button>
        </div>
      )}

      {/* FASE 3 — Datos (nuevo usuario) */}
      {phase === 'name' && (
        <div className="w-full max-w-sm space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">¡Bienvenido!</h2>
            <p className="text-sm text-slate-500">Cuéntanos tu nombre para personalizar tu cuenta.</p>
          </div>

          <div>
            <label className={labelCls}>Nombre(s) *</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value.toUpperCase())}
              placeholder="JUAN CARLOS"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Apellido(s) *</label>
            <input
              type="text"
              value={apellido}
              onChange={e => setApellido(e.target.value.toUpperCase())}
              placeholder="GARCÍA LÓPEZ"
              className={inputCls}
            />
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <button
            onClick={completarRegistro}
            disabled={loading || !nombre.trim() || !apellido.trim()}
            className="w-full bg-rr-primary hover:bg-rr-primaryHover disabled:opacity-50 text-rr-secondary font-bold py-4 rounded-xl transition-all"
          >
            {loading ? 'Guardando...' : 'Crear mi cuenta →'}
          </button>
        </div>
      )}
    </div>
  )
}
