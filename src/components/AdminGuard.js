'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export default function AdminGuard({ isOpen, onClose, onConfirm, darkMode }) {
  const [pin, setPin] = useState('')
  const PIN_CORRECTO = "1407"

  // Efecto que vigila el PIN mientras escribes
  useEffect(() => {
    if (pin.length === 4) {
      verificar(pin)
    }
  }, [pin])

  const verificar = (valorPin) => {
    if (valorPin === PIN_CORRECTO) {
      onConfirm()
      setPin('')
      onClose()
    } else {
      toast.error("PIN INCORRECTO ❌")
      // Pequeña demora para que el usuario vea que escribió 4 números antes de borrar
      setTimeout(() => setPin(''), 300)
    }
  }

  const manejarCambio = (e) => {
    // Solo permitimos números
    const valor = e.target.value.replace(/\D/g, '')
    setPin(valor)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`${darkMode ? 'bg-slate-900 border-slate-700 shadow-orange-900/20' : 'bg-white border-gray-300 shadow-2xl'} 
        w-full max-w-xs p-8 rounded-[3rem] border-4 text-center transform transition-all animate-in zoom-in-95 duration-200`}>
        
        <div className="text-5xl mb-4 animate-bounce">🔐</div>
        
        <h3 className={`text-xl font-black uppercase mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
          Zona Protegida
        </h3>
        <p className={`text-[10px] font-bold uppercase mb-6 opacity-50 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          Ingresa el PIN de acceso
        </p>
        
        <input 
          autoFocus
          type="password" 
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          onChange={manejarCambio}
          placeholder="••••"
          className={`w-full p-4 text-center text-4xl tracking-[0.5em] font-black rounded-[2rem] border-2 mb-6 transition-all ${
            pin.length === 4 && pin !== PIN_CORRECTO ? 'border-red-500 animate-pulse' : 'border-orange-500'
          } ${
            darkMode ? 'bg-slate-800 text-white' : 'bg-gray-100 text-black shadow-inner'
          }`}
        />

        <div className="flex flex-col gap-2">
          {/* El botón ya no es estrictamente necesario, pero se deja por si falla el auto-focus */}
          <button 
            onClick={onClose} 
            className="py-2 font-black uppercase text-[10px] opacity-40 hover:opacity-100 transition-opacity"
          >
            Cancelar y volver
          </button>
        </div>

        {/* Indicador visual de progreso */}
        <div className="flex justify-center gap-2 mt-4">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                pin.length > i ? 'bg-orange-600 scale-125' : 'bg-gray-300 opacity-30'
              }`} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}