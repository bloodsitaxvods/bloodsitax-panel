// Banco de frases propio para cuando Gemini no responde.
// Cada sección se arma con tres frases (inicio, desarrollo, cierre) elegidas con semilla
// y evitando las que ya salieron en los últimos días.

function hash(t){ let h = 1779033703 ^ t.length; for(let i = 0; i < t.length; i++){ h = Math.imul(h ^ t.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return h >>> 0; }
function azar(semilla){ let a = hash(String(semilla)); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const BANCO = {
  amor_pareja: [
    [ 'Con la Luna en {luna}, lo que callaste estos días pide salir, aunque sea despacio.',
      'Hay conversaciones que se posponen por miedo a romper algo, y hoy te toca una de ellas.',
      'La rutina tiene sus encantos, pero también puede volverse un muro que nadie ve.',
      'Tu pareja trae algo en la cabeza que todavía no te ha contado.',
      'Un gesto pequeño, casi sin importancia, va a decir más que cualquier discurso.',
      'El cariño también se demuestra en lo aburrido: en lavar los trastes sin que te lo pidan.',
      'La fase de {fase} te invita a revisar qué cosas sostienes por costumbre y cuáles por amor.',
      'Hoy notarás que tu pareja necesita más espacio del que suele pedir.' ],
    [ 'No se trata de ganar la discusión, sino de entender de dónde viene la molestia.',
      'Si escuchas sin preparar tu respuesta, vas a descubrir algo que no sabías de esa persona.',
      'Lo que para ti es un detalle menor, para la otra persona puede ser una herida abierta.',
      'Las parejas también se construyen equivocándose y volviendo a intentarlo.',
      'Mirar atrás y recordar por qué empezaron puede devolverles algo de la chispa perdida.',
      'Un poco de humor a tiempo desarma tensiones que parecían enormes.',
      'Cuidado con confundir cansancio con desinterés: no son lo mismo.',
      'Proponer un plan sencillo, sin gastar de más, puede cambiar el ánimo de toda la semana.' ],
    [ 'Da el primer paso, aunque te cueste el orgullo.',
      'Esta noche, deja el celular lejos y dedica un rato solo a ustedes.',
      'Lo que siembres hoy en esa relación lo vas a cosechar pronto.',
      'Toma nota de lo que aprendas: te va a servir más adelante.',
      'Un abrazo largo resuelve lo que las palabras todavía no saben decir.',
      'No dejes para mañana el "te quiero" que tienes atorado.',
      'Respeta sus tiempos y verás cómo vuelve a ti con más ganas.' ]
  ],
  amor_soltero: [
    [ 'Alguien que creías olvidado vuelve a aparecer en tus pensamientos o en tus mensajes.',
      'La Luna en {luna} te pone más magnético de lo normal, y alguien lo va a notar.',
      'Hoy puedes descubrir algo de esa persona que te interesa que cambia por completo la idea que tenías.',
      'Una plática casual, en el lugar menos pensado, puede abrir una puerta que no esperabas.',
      'Estás en un momento en el que conocerte a ti mismo pesa más que buscar a alguien.',
      'Una amistad de años empieza a sentirse distinta, y no sabes bien qué hacer con eso.',
      'Te llega una invitación que tu flojera querrá rechazar.',
      'La fase de {fase} remueve emociones viejas y te recuerda qué es lo que de verdad buscas.' ],
    [ 'No idealices a quien apenas conoces: deja que se muestre como es.',
      'Si te gusta, dilo; quedarte con la duda pesa más que un no.',
      'Las coincidencias existen, pero hay que moverse para que se conviertan en algo.',
      'Evita comparar a cada persona nueva con tu ex: así nadie va a estar a la altura.',
      'Tu forma de ser, sin filtros, es justo lo que atrae a la gente correcta.',
      'Las señales están ahí; solo falta que dejes de fingir que no las ves.',
      'Un mensaje bien pensado vale más que diez mensajes impulsivos.',
      'Ir con calma no es perder el tiempo, es elegir mejor.' ],
    [ 'Atrévete a dar el primer paso antes de que termine el día.',
      'Sal, aunque sea un rato: hoy la suerte está afuera, no en tu cuarto.',
      'Disfruta tu soltería: también es una etapa para quererte bonito.',
      'Lo que tenga que llegar, va a llegar, pero ayúdale un poquito.',
      'Escribe ese mensaje, pero léelo dos veces antes de enviarlo.',
      'Mantén los ojos abiertos: alguien te está mirando más de lo que crees.',
      'Hoy cierra una puerta para que pueda abrirse otra.' ]
  ],
  dinero_trabajo: [
    [ 'Nada cae del cielo: lo que quieres cobrar mañana se trabaja hoy.',
      'Con Marte en {marte}, tienes la energía para sacar ese pendiente que te persigue.',
      'Un compañero o cliente difícil va a poner a prueba tu paciencia.',
      'Una idea que traes guardada puede convertirse en dinero si la aterrizas.',
      'Revisa tus gastos hormiga: ahí se te está escapando más de lo que crees.',
      'Hoy alguien va a reconocer un esfuerzo que creías que nadie notaba.',
      'Es buen día para ordenar tu agenda antes de que ella te ordene a ti.' ],
    [ 'Arremángate y termina lo que dejaste a medias.',
      'Pide lo que vale tu trabajo, sin disculparte por ello.',
      'Escucha antes de contestar; la solución puede venir de quien menos esperas.',
      'Piensa dos veces antes de esa compra que se siente urgente.',
      'Trabajar en equipo hoy te ahorra horas de pelear solo con el problema.',
      'Corrige ese error pequeño antes de que se vuelva grande.',
      'Aprender algo nuevo, aunque sea un rato, te abre puertas a mediano plazo.' ],
    [ 'Tu esfuerzo va a tener premio.',
      'La constancia hoy pesa más que el talento.',
      'Cierra el día con una lista de lo que sí lograste.',
      'No firmes nada con prisa.',
      'Cuida tu dinero como cuidas tu tiempo.',
      'Lo que hoy parece lento, mañana se nota.' ]
  ],
  salud: [
    [ 'Tu cuerpo te está mandando señales que llevas días ignorando.',
      'Con el Sol en {sol}, tu energía sube y baja más de lo normal.',
      'Mente y cuerpo no van por separado: lo que piensas se te nota en la espalda y en el sueño.',
      'El estrés se te está acumulando en el cuello y los hombros.',
      'Hoy te conviene bajarle al ritmo y no exigirte de más.',
      'Las pantallas te están cobrando factura en la vista y en el descanso.',
      'Llevas tiempo posponiendo algo que tu salud agradecería.' ],
    [ 'Toma más agua de la que crees necesitar y come a tus horas.',
      'Una caminata corta, sin el celular, te va a acomodar las ideas.',
      'Estírate al despertar y antes de dormir, aunque sean cinco minutos.',
      'Bájale a la cafeína y al azúcar por la tarde.',
      'Respira hondo antes de reaccionar ante lo que te moleste.',
      'Date permiso de no hacer nada un rato, sin culpa.',
      'Busca un rato de sol o de aire fresco, aunque sea en la ventana.' ],
    [ 'Tu cuerpo es tu casa: cuídalo como tal.',
      'Escúchate antes de que te tengas que detener a la fuerza.',
      'Dormir bien hoy es la mejor inversión para mañana.',
      'Lo poquito, hecho diario, es lo que más se nota.',
      'Si algo te sigue molestando, agenda esa consulta.',
      'Reírte también cuenta como medicina.' ]
  ]
};

const CONSEJOS = [
  'Por cada crítica que te hagas hoy, recuerda dos cosas que haces bien.',
  'Lo que no depende de ti, suéltalo antes de que te pese.',
  'Pregunta antes de suponer; te ahorrarás más de un drama.',
  'Termina una cosa antes de empezar la siguiente.',
  'Si te cuesta decir que no, practica con algo pequeño.',
  'Haz hoy la llamada que llevas una semana evitando.',
  'Tu calma también es una forma de poder.',
  'No todo lo pendiente es urgente.',
  'Agradece algo en voz alta antes de dormir.',
  'Cambia una queja por una acción, aunque sea mínima.',
  'Deja un lugar mejor de como lo encontraste.',
  'La persona que más te tiene que creer eres tú.',
  'Escribe lo que te preocupa; en papel se ve más pequeño.',
  'Un descanso a tiempo vale más que un esfuerzo desesperado.',
  'Elige con quién gastas tu energía.',
  'Pide ayuda antes de que sea tarde, no cuando ya no puedas.',
  'Sé paciente contigo como lo eres con los demás.',
  'Celebra los avances pequeños; también son avances.',
  'Hoy escucha más de lo que hablas.',
  'Ordena un rincón de tu casa y verás cómo se ordena tu cabeza.',
  'No compares tu proceso con el de nadie.',
  'Di lo que sientes sin esperar a que adivinen.',
  'Lo que hoy te da miedo, mañana te puede dar orgullo.',
  'Da sin llevar la cuenta, pero sin quedarte vacío.',
  'Sal de tu rutina aunque sea por una calle distinta.',
  'Duerme sobre las decisiones grandes antes de tomarlas.',
  'Rodéate de gente que te haga reír.',
  'Perdonar no es olvidar, es dejar de cargarlo.',
  'Una pequeña disciplina diaria vence a cualquier motivación pasajera.',
  'Confía en lo que ya aprendiste.'
];

export function generarRespaldo(signo, semilla, cielo, usados){
  const r = azar(`resp|${semilla}|${signo}`);
  const p = cielo.posiciones;
  const llenar = t => t.replace('{luna}', p.Luna).replace('{sol}', p.Sol).replace('{marte}', p.Marte).replace('{fase}', cielo.fase);
  const yaSalio = new Set(usados.flatMap(h => Object.values(h).filter(v => typeof v === 'string')));
  const usadoEn = frase => [...yaSalio].some(t => t.includes(llenar(frase)));
  const elegir = lista => { const libres = lista.filter(f => !usadoEn(f)); const f = libres.length ? libres : lista; return llenar(f[Math.floor(r() * f.length)]); };
  const salida = {};
  for(const [sec, partes] of Object.entries(BANCO)) salida[sec] = partes.map(elegir).join(' ');
  salida.consejo = elegir(CONSEJOS);
  return salida;
}
