'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'

// Componente principal del formulario
function FormularioCliente() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { darkMode } = useTheme()
  const clienteId = searchParams.get('id')

  const [nombre, setNombre] = useState('')
  const [apodo, setApodo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (clienteId) {
      async function cargarCliente() {
        const { data } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', clienteId)
          .single()
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
    if (!apodo) return alert("El apodo es obligatorio")
    
    setCargando(true)
    const datos = { nombre, apodo, telefono }

    const { error } = clienteId 
      ? await supabase.from('clientes').update(datos).eq('id', clienteId)
      : await supabase.from('clientes').insert([datos])

    if (error) {
      alert("❌ Error: " + error.message)
      setCargando(false)
    } else {
      router.push('/clientes')
    }
  }

  const bgMain = darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-black'
  const cardBg = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-400'
  const inputStyle = `mt-1 block w-full rounded-2xl border-2 p-4 text-xl font-black ${
    darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-500 text-black'
  }`
  const labelStyle = `block text-sm font-black uppercase mb-1 ${darkMode ? 'text-orange-400' : 'text-black'}`

  return (
    <div className={`min-h-screen p-4 pb-28 flex flex-col items-center transition-colors ${bgMain}`}>
      <div className="w-full max-w-lg flex items-center justify-between mb-8 mt-4">
        <Link href="/clientes" className="bg-orange-600 text-white px-6 py-2 rounded-xl font-black shadow-lg">
          ← VOLVER
        </Link>
        <span className="text-xs font-black uppercase opacity-70">MariVama CDF</span>
      </div>

      <form onSubmit={guardarCliente} className={`${cardBg} p-8 rounded-[2.5rem] shadow-2xl w-full max-w-lg space-y-6 border-2`}>
        <h2 className="text-3xl font-black uppercase tracking-tighter">
          {clienteId ? 'Actualizar Datos' : 'Nuevo Cliente'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className={labelStyle}>Apodo (Cómo lo conocen) *</label>
            <input 
              type="text" 
              value={apodo} 
              onChange={(e) => setApodo(e.target.value)}
              required
              className={inputStyle}
              placeholder="Ej: El de la moto roja"
            />
          </div>

          <div>
            <label className={labelStyle}>Nombre Real (Opcional)</label>
            <input 
              type="text" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)}
              className={inputStyle}
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className={labelStyle}>WhatsApp / Teléfono</label>
            <input 
              type="tel" 
              value={telefono} 
              onChange={(e) => setTelefono(e.target.value)}
              className={inputStyle}
              placeholder="Ej: 3001234567"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={cargando}
          className="w-full bg-orange-600 text-white font-black text-2xl py-5 rounded-2xl shadow-xl active:scale-95 disabled:bg-gray-500 border-b-8 border-orange-800"
        >
          {cargando ? 'GUARDANDO...' : (clienteId ? 'GUARDAR CAMBIOS' : 'CREAR FICHA')}
        </button>
      </form>

      <nav className={`${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-orange-100'} fixed bottom-6 left-6 right-6 border-4 rounded-[2.5rem] p-4 flex justify-around items-center z-50 shadow-2xl`}>
        <Link href="/" className="flex flex-col items-center">
          <span className="text-3xl">🏠</span>
          <span className="text-[10px] font-black uppercase">Inicio</span>
        </Link>
        <Link href="/clientes" className="flex flex-col items-center">
          <span className="text-3xl">👤</span>
          <span className="text-[10px] font-black uppercase">Clientes</span>
        </Link>
      </nav>
    </div>
  )
}

// Exportación por defecto obligatoria para Next.js
export default function PaginaRegistroCliente() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-black">Cargando formulario...</div>}>
      <FormularioCliente />
    </Suspense>
  )
}