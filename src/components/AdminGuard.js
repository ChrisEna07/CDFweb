'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export default function AdminGuard({ isOpen, onClose, onConfirm, darkMode, title = "Zona Protegida" }) {
  const [pin, setPin] = useState('')
  const [pinsValidos, setPinsValidos] = useState(["1407", "3008"])

  useEffect(() => {
    const saved = localStorage.getItem('atendentes_lista')
    if (saved) {
      const lista = JSON.parse(saved)
      setPinsValidos(lista.map(a => a.pin))
    }
  }, [isOpen])

  useEffect(() => {
    if (pin.length === 4) {
      verificar(pin)
    }
  }, [pin])

  const verificar = (valorPin) => {
    if (pinsValidos.includes(valorPin)) {
      onConfirm()
      setPin('')
      onClose()
    } else {
      toast.error("PIN INCORRECTO ❌", {
        style: { background: '#ef4444', color: '#fff', fontWeight: 'black' }
      })
      setTimeout(() => setPin(''), 300)
    }
  }

  const manejarCambio = (e) => {
    const valor = e.target.value.replace(/\D/g, '')
    setPin(valor)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-fadeIn">
      <div className={`${darkMode ? 'bg-slate-900/80 border-white/10 shadow-orange-900/20' : 'bg-white border-orange-100 shadow-2xl'} 
        w-full max-w-sm p-10 rounded-[3.5rem] border-2 text-center transform transition-all animate-slideUp`}>
        
        <div className="text-6xl mb-6 animate-pulse drop-shadow-lg">🔐</div>
        
        <h3 className={`text-2xl font-black uppercase italic mb-2 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent`}>
          {title}
        </h3>
        <p className={`text-[10px] font-black uppercase mb-8 opacity-50 tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          Personal Autorizado MariVama
        </p>
        
        <div className="relative group mb-8">
          <input 
            autoFocus
            type="password" 
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={manejarCambio}
            placeholder="••••"
            className={`w-full p-6 text-center text-5xl tracking-[0.6em] font-black rounded-[2.5rem] border-4 transition-all outline-none ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 text-white focus:border-orange-500' 
                : 'bg-orange-50 border-orange-100 text-black shadow-inner focus:border-orange-500'
            }`}
          />
        </div>

        <button 
          onClick={onClose} 
          className="w-full py-4 rounded-2xl font-black uppercase text-[10px] bg-black/5 dark:bg-white/5 opacity-40 hover:opacity-100 transition-all active:scale-95 mb-6"
        >
          Regresar
        </button>

        <div className="flex justify-center gap-3">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full transition-all duration-500 border-2 ${
                pin.length > i 
                  ? 'bg-orange-600 border-orange-600 scale-125 shadow-[0_0_15px_rgba(234,88,12,0.5)]' 
                  : 'bg-transparent border-gray-300 opacity-20'
              }`} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}