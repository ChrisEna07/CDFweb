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
  const [busqueda, setBusqueda] = useState('')
  const [totalPendiente, setTotalPendiente] = useState(0)
  const [totalIngresos, setTotalIngresos] = useState(0)
  const [saludo, setSaludo] = useState('¡Hola!')
  const [cargando, setCargando] = useState(true)
  
  const [guardOpen, setGuardOpen] = useState(false)
  const [todos, setTodos] = useState([])
  const [compras, setCompras] = useState([])
  const [nuevoTodo, setNuevoTodo] = useState('')
  const [nuevaCompra, setNuevaCompra] = useState('')
  const [metaFinanciera, setMetaFinanciera] = useState(500000)
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
    "Proverbios 16:3 – Encomienda a Jehová tus obras, y tus pensamientos serán establecidos 📖"
];

  useEffect(() => {
    fetchDatos()
    fetchTodos()
    fetchCompras()
    
    setFrase(frasesMotivacionales[Math.floor(Math.random() * frasesMotivacionales.length)])
    
    const hora = new Date().getHours()
    if (hora >= 5 && hora < 12) setSaludo('¡Buenos días, María! ☕')
    else if (hora >= 12 && hora < 18) setSaludo('¡Buenas tardes, María! ☀️')
    else setSaludo('¡Buenas noches, María! 🌙')
  }, [])

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

  const agregarCompra = async (e) => {
    e.preventDefault()
    if (!nuevaCompra.trim()) return
    const { data, error } = await supabase.from('compras').insert([{ articulo: nuevaCompra.toUpperCase() }]).select()
    if (!error && data) { setCompras([...compras, data[0]]); setNuevaCompra(''); }
  }

  const fiadosSemana = fiados.filter(f => {
    const fecha = new Date(f.creado_el);
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    return fecha >= hace7Dias && f.estado === 'pendiente';
  }).reduce((acc, curr) => acc + Number(curr.monto_total), 0);

  const topDeudores = clientes.map(c => ({
    ...c,
    deuda: fiados.filter(f => f.cliente_id === c.id && f.estado === 'pendiente').reduce((acc, curr) => acc + Number(curr.monto_total), 0)
  })).sort((a, b) => b.deuda - a.deuda).slice(0, 5).filter(c => c.deuda > 0);

  const masAntiguos = fiados.filter(f => f.estado === 'pendiente')
    .sort((a, b) => new Date(a.creado_el) - new Date(b.creado_el)).slice(0, 3);

  const agregarTodo = async (e) => {
    e.preventDefault(); if (!nuevoTodo.trim()) return;
    const { data, error } = await supabase.from('todos').insert([{ text: nuevoTodo.toUpperCase() }]).select();
    if (!error && data) { setTodos([data[0], ...todos]); setNuevoTodo(''); }
  }

  const toggleTodo = async (id, estado) => {
    await supabase.from('todos').update({ done: !estado }).eq('id', id);
    setTodos(todos.map(t => t.id === id ? { ...t, done: !estado } : t));
  }

  const eliminarTodo = async (id) => {
    await supabase.from('todos').delete().eq('id', id);
    setTodos(todos.filter(t => t.id !== id));
  }

  const clientesFiltrados = clientes.filter(c => {
    const query = busqueda.toLowerCase();
    return (c.apodo?.toLowerCase().includes(query) || c.nombre?.toLowerCase().includes(query));
  });

  const manejarPDF = async (cliente) => {
    try {
      const { data: deudas } = await supabase.from('fiados').select('monto_total, cantidad, creado_el, producto_id').eq('cliente_id', cliente.id).eq('estado', 'pendiente');
      if (!deudas || deudas.length === 0) { toast.error(`No hay deudas`); return; }
      const { data: listaProds } = await supabase.from('productos').select('id, nombre');
      const deudasParaPDF = deudas.map(d => ({
        monto_total: d.monto_total, cantidad: d.cantidad, created_at: d.creado_el,
        productos: { nombre: listaProds?.find(p => p.id === d.producto_id)?.nombre || 'Frito' }
      }));
      return await generarPDFCobro(cliente, deudasParaPDF);
    } catch (err) { console.error(err); }
  }

  const bgMain = darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-black'
  const cardBg = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-400 shadow-md'

  return (
    <div className={`min-h-screen pb-40 transition-colors duration-300 ${bgMain}`}>
      <AdminGuard isOpen={guardOpen} onClose={() => setGuardOpen(false)} onConfirm={() => {}} darkMode={darkMode} />

      {/* HEADER REDISEÑADO Y ALINEADO */}
      <div className="bg-orange-600 pb-10 pt-6 px-6 rounded-b-[3rem] shadow-xl text-white">
        <div className="max-w-5xl mx-auto flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-full border-2 border-white/50 shadow-lg">
              <Image src="/logo-marivama.png" alt="Logo" width={50} height={50} className="rounded-full" />
            </div>
            <div>
              <p className="text-[10px] font-black text-orange-200 uppercase tracking-tighter leading-none mb-1">{saludo}</p>
              <h1 className="text-2xl font-black tracking-tighter leading-none italic uppercase">MARIVAMA</h1>
            </div>
          </div>
          <button onClick={toggleTheme} className="bg-white/10 hover:bg-white/20 p-2.5 rounded-2xl text-xl border border-white/20 active:scale-90 transition-all">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* FRASE DEL DÍA */}
        <div className="max-w-md mx-auto bg-black/10 p-2 rounded-full border border-white/5 text-center italic text-[11px] font-medium px-6 mb-8 text-orange-50">
          "{frase}"
        </div>

        {/* TARJETAS DE RESUMEN ALINEADAS */}
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4">
          <div className="bg-black/20 p-4 rounded-[2rem] border border-white/10 flex flex-col items-center justify-center">
            <p className="text-[9px] uppercase font-black text-orange-200 tracking-widest mb-1">Total Fiao</p>
            <p className="text-2xl font-black">${totalPendiente.toLocaleString('es-CO')}</p>
          </div>
          <div className="bg-green-950/30 p-4 rounded-[2rem] border border-green-400/20 flex flex-col items-center justify-center">
            <p className="text-[9px] uppercase font-black text-green-300 tracking-widest mb-1">Ingresos ✨</p>
            <p className="text-2xl font-black text-green-50">${totalIngresos.toLocaleString('es-CO')}</p>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 mt-4">
        
        {/* ASIDE IZQUIERDO */}
        <aside className="lg:col-span-3 space-y-6">
          <div className={`${cardBg} p-6 rounded-[2.5rem] border-2 border-orange-500/30 shadow-lg`}>
            <h3 className="font-black uppercase italic text-xs mb-2 opacity-50">Fiados esta semana</h3>
            <p className="text-2xl font-black text-orange-600">${fiadosSemana.toLocaleString()}</p>
          </div>
          <div className={`${cardBg} p-6 rounded-[2.5rem] border-2 border-red-500/20 shadow-lg`}>
            <h3 className="font-black uppercase italic text-xs mb-4 text-red-500">Más antiguos ⏳</h3>
            {masAntiguos.map(f => (
              <div key={f.id} className="mb-2 border-b border-black/5 pb-1 last:border-0">
                <p className="text-xs font-black uppercase">{clientes.find(c => c.id === f.cliente_id)?.apodo}</p>
                <p className="text-[10px] opacity-50">{new Date(f.creado_el).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN CENTRAL */}
        <main className="lg:col-span-6 space-y-6">
          <Link href="/recuerdos" className={`${cardBg} group p-4 rounded-[2rem] border-2 flex items-center justify-between hover:border-orange-500 transition-all active:scale-95 shadow-md`}>
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-xl text-2xl">📸</div>
              <div>
                <h3 className="font-black uppercase italic text-sm leading-none">Álbum de Recuerdos</h3>
                <p className="text-[9px] font-bold opacity-50 uppercase mt-1">Fotos de tu negocio</p>
              </div>
            </div>
            <span className="text-orange-600 font-black group-hover:translate-x-1 transition-transform">→</span>
          </Link>

          {/* MÓDULO COMPRAS */}
          <section className={`${cardBg} p-6 rounded-[2.5rem] border-2 border-cyan-500/20 shadow-lg`}>
            <h3 className="font-black uppercase italic text-sm mb-4 text-cyan-600 flex items-center gap-2">🛒 Compras Pendientes</h3>
            <form onSubmit={agregarCompra} className="flex gap-2 mb-4">
              <input type="text" value={nuevaCompra} onChange={e => setNuevaCompra(e.target.value)} placeholder="¿Qué falta?" className={`flex-1 p-3 rounded-xl border-2 text-sm uppercase font-bold outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-cyan-50 border-cyan-100'}`} />
              <button className="bg-cyan-600 text-white px-4 rounded-xl font-black shadow-lg">+</button>
            </form>
            <div className="grid grid-cols-1 gap-2">
              {compras.slice(0, 5).map(c => (
                <div key={c.id} className="flex justify-between items-center bg-black/5 p-2 rounded-lg">
                  <span className={`text-xs font-bold uppercase ${c.comprado ? 'line-through opacity-30' : ''}`}>{c.articulo}</span>
                </div>
              ))}
            </div>
          </section>

          {/* PENDIENTES MARÍA */}
          <section className={`${cardBg} p-6 rounded-[2.5rem] border-2 shadow-lg`}>
            <h3 className="font-black uppercase italic text-sm mb-4">📝 Pendientes de María</h3>
            <form onSubmit={agregarTodo} className="flex gap-2 mb-4">
              <input type="text" value={nuevoTodo} onChange={e => setNuevoTodo(e.target.value)} placeholder="Tarea personal..." className={`flex-1 p-3 rounded-xl border-2 text-sm uppercase font-bold outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-orange-50 border-orange-100'}`} />
              <button className="bg-orange-600 text-white px-4 rounded-xl font-black shadow-lg">+</button>
            </form>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {todos.map(t => (
                <div key={t.id} className="flex justify-between items-center bg-black/5 p-2 rounded-lg group">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id, t.done)} className="w-4 h-4 accent-orange-600 rounded" />
                    <span className={`text-xs font-bold uppercase ${t.done ? 'line-through opacity-30' : ''}`}>{t.text}</span>
                  </div>
                  <button onClick={() => eliminarTodo(t.id)} className="text-red-500 opacity-0 group-hover:opacity-100 px-2 transition-opacity text-sm">✕</button>
                </div>
              ))}
            </div>
          </section>

          {/* DEUDORES */}
          <section className="space-y-4 pt-4">
            <h2 className="text-xl font-black border-b-4 border-orange-500 inline-block uppercase italic w-fit">Mis Deudores</h2>
            <div className="relative">
              <input type="text" placeholder="Buscar apodo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={`w-full p-4 pl-12 rounded-2xl border-2 outline-none focus:border-orange-500 transition-all text-sm ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`} />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {clientesFiltrados.slice(0, 8).map((cliente) => (
                <div key={cliente.id} className={`${cardBg} p-4 rounded-[2rem] border-2 flex justify-between items-center shadow-sm`}>
                  <Link href={`/clientes/detalles?id=${cliente.id}`} className="flex-1">
                    <h3 className="text-lg font-black uppercase leading-none">{cliente.apodo}</h3>
                    <p className="text-[9px] font-bold opacity-40 uppercase mt-1">{cliente.nombre || 'Sin nombre'}</p>
                  </Link>
                  <button onClick={() => toast.promise(manejarPDF(cliente), { loading: 'Generando...', success: '¡Listo!', error: 'Fallo' })} className="bg-orange-600 text-white w-10 h-10 rounded-xl shadow-lg flex items-center justify-center active:scale-90 transition-transform">
                    <span className="text-xl">📄</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* ASIDE DERECHO */}
        <aside className="lg:col-span-3">
          <div className={`${cardBg} p-6 rounded-[2.5rem] border-2 border-yellow-500/30 shadow-lg`}>
            <h3 className="font-black uppercase italic text-[10px] mb-5 text-yellow-600 tracking-widest">🏆 Top 5 Deudores</h3>
            <div className="space-y-4">
              {topDeudores.map((c, i) => (
                <div key={c.id} className="flex justify-between items-center border-b border-black/5 pb-2 last:border-0">
                  <span className="text-[11px] font-black uppercase tracking-tighter truncate pr-2">{i+1}. {c.apodo}</span>
                  <span className="text-[11px] font-black text-orange-600">${c.deuda.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>

      {/* NAVBAR */}
      <nav className={`${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-orange-100 shadow-2xl'} fixed bottom-6 left-6 right-6 border-4 rounded-[3rem] p-4 flex justify-around items-center z-50`}>
        <Link href="/" className="flex flex-col items-center text-orange-600">
          <span className="text-3xl">🏠</span>
          <span className="text-[9px] font-black uppercase mt-1">Inicio</span>
        </Link>
        <Link href="/fiados/nuevo" className="bg-orange-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl -mt-14 border-[5px] border-orange-50 active:scale-90 transition-transform">
          <span className="text-3xl font-bold">+</span>
        </Link>
        <Link href="/clientes" className="flex flex-col items-center opacity-50">
          <span className="text-3xl">👤</span>
          <span className="text-[9px] font-black uppercase mt-1">Deudores</span>
        </Link>
      </nav>
    </div>
  )
}