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
  const [historialPagados, setHistorialPagados] = useState([])
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  
  // Estados para el PIN de seguridad
  const [guardOpen, setGuardOpen] = useState(false)
  const [accionPendiente, setAccionPendiente] = useState(null)

  useEffect(() => {
    if (clienteId) fetchDatos()
  }, [clienteId])

  async function fetchDatos() {
    const [resCli, resDeu, resPagados] = await Promise.all([
      supabase.from('clientes').select('*').eq('id', clienteId).single(),
      supabase.from('fiados').select('*, productos(nombre)').eq('cliente_id', clienteId).eq('estado', 'pendiente').order('creado_el', { ascending: false }),
      supabase.from('fiados').select('*, productos(nombre)').eq('cliente_id', clienteId).eq('estado', 'pagado').order('creado_el', { ascending: false }).limit(20)
    ])
    setCliente(resCli.data)
    setDeudas(resDeu.data || [])
    setHistorialPagados(resPagados.data || [])
    setCargando(false)
  }

  // Función que se ejecuta tras poner el PIN correcto
  const confirmarAccion = async () => {
    if (accionPendiente?.tipo === 'PAGAR_UNO') {
      await supabase.from('fiados').update({ estado: 'pagado' }).eq('id', accionPendiente.id)
      toast.success("✅ Deuda pagada correctamente")
    } else if (accionPendiente?.tipo === 'PAGAR_TODO') {
      await supabase.from('fiados').update({ estado: 'pagado' }).eq('cliente_id', clienteId).eq('estado', 'pendiente')
      toast.success("✅ Todas las deudas han sido pagadas")
    }
    fetchDatos()
    setAccionPendiente(null)
  }

  const bgMain = darkMode 
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white' 
    : 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 text-black'
  
  const cardBg = darkMode 
    ? 'bg-slate-900/80 border-slate-700 backdrop-blur-sm hover:shadow-xl transition-all duration-300' 
    : 'bg-white/80 border-orange-200 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'
  
  const totalDeuda = deudas.reduce((acc, curr) => acc + curr.monto_total, 0)
  const totalPagado = historialPagados.reduce((acc, curr) => acc + curr.monto_total, 0)

  if (cargando) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgMain}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
          <p className="font-black text-orange-600 uppercase">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgMain}`}>
        <div className="text-center">
          <span className="text-6xl block mb-4">😕</span>
          <p className="font-black text-xl">Cliente no encontrado</p>
          <Link href="/clientes" className="mt-6 inline-block bg-orange-600 text-white px-6 py-3 rounded-xl font-black">
            Volver a clientes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen pb-40 transition-all duration-500 ${bgMain}`}>
      <AdminGuard 
        isOpen={guardOpen} 
        onClose={() => setGuardOpen(false)} 
        onConfirm={confirmarAccion} 
        darkMode={darkMode} 
      />

      {/* HEADER MEJORADO */}
      <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-orange-700 p-6 pt-8 rounded-b-[3rem] shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400/20 rounded-full blur-2xl -ml-24 -mb-24"></div>
        
        <div className="relative z-10">
          <Link 
            href="/clientes" 
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2.5 rounded-xl text-xs font-black uppercase transition-all duration-300 hover:scale-105 mb-6"
          >
            ← Volver a clientes
          </Link>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest mb-1">Cliente</p>
              <h1 className="text-4xl font-black uppercase tracking-tighter bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
                {cliente?.apodo}
              </h1>
              {cliente?.nombre && (
                <p className="text-sm opacity-80 mt-1">{cliente.nombre}</p>
              )}
              {cliente?.telefono && (
                <p className="text-xs opacity-70 flex items-center gap-1 mt-1">
                  <span>📞</span> {cliente.telefono}
                </p>
              )}
            </div>
            <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center backdrop-blur-sm">
              <span className="text-4xl">👤</span>
            </div>
          </div>
          
          <div className="mt-6 bg-black/30 backdrop-blur-md p-5 rounded-2xl border border-white/20 flex justify-between items-center">
            <div>
              <span className="font-black uppercase text-[9px] text-orange-200 tracking-widest">Deuda Total</span>
              <p className="text-4xl font-black drop-shadow-lg">${totalDeuda.toLocaleString('es-CO')}</p>
            </div>
            {totalDeuda > 0 && (
              <button 
                onClick={() => { setAccionPendiente({ tipo: 'PAGAR_TODO' }); setGuardOpen(true); }}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-black text-sm shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                💰 PAGAR TODO
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto space-y-6">
        {/* RESÚMEN DE PAGOS */}
        {historialPagados.length > 0 && (
          <div className={`${cardBg} p-4 rounded-[2rem] border-2`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black uppercase opacity-60">Historial de pagos</p>
                <p className="text-2xl font-black text-green-600">${totalPagado.toLocaleString('es-CO')}</p>
                <p className="text-[8px] font-black uppercase opacity-50 mt-1">{historialPagados.length} pagos realizados</p>
              </div>
              <button 
                onClick={() => setMostrarHistorial(!mostrarHistorial)}
                className="text-orange-600 font-black text-xs uppercase underline"
              >
                {mostrarHistorial ? 'Ocultar' : 'Ver historial'}
              </button>
            </div>
            
            {mostrarHistorial && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                {historialPagados.map((pago) => (
                  <div key={pago.id} className="flex justify-between items-center text-xs py-2 border-b border-gray-200/30">
                    <div>
                      <p className="font-black uppercase">{pago.productos?.nombre}</p>
                      <p className="text-[8px] opacity-50">{new Date(pago.creado_el).toLocaleDateString()}</p>
                    </div>
                    <p className="font-black text-green-600">${pago.monto_total.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DEUDAS PENDIENTES */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black uppercase border-b-4 border-orange-500 pb-1">
            Pendientes
          </h2>
          <span className="text-[10px] font-black opacity-50">
            {deudas.length} {deudas.length === 1 ? 'deuda' : 'deudas'}
          </span>
        </div>

        <div className="space-y-4">
          {deudas.length === 0 ? (
            <div className={`${cardBg} p-8 rounded-[2rem] border-2 text-center`}>
              <span className="text-5xl block mb-3">🎉</span>
              <p className="font-black uppercase text-lg mb-2">¡Todo pagado!</p>
              <p className="text-xs opacity-60">Este cliente no tiene deudas pendientes</p>
            </div>
          ) : (
            deudas.map((d, index) => (
              <div 
                key={d.id} 
                className={`${cardBg} p-5 rounded-[2rem] border-2 flex justify-between items-center transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}
                style={{animationDelay: `${index * 50}ms`}}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[9px] font-black uppercase opacity-50 bg-black/10 px-2 py-0.5 rounded-full">
                      {new Date(d.creado_el).toLocaleDateString()}
                    </p>
                    {d.notas && (
                      <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                        📝 Nota
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black uppercase leading-tight group-hover/link:text-orange-600 transition-colors">
                    {d.productos?.nombre}
                  </h3>
                  {d.cantidad > 1 && (
                    <p className="text-[10px] font-black opacity-50">Cantidad: {d.cantidad}</p>
                  )}
                  {d.notas && (
                    <p className="text-[9px] font-bold italic mt-1 opacity-70 bg-orange-500/10 p-2 rounded-lg">
                      📌 {d.notas}
                    </p>
                  )}
                  <p className="text-2xl font-black text-orange-600 mt-2">
                    ${d.monto_total.toLocaleString('es-CO')}
                  </p>
                </div>
                <button 
                  onClick={() => { setAccionPendiente({ tipo: 'PAGAR_UNO', id: d.id }); setGuardOpen(true); }}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-3 rounded-xl font-black text-sm shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl flex items-center gap-2"
                >
                  💰 PAGAR
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* NAVEGACIÓN INFERIOR MEJORADA */}
      <nav className={`${darkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-orange-200'} backdrop-blur-xl fixed bottom-6 left-6 right-6 border-4 rounded-[3rem] p-4 flex justify-around items-center z-50 shadow-2xl`}>
        <Link href="/" className="flex flex-col items-center group">
          <span className="text-3xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1">🏠</span>
          <span className={`text-[10px] font-black uppercase mt-1 opacity-70 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-white' : 'text-black'}`}>Inicio</span>
        </Link>
        
        <Link href="/fiados/nuevo" className="bg-gradient-to-r from-orange-600 to-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-xl -mt-16 border-[6px] border-orange-50 dark:border-slate-800 transition-all duration-300 hover:shadow-2xl hover:scale-110 active:scale-95 group">
          <span className="text-4xl font-bold transition-transform duration-300 group-hover:rotate-90">+</span>
        </Link>

        <Link href="/clientes" className="flex flex-col items-center group">
          <span className="text-3xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 text-orange-600">👥</span>
          <span className="text-[10px] font-black uppercase mt-1 text-orange-600">Clientes</span>
        </Link>
      </nav>

      {/* ESTILOS GLOBALES */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}

export default function DetallesCliente() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
          <p className="font-black text-orange-600 uppercase">Cargando...</p>
        </div>
      </div>
    }>
      <DetallesClienteContent />
    </Suspense>
  )
}