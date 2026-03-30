'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'

export default function ListaClientes() {
  const { darkMode } = useTheme()
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  
  // Estados para la seguridad con PIN
  const [guardOpen, setGuardOpen] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)

  useEffect(() => {
    fetchClientes()
  }, [])

  async function fetchClientes() {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('apodo', { ascending: true })
    setClientes(data || [])
    setCargando(false)
  }

  // Paso 1: Abrir el modal de PIN antes de eliminar
  const solicitarEliminar = (id, apodo) => {
    setClienteSeleccionado({ id, apodo })
    setGuardOpen(true)
  }

  // Paso 2: Ejecutar la eliminación si el PIN es correcto
  const ejecutarEliminacion = async () => {
    if (!clienteSeleccionado) return

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', clienteSeleccionado.id)

    if (error) {
      alert("No se pudo eliminar: " + error.message)
    } else {
      fetchClientes()
      setClienteSeleccionado(null)
    }
  }

  // Filtrar clientes por búsqueda
  const clientesFiltrados = clientes.filter(c => 
    c.apodo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.nombre && c.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  )

  // Configuración de colores mejorada
  const bgMain = darkMode 
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white' 
    : 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 text-black'
  
  const cardBg = darkMode 
    ? 'bg-slate-900/80 border-slate-700 backdrop-blur-sm hover:shadow-xl transition-all duration-300' 
    : 'bg-white/80 border-orange-200 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'

  return (
    <div className={`min-h-screen pb-40 transition-all duration-500 ${bgMain}`}>
      
      {/* Componente de seguridad de PIN */}
      <AdminGuard 
        isOpen={guardOpen} 
        onClose={() => setGuardOpen(false)} 
        onConfirm={ejecutarEliminacion} 
        darkMode={darkMode}
      />

      {/* Header Superior Estilo MariVama Mejorado */}
      <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-orange-700 p-6 pt-8 rounded-b-[3rem] shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400/20 rounded-full blur-2xl -ml-24 -mb-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">MIS CLIENTES</h1>
              <p className="font-bold text-orange-100 text-[10px] uppercase tracking-[0.2em] mt-1">Administración MariVama</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className={`text-xl font-black uppercase border-b-4 border-orange-500 pb-1 ${darkMode ? 'text-white' : 'text-black'}`}>
            Directorio
          </h2>
          <Link 
            href="/clientes/nuevo" 
            className="bg-gradient-to-r from-green-600 to-green-500 text-white px-5 py-2.5 rounded-2xl font-black text-sm shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 border-b-4 border-green-800"
          >
            + NUEVO
          </Link>
        </div>

        {/* Buscador Mejorado */}
        <div className="relative group">
          <input 
            type="text"
            placeholder="🔍 Buscar por apodo o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`w-full p-4 pl-12 rounded-2xl border-2 outline-none transition-all duration-300 focus:ring-2 focus:ring-orange-500/50 ${darkMode ? 'bg-slate-900/80 border-slate-700 focus:border-orange-500 text-white' : 'bg-white/80 border-gray-200 focus:border-orange-500 shadow-md'}`}
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-40">🔍</span>
        </div>

        {cargando ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
            <p className="font-black text-orange-600 text-xl uppercase animate-pulse">
              Cargando lista...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {clientesFiltrados.length === 0 ? (
              <div className={`text-center py-12 rounded-[2.5rem] ${cardBg} border-2`}>
                <span className="text-5xl block mb-3">📭</span>
                <p className="font-bold italic opacity-70">No hay clientes registrados.</p>
                <Link 
                  href="/clientes/nuevo" 
                  className="inline-block mt-4 text-orange-600 font-black underline text-sm"
                >
                  + Agregar primer cliente
                </Link>
              </div>
            ) : (
              clientesFiltrados.map((cliente, index) => (
                <div 
                  key={cliente.id} 
                  className={`${cardBg} p-5 rounded-[2rem] border-2 flex justify-between items-center transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}
                  style={{animationDelay: `${index * 50}ms`}}
                >
                  {/* Navegación a Detalles de Pago */}
                  <Link href={`/clientes/detalles?id=${cliente.id}`} className="flex-1 group/link">
                    <h3 className={`text-xl uppercase leading-none font-black group-hover/link:text-orange-600 transition-colors ${darkMode ? 'text-white' : 'text-black'}`}>
                      {cliente.apodo}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm opacity-70">📞</span>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-700'}`}>
                        {cliente.telefono || 'Sin celular'}
                      </p>
                    </div>
                    {cliente.nombre && (
                      <p className={`text-[10px] uppercase mt-1 opacity-50 ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                        {cliente.nombre}
                      </p>
                    )}
                  </Link>
                  
                  <div className="flex gap-2">
                    {/* BOTÓN EDITAR MEJORADO */}
                    <Link 
                      href={`/clientes/nuevo?id=${cliente.id}`} 
                      className="bg-blue-500/10 hover:bg-blue-500/20 p-3 rounded-2xl border-2 border-blue-400/30 text-xl transition-all duration-300 hover:scale-110 active:scale-95"
                    >
                      ✏️
                    </Link>
                    
                    {/* BOTÓN ELIMINAR MEJORADO (Protegido por PIN) */}
                    <button 
                      onClick={() => solicitarEliminar(cliente.id, cliente.apodo)}
                      className="bg-red-500/10 hover:bg-red-500/20 p-3 rounded-2xl border-2 border-red-400/30 text-xl transition-all duration-300 hover:scale-110 active:scale-95"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Menú de Navegación Inferior Mejorado */}
      <nav className={`${darkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-orange-200'} backdrop-blur-xl fixed bottom-6 left-6 right-6 border-4 rounded-[3rem] p-4 flex justify-around items-center z-50 shadow-2xl`}>
        <Link href="/" className="flex flex-col items-center group">
          <span className="text-4xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1">🏠</span>
          <span className={`text-[10px] font-black uppercase mt-1 opacity-70 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-white' : 'text-black'}`}>Inicio</span>
        </Link>
        
        <Link href="/fiados/nuevo" className="bg-gradient-to-r from-orange-600 to-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-xl -mt-16 border-[6px] border-orange-50 dark:border-slate-800 transition-all duration-300 hover:shadow-2xl hover:scale-110 active:scale-95 group">
          <span className="text-4xl font-bold transition-transform duration-300 group-hover:rotate-90">+</span>
        </Link>

        <Link href="/clientes" className="flex flex-col items-center group">
          <span className="text-4xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 text-orange-600">👤</span>
          <span className="text-[10px] font-black uppercase mt-1 text-orange-600">Clientes</span>
        </Link>
      </nav>

      {/* Estilos globales para animaciones */}
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