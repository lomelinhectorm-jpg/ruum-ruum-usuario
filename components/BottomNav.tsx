'use client'

import { useApp } from '@/context/AppContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faRoute, faUser } from '@fortawesome/free-solid-svg-icons'
import type { ViewId } from '@/lib/types'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

const navItems: { id: ViewId; icon: IconDefinition; label: string }[] = [
  { id: 'view-inicio', icon: faHome, label: 'Inicio' },
  { id: 'view-mis-viajes', icon: faRoute, label: 'Mis viajes' },
  { id: 'view-cuenta', icon: faUser, label: 'Cuenta' },
]

const NAV_VIEWS = navItems.map((n) => n.id)

export default function BottomNav() {
  const { currentView, showView } = useApp()

  // Only show active state for main nav views
  const activeView = NAV_VIEWS.includes(currentView) ? currentView : null

  return (
    <nav className="bg-white/95 border-t border-rr-gray200 px-2 py-2 sm:px-6 sm:py-3 flex justify-center items-center flex-shrink-0 z-20 shadow-rrFloating backdrop-blur">
      <div className="grid w-full max-w-[1024px] grid-cols-3 gap-1">
      {navItems.map((item) => {
        const isActive = activeView === item.id
        return (
          <button
            key={item.id}
            onClick={() => showView(item.id)}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-rrMd px-1 py-1.5 transition-all ${isActive ? 'text-rr-secondary bg-rr-primaryLight' : 'text-rr-gray500 hover:text-rr-black hover:bg-rr-gray100'}`}
          >
            <FontAwesomeIcon
              icon={item.icon}
              className={`text-xl transition-transform duration-200 ${isActive ? '-translate-y-0.5' : ''}`}
            />
            <span className="max-w-full truncate text-[10px] font-medium">{item.label}</span>
          </button>
        )
      })}
      </div>
    </nav>
  )
}
