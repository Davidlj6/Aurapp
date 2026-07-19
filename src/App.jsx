import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { GoogleGenerativeAI } from "@google/generative-ai";

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

const imagenesUsuarios = import.meta.glob('../assets/users/*.png', { eager: true });
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
  const [listaRangos, setListaRangos] = useState([]); 
  const [statsTotales, setStatsTotales] = useState({ cubatas: 0, cervezas: 0, chupitos: 0, aguas: 0, refrescos: 0 }); 
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState('menu');
  const [contadorSeleccionado, setContadorSeleccionado] = useState('cubatas');
  const [datosGrafica, setDatosGrafica] = useState([]);

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

  // 🔮 NUEVOS ESTADOS PARA MANEJAR LA IA DE GEMINI
const [evaluandoIA, setEvaluandoIA] = useState(false);
const [resultadoAuraIA, setResultadoAuraIA] = useState(null);

  // ==========================================
  // LÓGICA DINÁMICA DE RANGOS DESDE EL ESTADO
  // ==========================================
  const obtenerRango = (puntos, rangosDisponibles = listaRangos) => {
    if (!rangosDisponibles || rangosDisponibles.length === 0) {
      return { nombre: "Cargando...", emoji: "🪵" };
    }
    for (let i = rangosDisponibles.length - 1; i >= 0; i--) {
      if (puntos >= rangosDisponibles[i].get) { // Nota: Corregido según tu lógica
        if (puntos >= rangosDisponibles[i].limite) {
          return { nombre: rangosDisponibles[i].nombre, emoji: rangosDisponibles[i].emoji || "🪵" };
        }
      }
    }
    return { nombre: rangosDisponibles[0].nombre, emoji: rangosDisponibles[0].emoji || "🪵" };
  };

  // Inicialización de datos colectivos
  const inicializarDatos = async () => {
    try {
      setCargandoDatos(true);
      
      const { data: rangosData, error: rangosError } = await supabase
        .from('rangos_aura')
        .select('*')
        .order('limite', { ascending: true });

      if (rangosError) throw rangosError;
      setListaRangos(rangosData || []);
      
      const { data: usersData, error: dbError } = await supabase
        .from('usuarios')
        .select('*')
        .order('puntos_totales', { ascending: false });

      if (dbError) throw dbError;

      const rankingMapeado = (usersData || []).map((user, index) => {
        const totalPuntos = user.puntos_totales ?? 0;
        const rangoCalculado = obtenerRango(totalPuntos, rangosData || []);

        return {
          top: index + 1,
          id: user.id, 
          nombre: user.usuario, 
          usuarioKey: user.usuario, 
          avatar: user.usuario 
            ? `https://xngrbiwhdcyyagwvnzvq.supabase.co/storage/v1/object/public/avatars/${user.usuario}.png`
            : 'https://xngrbiwhdcyyagwvnzvq.supabase.co/storage/v1/object/public/avatars/default.png', 
          actual: user.puntos_semanales ?? 0, 
          total: totalPuntos,              
          emoji: rangoCalculado.emoji,      
          color: obtenerColorTop(index + 1) 
        };
      });

      setRankingOficial(rankingMapeado);

      const { data: fiestaData, error: fiestaError } = await supabase
        .from('tipos_fiesta')
        .select('*')
        .order('id', { ascending: true });

      if (fiestaError) throw fiestaError;

      setListaTiposFiesta(fiestaData || []);
      if (fiestaData && fiestaData.length > 0) {
        setTipoFiesta(fiestaData[0].id.toString()); 
      }

      const identificarPorNombre = nombreMostrar && nombreMostrar.trim() !== "";
      
      if (identificarPorNombre) {
        const usuarioActualDb = rankingMapeado.find(j => j.usuarioKey?.toLowerCase() === nombreMostrar?.toLowerCase());
        const idUsuarioReal = usuarioActualDb ? parseInt(usuarioActualDb.id, 10) : parseInt(usuarioLogueado, 10);

        let query = supabase.from('historial_formularios').select('fecha, horas_fiesta, cubatas, cervezas, chupitos, aguas, refrescos');

        if (idUsuarioReal && !isNaN(idUsuarioReal)) {
          query = query.eq('usuario', idUsuarioReal);
        } else {
          query = query.eq('usuario', nombreMostrar);
        }

        const { data: filasHistorial, error: totalesError } = await query;

        if (!totalesError && filasHistorial) {
          const totales = filasHistorial.reduce((acc, fila) => {
            return {
              cubatas: acc.cubatas + (fila.cubatas || 0),
              horas: acc.horas + (fila.horas_fiesta || 0),
              cervezas: acc.cervezas + (fila.cervezas || 0),
              chupitos: acc.chupitos + (fila.chupitos || 0),
              aguas: acc.aguas + (fila.aguas || 0),
              refrescos: acc.refrescos + (fila.refrescos || 0),
            };
          }, { cubatas: 0, horas: 0, cervezas: 0, chupitos: 0, aguas: 0, refrescos: 0 });

          const totalSalidas = filasHistorial.length || 1;
          const medias = {
            cubatas: (totales.cubatas / totalSalidas).toFixed(1),
            cervezas: (totales.cervezas / totalSalidas).toFixed(1),
            chupitos: (totales.chupitos / totalSalidas).toFixed(1),
            aguas: (totales.aguas / totalSalidas).toFixed(1),
            refrescos: (totales.refrescos / totalSalidas).toFixed(1),
            horas: (totales.horas / totalSalidas).toFixed(1),
          };

          setStatsTotales({ ...totales, medias });

          const grafData = filasHistorial.map((fila, index) => {
            const fechaRaw = fila.created_at || fila.fecha;
            const f = fechaRaw ? new Date(fechaRaw) : new Date();
            
            const esFechaValida = !isNaN(f.getTime());
            const fechaFinal = esFechaValida 
              ? f.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
              : `Salida ${index + 1}`;

            return {
              fecha: fechaFinal,
              horas: fila.horas_fiesta || 0,
              cubatas: fila.cubatas || 0,
              cervezas: fila.cervezas || 0,
              chupitos: fila.chupitos || 0,
              aguas: fila.aguas || 0,
              refrescos: fila.refrescos || 0,
            };
          });

          setDatosGrafica(grafData);
        }
      } else {
        console.log("Aún no hay sesión activa de usuario, los totales se cargarán al iniciar sesión.");
      }

    } catch (err) {
      console.error("Error cargando base de datos de Supabase:", err);
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    inicializarDatos();
  }, [nombreMostrar, usuarioLogueado]);

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

  // 🔮 FUNCIÓN INTERNA PARA LLAMAR A LA IA DE GEMINI
const manejarEvaluacionIA = async () => {
  if (!eventoEpico || eventoEpico.trim() === "") {
    alert("¡Escribe algo en el evento épico antes de llamar al Juez!");
    return;
  }

  setEvaluandoIA(true);
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("La clave VITE_GEMINI_API_KEY no está configurada en el .env");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash",
      // ⚡ OBLIGAMOS A GEMINI A RESPONDER EN JSON ESTRICTO
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      Actúa como el Juez Supremo del Aura y la Fiesta. Tu trabajo es evaluar un acontecimiento que ha ocurrido en una noche de fiesta y asignarle "Puntos de Aura".
      
      Reglas de puntuación:
      - Un evento normal, aburrido o dar pena restará puntos: entre -100y -1 puntos.
      - Un evento simpático, divertido o anécdota normal: entre 1 y 30 puntos.
      - Un evento verdaderamente épico, legendario o una locura jodidamente divertida: entre 31 y 100 puntos.

      Analiza el siguiente acontecimiento: "${eventoEpico}"

      Debes devolver un objeto JSON que siga exactamente este esquema:
      {
        "puntos": <número entero>,
        "veredicto": "<frase corta explicativa>"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Al usar responseMimeType, responseText ya es un string JSON limpio sin ```json
    const jsonRes = JSON.parse(responseText);
    
    setResultadoAuraIA({
      veredicto: jsonRes.veredicto || "El juez se ha quedado sin palabras.",
      puntos: typeof jsonRes.puntos === 'number' ? jsonRes.puntos : 0
    });

  } catch (err) {
    console.error("Fallo real en la IA:", err); 
    
    setResultadoAuraIA({ 
      puntos: 10, 
      veredicto: "El Juez de la IA está borracho, te da 10 puntos de confianza." 
    });
  } finally {
    setEvaluandoIA(false);
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

    const horas = Number(horasFiesta) || 0;
    if (horas === 0) {
      pts -= 50; 
    } else if (horas <= 3) {
      pts += 0;  
    } else {
      pts += 10 + (horas - 3) * 10; 
    }

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

    // 🔮 SI LA IA CALCULÓ PUNTOS EXTRA, SE LOS SUMAMOS DIRECTAMENTE AL ACTA
    if (resultadoAuraIA && resultadoAuraIA.puntos) {
      pts += resultadoAuraIA.puntos;
    }

    return pts;
  };

 // FUNCIÓN 1: SOLO PARA LLAMAR A LA IA
const consultarJuezIA = async () => {
  if (!eventoEpico.trim()) return;
  
  setEvaluandoIA(true);
  setMensajeFormulario({ texto: "", tipo: "" });

  try {
    const respuestaIA = await fetch('/api/juez-aura', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evento: eventoEpico })
    });
    
    const datosIA = await respuestaIA.json();
    
    if (datosIA && datosIA.veredicto) {
      setResultadoAuraIA({
        veredicto: datosIA.veredicto,
        puntos: parseInt(datosIA.puntos) || 0
      });
    } else {
      setResultadoAuraIA({ veredicto: "El juez no se pronuncia.", puntos: 0 });
    }
  } catch (error) {
    console.error("Error con la IA:", error);
    setMensajeFormulario({ texto: "❌ El juez IA no responde. Revisa tu servidor.", tipo: "error" });
  } finally {
    setEvaluandoIA(false);
  }
};

// FUNCIÓN 2: EL ENVÍO DE SIEMPRE A SUPABASE (Modificado para sumar todo)
const handleEnviarHistorial = async (e) => {
  e.preventDefault();
  setEnviandoFormulario(true);

  // 1. Calculamos los puntos enteros idénticos a tu lógica
  const puntosBase = parseInt(calcularPuntosFormulario()) || 0; 
  const puntosIA = resultadoAuraIA ? (parseInt(resultadoAuraIA.puntos) || 0) : 0;
  const totalConIA = Math.round(puntosBase + puntosIA);

  // Embalamos el veredicto en el evento épico
  const textoFinal = resultadoAuraIA 
    ? `${eventoEpico.trim()}\n\n[⚖️ JUEZ IA: "${resultadoAuraIA.veredicto}" (${puntosIA >= 0 ? `+${puntosIA}` : puntosIA} pts)]`
    : eventoEpico.trim();

  try {
    // 🔐 VALIDACIÓN DE SESIÓN LOCAL
    if (!usuarioLogueado) {
      throw new Error("No se ha encontrado ninguna sesión de usuario activa.");
    }

    // 📅 RESTRICCIÓN: EVITAR MÁS DE UN REGISTRO EL MISMO DÍA
    const { data: registrosHoy, error: errorCheckDiario } = await supabase
      .from('historial_formularios')
      .select('id')
      .eq('usuario', usuarioLogueado)
      .eq('fecha', fechaFiesta);

    if (errorCheckDiario) throw errorCheckDiario;

    if (registrosHoy && registrosHoy.length > 0) {
      throw new Error(`Ya has registrado tu actividad para el día ${fechaFiesta}. ¡Solo se permite un registro por día!`);
    }

    // 📜 HELPER: Función interna para calcular la semana ISO de cualquier fecha
    const obtenerSemanaISO = (fechaStr) => {
      const d = new Date(fechaStr);
      d.setDate(d.getDate() + 4 - (d.getDay() || 7));
      const start = new Date(d.getFullYear(), 0, 1);
      const numSemana = Math.ceil((((d - start) / 86400000) + 1) / 7);
      return { semana: numSemana, anio: d.getFullYear() };
    };

    // Calculamos la semana del formulario y la de hoy para comparar
    const infoSemanaFormulario = obtenerSemanaISO(fechaFiesta);
    const infoSemanaHoy = obtenerSemanaISO(new Date());

    // ¿La fecha del formulario pertenece a la semana actual?
    const esEstaSemana = infoSemanaFormulario.semana === infoSemanaHoy.semana && 
                         infoSemanaFormulario.anio === infoSemanaHoy.anio;

    // 🚀 PASO 1: INSERTAR EN EL HISTORIAL
    const { error: errorInsert } = await supabase
      .from('historial_formularios') 
      .insert([
        {
          usuario: usuarioLogueado,
          fecha: fechaFiesta,
          tipo_fiesta: tipoFiesta,
          horas_fiesta: parseInt(horasFiesta) || 0,
          cubatas: parseInt(cubatas) || 0,
          cervezas: parseInt(cervezas) || 0,
          chupitos: parseInt(chupitos) || 0,
          aguas: parseInt(aguas) || 0,
          refrescos: parseInt(refrescos) || 0,
          conductor: !!conductor, 
          soplo_control: !!soploControl,
          vio_sol: !!vioSol,
          trabajo_manana: !!trabajoManana,
          te_cagabas: !!teCagabas,
          almuerzo: !!almuerzo,
          empalme: !!empalme,
          invito_pris: !!invitoPris,
          vomito: !!vomito,
          kiko: !!kiko,
          campano: !!campano,
          evento_epico: textoFinal || null, 
          puntos_totales_formulario: totalConIA 
        }
      ]);

    if (errorInsert) throw errorInsert;

    // 🏆 PASO 2: OBTENER LOS PUNTOS ACTUALES DEL USUARIO
    const { data: usuarioData, error: errorUsuario } = await supabase
      .from('usuarios')
      .select('puntos_totales, puntos_semanales')
      .eq('id', usuarioLogueado)
      .single();

    if (errorUsuario) throw errorUsuario;

    const totalesActuales = parseInt(usuarioData.puntos_totales) || 0;
    const semanalesActuales = parseInt(usuarioData.puntos_semanales) || 0;

    // Preparamos el objeto con los datos que vamos a actualizar
    const camposAActualizar = {
      puntos_totales: totalesActuales + totalConIA
    };

    if (esEstaSemana) {
      camposAActualizar.puntos_semanales = semanalesActuales + totalConIA;
    }

    // 📈 PASO 3: ACTUALIZAR TABLA USUARIOS
    const { error: errorUpdatePuntos } = await supabase
      .from('usuarios')
      .update(camposAActualizar)
      .eq('id', usuarioLogueado);

    if (errorUpdatePuntos) throw errorUpdatePuntos;

    // Todo ha salido perfecto
    setMensajeFormulario({ 
      texto: esEstaSemana
        ? `⚡ ¡Registrado! Se han sumado ${totalConIA} puntos a tu marcador semanal y total.`
        : `⚡ ¡Registrado! Se han sumado ${totalConIA} puntos a tu marcador total (fecha de otra semana).`, 
      tipo: "exito" 
    });
    
    // 🧹 RESETEO COMPLETO DEL FORMULARIO TRAS EL ÉXITO
    setTimeout(() => {
      // Inputs principales
      setFechaFiesta(new Date().toISOString().split('T')[0]);
      if (listaTiposFiesta.length > 0) setTipoFiesta(listaTiposFiesta[0].id.toString());
      setHorasFiesta(0);
      
      // Contadores de bebidas
      setCubatas(0);
      setCervezas(0);
      setChupitos(0);
      setAguas(0);
      setRefrescos(0);
      
      // Checkboxes / Booleanos
      setConductor(false);
      setSoploControl(false);
      setVioSol(false);
      setTrabajoManana(false);
      setTeCagabas(false);
      setAlmuerzo(false);
      setEmpalme(false);
      setInvitoPris(false);
      setVomito(false);
      setKiko(false);
      setCampano(false);
      
      // IA y Texto
      setEventoEpico("");
      setResultadoAuraIA(null);
      setMensajeFormulario({ texto: '', tipo: '' }); // Limpia el banner verde de éxito
    }, 2000);

  } catch (err) {
    console.error("Error en el proceso:", err);
    const mensajeError = err.message || "Error al procesar los puntos en el servidor.";
    setMensajeFormulario({ texto: `❌ ${mensajeError}`, tipo: "error" });
  } finally {
    setEnviandoFormulario(false);
  }
};

  const handleLogout = () => {
    setSesionIniciada(false); setUsuarioInput(''); setPinInput(''); setUsuarioLogueado(null); setNombreMostrar('');
    setResultadoAuraIA(null); // 🔮 Resetear también al desloguear
  };

  const liderActual = rankingOficial.length > 0 
  ? rankingOficial[0] 
  : { nombre: "Cargando...", total: 0, avatar: null, emoji: "👑", color: "text-amber-400" };
  const datosUsuarioLogueado = rankingOficial.find(j => j.usuarioKey?.toLowerCase() === nombreMostrar?.toLowerCase()) || { top: '?', actual: 0, total: 0, emoji: "🪵" };
  const rangoUsuarioObj = obtenerRango(datosUsuarioLogueado.total);

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
          {/* Contenedor con la corona fija de siempre */}
          <div className="bg-gray-950/80 border border-amber-500/40 text-3xl w-14 h-14 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-2xl animate-pulse">👑</span>
          </div>
          
          {/* Datos del Líder */}
          <div>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Líder del Aura</p>
            <h2 className="text-base font-black text-white leading-tight">{liderActual.nombre}</h2>
          </div>
        </div>

        {/* Puntos del Líder */}
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total</p>
          <p className="text-lg font-black text-amber-400">{liderActual.total} pts</p>
        </div>
      </div>
    )}

   {/* Saludo tradicional con Avatar del Usuario Actual */}
<div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center space-x-3.5 text-left">
  {/* Contenedor del Avatar (Fondo Transparente) */}
  <div className="bg-transparent text-3xl w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
    {nombreMostrar && nombreMostrar.trim() !== "" ? (
      <img 
        src={`https://xngrbiwhdcyyagwvnzvq.supabase.co/storage/v1/object/public/avatars/${nombreMostrar}.png`} 
        alt={`Avatar de ${nombreMostrar}`} 
        className="w-full h-full rounded-xl object-cover"
        onError={(e) => {
          // Si no encuentra la foto, usa la por defecto
          e.target.src = 'https://xngrbiwhdcyyagwvnzvq.supabase.co/storage/v1/object/public/avatars/default.png';
        }}
      />
    ) : (
      <span className="text-2xl animate-pulse">👤</span>
    )}
  </div>

  {/* Datos de Bienvenida */}
  <div>
    <h2 className="text-lg font-bold leading-tight">¡Qué pasa, {nombreMostrar}! 👋</h2>
    <p className="text-xs text-gray-400 mt-0.5">
      Rango actual: <span className="text-amber-400 font-semibold">{rangoUsuarioObj?.nombre} {rangoUsuarioObj?.emoji}</span>
    </p>
  </div>
</div>

    {/* Botones de navegación */}
    <div className="grid grid-cols-3 gap-3">
      <button 
        onClick={() => setSeccionActiva('ranking')} 
        className="bg-gray-900 hover:bg-gray-800 border border-gray-800 p-4 rounded-xl flex flex-col items-center justify-center text-center transition-colors"
      >
        <span className="text-xl mb-1">📊</span>
        <span className="text-[11px] font-bold text-gray-200">Ranking</span>
      </button>
      
      <button 
        onClick={() => setSeccionActiva('formulario')} 
        className="bg-gradient-to-b from-amber-500/20 to-gray-900 hover:from-amber-500/30 border border-amber-500/40 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-lg transition-all"
      >
        <span className="text-xl mb-1">🥂</span>
        <span className="text-[11px] font-bold text-amber-400">Registrar Aura</span>
      </button>
      
      <button 
        onClick={() => setSeccionActiva('perfil')} 
        className="bg-gray-900 hover:bg-gray-800 border border-gray-800 p-4 rounded-xl flex flex-col items-center justify-center text-center transition-colors"
      >
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
        Los puntos base de la fiesta se calculan automáticamente junto con el veredicto del juez de la IA.
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
            disabled={evaluandoIA || enviandoFormulario}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Tipo de Evento / Jornada</label>
          <select 
            value={tipoFiesta} 
            onChange={(e) => setTipoFiesta(e.target.value)} 
            className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-gray-100 focus:border-amber-500 focus:outline-none"
            disabled={evaluandoIA || enviandoFormulario}
          >
            {listaTiposFiesta.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre} (+{f.valor_aura} pts)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Inputs numéricos deshabilitados si está procesando */}
          {[
            { label: "⏱️ Horas de Fiesta", val: horasFiesta, set: setHorasFiesta },
            { label: "🥃 Cubatas", val: cubatas, set: setCubatas },
            { label: "🍺 Cervezas/Tintos", val: cervezas, set: setCervezas },
            { label: "🧪 Chupitos/Vinillos", val: chupitos, set: setChupitos },
            { label: "💧 Aguas", val: aguas, set: setAguas },
            { label: "🥤 Refrescos", val: refrescos, set: setRefrescos }
          ].map((item, index) => (
            <div key={index}>
              <label className="block text-xs text-gray-400 mb-1">{item.label}</label>
              <input 
                type="number" 
                min="0" 
                value={item.val} 
                onChange={(e) => item.set(e.target.value)} 
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2" 
                disabled={evaluandoIA || enviandoFormulario}
              />
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-3 space-y-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Eventos y Sucesos Especiales</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: "¿Conductor? 🚗", checked: conductor, set: setConductor },
              { label: "¿Control voinas verdes? 👮", checked: soploControl, set: setSoploControl },
              { label: "¿Viste salir el sol? ☀️", checked: vioSol, set: setVioSol },
              { label: "¿Trabajaste al día siguiente?🏢", checked: trabajoManana, set: setTrabajoManana },
              { label: "¿Te cagabas? 💩", checked: teCagabas, set: setTeCagabas },
              { label: "¿Almorzaste? 🥪", checked: almuerzo, set: setAlmuerzo },
              { label: "¿Fuiste de empalme? ⚡", checked: empalme, set: setEmpalme },
              { label: "¿Invitaste a los Pris? 📤", checked: invitoPris, set: setInvitoPris },
              { label: "¿Vomitaste? 🤢", checked: vomito, set: setVomito },
              { label: "¿Acabaste igual que un Kiko? 🥴", checked: kiko, set: setKiko },
              { label: "¿Campano? 🍷", checked: campano, set: setCampano }
            ].map((chk, idx) => (
              <label key={idx} className="flex items-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={chk.checked} 
                  onChange={(e) => chk.set(e.target.checked)} 
                  disabled={evaluandoIA || enviandoFormulario}
                /> 
                {chk.label}
              </label>
            ))}
          </div>
        </div>

        {/* --- TEXTAREA DEL ACONTECIMIENTO ÉPICO Y SU PROPIO BOTÓN --- */}
        <div className="flex flex-col space-y-2 border-t border-gray-800 pt-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">¿Acontecimiento Épico?</label>
          <textarea
            value={eventoEpico}
            onChange={(e) => {
              setEventoEpico(e.target.value);
              if(resultadoAuraIA) setResultadoAuraIA(null); // Si reescribe, borramos veredicto antiguo
            }}
            placeholder="Si ha pasado algo gordo que deba juzgar el tribunal, escríbelo aquí..."
            className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-gray-200 h-20 resize-none focus:border-amber-500 focus:outline-none"
            disabled={evaluandoIA || enviandoFormulario}
          />
          
          {/* BOTÓN CONECTADO DIRECTAMENTE A TU FUNCIÓN DE GEMINI EN CLIENTE */}
          {eventoEpico.trim() !== "" && (
            <button
              type="button" 
              onClick={manejarEvaluacionIA} // <-- Cambiado aquí para saltarse el fetch roto
              disabled={evaluandoIA || enviandoFormulario}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all self-end"
            >
              {evaluandoIA ? "🔮 Dictaminando..." : "✨ Juzgar con IA antes de guardar"}
            </button>
          )}
          
          {/* Tarjeta del veredicto que aparece en caliente en la UI */}
          {resultadoAuraIA && (
            <div className={`p-3 rounded-xl border text-left mt-2 ${resultadoAuraIA.puntos >= 0 ? 'bg-purple-500/10 border-purple-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-black text-purple-400">⚖️ Sentencia del Juez IA</span>
                <span className={`text-xs font-black ${resultadoAuraIA.puntos >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {resultadoAuraIA.puntos >= 0 ? `+${resultadoAuraIA.puntos}` : resultadoAuraIA.puntos} Aura Pts
                </span>
              </div>
              <p className="text-xs text-gray-300 italic mt-1">"{resultadoAuraIA.veredicto}"</p>
            </div>
          )}
        </div>

        {/* --- CAJA DEL TOTAL (Suma en caliente el Form + la IA si ya respondió) --- */}
        <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-center">
          <span className="text-xs block text-gray-400">Total de Aura a Registrar:</span>
          {(() => {
            let total = calcularPuntosFormulario();
            if (resultadoAuraIA && resultadoAuraIA.puntos) {
              total += resultadoAuraIA.puntos;
            }
            return (
              <span className="text-lg font-black text-amber-400">
                {total >= 0 ? `+${total}` : total} Aura
              </span>
            );
          })()}
        </div>

        {/* BOTÓN GENERAL DE ENVÍO DE TODA LA VIDA */}
        <button 
          type="submit" 
          disabled={enviandoFormulario || evaluandoIA} 
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-800 text-black font-black py-3 rounded-xl transition-all"
        >
          {enviandoFormulario ? '💾 Registrando Acta Oficial...' : 'Registrar Aura'}
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
            {/* Puesto en el top */}
            <span className={`text-sm font-black w-5 text-center ${j.color}`}>{j.top}</span>
            
            {/* Avatar del Usuario (Contenedor Transparente) */}
            <div className="bg-transparent w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              {j.avatar ? (
                <img 
                  src={j.avatar} 
                  alt={`Avatar de ${j.nombre}`} 
                  className="w-full h-full rounded-lg object-cover"
                  onError={(e) => {
                    // Fallback si falla la foto específica de este usuario
                    e.target.src = 'https://xngrbiwhdcyyagwvnzvq.supabase.co/storage/v1/object/public/avatars/default.png';
                  }}
                />
              ) : (
                <span className="text-base">👤</span>
              )}
            </div>

            {/* Datos del Jugador */}
            <div>
              <h4 className="text-sm font-bold text-gray-100 flex items-center gap-1">
                {j.nombre}
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
      
      {/* AVATAR DEL USUARIO ACTUAL */}
      <div className="bg-transparent w-20 h-20 rounded-full flex items-center justify-center overflow-hidden mx-auto mb-3 shrink-0">
        {nombreMostrar && nombreMostrar.trim() !== "" ? (
          <img 
            src={`https://xngrbiwhdcyyagwvnzvq.supabase.co/storage/v1/object/public/avatars/${nombreMostrar}.png`} 
            alt={`Avatar de ${nombreMostrar}`} 
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              e.target.src = 'https://xngrbiwhdcyyagwvnzvq.supabase.co/storage/v1/object/public/avatars/default.png';
            }}
          />
        ) : (
          <span className="text-4xl">👤</span>
        )}
      </div>

      <h2 className="text-xl font-black">{nombreMostrar}</h2>
      
      <p className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1 mt-0.5">
        {rangoUsuarioObj.nombre} <span>{rangoUsuarioObj.emoji}</span>
      </p>

      {/* Grid de Puntuaciones */}
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

      {/* Barra de progreso de rango */}
      <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/60 text-left space-y-1.5 mb-4">
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

      {/* CONTADORES HISTÓRICOS EN FILAS DISTRIBUIDAS CON MEDIAS */}
<div className="bg-gray-950 p-3 rounded-xl border border-gray-800/60 text-left mb-4">
  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5 text-center">
    Contadores Históricos <span className="text-amber-400 font-normal lowercase">(clica uno para ver su gráfica)</span>
  </span>
  
  <div className="space-y-2">
    {/* Fila 1: Alcohol principal (3 columnas) */}
    <div className="grid grid-cols-3 gap-2">
      {/* Cubatas */}
      <button 
        onClick={() => setContadorSeleccionado('cubatas')}
        className={`text-center p-2 rounded-lg border transition-all ${contadorSeleccionado === 'cubatas' ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'bg-gray-900/50 border-gray-800/40'}`}
      >
        <span className="text-[9px] text-purple-400 block font-bold uppercase tracking-tight">Cubatas</span>
        <span className="text-sm font-black text-gray-200">{statsTotales.cubatas}</span>
        <span className="text-[9px] text-gray-500 block">Ø {statsTotales.medias?.cubatas || 0}/día</span>
      </button>

      {/* Cervezas */}
      <button 
        onClick={() => setContadorSeleccionado('cervezas')}
        className={`text-center p-2 rounded-lg border transition-all ${contadorSeleccionado === 'cervezas' ? 'bg-yellow-500/20 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'bg-gray-900/50 border-gray-800/40'}`}
      >
        <span className="text-[9px] text-yellow-500 block font-bold uppercase tracking-tight">Cervezas / Tintos</span>
        <span className="text-sm font-black text-gray-200">{statsTotales.cervezas}</span>
        <span className="text-[9px] text-gray-500 block">Ø {statsTotales.medias?.cervezas || 0}/día</span>
      </button>

      {/* Chupitos */}
      <button 
        onClick={() => setContadorSeleccionado('chupitos')}
        className={`text-center p-2 rounded-lg border transition-all ${contadorSeleccionado === 'chupitos' ? 'bg-red-500/20 border-red-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'bg-gray-900/50 border-gray-800/40'}`}
      >
        <span className="text-[9px] text-red-400 block font-bold uppercase tracking-tight">Chupitos / Vinillos</span>
        <span className="text-sm font-black text-gray-200">{statsTotales.chupitos}</span>
        <span className="text-[9px] text-gray-500 block">Ø {statsTotales.medias?.chupitos || 0}/día</span>
      </button>
    </div>

    {/* Fila 2: Hidratación / Suaves (2 columnas) */}
    <div className="grid grid-cols-2 gap-2">
      {/* Agua */}
      <button 
        onClick={() => setContadorSeleccionado('aguas')}
        className={`text-center p-2 rounded-lg border transition-all ${contadorSeleccionado === 'aguas' ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-gray-900/50 border-gray-800/40'}`}
      >
        <span className="text-[9px] text-blue-400 block font-bold uppercase tracking-tight">Agua</span>
        <span className="text-sm font-black text-gray-200">{statsTotales.aguas}</span>
        <span className="text-[9px] text-gray-500 block">Ø {statsTotales.medias?.aguas || 0}/día</span>
      </button>

      {/* Refrescos */}
      <button 
        onClick={() => setContadorSeleccionado('refrescos')}
        className={`text-center p-2 rounded-lg border transition-all ${contadorSeleccionado === 'refrescos' ? 'bg-green-500/20 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-gray-900/50 border-gray-800/40'}`}
      >
        <span className="text-[9px] text-green-400 block font-bold uppercase tracking-tight">Refrescos</span>
        <span className="text-sm font-black text-gray-200">{statsTotales.refrescos}</span>
        <span className="text-[9px] text-gray-500 block">Ø {statsTotales.medias?.refrescos || 0}/día</span>
      </button>
    </div>

    {/* Fila 3: Horas de fiesta */}
    <div className="w-full">
      <button 
        onClick={() => setContadorSeleccionado('horas')}
        className={`w-full text-center p-2 rounded-lg border transition-all ${contadorSeleccionado === 'horas' ? 'bg-orange-500/20 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-gray-900/50 border-gray-800/40'}`}
      >
        <div className="flex justify-center items-center gap-4">
          <div>
            <span className="text-[9px] text-orange-400 block font-bold uppercase tracking-wider">Horas de Fiesta Totales</span>
            <span className="text-sm font-black text-gray-200">{statsTotales.horas || 0}h</span>
          </div>
          <div className="border-l border-gray-800/80 pl-4 text-left">
            <span className="text-[9px] text-gray-500 block uppercase font-bold">Media por juerga</span>
            <span className="text-xs font-bold text-gray-300">{statsTotales.medias?.horas || 0}h / salida</span>
          </div>
        </div>
      </button>
    </div>
  </div>
</div>

      {/* SECCIÓN: LA GRÁFICA EVOLUTIVA */}
      <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/60 text-left">
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-3 text-center">
          Consumo de <span className="text-amber-400">{contadorSeleccionado}</span> por fecha
        </span>
        
        <div className="w-full h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datosGrafica} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDinamico" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="5%" 
                    stopColor={
                      contadorSeleccionado === 'cubatas' ? '#a855f7' :
                      contadorSeleccionado === 'cervezas' ? '#eab308' :
                      contadorSeleccionado === 'chupitos' ? '#f43f5e' :
                      contadorSeleccionado === 'aguas' ? '#3b82f6' : 
                      contadorSeleccionado === 'horas' ? '#f97316' : '#22c55e'
                    } 
                    stopOpacity={0.4}
                  />
                  <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis 
                dataKey="fecha" 
                stroke="#6b7280" 
                fontSize={8} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false} 
                allowDecimals={false} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#030712', borderColor: '#1f2937', borderRadius: '8px', fontSize: '11px' }}
                itemStyle={{ color: '#f3f4f6' }}
              />
              <Area 
                type="monotone" 
                dataKey={contadorSeleccionado} 
                stroke={
                  contadorSeleccionado === 'cubatas' ? '#a855f7' :
                  contadorSeleccionado === 'cervezas' ? '#eab308' :
                  contadorSeleccionado === 'chupitos' ? '#f43f5e' :
                  contadorSeleccionado === 'aguas' ? '#3b82f6' : 
                  contadorSeleccionado === 'horas' ? '#f97316' : '#22c55e'
                } 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorDinamico)" 
              />
            </AreaChart>
          </ResponsiveContainer>
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