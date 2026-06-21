'use client'

import { createContext, useCallback, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getPerfilUsuario, crearPerfilDesdeAuth, getMisViajes,
  solicitarViaje as solicitarViajeQuery, suscribirMisViajes,
  completarCambioPassword, actualizarPerfilUsuario,
  type CamposPerfilEditable,
} from '@/lib/queries/usuario'
import type { ViewId, StepId } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

// ─── TIPOS ────────────────────────────────────────────────────────────────────
export interface ViajeUsuario {
  id: string
  folio: string | null
  status: string
  fecha_programada: string | null
  hora_programada: string | null
  origen_calle: string | null
  origen_colonia: string | null
  destino_calle: string | null
  destino_colonia: string | null
  tarifa_cliente: number
  evidencias?: { id: string }[] | null
  conductores: {
    id: string; nombre: string; apellido: string; calificacion: number
    foto_url: string | null; telefono: string | null; certificacion: string | null
    disponibilidad: string; viajes_realizados: number
    municipio: string | null; estado_geo: string | null
  } | null
  vehiculos: { marca: string; modelo: string; placas: string } | null
}

export interface UsuarioPerfil {
  id: string
  nombre: string
  apellido: string
  email: string | null
  telefono: string | null
  requiere_cambio_password: boolean
  curp: string | null
  calle: string | null
  numero: string | null
  colonia: string | null
  municipio: string | null
  estado_geo: string | null
  codigo_postal: string | null
  razon_social: string | null
  nombre_comercial: string | null
  rfc: string | null
  regimen_fiscal: string | null
  cfdi: string | null
  domicilio_fiscal: string | null
}

interface AppContextType {
  currentView: ViewId
  currentStep: StepId
  showView: (view: ViewId) => void
  setStep: (step: StepId) => void
  viajeSeleccionado: ViajeUsuario | null
  setViajeSeleccionado: (v: ViajeUsuario | null) => void
  authReady: boolean
  autenticado: boolean
  usuario: UsuarioPerfil | null
  misViajes: ViajeUsuario[]
  cargandoViajes: boolean
  solicitarViaje: (datos: DatosSolicitud) => Promise<boolean>
  recargarViajes: () => Promise<void>
  cambiarPasswordObligatorio: (nuevaPassword: string) => Promise<boolean>
  actualizarPerfil: (datos: CamposPerfilEditable) => Promise<boolean>
}

export interface DatosSolicitud {
  marca: string; modelo: string; anio?: string; color?: string
  placas: string; vin?: string; transmision?: string; alias?: string
  origen_calle: string; origen_numero?: string; origen_colonia?: string
  origen_municipio?: string; origen_estado?: string; origen_cp?: string
  origen_contacto?: string; origen_telefono?: string
  destino_calle: string; destino_numero?: string; destino_colonia?: string
  destino_municipio?: string; destino_estado?: string; destino_cp?: string
  destino_contacto?: string; destino_telefono?: string
  referencias?: string; instrucciones?: string
  fecha_programada?: string; hora_programada?: string
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewId>('view-inicio')
  const [currentStep, setCurrentStep] = useState<StepId>(1)
  const [viajeSeleccionado, setViajeSeleccionado] = useState<ViajeUsuario | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [autenticado, setAutenticado] = useState(false)
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null)
  const [misViajes, setMisViajes] = useState<ViajeUsuario[]>([])
  const [cargandoViajes, setCargandoViajes] = useState(true)

  // Ref para acceder al usuario más reciente dentro de funciones async
  const usuarioRef = useRef<UsuarioPerfil | null>(null)
  useEffect(() => { usuarioRef.current = usuario }, [usuario])

  // ── Cargar perfil desde la tabla usuarios ──────────────────────────────────
  const cargarPerfil = async (uid: string): Promise<UsuarioPerfil | null> => {
    const data = await getPerfilUsuario(uid)
    if (data) {
      const perfil = data as UsuarioPerfil
      setUsuario(perfil)
      usuarioRef.current = perfil
      return perfil
    }
    return null
  }

  const crearPerfilLocal = async (user: User): Promise<UsuarioPerfil | null> => {
    const perfil = await crearPerfilDesdeAuth(user)
    if (perfil) {
      setUsuario(perfil as UsuarioPerfil)
      usuarioRef.current = perfil as UsuarioPerfil
    }
    return perfil as UsuarioPerfil | null
  }

  // Carga el perfil del usuario autenticado y, solo si la consulta tuvo
  // éxito y confirmó que NO existe fila (no si la consulta falló por algún
  // otro motivo), crea una a partir de los metadatos de auth. Compartida
  // entre la verificación inicial de sesión y el listener de cambios, para
  // no duplicar esta lógica — y sobre todo, para no duplicar el bug donde
  // un error de consulta se confundía con "usuario sin perfil".
  const sincronizarPerfil = async (user: User) => {
    try {
      const perfil = await cargarPerfil(user.id)
      if (!perfil) await crearPerfilLocal(user)
    } catch (e) {
      console.error('Error sincronizando el perfil del usuario:', e)
    }
  }

  // ── Verificar sesión al montar ─────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setAutenticado(true)
        await sincronizarPerfil(session.user)
      }
      setAuthReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setAutenticado(true)
        await sincronizarPerfil(session.user)
      } else {
        setAutenticado(false)
        setUsuario(null)
        usuarioRef.current = null
        setMisViajes([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const recargarViajes = useCallback(async () => {
    const u = usuarioRef.current
    if (!u) return
    setCargandoViajes(true)
    try {
      const data = await getMisViajes(u.id)
      setMisViajes(data as unknown as ViajeUsuario[])
    } catch (e) {
      console.error('Error cargando viajes:', e)
    }
    setCargandoViajes(false)
  }, [])

  // ── Cargar viajes y activar realtime cuando hay usuario ───────────────────
  useEffect(() => {
    if (!usuario) return
    let activo = true

    const cargarInicial = async () => {
      try {
        const data = await getMisViajes(usuario.id)
        if (activo) setMisViajes(data as unknown as ViajeUsuario[])
      } catch (e) {
        console.error('Error cargando viajes:', e)
      } finally {
        if (activo) setCargandoViajes(false)
      }
    }
    void cargarInicial()

    const channel = suscribirMisViajes(usuario.id, () => { void recargarViajes() })

    return () => {
      activo = false
      void supabase.removeChannel(channel)
    }
  }, [usuario, recargarViajes])

  // ── Solicitar viaje ────────────────────────────────────────────────────────
  const solicitarViaje = async (datos: DatosSolicitud): Promise<boolean> => {
    try {
      // Si usuario aún no cargó, intentar obtenerlo de la sesión activa
      let u = usuarioRef.current
      if (!u) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return false
        u = await cargarPerfil(user.id)
        if (!u) return false
      }

      await solicitarViajeQuery(u, datos)
      await recargarViajes()
      return true
    } catch (e) {
      console.error('Error en solicitarViaje:', e)
      return false
    }
  }

  // ── Cambio de contraseña obligatorio (cuentas con password provisional) ───
  const cambiarPasswordObligatorio = async (nuevaPassword: string): Promise<boolean> => {
    const u = usuarioRef.current
    if (!u) return false
    try {
      await completarCambioPassword(u.id, nuevaPassword)
      const actualizado = { ...u, requiere_cambio_password: false }
      setUsuario(actualizado)
      usuarioRef.current = actualizado
      return true
    } catch (e) {
      console.error('Error cambiando contraseña:', e)
      return false
    }
  }

  // ── Actualizar datos del perfil (personales, dirección o fiscales) ────────
  const actualizarPerfil = async (datos: CamposPerfilEditable): Promise<boolean> => {
    const u = usuarioRef.current
    if (!u) return false
    try {
      const actualizado = await actualizarPerfilUsuario(u.id, datos)
      setUsuario(actualizado as UsuarioPerfil)
      usuarioRef.current = actualizado as UsuarioPerfil
      return true
    } catch (e) {
      console.error('Error actualizando perfil:', e)
      return false
    }
  }

  return (
    <AppContext.Provider value={{
      currentView, currentStep,
      showView: setCurrentView,
      setStep: setCurrentStep,
      viajeSeleccionado, setViajeSeleccionado,
      authReady, autenticado,
      usuario, misViajes, cargandoViajes,
      solicitarViaje, recargarViajes,
      cambiarPasswordObligatorio,
      actualizarPerfil,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
