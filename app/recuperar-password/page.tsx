'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const iCls =
  'w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC400]'

export default function RecuperarPasswordPage() {
  const [ready, setReady] = useState(false)
  const [valid, setValid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Supabase detecta el token de recuperación que viene en la URL del correo
  // y, si es válido, dispara el evento PASSWORD_RECOVERY con una sesión temporal.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setValid(true)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValid(true)
      setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async () => {
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError('No se pudo actualizar la contraseña. Solicita un nuevo enlace.'); return }
    setDone(true)
    setTimeout(() => { window.location.href = '/' }, 2500)
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-slate-400">Verificando enlace...</p>
      </div>
    )
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-lg font-bold text-[#151515] mb-2">Enlace inválido o expirado</p>
        <p className="text-sm text-slate-500 mb-6">Solicita un nuevo enlace de recuperación desde la app.</p>
        <Link href="/" className="text-sm font-semibold text-[#151515] hover:underline">Volver al inicio</Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-lg font-bold text-green-600 mb-2">✓ Contraseña actualizada</p>
        <p className="text-sm text-slate-500">Te llevaremos al inicio en un momento...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-[#151515] px-5 sm:px-6 pt-8 sm:pt-12 pb-6">
        <h2 className="text-2xl font-black text-white">Nueva contraseña</h2>
        <p className="text-white/60 text-sm mt-1">Crea una contraseña segura para tu cuenta</p>
      </div>

      <div className="flex-1 p-5 sm:p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              placeholder="Mínimo 6 caracteres"
              onChange={e => setPassword(e.target.value)}
              className={iCls}
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700"
            >
              {show ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
            Confirmar contraseña
          </label>
          <input
            type={show ? 'text' : 'password'}
            value={confirm}
            placeholder="Repite la contraseña"
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className={iCls}
          />
        </div>

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>

      <div className="p-5 sm:p-6 border-t border-slate-100">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#151515] text-white font-bold py-4 rounded-2xl text-base hover:bg-[#2a2a2a] disabled:opacity-60 transition-all active:scale-95"
        >
          {loading ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </div>
    </div>
  )
}
