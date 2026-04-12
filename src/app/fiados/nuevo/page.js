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
  
  // CORRECCIÓN DE FECHA: Función robusta para obtener YYYY-MM-DD en hora local
  const getHoyLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [fecha, setFecha] = useState(getHoyLocal())
  
  // Función para mostrar la fecha en formato DD/MM/AAAA
  const formatearFecha = (f) => {
    if (!f) return ''
    const [year, month, day] = f.split('-')
    return `${day}/${month}/${year}`
  }
  
  const [itemsVenta, setItemsVenta] = useState([{ productoId: '', cantidad: 1, subtotal: 0 }])
  const [abono, setAbono] = useState(0)
  const [notas, setNotas] = useState('')
  const [cargando, setCargando] = useState(false)

  const [foto, setFoto] = useState(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    // Lógica de recordatorio de fechas de pago (14, 15, 29, 30, 31)
    const diaActual = new Date().getDate();
    const diasPago = [14, 15, 29, 30, 31];
    
    if (diasPago.includes(diaActual)) {
      toast.info(`📢 ¡Hoy es día de cobro (${diaActual})! Recuerda revisar los pendientes.`, {
        duration: 8000,
      });
    }

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

        // Combinamos la fecha seleccionada con la hora actual para mantener precisión
        const ahora = new Date();
        const [anio, mes, dia] = fecha.split('-').map(Number);
        const fechaConHora = new Date(anio, mes - 1, dia, ahora.getHours(), ahora.getMinutes(), ahora.getSeconds());

        return {
          cliente_id: clienteId,
          producto_id: item.productoId,
          cantidad: parseInt(item.cantidad),
          monto_total: montoNeto,
          creado_el: fechaConHora.toISOString(), 
          evidencia_url: urlEvidencia,
          notas: notas.toUpperCase(),
          estado: montoNeto <= 0 ? 'pagado' : 'pendiente'
        }
      })

      const { error } = await supabase.from('fiados').insert(registros)
      if (error) throw error
      
      toast.success("¡Venta registrada con fecha correcta! 🥟")
      router.push('/')
    } catch (err) {
      toast.error("Error: " + err.message)
    } finally {
      setCargando(false)
    }
  }

  // Estilos visuales adaptables
  const bgMain = darkMode 
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white' 
    : 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 text-black'
  
  const cardBg = darkMode 
    ? 'bg-slate-900/80 border-slate-700 backdrop-blur-sm' 
    : 'bg-white/80 border-orange-200 backdrop-blur-sm shadow-lg'
  
  const inputStyle = `w-full p-4 rounded-2xl border-2 font-black transition-all ${
    darkMode 
      ? 'bg-slate-900/80 border-slate-700 text-white focus:border-orange-500' 
      : 'bg-white/80 border-gray-200 text-black focus:border-orange-500 shadow-md'
  }`

  return (
    <div className={`min-h-screen p-4 pb-44 ${bgMain}`}>
      <div className="w-full max-w-xl mx-auto mb-6 flex justify-between items-center">
        <Link href="/" className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-black shadow-md">
          ← VOLVER
        </Link>
        <span className="text-orange-600 font-black italic uppercase text-xs">Anotar Pedido</span>
      </div>

      <form onSubmit={guardarVenta} className="max-w-xl mx-auto space-y-6">
        
        <div className={`${cardBg} p-6 rounded-[2rem] border-2 space-y-5`}>
          {/* CLIENTE */}
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 opacity-60">👤 Cliente</label>
            <select value={clienteId} onChange={e => setClienteId(e.target.value)} className={inputStyle}>
              <option value="">-- SELECCIONAR CLIENTE --</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.apodo}</option>)}
            </select>
          </div>

          {/* FECHA CORREGIDA */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] font-black uppercase opacity-60">📅 Fecha de la Venta</label>
              <span className="text-[10px] font-black text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-full">
                Vista: {formatearFecha(fecha)}
              </span>
            </div>
            <div className="flex gap-2">
              <input 
                type="date" 
                value={fecha} 
                onChange={e => setFecha(e.target.value)} 
                className={`${inputStyle} flex-1`} 
              />
              <button 
                type="button"
                onClick={() => setFecha(getHoyLocal())}
                className="bg-orange-500/20 text-orange-600 px-4 rounded-2xl font-black text-xs hover:bg-orange-500/30 transition-all"
              >
                HOY
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase mb-2 opacity-60">📝 Nota (Opcional)</label>
            <textarea 
              value={notas} onChange={e => setNotas(e.target.value)}
              placeholder="EJ: PAGA EL QUINCE..." rows="2"
              className={`${inputStyle} text-sm normal-case font-medium resize-none`}
            />
          </div>
        </div>

        {/* ABONO */}
        <div className="bg-green-500/10 border-2 border-green-500/30 p-6 rounded-[2rem] space-y-3">
          <label className="block text-[11px] font-black uppercase text-green-600">💰 Abono Inmediato</label>
          <input 
            type="number" value={abono} 
            onChange={e => setAbono(Number(e.target.value))} 
            className={`${inputStyle} border-green-500/50 text-green-600 font-black`}
            placeholder="0"
          />
        </div>

        {/* PRODUCTOS */}
        <div className="space-y-4">
          {itemsVenta.map((item, index) => (
            <div key={index} className={`${cardBg} p-4 rounded-[2rem] border-2 flex gap-3 items-center`}>
              <select 
                value={item.productoId} 
                onChange={(e) => actualizarItem(index, 'productoId', e.target.value)}
                className="flex-1 bg-transparent font-black uppercase text-sm outline-none"
              >
                <option value="">📦 PRODUCTO</option>
                {productosMenu.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} - ${p.precio}</option>
                ))}
              </select>
              <input 
                type="number" value={item.cantidad} 
                onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
                className="w-12 text-center font-black text-orange-600 bg-orange-500/10 rounded-lg p-1"
                min="1"
              />
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => setItemsVenta([...itemsVenta, { productoId: '', cantidad: 1, subtotal: 0 }])}
            className="w-full py-3 border-4 border-dashed border-orange-400/50 rounded-[2rem] text-orange-600 font-black text-sm"
          >
            + AGREGAR OTRO
          </button>
        </div>

        {/* BOTÓN FLOTANTE FINAL */}
        <div className="bg-orange-600 p-6 rounded-[2rem] text-white shadow-2xl sticky bottom-4 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black opacity-80 uppercase">Total a deber</p>
            <p className="text-4xl font-black">${totalAFiar.toLocaleString('es-CO')}</p>
          </div>
          <button 
            type="submit" disabled={cargando} 
            className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-black text-xl active:scale-95 transition-transform"
          >
            {cargando ? "..." : "✅ LISTO"}
          </button>
        </div>
      </form>
    </div>
  )
}