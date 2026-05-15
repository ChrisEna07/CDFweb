'use client'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { usePathname } from 'next/navigation'

export default function Navbar({ onMenuClick }) {
  const { darkMode } = useTheme()
  const pathname = usePathname()

  // No mostrar navbar en autoservicio si es para clientes externos
  if (pathname === '/autoservicio') return null

  return (
    <nav className={`${darkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-orange-200'} backdrop-blur-xl fixed bottom-6 left-4 right-4 border-4 rounded-[3rem] p-3 flex justify-around items-center z-50 shadow-2xl animate-slideUpSmooth`}>
      <Link href="/" className={`flex flex-col items-center group ${pathname === '/' ? 'text-orange-600' : 'opacity-60'}`}>
        <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🏠</span>
        <span className="text-[8px] font-black uppercase">Inicio</span>
      </Link>
      <Link href="/clientes" className={`flex flex-col items-center group ${pathname === '/clientes' ? 'text-orange-600' : 'opacity-60'}`}>
        <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">👥</span>
        <span className="text-[8px] font-black uppercase">Deudores</span>
      </Link>
      
      <Link href="/fiados/nuevo" className="bg-gradient-to-r from-orange-600 to-orange-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl -mt-12 border-[5px] border-orange-50 dark:border-slate-800 transition-all duration-300 hover:scale-110 active:scale-95">
        <span className="text-3xl font-bold">+</span>
      </Link>

      <Link href="/logs" className={`flex flex-col items-center group ${pathname === '/logs' ? 'text-orange-600' : 'opacity-60'}`}>
        <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">📜</span>
        <span className="text-[8px] font-black uppercase">Logs</span>
      </Link>
      
      <button onClick={onMenuClick} className="flex flex-col items-center group opacity-60 hover:opacity-100 transition-opacity">
        <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">☰</span>
        <span className="text-[8px] font-black uppercase">Menú</span>
      </button>
    </nav>
  )
}
