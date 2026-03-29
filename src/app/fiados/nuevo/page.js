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
        supabase.from('productos').select('id, nombre, precio')
      ])
      setClientes(resClientes.data || [])
      setProductosMenu(resProductos.data || [])
    }
    cargarDatos()
  }, [])

  const manejarFoto = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFoto(file); setPreview(URL.createObjectURL(file))
    }
  }

  const actualizarItem = (index, campo, valor) => {
    const nuevosItems = [...itemsVenta]
    nuevosItems[index][campo] = valor
    
    // Calcular subtotal automático basado en el precio del menú
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
    if (!clienteId || itemsVenta.some(i => !i.productoId)) return toast.error("Selecciona cliente y productos")
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
      toast.error("Error: " + err.message)
    } finally {
      setCargando(false)
    }
  }

  const bgMain = darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-black'
  const cardBg = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-400 shadow-md'
  const inputStyle = `w-full p-4 rounded-2xl border-2 font-black ${darkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'}`

  return (
    <div className={`min-h-screen p-4 pb-24 ${bgMain}`}>
      <form onSubmit={guardarVenta} className="max-w-xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/" className="bg-orange-600 text-white px-4 py-2 rounded-xl font-black">← VOLVER</Link>
          <h2 className="font-black uppercase italic">Nuevo Pedido</h2>
        </div>

        <div className={`${cardBg} p-6 rounded-[2.5rem] border-2 space-y-4`}>
          <select value={clienteId} onChange={e => setClienteId(e.target.value)} className={inputStyle}>
            <option value="">👤 ¿A QUIÉN LE FIAMOS?</option>
            {clientes.map(c => <option key={c.id} value={c.id} className="text-black">{c.apodo}</option>)}
          </select>

          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputStyle} />
          
          <label className="cursor-pointer block p-4 bg-orange-100 rounded-2xl text-orange-700 font-black text-center border-2 border-dashed border-orange-300">
            {preview ? '📸 CAMBIAR FOTO' : '📷 TOMAR FOTO DE LIBRETA'}
            <input type="file" accept="image/*" capture="environment" onChange={manejarFoto} className="hidden" />
          </label>
          {preview && <img src={preview} className="w-full h-32 object-cover rounded-xl" />}
        </div>

        <div className="space-y-3">
          {itemsVenta.map((item, index) => (
            <div key={index} className={`${cardBg} p-4 rounded-3xl border-2 flex gap-2`}>
              <select 
                value={item.productoId} 
                onChange={e => actualizarItem(index, 'productoId', e.target.value)}
                className="flex-1 bg-transparent font-bold uppercase text-sm"
              >
                <option value="">¿Qué lleva?</option>
                {productosMenu.map(p => <option key={p.id} value={p.id} className="text-black">{p.nombre} (${p.precio})</option>)}
              </select>
              <input 
                type="number" 
                value={item.cantidad} 
                onChange={e => actualizarItem(index, 'cantidad', e.target.value)}
                className="w-16 text-center bg-orange-100 rounded-xl font-black text-orange-600"
              />
            </div>
          ))}
          <button type="button" onClick={() => setItemsVenta([...itemsVenta, { productoId: '', cantidad: 1, subtotal: 0 }])} className="w-full py-2 text-orange-600 font-black text-sm uppercase">+ OTRO PRODUCTO</button>
        </div>

        <div className="bg-orange-600 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-xl">
          <div>
            <p className="text-[10px] font-black uppercase">Total a anotar</p>
            <p className="text-4xl font-black">${totalGeneral.toLocaleString('es-CO')}</p>
          </div>
          <button disabled={cargando} className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-black text-xl shadow-lg">
            {cargando ? '...' : 'LISTO'}
          </button>
        </div>
      </form>
    </div>
  )
}