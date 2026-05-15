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
                {loading ? (
                    <div className="flex justify-center p-20 animate-pulse text-4xl">🔄</div>
                ) : logs.length === 0 ? (
                    <div className="text-center opacity-50 italic p-20">No hay registros de actividad.</div>
                ) : (
                    logs.map(log => (
                        <div key={log.id} className={`${cardBg} p-4 rounded-2xl border-2 flex gap-4 items-start transition-all hover:scale-[1.01]`}>
                            <div className="bg-blue-500/10 p-3 rounded-xl text-2xl">
                                {log.accion === 'APERTURA' ? '☀️' : 
                                 log.accion === 'CIERRE' ? '🌙' : 
                                 log.accion === 'AUTO_FIADO' ? '📱' : 
                                 log.accion === 'ABONO_PARQUEADERO' ? '🅿️' : '📝'}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">{log.usuario}</span>
                                    <span className="text-[9px] opacity-40 font-bold">{new Date(log.fecha).toLocaleString()}</span>
                                </div>
                                <p className="text-xs font-black uppercase italic">{log.accion}</p>
                                <p className="text-[11px] font-medium opacity-70 mt-1">{log.detalle}</p>
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
