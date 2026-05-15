'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Toaster, toast } from 'sonner'
import { useTheme } from '@/context/ThemeContext'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'

export default function Logs() {
    const { darkMode } = useTheme()
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [showMenu, setShowMenu] = useState(false)
    const [filtroActual, setFiltroActual] = useState('TODOS')

    const logsFiltrados = logs.filter(log => {
        if (filtroActual === 'TODOS') return true
        if (filtroActual === 'PAGO') return log.accion.includes('PAGO')
        if (filtroActual === 'ABONO') return log.accion.includes('ABONO')
        return log.accion === filtroActual
    })

    useEffect(() => {
        fetchLogs()
    }, [])

    async function fetchLogs() {
        try {
            const { data, error } = await supabase
                .from('logs')
                .select('*')
                .order('fecha', { ascending: false })
                .limit(100)
            if (data) setLogs(data)
        } catch (e) {
            toast.error("Error al cargar logs")
        } finally {
            setLoading(false)
        }
    }

    const cardBg = darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-gray-100'

    return (
        <div className={`min-h-screen pb-20 transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-slate-900'}`}>
            <Toaster position="top-center" richColors />
            
            <div className="sticky top-0 z-50 backdrop-blur-xl border-b-4 border-orange-500/20 p-6 bg-inherit">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <Link href="/" className="text-[10px] font-black uppercase opacity-50 hover:opacity-100 flex items-center gap-2">
                            ← Dashboard
                        </Link>
                        <h1 className="text-3xl font-black uppercase italic bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">📜 Trazabilidad (Logs)</h1>
                    </div>
                </div>
            </div>

            <div className="p-6 max-w-4xl mx-auto space-y-4">
                <div className="flex flex-wrap gap-2 mb-6">
                    {['TODOS', 'PAGO', 'ABONO', 'APERTURA', 'CIERRE', 'AUTO_FIADO', 'CORRECCION'].map(filtro => (
                        <button 
                            key={filtro}
                            onClick={() => setFiltroActual(filtro)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtroActual === filtro ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' : 'bg-black/5 dark:bg-white/5 opacity-60'}`}
                        >
                            {filtro}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20">
                        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-[10px] font-black uppercase opacity-50 tracking-widest">Sincronizando auditoría...</p>
                    </div>
                ) : logsFiltrados.length === 0 ? (
                    <div className="text-center opacity-30 italic p-20 font-black uppercase tracking-widest border-4 border-dashed rounded-[3rem]">
                        No hay registros que coincidan 🔍
                    </div>
                ) : (
                    logsFiltrados.map((log, index) => (
                        <div 
                            key={log.id} 
                            className={`${cardBg} p-5 rounded-[2.5rem] border-2 flex gap-5 items-start transition-all hover:scale-[1.02] hover:shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className={`p-4 rounded-2xl text-2xl shadow-inner ${
                                log.accion.includes('PAGO') ? 'bg-green-500/10 text-green-600' :
                                log.accion.includes('ABONO') ? 'bg-blue-500/10 text-blue-600' :
                                log.accion === 'APERTURA' ? 'bg-amber-500/10 text-amber-600' :
                                log.accion === 'CIERRE' ? 'bg-purple-500/10 text-purple-600' :
                                log.accion === 'AUTO_FIADO' ? 'bg-cyan-500/10 text-cyan-600' : 'bg-gray-500/10 text-gray-600'
                            }`}>
                                {log.accion.includes('PAGO') ? '💰' : 
                                 log.accion.includes('ABONO') ? '💵' : 
                                 log.accion === 'APERTURA' ? '☀️' : 
                                 log.accion === 'CIERRE' ? '🌙' : 
                                 log.accion === 'AUTO_FIADO' ? '📱' : 
                                 log.accion === 'ABONO_PARQUEADERO' ? '🅿️' : '📝'}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black uppercase text-orange-600 tracking-widest bg-orange-500/5 px-2 py-0.5 rounded-full border border-orange-500/10">
                                        👤 {log.usuario}
                                    </span>
                                    <div className="text-right">
                                        <p className="text-[9px] opacity-40 font-bold uppercase">{new Date(log.fecha).toLocaleDateString()}</p>
                                        <p className="text-[9px] opacity-40 font-bold uppercase">{new Date(log.fecha).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <h3 className="text-sm font-black uppercase italic tracking-tighter mb-1">{log.accion.replace('_', ' ')}</h3>
                                <p className="text-[11px] font-medium opacity-70 leading-relaxed bg-black/5 dark:bg-white/5 p-3 rounded-2xl border-l-4 border-orange-500/50">{log.detalle}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Navbar onMenuClick={() => setShowMenu(true)} />
            <Sidebar 
                isOpen={showMenu} 
                onClose={() => setShowMenu(false)} 
                onAction={(type) => {
                    toast.info("Ve al Inicio para realizar esta acción")
                }}
            />
        </div>
    )
}
