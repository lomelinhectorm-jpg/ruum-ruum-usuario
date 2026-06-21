'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell } from '@fortawesome/free-solid-svg-icons'

export default function TopHeader() {
  return (
    <header className="bg-rr-secondary text-white px-5 pt-8 pb-5 sm:px-8 md:pt-6 flex-shrink-0 sticky top-0 z-20 shadow-rrFloating">
      <div className="mx-auto flex max-w-[1024px] justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-rrMd text-rr-primary flex items-center justify-center font-black text-sm">RR</div>
          <div>
            <h1 className="font-black text-lg leading-tight tracking-tight">Ruum Ruum</h1>
            <p className="text-[10px] text-white/60 tracking-wider">BY MOVILIAX</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative h-10 w-10 rounded-full bg-white/10 text-white/50 cursor-not-allowed" disabled
            title="Notificaciones — próximamente">
            <FontAwesomeIcon icon={faBell} className="text-base" />
          </button>
        </div>
      </div>
    </header>
  )
}
