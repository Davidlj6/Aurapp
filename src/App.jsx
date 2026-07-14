import React, { useState } from 'react';
import { supabase } from './supabaseClient'; // Importamos la conexión

const rankingOficial = [
  { top: 1, nombre: "David", actual: 865, total: 1865, rango: "Vidapadremanzano", emoji: "👑", color: "text-amber-400" },
  { top: 2, nombre: "Joserra", actual: 810, total: 1810, rango: "Buscapesetas", emoji: "💸", color: "text-slate-300" },
  { top: 3, nombre: "Elena", actual: 630, total: 1630, rango: "Buscapesetas", emoji: "⚖️", color: "text-amber-600" },
  { top: 4, nombre: "Rosa", actual: 365, total: 1365, rango: "Buscapesetas", emoji: "🍷", color: "text-gray-400" },
  { top: 5, nombre: "Zaira", actual: 230, total: 1230, rango: "Menchu", emoji: "💤", color: "text-gray-400" },
  { top: 6, nombre: "Dolores", actual: 90, total: 90, rango: "Vicen", emoji: "📉", color: "text-red-400" },
  { top: 7, nombre: "Justo", actual: 0, total: 1000, rango: "Menchu", emoji: "🪵", color: "text-gray-500" },
  { top: 8, nombre: "Javi", actual: 0, total: 1000, rango: "Menchu", emoji: "🪵", color: "text-gray-500" },
  { top: 9, nombre: "Gabi", actual: 0, total: 1000, rango: "Menchu", emoji: "🪵", color: "text-gray-500" },
  { top: 10, nombre: "Cristina", actual: 0, total: 1000, rango: "Menchu", emoji: "🪵", color: "text-gray-500" },
  { top: 11, nombre: "Antonio", actual: 0, total: 1000, rango: "Menchu", emoji: "🪵", color: "text-gray-500" },
  { top: 12, nombre: "Alfonso", actual: 0, total: 1000, rango: "Menchu", emoji: "🪵", color: "text-gray-500" }
];

export default function App() {
  const [sesionIniciada, setSesionIniciada] = useState(false);
  const [usuarioInput, setUsuarioInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [usuarioLogueado, setUsuarioLogueado] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (pinInput.length !== 4 || isNaN(pinInput)) {
      setError('El PIN debe ser de 4 números');
      return;
    }

    // Buscamos ignorando mayúsculas/minúsculas con "ilike"
    const { data, error: dbError } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('usuario', usuarioInput.trim()) // <--- Cambiado ".eq" por ".ilike" y quitado el ".toLowerCase()"
      .eq('pin', parseInt(pinInput, 10));

    console.log("Datos recibidos de Supabase:", data);
    console.log("Error de Supabase:", dbError);

    if (dbError) {
      setError('Error al conectar con la base de datos');
      return;
    }

    // Si data es un array vacío o no existe
    if (!data || data.length === 0) {
      setError('Usuario o PIN incorrectos');
    } else {
      // Como no usamos .single(), el resultado viene dentro de un array en la posición 0
      setUsuarioLogueado(data[0].nombre_real);
      setSesionIniciada(true);
    }
  };

  // 1. PANTALLA DE LOGIN
  if (!sesionIniciada) {
    return (
      <div className="min-h-screen bg-gray-950 text-white font-sans p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
          <header className="text-center mb-6">
            <h1 className="text-2xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 uppercase">
              Alto Tribunal de la Ley del Aura
            </h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Identifícate para entrar</p>
          </header>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Usuario</label>
              <input 
                type="text" 
                value={usuarioInput}
                onChange={(e) => setUsuarioInput(e.target.value)}
                placeholder="Usuario" 
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-center focus:outline-none focus:border-amber-400 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">PIN de 4 dígitos</label>
              <input 
                type="password" 
                maxLength="4"
                pattern="[0-9]*"
                inputMode="numeric"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••" 
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-center tracking-widest font-bold focus:outline-none focus:border-amber-400 transition-colors"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 font-semibold bg-red-950/30 border border-red-900/50 rounded-lg p-2.5 text-center">
                ⚠️ {error}
              </p>
            )}

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold py-3 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Entrar al Tribunal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. PANTALLA PRINCIPAL DEL RANKING (Se muestra solo si se loguea correctamente)
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans p-4 pb-12 flex flex-col items-center">
      {/* Cabecera */}
      <header className="text-center my-6 max-w-md w-full relative">
        {/* El botón se queda arriba a la izquierda sin molestar */}
        <button 
          onClick={() => setSesionIniciada(false)}
          className="absolute left-0 top-0 text-xs text-gray-500 hover:text-gray-300 uppercase tracking-wider transition-colors">
          🔒 Salir
        </button>
        
        {/* Añadimos un margen superior (pt-8 o mt-8) al título para que baje y no choque */}
        <h1 className="text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 uppercase pt-8">
          Alto Tribunal de la Ley del Aura
        </h1>
        <p className="text-xs text-gray-400 mt-1 tracking-widest uppercase">Hola Pri👋</p>
      </header>

      {/* Tarjeta del Líder - David */}
      <div className="w-full max-w-md bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 opacity-10 text-9xl font-black">#1</div>
        <span className="text-xs font-bold uppercase tracking-widest bg-black/30 px-2.5 py-1 rounded-full text-yellow-200">
          👑 Vidapadremanzano
        </span>
        <h2 className="text-3xl font-black mt-2">David</h2>
        <p className="text-sm text-yellow-100 mt-1">Aura Total: 1865 pts</p>
      </div>

      {/* Tabla del Ranking */}
      <main className="w-full max-w-md space-y-2.5">
        <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-2">Clasificación General</h3>
        {rankingOficial.map((j) => (
          <div 
            key={j.nombre} 
            className="flex items-center justify-between p-3.5 rounded-xl border bg-gray-900/50 border-gray-800/80 backdrop-blur-md transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              <span className={`text-base font-black w-6 text-center ${j.color}`}>
                {j.top}
              </span>
              <div>
                <h4 className="font-bold text-gray-100 flex items-center gap-1.5">
                  {j.nombre} <span className="text-sm">{j.emoji}</span>
                </h4>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">{j.rango}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-green-400 block font-semibold">+{j.actual} Semanal</span>
              <span className="text-xs font-bold text-gray-400">{j.total} pts</span>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}