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
    if (!nombre || !precio) return
    setCargando(true)
    const { error } = await supabase.from('productos').insert([{ nombre, precio: Number(precio) }])
    if (!error) {
      toast.success("Producto guardado ✨")
      setNombre(''); setPrecio('')
      fetchProductos()
    }
    setCargando(false)
  }

  const eliminarProducto = async (id) => {
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (!error) fetchProductos()
    else toast.error("No se puede eliminar (está en un fiado)")
  }

  const bgMain = darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-black'
  const cardBg = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-400 shadow-md'

  return (
    <div className={`min-h-screen p-6 pb-24 ${bgMain}`}>
      <div className="max-w-xl mx-auto space-y-6">
        <Link href="/" className="text-orange-600 font-black">← VOLVER</Link>
        <h1 className="text-3xl font-black italic uppercase">Gestionar Menú 🍴</h1>

        {/* FORMULARIO NUEVO PRODUCTO */}
        <form onSubmit={agregarProducto} className={`${cardBg} p-6 rounded-[2.5rem] border-2 space-y-4`}>
          <div className="grid grid-cols-2 gap-3">
            <input 
              placeholder="Nombre (ej: Tinto)" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)}
              className="p-4 rounded-2xl border-2 bg-transparent font-bold"
            />
            <input 
              type="number" 
              placeholder="Precio (ej: 1000)" 
              value={precio} 
              onChange={e => setPrecio(e.target.value)}
              className="p-4 rounded-2xl border-2 bg-transparent font-bold"
            />
          </div>
          <button disabled={cargando} className="w-full bg-orange-600 text-white p-4 rounded-2xl font-black uppercase shadow-lg">
            {cargando ? 'Guardando...' : '+ AGREGAR AL MENÚ'}
          </button>
        </form>

        {/* LISTA DE PRODUCTOS */}
        <div className="space-y-3">
          {productos.map(p => (
            <div key={p.id} className={`${cardBg} p-4 rounded-2xl border-2 flex justify-between items-center`}>
              <div>
                <p className="font-black uppercase text-lg">{p.nombre}</p>
                <p className="text-orange-600 font-bold">${p.precio.toLocaleString('es-CO')}</p>
              </div>
              <button onClick={() => eliminarProducto(p.id)} className="opacity-30 hover:opacity-100 text-red-500 font-bold p-2">BORRAR</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}