// Horóscopo diario BLOODSITAX
// Genera los 12 signos con Gemini (plan gratis), partiendo del cielo real del día,
// y evita repetir frases usando el historial de los últimos días.
//
// Uso:
//   node generar.mjs                 genera el de hoy (hora de Lima)
//   node generar.mjs --manana        genera el de mañana
//   node generar.mjs --fecha=2026-12-24
//   node generar.mjs --forzar        lo vuelve a generar aunque ya exista
//   node generar.mjs --respaldo      no usa la IA, solo el banco de frases local
//
// Necesita la variable de entorno GEMINI_API_KEY (o un archivo clave.txt junto a este script).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Astro from 'astronomy-engine';
import { generarRespaldo } from './respaldo.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ARCH_HOY = path.join(DIR, 'hoy.json');
const ARCH_HIST = path.join(DIR, 'historial.json');
const ZONA = 'America/Lima';
const DIAS_HISTORIAL = 30;
const DIAS_COMPARAR = 21;
const MODELOS = (process.env.GEMINI_MODEL || 'gemini-flash-latest,gemini-flash-lite-latest').split(',').map(s => s.trim()).filter(Boolean);

export const SIGNOS = ['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'];
const SECCIONES = ['amor_pareja','amor_soltero','dinero_trabajo','salud','consejo'];
const LARGO = { amor_pareja:[55,75], amor_soltero:[50,65], dinero_trabajo:[45,60], salud:[45,65], consejo:[10,28] };

/* ---------- Argumentos ---------- */
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));

function fechaLima(desfaseDias = 0){
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year:'numeric', month:'2-digit', day:'2-digit' });
  return f.format(new Date(Date.now() + desfaseDias * 864e5));
}
const FECHA = typeof args.fecha === 'string' ? args.fecha : fechaLima(args.manana ? 1 : 0);
if(!/^\d{4}-\d{2}-\d{2}$/.test(FECHA)) { console.error('Fecha inválida: ' + FECHA); process.exit(1); }

/* ---------- Azar con semilla (mismo día y signo = mismo resultado) ---------- */
function hash(t){ let h = 1779033703 ^ t.length; for(let i = 0; i < t.length; i++){ h = Math.imul(h ^ t.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return h >>> 0; }
export function azar(semilla){ let a = hash(String(semilla)); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const SAL = args.forzar ? String(Date.now()) : '';

/* ---------- Cielo real del día ---------- */
// Se calcula a mediodía de Lima (17:00 UTC). Casas por signo entero.
const CASAS = ['', 'tu imagen y tu energía personal', 'tu dinero y lo que valoras', 'las pláticas, los mensajes y los trayectos cortos',
  'la casa y la familia', 'el romance, la diversión y la creatividad', 'la rutina, el trabajo diario y la salud', 'la pareja y los acuerdos',
  'la intimidad, lo compartido y las deudas', 'los viajes, los estudios y las creencias', 'la carrera y la reputación',
  'los amigos y los planes a futuro', 'el descanso, lo oculto y la introspección'];
const PLANETAS = { Sun:'Sol', Moon:'Luna', Mercury:'Mercurio', Venus:'Venus', Mars:'Marte', Jupiter:'Júpiter', Saturn:'Saturno' };

function longitud(cuerpo, fecha){ return Astro.Ecliptic(Astro.GeoVector(cuerpo, fecha, true)).elon; }
function signoDe(lon){ return SIGNOS[Math.floor(((lon % 360) + 360) % 360 / 30)]; }
function faseLunar(ang){
  const f = [[22.5,'luna nueva'],[67.5,'luna creciente'],[112.5,'cuarto creciente'],[157.5,'luna gibosa creciente'],[202.5,'luna llena'],
    [247.5,'luna gibosa menguante'],[292.5,'cuarto menguante'],[337.5,'luna menguante'],[360,'luna nueva']];
  return f.find(([lim]) => ang < lim)[1];
}
export function cielo(fechaISO){
  // El día de Lima va de 05:00 UTC a 05:00 UTC del día siguiente
  const medio = new Date(fechaISO + 'T17:00:00Z'), inicio = new Date(fechaISO + 'T05:00:00Z'), fin = new Date(inicio.getTime() + 864e5 - 6e4);
  const posiciones = {}, retro = [];
  for(const [k, nombre] of Object.entries(PLANETAS)){
    const lon = longitud(k, medio);
    posiciones[nombre] = signoDe(lon);
    if(k !== 'Sun' && k !== 'Moon'){
      let d = longitud(k, medio) - longitud(k, new Date(medio.getTime() - 864e5));
      if(d > 180) d -= 360; if(d < -180) d += 360;
      if(d < 0) retro.push(nombre);
    }
  }
  const lunaIni = signoDe(longitud('Moon', inicio)), lunaFin = signoDe(longitud('Moon', fin));
  return {
    posiciones, retrogrados: retro,
    fase: faseLunar(Astro.MoonPhase(medio)),
    luna_cambia: lunaIni !== lunaFin ? `la Luna pasa de ${lunaIni} a ${lunaFin}` : ''
  };
}
function casa(signoPlaneta, signo){ return ((SIGNOS.indexOf(signoPlaneta) - SIGNOS.indexOf(signo) + 12) % 12) + 1; }

/* ---------- Temas por sección (para que cada signo arranque de algo distinto) ---------- */
const TEMAS = {
  amor_pareja: ['una plática pendiente que conviene tener', 'un detalle pequeño que vale más que un regalo caro', 'los celos y la confianza', 'planear algo juntos a futuro',
    'la rutina que apaga la chispa', 'un malentendido por un mensaje', 'pedir perdón o aceptar una disculpa', 'la familia de tu pareja', 'el espacio personal de cada quien',
    'recordar cómo empezó todo', 'una sorpresa que no esperabas', 'el dinero en la relación', 'aprender a escuchar sin interrumpir', 'una diferencia de opiniones que los acerca',
    'el cariño físico y la ternura', 'una promesa que hay que cumplir', 'el orgullo que estorba', 'reírse juntos de algo', 'un límite que tu pareja te va a marcar',
    'el cansancio que se confunde con desinterés', 'apoyar a tu pareja en un mal momento', 'una costumbre de tu pareja que por fin entiendes', 'hacer las paces con el pasado de la relación', 'una cita sencilla en casa'],
  amor_soltero: ['alguien del pasado que reaparece', 'una persona nueva en un lugar inesperado', 'un mensaje que tarda en llegar', 'la atracción por alguien que no es tu tipo',
    'soltar a quien no te corresponde', 'una amistad que podría ser algo más', 'atreverte a dar el primer paso', 'conocerte mejor antes de buscar a alguien', 'una coincidencia que parece destino',
    'las apps de citas y la paciencia', 'una mirada que dice mucho', 'no idealizar a quien apenas conoces', 'una invitación que no debes rechazar', 'el miedo a volver a ilusionarte',
    'disfrutar tu soltería sin prisas', 'alguien que te admira en silencio', 'una plática larga que lo cambia todo', 'un descubrimiento sobre la persona que te gusta',
    'los amigos que quieren presentarte a alguien', 'un coqueteo inocente que crece', 'dejar de comparar con tu ex', 'una señal clara que llevas tiempo ignorando'],
  dinero_trabajo: ['un pago o cobro pendiente', 'una idea que puedes convertir en dinero', 'un compañero que necesita tu ayuda', 'ordenar tus gastos hormiga', 'una oportunidad que llega por recomendación',
    'pedir lo que vale tu trabajo', 'un error que puedes corregir a tiempo', 'una junta o entrevista importante', 'terminar algo que dejaste a medias', 'una compra que conviene pensar dos veces',
    'aprender una habilidad nueva', 'un jefe o cliente difícil', 'trabajar en equipo en lugar de solo', 'el esfuerzo que por fin se nota', 'decir que no a más carga de la que puedes',
    'un proyecto personal que crece', 'ahorrar para algo concreto', 'una propuesta que llega de lejos', 'organizar tu agenda antes de que te gane', 'confiar en tu experiencia', 'un trámite o papel que no puedes dejar para después'],
  salud: ['dormir mejor', 'tomar más agua', 'la espalda y la postura', 'el estrés que se acumula en el cuello', 'moverte aunque sea un poco', 'comer a tus horas', 'descansar la vista de las pantallas',
    'la mente y el cuerpo como un todo', 'salir a tomar aire y sol', 'escuchar las señales del cuerpo', 'bajarle a la cafeína', 'estirarte al despertar', 'respirar antes de reaccionar',
    'la digestión y lo que comes de noche', 'un chequeo que vienes posponiendo', 'cuidar tu energía emocional', 'reírte más', 'una caminata sin el celular', 'darte permiso de no hacer nada', 'la piel y el cuidado personal']
};

/* ---------- Formas de escribir cada sección (para que no todos suenen igual) ---------- */
const FORMAS = {
  texto: [
    'predice un suceso concreto de hoy ("hoy vas a...") y termina con una invitación a actuar',
    'abre con una reflexión general sobre la vida o el amor y baja a un consejo directo',
    'usa una metáfora cotidiana o de la naturaleza (estaciones, fuego, cosecha, una casa, un puente) y luego da una orden clara',
    'abre con una pregunta retórica al lector y luego responde con consejo',
    'describe un problema que el lector viene cargando, explica por qué sigue ahí y propone qué hacer hoy',
    'usa un contraste o repetición ("no se trata de..., sino de...") y cierra con una frase redonda',
    'empieza reconociendo algo bueno del lector y luego le pide un paso más',
    'da una advertencia firme, sin miedo, y deja una salida concreta'
  ],
  consejo: [
    'un aforismo corto y propio',
    'un ejercicio concreto con un número ("por cada..., piensa en tres...")',
    'un pequeño ritual sencillo de hacer hoy',
    'un contraste "no X, sino Y"',
    'una advertencia breve con su razón',
    'una orden breve seguida de lo que vas a ganar'
  ]
};
function formasDelDia(signo){
  const r = azar(`forma|${FECHA}|${signo}${SAL}`), f = {};
  for(const sec of SECCIONES) { const b = sec === 'consejo' ? FORMAS.consejo : FORMAS.texto; f[sec] = b[Math.floor(r() * b.length)]; }
  // La mitad de los días, salud habla del bienestar emocional en vez del cuerpo
  f.salud_enfoque = r() < .45 ? 'bienestar emocional (soltar, autoestima, apoyo de otros)' : 'cuerpo y hábitos (dormir, comer, moverse, postura)';
  return f;
}

/* ---------- Números de la suerte (los pone el código, no la IA) ---------- */
function numeros(signo, fecha, ayer){
  for(let intento = 0; ; intento++){
    const r = azar(`num|${fecha}|${signo}|${intento}${SAL}`), s = new Set();
    while(s.size < 6) s.add(1 + Math.floor(r() * 49));
    const lista = [...s].sort((a, b) => a - b);
    const repetidos = ayer ? lista.filter(n => ayer.includes(n)).length : 0;
    if(repetidos <= 1 || intento > 20) return lista;
  }
}

/* ---------- Historial y parecido ---------- */
function leerJSON(arch, def){ try{ return JSON.parse(fs.readFileSync(arch, 'utf8')); }catch{ return def; } }
const sinAcentos = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const palabras = t => sinAcentos(t).replace(/[^a-zñ0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
function trigramas(t){ const p = palabras(t), s = new Set(); for(let i = 0; i + 2 < p.length; i++) s.add(p[i] + ' ' + p[i+1] + ' ' + p[i+2]); return s; }
function parecido(a, b){ const A = trigramas(a), B = trigramas(b); if(!A.size || !B.size) return 0; let c = 0; for(const x of A) if(B.has(x)) c++; return c / Math.min(A.size, B.size); }
const inicio = t => palabras(t).slice(0, 4).join(' ');

const historial = leerJSON(ARCH_HIST, { dias: [] });
historial.dias = (historial.dias || []).filter(d => d.fecha !== FECHA).sort((a, b) => a.fecha < b.fecha ? 1 : -1);
const recientes = historial.dias.filter(d => (new Date(FECHA) - new Date(d.fecha)) / 864e5 <= DIAS_COMPARAR && d.fecha < FECHA);

function temasDelDia(signo){
  const usados = new Set(recientes.slice(0, 10).flatMap(d => Object.values((d.signos[signo] || {}).temas || {})));
  const r = azar(`tema|${FECHA}|${signo}${SAL}`), t = {};
  for(const [sec, banco] of Object.entries(TEMAS)){
    const libres = banco.filter(x => !usados.has(x));
    const fuente = libres.length ? libres : banco;
    t[sec] = fuente[Math.floor(r() * fuente.length)];
  }
  return t;
}

// Revisa un horóscopo ya generado: largo correcto y que no se parezca a lo reciente
function problemas(signo, h, hoyOtros){
  const p = [];
  for(const sec of SECCIONES){
    const txt = h[sec] || '', n = palabras(txt).length, [min, max] = LARGO[sec];
    if(n < min * .7) p.push(`${sec} quedó muy corto`);
    if(n > max * 1.4) p.push(`${sec} quedó muy largo`);
    const previos = recientes.flatMap(d => Object.values(d.signos).map(x => x[sec]).filter(Boolean));
    const otros = hoyOtros.map(x => x[sec]).filter(Boolean);
    if(sec !== 'consejo' && [...previos, ...otros].some(x => parecido(txt, x) > .18)) p.push(`${sec} se parece demasiado a uno anterior`);
    if(sec === 'consejo' && [...previos, ...otros].some(x => sinAcentos(x).trim() === sinAcentos(txt).trim() || parecido(txt, x) > .5)) p.push('el consejo ya se usó');
  }
  return p;
}

/* ---------- Gemini ---------- */
function clave(){
  if(process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  try{ return fs.readFileSync(path.join(DIR, 'clave.txt'), 'utf8').trim(); }catch{ return ''; }
}
const espera = ms => new Promise(r => setTimeout(r, ms));
// Si en 8 minutos Gemini no terminó, se deja de insistir y sale el banco de frases
const INICIO = Date.now(), LIMITE_MS = 8 * 60000;
const sinTiempo = () => Date.now() - INICIO > LIMITE_MS;

let modeloBueno = '';
async function gemini(prompt){
  const key = clave(); if(!key) throw new Error('No hay GEMINI_API_KEY ni clave.txt');
  const esquema = { type:'ARRAY', items:{ type:'OBJECT', properties:{
    signo:{ type:'STRING' }, amor_pareja:{ type:'STRING' }, amor_soltero:{ type:'STRING' },
    dinero_trabajo:{ type:'STRING' }, salud:{ type:'STRING' }, consejo:{ type:'STRING' } },
    required:['signo', ...SECCIONES] } };
  let ultimo;
  const orden = modeloBueno ? [modeloBueno, ...MODELOS.filter(m => m !== modeloBueno)] : MODELOS;
  for(const modelo of orden){
    console.log(`  Pidiendo a Gemini (${modelo})...`);
    for(let intento = 0; intento < 2; intento++){
      if(sinTiempo()) throw new Error('se acabó el tiempo (8 minutos)');
      try{
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
          method:'POST', headers:{ 'Content-Type':'application/json', 'x-goog-api-key': key },
          signal: AbortSignal.timeout(120000), // si en 2 minutos no responde, se pasa al siguiente intento
          body: JSON.stringify({ contents:[{ role:'user', parts:[{ text: prompt }] }],
            generationConfig:{ temperature:1.05, topP:.95, maxOutputTokens:16384, responseMimeType:'application/json', responseSchema: esquema } })
        });
        const txt = await r.text();
        if(r.status === 429 || r.status >= 500){ ultimo = new Error(`${modelo}: HTTP ${r.status} ${txt.slice(0, 200)}`); console.log('  ' + ultimo.message); await espera(10000 * (intento + 1)); continue; }
        if(!r.ok){ ultimo = new Error(`${modelo}: HTTP ${r.status} ${txt.slice(0, 300)}`); console.log('  ' + ultimo.message); break; }
        const j = JSON.parse(txt);
        const salida = j.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
        const lista = JSON.parse(salida);
        if(!Array.isArray(lista)) throw new Error('respuesta sin lista');
        console.log(`  Gemini respondió (${modelo})`);
        modeloBueno = modelo; // las siguientes peticiones van directo a este modelo
        return lista;
      }catch(e){
        ultimo = e; console.log(`  ${modelo}: ${e.name === 'TimeoutError' ? 'no respondió en 2 minutos' : e.message}`);
        if(e.name === 'TimeoutError') break; // si se cuelga, probar de una vez con el otro modelo
        await espera(3000);
      }
    }
  }
  throw ultimo || new Error('Gemini no respondió');
}

const ESTILO = `Eres la astróloga del canal de Twitch BLOODSITAX. Escribes el horóscopo del día en español neutro latino (de tú, nunca "vosotros"), cercano y con voz propia.
Formato de cada signo:
- amor_pareja: ${LARGO.amor_pareja.join(' a ')} palabras, para quien tiene pareja. Reflexivo y un poco poético, con una situación concreta del día.
- amor_soltero: ${LARGO.amor_soltero.join(' a ')} palabras, para quien no tiene pareja. Con algo que puede pasar hoy y una invitación a actuar o a esperar.
- dinero_trabajo: ${LARGO.dinero_trabajo.join(' a ')} palabras. Práctico, como un coach que te dice qué hacer hoy.
- salud: ${LARGO.salud.join(' a ')} palabras. Bienestar físico y emocional, directo, con una acción sencilla. Nada de consejos médicos ni diagnósticos.
- consejo: una sola frase de ${LARGO.consejo.join(' a ')} palabras, memorable, que no sea un refrán conocido.
Reglas:
- Respeta los largos: cada sección de texto es un párrafo completo de 3 a 4 oraciones. Los textos más cortos se rechazan.
- Usa el cielo real que te doy como inspiración de fondo (qué área de la vida activa la Luna, el Sol, Venus o Marte para ese signo), pero casi sin nombrarlo: como máximo una mención a un astro o a "los astros" por signo, y en varios signos ninguna.
- Cada sección necesita al menos un detalle concreto y cotidiano (una cena, una reunión familiar, cambiar de ruta al trabajo, un mensaje, una mascota, un curso, una caminata), nada de frases que sirvan para cualquiera.
- Sigue la forma de escribir que te indico para cada sección; así cada signo suena distinto.
- Cada signo debe sentirse distinto: distintas situaciones, imágenes y verbos. No copies estructuras entre signos.
- Mezcla días buenos, retadores y tranquilos; no todo es positivo, pero siempre deja una salida.
- Prohibido usar estas muletillas: "hoy es un día", "la energía fluye", "el universo conspira", "los astros te sonríen", "vibra", "manifestar", "date un respiro", "no tengas miedo", "todo pasa por algo". Usa "los astros" como máximo en dos signos en total.
- Nada de emojis, hashtags ni comillas raras. Solo texto.`;

function armarPrompt(cieloHoy, pedidos, extra = ''){
  const pos = cieloHoy.posiciones;
  const global = `Fecha: ${FECHA}. Cielo del día: Sol en ${pos.Sol}, Luna en ${pos.Luna} (${cieloHoy.fase}${cieloHoy.luna_cambia ? '; ' + cieloHoy.luna_cambia : ''}), ` +
    `Mercurio en ${pos.Mercurio}, Venus en ${pos.Venus}, Marte en ${pos.Marte}, Júpiter en ${pos['Júpiter']}, Saturno en ${pos.Saturno}.` +
    (cieloHoy.retrogrados.length ? ` Retrógrados: ${cieloHoy.retrogrados.join(', ')}.` : ' Ningún planeta personal retrógrado.');
  const bloques = pedidos.map(({ signo, temas, formas }) => {
    const c = n => `${n} en su casa ${casa(pos[n], signo)} (${CASAS[casa(pos[n], signo)]})`;
    const prev = recientes.slice(0, 14).map(d => d.signos[signo]).filter(Boolean);
    const inicios = [...new Set(prev.flatMap(h => SECCIONES.filter(s => s !== 'consejo').map(s => inicio(h[s]))).filter(Boolean))].slice(0, 40);
    const consejos = prev.map(h => h.consejo).filter(Boolean).slice(0, 14);
    return `### ${signo}
Para ${signo}: ${c('Luna')}; ${c('Sol')}; ${c('Venus')}; ${c('Marte')}.
Temas de hoy: pareja -> ${temas.amor_pareja}; soltería -> ${temas.amor_soltero}; trabajo -> ${temas.dinero_trabajo}; salud -> ${temas.salud} (enfoque: ${formas.salud_enfoque}).
Forma de escribir: pareja -> ${formas.amor_pareja}; soltería -> ${formas.amor_soltero}; trabajo -> ${formas.dinero_trabajo}; salud -> ${formas.salud}; consejo -> ${formas.consejo}.
${inicios.length ? 'No empieces ninguna sección con: ' + inicios.map(x => `"${x}"`).join(', ') + '.' : ''}
${consejos.length ? 'Consejos ya usados (no los repitas ni parafrasees): ' + consejos.map(x => `"${x}"`).join(' | ') : ''}`;
  }).join('\n\n');
  return `${ESTILO}\n\n${global}\n\n${bloques}\n\n${extra}\nDevuelve un arreglo JSON con un objeto por signo pedido (${pedidos.map(p => p.signo).join(', ')}), con los campos signo, amor_pareja, amor_soltero, dinero_trabajo, salud y consejo.`;
}

/* ---------- Principal ---------- */
async function main(){
  const previo = leerJSON(ARCH_HOY, null);
  if(previo && previo.fecha === FECHA && !args.forzar){ console.log(`Ya existe el horóscopo del ${FECHA}. Usa --forzar para rehacerlo.`); return; }

  console.log(`Horóscopo del ${FECHA}`);
  const cieloHoy = cielo(FECHA);
  console.log(`  Cielo: Sol en ${cieloHoy.posiciones.Sol}, Luna en ${cieloHoy.posiciones.Luna} (${cieloHoy.fase})`);

  const pedidos = SIGNOS.map(signo => ({ signo, temas: temasDelDia(signo), formas: formasDelDia(signo) }));
  const resultado = {};
  let fuente = 'gemini';

  if(!args.respaldo){
    try{
      let pendientes = pedidos, extra = '';
      for(let ronda = 0; ronda < 3 && pendientes.length && !sinTiempo(); ronda++){
        // De 4 en 4: con los 12 juntos la IA tiende a escribir corto
        const lista = [];
        for(let i = 0; i < pendientes.length && !sinTiempo(); i += 4){
          const grupo = pendientes.slice(i, i + 4);
          try{ lista.push(...await gemini(armarPrompt(cieloHoy, grupo, extra))); }
          catch(e){ console.log(`  Falló el grupo ${grupo.map(g => g.signo).join(', ')}: ${e.message}`); }
        }
        const fallidos = [], notas = [];
        for(const p of pendientes){
          const h = lista.find(x => sinAcentos(x.signo) === sinAcentos(p.signo));
          if(!h){ fallidos.push(p); continue; }
          const otros = Object.entries(resultado).filter(([s]) => s !== p.signo).map(([, v]) => v);
          const prob = problemas(p.signo, h, otros);
          if(prob.length && ronda < 2){ fallidos.push(p); notas.push(`${p.signo}: ${prob.join(', ')}`); continue; }
          resultado[p.signo] = { ...Object.fromEntries(SECCIONES.map(s => [s, String(h[s] || '').trim()])), temas: p.temas };
        }
        pendientes = fallidos;
        if(pendientes.length) console.log(`  Rehaciendo ${pendientes.length} signo(s): ${notas.join(' / ') || 'faltaron en la respuesta'}`);
        extra = notas.length ? `La versión anterior tuvo estos problemas, corrígelos con textos totalmente nuevos: ${notas.join('; ')}.` : '';
      }
    }catch(e){
      console.log('  No se pudo usar Gemini: ' + e.message);
    }
  }

  // Lo que falte (o todo, si no hay IA) sale del banco de frases local
  const faltan = SIGNOS.filter(s => !resultado[s]);
  if(faltan.length){
    if(faltan.length === 12) fuente = 'respaldo'; else fuente = 'mixto';
    console.log(`  Usando el banco local para: ${faltan.join(', ')}`);
    const usados = recientes.flatMap(d => Object.values(d.signos));
    for(const signo of faltan){
      resultado[signo] = { ...generarRespaldo(signo, FECHA + SAL, cieloHoy, usados), temas: {} };
      usados.push(resultado[signo]); // que otro signo de hoy no repita las mismas frases
    }
  }

  const ayer = recientes[0];
  const horoscopos = SIGNOS.map(signo => {
    const h = resultado[signo];
    return { signo, fecha: FECHA, amor_pareja: h.amor_pareja, amor_soltero: h.amor_soltero, dinero_trabajo: h.dinero_trabajo,
      salud: h.salud, consejo: h.consejo, numeros: numeros(signo, FECHA, ayer && ayer.signos[signo] && ayer.signos[signo].numeros) };
  });

  const salida = { fecha: FECHA, generado: new Date().toISOString(), fuente, cielo: cieloHoy, horoscopos };
  fs.writeFileSync(ARCH_HOY, JSON.stringify(salida, null, 2) + '\n');

  historial.dias.unshift({ fecha: FECHA, signos: Object.fromEntries(horoscopos.map(h => [h.signo, { ...h, signo: undefined, fecha: undefined, temas: resultado[h.signo].temas }])) });
  historial.dias = historial.dias.sort((a, b) => a.fecha < b.fecha ? 1 : -1).slice(0, DIAS_HISTORIAL);
  fs.writeFileSync(ARCH_HIST, JSON.stringify(historial) + '\n');

  console.log(`Listo: hoy.json (${fuente}). Ejemplo, ${horoscopos[0].signo}: ${horoscopos[0].consejo}`);
}

main().catch(e => { console.error(e); process.exit(1); });
