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
  const [abono, setAbono] = useState(0)
  const [notas, setNotas] = useState('') // ✨ NUEVO ESTADO PARA NOTAS
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

  const totalConsumo = itemsVenta.reduce((acc, item) => acc + item.subtotal, 0)
  const totalAFiar = Math.max(totalConsumo - abono, 0)

  const guardarVenta = async (e) => {
    e.preventDefault()
    if (!clienteId || itemsVenta.some(i => !i.productoId)) {
        return toast.error("Selecciona cliente y productos")
    }
    
    setCargando(true)

    try {
      let urlEvidencia = null
      if (foto) {
        const fileName = `${Date.now()}.jpg`
        const { error: upErr } = await supabase.storage.from('evidencias').upload(`fiados/${fileName}`, foto)
        if (upErr) throw upErr
        urlEvidencia = supabase.storage.from('evidencias').getPublicUrl(`fiados/${fileName}`).data.publicUrl
      }

      const registros = itemsVenta.map(item => {
        const factor = totalConsumo > 0 ? (item.subtotal / totalConsumo) : 0
        const montoNeto = item.subtotal - (abono * factor)

        return {
          cliente_id: clienteId,
          producto_id: item.productoId,
          cantidad: parseInt(item.cantidad),
          monto_total: montoNeto,
          creado_el: fecha,
          evidencia_url: urlEvidencia,
          notas: notas.toUpperCase(), // ✨ SE GUARDA LA NOTA EN MAYÚSCULAS
          estado: montoNeto <= 0 ? 'pagado' : 'pendiente'
        }
      })

      const { error } = await supabase.from('fiados').insert(registros)
      if (error) throw error
      
      toast.success("¡Venta y notas registradas! 🥟")
      router.push('/')
    } catch (err) {
      toast.error("Error: " + err.message)
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
    <div className={`min-h-screen p-4 pb-44 transition-colors ${bgMain}`}>
      {/* HEADER */}
      <div className="w-full max-w-xl mx-auto flex justify-between items-center mb-6">
        <Link href="/" className="bg-orange-600 text-white px-5 py-2 rounded-xl font-black shadow-md active:scale-90">← VOLVER</Link>
        <h2 className="font-black uppercase opacity-60 italic text-xs">Anotar Pedido</h2>
      </div>

      <form onSubmit={guardarVenta} className="max-w-xl mx-auto space-y-6">
        
        <div className={`${cardBg} p-6 rounded-[2.5rem] border-2 space-y-4`}>
          {/* CLIENTE */}
          <div>
            <label className="block text-[10px] font-black uppercase mb-1 opacity-60">👤 Cliente</label>
            <select value={clienteId} onChange={e => setClienteId(e.target.value)} className={inputStyle}>
              <option value="">-- SELECCIONAR --</option>
              {clientes.map(c => <option key={c.id} value={c.id} className="text-black">{c.apodo}</option>)}
            </select>
          </div>

          {/* ✨ MEJORA: NOTA ADICIONAL */}
          <div>
            <label className="block text-[10px] font-black uppercase mb-1 opacity-60">📝 Nota / Recordatorio (Opcional)</label>
            <textarea 
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="EJ: VIENE A PAGAR EL VIERNES O TRAER CAMBIO..."
              rows="2"
              className={`${inputStyle} text-sm normal-case font-medium`}
            />
          </div>
        </div>

        {/* ABONO */}
        <div className="bg-green-500/10 border-2 border-green-500/30 p-6 rounded-[2.5rem] space-y-2">
          <label className="block text-[10px] font-black uppercase text-green-600">💰 Abono Inmediato</label>
          <input 
            type="number" 
            inputMode="numeric"
            value={abono} 
            onChange={e => setAbono(Number(e.target.value))} 
            className={`${inputStyle} border-green-500/50 text-green-600`}
            placeholder="0"
          />
        </div>

        {/* PRODUCTOS */}
        <div className="space-y-4">
          <p className="text-xs font-black uppercase italic opacity-60 px-2">Detalle:</p>
          {itemsVenta.map((item, index) => (
            <div key={index} className={`${cardBg} p-4 rounded-[2rem] border-2 flex gap-3 items-center shadow-md`}>
              <select 
                value={item.productoId} 
                onChange={(e) => actualizarItem(index, 'productoId', e.target.value)}
                className="flex-1 bg-transparent font-black uppercase text-sm outline-none"
              >
                <option value="">PRODUCTO</option>
                {productosMenu.map(p => (
                  <option key={p.id} value={p.id} className="text-black">{p.nombre}</option>
                ))}
              </select>
              <input 
                  type="number" 
                  value={item.cantidad} 
                  onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
                  className="w-14 p-2 text-center bg-orange-100 rounded-xl font-black text-orange-600 border-2 border-orange-200"
              />
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => setItemsVenta([...itemsVenta, { productoId: '', cantidad: 1, subtotal: 0 }])}
            className="w-full py-3 border-4 border-dashed border-orange-300 rounded-[2rem] text-orange-600 font-black text-xs"
          >
            + AGREGAR OTRO
          </button>
        </div>

        {/* BARRA INFERIOR DE TOTALES */}
        <div className="bg-orange-600 p-6 rounded-[2.5rem] text-white shadow-2xl border-b-8 border-orange-800 sticky bottom-4 z-40">
          <div className="flex justify-between items-center mb-2 opacity-80 border-b border-white/20 pb-2">
            <span className="text-[10px] font-black uppercase italic">Consumo: ${totalConsumo.toLocaleString()}</span>
            {abono > 0 && <span className="text-[10px] font-black uppercase text-green-300 italic">Abono: -${abono.toLocaleString()}</span>}
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black opacity-80 uppercase leading-none">Anotar en libreta:</p>
              <p className="text-4xl font-black tracking-tighter">${totalAFiar.toLocaleString('es-CO')}</p>
            </div>
            <button 
              type="submit" 
              disabled={cargando} 
              className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-black text-xl shadow-lg active:scale-95 disabled:opacity-50"
            >
              {cargando ? '...' : 'LISTO ✅'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}