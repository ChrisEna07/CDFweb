'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'

export default function NuevoFiado() {
  const router = useRouter()
  const { darkMode } = useTheme()
  const [clientes, setClientes] = useState([])
  const [productosMenu, setProductosMenu] = useState([])
  
  const [clienteId, setClienteId] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [itemsVenta, setItemsVenta] = useState([{ productoId: '', cantidad: 1, subtotal: 0 }])
  const [cargando, setCargando] = useState(false)

  // NUEVO: Estados para la foto
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
      setFoto(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const actualizarItem = (index, campo, valor) => {
    const nuevosItems = [...itemsVenta]
    nuevosItems[index][campo] = valor
    if (campo === 'productoId' || campo === 'cantidad') {
      const prod = productosMenu.find(p => p.id === nuevosItems[index].productoId)
      nuevosItems[index].subtotal = prod ? prod.precio * nuevosItems[index].cantidad : 0
    }
    setItemsVenta(nuevosItems)
  }

  const totalGeneral = itemsVenta.reduce((acc, item) => acc + item.subtotal, 0)

  const guardarVenta = async (e) => {
    e.preventDefault()
    if (!clienteId || itemsVenta.some(i => !i.productoId)) return alert("Completa los datos")
    
    setCargando(true)

    try {
      let urlEvidencia = null

      // Subir foto si existe
      if (foto) {
        const fileExt = foto.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `fiados/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('evidencias')
          .upload(filePath, foto)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('evidencias')
          .getPublicUrl(filePath)
        
        urlEvidencia = publicUrl
      }

      const registros = itemsVenta.map(item => ({
        cliente_id: clienteId,
        producto_id: item.productoId,
        cantidad: parseInt(item.cantidad),
        monto_total: item.subtotal,
        creado_el: fecha,
        evidencia_url: urlEvidencia, // GUARDAMOS LA URL DE LA FOTO
        estado: 'pendiente'
      }))

      const { error } = await supabase.from('fiados').insert(registros)
      if (error) throw error
      
      router.push('/')
    } catch (error) {
      alert("Error: " + error.message)
    } finally {
      setCargando(false)
    }
  }

  const bgMain = darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-black'
  const cardBg = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-400'
  const inputStyle = `w-full p-4 rounded-2xl border-2 font-black text-xl ${
    darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-500 text-black'
  }`

  return (
    <div className={`min-h-screen p-4 pb-24 transition-colors ${bgMain}`}>
      <div className="w-full max-w-xl mx-auto flex justify-between mb-6">
        <Link href="/" className="bg-orange-600 text-white px-4 py-2 rounded-xl font-black shadow-md">← VOLVER</Link>
        <h2 className="font-black uppercase opacity-60">Nuevo Pedido</h2>
      </div>

      <form onSubmit={guardarVenta} className={`${cardBg} p-6 rounded-[2.5rem] shadow-2xl w-full max-w-xl mx-auto space-y-6 border-2`}>
        
        {/* FECHA Y CLIENTE */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-black uppercase mb-1">📅 Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-black uppercase mb-1">👤 Cliente</label>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={inputStyle}>
              <option value="">-- SELECCIONAR --</option>
              {clientes.map(c => <option key={c.id} value={c.id} className="text-black">{c.apodo}</option>)}
            </select>
          </div>
        </div>

        {/* EVIDENCIA FOTOGRÁFICA */}
        <div className="bg-black/5 p-4 rounded-3xl border-2 border-dashed border-gray-400 text-center">
          <label className="block text-sm font-black uppercase mb-2">📸 Foto de la Libreta / Pedido</label>
          
          {preview ? (
            <div className="relative inline-block">
              <img src={preview} alt="Evidencia" className="w-full h-40 object-cover rounded-2xl border-4 border-orange-500" />
              <button 
                type="button" 
                onClick={() => {setFoto(null); setPreview(null)}}
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-8 h-8 font-black"
              >
                X
              </button>
            </div>
          ) : (
            <label className="cursor-pointer block p-4 bg-orange-100 rounded-2xl text-orange-700 font-black hover:bg-orange-200 transition-colors">
              📷 TOMAR O SUBIR FOTO
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={manejarFoto} 
                className="hidden" 
              />
            </label>
          )}
        </div>

        {/* PRODUCTOS */}
        <div className="space-y-4">
          <label className="block text-sm font-black uppercase mb-1 italic">🍴 Productos consumidos:</label>
          {itemsVenta.map((item, index) => (
            <div key={index} className="flex gap-2 items-center bg-black/5 p-3 rounded-2xl border border-black/10">
              <select 
                value={item.productoId} 
                onChange={(e) => actualizarItem(index, 'productoId', e.target.value)}
                className={`${inputStyle} !p-2 !text-base flex-1`}
              >
                <option value="">¿Qué lleva?</option>
                {productosMenu.map(p => <option key={p.id} value={p.id} className="text-black">{p.nombre}</option>)}
              </select>
              <input 
                type="number" 
                value={item.cantidad} 
                onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
                className={`${inputStyle} !p-2 !text-center !w-20 !text-base`}
              />
            </div>
          ))}
        </div>

        <button 
          type="button" 
          onClick={() => setItemsVenta([...itemsVenta, { productoId: '', cantidad: 1, subtotal: 0 }])}
          className="w-full py-3 border-4 border-dashed border-orange-400 rounded-2xl text-orange-600 font-black uppercase"
        >
          + OTRO FRITO
        </button>

        {/* TOTAL Y GUARDAR */}
        <div className="bg-orange-600 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-xl">
          <div>
            <p className="text-[10px] font-black opacity-80 uppercase">Total</p>
            <p className="text-4xl font-black">${totalGeneral.toLocaleString('es-CO')}</p>
          </div>
          <button 
            type="submit" 
            disabled={cargando} 
            className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-transform"
          >
            {cargando ? 'SUBIENDO...' : 'LISTO'}
          </button>
        </div>
      </form>
    </div>
  )
}