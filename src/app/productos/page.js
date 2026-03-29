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

  const eliminarProducto = async (id) => {
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (!error) {
      toast.success("Producto eliminado")
      fetchProductos()
    } else {
      toast.error("No se puede borrar: ya está en una cuenta vieja")
    }
  }

  const bgMain = darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-black'
  const cardBg = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-400 shadow-md'

  return (
    <div className={`min-h-screen p-6 pb-24 ${bgMain}`}>
      <div className="max-w-xl mx-auto space-y-6">
        <Link href="/fiados/nuevo" className="text-orange-600 font-black">← VOLVER AL PEDIDO</Link>
        <h1 className="text-3xl font-black italic uppercase text-orange-600">Configurar Menú 🍴</h1>

        {/* FORMULARIO PARA REGISTRAR PRODUCTOS NUEVOS */}
        <form onSubmit={agregarProducto} className={`${cardBg} p-6 rounded-[2.5rem] border-2 space-y-4 shadow-xl`}>
          <p className="font-black text-sm uppercase opacity-60">Registrar nuevo producto:</p>
          <div className="grid grid-cols-1 gap-3">
            <input 
              placeholder="NOMBRE (EJ: TINTO)" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)}
              className="p-4 rounded-2xl border-2 bg-transparent font-black uppercase text-lg focus:border-orange-500 outline-none"
            />
            <input 
              type="number" 
              placeholder="PRECIO (EJ: 1000)" 
              value={precio} 
              onChange={e => setPrecio(e.target.value)}
              className="p-4 rounded-2xl border-2 bg-transparent font-black text-lg focus:border-orange-500 outline-none"
            />
          </div>
          <button disabled={cargando} className="w-full bg-orange-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg active:scale-95 transition-all">
            {cargando ? 'GUARDANDO...' : '➕ GUARDAR EN EL MENÚ'}
          </button>
        </form>

        {/* LISTA ACTUAL */}
        <div className="space-y-3">
          <p className="font-black text-sm uppercase opacity-60">Productos actuales:</p>
          {productos.map(p => (
            <div key={p.id} className={`${cardBg} p-5 rounded-[2rem] border-2 flex justify-between items-center shadow-sm`}>
              <div>
                <p className="font-black uppercase text-lg leading-none">{p.nombre}</p>
                <p className="text-orange-600 font-black mt-1">${p.precio.toLocaleString('es-CO')}</p>
              </div>
              <button onClick={() => eliminarProducto(p.id)} className="text-red-500 opacity-20 hover:opacity-100 font-black p-2 transition-opacity">🗑️</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}