import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// ==========================================
// CONFIGURACIÓN DE COLORES DEL TOP
// ==========================================
function obtenerColorTop(posicion) {
  if (posicion === 1) return "text-amber-400 font-black"; 
  if (posicion === 2) return "text-slate-300 font-bold"; 
  if (posicion === 3) return "text-amber-600 font-bold"; 
  if (posicion === 12) return "text-red-500 font-extrabold"; 
  return "text-gray-500";
}

function esSemanaActual(fechaString) {
  const hoy = new Date();
  const fechaEvaluar = new Date(fechaString);
  
  // Encontrar el lunes de la semana actual
  const diaSemana = hoy.getDay(); // 0 = Domingo, 1 = Lunes...
  const diffLunes = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
  
  const lunesActual = new Date(hoy.setDate(diffLunes));
  lunesActual.setHours(0, 0, 0, 0);
  
  const domingoActual = new Date(lunesActual);
  domingoActual.setDate(lunesActual.getDate() + 6);
  domingoActual.setHours(23, 59, 59, 999);
  
  return fechaEvaluar >= lunesActual && fechaEvaluar <= domingoActual;
}

export default function App() {
  const [sesionIniciada, setSesionIniciada] = useState(false);
  const [usuarioInput, setUsuarioInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [usuarioLogueado, setUsuarioLogueado] = useState(null); 
  const [nombreMostrar, setNombreMostrar] = useState(''); 

  const [rankingOficial, setRankingOficial] = useState([]);
  const [listaTiposFiesta, setListaTiposFiesta] = useState([]); 
  const [listaRangos, setListaRangos] = useState([]); // <-- NUEVO ESTADO PARA LOS RANGOS DE LA DB
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState('menu');

  // ==========================================
  // ESTADO DEL FORMULARIO DE FIESTA
  // ==========================================
  const [fechaFiesta, setFechaFiesta] = useState(new Date().toISOString().split('T')[0]);
  const [tipoFiesta, setTipoFiesta] = useState(''); 
  const [horasFiesta, setHorasFiesta] = useState(0);
  const [cubatas, setCubatas] = useState(0);
  const [cervezas, setCervezas] = useState(0);
  const [chupitos, setChupitos] = useState(0);
  const [aguas, setAguas] = useState(0);
  const [refrescos, setRefrescos] = useState(0);
  
  const [conductor, setConductor] = useState(false);
  const [soploControl, setSoploControl] = useState(false);
  const [vioSol, setVioSol] = useState(false);
  const [trabajoManana, setTrabajoManana] = useState(false);
  const [teCagabas, setTeCagabas] = useState(false);
  const [almuerzo, setAlmuerzo] = useState(false);
  const [empalme, setEmpalme] = useState(false);
  const [invitoPris, setInvitoPris] = useState(false);
  const [vomito, setVomito] = useState(false);
  const [kiko, setKiko] = useState(false);
  const [campano, setCampano] = useState(false);
  const [eventoEpico, setEventoEpico] = useState('');

  const [mensajeFormulario, setMensajeFormulario] = useState({ texto: '', tipo: '' });
  const [enviandoFormulario, setEnviandoFormulario] = useState(false);

  // ==========================================
  // LÓGICA DINÁMICA DE RANGOS DESDE EL ESTADO
  // ==========================================
  const obtenerRango = (puntos, rangosDisponibles = listaRangos) => {
    if (!rangosDisponibles || rangosDisponibles.length === 0) {
      return { nombre: "Cargando...", emoji: "🪵" };
    }
    // Buscamos de mayor a menor límite cuál se ajusta
    for (let i = rangosDisponibles.length - 1; i >= 0; i--) {
      if (puntos >= rangosDisponibles[i].limite) {
        return { nombre: rangosDisponibles[i].nombre, emoji: rangosDisponibles[i].emoji || "🪵" };
      }
    }
    return { nombre: rangosDisponibles[0].nombre, emoji: rangosDisponibles[0].emoji || "🪵" };
  };

  // Inicialización de datos colectivos
  const inicializarDatos = async () => {
    try {
      setCargandoDatos(true);
      
      // 1. Cargar Rangos desde la Base de Datos (Ordenados por límite ascendente)
      const { data: rangosData, error: rangosError } = await supabase
        .from('rangos_aura')
        .select('*')
        .order('limite', { ascending: true });

      if (rangosError) throw rangosError;
      setListaRangos(rangosData || []);
      
      // 2. Cargar Ranking de Usuarios
      const { data: usersData, error: dbError } = await supabase
        .from('usuarios')
        .select('*')
        .order('puntos_totales', { ascending: false });

      if (dbError) throw dbError;

      // Pasamos rangosData directamente para asegurar que calcule con los datos frescos de esta query
      const rankingMapeado = (usersData || []).map((user, index) => {
        const totalPuntos = user.puntos_totales ?? 0;
        const rangoCalculado = obtenerRango(totalPuntos, rangosData || []);
        return {
          top: index + 1,
          id: user.id, 
          nombre: user.usuario, 
          usuarioKey: user.usuario, 
          actual: user.puntos_semanales ?? 0, 
          total: totalPuntos,              
          emoji: rangoCalculado.emoji,      
          color: obtenerColorTop(index + 1) 
        };
      });
      setRankingOficial(rankingMapeado);

      // 3. Cargar Tipos de Fiesta desde la tabla
      const { data: fiestaData, error: fiestaError } = await supabase
        .from('tipos_fiesta')
        .select('*')
        .order('id', { ascending: true });

      if (fiestaError) throw fiestaError;

      setListaTiposFiesta(fiestaData || []);
      if (fiestaData && fiestaData.length > 0) {
        setTipoFiesta(fiestaData[0].id.toString()); 
      }

    } catch (err) {
      console.error("Error cargando base de datos de Supabase:", err);
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    inicializarDatos();
  }, []);

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
      setUsuarioLogueado(parseInt(u.id, 10)); 
      setNombreMostrar(u.usuario); 
      setSesionIniciada(true);
      setSeccionActiva('menu'); 
      inicializarDatos();
    }
  };

  const calcularPuntosFormulario = () => {
    let pts = 0;
    let fiestaSeleccionada = listaTiposFiesta.find(f => Number(f.id) === Number(tipoFiesta));
    if (!fiestaSeleccionada && tipoFiesta) {
      fiestaSeleccionada = listaTiposFiesta.find(f => f.nombre?.trim().toLowerCase() === tipoFiesta.toString().trim().toLowerCase());
    }

    if (fiestaSeleccionada) {
      pts += fiestaSeleccionada.valor_aura;
    }

    pts += cubatas * 25;
    pts += cervezas * 15;
    pts += chupitos * 20;
    pts -= aguas * 5;
    pts += refrescos * 5;

    // === NUEVA LÓGICA DE HORAS DE FIESTA (Copiada del FILTER de Excel) ===
    const horas = Number(horasFiesta) || 0;
    if (horas === 0) {
      pts -= 50; // Si es 0 -> -50 pts
    } else if (horas <= 3) {
      pts += 0;  // Si es <= que 3 -> 0 pts
    } else {
      pts += 10 + (horas - 3) * 10; // Si es >= 3 -> 10 de aura por hora 
    }
    // ===================================================================

    if (conductor) pts += 40;     
    if (soploControl) pts += 100; 
    if (vioSol) pts += 50;        
    if (trabajoManana) pts += 150; 
    if (teCagabas) pts -= 30;     
    if (almuerzo) pts += 30;      
    if (empalme) pts += 200;      
    if (invitoPris) pts += 60;    
    if (vomito) pts -= 50;        
    if (kiko) pts += 80;          
    if (campano) pts += 120;      

    return pts;
  };

  const handleEnviarHistorial = async (e) => {
    e.preventDefault();
    setMensajeFormulario({ texto: '', tipo: '' });
    setEnviandoFormulario(true);

    let idUsuarioNumerico = parseInt(usuarioLogueado, 10);
    if (isNaN(idUsuarioNumerico)) {
      const uEncontrado = rankingOficial.find(r => r.nombre?.toLowerCase() === nombreMostrar?.toLowerCase());
      if (uEncontrado) {
        idUsuarioNumerico = parseInt(uEncontrado.id, 10);
      }
    }

    try {
      // 1. VALIDACIÓN: Verificar si ya declaró fiesta en esta fecha
      const { data: registroExistente, error: checkError } = await supabase
        .from('historial_formularios')
        .select('id')
        .eq('usuario', idUsuarioNumerico)
        .eq('fecha', fechaFiesta);

      if (checkError) throw checkError;

      if (registroExistente && registroExistente.length > 0) {
        setMensajeFormulario({
          texto: `⚠️ Ya has registrado un acta de fiesta para el día ${fechaFiesta}. El Tribunal no admite duplicados el mismo día.`,
          tipo: 'error'
        });
        setEnviandoFormulario(false);
        return; 
      }

      const puntosTotalesCalculados = calcularPuntosFormulario();

      let idFiestaNumerico = parseInt(tipoFiesta, 10);
      if (isNaN(idFiestaNumerico)) {
        const fiestaEncontrada = listaTiposFiesta.find(
          f => f.nombre?.trim().toLowerCase() === tipoFiesta?.trim().toLowerCase()
        );
        if (fiestaEncontrada) {
          idFiestaNumerico = parseInt(fiestaEncontrada.id, 10);
        } else {
          idFiestaNumerico = listaTiposFiesta.length > 0 ? parseInt(listaTiposFiesta[0].id, 10) : null;
        }
      }

      // 2. INSERCIÓN: Procedemos con la inserción en el historial
      const { error: insertError } = await supabase
        .from('historial_formularios')
        .insert([{
          usuario: idUsuarioNumerico, 
          fecha: fechaFiesta,
          tipo_fiesta: idFiestaNumerico, 
          horas_fiesta: parseInt(horasFiesta, 10) || 0,
          cubatas: parseInt(cubatas, 10) || 0,
          cervezas: parseInt(cervezas, 10) || 0,
          chupitos: parseInt(chupitos, 10) || 0,
          aguas: parseInt(aguas, 10) || 0,
          refrescos: parseInt(refrescos, 10) || 0,
          conductor,
          soplo_control: soploControl,
          vio_sol: vioSol,
          trabajo_manana: trabajoManana,
          te_cagabas: teCagabas,
          almuerzo,
          empalme,
          invito_pris: invitoPris,
          vomito,
          kiko,
          campano,
          evento_epico: eventoEpico,
          puntos_totales_formulario: puntosTotalesCalculados
        }]);

      if (insertError) throw insertError;

      // 3. ACTUALIZACIÓN DE USUARIOS: Suma condicional según la semana
      const { data: userStats, error: userError } = await supabase
        .from('usuarios')
        .select('puntos_semanales, puntos_totales')
        .eq('id', idUsuarioNumerico)
        .single();

      if (userError) throw userError;

      // Comprobamos si la fiesta pertenece a la semana en curso
      const perteneceAEstaSemana = esSemanaActual(fechaFiesta);

      // Si es vieja, mantenemos sus puntos semanales intactos. Si es actual, sumamos.
      const nuevosSemanales = perteneceAEstaSemana 
        ? (userStats.puntos_semanales || 0) + puntosTotalesCalculados
        : (userStats.puntos_semanales || 0);

      const nuevosTotales = (userStats.puntos_totales || 0) + puntosTotalesCalculados;

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ 
          puntos_semanales: nuevosSemanales, 
          puntos_totales: nuevosTotales 
        })
        .eq('id', idUsuarioNumerico);

      if (updateError) throw updateError;

      // 4. ÉXITO Y RESETEO DEL FORMULARIO
      setMensajeFormulario({
        texto: perteneceAEstaSemana
          ? `¡Acta procesada! Has sumado +${puntosTotalesCalculados} puntos de aura al ranking actual.`
          : `¡Acta antigua guardada! +${puntosTotalesCalculados} pts añadidos a tu Historial Total (No afecta a esta semana).`,
        tipo: 'exito'
      });

      setFechaFiesta(new Date().toISOString().split('T')[0]);
      setHorasFiesta(0); setCubatas(0); setCervezas(0); setChupitos(0); setAguas(0); setRefrescos(0);
      setConductor(false); setSoploControl(false); setVioSol(false); setTrabajoManana(false);
      setTeCagabas(false); setAlmuerzo(false); setEmpalme(false); setInvitoPris(false);
      setVomito(false); setKiko(false); setCampano(false); setEventoEpico('');

      await inicializarDatos();

    } catch (err) {
      console.error(err);
      setMensajeFormulario({ 
        texto: `Error al registrar los datos: ${err.message || 'Error de conexión'}`, 
        tipo: 'error' 
      });
    } finally {
      setEnviandoFormulario(false);
    }
  };

  const handleLogout = () => {
    setSesionIniciada(false); setUsuarioInput(''); setPinInput(''); setUsuarioLogueado(null); setNombreMostrar('');
  };

  const liderActual = rankingOficial.length > 0 ? rankingOficial[0] : { nombre: "Cargando...", total: 0, emoji: "👑", color: "text-amber-400" };
  const datosUsuarioLogueado = rankingOficial.find(j => j.usuarioKey?.toLowerCase() === nombreMostrar?.toLowerCase()) || { top: '?', actual: 0, total: 0, emoji: "🪵" };
  const rangoUsuarioObj = obtenerRango(datosUsuarioLogueado.total);

  // ==========================================
  // CÁLCULO DE PROGRESO CON LOS RANGOS DE LA DB
  // ==========================================
  const puntosUsuario = datosUsuarioLogueado.total;
  let indexRangoActual = 0;
  for (let i = listaRangos.length - 1; i >= 0; i--) {
    if (puntosUsuario >= listaRangos[i].limite) { indexRangoActual = i; break; }
  }
  
  const rangoActualObj = listaRangos[indexRangoActual] || { nombre: "Vicen", emoji: "🪵", limite: 0 };
  const rangoSiguienteObj = listaRangos[indexRangoActual + 1] || null;

  let porcentajeProgreso = 100; 
  let puntosFaltantes = 0;
  if (rangoSiguienteObj) {
    porcentajeProgreso = Math.min(100, Math.max(0, ((puntosUsuario - rangoActualObj.limite) / (rangoSiguienteObj.limite - rangoActualObj.limite)) * 100));
    puntosFaltantes = rangoSiguienteObj.limite - puntosUsuario;
  }

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

          <footer className="mt-8 pt-4 border-t border-gray-800/80 text-center">
            <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-wider">
              Creado por <span className="text-gray-400 font-semibold">David López</span> & <span className="text-gray-400 font-semibold">José Ramón Serrano</span>
            </p>
            <p className="text-[9px] text-gray-600 mt-1">2026 ©</p>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans p-4 pb-12 flex flex-col items-center">
      <header className="text-center my-4 max-w-md w-full relative">
        {seccionActiva === 'menu' ? (
          <button onClick={handleLogout} className="absolute left-0 top-0 text-xs text-gray-500 hover:text-gray-300 uppercase tracking-wider">🔒 Salir</button>
        ) : (
          <button onClick={() => { setSeccionActiva('menu'); setMensajeFormulario({ texto: '', tipo: '' }); }} className="absolute left-0 top-0 text-xs text-amber-400 font-bold uppercase tracking-wider">⬅️ Menú</button>
        )}
        <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 uppercase pt-6">Alto Tribunal del Aura</h1>
        <p className="text-[10px] text-gray-500 tracking-widest uppercase">Sesión: {nombreMostrar}</p>
      </header>

      {cargandoDatos ? (
        <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-t-amber-400 border-gray-800 rounded-full animate-spin mx-auto"></div></div>
      ) : (
        <>
          {/* --- MENU PRINCIPAL --- */}
          {seccionActiva === 'menu' && (
            <main className="w-full max-w-md space-y-4">
              
              {/* --- BANNER DORADO: LÍDER ACTUAL --- */}
              {liderActual && (
                <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/10 border-2 border-amber-500 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden">
                  {/* Destello sutil de fondo */}
                  <div className="absolute -right-6 -top-6 text-6xl opacity-10 select-none">👑</div>
                  
                  <div className="flex items-center space-x-3.5">
                    {/* Logo/Emoji del líder con fondo oscuro */}
                    <div className="bg-gray-950/80 border border-amber-500/40 text-3xl w-14 h-14 rounded-xl flex items-center justify-center shadow-md">
                      {liderActual.emoji || '👑'}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 block">Líder de la Clasificación</span>
                      <h3 className="text-base font-black text-gray-100 leading-tight">{liderActual.nombre}</h3>
                    </div>
                  </div>

                  {/* Puntos actuales */}
                  <div className="text-right">
                    <span className="text-xl font-black text-amber-400 block">{liderActual.total}</span>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">Aura Total</span>
                  </div>
                </div>
              )}

              {/* Saludo tradicional */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-left">
                <h2 className="text-lg font-bold">¡Qué pasa, {nombreMostrar}! 👋</h2>
                <p className="text-xs text-gray-400 mt-0.5">Rango actual: <span className="text-amber-400 font-semibold">{rangoUsuarioObj.nombre} {rangoUsuarioObj.emoji}</span></p>
              </div>

              {/* Botones de navegación */}
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => setSeccionActiva('ranking')} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 p-4 rounded-xl flex flex-col items-center justify-center text-center transition-colors">
                  <span className="text-xl mb-1">📊</span>
                  <span className="text-[11px] font-bold text-gray-200">Ranking</span>
                </button>
                <button onClick={() => setSeccionActiva('formulario')} className="bg-gradient-to-b from-amber-500/20 to-gray-900 hover:from-amber-500/30 border border-amber-500/40 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-lg transition-all">
                  <span className="text-xl mb-1">🥂</span>
                  <span className="text-[11px] font-bold text-amber-400">Registrar Aura</span>
                </button>
                <button onClick={() => setSeccionActiva('perfil')} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 p-4 rounded-xl flex flex-col items-center justify-center text-center transition-colors">
                  <span className="text-xl mb-1">👤</span>
                  <span className="text-[11px] font-bold text-gray-200">Mi Perfil</span>
                </button>
              </div>
            </main>
          )}

          {/* --- VISTA: FORMULARIO DE HISTORIAL DE FIESTA --- */}
          {seccionActiva === 'formulario' && (
            <main className="w-full max-w-md space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
                  🥂 Registro de Aura
                </h3>
                <p className="text-[11px] text-gray-400 mb-4">
                  Los puntos base de la fiesta se calculan según los valores oficiales de la base de datos.
                </p>

                <form onSubmit={handleEnviarHistorial} className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Fecha del Evento</label>
                    <input 
                      type="date" 
                      value={fechaFiesta} 
                      onChange={(e) => setFechaFiesta(e.target.value)} 
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-gray-100 focus:border-amber-500 focus:outline-none scheme-dark"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Tipo de Evento / Jornada</label>
                    <select 
                      value={tipoFiesta} 
                      onChange={(e) => setTipoFiesta(e.target.value)} 
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-gray-100 focus:border-amber-500 focus:outline-none"
                    >
                      {listaTiposFiesta.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nombre} (+{f.valor_aura} pts)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">⏱️ Horas de Fiesta</label>
                      <input type="number" min="0" value={horasFiesta} onChange={(e) => setHorasFiesta(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">🥃 Cubatas</label>
                      <input type="number" min="0" value={cubatas} onChange={(e) => setCubatas(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">🍺 Cervezas/Tintos</label>
                      <input type="number" min="0" value={cervezas} onChange={(e) => setCervezas(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">🧪 Chupitos/Vinillos</label>
                      <input type="number" min="0" value={chupitos} onChange={(e) => setChupitos(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">💧 Aguas</label>
                      <input type="number" min="0" value={aguas} onChange={(e) => setAguas(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">🥤 Refrescos</label>
                      <input type="number" min="0" value={refrescos} onChange={(e) => setRefrescos(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2" />
                    </div>
                  </div>

                  <div className="border-t border-gray-800 pt-3 space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Eventos y Sucesos Especiales</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800 cursor-pointer"><input type="checkbox" checked={conductor} onChange={(e) => setConductor(e.target.checked)} /> ¿Conductor? 🚗</label>
                      <label className="flex items-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800 cursor-pointer"><input type="checkbox" checked={soploControl} onChange={(e) => setSoploControl(e.target.checked)} /> ¿Control voinas verdes? 👮</label>
                      <label className="flex items-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800 cursor-pointer"><input type="checkbox" checked={vioSol} onChange={(e) => setVioSol(e.target.checked)} /> ¿Viste salir el sol? ☀️</label>
                      <label className="flex items-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800 cursor-pointer"><input type="checkbox" checked={trabajoManana} onChange={(e) => setTrabajoManana(e.target.checked)} /> ¿Trabajaste al día siguiente?🏢</label>
                      <label className="flex items-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800 cursor-pointer"><input type="checkbox" checked={teCagabas} onChange={(e) => setTeCagabas(e.target.checked)} /> ¿Te cagabas? 💩</label>
                      <label className="flex items-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800 cursor-pointer"><input type="checkbox" checked={almuerzo} onChange={(e) => setAlmuerzo(e.target.checked)} /> ¿Almorzaste? 🥪</label>
                      <label className="flex items-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800 cursor-pointer"><input type="checkbox" checked={empalme} onChange={(e) => setEmpalme(e.target.checked)} /> ¿Fuiste de empalme? ⚡</label>
                      <label className="flex items-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800 cursor-pointer"><input type="checkbox" checked={invitoPris} onChange={(e) => setInvitoPris(e.target.checked)} /> ¿Invitaste a los Pris? 📤</label>
                      <label className="flex items-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800 cursor-pointer"><input type="checkbox" checked={vomito} onChange={(e) => setVomito(e.target.checked)} /> ¿Vomitaste? 🤢</label>
                      <label className="flex items-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800 cursor-pointer"><input type="checkbox" checked={kiko} onChange={(e) => setKiko(e.target.checked)} /> ¿Acabaste igual que un Kiko? 🥴</label>
                      <label className="flex items-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800 cursor-pointer"><input type="checkbox" checked={campano} onChange={(e) => setCampano(e.target.checked)} /> ¿Campano? 🍷</label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Describe un Evento Épico (Opcional)</label>
                    <textarea value={eventoEpico} onChange={(e) => setEventoEpico(e.target.value)} placeholder="¿Pasó algo digno de mención en el tribunal...?" className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2 text-xs h-16 resize-none focus:border-amber-500 focus:outline-none" />
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-center">
                    <span className="text-xs block text-gray-400">Total de Aura Estimado:</span>
                    {(() => {
                      const puntos = calcularPuntosFormulario();
                      let signo = '';
                      if (puntos > 0) signo = '+';
                      // El signo '-' ya lo incluye el propio número si es negativo
                      
                      return (
                        <span className="text-lg font-black text-amber-400">
                          {signo}{puntos} Aura
                        </span>
                      );
                    })()}
                  </div>
                  <button type="submit" disabled={enviandoFormulario} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-800 text-black font-black py-3 rounded-xl transition-all">
                    {enviandoFormulario ? 'Guardando Acta...' : 'Registrar Aura'}
                  </button>

                  {mensajeFormulario.texto && (
                    <p className={`text-xs p-2 rounded-lg border text-center font-medium ${mensajeFormulario.tipo === 'exito' ? 'bg-green-950/20 border-green-900/50 text-green-400' : 'bg-red-950/20 border-red-900/50 text-red-400'}`}>
                      {mensajeFormulario.texto}
                    </p>
                  )}
                </form>
              </div>
            </main>
          )}

          {/* --- PANEL RANKING --- */}
{seccionActiva === 'ranking' && (
  <main className="w-full max-w-md space-y-2">
    <div className="flex justify-between items-center mb-1">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Clasificación</h3>
      <button onClick={inicializarDatos} className="text-[10px] text-amber-400 font-bold uppercase">🔄 Recargar</button>
    </div>
    
    {rankingOficial.map((j) => {
      const rangoJugadorObj = obtenerRango(j.total);
      const esUsuarioActual = j.usuarioKey?.toLowerCase() === nombreMostrar?.toLowerCase();
      const esDolores = j.nombre?.toLowerCase() === 'dolores';
      
      return (
        <div key={j.nombre} className={`flex items-center justify-between p-3 rounded-xl border ${esUsuarioActual ? 'bg-amber-500/10 border-amber-500/40' : 'bg-gray-900/40 border-gray-800/60'}`}>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-black w-5 text-center ${j.color}`}>{j.top}</span>
            <div>
              <h4 className="text-sm font-bold text-gray-100 flex items-center gap-1">
                {j.nombre} <span>{j.emoji}</span>
                {esUsuarioActual && <span className="text-[8px] bg-amber-400 text-black font-bold px-1 rounded">Tú</span>}
                {esDolores && <span className="text-[9px] bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-950 font-black px-1.5 py-0.5 rounded border border-yellow-400/20">Doña Campanos🏆</span>}
              </h4>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest">{rangoJugadorObj.nombre}</p>
            </div>
          </div>
          
          {/* --- ZONA DE PUNTUACIÓN AJUSTADA --- */}
          <div className="text-right">
            <span className="text-sm font-black text-gray-100 block">
              {j.total} pts
            </span>
            <span className="text-[10px] font-bold text-green-400 block tracking-tight">
              +{j.actual} sem.
            </span>
          </div>
        </div>
      );
    })}
  </main>
)}

          {/* --- PANEL PERFIL --- */}
          {seccionActiva === 'perfil' && (
            <main className="w-full max-w-md space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
                <div className="text-5xl mb-2">{rangoUsuarioObj.emoji}</div>
                <h2 className="text-xl font-black">{nombreMostrar}</h2>
                <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">{rangoUsuarioObj.nombre}</p>

                <div className="grid grid-cols-3 gap-3 my-4">
                  <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/60">
                    <span className="text-[9px] text-gray-500 uppercase block font-bold">Top</span>
                    <span className={`text-base font-black ${datosUsuarioLogueado.top === 12 ? 'text-red-500' : 'text-amber-400'}`}>#{datosUsuarioLogueado.top}</span>
                  </div>
                  <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/60">
                    <span className="text-[9px] text-gray-500 uppercase block font-bold">Semana</span>
                    <span className="text-base font-black text-green-400">+{datosUsuarioLogueado.actual}</span>
                  </div>
                  <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/60">
                    <span className="text-[9px] text-gray-500 uppercase block font-bold">Total</span>
                    <span className="text-base font-black text-gray-200">{datosUsuarioLogueado.total}</span>
                  </div>
                </div>

                <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/60 text-left space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase">
                    <span>Progreso de Rango</span>
                    <span className="text-amber-400">{puntosUsuario} / {rangoSiguienteObj ? rangoSiguienteObj.limite : 'MAX'}</span>
                  </div>
                  <div className="w-full bg-gray-900 border border-gray-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full" style={{ width: `${porcentajeProgreso}%` }} />
                  </div>
                  <div className="text-[9px] text-gray-500 flex justify-between">
                    <span>Nivel {rangoActualObj.nombre}</span>
                    {rangoSiguienteObj ? (
                      <span>Faltan <strong className="text-amber-400">{puntosFaltantes}</strong> pts para {rangoSiguienteObj.nombre}</span>
                    ) : (
                      <span className="text-yellow-400">👑 ¡RANGO MÁXIMO!</span>
                    )}
                  </div>
                </div>
              </div>
            </main>
          )}
        </>
      )}
    </div>
  );
}