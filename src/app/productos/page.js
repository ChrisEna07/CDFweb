'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import { toast } from 'sonner'

export default function GestionProductos() {
  const { darkMode } = useTheme()
  const [productos, setProductos] = useState([])
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [cargando, setCargando] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => { fetchProductos() }, [])

  async function fetchProductos() {
    const { data } = await supabase.from('productos').select('*').order('nombre')
    setProductos(data || [])
  }

  const agregarProducto = async (e) => {
    e.preventDefault()
    if (!nombre || !precio) return toast.error("Escribe nombre y precio")
    
    setCargando(true)
    const { error } = await supabase.from('productos').insert([{ 
      nombre: nombre.toUpperCase(), 
      precio: Number(precio) 
    }])
    
    if (!error) {
      toast.success(`${nombre} agregado al menú ✨`)
      setNombre(''); setPrecio('')
      fetchProductos()
    } else {
      toast.error("Error al guardar")
    }
    setCargando(false)
  }

  const eliminarProducto = async (id, nombreProducto) => {
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (!error) {
      toast.success(`${nombreProducto} eliminado del menú`)
      fetchProductos()
    } else {
      toast.error("No se puede borrar: ya está en una cuenta vieja")
    }
  }

  // Filtrar productos por búsqueda
  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const bgMain = darkMode 
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white' 
    : 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 text-black'
  
  const cardBg = darkMode 
    ? 'bg-slate-900/80 border-slate-700 backdrop-blur-sm hover:shadow-xl transition-all duration-300' 
    : 'bg-white/80 border-orange-200 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'
  
  const inputStyle = `w-full p-4 rounded-2xl border-2 font-black transition-all duration-300 focus:ring-2 focus:ring-orange-500/50 ${
    darkMode 
      ? 'bg-slate-900/80 border-slate-700 text-white focus:border-orange-500' 
      : 'bg-white/80 border-gray-200 text-black focus:border-orange-500 shadow-md'
  }`

  return (
    <div className={`min-h-screen p-6 pb-40 transition-all duration-500 ${bgMain}`}>
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* HEADER MEJORADO */}
        <div className="flex items-center justify-between">
          <Link 
            href="/fiados/nuevo" 
            className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-5 py-2.5 rounded-xl font-black shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            ← VOLVER AL PEDIDO
          </Link>
          <div className="bg-orange-500/20 px-4 py-2 rounded-full backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase italic">Configuración del Menú</p>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-black italic uppercase bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Configurar Menú 🍴
          </h1>
          <p className="text-[10px] font-black uppercase opacity-50 mt-2 tracking-widest">
            Gestiona tus productos y precios
          </p>
        </div>

        {/* FORMULARIO PARA REGISTRAR PRODUCTOS NUEVOS MEJORADO */}
        <form onSubmit={agregarProducto} className={`${cardBg} p-6 rounded-[2rem] border-2 space-y-5 transition-all duration-300 hover:shadow-2xl`}>
          <div className="flex items-center gap-2 border-b-2 border-orange-500/30 pb-2">
            <span className="text-2xl">📝</span>
            <p className="font-black text-sm uppercase opacity-70">Registrar nuevo producto</p>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-40">🏷️</span>
              <input 
                placeholder="NOMBRE (EJ: TINTO, EMPANADA, GASEOSA)"
                value={nombre} 
                onChange={e => setNombre(e.target.value)}
                className={`${inputStyle} pl-12 uppercase`}
              />
            </div>
            
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-40">💰</span>
              <input 
                type="number" 
                placeholder="PRECIO (EJ: 1000, 2500, 5000)"
                value={precio} 
                onChange={e => setPrecio(e.target.value)}
                className={`${inputStyle} pl-12`}
              />
            </div>
          </div>
          
          <button 
            disabled={cargando} 
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white p-5 rounded-2xl font-black uppercase shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {cargando ? (
              <>
                <span className="animate-spin">⏳</span> GUARDANDO...
              </>
            ) : (
              <>
                ➕ GUARDAR EN EL MENÚ
              </>
            )}
          </button>
        </form>

        {/* BUSCADOR DE PRODUCTOS */}
        <div className="relative group">
          <input 
            type="text"
            placeholder="🔍 Buscar producto en el menú..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`${inputStyle} pl-12`}
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-40">🔍</span>
          {busqueda && (
            <button 
              onClick={() => setBusqueda('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm opacity-50 hover:opacity-100"
            >
              ✕
            </button>
          )}
        </div>

        {/* LISTA ACTUAL MEJORADA */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="font-black text-sm uppercase opacity-70 flex items-center gap-2">
              <span>🍽️</span> Productos actuales
            </p>
            <span className="text-[9px] font-black opacity-50 bg-black/10 px-2 py-1 rounded-full">
              {productosFiltrados.length} {productosFiltrados.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>

          {productosFiltrados.length === 0 ? (
            <div className={`${cardBg} p-12 rounded-[2rem] border-2 text-center`}>
              <span className="text-5xl block mb-3">🍽️</span>
              <p className="font-black uppercase text-lg mb-2">Menú vacío</p>
              <p className="text-xs opacity-60">Agrega tu primer producto usando el formulario</p>
            </div>
          ) : (
            <div className="space-y-3">
              {productosFiltrados.map((p, index) => (
                <div 
                  key={p.id} 
                  className={`${cardBg} p-5 rounded-[2rem] border-2 flex justify-between items-center transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}
                  style={{animationDelay: `${index * 50}ms`}}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase opacity-50 bg-orange-500/10 px-2 py-0.5 rounded-full">
                        #{p.id}
                      </span>
                    </div>
                    <p className="font-black uppercase text-xl leading-none group-hover:text-orange-600 transition-colors">
                      {p.nombre}
                    </p>
                    <p className="text-orange-600 font-black text-2xl mt-2">
                      ${p.precio.toLocaleString('es-CO')}
                    </p>
                  </div>
                  <button 
                    onClick={() => eliminarProducto(p.id, p.nombre)} 
                    className="bg-red-500/10 hover:bg-red-500/20 p-3 rounded-2xl border-2 border-red-400/30 text-xl transition-all duration-300 hover:scale-110 active:scale-95 group"
                    title="Eliminar producto"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* NAVEGACIÓN INFERIOR MEJORADA */}
      <nav className={`${darkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-orange-200'} backdrop-blur-xl fixed bottom-6 left-6 right-6 border-4 rounded-[3rem] p-4 flex justify-around items-center z-50 shadow-2xl`}>
        <Link href="/" className="flex flex-col items-center group">
          <span className="text-3xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1">🏠</span>
          <span className={`text-[10px] font-black uppercase mt-1 opacity-70 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-white' : 'text-black'}`}>Inicio</span>
        </Link>
        
        <Link href="/fiados/nuevo" className="bg-gradient-to-r from-orange-600 to-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-xl -mt-16 border-[6px] border-orange-50 dark:border-slate-800 transition-all duration-300 hover:shadow-2xl hover:scale-110 active:scale-95 group">
          <span className="text-4xl font-bold transition-transform duration-300 group-hover:rotate-90">+</span>
        </Link>

        <Link href="/productos" className="flex flex-col items-center group">
          <span className="text-3xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 text-orange-600">🍴</span>
          <span className="text-[10px] font-black uppercase mt-1 text-orange-600">Menú</span>
        </Link>
      </nav>

      {/* ESTILOS GLOBALES */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}