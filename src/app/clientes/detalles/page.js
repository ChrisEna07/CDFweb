'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'

function DetallesClienteContent() {
  const searchParams = useSearchParams()
  const { darkMode } = useTheme()
  const clienteId = searchParams.get('id')

  const [cliente, setCliente] = useState(null)
  const [deudas, setDeudas] = useState([])
  const [cargando, setCargando] = useState(true)
  
  // Estados para el PIN de seguridad
  const [guardOpen, setGuardOpen] = useState(false)
  const [accionPendiente, setAccionPendiente] = useState(null)

  useEffect(() => {
    if (clienteId) fetchDatos()
  }, [clienteId])

  async function fetchDatos() {
    const [resCli, resDeu] = await Promise.all([
      supabase.from('clientes').select('*').eq('id', clienteId).single(),
      supabase.from('fiados').select('*, productos(nombre)').eq('cliente_id', clienteId).eq('estado', 'pendiente').order('creado_el', { ascending: false })
    ])
    setCliente(resCli.data)
    setDeudas(resDeu.data || [])
    setCargando(false)
  }

  // Función que se ejecuta tras poner el PIN correcto
  const confirmarAccion = async () => {
    if (accionPendiente?.tipo === 'PAGAR_UNO') {
      await supabase.from('fiados').update({ estado: 'pagado' }).eq('id', accionPendiente.id)
    } else if (accionPendiente?.tipo === 'PAGAR_TODO') {
      await supabase.from('fiados').update({ estado: 'pagado' }).eq('cliente_id', clienteId).eq('estado', 'pendiente')
    }
    fetchDatos()
    setAccionPendiente(null)
  }

  const bgMain = darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-black'
  const cardBg = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-400'
  const totalDeuda = deudas.reduce((acc, curr) => acc + curr.monto_total, 0)

  if (cargando) return <div className="p-10 text-center font-black">CARGANDO...</div>

  return (
    <div className={`min-h-screen pb-32 transition-colors ${bgMain}`}>
      <AdminGuard 
        isOpen={guardOpen} 
        onClose={() => setGuardOpen(false)} 
        onConfirm={confirmarAccion} 
        darkMode={darkMode} 
      />

      <div className="bg-orange-600 p-8 rounded-b-[3rem] shadow-xl text-white">
        <Link href="/clientes" className="bg-white/20 p-2 rounded-xl text-xs font-black uppercase inline-block mb-4">← Volver</Link>
        <h1 className="text-4xl font-black uppercase tracking-tighter">{cliente?.apodo}</h1>
        <div className="mt-6 bg-black/20 p-5 rounded-3xl border-2 border-white/30 flex justify-between items-center">
          <span className="font-black uppercase text-xs">Deuda Total</span>
          <span className="text-4xl font-black">${totalDeuda.toLocaleString('es-CO')}</span>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black uppercase border-b-4 border-orange-500">Pendientes</h2>
          {totalDeuda > 0 && (
            <button 
              onClick={() => { setAccionPendiente({ tipo: 'PAGAR_TODO' }); setGuardOpen(true); }}
              className="bg-green-600 text-white px-4 py-2 rounded-xl font-black text-xs shadow-lg"
            >
              PAGAR TODO
            </button>
          )}
        </div>

        <div className="space-y-3">
          {deudas.map((d) => (
            <div key={d.id} className={`${cardBg} p-4 rounded-2xl border-2 flex justify-between items-center shadow-sm`}>
              <div>
                <p className="text-[10px] font-black uppercase opacity-60">{d.creado_el}</p>
                <h3 className="text-lg font-black uppercase leading-tight">{d.productos?.nombre}</h3>
                <p className="text-xl font-black text-orange-600">${d.monto_total.toLocaleString('es-CO')}</p>
              </div>
              <button 
                onClick={() => { setAccionPendiente({ tipo: 'PAGAR_UNO', id: d.id }); setGuardOpen(true); }}
                className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-black text-xs border border-green-300"
              >
                PAGAR
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DetallesCliente() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <DetallesClienteContent />
    </Suspense>
  )
}