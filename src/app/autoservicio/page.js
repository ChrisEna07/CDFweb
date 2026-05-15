'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Toaster, toast } from 'sonner'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { useTheme } from '@/context/ThemeContext'
import { QRCodeCanvas } from 'qrcode.react'

export default function Autoservicio() {
    const [productos, setProductos] = useState([])
    const [carrito, setCarrito] = useState([])
    const [nombreCliente, setNombreCliente] = useState('')
    const [apodoCliente, setApodoCliente] = useState('')
    const [listaClientes, setListaClientes] = useState([])
    const [clienteId, setClienteId] = useState('')
    const [isNuevo, setIsNuevo] = useState(false)
    const [enviado, setEnviado] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const { darkMode } = useTheme()

    const [busquedaCliente, setBusquedaCliente] = useState('')
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.search-container')) {
                setMostrarSugerencias(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    useEffect(() => {
        fetchProductos()
    }, [])

    async function fetchProductos() {
        const [resProd, resCli] = await Promise.all([
            supabase.from('productos').select('*').order('nombre'),
            supabase.from('clientes').select('id, apodo, nombre').order('apodo')
        ])
        if (resProd.data) setProductos(resProd.data)
        if (resCli.data) setListaClientes(resCli.data)
    }

    const agregarAlCarrito = (p) => {
        setCarrito(prev => {
            const existe = prev.find(item => item.id === p.id)
            if (existe) {
                return prev.map(item => item.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item)
            }
            return [...prev, { ...p, cantidad: 1 }]
        })
        toast.success(`Añadido: ${p.nombre}`)
    }

    const ajustarCantidad = (id, delta) => {
        setCarrito(prev => prev.map(item => {
            if (item.id === id) {
                const nuevaCant = Math.max(0, item.cantidad + delta)
                return { ...item, cantidad: nuevaCant }
            }
            return item
        }).filter(item => item.cantidad > 0))
    }

    const total = carrito.reduce((acc, p) => acc + (Number(p.precio) * p.cantidad), 0)

    const clientesFiltrados = listaClientes.filter(c => 
        c.apodo.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
        (c.nombre && c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()))
    )

    const seleccionarCliente = (c) => {
        setClienteId(c.id)
        setBusquedaCliente(c.apodo)
        setIsNuevo(false)
        setMostrarSugerencias(false)
        toast.success(`Hola de nuevo, ${c.apodo} 👋`)
    }

    async function enviarSolicitud() {
        if (carrito.length === 0) return toast.error("Elige productos primero")
        
        let finalClienteId = clienteId
        let finalNombre = busquedaCliente

        // Lógica de detección inteligente:
        // Si no hay clienteId seleccionado, buscamos si el nombre ingresado coincide con uno existente
        if (!finalClienteId) {
            const coincidencia = listaClientes.find(c => 
                c.apodo.toLowerCase() === busquedaCliente.trim().toLowerCase()
            )
            if (coincidencia) {
                finalClienteId = coincidencia.id
                finalNombre = coincidencia.apodo
            }
        }

        if (!finalClienteId && !isNuevo) {
            return toast.error("No te encontré en la lista. Por favor regístrate abajo.")
        }

        if (isNuevo && (!nombreCliente || !apodoCliente)) return toast.error("Completa tus datos de registro")
        
        setLoading(true)
        try {
            const detalleStr = carrito.map(p => `${p.cantidad}x ${p.nombre}`).join(', ')
            let targetClienteId = finalClienteId

            // 1. Si es nuevo y no hubo coincidencia, crearlo
            if (isNuevo && !targetClienteId) {
                const { data: newCli, error: cliErr } = await supabase.from('clientes').insert([{
                    nombre: nombreCliente.toUpperCase(),
                    apodo: apodoCliente.toUpperCase(),
                    notas: 'PENDIENTE_APROBACION'
                }]).select().single()
                
                if (cliErr) throw cliErr
                targetClienteId = newCli.id
                finalNombre = apodoCliente
            }

            // 2. Registrar el fiado
            const { error: fiadoError } = await supabase.from('fiados').insert([{
                cliente_id: targetClienteId,
                monto_total: total,
                estado: 'pendiente',
                creado_el: new Date().toISOString(),
                notas: isNuevo ? 'REGISTRO PENDIENTE' : ''
            }])
            
            if (fiadoError) throw fiadoError
            
            await supabase.from('logs').insert([{
                usuario: "CLIENTE_QR",
                accion: "AUTO_FIADO",
                detalle: `Fiado de ${finalNombre.toUpperCase()}${isNuevo ? ' (NUEVO REGISTRO)' : ''}: ${detalleStr}. Total: $${total}`,
                fecha: new Date().toISOString()
            }])

            setEnviado(true)
            toast.success("¡Solicitud enviada con éxito!")
        } catch (e) {
            console.error(e)
            toast.error("Error al procesar la solicitud")
        } finally {
            setLoading(false)
        }
    }

    if (enviado) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-6 text-center animate-fadeIn ${darkMode ? 'bg-slate-950' : 'bg-orange-50'}`}>
                <div className="text-center p-10">
                    <span className="text-8xl block mb-6 animate-bounce">🥟✨</span>
                    <h2 className="text-4xl font-black uppercase text-purple-600 mb-2">¡LISTO, {busquedaCliente.toUpperCase()}!</h2>
                    <p className="font-bold opacity-60 mb-6 uppercase text-xs">Tus productos están siendo preparados</p>
                    <div className="bg-purple-600 text-white p-6 rounded-[2.5rem] shadow-2xl mb-8">
                        <p className="text-[10px] font-black uppercase opacity-70 mb-1">Total Pedido</p>
                        <p className="text-5xl font-black">${total.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => { setEnviado(false); setCarrito([]); setBusquedaCliente(''); setClienteId(''); }} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase shadow-lg active:scale-95 transition-all">Hacer otro pedido</button>
                        <button onClick={() => { window.location.href = '/'; }} className="text-purple-600 font-black underline uppercase text-sm opacity-50 hover:opacity-100 transition-opacity">Finalizar y Salir</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen p-4 pb-48 transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-slate-900'}`}>
            <Toaster position="top-center" richColors />
            
            <Navbar onMenuClick={() => setShowMenu(true)} />
            <Sidebar 
                isOpen={showMenu} 
                onClose={() => setShowMenu(false)} 
                onAction={() => toast.info("Acción disponible en Inicio")}
            />

            <div className="flex justify-between items-center mb-8 pt-8">
                <div className="text-left">
                    <h1 className="text-3xl font-black uppercase italic text-purple-600 leading-none">📱 AUTOSERVICIO</h1>
                    <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">Elige lo que vas a consumir</p>
                </div>
            </div>

            <section className="mb-8 relative search-container">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border-2 border-purple-100 dark:border-slate-800 shadow-xl">
                    <label className="block text-[10px] font-black uppercase opacity-40 mb-3 px-2">¿Cuál es tu nombre?</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={busquedaCliente}
                            onChange={e => {
                                setBusquedaCliente(e.target.value)
                                setClienteId('')
                                setMostrarSugerencias(true)
                                setIsNuevo(false)
                            }}
                            onFocus={() => setMostrarSugerencias(true)}
                            placeholder="ESCRIBE TU NOMBRE O APODO..."
                            className={`w-full p-4 rounded-2xl border-2 outline-none focus:border-purple-500 transition-all font-black uppercase text-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-inner'}`}
                        />
                        {busquedaCliente && !clienteId && !isNuevo && (
                            <button 
                                onClick={() => setIsNuevo(true)}
                                className="mt-3 w-full py-3 bg-purple-600/10 text-purple-600 rounded-xl text-[10px] font-black uppercase border-2 border-dashed border-purple-200"
                            >
                                ➕ NO APAREZCO EN LA LISTA, QUIERO REGISTRARME
                            </button>
                        )}
                    </div>

                    {mostrarSugerencias && busquedaCliente && !clienteId && (
                        <div className={`absolute left-0 right-0 mt-2 rounded-[2rem] border-2 shadow-2xl z-[100] max-h-60 overflow-y-auto p-2 animate-fadeIn ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-purple-50'}`}>
                            {clientesFiltrados.length > 0 ? (
                                clientesFiltrados.map(c => (
                                    <button 
                                        key={c.id}
                                        onClick={() => seleccionarCliente(c)}
                                        className="w-full text-left p-4 hover:bg-purple-600 hover:text-white rounded-2xl transition-all font-black uppercase text-xs flex justify-between items-center group"
                                    >
                                        <span>{c.apodo}</span>
                                        <span className="opacity-40 group-hover:opacity-100 text-[8px] font-bold">SELECCIONAR →</span>
                                    </button>
                                ))
                            ) : (
                                <div className="p-4 text-center">
                                    <p className="text-[10px] font-black opacity-40 uppercase mb-2">No se encontró a "{busquedaCliente}"</p>
                                    <button 
                                        onClick={() => { setIsNuevo(true); setMostrarSugerencias(false); }}
                                        className="text-purple-600 font-black text-xs uppercase underline"
                                    >
                                        Regístrate aquí
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {isNuevo && (
                    <div className="mt-4 bg-purple-600/5 p-6 rounded-[2.5rem] border-2 border-purple-500/20 space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-black uppercase text-purple-600">Registro de Nuevo Cliente</p>
                            <button onClick={() => setIsNuevo(false)} className="text-[10px] font-bold opacity-40 uppercase underline">Cancelar</button>
                        </div>
                        <input 
                            type="text" 
                            value={nombreCliente}
                            onChange={e => setNombreCliente(e.target.value)}
                            placeholder="Nombre Completo"
                            className={`w-full p-4 rounded-2xl border-2 outline-none focus:border-purple-500 transition-all font-black uppercase text-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}
                        />
                        <input 
                            type="text" 
                            value={apodoCliente}
                            onChange={e => setApodoCliente(e.target.value)}
                            placeholder="Apodo (Cómo te conocen)"
                            className={`w-full p-4 rounded-2xl border-2 outline-none focus:border-purple-500 transition-all font-black uppercase text-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}
                        />
                        <p className="text-[9px] font-bold text-center opacity-50 uppercase">Tu registro será aprobado por el vendedor en un momento</p>
                    </div>
                )}
            </section>

            <div className="grid grid-cols-2 gap-4">
                {productos.map(p => {
                    const itemEnCarrito = carrito.find(item => item.id === p.id)
                    return (
                        <div 
                            key={p.id}
                            className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all ${darkMode ? 'bg-slate-900 border-slate-800 shadow-lg shadow-purple-500/5' : 'bg-white border-gray-100 shadow-sm'}`}
                        >
                            <span className="text-4xl mb-1">🥟</span>
                            <span className="text-[11px] font-black uppercase text-center leading-tight h-8 flex items-center">{p.nombre}</span>
                            <span className="text-sm font-black text-purple-600">${Number(p.precio).toLocaleString()}</span>
                            
                            <div className="flex items-center gap-3 mt-2 bg-purple-500/10 p-1 rounded-2xl w-full justify-between">
                                <button 
                                    onClick={() => ajustarCantidad(p.id, -1)}
                                    className="w-8 h-8 flex items-center justify-center bg-purple-600 text-white rounded-xl font-black transition-all active:scale-75 disabled:opacity-30"
                                    disabled={!itemEnCarrito}
                                >-</button>
                                <span className="font-black text-sm">{itemEnCarrito?.cantidad || 0}</span>
                                <button 
                                    onClick={() => agregarAlCarrito(p)}
                                    className="w-8 h-8 flex items-center justify-center bg-purple-600 text-white rounded-xl font-black transition-all active:scale-75"
                                >+</button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* CARRITO FLOTANTE PREMIUM */}
            <div className={`fixed bottom-6 left-6 right-6 rounded-[2.5rem] p-6 shadow-2xl animate-slideUp z-[200] ${darkMode ? 'bg-slate-900/90 border-2 border-purple-500/20 backdrop-blur-xl' : 'bg-slate-950/95 backdrop-blur-md'}`}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-purple-500/40">🛒</div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-50 text-white">Total Pedido</p>
                            <p className="text-2xl font-black text-white">${total.toLocaleString()}</p>
                        </div>
                    </div>
                    <button onClick={() => setCarrito([])} className="text-[10px] font-black uppercase opacity-50 text-white underline hover:opacity-100 transition-opacity">Vaciar Carrito</button>
                </div>
                <button 
                    onClick={enviarSolicitud}
                    disabled={loading || carrito.length === 0}
                    className="w-full py-5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl font-black uppercase italic shadow-xl shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                >
                    {loading ? 'Procesando...' : '🔥 Confirmar Mi Pedido'}
                </button>
            </div>
            
            {/* ✅ QR PARA COMPARTIR (NUEVO) */}
            <div className="mt-12 flex flex-col items-center opacity-30 hover:opacity-100 transition-opacity pb-20">
                <p className="text-[10px] font-black uppercase mb-3">Compartir este menú</p>
                <div className="bg-white p-3 rounded-2xl">
                    <QRCodeCanvas value="https://cd-fweb.vercel.app/autoservicio" size={80} />
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
                .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            `}</style>
        </div>
    )
}
