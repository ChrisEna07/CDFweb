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

      // 4. Insertar en tabla 'recuerdos'
      const { error: insErr } = await supabase
        .from('recuerdos')
        .insert([{ 
          url: publicUrl, 
          titulo: file.name.split('.')[0]
        }])

      if (insErr) throw insErr
      
      toast.success("¡Foto guardada! ✨", { id: toastId })
      fetchRecuerdos()
    } catch (err) {
      console.error("Error detallado:", err)
      toast.error(`Error al subir la foto`, { id: toastId })
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
      toast.success("Título actualizado ✨")
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
      toast.success("Recuerdo eliminado")
      setRecuerdos(recuerdos.filter(r => r.id !== id))
    } catch (err) {
      toast.error("Error al eliminar")
    }
  }

  const bgMain = darkMode 
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white' 
    : 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 text-black'
  
  const cardBg = darkMode 
    ? 'bg-slate-900/80 border-slate-700 backdrop-blur-sm hover:shadow-xl transition-all duration-300' 
    : 'bg-white/80 border-orange-200 backdrop-blur-sm hover:shadow-2xl transition-all duration-300'

  return (
    <div className={`min-h-screen p-4 pb-40 transition-all duration-500 ${bgMain}`}>
      {/* HEADER MEJORADO */}
      <div className="max-w-6xl mx-auto mb-10 mt-4">
        <div className="flex justify-between items-center">
          <Link 
            href="/" 
            className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-2.5 rounded-xl font-black shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 text-xs uppercase tracking-widest"
          >
            ← Volver al Inicio
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-black italic uppercase bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent tracking-tighter">
              Álbum de Recuerdos 📸
            </h1>
            <p className="text-[9px] font-black uppercase opacity-50 mt-1 tracking-widest">
              {recuerdos.length} {recuerdos.length === 1 ? 'recuerdo' : 'recuerdos'} guardados
            </p>
          </div>
          <div className="w-20"></div>
        </div>
      </div>

      {cargando ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="font-black uppercase text-xs tracking-widest text-orange-600 animate-pulse">Abriendo álbum...</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recuerdos.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20">
              <div className={`${cardBg} p-12 rounded-[3rem] border-2 text-center max-w-md`}>
                <span className="text-6xl block mb-4">📸</span>
                <h3 className="text-2xl font-black uppercase mb-2">Álbum vacío</h3>
                <p className="text-xs opacity-60 mb-6">Aún no hay recuerdos guardados</p>
                <label className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-3 rounded-xl font-black text-sm cursor-pointer hover:scale-105 transition-all inline-flex items-center gap-2">
                  <span className="text-xl">+</span> Agregar primera foto
                  <input type="file" accept="image/*" className="hidden" onChange={subirFoto} disabled={subiendo} />
                </label>
              </div>
            </div>
          ) : (
            recuerdos.map((rec, index) => (
              <div 
                key={rec.id} 
                className={`${cardBg} rounded-[2rem] border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2`}
                style={{animationDelay: `${index * 50}ms`}}
              >
                {/* IMAGEN CON OVERLAY MEJORADO */}
                <div 
                  className="relative cursor-zoom-in group overflow-hidden aspect-square bg-gradient-to-br from-gray-200 to-gray-300"
                  onClick={() => setImagenExpandida(rec)}
                >
                  <img 
                    src={rec.url} 
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1" 
                    alt={rec.titulo}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
                    <span className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full font-black text-xs tracking-wider transform translate-y-4 group-hover:translate-y-0 transition-transform">
                      🔍 Ampliar
                    </span>
                  </div>
                </div>

                {/* INFO MEJORADA */}
                <div className="p-5 space-y-3">
                  {editandoId === rec.id ? (
                    <div className="flex gap-2">
                      <input 
                        autoFocus
                        className={`flex-1 p-3 rounded-xl outline-none font-black text-sm transition-all focus:ring-2 focus:ring-orange-500/50 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 shadow-sm'}`}
                        value={nuevoTitulo}
                        onChange={(e) => setNuevoTitulo(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && actualizarTitulo(rec.id)}
                        placeholder="Escribe un título..."
                      />
                      <button 
                        onClick={() => actualizarTitulo(rec.id)} 
                        className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 rounded-xl font-black text-xs transition-all hover:scale-105 active:scale-95"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <div className="group/titulo">
                      <h3 
                        className="font-black uppercase text-lg truncate cursor-pointer hover:text-orange-600 transition-colors flex items-center gap-2"
                        onClick={() => { setEditandoId(rec.id); setNuevoTitulo(rec.titulo || ""); }}
                      >
                        {rec.titulo || "Sin título"}
                        <span className="text-[9px] opacity-0 group-hover/titulo:opacity-40 italic font-normal transition-opacity">
                          ✏️ editar
                        </span>
                      </h3>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-orange-500/20">
                    <div className="text-[9px] font-black uppercase opacity-50 flex items-center gap-2">
                      <span>📅</span>
                      <p>{new Date(rec.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      <span className="text-[8px]">•</span>
                      <p>{new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button 
                      onClick={() => eliminarFoto(rec.id)} 
                      className="text-red-500/50 hover:text-red-600 font-black text-[9px] uppercase tracking-wider transition-all hover:scale-110"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL FULL SCREEN MEJORADO */}
      {imagenExpandida && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setImagenExpandida(null)}
        >
          <div className="max-w-5xl w-full flex flex-col items-center relative">
            <button 
              onClick={() => setImagenExpandida(null)}
              className="absolute -top-12 right-0 text-white/50 hover:text-white text-2xl transition-colors"
            >
              ✕ Cerrar
            </button>
            <img 
              src={imagenExpandida.url} 
              className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl border-4 border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-6 text-center">
              <h2 className="text-white font-black uppercase text-2xl italic tracking-widest drop-shadow-lg">
                {imagenExpandida.titulo || "Sin título"}
              </h2>
              <p className="text-orange-500 font-black text-xs mt-3 uppercase tracking-wider">
                {new Date(imagenExpandida.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-white/40 text-[9px] font-black mt-4">Toca cualquier lugar para cerrar</p>
            </div>
          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE MOVIDO A LA ESQUINA SUPERIOR DERECHA */}
      <label className="fixed top-6 right-6 w-14 h-14 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-full flex items-center justify-center text-2xl shadow-2xl border-2 border-white dark:border-slate-800 active:scale-90 transition-all duration-300 cursor-pointer z-50 hover:rotate-90 hover:shadow-3xl group">
        {subiendo ? (
          <span className="text-base animate-spin font-black">⏳</span>
        ) : (
          <span className="group-hover:rotate-12 transition-transform text-2xl font-bold">+</span>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={subirFoto} disabled={subiendo} />
      </label>

      {/* NAVEGACIÓN INFERIOR MEJORADA */}
      <nav className={`${darkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-orange-200'} backdrop-blur-xl fixed bottom-6 left-6 right-6 border-4 rounded-[3rem] p-4 flex justify-around items-center z-50 shadow-2xl`}>
        <Link href="/" className="flex flex-col items-center group">
          <span className="text-3xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1">🏠</span>
          <span className={`text-[10px] font-black uppercase mt-1 opacity-70 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-white' : 'text-black'}`}>Inicio</span>
        </Link>
        
        <Link href="/fiados/nuevo" className="bg-gradient-to-r from-orange-600 to-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-xl -mt-16 border-[6px] border-orange-50 dark:border-slate-800 transition-all duration-300 hover:shadow-2xl hover:scale-110 active:scale-95 group">
          <span className="text-4xl font-bold transition-transform duration-300 group-hover:rotate-90">+</span>
        </Link>

        <Link href="/recuerdos" className="flex flex-col items-center group">
          <span className="text-3xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 text-orange-600">📸</span>
          <span className="text-[10px] font-black uppercase mt-1 text-orange-600">Álbum</span>
        </Link>
      </nav>

      {/* ESTILOS GLOBALES */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}