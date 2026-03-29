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
  const [busqueda, setBusqueda] = useState('')
  const [totalPendiente, setTotalPendiente] = useState(0)
  const [totalIngresos, setTotalIngresos] = useState(0)
  const [saludo, setSaludo] = useState('¡Hola!')
  const [cargando, setCargando] = useState(true)
  
  const [guardOpen, setGuardOpen] = useState(false)
  const [accionPendiente, setAccionPendiente] = useState(null)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallBtn, setShowInstallBtn] = useState(false)

  useEffect(() => {
    fetchDatos()
    const hora = new Date().getHours()
    if (hora >= 5 && hora < 12) setSaludo('¡Buenos días, María Vanegas! ☕')
    else if (hora >= 12 && hora < 18) setSaludo('¡Buenas tardes, María! ☀️')
    else setSaludo('¡Buenas noches, María! 🌙')

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); 
      setDeferredPrompt(e); 
      setShowInstallBtn(true);
    })
  }, [])

  async function fetchDatos() {
    try {
      const { data: listaClientes, error: errC } = await supabase.from('clientes').select('*').order('apodo', { ascending: true })
      if(errC) console.error("Error clientes:", errC)
      setClientes(listaClientes || [])
      
      const { data: todosLosFiados, error: errF } = await supabase.from('fiados').select('monto_total, estado')
      if(errF) console.error("Error fiados:", errF)
      
      const sumaPendiente = todosLosFiados?.filter(f => f.estado === 'pendiente').reduce((acc, current) => acc + Number(current.monto_total), 0) || 0
      const sumaIngresos = todosLosFiados?.filter(f => f.estado === 'pagado').reduce((acc, current) => acc + Number(current.monto_total), 0) || 0
      
      setTotalPendiente(sumaPendiente)
      setTotalIngresos(sumaIngresos)
    } catch (e) { 
      console.error("Error general fetch:", e) 
    } finally { 
      setCargando(false) 
    }
  }

  const clientesFiltrados = clientes.filter(c => {
    const query = busqueda.toLowerCase();
    return (
      c.apodo?.toLowerCase().includes(query) || 
      c.nombre?.toLowerCase().includes(query) || 
      c.telefono?.toString().includes(query)
    );
  });

  // --- FUNCIÓN DE PDF: CORREGIDA CON NOMBRES DE TU SUPABASE ---
  const manejarPDF = async (cliente) => {
    try {
      // 1. Usamos 'creado_el' que es el nombre en tu imagen de Supabase
      const { data: deudas, error: errorDeudas } = await supabase
        .from('fiados')
        .select('monto_total, cantidad, creado_el, producto_id')
        .eq('cliente_id', cliente.id)
        .eq('estado', 'pendiente');

      if (errorDeudas) throw errorDeudas;

      if (!deudas || deudas.length === 0) {
        toast.error(`No hay deudas pendientes para ${cliente.apodo}`);
        return;
      }

      // 2. Traer nombres de productos para el detalle
      const { data: listaProds } = await supabase.from('productos').select('id, nombre');

      // 3. Mapear datos para que el exportPDF los reciba correctamente
      const deudasParaPDF = deudas.map(d => ({
        monto_total: d.monto_total,
        cantidad: d.cantidad,
        created_at: d.creado_el, // Cambiamos el nombre para el archivo exportPDF.js
        productos: { 
          nombre: listaProds?.find(p => p.id === d.producto_id)?.nombre || 'Frito/Empanada' 
        }
      }));

      const exito = await generarPDFCobro(cliente, deudasParaPDF);
      return exito;

    } catch (err) {
      console.error("Fallo PDF:", err);
      throw err;
    }
  }

  const confirmarAccion = () => {
    if (accionPendiente?.tipo === 'reiniciar') ejecutarReiniciar()
    if (accionPendiente?.tipo === 'eliminar') ejecutarEliminar(accionPendiente.id)
    setAccionPendiente(null)
  }

  const ejecutarReiniciar = async () => {
    const { error } = await supabase.from('fiados').update({ estado: 'archivado' }).eq('estado', 'pagado')
    if (!error) { 
      toast.success("¡Caja reiniciada! 🚀"); 
      fetchDatos(); 
    }
  }

  const ejecutarEliminar = async (id) => {
    // Si hiciste el paso del "CASCADE" en Supabase, esto borrará todo sin error.
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (!error) { 
      toast.success("Cliente eliminado"); 
      fetchDatos(); 
    } else {
      toast.error("No se pudo eliminar. Verifica las deudas del cliente.");
    }
  }

  const bgMain = darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-black'
  const cardBg = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-400 shadow-md'

  return (
    <div className={`min-h-screen pb-40 transition-colors duration-300 ${bgMain}`}>
      <AdminGuard isOpen={guardOpen} onClose={() => setGuardOpen(false)} onConfirm={confirmarAccion} darkMode={darkMode} />

      {/* HEADER */}
      <div className="bg-orange-600 p-8 rounded-b-[3.5rem] shadow-xl text-white">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1 rounded-full border-2 border-white shadow-2xl scale-110">
              <Image src="/logo-marivama.png" alt="Logo" width={70} height={70} className="rounded-full" />
            </div>
            <div>
              <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest">{saludo}</p>
              <h1 className="text-4xl font-black tracking-tighter leading-none italic">MARIVAMA</h1>
            </div>
          </div>
          <button onClick={toggleTheme} className="bg-black/20 p-3 rounded-2xl text-2xl border border-white/30 active:scale-90 transition-transform">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 bg-black/30 p-6 rounded-[2.5rem] border-2 border-white/20">
          <div className="text-center border-r-2 border-white/10">
            <p className="text-[10px] uppercase font-black text-orange-200">Total Fiao</p>
            <p className="text-3xl font-black">${totalPendiente.toLocaleString('es-CO')}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase font-black text-green-300">Ingresos ✨</p>
            <p className="text-3xl font-black text-green-50">${totalIngresos.toLocaleString('es-CO')}</p>
            <button onClick={() => { setAccionPendiente({tipo:'reiniciar'}); setGuardOpen(true); }} className="mt-2 text-[9px] font-black uppercase opacity-60 hover:opacity-100 underline">🔄 Reiniciar</button>
          </div>
        </div>
      </div>

      {/* CUERPO - LISTA DE CLIENTES */}
      <div className="p-6 max-w-lg mx-auto">
        <div className="flex flex-col gap-3 mb-6">
          <h2 className="text-2xl font-black border-b-4 border-orange-500 inline-block uppercase italic w-fit">Deudores</h2>
          <div className="relative">
             <input 
              type="text"
              placeholder="Buscar por nombre o apodo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={`w-full p-4 pl-12 rounded-2xl border-2 outline-none focus:border-orange-500 transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 shadow-sm'}`}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">🔍</span>
          </div>
        </div>

        {cargando ? (
          <div className="text-center py-20 font-black text-orange-600 animate-pulse uppercase italic">🥟 Calentando los fritos...</div>
        ) : (
          <div className="space-y-4">
            {clientesFiltrados.map((cliente) => (
              <div key={cliente.id} className={`${cardBg} p-5 rounded-[2.5rem] border-2 flex justify-between items-center transition-transform`}>
                <div className="flex items-center gap-4">
                  <button onClick={() => { setAccionPendiente({tipo:'eliminar', id: cliente.id}); setGuardOpen(true); }} className="text-red-500 opacity-30 p-2 hover:opacity-100 transition-opacity">🗑️</button>
                  <Link href={`/clientes/detalles?id=${cliente.id}`}>
                    <div className="flex flex-col">
                        <h3 className="text-2xl font-black uppercase leading-none tracking-tighter">{cliente.apodo}</h3>
                        <p className="text-[10px] font-bold mt-1 opacity-50 uppercase">{cliente.nombre || 'Sin nombre'}</p>
                    </div>
                  </Link>
                </div>
                <button 
                  onClick={() => toast.promise(manejarPDF(cliente), {
                    loading: 'Generando cuenta... ⏳',
                    success: '¡PDF listo! 📩',
                    error: 'Fallo al conectar con base de datos'
                  })}
                  className="bg-orange-600 text-white w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-lg border-b-4 border-orange-800 active:translate-y-1 active:border-b-0"
                >
                  <span className="text-3xl font-bold">📄</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NAVEGACIÓN FIJA */}
      <nav className={`${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-orange-100 shadow-2xl'} fixed bottom-6 left-6 right-6 border-4 rounded-[3rem] p-4 flex justify-around items-center z-50`}>
        <Link href="/" className="flex flex-col items-center text-orange-600">
          <span className="text-4xl">🏠</span>
          <span className="text-[10px] font-black uppercase mt-1 tracking-tighter">Inicio</span>
        </Link>
        <Link href="/fiados/nuevo" className="bg-orange-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-xl -mt-16 border-[6px] border-orange-50 active:scale-90 transition-transform">
          <span className="text-4xl font-bold">+</span>
        </Link>
        <Link href="/clientes" className="flex flex-col items-center group">
          <span className="text-4xl">👤</span>
          <span className="text-[10px] font-black uppercase mt-1 tracking-tighter">Clientes</span>
        </Link>
      </nav>
    </div>
  )
}