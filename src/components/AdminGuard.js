'use client'
import { useState } from 'react'

export default function AdminGuard({ isOpen, onClose, onConfirm, darkMode }) {
  const [pin, setPin] = useState('')
  const PIN_CORRECTO = "1407" // <- Cambia esto por el pin real

  if (!isOpen) return null

  const verificar = () => {
    if (pin === PIN_CORRECTO) {
      onConfirm()
      setPin('')
      onClose()
    } else {
      alert("❌ PIN INCORRECTO")
      setPin('')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
      <div className={`${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-300'} w-full max-w-xs p-8 rounded-[2.5rem] border-4 shadow-2xl text-center`}>
        <span className="text-5xl mb-4 block">🔐</span>
        <h3 className={`text-xl font-black uppercase mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
          Confirmar Identidad
        </h3>
        
        <input 
          type="password" 
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN DE 4 DÍGITOS"
          className={`w-full p-4 text-center text-3xl tracking-[1em] font-black rounded-2xl border-2 mb-6 ${
            darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-gray-100 border-gray-400 text-black'
          }`}
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 font-black uppercase text-xs opacity-50">Cancelar</button>
          <button 
            onClick={verificar}
            className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-black uppercase shadow-lg border-b-4 border-orange-800"
          >
            ENTRAR
          </button>
        </div>
      </div>
    </div>
  )
}