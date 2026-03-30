'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import { toast } from 'sonner'

export default function GaleriaRecuerdos() {
  const { darkMode } = useTheme()
  const [recuerdos, setRecuerdos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [imagenExpandida, setImagenExpandida] = useState(null)
  const [editandoId, setEditandoId] = useState(null)
  const [nuevoTitulo, setNuevoTitulo] = useState("")

  useEffect(() => {
    fetchRecuerdos()
  }, [])

  async function fetchRecuerdos() {
    try {
      const { data, error } = await supabase
        .from('recuerdos')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setRecuerdos(data || [])
    } catch (err) {
      console.error("Error al cargar:", err)
    } finally {
      setCargando(false)
    }
  }

  const subirFoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setSubiendo(true)
    const toastId = toast.loading("Subiendo recuerdo...")

    try {
      // 1. Nombre de archivo único
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      // 2. Subida al Storage (Bucket 'evidencias')
      const { error: upErr } = await supabase.storage
        .from('evidencias')
        .upload(fileName, file, { contentType: file.type, upsert: true })

      if (upErr) throw upErr

      // 3. Generar URL Pública
      const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(fileName)

      // 4. Insertar en tabla 'recuerdos' (Asegúrate de haber corrido el SQL del paso 1)
      const { error: insErr } = await supabase
        .from('recuerdos')
        .insert([{ 
          url: publicUrl, 
          titulo: file.name.split('.')[0] // Usa el nombre original del archivo como título inicial
        }])

      if (insErr) throw insErr
      
      toast.success("¡Foto guardada!", { id: toastId })
      fetchRecuerdos()
    } catch (err) {
      console.error("Error detallado:", err)
      toast.error(`Error de base de datos: Revisa si creaste la columna 'titulo'`, { id: toastId })
    } finally {
      setSubiendo(false)
      e.target.value = ''
    }
  }

  const actualizarTitulo = async (id) => {
    if (!nuevoTitulo.trim()) return setEditandoId(null)
    try {
      const { error } = await supabase.from('recuerdos').update({ titulo: nuevoTitulo }).eq('id', id)
      if (error) throw error
      toast.success("Título actualizado")
      setEditandoId(null)
      fetchRecuerdos()
    } catch (err) {
      toast.error("No se pudo actualizar el nombre")
    }
  }

  const eliminarFoto = async (id) => {
    if(!confirm("¿Borrar permanentemente este recuerdo?")) return
    try {
      const { error } = await supabase.from('recuerdos').delete().eq('id', id)
      if (error) throw error
      toast.success("Eliminado")
      setRecuerdos(recuerdos.filter(r => r.id !== id))
    } catch (err) {
      toast.error("Error al eliminar")
    }
  }

  const bgMain = darkMode ? 'bg-slate-950 text-white' : 'bg-orange-50 text-black'
  const cardBg = darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-xl'

  return (
    <div className={`min-h-screen p-4 pb-32 transition-colors duration-500 ${bgMain}`}>
      {/* HEADER */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-10 mt-4">
        <Link href="/" className="bg-orange-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg active:scale-95 text-xs uppercase tracking-widest">
          ← Inicio
        </Link>
        <h1 className="text-2xl font-black italic uppercase text-orange-600 tracking-tighter">Álbum 📸</h1>
      </div>

      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-20">
          <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-black uppercase text-xs tracking-widest">Abriendo álbum...</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recuerdos.map((rec) => (
            <div key={rec.id} className={`${cardBg} rounded-[2.5rem] border-2 p-3 flex flex-col transition-all hover:translate-y-[-5px]`}>
              
              {/* VISTA PREVIA */}
              <div 
                className="relative cursor-zoom-in group overflow-hidden rounded-[2rem] shadow-inner bg-slate-200"
                onClick={() => setImagenExpandida(rec)}
              >
                <img 
                  src={rec.url} 
                  className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt={rec.titulo}
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <span className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold text-xs">Ampliar</span>
                </div>
              </div>

              {/* INFO */}
              <div className="p-5">
                {editandoId === rec.id ? (
                  <div className="flex gap-2 mb-2">
                    <input 
                      autoFocus
                      className="bg-orange-100 dark:bg-slate-800 p-2 rounded-lg outline-none flex-1 font-bold text-sm"
                      value={nuevoTitulo}
                      onChange={(e) => setNuevoTitulo(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && actualizarTitulo(rec.id)}
                    />
                    <button onClick={() => actualizarTitulo(rec.id)} className="bg-green-500 text-white px-3 rounded-lg text-xs font-bold">OK</button>
                  </div>
                ) : (
                  <h3 
                    className="font-black uppercase text-base truncate mb-1 cursor-pointer hover:text-orange-600 flex items-center gap-2"
                    onClick={() => { setEditandoId(rec.id); setNuevoTitulo(rec.titulo || ""); }}
                  >
                    {rec.titulo || "Sin título"}
                    <span className="text-[10px] opacity-20 italic font-normal">editar</span>
                  </h3>
                )}

                <div className="flex justify-between items-end mt-4">
                  <div className="text-[10px] opacity-40 font-bold uppercase">
                    <p>{new Date(rec.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</p>
                    <p>{new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <button 
                    onClick={() => eliminarFoto(rec.id)} 
                    className="text-red-400 hover:text-red-600 font-black text-[10px] uppercase tracking-tighter"
                  >
                    [ Eliminar ]
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FULL SCREEN */}
      {imagenExpandida && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200"
          onClick={() => setImagenExpandida(null)}
        >
          <div className="max-w-5xl w-full flex flex-col items-center relative">
            <img 
              src={imagenExpandida.url} 
              className="max-h-[85vh] w-auto object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <h2 className="text-white mt-6 font-black uppercase text-xl italic tracking-widest">{imagenExpandida.titulo}</h2>
            <p className="text-orange-500 font-bold text-xs mt-2 uppercase">Toca cualquier lugar para cerrar</p>
          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE */}
      <label className="fixed bottom-10 right-10 w-20 h-20 bg-orange-600 text-white rounded-full flex items-center justify-center text-4xl shadow-[0_10px_50px_rgba(234,88,12,0.5)] border-4 border-white active:scale-90 transition-all cursor-pointer z-50 hover:rotate-90">
        {subiendo ? <span className="text-xs animate-spin font-black text-white">...</span> : "+"}
        <input type="file" accept="image/*" className="hidden" onChange={subirFoto} disabled={subiendo} />
      </label>
    </div>
  )
}