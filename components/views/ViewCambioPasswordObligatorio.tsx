'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'

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

// Pantalla obligatoria, sin posibilidad de saltarla, para cuentas creadas
// por el admin con una contraseña provisional (ver requiere_cambio_password
// en `usuarios`). MobileApp.tsx la gatea antes de mostrar el resto de la
// app — no hay botón de "omitir" ni de "más tarde" a propósito.
export default function ViewCambioPasswordObligatorio() {
  const { usuario, cambiarPasswordObligatorio } = useApp()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [show, setShow] = useState(false)
  const [showC, setShowC] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmar?: string }>({})
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState('')

  const validate = () => {
    const e: { password?: string; confirmar?: string } = {}
    if (password.length < 8) e.password = 'Mínimo 8 caracteres'
    if (password !== confirmar) e.confirmar = 'Las contraseñas no coinciden'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setGuardando(true)
    setErrorGeneral('')
    const ok = await cambiarPasswordObligatorio(password)
    setGuardando(false)
    if (!ok) setErrorGeneral('No se pudo actualizar tu contraseña. Intenta de nuevo.')
    // Si tuvo éxito, AppContext ya actualizó requiere_cambio_password a
    // false en el estado local — MobileApp deja de mostrar esta pantalla
    // en el siguiente render, sin necesidad de recargar ni navegar.
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-[#151515] px-6 pt-12 pb-8">
        <div className="w-12 h-12 bg-[#FFC400]/15 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-2xl">🔒</span>
        </div>
        <h1 className="text-2xl font-black text-white">Crea tu contraseña</h1>
        <p className="text-white/60 text-sm mt-2 leading-relaxed">
          {usuario ? `Hola, ${usuario.nombre}. ` : ''}
          Tu cuenta se creó con una contraseña temporal. Antes de continuar, define una nueva que solo tú conozcas.
        </p>
      </div>

      <div className="flex-1 p-6 space-y-4">
        <div>
          <Label req>Nueva contraseña</Label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} value={password} placeholder="Mínimo 8 caracteres"
              onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: undefined })) }}
              className={iCls(errors.password)} />
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
            <input type={showC ? 'text' : 'password'} value={confirmar} placeholder="Repite tu contraseña"
              onChange={e => { setConfirmar(e.target.value); setErrors(er => ({ ...er, confirmar: undefined })) }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className={iCls(errors.confirmar)} />
            <button type="button" onClick={() => setShowC(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <EyeIcon open={showC} />
            </button>
          </div>
          <Err msg={errors.confirmar} />
        </div>

        {errorGeneral && <p className="text-xs text-red-500 font-medium">{errorGeneral}</p>}
      </div>

      <div className="p-6 border-t border-slate-100">
        <button onClick={handleSubmit} disabled={guardando}
          className="w-full bg-[#FFC400] text-[#151515] font-bold py-4 rounded-2xl text-base hover:brightness-95 disabled:opacity-60 transition-all active:scale-95">
          {guardando ? 'Guardando...' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}