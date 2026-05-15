'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Toaster, toast } from 'sonner'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { useTheme } from '@/context/ThemeContext'

export default function Autoservicio() {
    const [productos, setProductos] = useState([])
    const [carrito, setCarrito] = useState([])
    const [nombreCliente, setNombreCliente] = useState('')
    const [enviado, setEnviado] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const { darkMode } = useTheme()

    useEffect(() => {
        fetchProductos()
    }, [])

    async function fetchProductos() {
        const { data } = await supabase.from('productos').select('*').order('nombre')
        if (data) setProductos(data)
    }

    const agregarAlCarrito = (p) => {
        setCarrito([...carrito, p])
        toast.success(`Añadido: ${p.nombre}`)
    }

    const total = carrito.reduce((acc, p) => acc + Number(p.precio), 0)

    async function enviarSolicitud() {
        if (!nombreCliente || carrito.length === 0) return toast.error("Ingresa tu nombre y elige productos")
        setLoading(true)
        try {
            const detalleStr = carrito.map(p => p.nombre).join(', ')
            
            // 1. Buscar si el cliente existe (por apodo o nombre)
            const { data: cliente, error: searchError } = await supabase
                .from('clientes')
                .select('id, apodo')
                .or(`apodo.ilike.${nombreCliente},nombre.ilike.${nombreCliente}`)
                .maybeSingle()

            if (cliente) {
                // 2. Si existe, registrar el fiado automáticamente
                const { error: fiadoError } = await supabase.from('fiados').insert([{
                    cliente_id: cliente.id,
                    monto_total: total,
                    estado: 'pendiente',
                    creado_el: new Date().toISOString()
                    // Si tu tabla fiados tiene columna 'detalle', podrías guardarlo aquí
                }])
                
                if (fiadoError) throw fiadoError
                
                await supabase.from('logs').insert([{
                    usuario: "CLIENTE_QR",
                    accion: "AUTO_FIADO",
                    detalle: `Fiado automático para ${cliente.apodo}: ${detalleStr}. Total: $${total}`,
                    fecha: new Date().toISOString()
                }])

                setEnviado(true)
                toast.success("¡Fiado registrado con éxito!")
            } else {
                // 3. Si no existe, mostrar mensaje de advertencia
                toast.error("Tu nombre no está registrado. Dile al vendedor que cree tu perfil.", {
                    duration: 6000,
                    style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' }
                })
                
                await supabase.from('logs').insert([{
                    usuario: "CLIENTE_QR",
                    accion: "INTENTO_FALLIDO_FIADO",
                    detalle: `Nombre no encontrado: ${nombreCliente}. Intentó fiar: ${detalleStr}`,
                    fecha: new Date().toISOString()
                }])
            }
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

            <section className="mb-8">
                <input 
                    type="text" 
                    value={nombreCliente}
                    onChange={e => setNombreCliente(e.target.value)}
                    placeholder="¿Cuál es tu nombre/apodo?"
                    className="w-full p-5 rounded-2xl border-4 border-purple-100 outline-none focus:border-purple-500 transition-all font-black uppercase text-center text-lg"
                />
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
            
            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
                .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            `}</style>
        </div>
    )
}
