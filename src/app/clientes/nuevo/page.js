'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import { toast } from 'sonner'

// Componente para proteger la eliminación
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <div className={`${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-300'} w-full max-w-xs p-8 rounded-[2.5rem] border-4 shadow-2xl text-center`}>
        <span className="text-5xl mb-4 block">🔐</span>
        <h3 className={`text-xl font-black uppercase mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>Confirmar Identidad</h3>
        <input 
          autoFocus
          type="password" 
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="••••"
          className={`w-full p-4 text-center text-4xl tracking-[0.5em] font-black rounded-2xl border-2 mb-6 ${darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-gray-100 border-gray-400 text-black'}`}
        />
        <button onClick={onClose} className="w-full py-2 font-black uppercase text-xs opacity-50">Cancelar</button>
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
      toast.success("Cliente guardado ✨")
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

  const bgMain = darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-black'
  const cardBg = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-400'
  const inputStyle = `mt-1 block w-full rounded-2xl border-2 p-4 text-xl font-black ${darkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-400 text-black'}`

  return (
    <div className={`min-h-[100svh] p-4 pb-32 flex flex-col items-center transition-colors ${bgMain}`}>
      <AdminGuard 
        isOpen={mostrarPin} 
        onClose={() => setMostrarPin(false)} 
        onConfirm={eliminarCliente} 
        darkMode={darkMode} 
      />

      <div className="w-full max-w-lg flex items-center justify-between mb-8 mt-4 px-2">
        <Link href="/clientes" className="bg-orange-600 text-white px-6 py-2 rounded-xl font-black shadow-lg active:scale-90 transition-transform">
          ← VOLVER
        </Link>
        <span className="text-[10px] font-black uppercase opacity-40">Edición de Ficha</span>
      </div>

      <form onSubmit={guardarCliente} className="w-full max-w-lg space-y-6">
        <div className={`${cardBg} p-8 rounded-[2.5rem] shadow-xl border-2 space-y-6`}>
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                {clienteId ? 'Actualizar Datos' : 'Nuevo Cliente'}
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-[10px] font-black uppercase mb-1 opacity-60">Apodo (Cómo lo conocen) *</label>
                    <input type="text" value={apodo} onChange={(e) => setApodo(e.target.value)} required className={inputStyle} placeholder="Ej: EL VECINO" />
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase mb-1 opacity-60">Nombre Real (Opcional)</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputStyle} placeholder="Ej: JUAN PÉREZ" />
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase mb-1 opacity-60">WhatsApp / Teléfono</label>
                    <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputStyle} placeholder="Ej: 300..." />
                </div>
            </div>

            {clienteId && (
                <button 
                  type="button" 
                  onClick={() => setMostrarPin(true)}
                  className="w-full text-red-500 font-black uppercase text-xs pt-4 opacity-40 hover:opacity-100"
                >
                  🗑️ Eliminar Cliente Definitivamente
                </button>
            )}
        </div>

        {/* BOTÓN FLOTANTE / STICKY */}
        <div className="sticky bottom-24 z-40">
            <button 
                type="submit" 
                disabled={cargando}
                className="w-full bg-orange-600 text-white font-black text-2xl py-5 rounded-[2rem] shadow-2xl active:translate-y-1 transition-all disabled:bg-gray-500 border-b-8 border-orange-800"
            >
                {cargando ? '...' : (clienteId ? 'GUARDAR CAMBIOS ✅' : 'CREAR FICHA 👤')}
            </button>
        </div>
      </form>

      {/* NAVEGACIÓN INFERIOR */}
      <nav className={`${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-orange-200'} fixed bottom-4 left-6 right-6 border-4 rounded-[2.5rem] p-4 flex justify-around items-center z-50 shadow-2xl`}>
        <Link href="/" className="flex flex-col items-center">
          <span className="text-2xl">🏠</span>
          <span className="text-[10px] font-black uppercase">Inicio</span>
        </Link>
        <Link href="/clientes" className="flex flex-col items-center">
          <span className="text-2xl">👥</span>
          <span className="text-[10px] font-black uppercase">Lista</span>
        </Link>
      </nav>
    </div>
  )
}

export default function PaginaRegistroCliente() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-black">Cargando...</div>}>
      <FormularioCliente />
    </Suspense>
  )
}