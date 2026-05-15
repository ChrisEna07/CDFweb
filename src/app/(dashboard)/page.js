'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { generarPDFCobro } from '@/lib/exportPDF'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import Image from 'next/image'
import AdminGuard from '@/components/AdminGuard'
import { toast } from 'sonner'
import { offlineQueue } from '@/lib/offline'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { QRCodeCanvas } from 'qrcode.react'
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

  // ✅ ESTADOS PARA EL MÓDULO PIPETA (NUEVO)
  const [pipetas, setPipetas] = useState([])
  const [showPipetaModal, setShowPipetaModal] = useState(false)
  const [dataPipeta, setDataPipeta] = useState(null) // Para abonos/liquidación
  const [costoPipeta, setCostoPipeta] = useState('')
  const [pagoTipoPipeta, setPagoTipoPipeta] = useState('pagado') // 'pagado' o 'fiado'
  const [montoAbonoPipeta, setMontoAbonoPipeta] = useState('')
  const [notaPipeta, setNotaPipeta] = useState('')

  // ✅ ESTADOS PARA MÉTRICAS DEL DÍA
  const [totalFiadosHoy, setTotalFiadosHoy] = useState(0)
  const [totalIngresosHoy, setTotalIngresosHoy] = useState(0)

  // ✅ ESTADO PARA EDICIÓN DE PARQUEADERO Y PIPETAS
  const [modoEdicionParqueadero, setModoEdicionParqueadero] = useState(false)
  const [editFechaInicio, setEditFechaInicio] = useState('')
  const [editPagadoInicial, setEditPagadoInicial] = useState('')
  const [itemAbonoEdit, setItemAbonoEdit] = useState(null) // Para editar historial específico

  // ✅ ESTADOS PARA CIERRE Y APERTURA (NUEVO)
  const [showAperturaModal, setShowAperturaModal] = useState(false)
  const [showCierreModal, setShowCierreModal] = useState(false)
  const [kgMasa, setKgMasa] = useState('')
  const [hizoJugo, setHizoJugo] = useState(false)
  const [cantJugo, setCantJugo] = useState('')
  const [hizoTortas, setHizoTortas] = useState(false)
  const [cantTortas, setCantTortas] = useState('')
  const [ventasEfectivo, setVentasEfectivo] = useState('')
  const [productosPrecios, setProductosPrecios] = useState({})
  const [atendentes, setAtendentes] = useState([
    { nombre: 'MARIA', pin: '1407' },
    { nombre: 'CHRISTIAN', pin: '3008' }
  ])
  const [atendenteLogueado, setAtendenteLogueado] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showAtendentesModal, setShowAtendentesModal] = useState(false)
  const [modalConfig, setModalConfig] = useState({ show: false, title: '', message: '', type: 'pin', onConfirm: null, value: '', inputPlaceholder: '' })
  
  const ADMIN_PIN = '1407'

  // ✅ PERSISTENCIA DE ATENDENTE Y LISTA
  useEffect(() => {
    const savedAtendentes = localStorage.getItem('atendentes_lista')
    if (savedAtendentes) setAtendentes(JSON.parse(savedAtendentes))

    const savedLogueado = localStorage.getItem('atendente_logueado')
    if (savedLogueado) setAtendenteLogueado(JSON.parse(savedLogueado))
  }, [])

  const autoservicioUrl = 'https://cd-fweb.vercel.app/autoservicio'

  // ✅ ESTADOS PARA GASTOS DIARIOS (NUEVO)
  const [gastos, setGastos] = useState({
    verduras: 0, frutas: 0, carne: 0, servilletas: 0, cafe: 0,
    mezcladores: 0, vasos: 0, aluminio: 0, harina: 0, chicle: 0, otros: 0
  })
  // ✅ CORRECCIÓN DE FECHAS LOCALES
  const getHoyLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [reportePeriodo, setReportePeriodo] = useState('dia')
  const [reporteIngresos, setReporteIngresos] = useState(0)
  const [reporteDeudasPagadas, setReporteDeudasPagadas] = useState(0)
  const [reporteFecha, setReporteFecha] = useState(getHoyLocal())
  const [reporteMes, setReporteMes] = useState(getHoyLocal().slice(0, 7))
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
    const day = today.getDay()
    const diff = day === 0 ? 6 : day - 1
    firstDay.setDate(today.getDate() - diff)
    
    const lastDay = new Date(firstDay)
    lastDay.setDate(firstDay.getDate() + 6)
    
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return `${fmt(firstDay)} / ${fmt(lastDay)}`
  }
  function calcularReporte() {
    const pagados = fiados.filter(f => f.estado === 'pagado')
    
    let filtrados = []
    if (reportePeriodo === 'dia') {
      filtrados = pagados.filter(f => {
        const dLocal = new Date(f.creado_el).toLocaleDateString('sv-SE')
        return dLocal === reporteFecha
      })
    } else if (reportePeriodo === 'semana') {
      const [inicio, fin] = reporteSemana.split(' / ')
      filtrados = pagados.filter(f => {
        const dLocal = new Date(f.creado_el).toLocaleDateString('sv-SE')
        return dLocal >= inicio && dLocal <= fin
      })
    } else if (reportePeriodo === 'mes') {
      filtrados = pagados.filter(f => {
        const dLocal = new Date(f.creado_el).toLocaleDateString('sv-SE')
        return dLocal.startsWith(reporteMes)
      })
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
    fetchPipetas() // ✅ NUEVA FUNCIÓN CONTROL PIPETAS
    fetchPreciosProductos() // ✅ PARA CIERRE DIARIO
    verificarJornada() // ✅ NUEVA FUNCIÓN TIEMPO REAL
    
    setFrase(frasesMotivacionales[Math.floor(Math.random() * frasesMotivacionales.length)])
    
    const handleOnline = () => {
      toast.promise(offlineQueue.sync(supabase), {
        loading: 'Sincronizando datos offline...',
        success: '¡Datos sincronizados!',
        error: 'Error al sincronizar'
      })
    }
    window.addEventListener('online', handleOnline)

    // ✅ SUSCRIPCIÓN EN TIEMPO REAL PARA NOTIFICACIONES DE QR
    const logsSubscription = supabase
      .channel('logs_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, payload => {
          if (payload.new.accion === 'AUTO_FIADO') {
            toast.info(`🔔 NUEVO FIADO: ${payload.new.detalle}`, {
              duration: 10000,
              icon: '🥟',
              style: { background: '#9333ea', color: '#fff' }
            })
            fetchDatos() // Recargar para ver el nuevo fiado
          }
      })
      .subscribe()

    return () => {
      window.removeEventListener('online', handleOnline)
      supabase.removeChannel(logsSubscription)
    }
  }, [])

  // ✅ COMPONENTE LOCAL PARA TARJETAS DE ESTADÍSTICA
  const StatCard = ({ icon, label, value, detail, color, onClick }) => (
    <div 
      onClick={onClick}
      className={`${cardBg} p-5 rounded-[2.5rem] border-2 border-${color}-500/20 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 cursor-pointer`}
    >
      <span className="text-3xl mb-2">{icon}</span>
      <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-black text-${color}-600 leading-none`}>{value}</p>
      {detail && <p className="text-[9px] font-bold opacity-40 uppercase mt-2 italic">{detail}</p>}
    </div>
  )
  useEffect(() => {
    if (fiados.length > 0) {
      calcularReporte()
    }
  }, [reportePeriodo, reporteFecha, reporteSemana, reporteMes, fiados])
  // --- 🔒 CARGA DE DATOS ---
  async function fetchDatos() {
    try {
      const hoy = getHoyLocal()
      const { data: listaClientes } = await supabase.from('clientes').select('*').order('apodo', { ascending: true })
      setClientes(listaClientes || [])
      
      const { data: todosLosFiados } = await supabase.from('fiados').select('*')
      setFiados(todosLosFiados || [])
      
      const sumaPendiente = todosLosFiados?.filter(f => f.estado === 'pendiente').reduce((acc, current) => acc + Number(current.monto_total), 0) || 0
      const sumaIngresos = todosLosFiados?.filter(f => f.estado === 'pagado').reduce((acc, current) => acc + Number(current.monto_total), 0) || 0
      
      // ✅ CÁLCULO DE MÉTRICAS DEL DÍA
      const sumaFiadosHoy = todosLosFiados?.filter(f => {
        const dLocal = new Date(f.creado_el).toLocaleDateString('sv-SE')
        return dLocal === hoy && f.estado === 'pendiente'
      }).reduce((acc, curr) => acc + Number(curr.monto_total), 0) || 0

      const sumaIngresosHoy = todosLosFiados?.filter(f => {
        const dLocal = new Date(f.creado_el).toLocaleDateString('sv-SE')
        return dLocal === hoy && f.estado === 'pagado'
      }).reduce((acc, curr) => acc + Number(curr.monto_total), 0) || 0

      setTotalPendiente(sumaPendiente)
      setTotalIngresos(sumaIngresos)
      setTotalFiadosHoy(sumaFiadosHoy)
      setTotalIngresosHoy(sumaIngresosHoy)
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
  async function fetchPipetas() {
    try {
      const { data, error } = await supabase.from('pipetas').select('*').order('creado_el', { ascending: false })
      if (data) setPipetas(data)
    } catch (e) { console.error(e) }
  }
  async function fetchPreciosProductos() {
    const { data } = await supabase.from('productos').select('nombre, precio')
    if (data) {
      const map = {}
      data.forEach(p => map[p.nombre.toUpperCase()] = p.precio)
      setProductosPrecios(map)
    }
  }
  async function verificarJornada() {
    const hoy = getHoyLocal()
    const hora = new Date().getHours()
    
    // Verificar si ya respondió apertura hoy
    const { data: jornada } = await supabase.from('jornadas').select('*').eq('fecha', hoy).maybeSingle()
    if (!jornada && hora >= 4) {
      setShowAperturaModal(true)
    }

    // Verificar si ya respondió cierre hoy
    if (jornada?.abierto) {
      const { data: cierre } = await supabase.from('cierres_diarios').select('*').eq('fecha', hoy).maybeSingle()
      if (!cierre && hora >= 12) {
        setShowCierreModal(true)
      }
    }
  }
  async function fetchParqueadero() {
    try {
      const { data, error } = await supabase.from('parqueadero').select('*').order('creado_el', { ascending: false }).limit(1).maybeSingle()
      if (data) {
        setDataParqueadero(data)
        setEditFechaInicio(data.inicio.split('T')[0])
        setEditPagadoInicial(data.pagado || 0)
      }
      
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

      registrarLog(nombreAtendente || "SISTEMA", "ABONO_PARQUEADERO", `Abono de $${montoAbono} para ${dataParqueadero.id}`)
      
      toast.success("Abono registrado con éxito")
      setMontoAbono('')
      setNotaParqueadero('')
      fetchParqueadero()
    } catch (e) { 
      toast.info("Guardado en modo offline")
      offlineQueue.add('parqueadero_historial', 'INSERT', { 
        parqueadero_id: dataParqueadero.id, tipo: 'abono', monto: Number(montoAbono), nota: notaParqueadero, fecha: new Date().toISOString() 
      })
    }
  }
  async function editarAbonoParqueadero(id, nuevoMonto) {
    try {
      const { data: abonoAnterior } = await supabase.from('parqueadero_historial').select('monto').eq('id', id).single()
      const diff = Number(nuevoMonto) - Number(abonoAnterior.monto)
      
      const { error: histErr } = await supabase.from('parqueadero_historial').update({ monto: Number(nuevoMonto) }).eq('id', id)
      if (histErr) throw histErr
      
      const nuevoPagado = (dataParqueadero.pagado || 0) + diff
      await supabase.from('parqueadero').update({ pagado: nuevoPagado }).eq('id', dataParqueadero.id)
      
      toast.success("Abono corregido")
      setItemAbonoEdit(null)
      fetchParqueadero()
    } catch (e) { toast.error("Error al editar abono") }
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
  async function editarRegistroParqueadero() {
    try {
      const { error } = await supabase.from('parqueadero').update({ 
        inicio: new Date(editFechaInicio).toISOString(), 
        pagado: Number(editPagadoInicial) 
      }).eq('id', dataParqueadero.id)
      if (error) throw error
      toast.success("Registro actualizado correctamente")
      setModoEdicionParqueadero(false)
      fetchParqueadero()
    } catch (e) { toast.error("Error al actualizar registro") }
  }

  // ✅ NUEVAS FUNCIONES: CONTROL PIPETAS
  async function registrarPipeta() {
    if (!costoPipeta || isNaN(costoPipeta) || Number(costoPipeta) <= 0) return toast.error("Ingresa un costo válido")
    try {
      const { data, error } = await supabase.from('pipetas').insert([{
        costo: Number(costoPipeta),
        estado: pagoTipoPipeta,
        pagado: pagoTipoPipeta === 'pagado' ? Number(costoPipeta) : 0,
        creado_el: new Date().toISOString()
      }]).select().single()
      
      if (error) throw error
      
      if (pagoTipoPipeta === 'pagado') {
        await supabase.from('pipetas_historial').insert([{
          pipeta_id: data.id,
          tipo: 'pago_total',
          monto: Number(costoPipeta),
          nota: 'Pago inmediato'
        }])
      }
      
      toast.success(pagoTipoPipeta === 'pagado' ? "Pipeta pagada registrada" : "Pipeta a fiado registrada")
      setCostoPipeta('')
      fetchPipetas()
    } catch (e) { toast.error("Error al registrar pipeta") }
  }

  async function registrarAbonoPipeta() {
    if (!montoAbonoPipeta || isNaN(montoAbonoPipeta) || Number(montoAbonoPipeta) <= 0) return toast.error("Ingresa un monto válido")
    try {
      const nuevoPagado = (dataPipeta.pagado || 0) + Number(montoAbonoPipeta)
      const nuevoEstado = nuevoPagado >= dataPipeta.costo ? 'pagado' : 'fiado'
      
      const { error: upError } = await supabase.from('pipetas').update({ 
        pagado: nuevoPagado, 
        estado: nuevoEstado 
      }).eq('id', dataPipeta.id)
      
      if (upError) throw upError
      
      await supabase.from('pipetas_historial').insert([{
        pipeta_id: dataPipeta.id,
        tipo: nuevoEstado === 'pagado' ? 'pago_total' : 'abono',
        monto: Number(montoAbonoPipeta),
        nota: notaPipeta || 'Abono parcial'
      }])
      
      toast.success(nuevoEstado === 'pagado' ? "¡Pipeta liquidada!" : "Abono registrado")
      setMontoAbonoPipeta('')
      setNotaPipeta('')
      setDataPipeta(null)
      fetchPipetas()
    } catch (e) { toast.error("Error al registrar abono") }
  }
  async function editarAbonoPipeta(id, nuevoMonto) {
    try {
      const { data: abonoAnterior } = await supabase.from('pipetas_historial').select('monto').eq('id', id).single()
      const diff = Number(nuevoMonto) - Number(abonoAnterior.monto)
      
      const { error: histErr } = await supabase.from('pipetas_historial').update({ monto: Number(nuevoMonto) }).eq('id', id)
      if (histErr) throw histErr
      
      const nuevoPagado = (dataPipeta.pagado || 0) + diff
      const nuevoEstado = nuevoPagado >= dataPipeta.costo ? 'pagado' : 'fiado'
      
      await supabase.from('pipetas').update({ pagado: nuevoPagado, estado: nuevoEstado }).eq('id', dataPipeta.id)
      
      toast.success("Abono de pipeta corregido")
      setItemAbonoEdit(null)
      fetchPipetas()
    } catch (e) { toast.error("Error al editar abono") }
  }

  // ✅ FUNCIONES CIERRE Y APERTURA
  async function registrarApertura(abierto) {
    if (abierto && !nombreAtendente) return toast.error("Ingresa tu nombre")
    try {
      await supabase.from('jornadas').insert([{ 
        fecha: getHoyLocal(), 
        abierto,
        atendido_por: atendenteLogueado?.nombre || 'SISTEMA'
      }])
      registrarLog(atendenteLogueado?.nombre || 'SISTEMA', "APERTURA", `Inicia jornada el día ${getHoyLocal()}`)
      setShowAperturaModal(false)
      if (abierto) toast.success(`¡Bienvenido ${nombreAtendente}!`)
      else toast.info("Entendido, hoy se descansa")
    } catch (e) { toast.error("Error al registrar jornada") }
  }

  // ✅ SISTEMA DE LOGS (TRAZABILIDAD)
  async function registrarLog(usuario, accion, detalle) {
    const payload = { usuario: usuario.toUpperCase(), accion, detalle, fecha: new Date().toISOString() }
    try {
      const { error } = await supabase.from('logs').insert([payload])
      if (error) throw error
    } catch (e) { 
      console.log("Modo Offline: Guardando log localmente")
      offlineQueue.add('logs', 'INSERT', payload)
    }
  }

  // ✅ VALIDACIÓN DE DINERO (PARA COP)
  const validarMonto = (valor) => {
    const v = Number(valor)
    if (v > 0 && v < 100) {
      toast.warning("⚠️ ¿Ingresaste un monto muy bajo? (Ej: 30 en vez de 30.000)", { duration: 4000 })
    }
  }
  async function registrarCierre() {
    if (!kgMasa || !ventasEfectivo) return toast.error("Completa los campos principales")
    try {
      const precioEmpanada = productosPrecios['EMPANADA'] || 3000
      const precioJugo = productosPrecios['JUGO'] || 0
      const precioTorta = productosPrecios['TORTA DE CARNE'] || 0
      
      const empanadasCant = Number(kgMasa) * 35
      const montoMasa = empanadasCant * precioEmpanada
      const montoJugos = Number(cantJugo) * precioJugo
      const montoTortas = Number(cantTortas) * precioTorta
      
      const produccionEsperada = montoMasa + montoJugos + montoTortas
      const totalCajaHoy = Number(ventasEfectivo) + totalIngresosHoy // Efectivo + Recaudos
      const totalGastosHoy = Object.values(gastos).reduce((acc, curr) => acc + Number(curr), 0)
      const gananciaReal = totalCajaHoy - totalGastosHoy

      await supabase.from('cierres_diarios').insert([{
        fecha: getHoyLocal(),
        kg_masa: Number(kgMasa),
        empanadas_estimadas: empanadasCant,
        monto_esperado_masa: montoMasa,
        jugos_cantidad: Number(cantJugo),
        jugos_monto: montoJugos,
        tortas_cantidad: Number(cantTortas),
        tortas_monto: montoTortas,
        produccion_esperada: produccionEsperada,
        total_ventas_efectivo: Number(ventasEfectivo),
        recaudos_fiados: totalIngresosHoy,
        total_dia: totalCajaHoy, // Dinero real que entró
        total_gastos: totalGastosHoy,
        ganancia_neta: gananciaReal,
        // Gastos detallados
        gastos_verduras: Number(gastos.verduras),
        gastos_frutas: Number(gastos.frutas),
        gastos_carne: Number(gastos.carne),
        gastos_servilletas: Number(gastos.servilletas),
        gastos_cafe: Number(gastos.cafe),
        gastos_mezcladores: Number(gastos.mezcladores),
        gastos_vasos: Number(gastos.vasos),
        gastos_aluminio: Number(gastos.aluminio),
        gastos_harina: Number(gastos.harina),
        gastos_chicle: Number(gastos.chicle),
        gastos_otros: Number(gastos.otros)
      }])
      
      setShowCierreModal(false)
      registrarLog(atendenteLogueado?.nombre || 'SISTEMA', "CIERRE", `Cierre de jornada guardado. Ganancia neta: $${gananciaReal}`)
      toast.success("Cierre de día guardado con éxito")
      setGastos({verduras:0,frutas:0,carne:0,servilletas:0,cafe:0,mezcladores:0,vasos:0,aluminio:0,harina:0,chicle:0,otros:0})
    } catch (e) { toast.error("Error al guardar cierre") }
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
    if (!error) { 
      toast.success("Caja reiniciada"); 
      registrarLog(atendenteLogueado?.nombre || 'SISTEMA', "REINICIAR_CAJA", "Se archivaron los registros pagados")
      fetchDatos(); 
    }
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
          
          <div className="grid grid-cols-2 gap-4">
            <StatCard 
              icon="📉" label="Total Fiado" 
              value={`$${totalPendiente.toLocaleString()}`} 
              detail={`Hoy: +$${totalFiadosHoy.toLocaleString()}`}
              color="orange"
              onClick={() => setShowStats(true)}
            />
            <StatCard 
              icon="🤝" label="Recaudos Hoy" 
              value={`$${totalIngresosHoy.toLocaleString()}`} 
              detail={`Resta: $${totalPendiente.toLocaleString()}`}
              color="blue"
              onClick={() => setShowStats(true)}
            />
            <StatCard 
              icon="📱" label="QR Menú" 
              value="Autoservicio" 
              detail="Mostrar a cliente"
              color="purple"
              onClick={() => setShowQRModal(true)}
            />
            <StatCard 
              icon="👤" label="Atendente" 
              value={atendenteLogueado?.nombre || 'Sin elegir'} 
              detail="Cambiar / Login"
              color="emerald"
              onClick={() => setShowAtendentesModal(true)}
            />
          </div>
          <div className="mt-4 text-center">
            <button onClick={() => { setAccionPendiente({tipo:'reiniciar'}); setGuardOpen(true); }} className="text-[9px] font-black uppercase opacity-50 hover:opacity-100 underline transition-opacity">Reiniciar Caja (Archivar Pagados)</button>
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
          
          {/* ✅ LISTADO DE PAGOS EN EL REPORTE */}
          <div className="mt-6 border-t-2 border-orange-500/10 pt-4">
            <p className="text-[10px] uppercase font-black opacity-40 mb-3 tracking-widest text-center">Detalle de Recaudos</p>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {fiados.filter(f => {
                const dLocal = new Date(f.creado_el).toLocaleDateString('sv-SE')
                if (reportePeriodo === 'dia') return dLocal === reporteFecha && f.estado === 'pagado'
                if (reportePeriodo === 'mes') return dLocal.startsWith(reporteMes) && f.estado === 'pagado'
                return f.estado === 'pagado'
              }).sort((a,b) => new Date(b.creado_el) - new Date(a.creado_el)).map(pago => (
                <div key={pago.id} className="flex justify-between items-center text-[10px] p-2 bg-black/5 dark:bg-white/5 rounded-xl">
                  <div>
                    <p className="font-black uppercase">{clientes.find(c => c.id === pago.cliente_id)?.apodo || 'Cliente'}</p>
                    <p className="opacity-50">{new Date(pago.creado_el).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  <p className="font-black text-green-600 text-sm">${Number(pago.monto_total).toLocaleString()}</p>
                </div>
              ))}
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
                        <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-md flex items-center gap-2">
                          🏅 {calcularPuntos(cliente.id)} PTS
                          {puedeCanjear(cliente.id) && (
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                registrarCanje(cliente.id);
                              }}
                              className="bg-purple-600 text-white px-3 py-1 rounded-full text-[9px] font-black hover:bg-purple-700 transition-all hover:scale-110 active:scale-95 shadow-lg border-2 border-white/20 animate-bounce"
                            >
                              🎁 CANJEAR PREMIO
                            </button>
                          )}
                        </span>
                        <p className="text-[9px] font-bold opacity-50 uppercase truncate">{cliente.nombre || 'Sin nombre'}</p>
                        {cliente.whitelist && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase">⭐ Whitelist</span>}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            supabase.from('clientes').update({ whitelist: !cliente.whitelist }).eq('id', cliente.id).then(() => fetchDatos());
                          }}
                          className={`ml-2 px-2 py-0.5 rounded text-[7px] font-black uppercase ${cliente.whitelist ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}
                        >
                          {cliente.whitelist ? 'Quitar W.' : 'Hacer W.'}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            supabase.from('clientes').update({ blacklist: !cliente.blacklist }).eq('id', cliente.id).then(() => fetchDatos());
                          }}
                          className={`ml-1 px-2 py-0.5 rounded text-[7px] font-black uppercase ${cliente.blacklist ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}
                        >
                          {cliente.blacklist ? 'Quitar B.' : 'Hacer B.'}
                        </button>
                        {cliente.blacklist && <span className="ml-1 bg-red-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase animate-pulse">🚫 Blacklist</span>}
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
                    {/* ✅ NUEVA SECCIÓN: RECAUDOS RECIENTES (QUIÉN Y CUÁNTO PAGÓ) */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-5 rounded-[2rem] border border-blue-500/20">
                        <h3 className="text-[11px] font-black uppercase text-blue-600 mb-4 tracking-widest flex items-center gap-2">🤝 <span>Recaudos Recientes</span></h3>
                        {fiados.filter(f => f.estado === 'pagado').sort((a,b) => new Date(b.creado_el) - new Date(a.creado_el)).slice(0, 10).map(f => (
                            <Link key={f.id} href={`/clientes/detalles?id=${f.cliente_id}`} className="flex justify-between items-center text-sm mb-3 font-bold uppercase border-b border-blue-500/10 pb-2 hover:bg-blue-500/5 p-1 rounded-lg transition-all">
                                <span className="text-blue-700 truncate max-w-[100px]">{clientes.find(c => c.id === f.cliente_id)?.apodo}</span>
                                <span className="text-green-600 font-black">${Number(f.monto_total).toLocaleString()}</span>
                                <span className="text-[9px] opacity-40">{new Date(f.creado_el).toLocaleDateString()}</span>
                            </Link>
                        ))}
                    </div>
                    {/* ✅ ÚLTIMOS MOVIMIENTOS PARQUEADERO */}
                    <div className="bg-gradient-to-br from-slate-500/10 to-slate-500/5 p-5 rounded-[2rem] border border-slate-500/20">
                        <h3 className="text-[11px] font-black uppercase text-slate-600 mb-4 tracking-widest flex items-center gap-2">🅿️ <span>Movimientos Parqueadero</span></h3>
                        {historialParqueadero.length === 0 ? (
                          <p className="text-xs opacity-60 text-center py-2">No hay movimientos registrados</p>
                        ) : (
                          historialParqueadero.slice(0, 3).map(h => (
                            <div key={h.id} className="flex justify-between items-center text-sm mb-3 font-bold uppercase border-b border-slate-500/10 pb-2">
                                <span className={`text-[9px] ${h.tipo === 'pago_total' ? 'text-green-600' : 'text-blue-700'}`}>
                                  {h.tipo === 'pago_total' ? 'Pago T.' : 'Abono'}
                                </span>
                                <span className="text-blue-700 font-black">${Number(h.monto).toLocaleString()}</span>
                                <span className="text-[9px] opacity-60">{new Date(h.fecha).toLocaleDateString()}</span>
                            </div>
                          ))
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
      <Sidebar 
        isOpen={showMenu} 
        onClose={() => setShowMenu(false)} 
        onAction={(type) => {
          if (type === 'CIERRE') setShowCierreModal(true)
          if (type === 'PARQUEADERO') setShowParqueaderoModal(true)
          if (type === 'PIPETAS') setShowPipetasModal(true)
        }}
      >
        <div className="mt-8 pt-8 border-t-2 border-orange-500/10 space-y-6">
            <Link href="/recuerdos" className="flex items-center justify-between p-4 bg-orange-500/10 rounded-2xl font-black uppercase text-xs text-orange-600">
                <span>📸 Álbum de Recuerdos</span>
                <span>→</span>
            </Link>
            
            <section className="bg-cyan-500/5 p-4 rounded-[2rem] border border-cyan-500/10">
                <h3 className="text-[10px] font-black uppercase text-cyan-600 mb-3 tracking-widest">🛒 Lista de Compras</h3>
                <form onSubmit={agregarCompra} className="flex gap-2 mb-3">
                    <input type="text" value={nuevaCompra} onChange={e => setNuevaCompra(e.target.value)} className={`flex-1 p-2.5 rounded-xl border-2 text-xs uppercase font-bold outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`} placeholder="¿Qué falta?" />
                    <button className="bg-cyan-600 text-white px-4 rounded-xl font-black shadow-md">+</button>
                </form>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                    {compras.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-white/30 dark:bg-slate-800/50 p-2 rounded-xl border">
                            <span onClick={() => toggleCompra(item.id, item.comprado)} className={`text-[10px] font-bold uppercase cursor-pointer ${item.comprado ? 'line-through opacity-40' : ''}`}>{item.articulo}</span>
                            <button onClick={() => eliminarCompra(item.id)} className="text-red-500 text-[10px]">✕</button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-purple-500/5 p-4 rounded-[2rem] border border-purple-500/10">
                <h3 className="text-[10px] font-black uppercase text-purple-600 mb-3 tracking-widest">📝 Pendientes</h3>
                <form onSubmit={agregarTodo} className="flex gap-2 mb-3">
                    <input type="text" value={nuevoTodo} onChange={e => setNuevoTodo(e.target.value)} className={`flex-1 p-2.5 rounded-xl border-2 text-xs uppercase font-bold outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`} placeholder="Tarea..." />
                    <button className="bg-purple-600 text-white px-4 rounded-xl font-black shadow-md">+</button>
                </form>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                    {todos.map(todo => (
                        <div key={todo.id} className="flex items-center justify-between bg-white/30 dark:bg-slate-800/50 p-2 rounded-xl border">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id, todo.done)} className="w-4 h-4" />
                                <span className={`text-[10px] font-bold uppercase ${todo.done ? 'line-through opacity-40' : ''}`}>{todo.text}</span>
                            </div>
                            <button onClick={() => eliminarTodo(todo.id)} className="text-red-500 text-[10px]">✕</button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
      </Sidebar>
      {/* 🅿️ MODAL DE CONTROL PARQUEADERO (NUEVO) */}
      {showParqueaderoModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn text-black">
          <div className={`w-full max-w-lg rounded-[3rem] p-8 overflow-y-auto max-h-[90vh] shadow-2xl transform transition-all duration-300 animate-slideUp ${darkMode ? 'bg-slate-900 border-2 border-slate-700 text-white' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-6 border-b-2 border-blue-500/20 pb-4">
              <h2 className="text-2xl font-black uppercase italic bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">🅿️ Control Parqueadero</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setModoEdicionParqueadero(!modoEdicionParqueadero)} 
                  className={`w-10 h-10 rounded-full font-bold transition-all duration-300 flex items-center justify-center ${modoEdicionParqueadero ? 'bg-orange-500 text-white' : 'bg-blue-100 text-blue-600'}`}
                  title="Editar Registro"
                >
                  {modoEdicionParqueadero ? '✕' : '✏️'}
                </button>
                <button onClick={() => { setShowParqueaderoModal(false); setModoEdicionParqueadero(false); }} className={`w-10 h-10 rounded-full font-bold transition-all duration-300 ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'}`}>✕</button>
              </div>
            </div>
            {dataParqueadero ? (
              <div className="space-y-6">
                {modoEdicionParqueadero ? (
                  <div className="bg-orange-500/10 p-6 rounded-[2.5rem] border-2 border-orange-500/20 space-y-4">
                    <h3 className="text-sm font-black uppercase text-orange-600">✏️ Editar Registro Inicial</h3>
                    <div>
                      <label className="text-[10px] font-black uppercase opacity-60">Fecha de Inicio</label>
                      <input 
                        type="date" 
                        value={editFechaInicio} 
                        onChange={e => setEditFechaInicio(e.target.value)}
                        className={`w-full p-4 rounded-2xl border-2 outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase opacity-60">Monto ya Pagado</label>
                      <input 
                        type="number" 
                        value={editPagadoInicial} 
                        onChange={e => setEditPagadoInicial(e.target.value)}
                        className={`w-full p-4 rounded-2xl border-2 outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}
                      />
                    </div>
                    <button 
                      onClick={editarRegistroParqueadero}
                      className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase shadow-lg hover:bg-orange-700 transition-all"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                ) : (
                  <>
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
                        onClick={() => {
                          setModalConfig({
                            show: true,
                            title: 'Reiniciar Ciclo',
                            message: '¿Estás seguro de reiniciar el ciclo? Esto registrará el pago total.',
                            type: 'confirm',
                            onConfirm: registrarPagoTotal
                          })
                        }}
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
                  </>
                )}
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
                            <div className="flex gap-2 items-center">
                              <span className="text-[10px] opacity-40 font-bold">{new Date(h.fecha).toLocaleDateString()}</span>
                              <button 
                                onClick={() => setItemAbonoEdit(h)}
                                className="text-[10px] bg-gray-200 dark:bg-slate-700 p-1 rounded hover:scale-110 transition-all"
                              >✏️</button>
                            </div>
                          </div>
                          {itemAbonoEdit?.id === h.id ? (
                            <div className="flex gap-2 mt-2">
                              <input 
                                type="number" 
                                defaultValue={h.monto} 
                                onBlur={(e) => editarAbonoParqueadero(h.id, e.target.value)}
                                className="w-full p-1 text-xs rounded border border-blue-500 bg-transparent outline-none"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <p className="text-sm font-black mt-1">${Number(h.monto).toLocaleString()}</p>
                          )}
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
      {/* 🔥 MODAL DE CONTROL PIPETAS (NUEVO) */}
      {showPipetaModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn text-black">
          <div className={`w-full max-w-lg rounded-[3rem] p-8 overflow-y-auto max-h-[90vh] shadow-2xl transform transition-all duration-300 animate-slideUp ${darkMode ? 'bg-slate-900 border-2 border-slate-700 text-white' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-6 border-b-2 border-gray-500/20 pb-4">
              <h2 className="text-2xl font-black uppercase italic bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">🔥 Control Pipetas</h2>
              <button onClick={() => { setShowPipetaModal(false); setDataPipeta(null); }} className={`w-10 h-10 rounded-full font-bold transition-all duration-300 ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'}`}>✕</button>
            </div>
            
            <div className="space-y-6">
              {dataPipeta ? (
                // PANTALLA DE ABONO/LIQUIDACIÓN (IGUAL A PARQUEADERO)
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 p-6 rounded-[2.5rem] border-2 border-orange-500/20 text-center">
                    <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Costo Pipeta</p>
                    <p className="text-4xl font-black text-orange-600 mb-4">${Number(dataPipeta.costo).toLocaleString()}</p>
                    <div className="flex justify-around border-t border-orange-500/10 pt-4">
                      <div>
                        <p className="text-[9px] font-black opacity-50 uppercase">Pagado</p>
                        <p className="text-lg font-black text-green-600">${Number(dataPipeta.pagado || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black opacity-50 uppercase">Pendiente</p>
                        <p className="text-lg font-black text-red-600">${(dataPipeta.costo - (dataPipeta.pagado || 0)).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`${darkMode ? 'bg-slate-800' : 'bg-orange-50'} p-5 rounded-[2rem] border border-orange-500/10`}>
                    <h3 className="text-[11px] font-black uppercase text-orange-600 mb-4 tracking-widest">💸 Registrar Abono / Liquidar</h3>
                    <div className="space-y-3">
                      <input 
                        type="number" 
                        value={montoAbonoPipeta} 
                        onChange={e => setMontoAbonoPipeta(e.target.value)}
                        placeholder="Monto a pagar..." 
                        className={`w-full p-4 rounded-2xl border-2 outline-none transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-100'}`}
                      />
                      <input 
                        type="text" 
                        value={notaPipeta} 
                        onChange={e => setNotaPipeta(e.target.value)}
                        placeholder="Nota (opcional)..." 
                        className={`w-full p-4 rounded-2xl border-2 outline-none transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-100'}`}
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setMontoAbonoPipeta(dataPipeta.costo - (dataPipeta.pagado || 0))}
                          className="px-4 bg-green-500/20 text-green-600 rounded-xl font-black text-[10px] uppercase"
                        >Liquidar Todo</button>
                        <button 
                          onClick={registrarAbonoPipeta}
                          className="flex-1 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl font-black uppercase shadow-lg active:scale-95 transition-all"
                        >Confirmar</button>
                      </div>
                      <button onClick={() => setDataPipeta(null)} className="w-full text-[10px] font-black uppercase opacity-50">← Volver al listado</button>
                    </div>
                  </div>
                </div>
              ) : (
                // PANTALLA PRINCIPAL: NUEVA PIPETA Y LISTADO
                <div className="space-y-8 animate-fadeIn">
                  <section className={`${darkMode ? 'bg-slate-800' : 'bg-gray-50'} p-6 rounded-[2.5rem] border-2 border-gray-500/20`}>
                    <h3 className="text-[11px] font-black uppercase text-gray-500 mb-4 tracking-widest flex items-center gap-2">🛒 <span>Nueva Pipeta</span></h3>
                    <div className="space-y-4">
                      <input 
                        type="number" 
                        value={costoPipeta} 
                        onChange={e => setCostoPipeta(e.target.value)}
                        placeholder="¿Cuánto costó?" 
                        className={`w-full p-4 rounded-2xl border-2 outline-none transition-all ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'}`}
                      />
                      <div className="flex gap-2 p-1 bg-gray-200 dark:bg-slate-700 rounded-2xl">
                        <button 
                          onClick={() => setPagoTipoPipeta('pagado')}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${pagoTipoPipeta === 'pagado' ? 'bg-green-600 text-white shadow-md' : 'opacity-40'}`}
                        >PAGADO ✅</button>
                        <button 
                          onClick={() => setPagoTipoPipeta('fiado')}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${pagoTipoPipeta === 'fiado' ? 'bg-red-600 text-white shadow-md' : 'opacity-40'}`}
                        >FIADO ❌</button>
                      </div>
                      <button 
                        onClick={registrarPipeta}
                        className="w-full py-4 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-2xl font-black uppercase shadow-lg hover:shadow-xl transition-all active:scale-95"
                      >Registrar Pedido</button>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase text-gray-500 tracking-widest">📜 Historial de Pipetas</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {pipetas.length === 0 ? (
                        <p className="text-xs opacity-50 text-center py-4 italic">No hay registros aún</p>
                      ) : (
                        pipetas.map(p => (
                          <div key={p.id} className={`flex flex-col p-4 rounded-2xl border-2 ${p.estado === 'pagado' ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <p className="text-lg font-black">${Number(p.costo).toLocaleString()}</p>
                                <p className="text-[9px] opacity-50 font-bold uppercase">{new Date(p.creado_el).toLocaleDateString()} - {p.estado}</p>
                              </div>
                              {p.estado === 'fiado' && (
                                <button 
                                  onClick={() => setDataPipeta(p)}
                                  className="bg-orange-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md active:scale-95 transition-all"
                                >Abonar</button>
                              )}
                            </div>
                            {/* MINI HISTORIAL DE PIPETA PARA EDITAR ABONOS */}
                            <div className="space-y-1 mt-2 border-t border-black/5 pt-2">
                              {/* Esta parte es simplificada, idealmente buscaríamos en pipetas_historial filtrado por p.id */}
                              <p className="text-[8px] font-black uppercase opacity-40">Toca para corregir abonos en la base de datos si es necesario</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📱 MODAL QR AUTOSERVICIO (NUEVO) */}
      {showQRModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fadeIn">
          <div className={`w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl animate-slideUp ${darkMode ? 'bg-slate-900 border-2 border-purple-500/30' : 'bg-white'}`}>
            <h2 className="text-2xl font-black uppercase italic mb-2 text-purple-600">📱 QR Autoservicio</h2>
            <p className="text-[10px] font-bold opacity-60 uppercase mb-8">Escanea para pedir desde tu celular</p>
            
            <div className="bg-white p-6 rounded-[2.5rem] shadow-inner mb-8 flex justify-center border-4 border-purple-500/20">
              <QRCodeCanvas value={autoservicioUrl} size={200} level="H" />
            </div>

            <p className="text-[11px] font-black text-purple-600 truncate mb-8 opacity-50">{autoservicioUrl}</p>

            <button 
              onClick={() => setShowQRModal(false)}
              className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase shadow-lg active:scale-95 transition-all"
            >Cerrar QR</button>
          </div>
        </div>
      )}

      {/* 👤 MODAL QUIÉN ATIENDE (NUEVO/REFACTOR) */}
      {showAtendentesModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fadeIn">
          <div className={`w-full max-w-sm rounded-[3rem] p-8 text-center shadow-2xl animate-slideUp ${darkMode ? 'bg-slate-900 border-2 border-emerald-500/30' : 'bg-white'}`}>
            <span className="text-6xl mb-4 block animate-pulse">👤</span>
            <h2 className="text-2xl font-black uppercase italic mb-2">Cambio de Turno</h2>
            <p className="text-xs font-bold opacity-60 uppercase mb-6 tracking-widest">Personal Autorizado</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {atendentes.map(a => (
                <button 
                  key={a.nombre}
                  onClick={() => {
                    setModalConfig({
                      show: true,
                      title: `PIN de ${a.nombre}`,
                      message: `Ingresa el código de acceso para ${a.nombre}`,
                      type: 'pin',
                      onConfirm: (pin) => {
                        if (pin === a.pin) {
                          setAtendenteLogueado(a)
                          localStorage.setItem('atendente_logueado', JSON.stringify(a))
                          toast.success(`Bienvenido ${a.nombre}`)
                          setShowAtendentesModal(false)
                        } else {
                          toast.error("PIN Incorrecto")
                        }
                      }
                    })
                  }}
                  className={`py-3 rounded-xl font-black uppercase text-xs transition-all border-2 ${atendenteLogueado?.nombre === a.nombre ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-transparent border-gray-200 opacity-60 dark:border-slate-700'}`}
                >
                  {a.nombre}
                </button>
              ))}
              <button 
                onClick={() => {
                   setModalConfig({
                     show: true,
                     title: 'Acceso Admin',
                     message: 'Ingresa la clave de Maria para gestionar personal',
                     type: 'pin',
                     onConfirm: (pin) => {
                       if (pin === '1407') {
                         setModalConfig({
                           show: true,
                           title: 'Nuevo Atendente',
                           message: 'Ingresa el nombre y el PIN separados por coma (Ej: JUAN, 1234)',
                           type: 'input',
                           inputPlaceholder: 'NOMBRE, PIN',
                           onConfirm: (val) => {
                             const [n, p] = val.split(',').map(s => s.trim())
                             if (n && p) {
                               const nuevaLista = [...atendentes, { nombre: n.toUpperCase(), pin: p }]
                               setAtendentes(nuevaLista)
                               localStorage.setItem('atendentes_lista', JSON.stringify(nuevaLista))
                               toast.success(`${n} agregado con éxito`)
                             }
                           }
                         })
                       } else {
                         toast.error("Acceso denegado")
                       }
                     }
                   })
                }}
                className="py-3 rounded-xl font-black uppercase text-[10px] bg-black/5 border-2 border-dashed border-gray-300 opacity-50 dark:border-slate-700 dark:text-white"
              >
                + AGREGAR
              </button>
            </div>

            <button 
              onClick={() => setShowAtendentesModal(false)}
              className="w-full py-4 bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black uppercase active:scale-95 transition-all"
            >Regresar</button>
          </div>
        </div>
      )}

      {/* 🌅 MODAL DE APERTURA (4 AM) */}
      {showAperturaModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fadeIn">
          <div className={`w-full max-w-sm rounded-[3rem] p-8 text-center shadow-2xl animate-slideUp ${darkMode ? 'bg-slate-900 border-2 border-orange-500/30' : 'bg-white'}`}>
            <span className="text-6xl mb-4 block animate-bounce">☕</span>
            <h2 className="text-2xl font-black uppercase italic mb-2">¡Bienvenido!</h2>
            <p className="text-xs font-bold opacity-60 uppercase mb-6">Selecciona tu perfil e ingresa tu PIN</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {atendentes.map(a => (
                <button 
                  key={a.nombre}
                  onClick={() => {
                    setModalConfig({
                      show: true,
                      title: `Acceso: ${a.nombre}`,
                      message: `Ingresa tu PIN de apertura`,
                      type: 'pin',
                      onConfirm: (pin) => {
                        if (pin === a.pin) {
                          setAtendenteLogueado(a)
                          localStorage.setItem('atendente_logueado', JSON.stringify(a))
                          toast.success(`Bienvenido ${a.nombre}`)
                        } else {
                          toast.error("PIN Incorrecto")
                        }
                      }
                    })
                  }}
                  className={`py-3 rounded-xl font-black uppercase text-xs transition-all border-2 ${atendenteLogueado?.nombre === a.nombre ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'bg-transparent border-gray-200 opacity-60 dark:border-slate-700'}`}
                >
                  {a.nombre}
                </button>
              ))}
            </div>

            <p className="text-[10px] font-bold opacity-40 uppercase mb-8">¿Abres el puesto hoy?</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => registrarApertura(true)}
                className="py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl font-black uppercase shadow-lg active:scale-95"
              >SÍ, A DARLE 💪</button>
              <button 
                onClick={() => registrarApertura(false)}
                className="py-4 bg-gray-200 dark:bg-slate-800 text-gray-500 rounded-2xl font-black uppercase active:scale-95"
              >HOY NO 😴</button>
            </div>
          </div>
        </div>
      )}

      {/* 🌙 MODAL DE CIERRE (12 PM+) */}
      {showCierreModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fadeIn text-black">
          <div className={`w-full max-w-md rounded-[3rem] p-8 overflow-y-auto max-h-[90vh] shadow-2xl animate-slideUp ${darkMode ? 'bg-slate-900 border-2 border-orange-500/30 text-white' : 'bg-white'}`}>
            <h2 className="text-2xl font-black uppercase italic mb-6 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent text-center">📝 Cierre de Jornada</h2>
            
            <div className="space-y-5">
              <section>
                <label className="text-[10px] font-black uppercase opacity-50 block mb-2">🧂 Kg de Masa Harina</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="number" value={kgMasa} onChange={e => setKgMasa(e.target.value)}
                    placeholder="Ej: 5" className={`flex-1 p-4 rounded-2xl border-2 outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}
                  />
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase opacity-40">Estimado Empanadas</p>
                    <p className="text-sm font-black text-orange-600">{kgMasa ? Number(kgMasa) * 35 : 0}</p>
                  </div>
                </div>
              </section>

              <section className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase">¿Hizo Jugos? 🥤</span>
                  <input type="checkbox" checked={hizoJugo} onChange={e => setHizoJugo(e.target.checked)} className="w-5 h-5 accent-orange-500" />
                </div>
                {hizoJugo && (
                  <input 
                    type="number" value={cantJugo} onChange={e => setCantJugo(e.target.value)}
                    placeholder="¿Cuántos vendió?" className={`w-full p-4 rounded-2xl border-2 outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}
                  />
                )}
              </section>

              <section className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase">¿Hizo Tortas? 🍔</span>
                  <input type="checkbox" checked={hizoTortas} onChange={e => setHizoTortas(e.target.checked)} className="w-5 h-5 accent-orange-500" />
                </div>
                {hizoTortas && (
                  <input 
                    type="number" value={cantTortas} onChange={e => setCantTortas(e.target.value)}
                    placeholder="¿Cuántas vendió?" className={`w-full p-4 rounded-2xl border-2 outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}
                  />
                )}
              </section>

              <section>
                <label className="text-[10px] font-black uppercase opacity-50 block mb-2">💵 Ventas en Efectivo (Venta Directa)</label>
                <input 
                  type="number" value={ventasEfectivo} onChange={e => setVentasEfectivo(e.target.value)}
                  placeholder="Total hoy en caja..." className={`w-full p-4 rounded-2xl border-2 outline-none border-green-500/30 ${darkMode ? 'bg-slate-800' : 'bg-gray-50'}`}
                />
              </section>

              <section className="bg-red-500/5 p-5 rounded-[2.5rem] border-2 border-red-500/20 space-y-4">
                <h3 className="text-sm font-black uppercase text-red-600 flex items-center gap-2">💸 Gastos de Hoy</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {id:'verduras', n:'Verduras'}, {id:'frutas', n:'Frutas'}, {id:'carne', n:'Carne'},
                    {id:'servilletas', n:'Servilletas'}, {id:'cafe', n:'Café'}, {id:'mezcladores', n:'Mezcladores'},
                    {id:'vasos', n:'Vasos'}, {id:'aluminio', n:'Aluminio'}, {id:'harina', n:'Harina'},
                    {id:'chicle', n:'Papel Chicle'}, {id:'otros', n:'Otros'}
                  ].map(g => (
                    <div key={g.id}>
                      <label className="text-[8px] font-black uppercase opacity-50">{g.n}</label>
                      <input 
                        type="number" 
                        value={gastos[g.id]} 
                        onChange={e => setGastos({...gastos, [g.id]: e.target.value})}
                        className={`w-full p-2 text-xs rounded-xl border-2 outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <div className="p-5 bg-gradient-to-br from-orange-600 to-orange-500 rounded-[2rem] text-white shadow-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase opacity-80">Producción Estimada (Masa+Extras)</span>
                  <span className="text-sm font-black">${(
                    (Number(kgMasa) * 35 * (productosPrecios['EMPANADA'] || 3000)) + 
                    (Number(cantJugo) * (productosPrecios['JUGO'] || 0)) + 
                    (Number(cantTortas) * (productosPrecios['TORTA DE CARNE'] || 0))
                  ).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase opacity-80">Efectivo en Caja (Venta Directa)</span>
                  <span className="text-sm font-black text-green-200">${Number(ventasEfectivo).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-1 border-b border-white/10 pb-1">
                  <span className="text-[10px] font-black uppercase opacity-80">Recaudos Fiados Hoy</span>
                  <span className="text-sm font-black text-blue-200">+${totalIngresosHoy.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] font-black uppercase opacity-80">Total Gastos Hoy</span>
                  <span className="text-lg font-black text-red-200">-${Object.values(gastos).reduce((a,b) => a + Number(b), 0).toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-white/20 flex justify-between items-center">
                  <span className="text-xs font-black uppercase">Ganancia Real Neta</span>
                  <span className="text-2xl font-black">${(
                    (Number(ventasEfectivo) + totalIngresosHoy) -
                    Object.values(gastos).reduce((a,b) => a + Number(b), 0)
                  ).toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={registrarCierre}
                className="w-full py-5 bg-black text-white rounded-3xl font-black uppercase shadow-xl hover:bg-slate-900 active:scale-95 transition-all mt-4"
              >Guardar Cierre y Gastos</button>
            </div>
          </div>
        </div>
      )}
      <Navbar onMenuClick={() => setShowMenu(true)} />
      {/* 💎 MODAL ELEGANTE (REEMPLAZA PROMPT/CONFIRM) */}
      {modalConfig.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fadeIn">
          <div className={`w-full max-w-sm rounded-[3rem] p-8 text-center shadow-2xl animate-slideUp ${darkMode ? 'bg-slate-900 border-2 border-white/10' : 'bg-white'}`}>
            <h2 className="text-2xl font-black uppercase italic mb-2 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">{modalConfig.title}</h2>
            <p className="text-[10px] font-bold opacity-60 uppercase mb-8 tracking-widest">{modalConfig.message}</p>
            
            {modalConfig.type === 'pin' && (
              <input 
                type="password" 
                autoFocus
                placeholder="****"
                className={`w-full p-5 rounded-2xl border-4 text-center text-2xl font-black mb-8 outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-orange-500' : 'bg-orange-50 border-orange-100 focus:border-orange-500'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    modalConfig.onConfirm(e.target.value);
                    setModalConfig({ ...modalConfig, show: false });
                  }
                }}
              />
            )}

            {modalConfig.type === 'input' && (
              <input 
                type="text" 
                autoFocus
                placeholder={modalConfig.inputPlaceholder || "Escribe aquí..."}
                className={`w-full p-4 rounded-2xl border-2 mb-8 outline-none transition-all font-black uppercase text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-orange-500' : 'bg-white border-gray-100 focus:border-orange-500'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    modalConfig.onConfirm(e.target.value);
                    setModalConfig({ ...modalConfig, show: false });
                  }
                }}
              />
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setModalConfig({ ...modalConfig, show: false })}
                className="flex-1 py-4 bg-gray-200 dark:bg-slate-800 text-gray-500 rounded-2xl font-black uppercase text-xs active:scale-95 transition-all"
              >Cancelar</button>
              
              <button 
                onClick={() => {
                  const input = document.querySelector(modalConfig.type === 'confirm' ? 'button' : 'input');
                  const val = input?.value || '';
                  modalConfig.onConfirm(val);
                  setModalConfig({ ...modalConfig, show: false });
                }}
                className="flex-1 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all"
              >Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
