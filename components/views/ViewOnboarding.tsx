'use client'

import { useState } from 'react'

interface Props {
  onFinish: () => void
}

const SLIDES = [
  {
    bg: 'from-blue-600 to-blue-800',
    emoji: '🚗',
    title: 'Tu auto en buenas manos',
    body: 'Trasladamos tu vehículo de forma segura, con conductores certificados y evidencia fotográfica en cada viaje.',
    dot: 'bg-blue-300',
  },
  {
    bg: 'from-slate-700 to-slate-900',
    emoji: '📍',
    title: 'Seguimiento en tiempo real',
    body: 'Monitorea el recorrido de tu auto desde la app. Sabrás exactamente dónde está en todo momento.',
    dot: 'bg-slate-400',
  },
  {
    bg: 'from-green-600 to-emerald-800',
    emoji: '✅',
    title: 'Evidencia y tranquilidad',
    body: 'Fotos del estado de tu vehículo antes y después de cada traslado. Tu auto siempre documentado.',
    dot: 'bg-green-300',
  },
]

export default function ViewOnboarding({ onFinish }: Props) {
  const [current, setCurrent] = useState(0)
  const slide = SLIDES[current]
  const isLast = current === SLIDES.length - 1

  const next = () => {
    if (isLast) onFinish()
    else setCurrent(c => c + 1)
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${slide.bg} flex flex-col transition-all duration-500`}>

      {/* Botón saltar */}
      <div className="flex justify-end p-6">
        <button
          onClick={onFinish}
          className="text-white/60 text-sm font-medium hover:text-white transition-colors"
        >
          Saltar
        </button>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Ícono */}
        <div className="w-32 h-32 bg-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-2xl backdrop-blur">
          <span className="text-7xl">{slide.emoji}</span>
        </div>

        {/* Logo pequeño */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xs">RR</span>
          </div>
          <span className="text-white/60 text-xs font-medium tracking-widest uppercase">Ruum Ruum</span>
        </div>

        <h1 className="text-3xl font-black text-white mb-4 leading-tight">
          {slide.title}
        </h1>
        <p className="text-white/75 text-base leading-relaxed max-w-xs">
          {slide.body}
        </p>
      </div>

      {/* Dots + botón */}
      <div className="px-8 pb-12 space-y-8">
        {/* Indicadores */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-white' : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Botón siguiente / comenzar */}
        <button
          onClick={next}
          className="w-full bg-white text-slate-900 font-bold py-4 rounded-2xl text-base shadow-xl hover:bg-white/90 transition-all active:scale-95"
        >
          {isLast ? 'Comenzar →' : 'Siguiente →'}
        </button>
      </div>
    </div>
  )
}
