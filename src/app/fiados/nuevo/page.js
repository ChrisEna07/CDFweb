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
  const [notas, setNotas] = useState('')
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
          notas: notas.toUpperCase(),
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

  const bgMain = darkMode 
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white' 
    : 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 text-black'
  
  const cardBg = darkMode 
    ? 'bg-slate-900/80 border-slate-700 backdrop-blur-sm hover:shadow-xl transition-all duration-300' 
    : 'bg-white/80 border-orange-200 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'
  
  const inputStyle = `w-full p-4 rounded-2xl border-2 font-black transition-all duration-300 focus:ring-2 focus:ring-orange-500/50 ${
    darkMode 
      ? 'bg-slate-900/80 border-slate-700 text-white focus:border-orange-500' 
      : 'bg-white/80 border-gray-200 text-black focus:border-orange-500 shadow-md'
  }`

  return (
    <div className={`min-h-screen p-4 pb-44 transition-all duration-500 ${bgMain}`}>
      {/* HEADER MEJORADO */}
      <div className="w-full max-w-xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <Link 
            href="/" 
            className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-5 py-2.5 rounded-xl font-black shadow-md transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            ← VOLVER
          </Link>
          <div className="bg-orange-500/20 px-4 py-2 rounded-full backdrop-blur-sm">
            <p className="font-black uppercase italic text-xs text-orange-600">Anotar Pedido</p>
          </div>
        </div>
      </div>

      <form onSubmit={guardarVenta} className="max-w-xl mx-auto space-y-6">
        
        {/* CLIENTE Y NOTAS */}
        <div className={`${cardBg} p-6 rounded-[2rem] border-2 space-y-5`}>
          {/* CLIENTE */}
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 opacity-60 flex items-center gap-2">
              <span>👤</span> Cliente
            </label>
            <select 
              value={clienteId} 
              onChange={e => setClienteId(e.target.value)} 
              className={inputStyle}
            >
              <option value="">-- SELECCIONAR CLIENTE --</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.apodo}</option>)}
            </select>
          </div>

          {/* NOTA ADICIONAL */}
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 opacity-60 flex items-center gap-2">
              <span>📝</span> Nota / Recordatorio (Opcional)
            </label>
            <textarea 
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="EJ: VIENE A PAGAR EL VIERNES, TRAER CAMBIO, DEBE 2 UNIDADES..."
              rows="3"
              className={`${inputStyle} text-sm normal-case font-medium resize-none`}
            />
          </div>
        </div>

        {/* ABONO MEJORADO */}
        <div className="bg-gradient-to-br from-green-500/15 to-green-500/5 border-2 border-green-500/30 p-6 rounded-[2rem] space-y-3 transition-all duration-300 hover:shadow-xl">
          <label className="block text-[11px] font-black uppercase text-green-600 flex items-center gap-2">
            <span>💰</span> Abono Inmediato
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-50">$</span>
            <input 
              type="number" 
              inputMode="numeric"
              value={abono} 
              onChange={e => setAbono(Number(e.target.value))} 
              className={`${inputStyle} pl-8 border-green-500/50 text-green-600 font-black`}
              placeholder="0"
            />
          </div>
          {abono > 0 && (
            <p className="text-[10px] text-green-600 font-black uppercase animate-pulse">
              ✨ Abono aplicado: -${abono.toLocaleString()}
            </p>
          )}
        </div>

        {/* PRODUCTOS MEJORADOS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <p className="text-xs font-black uppercase italic opacity-60 flex items-center gap-2">
              <span>🥟</span> Detalle de productos
            </p>
            <span className="text-[9px] font-black opacity-40">Cantidad</span>
          </div>
          
          {itemsVenta.map((item, index) => (
            <div key={index} className={`${cardBg} p-4 rounded-[2rem] border-2 flex gap-3 items-center transition-all duration-300 hover:shadow-xl`}>
              <select 
                value={item.productoId} 
                onChange={(e) => actualizarItem(index, 'productoId', e.target.value)}
                className="flex-1 bg-transparent font-black uppercase text-sm outline-none focus:text-orange-600 transition-colors"
              >
                <option value="">📦 SELECCIONAR PRODUCTO</option>
                {productosMenu.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} - ${p.precio}</option>
                ))}
              </select>
              <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-2 rounded-xl">
                <span className="text-[10px] font-black opacity-50">x</span>
                <input 
                  type="number" 
                  value={item.cantidad} 
                  onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
                  className="w-12 text-center bg-transparent font-black text-orange-600 outline-none"
                  min="1"
                />
              </div>
              {item.subtotal > 0 && (
                <span className="text-xs font-black text-green-600 min-w-[60px] text-right">
                  ${item.subtotal.toLocaleString()}
                </span>
              )}
            </div>
          ))}
          
          <button 
            type="button" 
            onClick={() => setItemsVenta([...itemsVenta, { productoId: '', cantidad: 1, subtotal: 0 }])}
            className="w-full py-4 border-4 border-dashed border-orange-400/50 rounded-[2rem] text-orange-600 font-black text-sm transition-all duration-300 hover:bg-orange-500/10 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span> AGREGAR OTRO PRODUCTO
          </button>
        </div>

        {/* BARRA INFERIOR DE TOTALES MEJORADA */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 rounded-[2rem] text-white shadow-2xl border-b-8 border-orange-800 sticky bottom-4 z-40 transition-all duration-300 hover:shadow-3xl">
          <div className="flex justify-between items-center mb-3 opacity-80 border-b border-white/20 pb-3">
            <span className="text-[10px] font-black uppercase italic flex items-center gap-1">
              <span>🍽️</span> Consumo: ${totalConsumo.toLocaleString()}
            </span>
            {abono > 0 && (
              <span className="text-[10px] font-black uppercase text-green-300 italic flex items-center gap-1">
                <span>💵</span> Abono: -${abono.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <p className="text-[10px] font-black opacity-80 uppercase leading-none tracking-wider">
                Total a deber
              </p>
              <p className="text-4xl font-black tracking-tighter drop-shadow-lg">
                ${totalAFiar.toLocaleString('es-CO')}
              </p>
              {totalAFiar === 0 && abono > 0 && (
                <p className="text-[8px] font-black text-green-300 uppercase mt-1 animate-pulse">
                  ✅ ¡Pagado completo!
                </p>
              )}
            </div>
            <button 
              type="submit" 
              disabled={cargando} 
              className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-black text-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              {cargando ? (
                <>
                  <span className="animate-spin">⏳</span> GUARDANDO...
                </>
              ) : (
                <>
                  ✅ LISTO
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}