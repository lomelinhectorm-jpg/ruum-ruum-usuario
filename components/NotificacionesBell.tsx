'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'

interface Notificacion {
  id: string
  titulo: string
  cuerpo: string
  leida: boolean
  created_at: string
  viaje_id: string | null
}

export default function NotificacionesBell() {
  const { usuario } = useApp()
  const [abierto, setAbierto] = useState(false)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const ref = useRef<HTMLDivElement>(null)

  // cargar() solo trae datos y los devuelve — el setState vive en el
  // .then() de quien la llama, nunca dentro de ella. Llamarla directo y
  // dejar que ELLA haga el setState dispara el lint
  // react-hooks/set-state-in-effect (setState síncrono dentro de un
  // efecto), así que se separa a propósito.
  const cargar = useCallback(async (usuarioId: string): Promise<Notificacion[]> => {
    const { data } = await supabase.from('notificaciones')
      .select('id,titulo,cuerpo,leida,created_at,viaje_id')
      .eq('destinatario_tipo', 'usuario')
      .eq('destinatario_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(30)
    return (data as Notificacion[]) ?? []
  }, [])

  useEffect(() => {
    if (!usuario?.id) return
    let activo = true
    const usuarioId = usuario.id
    cargar(usuarioId).then(data => { if (activo) setNotificaciones(data) })
    const channel = supabase.channel(`notificaciones-usuario-${usuarioId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `destinatario_id=eq.${usuarioId}` }, () => {
        cargar(usuarioId).then(data => { if (activo) setNotificaciones(data) })
      })
      .subscribe()
    return () => { activo = false; void supabase.removeChannel(channel) }
  }, [usuario?.id, cargar])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const marcarLeida = async (id: string) => {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
  }

  const marcarTodasLeidas = async () => {
    if (!usuario?.id) return
    const sinLeer = notificaciones.filter(n => !n.leida)
    if (sinLeer.length === 0) return
    await supabase.from('notificaciones').update({ leida: true }).eq('destinatario_id', usuario.id).in('id', sinLeer.map(n => n.id))
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
  }

  const noLeidas = notificaciones.filter(n => !n.leida).length

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setAbierto(a => !a)} className="relative h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center">
        <FontAwesomeIcon icon={faBell} className="text-base" />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-rr-danger text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>
      {abierto && (
        <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto bg-white text-rr-black border border-rr-gray200 rounded-rrMd shadow-rrFloating z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-rr-gray200 sticky top-0 bg-white">
            <p className="text-sm font-bold">Notificaciones</p>
            {noLeidas > 0 && (
              <button onClick={marcarTodasLeidas} className="text-xs text-rr-primary hover:underline">Marcar todas leídas</button>
            )}
          </div>
          {notificaciones.length === 0 ? (
            <p className="text-center py-8 text-rr-gray500 text-xs italic">Sin notificaciones.</p>
          ) : (
            <ul className="divide-y divide-rr-gray200">
              {notificaciones.map(n => (
                <li key={n.id} onClick={() => !n.leida && marcarLeida(n.id)}
                  className={`px-4 py-3 text-sm cursor-pointer hover:bg-rr-gray100 transition-colors ${!n.leida ? 'bg-rr-primary/5' : ''}`}>
                  <p className="font-semibold">{n.titulo}</p>
                  <p className="text-xs text-rr-gray500 mt-0.5">{n.cuerpo}</p>
                  <p className="text-[11px] text-rr-gray400 mt-1">{new Date(n.created_at).toLocaleString('es-MX')}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
