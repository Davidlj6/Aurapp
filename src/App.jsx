import React, { useState } from 'react';
import { supabase } from './supabaseClient';

// ==========================================
// 1. CONFIGURACIÓN DEL LORE Y NIVELES DE AURA
// ==========================================
const rangosAura = [
  { limite: 0, nombre: "Vicen" },
  { limite: 100, nombre: "Kuki" },
  { limite: 250, nombre: "Calzoncillovic" },
  { limite: 450, nombre: "Pascual" },
  { limite: 700, nombre: "Guarriple" },
  { limite: 1000, nombre: "Menchu" },
  { limite: 1350, nombre: "Buscapesetas" },
  { limite: 1750, nombre: "Vidapadremanzano" },
  { limite: 2200, nombre: "Alfonshow" },
  { limite: 2700, nombre: "Makapeta" },
  { limite: 3250, nombre: "Maleta" },
  { limite: 3850, nombre: "Pedro Chupador" },
  { limite: 4500, nombre: "Black Nails" },
  { limite: 5200, nombre: "La Pou" },
  { limite: 6000, nombre: "Vareta" },
  { limite: 6850, nombre: "Pepeleche" },
  { limite: 7750, nombre: "Samu perreador nato" },
  { limite: 8700, nombre: "Maxirre" },
  { limite: 9700, nombre: "Vilches" },
  { limite: 10800, nombre: "Petete" },
  { limite: 12000, nombre: "Only1Egg" },
  { limite: 13300, nombre: "Case y Ceos" },
  { limite: 14700, nombre: "El Polaco" },
  { limite: 16200, nombre: "El Chache" },
  { limite: 17800, nombre: "Dani Manzano" },
  { limite: 19500, nombre: "Oh Felipe" },
  { limite: 21300, font: "", nombre: "Feliciano" },
  { limite: 23200, nombre: "Brocheja Jefecito" },
  { limite: 25200, nombre: "Luisal" },
  { limite: 27300, nombre: "Farola" },
  { limite: 29500, nombre: "El negro y la negra" },
  { limite: 31800, nombre: "Luisma" },
  { limite: 34200, nombre: "Brosjaca" },
  { limite: 36700, nombre: "Fael" },
  { limite: 39300, nombre: "Gordito del Chan" },
  { limite: 42000, nombre: "Pipirrana" },
  { limite: 44800, nombre: "Picula" },
  { limite: 47700, nombre: "Pacogym" },
  { limite: 50700, nombre: "Ali" },
  { limite: 53800, nombre: "Chan" },
  { limite: 57000, nombre: "Juli" },
  { limite: 60300, nombre: "Pichi" }
];

// Función Helper para calcular rango automáticamente en base a los puntos totales
function obtenerRango(puntos) {
  for (let i = rangosAura.length - 1; i >= 0; i--) {
    if (puntos >= rangosAura[i].limite) {
      return rangosAura[i].nombre;
    }
  }
  return "Vicen";
}

// ==========================================
// 2. DATOS ESTÁTICOS TEMPORALES DEL RANKING
// ==========================================
const rankingOficial = [
  { top: 1, nombre: "David", actual: 865, total: 1865, emoji: "👑", color: "text-amber-400" },
  { top: 2, nombre: "Joserra", actual: 810, total: 1810, emoji: "💸", color: "text-slate-300" },
  { top: 3, nombre: "Elena", actual: 630, total: 1630, emoji: "⚖️", color: "text-amber-600" },
  { top: 4, nombre: "Rosa", actual: 365, total: 1365, emoji: "🍷", color: "text-gray-400" },
  { top: 5, nombre: "Zaira", actual: 230, total: 1230, emoji: "💤", color: "text-gray-400" },
  { top: 6, nombre: "Dolores", actual: 90, total: 90, emoji: "📉", color: "text-red-400" },
  { top: 7, nombre: "Justo", actual: 0, total: 1000, emoji: "🪵", color: "text-gray-500" },
  { top: 8, nombre: "Javi", actual: 0, total: 1000, emoji: "🪵", color: "text-gray-500" },
  { top: 9, nombre: "Gabi", actual: 0, total: 1000, emoji: "🪵", color: "text-gray-500" },
  { top: 10, nombre: "Cristina", actual: 0, total: 1000, emoji: "🪵", color: "text-gray-500" },
  { top: 11, nombre: "Antonio", actual: 0, total: 1000, emoji: "🪵", color: "text-gray-500" },
  { top: 12, nombre: "Alfonso", actual: 0, total: 1000, emoji: "🪵", color: "text-gray-500" }
];

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
export default function App() {
  const [sesionIniciada, setSesionIniciada] = useState(false);
  const [usuarioInput, setUsuarioInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [usuarioLogueado, setUsuarioLogueado] = useState('');
  
  // Estado de navegación activa: 'menu', 'ranking' o 'perfil'
  const [seccionActiva, setSeccionActiva] = useState('menu');

  // Cálculo de líder dinámico
  const liderActual = rankingOficial.find(jugador => jugador.top === 1) || rankingOficial[0];

  // Búsqueda de estadísticas del usuario que ha iniciado sesión
  const datosUsuarioLogueado = rankingOficial.find(
    jugador => jugador.nombre.toLowerCase() === usuarioLogueado?.toLowerCase()
  ) || { top: '?', actual: 0, total: 0, emoji: "🥚" };

  // Rangos calculados dinámicamente para las tarjetas principales
  const rangoLider = obtenerRango(liderActual.total);
  const rangoUsuario = obtenerRango(datosUsuarioLogueado.total);

  // =======================================================
  // 4. LÓGICA DE PROGRESO DE RANGO (EXP BAR)
  // =======================================================
  const puntosUsuario = datosUsuarioLogueado.total;
  let indexRangoActual = 0;
  
  // Averiguamos el índice del rango en el que está actualmente
  for (let i = rangosAura.length - 1; i >= 0; i--) {
    if (puntosUsuario >= rangosAura[i].limite) {
      indexRangoActual = i;
      break;
    }
  }

  const rangoActualObj = rangosAura[indexRangoActual];
  const rangoSiguienteObj = rangosAura[indexRangoActual + 1] || null;

  let porcentajeProgreso = 100;
  let puntosFaltantes = 0;
  let puntosBaseNivel = rangoActualObj.limite;
  let puntosSiguienteNivel = rangoActualObj.limite;

  if (rangoSiguienteObj) {
    puntosSiguienteNivel = rangoSiguienteObj.limite;
    const puntosObtenidosEnEsteRango = puntosUsuario - puntosBaseNivel;
    const rangoDePuntosNecesarios = puntosSiguienteNivel - puntosBaseNivel;
    
    // Sacamos el porcentaje de la barra
    porcentajeProgreso = Math.min(100, Math.max(0, (puntosObtenidosEnEsteRango / rangoDePuntosNecesarios) * 100));
    puntosFaltantes = puntosSiguienteNivel - puntosUsuario;
  }

  // Manejo de la autenticación contra Supabase
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
      .ilike('usuario', usuarioInput.trim()) 
      .eq('pin', parseInt(pinInput, 10));

    if (dbError) {
      setError('Error al conectar con la base de datos');
      return;
    }

    if (!data || data.length === 0) {
      setError('Usuario o PIN incorrectos');
    } else {
      // NOTA DE SEGURIDAD: Intentamos sacar primero 'nombre_real', si no existe tiramos de 'usuario'
      const nombreMostrar = data[0].nombre_real || data[0].usuario;
      setUsuarioLogueado(nombreMostrar);
      setSesionIniciada(true);
      setSeccionActiva('menu'); // Navega automáticamente al menú al loguearse
    }
  };

  // Cierre de sesión y limpieza de estados locales
  const handleLogout = () => {
    setSesionIniciada(false);
    setUsuarioInput('');
    setPinInput('');
    setUsuarioLogueado('');
  };

  // ==========================================
  // VISTA 1: INTERFAZ DE AUTENTICACIÓN (LOGIN)
  // ==========================================
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

  // ==========================================
  // VISTA 2: NAVEGACIÓN Y PANELES (POST-LOGIN)
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans p-4 pb-12 flex flex-col items-center">
      
      {/* Cabecera dinámica común para toda la App */}
      <header className="text-center my-6 max-w-md w-full relative">
        {seccionActiva === 'menu' ? (
          <button 
            onClick={handleLogout}
            className="absolute left-0 top-0 text-xs text-gray-500 hover:text-gray-300 uppercase tracking-wider transition-colors">
            🔒 Salir
          </button>
        ) : (
          <button 
            onClick={() => setSeccionActiva('menu')}
            className="absolute left-0 top-0 text-xs text-amber-400 hover:text-amber-300 uppercase tracking-wider transition-colors font-bold">
            ⬅️ Menú
          </button>
        )}
        
        <h1 className="text-2xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 uppercase pt-8">
          Alto Tribunal del Aura Supremo
        </h1>
        <p className="text-[10px] text-gray-500 mt-1 tracking-widest uppercase">
          Usuario: {usuarioLogueado}
        </p>
      </header>

      {/* --- PANEL A: MENÚ PRINCIPAL --- */}
      {seccionActiva === 'menu' && (
        <main className="w-full max-w-md space-y-4">
          
          {/* Tarjeta de Bienvenida con Rango calculado al vuelo */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
            <h2 className="text-xl font-bold">¡Qué pasa, {usuarioLogueado}! 👋</h2>
            <p className="text-xs text-gray-400 mt-1">
              Tu rango actual es <span className="text-amber-400 font-semibold">{rangoUsuario} {datosUsuarioLogueado.emoji}</span>
            </p>
          </div>

          {/* Tarjeta del Líder de la clasificación */}
          <div className="bg-gradient-to-r from-amber-500/10 to-yellow-600/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Líder de la semana</span>
              <h3 className="text-lg font-black mt-0.5">{liderActual.nombre} {liderActual.emoji}</h3>
              <p className="text-[10px] text-yellow-200/70 uppercase tracking-wider font-bold">{rangoLider}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold block text-gray-400">Aura Total</span>
              <span className="text-lg font-black text-amber-400">{liderActual.total} pts</span>
            </div>
          </div>

          {/* Grid de navegación (2 columnas estéticas) */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button 
              onClick={() => setSeccionActiva('ranking')}
              className="flex flex-col items-center justify-center bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-amber-500/50 p-6 rounded-2xl transition-all hover:scale-[1.02] group"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📊</span>
              <span className="text-sm font-bold">Ranking</span>
              <span className="text-[10px] text-gray-500 uppercase mt-1">Clasificación</span>
            </button>

            <button 
              onClick={() => setSeccionActiva('perfil')}
              className="flex flex-col items-center justify-center bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-amber-500/50 p-6 rounded-2xl transition-all hover:scale-[1.02] group"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">👤</span>
              <span className="text-sm font-bold">Mi Perfil</span>
              <span className="text-[10px] text-gray-500 uppercase mt-1">Mis datos</span>
            </button>
          </div>
        </main>
      )}

      {/* --- PANEL B: CLASIFICACIÓN GENERAL (RANKING) --- */}
      {seccionActiva === 'ranking' && (
        <main className="w-full max-w-md space-y-2.5">
          <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-2">Clasificación General</h3>
          
          {rankingOficial.map((j) => {
            const rangoJugador = obtenerRango(j.total);
            const esUsuarioActual = j.nombre.toLowerCase() === usuarioLogueado?.toLowerCase();
            
            return (
              <div 
                key={j.nombre} 
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  esUsuarioActual 
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5' 
                    : 'bg-gray-900/50 border-gray-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-base font-black w-6 text-center ${j.color}`}>
                    {j.top}
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-100 flex items-center gap-1.5">
                      {j.nombre} <span className="text-sm">{j.emoji}</span>
                      {esUsuarioActual && (
                        <span className="text-[9px] bg-amber-400 text-black font-extrabold px-1.5 py-0.5 rounded-full uppercase">Tú</span>
                      )}
                    </h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{rangoJugador}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-green-400 block font-semibold">+{j.actual} Semanal</span>
                  <span className="text-xs font-bold text-gray-400">{j.total} pts</span>
                </div>
              </div>
            );
          })}
        </main>
      )}

      {/* --- PANEL C: PERFIL DE USUARIO --- */}
      {seccionActiva === 'perfil' && (
        <main className="w-full max-w-md space-y-4">
          
          {/* Ficha técnica del perfil */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
            <div className="text-6xl mb-3">{datosUsuarioLogueado.emoji}</div>
            <h2 className="text-2xl font-black">{usuarioLogueado}</h2>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-widest mt-1">
              {rangoUsuario}
            </p>

            <hr className="border-gray-800 my-5" />

            {/* Cuadrícula de estadísticas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/50">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Puesto</span>
                <span className="text-lg font-black text-amber-400">#{datosUsuarioLogueado.top}</span>
              </div>
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/50">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Semanal</span>
                <span className="text-lg font-black text-green-400">+{datosUsuarioLogueado.actual}</span>
              </div>
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/50">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Total pts</span>
                <span className="text-lg font-black text-gray-100">{datosUsuarioLogueado.total}</span>
              </div>
            </div>

            {/* BARRA DE PROGRESO DE RANGO (ESTILO EXP) */}
            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800/50 text-left space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <span>Progreso de Rango</span>
                <span className="text-amber-400 font-mono">
                  {puntosUsuario} / {rangoSiguienteObj ? puntosSiguienteNivel : 'MAX'} pts
                </span>
              </div>

              {/* Contenedor de la barra de progreso */}
              <div className="w-full bg-gray-900 border border-gray-800 h-3 rounded-full overflow-hidden relative">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                  style={{ width: `${porcentajeProgreso}%` }}
                />
              </div>

              {/* Info de EXP restante */}
              <div className="flex justify-between items-center text-[10px] text-gray-500">
                <span>Nivel: {rangoActualObj.nombre}</span>
                {rangoSiguienteObj ? (
                  <span className="text-yellow-200/80">
                    Faltan <strong className="text-amber-400 font-mono font-bold">{puntosFaltantes}</strong> pts para <strong className="text-gray-200">{rangoSiguienteObj.nombre}</strong>
                  </span>
                ) : (
                  <span className="text-yellow-400 font-bold">🏆 ¡MÁXIMO RANGO ALCANZADO!</span>
                )}
              </div>
            </div>

          </div>

          {/* Gamificación: Muestra los próximos 3 hitos de rango por alcanzar */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 text-sm text-gray-400">
            <h4 className="text-gray-200 font-bold mb-2">📈 Próximos Rangos:</h4>
            <div className="space-y-1.5 text-xs">
              {rangosAura
                .filter(r => r.limite > datosUsuarioLogueado.total)
                .slice(0, 3)
                .map(r => (
                  <div key={r.nombre} className="flex justify-between">
                    <span>{r.nombre}</span>
                    <span className="text-amber-400/80 font-semibold">a los {r.limite} pts</span>
                  </div>
                ))}
              {rangosAura.filter(r => r.limite > datosUsuarioLogueado.total).length === 0 && (
                <p className="text-xs text-yellow-200 font-bold text-center py-2">
                  🏆 ¡Has alcanzado la cima del Aura! Eres un Dios del Tribunal.
                </p>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}