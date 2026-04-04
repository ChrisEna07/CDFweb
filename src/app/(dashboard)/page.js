'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { generarPDFCobro } from '@/lib/exportPDF'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import Image from 'next/image'
import AdminGuard from '@/components/AdminGuard'
import { toast } from 'sonner'
export default function Dashboard() {
  const { darkMode, toggleTheme } = useTheme()
  const [clientes, setClientes] = useState([])
  const [fiados, setFiados] = useState([])
  const [premios, setPremios] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [totalPendiente, setTotalPendiente] = useState(0)
  const [totalIngresos, setTotalIngresos] = useState(0)
  const [saludo, setSaludo] = useState('¡Hola!')
  const [cargando, setCargando] = useState(true)
  
  // ✅ ESTADOS PARA EL PARQUEADERO (NUEVO)
  const [dataParqueadero, setDataParqueadero] = useState(null)
  const [historialParqueadero, setHistorialParqueadero] = useState([])
  const [showParqueaderoModal, setShowParqueaderoModal] = useState(false)
  const [montoAbono, setMontoAbono] = useState('')
  const [notaParqueadero, setNotaParqueadero] = useState('')
  
  const [guardOpen, setGuardOpen] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [accionPendiente, setAccionPendiente] = useState(null)
  // Estados para reportes
  const [reportePeriodo, setReportePeriodo] = useState('dia')
  const [reporteIngresos, setReporteIngresos] = useState(0)
  const [reporteDeudasPagadas, setReporteDeudasPagadas] = useState(0)
  const [reporteFecha, setReporteFecha] = useState(new Date().toISOString().split('T')[0])
  const [reporteMes, setReporteMes] = useState(new Date().toISOString().slice(0, 7)) // ✅ CORREGIDO
  const [reporteSemana, setReporteSemana] = useState(getSemanaActual())
  // --- 📝 ESTADOS PARA FUNCIONES ---
  const [todos, setTodos] = useState([])
  const [nuevoTodo, setNuevoTodo] = useState('')
  const [compras, setCompras] = useState([])
  const [nuevaCompra, setNuevaCompra] = useState('')
  const [frase, setFrase] = useState('')
  const frasesMotivacionales = [
    "¡Hoy será un gran día de ventas! 🥟", "Cada esfuerzo cuenta para tus sueños 🏠",
    "Tu trabajo alimenta corazones y sonrisas 😊", "María, eres una mujer imparable 💪",
    "Dios bendice tu negocio hoy 🙏", "El Señor te dará prosperidad en todo lo que emprendas 🌟",
    "Confía en Dios y tus ventas florecerán 🌻", "Cada cliente es una bendición en camino ✨",
    "Jehová prosperará tu trabajo y te dará abundancia 🕊️", "Tus metas están más cerca de lo que crees 🚀",
    "La perseverancia abre puertas que nadie puede cerrar 🔑", "Dios te dará poder para hacer riquezas 🙌",
    "Hoy es día de cosecha, no te canses de sembrar 🌾", "El éxito está en tus manos con fe y acción 👐",
    "Encomienda a Jehová tus obras y serás establecido 📖", "Dios es tu socio fiel; confía en Su provisión 🤝",
    "Cada venta es un paso hacia tu propósito 🎯", "El cielo está de tu lado, ¡ve con fe! ☁️✨",
    "Tu negocio es semilla que dará fruto abundante 🌱🍇", "No te rindas, tu gran bendición está por llegar 🎁",
    "Hoy siembra con alegría y cosecharás con gozo 🌞", "María, tus manos son instrumento de bendición 🕯️",
    "El favor de Dios va delante de ti 🚪👑", "Pon a Dios primero y todo prosperará 🏆",
    "Tus sueños tienen respaldo celestial 🌈", "Un cliente más es una bendición más 🙏💖",
    "La fe multiplica tus ventas ⛰️➡️💰", "Dios restaura y multiplica lo que le entregas 👐✨",
    "Hoy declaro abundancia sobre tu negocio 📢🌊", "Con Dios, cada obstáculo es una oportunidad 🌟"
  ];
  function getSemanaActual() {
    const today = new Date()
    const firstDay = new Date(today)
    const lastDay = new Date(today)
    const day = today.getDay()
    const diff = day === 0 ? 6 : day - 1
    firstDay.setDate(today.getDate() - diff)
    lastDay.setDate(firstDay.getDate() + 6)
    return `${firstDay.toISOString().split('T')[0]} / ${lastDay.toISOString().split('T')[0]}`
  }
  function calcularReporte() {
    const pagados = fiados.filter(f => f.estado === 'pagado')
    
    let filtrados = []
    if (reportePeriodo === 'dia') {
      filtrados = pagados.filter(f => f.creado_el.split('T')[0] === reporteFecha)
    } else if (reportePeriodo === 'semana') {
      const [inicio, fin] = reporteSemana.split(' / ')
      filtrados = pagados.filter(f => f.creado_el.split('T')[0] >= inicio && f.creado_el.split('T')[0] <= fin)
    } else if (reportePeriodo === 'mes') {
      filtrados = pagados.filter(f => f.creado_el.startsWith(reporteMes))
    }
    
    const totalIngresosReporte = filtrados.reduce((acc, curr) => acc + Number(curr.monto_total), 0)
    const totalDeudasPagadas = filtrados.length
    
    setReporteIngresos(totalIngresosReporte)
    setReporteDeudasPagadas(totalDeudasPagadas)
  }
  useEffect(() => {
    fetchDatos()
    fetchTodos()
    fetchCompras()
    fetchPremios()
    fetchParqueadero() // ✅ NUEVA FUNCIÓN CONTROL PARQUEADERO
    
    setFrase(frasesMotivacionales[Math.floor(Math.random() * frasesMotivacionales.length)])
    
    const hora = new Date().getHours()
    if (hora >= 5 && hora < 12) setSaludo('¡Buenos días, María! ☕')
    else if (hora >= 12 && hora < 18) setSaludo('¡Buenas tardes, María! ☀️')
    else setSaludo('¡Buenas noches, María! 🌙')
  }, [])
  useEffect(() => {
    if (fiados.length > 0) {
      calcularReporte()
    }
  }, [reportePeriodo, reporteFecha, reporteSemana, reporteMes, fiados])
  // --- 🔒 CARGA DE DATOS ---
  async function fetchDatos() {
    try {
      const { data: listaClientes } = await supabase.from('clientes').select('*').order('apodo', { ascending: true })
      setClientes(listaClientes || [])
      const { data: todosLosFiados } = await supabase.from('fiados').select('*')
      setFiados(todosLosFiados || [])
      const sumaPendiente = todosLosFiados?.filter(f => f.estado === 'pendiente').reduce((acc, current) => acc + Number(current.monto_total), 0) || 0
      const sumaIngresos = todosLosFiados?.filter(f => f.estado === 'pagado').reduce((acc, current) => acc + Number(current.monto_total), 0) || 0
      setTotalPendiente(sumaPendiente)
      setTotalIngresos(sumaIngresos)
    } catch (e) { console.error(e) } finally { setCargando(false) }
  }
  async function fetchTodos() {
    const { data } = await supabase.from('todos').select('*').order('creado_el', { ascending: false })
    if (data) setTodos(data)
  }
  async function fetchCompras() {
    const { data } = await supabase.from('compras').select('*').order('comprado', { ascending: true })
    if (data) setCompras(data)
  }
  async function fetchPremios() {
    const { data } = await supabase.from('premios_entregados').select('*')
    if (data) setPremios(data)
  }
  // ✅ NUEVAS FUNCIONES: CONTROL PARQUEADERO
  async function fetchParqueadero() {
    try {
      const { data, error } = await supabase.from('parqueadero').select('*').order('creado_el', { ascending: false }).limit(1).maybeSingle()
      if (data) setDataParqueadero(data)
      
      const { data: hist } = await supabase
        .from('parqueadero_historial')
        .select('*')
        .order('fecha', { ascending: false })
      if (hist) setHistorialParqueadero(hist)
    } catch (e) { console.error(e) }
  }
  const calcularDeudaActual = () => {
    if (!dataParqueadero) return 0
    const inicio = new Date(dataParqueadero.inicio)
    const hoy = new Date()
    const diffTime = Math.max(0, hoy - inicio)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const totalAcumulado = diffDays * 5000
    return Math.max(0, totalAcumulado - (dataParqueadero.pagado || 0))
  }
  const calcularDiasTranscurridos = () => {
    if (!dataParqueadero) return 0
    const inicio = new Date(dataParqueadero.inicio)
    const hoy = new Date()
    const diffTime = Math.max(0, hoy - inicio)
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }
  async function registrarAbonoParqueadero() {
    if (!montoAbono || isNaN(montoAbono) || Number(montoAbono) <= 0) return toast.error("Ingresa un monto válido")
    try {
      const nuevoPagado = (dataParqueadero.pagado || 0) + Number(montoAbono)
      const { error: upError } = await supabase.from('parqueadero').update({ pagado: nuevoPagado, nota: notaParqueadero }).eq('id', dataParqueadero.id)
      if (upError) throw upError
      
      await supabase.from('parqueadero_historial').insert([{
        parqueadero_id: dataParqueadero.id,
        tipo: 'abono',
        monto: Number(montoAbono),
        nota: notaParqueadero || 'Abono parcial'
      }])
      
      toast.success("Abono registrado con éxito")
      setMontoAbono('')
      setNotaParqueadero('')
      fetchParqueadero()
    } catch (e) { toast.error("Error al registrar abono") }
  }
  async function registrarPagoTotal() {
    try {
      const deuda = calcularDeudaActual()
      
      const { error: upError } = await supabase.from('parqueadero').update({ 
        inicio: new Date().toISOString(), 
        pagado: 0, 
        nota: '' 
      }).eq('id', dataParqueadero.id)
      if (upError) throw upError
      
      await supabase.from('parqueadero_historial').insert([{
        parqueadero_id: dataParqueadero.id,
        tipo: 'pago_total',
        monto: deuda + (dataParqueadero.pagado || 0),
        nota: 'Pago total y reinicio de ciclo'
      }])
      
      toast.success("¡Ciclo pagado y reiniciado!")
      fetchParqueadero()
    } catch (e) { toast.error("Error al procesar pago total") }
  }
  async function agregarDiaManual() {
    if (!dataParqueadero) return
    try {
      const nuevaFecha = new Date(dataParqueadero.inicio)
      nuevaFecha.setDate(nuevaFecha.getDate() - 1)
      const { error } = await supabase.from('parqueadero').update({ inicio: nuevaFecha.toISOString() }).eq('id', dataParqueadero.id)
      if (error) throw error
      toast.success("Se agregó 1 día de deuda (+5,000)")
      fetchParqueadero()
    } catch (e) { toast.error("Error al ajustar fecha") }
  }
  // --- ✨ LÓGICA DE PUNTOS ---
  const calcularPuntos = (clienteId) => {
    const pagados = fiados.filter(f => f.cliente_id === clienteId && f.estado === 'pagado').length;
    const canjes = premios.filter(p => p.cliente_id === clienteId).length;
    
    const puntosTotales = pagados * 2;
    const puntosCanjeados = canjes * 100;
    const puntosDisponibles = Math.max(0, puntosTotales - puntosCanjeados);
    
    return puntosDisponibles;
  };
  const puedeCanjear = (clienteId) => {
    const puntosDisponibles = calcularPuntos(clienteId);
    return puntosDisponibles >= 100;
  };
  const registrarCanje = async (clienteId) => {
    const puntosDisponibles = calcularPuntos(clienteId);
    
    if (puntosDisponibles < 100) {
      toast.error(`❌ Faltan ${100 - puntosDisponibles} puntos para canjear un premio`);
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('premios_entregados')
        .insert([{ 
          cliente_id: clienteId,
          puntos_usados: 100,
          canjeado_el: new Date().toISOString()
        }]);
      
      if (error) throw error;
      
      toast.success(`🎉 ¡Premio canjeado! Te quedan ${calcularPuntos(clienteId)} puntos`);
      fetchPremios();
      return true;
    } catch (err) {
      toast.error("Error al canjear el premio");
      return false;
    }
  };
  // --- 🛒 LÓGICA COMPRAS ---
  const agregarCompra = async (e) => {
    e.preventDefault(); if (!nuevaCompra.trim()) return
    const { data } = await supabase.from('compras').insert([{ articulo: nuevaCompra.toUpperCase(), comprado: false }]).select()
    if (data) { setCompras([...compras, data[0]]); setNuevaCompra(''); }
  }
  const toggleCompra = async (id, estado) => {
    await supabase.from('compras').update({ comprado: !estado }).eq('id', id);
    setCompras(compras.map(c => c.id === id ? { ...c, comprado: !estado } : c));
  }
  const eliminarCompra = async (id) => {
    await supabase.from('compras').delete().eq('id', id);
    setCompras(compras.filter(c => c.id !== id));
  }
  // --- 📝 LÓGICA TODOS ---
  const agregarTodo = async (e) => {
    e.preventDefault(); if (!nuevoTodo.trim()) return
    const { data } = await supabase.from('todos').insert([{ text: nuevoTodo.toUpperCase() }]).select()
    if (data) { setTodos([data[0], ...todos]); setNuevoTodo(''); }
  }
  const toggleTodo = async (id, estado) => {
    await supabase.from('todos').update({ done: !estado }).eq('id', id)
    setTodos(todos.map(t => t.id === id ? { ...t, done: !estado } : t))
  }
  const eliminarTodo = async (id) => {
    await supabase.from('todos').delete().eq('id', id)
    setTodos(todos.filter(t => t.id !== id))
  }
  // --- 📊 LÓGICA REPORTES ---
  const fiadosSemana = fiados.filter(f => {
    const fecha = new Date(f.creado_el);
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    return fecha >= hace7Dias && f.estado === 'pendiente';
  }).reduce((acc, curr) => acc + Number(curr.monto_total), 0);
  const deudasMasViejas = fiados.filter(f => f.estado === 'pendiente')
    .sort((a, b) => new Date(a.creado_el) - new Date(b.creado_el)).slice(0, 5);
  const topMayorFiado = clientes.map(c => ({
    ...c, total: fiados.filter(f => f.cliente_id === c.id && f.estado === 'pendiente').reduce((acc, curr) => acc + Number(curr.monto_total), 0)
  })).sort((a, b) => b.total - a.total).slice(0, 5).filter(c => c.total > 0);
  const confirmarAccion = () => {
    if (accionPendiente?.tipo === 'reiniciar') ejecutarReiniciar()
    setAccionPendiente(null)
  }
  const ejecutarReiniciar = async () => {
    const { error } = await supabase.from('fiados').update({ estado: 'archivado' }).eq('estado', 'pagado')
    if (!error) { toast.success("Caja reiniciada"); fetchDatos(); }
  }
  const manejarPDF = async (cliente) => {
    const fiadosCliente = fiados.filter(f => f.cliente_id === cliente.id && f.estado === 'pendiente');
    if (fiadosCliente.length === 0) {
      toast.error("Este cliente no tiene deudas pendientes");
      return;
    }
    generarPDFCobro(cliente, fiadosCliente);
  }
  const bgMain = darkMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white' : 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 text-black'
  const cardBg = darkMode ? 'bg-slate-900/80 border-slate-700 backdrop-blur-sm hover:shadow-xl transition-all duration-300' : 'bg-white/80 border-orange-200 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'
  return (
    <div className={`min-h-screen pb-40 transition-all duration-500 ${bgMain}`}>
      <AdminGuard isOpen={guardOpen} onClose={() => setGuardOpen(false)} onConfirm={confirmarAccion} darkMode={darkMode} />
      {/* HEADER OPTIMIZADO CON EFECTOS MODERNOS */}
      <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-orange-700 p-6 pt-8 rounded-b-[3rem] shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400/20 rounded-full blur-2xl -ml-24 -mb-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-white p-1.5 rounded-full shadow-xl ring-4 ring-orange-400/50 transform hover:scale-105 transition-transform duration-300">
                <Image src="/logo-marivama.png" alt="Logo" width={55} height={55} className="rounded-full" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest leading-none mb-1 animate-pulse">{saludo}</p>
                <h1 className="text-2xl font-black tracking-tighter leading-tight italic uppercase bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">MAriVama</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowStats(true)} className="bg-black/30 hover:bg-black/40 p-2.5 rounded-xl text-xl border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-110 active:scale-95">📊</button>
              <button onClick={() => setShowMenu(true)} className="bg-black/30 hover:bg-black/40 p-2.5 rounded-xl text-xl border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-110 active:scale-95">📋</button>
              <button onClick={toggleTheme} className="bg-black/30 hover:bg-black/40 p-2.5 rounded-xl text-xl border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-110 active:scale-95">
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
          {/* MARQUESINA INFINITA CORREGIDA */}
          <div className="mb-6 overflow-hidden bg-black/40 py-2 rounded-xl border border-white/20 backdrop-blur-md relative h-9 flex items-center">
            <div className="absolute whitespace-nowrap animate-marquee">
              <span className="text-[12px] font-black uppercase italic px-4 text-white drop-shadow-lg">
                ✨ {frase} ✨ — ✨ {frase} ✨ — ✨ {frase} ✨
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 bg-black/30 p-5 rounded-2xl border border-white/20 backdrop-blur-md">
            <div className="text-center border-r border-white/20">
              <p className="text-[10px] uppercase font-black text-orange-200 mb-2 tracking-wider">Total Fiao</p>
              <p className="text-3xl font-black tracking-tight drop-shadow-lg">${totalPendiente.toLocaleString('es-CO')}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase font-black text-green-300 mb-2 tracking-wider">Ingresos ✨</p>
              <p className="text-3xl font-black text-green-100 tracking-tight drop-shadow-lg">${totalIngresos.toLocaleString('es-CO')}</p>
              <button onClick={() => { setAccionPendiente({tipo:'reiniciar'}); setGuardOpen(true); }} className="mt-2 text-[9px] font-black uppercase opacity-70 hover:opacity-100 underline transition-opacity">Reiniciar Caja</button>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 max-w-lg mx-auto space-y-8">
        {/* REPORTE DE INGRESOS MEJORADO */}
        <div className={`${cardBg} p-6 rounded-[2.5rem] border-2 border-orange-500/30 transition-all duration-300 hover:shadow-2xl`}>
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] uppercase font-black opacity-60 tracking-widest">📊 Reporte de Ingresos</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setReportePeriodo('dia')}
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${reportePeriodo === 'dia' ? 'bg-orange-600 text-white' : 'opacity-50'}`}
              >Día</button>
              <button 
                onClick={() => setReportePeriodo('semana')}
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${reportePeriodo === 'semana' ? 'bg-orange-600 text-white' : 'opacity-50'}`}
              >Semana</button>
              <button 
                onClick={() => setReportePeriodo('mes')}
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${reportePeriodo === 'mes' ? 'bg-orange-600 text-white' : 'opacity-50'}`}
              >Mes</button>
            </div>
          </div>
          {reportePeriodo === 'dia' && (
            <input 
              type="date" 
              value={reporteFecha} 
              onChange={e => setReporteFecha(e.target.value)}
              className="w-full p-3 rounded-xl border-2 mb-4 bg-transparent font-black text-sm"
            />
          )}
          {reportePeriodo === 'semana' && (
            <input 
              type="text" 
              value={reporteSemana} 
              onChange={e => setReporteSemana(e.target.value)}
              placeholder="AAAA-MM-DD / AAAA-MM-DD"
              className="w-full p-3 rounded-xl border-2 mb-4 bg-transparent font-black text-xs uppercase"
            />
          )}
          {reportePeriodo === 'mes' && (
            <input 
              type="month" 
              value={reporteMes} 
              onChange={e => setReporteMes(e.target.value)}
              className="w-full p-3 rounded-xl border-2 mb-4 bg-transparent font-black text-sm"
            />
          )}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="text-center">
              <p className="text-[9px] font-black uppercase opacity-50">💰 Ingresos</p>
              <p className="text-2xl font-black text-green-600">${reporteIngresos.toLocaleString('es-CO')}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase opacity-50">✅ Deudas Pagadas</p>
              <p className="text-2xl font-black text-orange-600">{reporteDeudasPagadas}</p>
            </div>
          </div>
        </div>
        {/* BUSCADOR MEJORADO */}
        <section className="space-y-5">
          <div className="relative group">
            <input 
              type="text"
              placeholder="🔍 Buscar cliente por nombre o apodo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={`w-full p-4 pl-12 rounded-2xl border-2 outline-none transition-all duration-300 focus:ring-2 focus:ring-orange-500/50 ${darkMode ? 'bg-slate-900/80 border-slate-700 focus:border-orange-500 text-white' : 'bg-white/80 border-gray-200 focus:border-orange-500 shadow-md'}`}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-40">🔍</span>
          </div>
          <div className="space-y-3">
            {clientes.filter(c => c.apodo.toLowerCase().includes(busqueda.toLowerCase())).slice(0, 15).map((cliente, index) => (
              <div key={cliente.id} className={`${cardBg} p-4 rounded-[2rem] border-2 flex justify-between items-center transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`} style={{animationDelay: `${index * 50}ms`}}>
                <Link href={`/clientes/detalles?id=${cliente.id}`} className="flex-1 group/link">
                    <h3 className="text-lg font-black uppercase leading-none group-hover/link:text-orange-600 transition-colors">{cliente.apodo}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-md">
                          🏅 {calcularPuntos(cliente.id)} PTS
                          {puedeCanjear(cliente.id) && (
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                registrarCanje(cliente.id);
                              }}
                              className="ml-1 bg-purple-600 text-white px-1.5 py-0.5 rounded-full text-[8px] font-black hover:bg-purple-700 transition-colors"
                            >
                              🎁 Canjear
                            </button>
                          )}
                        </span>
                        <p className="text-[9px] font-bold opacity-50 uppercase truncate">{cliente.nombre || 'Sin nombre'}</p>
                    </div>
                </Link>
                <button 
                  onClick={() => toast.promise(manejarPDF(cliente), { loading: 'Generando PDF...', success: '✅ ¡PDF listo!', error: '❌ Error al generar' })}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-110 active:scale-95"
                >
                  <span className="text-2xl font-bold">📄</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
      {/* 📊 MODAL DE REPORTES MEJORADO */}
      {showStats && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
            <div className={`w-full max-w-lg rounded-[3rem] p-8 overflow-y-auto max-h-[85vh] shadow-2xl transform transition-all duration-300 animate-slideUp ${darkMode ? 'bg-slate-900 border-2 border-slate-700' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-6 border-b-2 border-orange-500/20 pb-4">
                    <h2 className="text-2xl font-black uppercase italic bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">📊 Estadísticas</h2>
                    <button onClick={() => setShowStats(false)} className="bg-black/10 hover:bg-black/20 w-10 h-10 rounded-full font-bold transition-all duration-300">✕</button>
                </div>
                
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 p-5 rounded-[2rem] border border-red-500/20">
                        <h3 className="text-[11px] font-black uppercase text-red-600 mb-4 tracking-widest flex items-center gap-2">⏳ <span>Deudas más viejas</span></h3>
                        {deudasMasViejas.map(f => (
                            <div key={f.id} className="flex justify-between items-center text-sm mb-3 font-bold uppercase italic border-b border-red-500/10 pb-2">
                                <span className="text-red-700">{clientes.find(c => c.id === f.cliente_id)?.apodo}</span>
                                <span className="text-xs opacity-60">{new Date(f.creado_el).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 p-5 rounded-[2rem] border border-orange-500/20">
                        <h3 className="text-[11px] font-black uppercase text-orange-600 mb-4 tracking-widest flex items-center gap-2">💰 <span>Mayores deudas</span></h3>
                        {topMayorFiado.map(c => (
                            <div key={c.id} className="flex justify-between items-center text-sm mb-3 font-bold uppercase border-b border-orange-500/10 pb-2">
                                <span className="text-orange-700">{c.apodo}</span>
                                <span className="text-orange-600 font-black">${c.total.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-5 rounded-[2rem] border border-green-500/20">
                        <h3 className="text-[11px] font-black uppercase text-green-600 mb-4 tracking-widest flex items-center gap-2">🏅 <span>Top Puntos</span></h3>
                        {clientes.map(c => ({...c, pts: calcularPuntos(c.id)})).filter(c => c.pts > 0).sort((a,b) => b.pts - a.pts).slice(0,5).map(c => (
                            <div key={c.id} className="flex justify-between items-center text-sm mb-3 font-bold uppercase border-b border-green-500/10 pb-2">
                                <span className="text-green-700">{c.apodo}</span>
                                <span className="text-green-600 font-black">{c.pts} PTS</span>
                            </div>
                        ))}
                    </div>
                    {/* ✅ NUEVA SECCIÓN: CONTROL PARQUEADERO (ULTIMOS MOVIMIENTOS) */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-5 rounded-[2rem] border border-blue-500/20">
                        <h3 className="text-[11px] font-black uppercase text-blue-600 mb-4 tracking-widest flex items-center gap-2">🅿️ <span>Últimos Movimientos P.</span></h3>
                        {historialParqueadero.length === 0 ? (
                          <p className="text-xs opacity-60 text-center py-2">No hay movimientos registrados</p>
                        ) : (
                          historialParqueadero.slice(0, 3).map(h => (
                            <div key={h.id} className="flex justify-between items-center text-sm mb-3 font-bold uppercase border-b border-blue-500/10 pb-2">
                                <span className={`text-[9px] ${h.tipo === 'pago_total' ? 'text-green-600' : 'text-blue-700'}`}>
                                  {h.tipo === 'pago_total' ? 'Pago T.' : 'Abono'}
                                </span>
                                <span className="text-blue-700">${Number(h.monto).toLocaleString()}</span>
                                <span className="text-[9px] opacity-60">{new Date(h.fecha).toLocaleDateString()}</span>
                            </div>
                          ))
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
      {/* 🥟 MODAL DE MENÚ MEJORADO */}
      {showMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
            <div className={`w-full max-w-lg rounded-[3rem] p-8 overflow-y-auto max-h-[85vh] shadow-2xl transform transition-all duration-300 animate-slideUp ${darkMode ? 'bg-slate-900 border-2 border-slate-700' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-6 border-b-2 border-cyan-500/20 pb-4">
                    <h2 className="text-2xl font-black uppercase italic bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">🥟 Funciones</h2>
                    <button onClick={() => setShowMenu(false)} className="bg-black/10 hover:bg-black/20 w-10 h-10 rounded-full font-bold transition-all duration-300">✕</button>
                </div>
                <div className="space-y-6">
                    <Link href="/recuerdos" className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-[2rem] font-black uppercase italic shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 group">
                        <span className="flex items-center gap-3"><span className="text-3xl group-hover:rotate-12 transition-transform">📸</span> Álbum de Recuerdos</span>
                        <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                    <Link href="/productos" className="flex items-center justify-between p-5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-[2rem] font-black uppercase italic shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 group">
                        <span className="flex items-center gap-3"><span className="text-3xl group-hover:rotate-12 transition-transform">🍴</span> Gestionar Menú</span>
                        <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                    {/* ✅ NUEVO LINK: GASTOS PARQUEADERO */}
                    <button onClick={() => { setShowParqueaderoModal(true); setShowMenu(false); }} className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-[2rem] font-black uppercase italic shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 group">
                        <span className="flex items-center gap-3"><span className="text-3xl group-hover:rotate-12 transition-transform">🅿️</span> Control Parqueadero</span>
                        <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                    <section className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 p-5 rounded-[2rem] border border-cyan-500/20">
                        <h3 className="text-[11px] font-black uppercase text-cyan-600 mb-4 tracking-widest flex items-center gap-2">🛒 <span>Lista de Compras</span></h3>
                        <form onSubmit={agregarCompra} className="flex gap-2 mb-4">
                            <input type="text" value={nuevaCompra} onChange={e => setNuevaCompra(e.target.value)} className={`flex-1 p-3 rounded-xl border-2 text-sm uppercase font-bold outline-none transition-all focus:ring-2 focus:ring-cyan-500/50 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`} placeholder="¿Qué falta?" />
                            <button className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white px-5 rounded-xl font-black shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95">+</button>
                        </form>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {compras.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-white/30 dark:bg-slate-800/50 p-3 rounded-xl border group transition-all hover:shadow-md">
                                    <span onClick={() => toggleCompra(item.id, item.comprado)} className={`text-xs font-bold uppercase cursor-pointer transition-all ${item.comprado ? 'line-through opacity-40' : 'hover:text-cyan-600'}`}>{item.articulo}</span>
                                    <button onClick={() => eliminarCompra(item.id)} className="text-red-500 hover:text-red-700 p-1 transition-colors">✕</button>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-5 rounded-[2rem] border border-purple-500/20">
                        <h3 className="text-[11px] font-black uppercase text-purple-600 mb-4 tracking-widest flex items-center gap-2">📝 <span>Pendientes</span></h3>
                        <form onSubmit={agregarTodo} className="flex gap-2 mb-4">
                            <input type="text" value={nuevoTodo} onChange={e => setNuevoTodo(e.target.value)} className={`flex-1 p-3 rounded-xl border-2 text-sm uppercase font-bold outline-none transition-all focus:ring-2 focus:ring-purple-500/50 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`} placeholder="Tarea nueva..." />
                            <button className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-5 rounded-xl font-black shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95">+</button>
                        </form>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {todos.map(todo => (
                                <div key={todo.id} className="flex justify-between items-center bg-white/30 dark:bg-slate-800/50 p-3 rounded-xl border group transition-all hover:shadow-md">
                                    <div className="flex items-center gap-3 flex-1">
                                        <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id, todo.done)} className="accent-purple-600 w-5 h-5 cursor-pointer" />
                                        <span className={`text-xs font-bold uppercase transition-all ${todo.done ? 'line-through opacity-40' : ''}`}>{todo.text}</span>
                                    </div>
                                    <button onClick={() => eliminarTodo(todo.id)} className="text-red-500 hover:text-red-700 p-1 transition-colors">✕</button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
      )}
      {/* 🅿️ MODAL DE CONTROL PARQUEADERO (NUEVO) */}
      {showParqueaderoModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn text-black">
          <div className={`w-full max-w-lg rounded-[3rem] p-8 overflow-y-auto max-h-[90vh] shadow-2xl transform transition-all duration-300 animate-slideUp ${darkMode ? 'bg-slate-900 border-2 border-slate-700 text-white' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-6 border-b-2 border-blue-500/20 pb-4">
              <h2 className="text-2xl font-black uppercase italic bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">🅿️ Control Parqueadero</h2>
              <button onClick={() => setShowParqueaderoModal(false)} className={`w-10 h-10 rounded-full font-bold transition-all duration-300 ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'}`}>✕</button>
            </div>
            {dataParqueadero ? (
              <div className="space-y-6">
                {/* ESTADO ACTUAL */}
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-6 rounded-[2.5rem] border-2 border-blue-500/20 text-center">
                  <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Días Acumulados</p>
                  <p className="text-4xl font-black text-blue-600 mb-4">{calcularDiasTranscurridos()} días</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`${darkMode ? 'bg-slate-800' : 'bg-gray-50'} p-3 rounded-2xl`}>
                      <p className="text-[9px] font-black opacity-50 uppercase">Total Tarifa</p>
                      <p className="text-lg font-black">${(calcularDiasTranscurridos() * 5000).toLocaleString()}</p>
                    </div>
                    <div className={`${darkMode ? 'bg-slate-800' : 'bg-gray-50'} p-3 rounded-2xl`}>
                      <p className="text-[9px] font-black opacity-50 uppercase">Ya Abonado</p>
                      <p className="text-lg font-black text-green-600">${Number(dataParqueadero.pagado || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-blue-500/10">
                    <p className="text-[10px] font-black opacity-50 uppercase">Monto Pendiente</p>
                    <p className="text-3xl font-black text-orange-600">${calcularDeudaActual().toLocaleString()}</p>
                  </div>
                </div>
                {/* ACCIONES */}
                <section className="space-y-4">
                  <div className={`${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} p-5 rounded-[2rem] border border-blue-500/10`}>
                    <h3 className="text-[11px] font-black uppercase text-blue-600 mb-4 tracking-widest">💸 Registrar Abono</h3>
                    <div className="space-y-3">
                      <input 
                        type="number" 
                        value={montoAbono} 
                        onChange={e => setMontoAbono(e.target.value)}
                        placeholder="Monto a abonar..." 
                        className={`w-full p-4 rounded-2xl border-2 outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-100'}`}
                      />
                      <input 
                        type="text" 
                        value={notaParqueadero} 
                        onChange={e => setNotaParqueadero(e.target.value)}
                        placeholder="Nota o detalle..." 
                        className={`w-full p-4 rounded-2xl border-2 outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-100'}`}
                      />
                      <button 
                        onClick={registrarAbonoParqueadero}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-black uppercase shadow-lg hover:shadow-xl transition-all active:scale-95"
                      >
                        Confirmar Abono
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => { if(confirm("¿Estás seguro de reiniciar el ciclo? Esto registrará el pago total.")) registrarPagoTotal() }}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl font-black uppercase shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>✅ Pago Total y Reiniciar</span>
                  </button>
                  <button 
                    onClick={agregarDiaManual}
                    className="w-full py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black uppercase text-xs shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border-2 border-dashed border-slate-400 dark:border-slate-600"
                  >
                    <span>➕ Agregar día manual (+ $5,000)</span>
                  </button>
                </section>
                {/* HISTORIAL */}
                <section className="bg-slate-500/5 p-5 rounded-[2rem] border border-slate-500/10">
                  <h3 className="text-[11px] font-black uppercase text-slate-600 mb-4 tracking-widest">📜 Historial de Pagos</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {historialParqueadero.length === 0 ? (
                      <p className="text-xs opacity-50 text-center py-4 italic">No hay movimientos registrados</p>
                    ) : (
                      historialParqueadero.map(h => (
                        <div key={h.id} className={`flex flex-col p-3 rounded-2xl border border-black/5 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                          <div className="flex justify-between items-start">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${h.tipo === 'pago_total' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
                              {h.tipo === 'pago_total' ? 'Pago Total' : 'Abono'}
                            </span>
                            <span className="text-[10px] opacity-40 font-bold">{new Date(h.fecha).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm font-black mt-1">${Number(h.monto).toLocaleString()}</p>
                          {h.nota && <p className="text-[10px] opacity-60 italic mt-1">{h.nota}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            ) : (
              <div className="text-center py-10 opacity-50 font-bold italic">No se encontró registro inicial. Asegúrate de insertar un registro en la tabla parqueadero.</div>
            )}
          </div>
        </div>
      )}
      {/* NAVBAR MEJORADO CON EFECTOS GLASS */}
      <nav className={`${darkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-orange-200'} backdrop-blur-xl fixed bottom-6 left-6 right-6 border-4 rounded-[3rem] p-4 flex justify-around items-center z-50 shadow-2xl`}>
        <Link href="/" className="flex flex-col items-center group">
          <span className="text-4xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1">🏠</span>
          <span className="text-[10px] font-black uppercase mt-1 opacity-70 group-hover:opacity-100 transition-opacity">Inicio</span>
        </Link>
        <Link href="/fiados/nuevo" className="bg-gradient-to-r from-orange-600 to-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-xl -mt-16 border-[6px] border-orange-50 dark:border-slate-800 transition-all duration-300 hover:shadow-2xl hover:scale-110 active:scale-95 group">
          <span className="text-4xl font-bold transition-transform duration-300 group-hover:rotate-90">+</span>
        </Link>
        <Link href="/clientes" className="flex flex-col items-center group">
          <span className="text-4xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1">👤</span>
          <span className="text-[10px] font-black uppercase mt-1 opacity-70 group-hover:opacity-100 transition-opacity">Deudores</span>
        </Link>
      </nav>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
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
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}