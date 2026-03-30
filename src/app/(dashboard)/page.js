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
  
  const [guardOpen, setGuardOpen] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [accionPendiente, setAccionPendiente] = useState(null)

  // --- 📝 ESTADOS PARA FUNCIONES ---
  const [todos, setTodos] = useState([])
  const [nuevoTodo, setNuevoTodo] = useState('')
  const [compras, setCompras] = useState([])
  const [nuevaCompra, setNuevaCompra] = useState('')
  const [frase, setFrase] = useState('')

const frasesMotivacionales = [
    "¡Hoy será un gran día de ventas! 🥟",
    "Cada esfuerzo cuenta para tus sueños 🏠",
    "Tu trabajo alimenta corazones y sonrisas 😊",
    "María, eres una mujer imparable 💪",
    "Dios bendice tu negocio hoy 🙏",
    "El Señor te dará prosperidad en todo lo que emprendas 🌟 (Deuteronomio 30:9)",
    "Confía en Dios y tus ventas florecerán 🌻",
    "Cada cliente es una bendición en camino ✨",
    "Jehová prosperará tu trabajo y te dará abundancia 🕊️ (Salmo 1:3)",
    "Tus metas están más cerca de lo que crees 🚀",
    "La perseverancia abre puertas que nadie puede cerrar 🔑",
    "Dios te dará poder para hacer riquezas 🙌 (Deuteronomio 8:18)",
    "Hoy es día de cosecha, no te canses de sembrar 🌾",
    "El éxito está en tus manos con fe y acción 👐",
    "Proverbios 16:3 – Encomienda a Jehová tus obras, y tus pensamientos serán establecidos 📖",
    "Dios es tu socio fiel; confía en Su provisión 🤝 (Filipenses 4:19)",
    "Cada venta es un paso hacia tu propósito 🎯",
    "El cielo está de tu lado, ¡ve con fe! ☁️✨",
    "Tu negocio es semilla que dará fruto abundante 🌱🍇",
    "No te rindas, tu gran bendición está por llegar 🎁 (Gálatas 6:9)",
    "Hoy siembra con alegría y cosecharás con gozo 🌞 (2 Corintios 9:8)",
    "María, tus manos son instrumento de bendición 🕯️",
    "El favor de Dios va delante de ti 🚪👑",
    "Todo lo que hagas prosperará cuando pongas a Dios primero 🏆 (Mateo 6:33)",
    "Tus sueños tienen respaldo celestial 🌈",
    "Un cliente más es una bendición más, ¡recíbela con gratitud! 🙏💖",
    "La fe mueve montañas y también multiplica tus ventas ⛰️➡️💰",
    "Dios restaura y multiplica lo que pones en Sus manos 👐✨ (Joel 2:25-16)",
    "Hoy declaro abundancia sobre tu negocio 📢🌊",
    "Con Dios, cada obstáculo es una oportunidad 🌟"
];

  useEffect(() => {
    fetchDatos()
    fetchTodos()
    fetchCompras()
    fetchPremios()
    
    setFrase(frasesMotivacionales[Math.floor(Math.random() * frasesMotivacionales.length)])
    
    const hora = new Date().getHours()
    if (hora >= 5 && hora < 12) setSaludo('¡Buenos días, María! ☕')
    else if (hora >= 12 && hora < 18) setSaludo('¡Buenas tardes, María! ☀️')
    else setSaludo('¡Buenas noches, María! 🌙')
  }, [])

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

  // --- ✨ LÓGICA DE PUNTOS ---
  const calcularPuntos = (clienteId) => {
    const pagados = fiados.filter(f => f.cliente_id === clienteId && f.estado === 'pagado').length;
    const canjes = premios.filter(p => p.cliente_id === clienteId).length;
    return Math.max(0, (pagados * 2) - (canjes * 10));
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

  const clientesQuePagaron = clientes.filter(c => fiados.some(f => f.cliente_id === c.id && f.estado === 'pagado'));

  const confirmarAccion = () => {
    if (accionPendiente?.tipo === 'reiniciar') ejecutarReiniciar()
    setAccionPendiente(null)
  }

  const ejecutarReiniciar = async () => {
    const { error } = await supabase.from('fiados').update({ estado: 'archivado' }).eq('estado', 'pagado')
    if (!error) { toast.success("Caja reiniciada"); fetchDatos(); }
  }

  const bgMain = darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-black'
  const cardBg = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-400 shadow-md'

  return (
    <div className={`min-h-screen pb-40 transition-colors duration-300 ${bgMain}`}>
      <AdminGuard isOpen={guardOpen} onClose={() => setGuardOpen(false)} onConfirm={confirmarAccion} darkMode={darkMode} />

      {/* HEADER */}
      <div className="bg-orange-600 p-8 rounded-b-[3.5rem] shadow-xl text-white">
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1 rounded-full border-2 border-white shadow-2xl scale-110">
              <Image src="/logo-marivama.png" alt="Logo" width={65} height={65} className="rounded-full" />
            </div>
            <div>
              <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest mb-1">{saludo}</p>
              <h1 className="text-3xl font-black tracking-tighter leading-none italic">Fritos y Empanadas MAriVama</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowStats(true)} className="bg-black/20 p-3 rounded-2xl text-2xl border border-white/30 active:scale-90">📊</button>
            <button onClick={() => setShowMenu(true)} className="bg-black/20 p-3 rounded-2xl text-2xl border border-white/30 active:scale-90">📋</button>
            <button onClick={toggleTheme} className="bg-black/20 p-3 rounded-2xl text-2xl border border-white/30 active:scale-90">
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* CARTELES NEON CAROUSEL - CORREGIDO */}
        <div className="mb-5 overflow-hidden bg-black/40 py-3 rounded-2xl border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] relative h-10 flex items-center">
          <div className="absolute whitespace-nowrap animate-marquee">
            <span className="text-sm font-black uppercase italic px-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] [text-shadow:0_0_10px_#fff,0_0_20px_#ffa500,0_0_30px_#ff8c00]">
              {frase}
            </span>
          </div>
        </div>

        <style jsx>{`
          @keyframes marquee {
            0% { transform: translateX(100vw); }
            100% { transform: translateX(-100%); }
          }
          .animate-marquee {
            animation: marquee 10s linear infinite;
          }
        `}</style>
        
        <div className="grid grid-cols-2 gap-4 bg-black/30 p-6 rounded-[2.5rem] border-2 border-white/20">
          <div className="text-center border-r-2 border-white/10">
            <p className="text-[10px] uppercase font-black text-orange-200">Total Fiao</p>
            <p className="text-3xl font-black">${totalPendiente.toLocaleString('es-CO')}</p>
          </div>
          <div className="text-center relative">
            <p className="text-[10px] uppercase font-black text-green-300">Ingresos ✨</p>
            <p className="text-3xl font-black text-green-50">${totalIngresos.toLocaleString('es-CO')}</p>
            <button onClick={() => { setAccionPendiente({tipo:'reiniciar'}); setGuardOpen(true); }} className="mt-2 text-[9px] font-black uppercase opacity-60 underline">🔄 Reiniciar con PIN</button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto space-y-6">
        {/* FIADO DE LA SEMANA */}
        <div className={`${cardBg} p-5 rounded-[2.5rem] border-2 border-orange-500/30 text-center`}>
            <p className="text-[10px] uppercase font-black opacity-50 mb-1 tracking-widest">Fiado de la Semana</p>
            <p className="text-3xl font-black text-orange-600">${fiadosSemana.toLocaleString('es-CO')}</p>
        </div>

        {/* BUSCADOR Y LISTA */}
        <section className="space-y-4">
          <div className="relative">
            <input 
              type="text"
              placeholder="Buscar cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={`w-full p-4 pl-12 rounded-2xl border-2 outline-none focus:border-orange-500 transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 shadow-sm'}`}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">🔍</span>
          </div>

          <div className="space-y-3">
            {clientes.filter(c => c.apodo.toLowerCase().includes(busqueda.toLowerCase())).slice(0, 15).map((cliente) => (
              <div key={cliente.id} className={`${cardBg} p-4 rounded-[2.5rem] border-2 flex justify-between items-center`}>
                <Link href={`/clientes/detalles?id=${cliente.id}`} className="flex-1">
                    <h3 className="text-lg font-black uppercase leading-none">{cliente.apodo}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-[9px] font-black">🏅 {calcularPuntos(cliente.id)} PTS</span>
                        <p className="text-[9px] font-bold opacity-40 uppercase">{cliente.nombre || 'Sin nombre'}</p>
                    </div>
                </Link>
                <button 
                  onClick={() => toast.promise(manejarPDF(cliente), { loading: 'Generando...', success: '¡PDF listo!', error: 'Fallo' })}
                  className="bg-orange-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                  <span className="text-2xl font-bold">📄</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 📊 MODAL DE REPORTES */}
      {showStats && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`w-full max-w-lg rounded-[3.5rem] p-8 overflow-y-auto max-h-[85vh] shadow-2xl ${darkMode ? 'bg-slate-900 border-2 border-slate-700' : 'bg-orange-50'}`}>
                <div className="flex justify-between items-center mb-6 border-b-2 border-black/5 pb-4">
                    <h2 className="text-xl font-black uppercase italic text-orange-600 flex items-center gap-2">📊 Estadísticas</h2>
                    <button onClick={() => setShowStats(false)} className="bg-black/5 w-10 h-10 rounded-full font-bold">✕</button>
                </div>
                
                <div className="space-y-6">
                    <div className="bg-red-500/10 p-5 rounded-[2rem] border-2 border-red-500/20">
                        <h3 className="text-[10px] font-black uppercase text-red-600 mb-3 tracking-widest underline">⏳ Deudas más viejas</h3>
                        {deudasMasViejas.map(f => (
                            <div key={f.id} className="flex justify-between text-xs mb-2 font-bold uppercase italic">
                                <span>{clientes.find(c => c.id === f.cliente_id)?.apodo}</span>
                                <span className="opacity-60">{new Date(f.creado_el).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-orange-500/10 p-5 rounded-[2rem] border-2 border-orange-500/20">
                        <h3 className="text-[10px] font-black uppercase text-orange-600 mb-3 tracking-widest underline">💰 Mayores deudas actuales</h3>
                        {topMayorFiado.map(c => (
                            <div key={c.id} className="flex justify-between text-xs mb-2 font-bold uppercase">
                                <span>{c.apodo}</span>
                                <span className="text-orange-600">${c.total.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-green-500/10 p-5 rounded-[2rem] border-2 border-green-500/20">
                        <h3 className="text-[10px] font-black uppercase text-green-600 mb-3 tracking-widest underline">🏅 Clientes con Puntos</h3>
                        {clientes.map(c => ({...c, pts: calcularPuntos(c.id)})).filter(c => c.pts > 0).sort((a,b) => b.pts - a.pts).slice(0,5).map(c => (
                            <div key={c.id} className="flex justify-between text-xs mb-2 font-bold uppercase">
                                <span>{c.apodo}</span>
                                <span className="text-green-600">{c.pts} PTS</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-blue-500/10 p-5 rounded-[2rem] border-2 border-blue-500/20">
                        <h3 className="text-[10px] font-black uppercase text-blue-600 mb-3 tracking-widest underline">✅ Pagaron recientemente</h3>
                        <div className="flex flex-wrap gap-2">
                            {clientesQuePagaron.slice(0, 10).map(c => (
                                <span key={c.id} className="bg-white/50 px-2 py-1 rounded-lg text-[9px] font-black uppercase">{c.apodo}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 🥟 MODAL DE MENÚ (FUNCIONES) */}
      {showMenu && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`w-full max-w-lg rounded-[3.5rem] p-8 overflow-y-auto max-h-[85vh] shadow-2xl ${darkMode ? 'bg-slate-900 border-2 border-slate-700' : 'bg-orange-50'}`}>
                <div className="flex justify-between items-center mb-6 border-b-2 border-black/5 pb-4">
                    <h2 className="text-xl font-black uppercase italic text-cyan-600 flex items-center gap-2">🥟 Menú de Funciones 🥟</h2>
                    <button onClick={() => setShowMenu(false)} className="bg-black/5 w-10 h-10 rounded-full font-bold">✕</button>
                </div>

                <div className="space-y-6">
                    {/* ACCESO RECUERDOS */}
                    <Link href="/recuerdos" className="flex items-center justify-between p-5 bg-orange-600 text-white rounded-[2rem] font-black uppercase italic shadow-lg active:scale-95 transition-all">
                        <span className="flex items-center gap-3"><span className="text-2xl">📸</span> Álbum de Recuerdos</span>
                        <span>→</span>
                    </Link>

                    {/* LISTA DE COMPRAS */}
                    <section className="bg-cyan-500/5 p-5 rounded-[2rem] border-2 border-cyan-500/20">
                        <h3 className="text-[10px] font-black uppercase text-cyan-600 mb-3 flex items-center gap-2 tracking-widest">🛒 Lista de Compras</h3>
                        <form onSubmit={agregarCompra} className="flex gap-2 mb-4">
                            <input type="text" value={nuevaCompra} onChange={e => setNuevaCompra(e.target.value)} className="flex-1 p-3 rounded-xl border-2 text-sm uppercase font-bold outline-none" placeholder="¿Qué falta?" />
                            <button className="bg-cyan-600 text-white px-4 rounded-xl font-black shadow-md">+</button>
                        </form>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {compras.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-white/50 p-2 rounded-xl border group">
                                    <span onClick={() => toggleCompra(item.id, item.comprado)} className={`text-xs font-bold uppercase cursor-pointer ${item.comprado ? 'line-through opacity-30' : ''}`}>{item.articulo}</span>
                                    <button onClick={() => eliminarCompra(item.id)} className="text-red-500 opacity-0 group-hover:opacity-100 p-1">✕</button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* PENDIENTES */}
                    <section className="bg-purple-500/5 p-5 rounded-[2rem] border-2 border-purple-500/20">
                        <h3 className="text-[10px] font-black uppercase text-purple-600 mb-3 flex items-center gap-2 tracking-widest">📝 Pendientes de María</h3>
                        <form onSubmit={agregarTodo} className="flex gap-2 mb-4">
                            <input type="text" value={nuevoTodo} onChange={e => setNuevoTodo(e.target.value)} className="flex-1 p-3 rounded-xl border-2 text-sm uppercase font-bold outline-none" placeholder="Tarea nueva..." />
                            <button className="bg-purple-600 text-white px-4 rounded-xl font-black shadow-md">+</button>
                        </form>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {todos.map(todo => (
                                <div key={todo.id} className="flex justify-between items-center bg-white/50 p-2 rounded-xl border group">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id, todo.done)} className="accent-purple-600" />
                                        <span className={`text-xs font-bold uppercase ${todo.done ? 'line-through opacity-30' : ''}`}>{todo.text}</span>
                                    </div>
                                    <button onClick={() => eliminarTodo(todo.id)} className="text-red-500 opacity-0 group-hover:opacity-100 p-1">✕</button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className={`${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-orange-100 shadow-2xl'} fixed bottom-6 left-6 right-6 border-4 rounded-[3rem] p-4 flex justify-around items-center z-50`}>
        <Link href="/" className="flex flex-col items-center text-orange-600">
          <span className="text-4xl">🏠</span>
          <span className="text-[10px] font-black uppercase mt-1">Inicio</span>
        </Link>
        <Link href="/fiados/nuevo" className="bg-orange-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-xl -mt-16 border-[6px] border-orange-50 active:scale-90 transition-transform">
          <span className="text-4xl font-bold">+</span>
        </Link>
        <Link href="/clientes" className="flex flex-col items-center opacity-50">
          <span className="text-4xl">👤</span>
          <span className="text-[10px] font-black uppercase mt-1">Deudores</span>
        </Link>
      </nav>
    </div>
  )
}