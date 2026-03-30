'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import { toast } from 'sonner'

// Componente AdminGuard Mejorado
function AdminGuard({ isOpen, onClose, onConfirm, darkMode }) {
  const [pin, setPin] = useState('')
  const PIN_CORRECTO = "1407"

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === PIN_CORRECTO) {
        onConfirm()
        setPin('')
        onClose()
      } else {
        toast.error("PIN INCORRECTO ❌")
        setTimeout(() => setPin(''), 300)
      }
    }
  }, [pin])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className={`${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-300'} w-full max-w-xs p-8 rounded-[2.5rem] border-4 shadow-2xl text-center transform transition-all duration-300 animate-slideUp`}>
        <span className="text-5xl mb-4 block animate-pulse">🔐</span>
        <h3 className={`text-xl font-black uppercase mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>Confirmar Identidad</h3>
        <p className="text-[9px] font-black uppercase opacity-50 mb-4 tracking-widest">PIN DE SEGURIDAD</p>
        <input 
          autoFocus
          type="password" 
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="••••"
          className={`w-full p-4 text-center text-4xl tracking-[0.5em] font-black rounded-2xl border-2 mb-6 transition-all duration-300 focus:ring-2 focus:ring-orange-500/50 ${darkMode ? 'bg-slate-800 border-slate-600 text-white focus:border-orange-500' : 'bg-gray-100 border-gray-400 text-black focus:border-orange-500'}`}
        />
        <button onClick={onClose} className="w-full py-2 font-black uppercase text-xs opacity-50 hover:opacity-100 transition-opacity">Cancelar</button>
      </div>
    </div>
  )
}

function FormularioCliente() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { darkMode } = useTheme()
  const clienteId = searchParams.get('id')

  const [nombre, setNombre] = useState('')
  const [apodo, setApodo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mostrarPin, setMostrarPin] = useState(false)

  useEffect(() => {
    if (clienteId) {
      async function cargarCliente() {
        const { data } = await supabase.from('clientes').select('*').eq('id', clienteId).single()
        if (data) {
          setNombre(data.nombre || '')
          setApodo(data.apodo || '')
          setTelefono(data.telefono || '')
        }
      }
      cargarCliente()
    }
  }, [clienteId])

  const guardarCliente = async (e) => {
    e.preventDefault()
    if (!apodo) return toast.error("El apodo es obligatorio")
    
    setCargando(true)
    const datos = { nombre, apodo: apodo.toUpperCase(), telefono }

    const { error } = clienteId 
      ? await supabase.from('clientes').update(datos).eq('id', clienteId)
      : await supabase.from('clientes').insert([datos])

    if (error) {
      toast.error("❌ Error: " + error.message)
      setCargando(false)
    } else {
      toast.success(clienteId ? "Cliente actualizado ✨" : "Cliente creado ✨")
      router.push('/clientes')
    }
  }

  const eliminarCliente = async () => {
    const { error } = await supabase.from('clientes').delete().eq('id', clienteId)
    if (error) {
      toast.error("No se puede eliminar: tiene deudas activas.")
    } else {
      toast.success("Cliente eliminado")
      router.push('/clientes')
    }
  }

  const bgMain = darkMode 
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white' 
    : 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 text-black'
  
  const cardBg = darkMode 
    ? 'bg-slate-900/80 border-slate-700 backdrop-blur-sm hover:shadow-xl transition-all duration-300' 
    : 'bg-white/80 border-orange-200 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'
  
  const inputStyle = `mt-1 block w-full rounded-2xl border-2 p-4 text-xl font-black transition-all duration-300 focus:ring-2 focus:ring-orange-500/50 ${
    darkMode 
      ? 'bg-slate-900/80 border-slate-700 text-white focus:border-orange-500' 
      : 'bg-white/80 border-gray-200 text-black focus:border-orange-500 shadow-md'
  }`

  return (
    <div className={`min-h-[100svh] p-4 pb-40 flex flex-col items-center transition-all duration-500 ${bgMain}`}>
      <AdminGuard 
        isOpen={mostrarPin} 
        onClose={() => setMostrarPin(false)} 
        onConfirm={eliminarCliente} 
        darkMode={darkMode} 
      />

      {/* HEADER MEJORADO */}
      <div className="w-full max-w-lg flex items-center justify-between mb-8 mt-4 px-2">
        <Link 
          href="/clientes" 
          className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-2.5 rounded-xl font-black shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          ← VOLVER
        </Link>
        <div className="bg-orange-500/20 px-4 py-2 rounded-full backdrop-blur-sm">
          <p className="text-[10px] font-black uppercase italic opacity-80">Edición de Ficha</p>
        </div>
      </div>

      <form onSubmit={guardarCliente} className="w-full max-w-lg space-y-6">
        <div className={`${cardBg} p-8 rounded-[2.5rem] border-2 space-y-6 transition-all duration-300`}>
            <div className="relative">
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-2 rounded-full shadow-lg">
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">
                    {clienteId ? '✏️ ACTUALIZAR DATOS' : '✨ NUEVO CLIENTE'}
                  </h2>
                </div>
              </div>
              <div className="pt-8">
                <div className="space-y-5">
                  {/* APODO */}
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-2 opacity-70 flex items-center gap-2">
                      <span>🏷️</span> Apodo (Cómo lo conocen) <span className="text-orange-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={apodo} 
                      onChange={(e) => setApodo(e.target.value)} 
                      required 
                      className={inputStyle} 
                      placeholder="EJ: EL VECINO, DOÑA ROSA..."
                    />
                  </div>
                  
                  {/* NOMBRE REAL */}
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-2 opacity-70 flex items-center gap-2">
                      <span>📝</span> Nombre Real (Opcional)
                    </label>
                    <input 
                      type="text" 
                      value={nombre} 
                      onChange={(e) => setNombre(e.target.value)} 
                      className={inputStyle} 
                      placeholder="EJ: JUAN PÉREZ GONZÁLEZ"
                    />
                  </div>
                  
                  {/* TELÉFONO */}
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-2 opacity-70 flex items-center gap-2">
                      <span>📱</span> WhatsApp / Teléfono
                    </label>
                    <input 
                      type="tel" 
                      value={telefono} 
                      onChange={(e) => setTelefono(e.target.value)} 
                      className={inputStyle} 
                      placeholder="EJ: 300 123 4567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {clienteId && (
                <button 
                  type="button" 
                  onClick={() => setMostrarPin(true)}
                  className="w-full text-red-500 font-black uppercase text-xs py-3 opacity-50 hover:opacity-100 transition-all duration-300 hover:bg-red-500/10 rounded-2xl flex items-center justify-center gap-2"
                >
                  <span className="text-lg">🗑️</span> Eliminar Cliente Definitivamente
                </button>
            )}
        </div>

        {/* BOTÓN FLOTANTE MEJORADO */}
        <div className="sticky bottom-24 z-40">
            <button 
                type="submit" 
                disabled={cargando}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black text-2xl py-5 rounded-[2rem] shadow-2xl transition-all duration-300 hover:shadow-3xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 border-b-8 border-orange-800 flex items-center justify-center gap-3"
            >
                {cargando ? (
                  <>
                    <span className="animate-spin">⏳</span> GUARDANDO...
                  </>
                ) : (
                  <>
                    {clienteId ? '✅ GUARDAR CAMBIOS' : '✨ CREAR FICHA'}
                    <span className="text-2xl">{clienteId ? '✏️' : '👤'}</span>
                  </>
                )}
            </button>
        </div>
      </form>

      {/* NAVEGACIÓN INFERIOR MEJORADA */}
      <nav className={`${darkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-orange-200'} backdrop-blur-xl fixed bottom-4 left-6 right-6 border-4 rounded-[3rem] p-4 flex justify-around items-center z-50 shadow-2xl`}>
        <Link href="/" className="flex flex-col items-center group">
          <span className="text-3xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1">🏠</span>
          <span className={`text-[10px] font-black uppercase mt-1 opacity-70 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-white' : 'text-black'}`}>Inicio</span>
        </Link>
        <Link href="/clientes" className="flex flex-col items-center group">
          <span className="text-3xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 text-orange-600">👥</span>
          <span className="text-[10px] font-black uppercase mt-1 text-orange-600">Lista</span>
        </Link>
      </nav>

      {/* ESTILOS GLOBALES */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}

export default function PaginaRegistroCliente() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
          <p className="font-black text-orange-600">Cargando...</p>
        </div>
      </div>
    }>
      <FormularioCliente />
    </Suspense>
  )
}