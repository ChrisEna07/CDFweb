'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NuevoFiado() {
  const router = useRouter()
  const { darkMode } = useTheme()
  const [clientes, setClientes] = useState([])
  const [productosMenu, setProductosMenu] = useState([])
  
  const [clienteId, setClienteId] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [itemsVenta, setItemsVenta] = useState([{ productoId: '', cantidad: 1, subtotal: 0 }])
  const [cargando, setCargando] = useState(false)

  const [foto, setFoto] = useState(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    async function cargarDatos() {
      const [resClientes, resProductos] = await Promise.all([
        supabase.from('clientes').select('id, apodo'),
        supabase.from('productos').select('id, nombre, precio').order('nombre')
      ])
      setClientes(resClientes.data || [])
      setProductosMenu(resProductos.data || [])
    }
    cargarDatos()
  }, [])

  const manejarFoto = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFoto(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const actualizarItem = (index, campo, valor) => {
    const nuevosItems = [...itemsVenta]
    nuevosItems[index][campo] = valor
    
    if (campo === 'productoId' || campo === 'cantidad') {
      const prod = productosMenu.find(p => p.id === nuevosItems[index].productoId)
      const cant = Number(nuevosItems[index].cantidad) || 0
      nuevosItems[index].subtotal = prod ? prod.precio * cant : 0
    }
    setItemsVenta(nuevosItems)
  }

  const totalGeneral = itemsVenta.reduce((acc, item) => acc + item.subtotal, 0)

  const guardarVenta = async (e) => {
    e.preventDefault()
    if (!clienteId || itemsVenta.some(i => !i.productoId)) {
        return toast.error("Selecciona un cliente y los productos")
    }
    
    setCargando(true)

    try {
      let urlEvidencia = null

      if (foto) {
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
        const { error: upErr } = await supabase.storage.from('evidencias').upload(`fiados/${fileName}`, foto)
        if (upErr) throw upErr
        urlEvidencia = supabase.storage.from('evidencias').getPublicUrl(`fiados/${fileName}`).data.publicUrl
      }

      const registros = itemsVenta.map(item => ({
        cliente_id: clienteId,
        producto_id: item.productoId,
        cantidad: parseInt(item.cantidad),
        monto_total: item.subtotal,
        creado_el: fecha,
        evidencia_url: urlEvidencia,
        estado: 'pendiente'
      }))

      const { error } = await supabase.from('fiados').insert(registros)
      if (error) throw error
      
      toast.success("¡Venta registrada con éxito! 🥟")
      router.push('/')
    } catch (err) {
      toast.error("Error al guardar: " + err.message)
    } finally {
      setCargando(false)
    }
  }

  const bgMain = darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-black'
  const cardBg = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-400 shadow-md'
  const inputStyle = `w-full p-4 rounded-2xl border-2 font-black ${
    darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-black'
  }`

  return (
    <div className={`min-h-screen p-4 pb-24 transition-colors ${bgMain}`}>
      <div className="w-full max-w-xl mx-auto flex justify-between items-center mb-6">
        <Link href="/" className="bg-orange-600 text-white px-5 py-2 rounded-xl font-black shadow-md active:scale-90 transition-transform">← VOLVER</Link>
        <h2 className="font-black uppercase opacity-60 italic">Nuevo Pedido</h2>
      </div>

      <form onSubmit={guardarVenta} className="max-w-xl mx-auto space-y-6">
        
        {/* CLIENTE Y FECHA */}
        <div className={`${cardBg} p-6 rounded-[2.5rem] border-2 space-y-4 shadow-xl`}>
          <div>
            <label className="block text-[10px] font-black uppercase mb-1 opacity-60">👤 ¿A quién le fiamos?</label>
            <select value={clienteId} onChange={e => setClienteId(e.target.value)} className={inputStyle}>
              <option value="">-- SELECCIONAR CLIENTE --</option>
              {clientes.map(c => <option key={c.id} value={c.id} className="text-black">{c.apodo}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase mb-1 opacity-60">📅 Fecha del pedido</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputStyle} />
          </div>
        </div>

        {/* EVIDENCIA FOTOGRÁFICA */}
        <div className="bg-black/5 p-4 rounded-[2rem] border-2 border-dashed border-gray-400 text-center">
          <label className="block text-[10px] font-black uppercase mb-2 opacity-60">📸 Foto de la libreta (Opcional)</label>
          {preview ? (
            <div className="relative inline-block">
              <img src={preview} alt="Evidencia" className="w-full h-40 object-cover rounded-2xl border-4 border-orange-500" />
              <button type="button" onClick={() => {setFoto(null); setPreview(null)}} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-8 h-8 font-black">X</button>
            </div>
          ) : (
            <label className="cursor-pointer block p-4 bg-orange-100 rounded-2xl text-orange-700 font-black hover:bg-orange-200 transition-colors">
              📷 TOMAR O SUBIR FOTO
              <input type="file" accept="image/*" capture="environment" onChange={manejarFoto} className="hidden" />
            </label>
          )}
        </div>

        {/* PRODUCTOS */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <label className="text-sm font-black uppercase italic opacity-60">🍴 Detalle del consumo:</label>
            <Link href="/productos" className="text-[10px] font-black text-orange-600 underline uppercase">
               ⚙️ Editar Menú (Precios)
            </Link>
          </div>
          
          {itemsVenta.map((item, index) => (
            <div key={index} className={`${cardBg} p-4 rounded-[2rem] border-2 flex gap-3 items-center shadow-md animate-in slide-in-from-left-2`}>
              <select 
                value={item.productoId} 
                onChange={(e) => actualizarItem(index, 'productoId', e.target.value)}
                className="flex-1 bg-transparent font-black uppercase text-sm outline-none border-none"
              >
                <option value="">¿QUÉ LLEVA?</option>
                {productosMenu.map(p => (
                  <option key={p.id} value={p.id} className="text-black">
                    {p.nombre} (${p.precio.toLocaleString('es-CO')})
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black opacity-40">CANT.</span>
                <input 
                    type="number" 
                    value={item.cantidad} 
                    onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
                    className="w-16 p-2 text-center bg-orange-100 rounded-xl font-black text-orange-600 border-2 border-orange-200 outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        <button 
          type="button" 
          onClick={() => setItemsVenta([...itemsVenta, { productoId: '', cantidad: 1, subtotal: 0 }])}
          className="w-full py-4 border-4 border-dashed border-orange-300 rounded-[2rem] text-orange-600 font-black uppercase text-xs hover:bg-orange-50 active:scale-95 transition-all"
        >
          + AÑADIR OTRO PRODUCTO
        </button>

        {/* RESUMEN Y GUARDADO */}
        <div className="bg-orange-600 p-6 rounded-[2.5rem] text-white flex justify-between items-center shadow-2xl border-b-8 border-orange-800 sticky bottom-4">
          <div>
            <p className="text-[10px] font-black opacity-80 uppercase leading-none">Total a anotar</p>
            <p className="text-4xl font-black tracking-tighter">${totalGeneral.toLocaleString('es-CO')}</p>
          </div>
          <button 
            type="submit" 
            disabled={cargando} 
            className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-black text-xl shadow-lg active:translate-y-1 transition-all disabled:opacity-50"
          >
            {cargando ? '...' : 'LISTO ✅'}
          </button>
        </div>
      </form>
    </div>
  )
}