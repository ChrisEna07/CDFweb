'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'
import { toast } from 'sonner'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'

function DetallesClienteContent() {
  const searchParams = useSearchParams()
  const { darkMode } = useTheme()
  const clienteId = searchParams.get('id')

  const [cliente, setCliente] = useState(null)
  const [deudas, setDeudas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [historialPagados, setHistorialPagados] = useState([])
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  
  // Estados para abono parcial
  const [showAbonoModal, setShowAbonoModal] = useState(false)
  const [deudaSeleccionada, setDeudaSeleccionada] = useState(null)
  const [montoAbono, setMontoAbono] = useState('')
  const [notaAbono, setNotaAbono] = useState('')
  const [abonando, setAbonando] = useState(false)
  
  // Estados para el PIN de seguridad
  const [guardOpen, setGuardOpen] = useState(false)
  const [accionPendiente, setAccionPendiente] = useState(null)

  // Estados para edición de deuda
  const [showEditModal, setShowEditModal] = useState(false)
  const [editDeuda, setEditDeuda] = useState(null)
  const [nuevoMonto, setNuevoMonto] = useState('')
  const [nuevasNotas, setNuevasNotas] = useState('')
  const [editando, setEditando] = useState(false)
  
  const [showMenu, setShowMenu] = useState(false)
  const [atendenteLogueado, setAtendenteLogueado] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('atendente_logueado')
    if (saved) setAtendenteLogueado(JSON.parse(saved))
  }, [])

  async function registrarLog(accion, detalle) {
    const usuario = atendenteLogueado?.nombre || 'SISTEMA'
    try {
      await supabase.from('logs').insert([{ 
        usuario: usuario.toUpperCase(), 
        accion, 
        detalle, 
        fecha: new Date().toISOString() 
      }])
    } catch (e) { console.error("Error log:", e) }
  }

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

  // Función para registrar un abono parcial
  const registrarAbono = async () => {
    if (!deudaSeleccionada) return
    const abonoMonto = Number(montoAbono)
    
    if (abonoMonto <= 0) {
      toast.error("Ingresa un monto válido para el abono")
      return
    }
    
    if (abonoMonto >= deudaSeleccionada.monto_total) {
      toast.error("Para pagar la deuda completa usa el botón PAGAR")
      return
    }
    
    setAbonando(true)
    
    try {
      // Calcular nuevo monto de la deuda
      const nuevoMonto = deudaSeleccionada.monto_total - abonoMonto
      
      // Actualizar la deuda existente
      const { error: updateError } = await supabase
        .from('fiados')
        .update({ 
          monto_total: nuevoMonto,
          notas: notaAbono ? `${deudaSeleccionada.notas || ''} | ABONO: $${abonoMonto} - ${notaAbono.toUpperCase()}` : `${deudaSeleccionada.notas || ''} | ABONO: $${abonoMonto}`
        })
        .eq('id', deudaSeleccionada.id)
      
      if (updateError) throw updateError
      
      // Registrar el abono en una tabla de historial de abonos (opcional)
      // Para mantener historial, podríamos crear una tabla 'abonos'
      // Por ahora actualizamos la nota de la deuda
      
      toast.success(`✅ Abono de $${abonoMonto.toLocaleString()} registrado correctamente`)
      registrarLog("ABONO", `Abono de $${abonoMonto} para ${cliente.apodo}. Deuda: ${deudaSeleccionada.productos?.nombre}`)
      setShowAbonoModal(false)
      setMontoAbono('')
      setNotaAbono('')
      setDeudaSeleccionada(null)
      fetchDatos()
    } catch (err) {
      toast.error("Error al registrar el abono: " + err.message)
    } finally {
      setAbonando(false)
    }
  }

  // Función para editar una deuda completa (corrección)
  const guardarEdicion = async () => {
    if (!editDeuda || !nuevoMonto) return
    setEditando(true)
    try {
      const { error } = await supabase
        .from('fiados')
        .update({ 
          monto_total: Number(nuevoMonto),
          notas: nuevasNotas.toUpperCase()
        })
        .eq('id', editDeuda.id)
      
      if (error) throw error
      toast.success("✅ Registro corregido con éxito")
      registrarLog("CORRECCION", `Corrección de deuda para ${cliente.apodo}. Nuevo monto: $${nuevoMonto}`)
      setShowEditModal(false)
      fetchDatos()
    } catch (err) {
      toast.error("Error al editar: " + err.message)
    } finally {
      setEditando(false)
    }
  }

  // Función que se ejecuta tras poner el PIN correcto para pagos completos
  const confirmarAccion = async () => {
    if (accionPendiente?.tipo === 'PAGAR_UNO') {
      const { error } = await supabase
        .from('fiados')
        .update({ estado: 'pagado' })
        .eq('id', accionPendiente.id)
      
      if (error) {
        toast.error("Error al pagar la deuda")
      } else {
        toast.success("✅ Deuda pagada correctamente")
        registrarLog("PAGO", `Pago de fiado individual para ${cliente.apodo}`)
      }
    } else if (accionPendiente?.tipo === 'PAGAR_TODO') {
      const { error } = await supabase
        .from('fiados')
        .update({ estado: 'pagado' })
        .eq('cliente_id', clienteId)
        .eq('estado', 'pendiente')
      
      if (error) {
        toast.error("Error al pagar todas las deudas")
      } else {
        toast.success("✅ Todas las deudas han sido pagadas")
        registrarLog("PAGO_TOTAL", `Pago de todas las deudas de ${cliente.apodo}`)
      }
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

  // Lógica de recomendación de fiado
  const obtenerRecomendacion = () => {
    if (totalDeuda === 0) return { label: 'Recomendado', color: 'bg-green-500', icon: '✅', text: 'Cliente al día. Se le puede fiar sin problemas.' }
    
    let riesgo = 0
    if (totalDeuda > 100000) riesgo += 2
    if (totalDeuda > 200000) riesgo += 3
    
    // Verificar antigüedad (más de 3 semanas)
    const tresSemanasMs = 3 * 7 * 24 * 60 * 60 * 1000
    const tieneDeudaVieja = deudas.some(d => (new Date() - new Date(d.creado_el)) > tresSemanasMs)
    if (tieneDeudaVieja) riesgo += 4

    if (riesgo >= 7) return { label: '🚫 Detener Fiado', color: 'bg-red-600', icon: '⛔', text: 'Riesgo ALTO. Deuda excesiva o muy antigua. No fiar más hasta que abone.' }
    if (riesgo >= 3) return { label: '⚠️ Con Cuidado', color: 'bg-amber-500', icon: '🟡', text: 'Riesgo moderado. Sugerimos pedir un abono antes de seguir fiando.' }
    
    return { label: '✅ Recomendado', color: 'bg-green-500', icon: '🟢', text: 'Buen historial. Se le puede seguir fiando.' }
  }
  const recomendacion = obtenerRecomendacion()

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

      {/* MODAL DE ABONO */}
      {showAbonoModal && deudaSeleccionada && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
          <div className={`w-full max-w-md rounded-[2rem] p-6 shadow-2xl transform transition-all duration-300 animate-slideUp ${darkMode ? 'bg-slate-900 border-2 border-slate-700' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-orange-500/20">
              <h3 className="text-xl font-black uppercase flex items-center gap-2">
                💰 Abono Parcial
              </h3>
              <button 
                onClick={() => setShowAbonoModal(false)}
                className="bg-black/10 hover:bg-black/20 w-8 h-8 rounded-full font-bold transition-all duration-300"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase opacity-60">Producto</p>
                <p className="font-black text-lg">{deudaSeleccionada.productos?.nombre}</p>
              </div>
              
              <div>
                <p className="text-[10px] font-black uppercase opacity-60">Deuda actual</p>
                <p className="font-black text-2xl text-orange-600">${deudaSeleccionada.monto_total.toLocaleString('es-CO')}</p>
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase mb-2 opacity-60 flex items-center gap-2">
                  <span>💰</span> Monto del abono
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-50">$</span>
                  <input 
                    type="number" 
                    value={montoAbono}
                    onChange={(e) => setMontoAbono(e.target.value)}
                    max={deudaSeleccionada.monto_total - 1}
                    className={`w-full p-4 pl-12 rounded-2xl border-2 font-black transition-all duration-300 focus:ring-2 focus:ring-orange-500/50 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-black'}`}
                    placeholder="0"
                  />
                </div>
                <p className="text-[8px] opacity-50 mt-1">Máximo: ${(deudaSeleccionada.monto_total - 1).toLocaleString()}</p>
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase mb-2 opacity-60 flex items-center gap-2">
                  <span>📝</span> Nota del abono (opcional)
                </label>
                <textarea 
                  value={notaAbono}
                  onChange={(e) => setNotaAbono(e.target.value)}
                  placeholder="EJ: ABONÓ $10,000, QUEDA DEBE..."
                  rows="2"
                  className={`w-full p-3 rounded-xl border-2 text-sm font-medium transition-all focus:ring-2 focus:ring-orange-500/50 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-black'}`}
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowAbonoModal(false)}
                  className="flex-1 py-3 rounded-xl font-black text-sm border-2 opacity-60 hover:opacity-100 transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={registrarAbono}
                  disabled={abonando || !montoAbono || Number(montoAbono) <= 0}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-xl font-black text-sm shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {abonando ? 'REGISTRANDO...' : 'REGISTRAR ABONO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

          {/* INDICADOR DE RECOMENDACIÓN */}
          <div className={`${recomendacion.color} p-4 rounded-2xl flex items-center gap-4 border border-white/20 shadow-xl mb-4 animate-fadeIn`}>
            <span className="text-3xl">{recomendacion.icon}</span>
            <div>
              <p className="font-black uppercase text-xs">{recomendacion.label}</p>
              <p className="text-[10px] font-bold opacity-90 leading-tight">{recomendacion.text}</p>
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
                className={`${cardBg} p-5 rounded-[2rem] border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}
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
                  <h3 className="text-xl font-black uppercase leading-tight">
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
                <div className="flex gap-2 mt-3">
                  <button 
                    onClick={() => { 
                      const pin = prompt("🔐 Clave Admin para abonar:")
                      if (['1407', '3008'].includes(pin)) {
                        setDeudaSeleccionada(d)
                        setMontoAbono('')
                        setNotaAbono('')
                        setShowAbonoModal(true)
                      } else {
                        toast.error("Clave incorrecta")
                      }
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    💵 ABONAR
                  </button>
                  <button 
                    onClick={() => { setAccionPendiente({ tipo: 'PAGAR_UNO', id: d.id }); setGuardOpen(true); }}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl"
                  >
                    💰 PAGAR
                  </button>
                  <button 
                    onClick={() => { 
                      const pin = prompt("🔐 Clave Admin para corregir:")
                      if (['1407', '3008'].includes(pin)) {
                        setEditDeuda(d)
                        setNuevoMonto(d.monto_total)
                        setNuevasNotas(d.notas || '')
                        setShowEditModal(true)
                      } else {
                        toast.error("Clave incorrecta")
                      }
                    }}
                    className="bg-gray-200 text-gray-700 dark:bg-slate-800 dark:text-gray-300 px-3 py-2 rounded-xl font-black text-[10px] shadow transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Navbar onMenuClick={() => setShowMenu(true)} />
      <Sidebar 
        isOpen={showMenu} 
        onClose={() => setShowMenu(false)} 
        onAction={() => toast.info("Acción disponible en Inicio")}
      />

      {/* ESTILOS GLOBALES */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
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