'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Toaster, toast } from 'sonner'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { useTheme } from '@/context/ThemeContext'

export default function Finanzas() {
    const { darkMode } = useTheme()
    const [cierres, setCierres] = useState([])
    const [loading, setLoading] = useState(true)
    const [vista, setVista] = useState('diario') // 'diario', 'semanal', 'mensual'
    const [showMenu, setShowMenu] = useState(false)

    useEffect(() => {
        fetchCierres()
    }, [])

    async function fetchCierres() {
        try {
            const { data, error } = await supabase
                .from('cierres_diarios')
                .select('*')
                .order('fecha', { ascending: false })
            if (data) setCierres(data)
        } catch (e) {
            toast.error("Error al cargar datos financieros")
        } finally {
            setLoading(false)
        }
    }

    const totalIngresos = cierres.reduce((acc, c) => acc + (c.total_dia || 0), 0)
    const totalGastos = cierres.reduce((acc, c) => acc + (c.total_gastos || 0), 0)
    const totalGanancia = cierres.reduce((acc, c) => acc + (c.ganancia_neta || 0), 0)

    const cardBg = darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-gray-100'

    return (
        <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-slate-900'}`}>
            <Toaster position="top-center" richColors />
            
            <div className="sticky top-0 z-50 backdrop-blur-xl border-b-4 border-orange-500/20 p-6 bg-inherit">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-black uppercase italic bg-gradient-to-r from-emerald-500 to-emerald-400 bg-clip-text text-transparent">📈 Módulo Finanzas</h1>
                    <p className="text-[10px] font-black uppercase opacity-40 mt-1 tracking-widest">Control de caja y ganancias reales</p>
                </div>
            </div>

            <div className="p-6 max-w-4xl mx-auto space-y-8">
                {/* RESUMEN GLOBAL */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`${cardBg} p-8 rounded-[3rem] border-2 shadow-xl text-center transform transition-all hover:scale-105`}>
                        <p className="text-[10px] font-black uppercase opacity-50 tracking-widest mb-2 text-emerald-500">Total Ingresos</p>
                        <p className="text-4xl font-black italic">${totalIngresos.toLocaleString()}</p>
                    </div>
                    <div className={`${cardBg} p-8 rounded-[3rem] border-2 shadow-xl text-center transform transition-all hover:scale-105 border-red-500/20`}>
                        <p className="text-[10px] font-black uppercase opacity-50 tracking-widest mb-2 text-red-500">Total Gastos</p>
                        <p className="text-4xl font-black italic text-red-600">${totalGastos.toLocaleString()}</p>
                    </div>
                    <div className={`${cardBg} p-8 rounded-[3rem] border-2 shadow-xl text-center transform transition-all hover:scale-105 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-transparent`}>
                        <p className="text-[10px] font-black uppercase opacity-50 tracking-widest mb-2 text-emerald-600">Ganancia Neta</p>
                        <p className="text-4xl font-black italic text-emerald-500">${totalGanancia.toLocaleString()}</p>
                    </div>
                </div>

                {/* LISTADO DE CIERRES */}
                <div className="space-y-4">
                    <h2 className="text-xl font-black uppercase italic opacity-60">📜 Historial de Cierres Diarios</h2>
                    {loading ? (
                        <div className="flex justify-center p-20 animate-pulse">
                            <span className="text-4xl">🔄</span>
                        </div>
                    ) : cierres.length === 0 ? (
                        <div className={`${cardBg} p-12 rounded-[3rem] border-2 border-dashed text-center opacity-50 italic`}>
                            No hay registros financieros todavía. Realiza tu primer cierre desde el dashboard.
                        </div>
                    ) : (
                        cierres.map(c => (
                            <div key={c.id} className={`${cardBg} p-6 rounded-[2.5rem] border-2 transition-all hover:border-emerald-500/30 group`}>
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">{new Date(c.fecha).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <div className="flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                                <span className="text-[10px] font-black">Caja: ${c.total_dia?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                                                <span className="text-[10px] font-black">Gastos: ${c.total_gastos?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                                <span className="text-[10px] font-black">Recaudos: ${c.recaudos_fiados?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black uppercase opacity-40 mb-1">Ganancia Real Neta</p>
                                        <p className="text-3xl font-black text-emerald-600">${c.ganancia_neta?.toLocaleString()}</p>
                                    </div>
                                </div>
                                
                                {/* DETALLE EXPANDIBLE (SIEMPRE VISIBLE AL GRUPO) */}
                                <div className="mt-6 pt-6 border-t border-dashed border-black/10 dark:border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-2xl">
                                        <p className="text-[8px] font-black uppercase opacity-50 mb-1">⚖️ Comparativa Venta</p>
                                        <p className="text-[10px] font-bold">Esperado: <span className="text-blue-500">${c.produccion_esperada?.toLocaleString()}</span></p>
                                        <p className="text-[10px] font-bold">Efectivo: <span className="text-green-600">${c.total_ventas_efectivo?.toLocaleString()}</span></p>
                                    </div>
                                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-2xl">
                                        <p className="text-[8px] font-black uppercase opacity-50 mb-1">🥟 Producción</p>
                                        <p className="text-[10px] font-bold">{c.kg_masa}kg Masa</p>
                                        <p className="text-[10px] font-bold">({c.empanadas_estimadas} emp.)</p>
                                    </div>
                                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-2xl">
                                        <p className="text-[8px] font-black uppercase opacity-50 mb-1">🥤 Extras</p>
                                        <p className="text-[10px] font-bold">Jugos: {c.jugos_cantidad}</p>
                                        <p className="text-[10px] font-bold">Tortas: {c.tortas_cantidad}</p>
                                    </div>
                                    <div className="bg-red-500/5 p-3 rounded-2xl border border-red-500/10">
                                        <p className="text-[8px] font-black uppercase opacity-50 mb-1">💸 Gastos Totales</p>
                                        <p className="text-lg font-black text-red-600">${c.total_gastos?.toLocaleString()}</p>
                                    </div>
                                </div>
                                
                                {/* DESGLOSE DE GASTOS */}
                                <div className="mt-4 p-4 bg-black/5 dark:bg-white/5 rounded-2xl hidden group-hover:block animate-fadeIn">
                                    <p className="text-[9px] font-black uppercase opacity-40 mb-3 tracking-widest border-b pb-2">💸 Desglose de Gastos del Día</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4">
                                        {Object.entries(c).filter(([k,v]) => k.startsWith('gastos_') && v > 0).map(([k,v]) => (
                                            <div key={k} className="flex justify-between items-center text-[10px]">
                                                <span className="opacity-60 uppercase font-bold">{k.replace('gastos_', '')}:</span>
                                                <span className="font-black">${v.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <Navbar onMenuClick={() => setShowMenu(true)} />
            <Sidebar 
                isOpen={showMenu} 
                onClose={() => setShowMenu(false)} 
                onAction={() => toast.info("Acción disponible en Inicio")}
            />

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    )
}
