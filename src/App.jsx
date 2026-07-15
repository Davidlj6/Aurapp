import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// ==========================================
// 1. CONFIGURACIÓN DEL LORE Y NIVELES DE AURA (CON EMOJIS)
// ==========================================
const rangosAura = [
  { limite: 0, nombre: "Vicen", emoji: "🪵" },
  { limite: 100, nombre: "Kuki", emoji: "🐣" },
  { limite: 250, nombre: "Calzoncillovic", emoji: "🩲" },
  { limite: 450, nombre: "Pascual", emoji: "🥚" },
  { limite: 700, font: "Guarriple", emoji: "🐷" },
  { limite: 1000, nombre: "Menchu", emoji: "👵" },
  { limite: 1350, nombre: "Buscapesetas", emoji: "🪙" },
  { limite: 1750, nombre: "Vidapadremanzano", emoji: "🍏" },
  { limite: 2200, nombre: "Alfonshow", emoji: "🎪" },
  { limite: 2700, nombre: "Makapeta", emoji: "🚬" },
  { limite: 3250, nombre: "Maleta", emoji: "🧳" },
  { limite: 3850, nombre: "Pedro Chupador", emoji: "🍭" },
  { limite: 4500, nombre: "Black Nails", emoji: "💅" },
  { limite: 5200, nombre: "La Pou", emoji: "💩" },
  { limite: 6000, nombre: "Vareta", emoji: "🥢" },
  { limite: 6850, nombre: "Pepeleche", emoji: "🥛" },
  { limite: 7750, nombre: "Samu perreador nato", emoji: "🍑" },
  { limite: 8700, nombre: "Maxirre", emoji: "⚡" },
  { limite: 9700, nombre: "Vilches", emoji: "👔" },
  { limite: 10800, nombre: "Petete", emoji: "📖" },
  { limite: 12000, nombre: "Only1Egg", emoji: "🍳" },
  { limite: 13300, nombre: "Case y Ceos", emoji: "💼" },
  { limite: 14700, nombre: "El Polaco", emoji: "🇵🇱" },
  { limite: 16200, nombre: "El Chache", emoji: "🧔" },
  { limite: 17800, nombre: "Dani Manzano", emoji: "🍎" },
  { limite: 19500, nombre: "Oh Felipe", emoji: "🤴" },
  { limite: 21300, nombre: "Feliciano", emoji: "😁" },
  { limite: 23200, nombre: "Brocheja Jefecito", emoji: "🤵" },
  { limite: 25200, nombre: "Luisal", emoji: "🕶️" },
  { limite: 27300, nombre: "Farola", emoji: "💡" },
  { limite: 29500, nombre: "El negro y la negra", emoji: "☯️" },
  { limite: 31800, nombre: "Luisma", emoji: "🍺" },
  { limite: 34200, nombre: "Brosjaca", emoji: "💪" },
  { limite: 36700, nombre: "Fael", emoji: "🧙" },
  { limite: 39300, nombre: "Gordito del Chan", emoji: "🥡" },
  { limite: 42000, nombre: "Pipirrana", emoji: "🥗" },
  { limite: 44800, nombre: "Picula", emoji: "🃏" },
  { limite: 47700, nombre: "Pacogym", emoji: "🏋️‍♂️" },
  { limite: 50700, nombre: "Ali", emoji: "🦋" },
  { limite: 53800, nombre: "Chan", emoji: "🍜" },
  { limite: 57000, nombre: "Juli", emoji: "🔥" },
  { limite: 60300, nombre: "Pichi", emoji: "👑" }
];

// Función Helper para obtener el nombre y el emoji correspondiente según los puntos totales
function obtenerRango(puntos) {
  for (let i = rangosAura.length - 1; i >= 0; i--) {
    if (puntos >= rangosAura[i].limite) {
      return {
        nombre: rangosAura[i].nombre,
        emoji: rangosAura[i].emoji || "🪵"
      };
    }
  }
  return { nombre: "Vicen", emoji: "🪵" };
}

// Helper para asignar color del Top en el Ranking dinámicamente.
// El puesto 12 se pinta exactamente en ROJO chillón.
function obtenerColorTop(posicion) {
  if (posicion === 1) return "text-amber-400 font-black"; // Oro
  if (posicion === 2) return "text-slate-300 font-bold"; // Plata
  if (posicion === 3) return "text-amber-600 font-bold"; // Bronce
  if (posicion === 12) return "text-red-500 font-extrabold"; // El número 12 exactamente en rojo
  return "text-gray-500";
}

// ==========================================
// 2. COMPONENTE PRINCIPAL
// ==========================================
export default function App() {
  const [sesionIniciada, setSesionIniciada] = useState(false);
  const [usuarioInput, setUsuarioInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [usuarioLogueado, setUsuarioLogueado] = useState(''); 
  const [nombreMostrar, setNombreMostrar] = useState(''); 
  
  // Lista de usuarios sincronizada con tu DB de Supabase
  const [rankingOficial, setRankingOficial] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  // Estado de navegación activa: 'menu', 'ranking' o 'perfil'
  const [seccionActiva, setSeccionActiva] = useState('menu');

  // 1. Efecto para descargar datos de Supabase en tiempo real
  const obtenerDatosSupabase = async () => {
    try {
      setCargandoDatos(true);
      const { data, error: dbError } = await supabase
        .from('usuarios')
        .select('*')
        .order('puntos_totales', { ascending: false });

      if (dbError) throw dbError;

      const rankingMapeado = (data || []).map((user, index) => {
        const totalPuntos = user.puntos_totales ?? 0;
        const rangoCalculado = obtenerRango(totalPuntos);

        return {
          top: index + 1,
          nombre: user.usuario, 
          usuarioKey: user.usuario, 
          actual: user.puntos_semanales ?? 0, 
          total: totalPuntos,               
          emoji: rangoCalculado.emoji,      
          color: obtenerColorTop(index + 1) // El puesto 12 saldrá rojo automáticamente
        };
      });

      setRankingOficial(rankingMapeado);
    } catch (err) {
      console.error("Error cargando ranking de Supabase:", err);
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    obtenerDatosSupabase();
  }, []);

  // Manejo de la autenticación contra Supabase
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (pinInput.length !== 4 || isNaN(pinInput)) {
      setError('El PIN debe ser de 4 números');
      return;
    }

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
      const u = data[0];
      setUsuarioLogueado(u.usuario); 
      setNombreMostrar(u.usuario);
      setSesionIniciada(true);
      setSeccionActiva('menu'); 
      
      obtenerDatosSupabase();
    }
  };

  const handleLogout = () => {
    setSesionIniciada(false);
    setUsuarioInput('');
    setPinInput('');
    setUsuarioLogueado('');
    setNombreMostrar('');
  };

  // =======================================================
  // 3. CÁLCULO DE LÍDER Y ESTADÍSTICAS DEL USUARIO LOGUEADO
  // =======================================================
  const liderActual = rankingOficial.length > 0 
    ? rankingOficial[0] 
    : { nombre: "Cargando...", total: 0, emoji: "👑", color: "text-amber-400" };

  const datosUsuarioLogueado = rankingOficial.find(
    jugador => jugador.usuarioKey?.toLowerCase() === usuarioLogueado?.toLowerCase()
  ) || { top: '?', actual: 0, total: 0, emoji: "🪵" };

  const rangoLiderObj = obtenerRango(liderActual.total);
  const rangoUsuarioObj = obtenerRango(datosUsuarioLogueado.total);

  // =======================================================
  // 4. LÓGICA DE PROGRESO DE RANGO (BARRA DE EXPERIENCIA)
  // =======================================================
  const puntosUsuario = datosUsuarioLogueado.total;
  let indexRangoActual = 0;
  
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
    
    porcentajeProgreso = Math.min(100, Math.max(0, (puntosObtenidosEnEsteRango / rangoDePuntosNecesarios) * 100));
    puntosFaltantes = puntosSiguienteNivel - puntosUsuario;
  }

  // ==========================================
  // VISTA A: INTERFAZ DE AUTENTICACIÓN (LOGIN)
  // ==========================================
  if (!sesionIniciada) {
    return (
      <div className="min-h-screen bg-gray-950 text-white font-sans p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative">
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

          {/* Sello de Copyright */}
          <footer className="mt-8 pt-4 border-t border-gray-800/80 text-center">
            <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-wider">
              Creado por <span className="text-gray-400 font-semibold">David López</span> & <span className="text-gray-400 font-semibold">José Ramón Serrano</span>
            </p>
            <p className="text-[9px] text-gray-600 mt-1">
              2026 ©
            </p>
          </footer>
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA B: NAVEGACIÓN Y PANELES (POST-LOGIN)
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans p-4 pb-12 flex flex-col items-center">
      
      {/* Cabecera dinámica común */}
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
          Usuario: {nombreMostrar}
        </p>
      </header>

      {cargandoDatos ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-t-amber-400 border-gray-800 rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 mt-3 uppercase tracking-widest">Consultando el aura...</p>
        </div>
      ) : (
        <>
          {/* --- PANEL 1: MENÚ PRINCIPAL --- */}
          {seccionActiva === 'menu' && (
            <main className="w-full max-w-md space-y-4 animate-fadeIn">
              
              {/* Tarjeta de Bienvenida con Rango dinámico */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
                <h2 className="text-xl font-bold">¡Qué pasa, {nombreMostrar}! 👋</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Tu rango actual es <span className="text-amber-400 font-semibold">{rangoUsuarioObj.nombre} {rangoUsuarioObj.emoji}</span>
                </p>
              </div>

              {/* Tarjeta del Líder de la clasificación */}
              <div className="bg-gradient-to-r from-amber-500/10 to-yellow-600/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Líder de la semana</span>
                  <h3 className="text-lg font-black mt-0.5">{liderActual.nombre} {liderActual.emoji}</h3>
                  <p className="text-[10px] text-yellow-200/70 uppercase tracking-wider font-bold">{rangoLiderObj.nombre}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold block text-gray-400">Aura Total</span>
                  <span className="text-lg font-black text-amber-400">
                    {liderActual.total} pts
                  </span>
                </div>
              </div>

              {/* Botones de navegación principal */}
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

          {/* --- PANEL 2: CLASIFICACIÓN GENERAL (RANKING) --- */}
          {seccionActiva === 'ranking' && (
            <main className="w-full max-w-md space-y-2.5 animate-fadeIn">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase">Clasificación General</h3>
                <button 
                  onClick={obtenerDatosSupabase} 
                  className="text-[10px] text-amber-400 uppercase tracking-widest font-semibold hover:text-amber-300"
                >
                  🔄 Actualizar
                </button>
              </div>
              
              {rankingOficial.map((j) => {
                const rangoJugadorObj = obtenerRango(j.total);
                const esUsuarioActual = j.usuarioKey?.toLowerCase() === usuarioLogueado?.toLowerCase();
                const esDolores = j.nombre?.toLowerCase() === 'dolores';
                
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
                      {/* Puesto de clasificación. El 12 sale rojo gracias a obtenerColorTop */}
                      <span className={`text-base font-black w-6 text-center ${j.color}`}>
                        {j.top}
                      </span>
                      <div>
                        <h4 className="font-bold text-gray-100 flex items-center gap-1.5 flex-wrap">
                          {j.nombre} <span className="text-sm">{j.emoji}</span>
                          {esUsuarioActual && (
                            <span className="text-[9px] bg-amber-400 text-black font-extrabold px-1.5 py-0.5 rounded-full uppercase">Tú</span>
                          )}
                          {/* Sello personalizado para Dolores */}
                          {esDolores && (
  <span className="text-[10px] bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-gray-950 font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.3)] border border-yellow-400/30">
    Doña Campanos 🏆
  </span>
)}
                        </h4>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{rangoJugadorObj.nombre}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-green-400 block font-semibold">
                        +{j.actual} Semanal
                      </span>
                      <span className="text-xs font-bold text-gray-400">
                        {j.total} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </main>
          )}

          {/* --- PANEL 3: PERFIL DE USUARIO --- */}
          {seccionActiva === 'perfil' && (
            <main className="w-full max-w-md space-y-4 animate-fadeIn">
              
              {/* Tarjeta de Perfil */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
                <div className="text-6xl mb-3">{rangoUsuarioObj.emoji}</div>
                <h2 className="text-2xl font-black">{nombreMostrar}</h2>
                <p className="text-xs text-amber-400 font-bold uppercase tracking-widest mt-1">
                  {rangoUsuarioObj.nombre}
                </p>

                <hr className="border-gray-800 my-5" />

                {/* Grid de Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/50">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Puesto</span>
                    <span className={`text-lg font-black ${datosUsuarioLogueado.top === 12 ? 'text-red-500' : 'text-amber-400'}`}>
                      #{datosUsuarioLogueado.top}
                    </span>
                  </div>
                  <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/50">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Semanal</span>
                    <span className="text-lg font-black text-green-400">
                      +{datosUsuarioLogueado.actual}
                    </span>
                  </div>
                  <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/50">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Total pts</span>
                    <span className="text-lg font-black text-gray-100">
                      {datosUsuarioLogueado.total}
                    </span>
                  </div>
                </div>

                {/* BARRA DE PROGRESO DE RANGO */}
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800/50 text-left space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    <span>Progreso de Rango</span>
                    <span className="text-amber-400">
                      {puntosUsuario} / {rangoSiguienteObj ? puntosSiguienteNivel : 'MAX'} pts
                    </span>
                  </div>

                  {/* Progreso visual */}
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
                        Faltan <strong className="text-amber-400 font-bold">{puntosFaltantes}</strong> pts para <strong className="text-gray-200">{rangoSiguienteObj.nombre}</strong>
                      </span>
                    ) : (
                      <span className="text-yellow-400 font-bold">🏆 ¡MÁXIMO RANGO ALCANZADO!</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Hitos a alcanzar */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 text-sm text-gray-400">
                <h4 className="text-gray-200 font-bold mb-2">📈 Próximos Rangos:</h4>
                <div className="space-y-1.5 text-xs">
                  {rangosAura
                    .filter(r => r.limite > datosUsuarioLogueado.total)
                    .slice(0, 3)
                    .map(r => (
                      <div key={r.nombre} className="flex justify-between">
                        <span className="flex gap-1.5">{r.emoji} {r.nombre}</span>
                        <span className="text-amber-400/80 font-semibold">
                          a los {r.limite} pts
                        </span>
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
        </>
      )}
    </div>
  );
}