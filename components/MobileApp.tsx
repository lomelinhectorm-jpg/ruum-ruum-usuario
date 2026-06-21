'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import TopHeader from './TopHeader'
import BottomNav from './BottomNav'
import ViewInicio from './views/ViewInicio'
import ViewSolicitar from './views/ViewSolicitar'
import ViewMisViajes from './views/ViewMisViajes'
import ViewDetalleViaje from './views/ViewDetalleViaje'
import ViewEvidencia from './views/ViewEvidencia'
import ViewCuenta from './views/ViewCuenta'
import ViewOnboardingUsuario from './views/ViewOnboardingUsuario'
import ViewCambioPasswordObligatorio from './views/ViewCambioPasswordObligatorio'

const ONBOARDING_KEY = 'ruum_usuario_onboarding'

export default function MobileApp() {
  const { currentView, authReady, autenticado, usuario, showView, setStep } = useApp()

  const [onboardingDone, setOnboardingDone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(ONBOARDING_KEY) === '1'
  })

  const handleAuth = () => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setOnboardingDone(true)
    setStep(1)
    showView('view-inicio')
  }

  // Cargando sesión
  if (!authReady) {
    return (
      <div className="app-shell flex flex-col items-center justify-center bg-white">
        <div className="w-14 h-14 bg-rr-primary rounded-2xl flex items-center justify-center mb-4 animate-pulse">
          <span className="text-rr-secondary font-black text-xl">RR</span>
        </div>
        <p className="text-sm text-slate-400">Cargando...</p>
      </div>
    )
  }

  // Sin sesión → onboarding (primera vez) o login directo (ya pasó por onboarding)
  if (!autenticado) {
    return (
      <div className="app-shell overflow-y-auto">
        <ViewOnboardingUsuario onAuth={handleAuth} />
      </div>
    )
  }

  // Autenticado pero el perfil (usuarios) todavía no cargó — sin esto,
  // habría un parpadeo donde se muestra la app normal antes de saber si
  // requiere_cambio_password es true.
  if (!usuario) {
    return (
      <div className="app-shell flex flex-col items-center justify-center bg-white">
        <div className="w-14 h-14 bg-rr-primary rounded-2xl flex items-center justify-center mb-4 animate-pulse">
          <span className="text-rr-secondary font-black text-xl">RR</span>
        </div>
        <p className="text-sm text-slate-400">Cargando...</p>
      </div>
    )
  }

  // Cuenta creada por el admin con contraseña provisional — obligatorio
  // cambiarla antes de ver cualquier otra cosa de la app.
  if (usuario.requiere_cambio_password) {
    return (
      <div className="app-shell overflow-y-auto">
        <ViewCambioPasswordObligatorio />
      </div>
    )
  }

  // App normal
  const renderView = () => {
    switch (currentView) {
      case 'view-inicio':        return <ViewInicio />
      case 'view-solicitar':     return <ViewSolicitar />
      case 'view-mis-viajes':    return <ViewMisViajes />
      case 'view-detalle-viaje': return <ViewDetalleViaje />
      case 'view-evidencia':     return <ViewEvidencia />
      case 'view-cuenta':        return <ViewCuenta />
      default:                   return <ViewInicio />
    }
  }

  return (
    <div className="app-shell flex flex-col">
      <TopHeader />
      <main className="app-main flex-1 overflow-y-auto no-scrollbar bg-slate-50 relative">
        {renderView()}
      </main>
      <BottomNav />
    </div>
  )
}