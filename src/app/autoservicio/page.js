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
        setCarrito([...carrito, p])
        toast.success(`Añadido: ${p.nombre}`)
    }

    const total = carrito.reduce((acc, p) => acc + Number(p.precio), 0)

    async function enviarSolicitud() {
        if (carrito.length === 0) return toast.error("Elige productos primero")
        if (!isNuevo && !clienteId) return toast.error("Selecciona tu nombre o regístrate")
        if (isNuevo && (!nombreCliente || !apodoCliente)) return toast.error("Completa tus datos de registro")
        
        setLoading(true)
        try {
            const detalleStr = carrito.map(p => p.nombre).join(', ')
            let targetClienteId = clienteId
            let finalNombre = ""

            // 1. Si es nuevo, crearlo con estado pendiente
            if (isNuevo) {
                const { data: newCli, error: cliErr } = await supabase.from('clientes').insert([{
                    nombre: nombreCliente.toUpperCase(),
                    apodo: apodoCliente.toUpperCase(),
                    notas: 'PENDIENTE_APROBACION'
                }]).select().single()
                
                if (cliErr) throw cliErr
                targetClienteId = newCli.id
                finalNombre = apodoCliente
            } else {
                finalNombre = listaClientes.find(c => c.id === clienteId)?.apodo || ""
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
            <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6 text-center animate-fadeIn">
                <div className="text-center p-10 animate-bounce">
                    <span className="text-8xl block mb-6">🥟✨</span>
                    <h2 className="text-4xl font-black uppercase text-purple-600 mb-2">¡LISTO, {nombreCliente.toUpperCase()}!</h2>
                    <p className="font-bold opacity-60 mb-6 uppercase">Muestra esta pantalla al vendedor</p>
                    <div className="bg-purple-600 text-white p-6 rounded-[2rem] shadow-2xl mb-8">
                        <p className="text-[10px] font-black uppercase opacity-70 mb-1">Total a registrar</p>
                        <p className="text-5xl font-black">${total.toLocaleString()}</p>
                    </div>
                    <button onClick={() => { setEnviado(false); setCarrito([]); setNombreCliente(''); }} className="text-purple-600 font-black underline uppercase text-sm">Hacer otro pedido</button>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen p-4 pb-32 transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-slate-900'}`}>
            <Toaster position="top-center" richColors />
            
            <Navbar onMenuClick={() => setShowMenu(true)} />
            <Sidebar 
                isOpen={showMenu} 
                onClose={() => setShowMenu(false)} 
                onAction={() => toast.info("Acción disponible en Inicio")}
            />

            <div className="flex justify-between items-center mb-8 pt-8">
                <div className="text-left">
                    <h1 className="text-3xl font-black uppercase italic text-purple-600 leading-none">📱 AUTOSERVICIO QR</h1>
                    <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">Elige lo que vas a consumir</p>
                </div>
            </div>

            <section className="mb-8 space-y-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-purple-100 dark:border-slate-800 shadow-sm">
                    <label className="block text-[10px] font-black uppercase opacity-40 mb-2 px-2">¿Quién eres?</label>
                    <select 
                        value={isNuevo ? 'nuevo' : clienteId}
                        onChange={e => {
                            if (e.target.value === 'nuevo') {
                                setIsNuevo(true)
                                setClienteId('')
                            } else {
                                setIsNuevo(false)
                                setClienteId(e.target.value)
                            }
                        }}
                        className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-slate-800 outline-none focus:border-purple-500 transition-all font-black uppercase text-sm bg-transparent"
                    >
                        <option value="">-- SELECCIONA TU NOMBRE --</option>
                        {listaClientes.map(c => (
                            <option key={c.id} value={c.id}>{c.apodo}</option>
                        ))}
                        <option value="nuevo" className="text-purple-600">➕ NO ESTOY EN LA LISTA (REGISTRARME)</option>
                    </select>
                </div>

                {isNuevo && (
                    <div className="bg-purple-600/5 p-6 rounded-[2.5rem] border-2 border-purple-500/20 space-y-4 animate-fadeIn">
                        <p className="text-[10px] font-black uppercase text-purple-600 text-center mb-2">Registro de Nuevo Cliente</p>
                        <input 
                            type="text" 
                            value={nombreCliente}
                            onChange={e => setNombreCliente(e.target.value)}
                            placeholder="Nombre Completo"
                            className="w-full p-4 rounded-2xl border-2 border-white outline-none focus:border-purple-500 transition-all font-black uppercase text-sm"
                        />
                        <input 
                            type="text" 
                            value={apodoCliente}
                            onChange={e => setApodoCliente(e.target.value)}
                            placeholder="Apodo (Cómo te conocen)"
                            className="w-full p-4 rounded-2xl border-2 border-white outline-none focus:border-purple-500 transition-all font-black uppercase text-sm"
                        />
                        <p className="text-[9px] font-bold text-center opacity-50 uppercase">Tu registro será aprobado por el vendedor en un momento</p>
                    </div>
                )}
            </section>

            <div className="grid grid-cols-2 gap-4">
                {productos.map(p => (
                    <button 
                        key={p.id}
                        onClick={() => agregarAlCarrito(p)}
                        className="bg-white p-4 rounded-3xl border-2 border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:border-purple-500 transition-all active:scale-95"
                    >
                        <span className="text-3xl">🥟</span>
                        <span className="text-[10px] font-black uppercase text-center leading-none">{p.nombre}</span>
                        <span className="text-sm font-black text-purple-600">${Number(p.precio).toLocaleString()}</span>
                    </button>
                ))}
            </div>

            {/* CARRITO FLOTANTE */}
            <div className="fixed bottom-6 left-6 right-6 bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl animate-slideUp">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className="text-[10px] font-black uppercase opacity-50">Total Pedido</p>
                        <p className="text-2xl font-black">${total.toLocaleString()}</p>
                    </div>
                    <button onClick={() => setCarrito([])} className="text-[10px] font-black uppercase opacity-50 underline">Vaciar</button>
                </div>
                <button 
                    onClick={enviarSolicitud}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl font-black uppercase italic shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? 'Enviando...' : 'Confirmar Pedido'}
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
