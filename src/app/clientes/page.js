'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard' // Asegúrate de haber creado este componente

export default function ListaClientes() {
  const { darkMode } = useTheme()
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  
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

  // Configuración de colores de alto contraste
  const bgMain = darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-black'
  const cardBg = darkMode ? 'bg-slate-900 border-slate-700 shadow-none' : 'bg-white border-gray-400 shadow-md'
  const textPrimary = darkMode ? 'text-white font-black' : 'text-black font-black'
  const textSecondary = darkMode ? 'text-slate-400' : 'text-gray-700 font-bold'

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${bgMain}`}>
      
      {/* Componente de seguridad de PIN */}
      <AdminGuard 
        isOpen={guardOpen} 
        onClose={() => setGuardOpen(false)} 
        onConfirm={ejecutarEliminacion} 
        darkMode={darkMode}
      />

      {/* Header Superior Estilo MariVama */}
      <div className="bg-orange-600 p-8 rounded-b-[3rem] shadow-xl text-white">
        <h1 className="text-3xl font-black tracking-tighter">MIS CLIENTES</h1>
        <p className="font-bold text-orange-100 text-[10px] uppercase tracking-[0.2em]">Administración MariVama</p>
      </div>

      <div className="p-6 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-black uppercase border-b-4 border-orange-500 ${darkMode ? 'text-white' : 'text-black'}`}>
            Directorio
          </h2>
          <Link href="/clientes/nuevo" className="bg-green-600 text-white px-5 py-2 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-transform border-b-4 border-green-800">
            + NUEVO
          </Link>
        </div>

        {cargando ? (
          <div className="text-center py-10 font-black text-orange-600 animate-pulse text-xl uppercase">
            Cargando lista...
          </div>
        ) : (
          <div className="space-y-4">
            {clientes.length === 0 ? (
              <p className="text-center py-10 opacity-50 font-bold italic">No hay clientes registrados.</p>
            ) : (
              clientes.map((cliente) => (
                <div key={cliente.id} className={`${cardBg} p-5 rounded-[2.5rem] border-2 flex justify-between items-center transition-all`}>
                  
                  {/* Navegación a Detalles de Pago */}
                  <Link href={`/clientes/detalles?id=${cliente.id}`} className="flex-1">
                    <h3 className={`text-2xl uppercase leading-none ${textPrimary}`}>
                      {cliente.apodo}
                    </h3>
                    <p className={`text-sm mt-1 ${textSecondary}`}>
                      📞 {cliente.telefono || 'Sin celular'}
                    </p>
                  </Link>
                  
                  <div className="flex gap-2">
                    {/* BOTÓN EDITAR */}
                    <Link 
                      href={`/clientes/nuevo?id=${cliente.id}`} 
                      className="bg-blue-100 p-3 rounded-2xl border-2 border-blue-300 text-xl shadow-sm active:scale-90"
                    >
                      ✏️
                    </Link>
                    
                    {/* BOTÓN ELIMINAR (Protegido por PIN) */}
                    <button 
                      onClick={() => solicitarEliminar(cliente.id, cliente.apodo)}
                      className="bg-red-100 p-3 rounded-2xl border-2 border-red-300 text-xl shadow-sm active:scale-90"
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

      {/* Menú de Navegación Inferior */}
      <nav className={`${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-orange-100 shadow-2xl'} fixed bottom-6 left-6 right-6 border-4 rounded-[2.5rem] p-4 flex justify-around items-center z-50`}>
        <Link href="/" className="flex flex-col items-center">
          <span className="text-3xl">🏠</span>
          <span className={`text-[10px] font-black uppercase mt-1 ${darkMode ? 'text-white' : 'text-black'}`}>Inicio</span>
        </Link>
        
        <Link href="/fiados/nuevo" className="bg-orange-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl -mt-12 border-4 border-orange-50 active:scale-90">
          <span className="text-3xl font-bold">+</span>
        </Link>

        <Link href="/clientes" className="flex flex-col items-center text-orange-600">
          <span className="text-3xl">👤</span>
          <span className="text-[10px] font-black uppercase mt-1">Clientes</span>
        </Link>
      </nav>
    </div>
  )
}