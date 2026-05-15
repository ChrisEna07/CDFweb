'use client'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'

export default function Sidebar({ isOpen, onClose, onAction, children }) {
  const { darkMode } = useTheme()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
      <div 
        className={`w-full max-w-lg rounded-[3rem] p-8 shadow-2xl animate-slideUp mb-20 overflow-y-auto max-h-[90vh] ${darkMode ? 'bg-slate-900 border-2 border-slate-700 text-white' : 'bg-white'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black uppercase italic italic text-orange-600">🚀 Funciones</h2>
            <button onClick={onClose} className="bg-black/10 w-10 h-10 rounded-full font-bold">✕</button>
        </div>

        <div className="grid grid-cols-1 gap-4">
            <Link href="/autoservicio" onClick={onClose} className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-[2rem] font-black uppercase italic shadow-lg transition-all hover:scale-[1.02]">
                <span className="flex items-center gap-3">📱 Autoservicio QR</span>
                <span>→</span>
            </Link>
            
            <button onClick={() => { onAction('CIERRE'); onClose(); }} className="flex items-center justify-between p-5 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-[2rem] font-black uppercase italic shadow-lg transition-all hover:scale-[1.02]">
                <span className="flex items-center gap-3">📝 Cierre Manual</span>
                <span>→</span>
            </button>

            <button onClick={() => { onAction('PARQUEADERO'); onClose(); }} className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-[2rem] font-black uppercase italic shadow-lg transition-all hover:scale-[1.02]">
                <span className="flex items-center gap-3">🅿️ Control Parqueadero</span>
                <span>→</span>
            </button>

            <button onClick={() => { onAction('PIPETAS'); onClose(); }} className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-[2rem] font-black uppercase italic shadow-lg transition-all hover:scale-[1.02]">
                <span className="flex items-center gap-3">🔥 Control Pipetas</span>
                <span>→</span>
            </button>

            <Link href="/finanzas" onClick={onClose} className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-[2rem] font-black uppercase italic shadow-lg transition-all hover:scale-[1.02]">
                <span className="flex items-center gap-3">📈 Ver Finanzas</span>
                <span>→</span>
            </Link>
        </div>

        {children}
      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100px); } to { transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  )
}
