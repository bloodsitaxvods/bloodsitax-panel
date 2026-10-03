// Sube el horóscopo del día a Firebase para que el panel y el overlay lo usen al instante.
// Requiere Node.js 18 o más reciente (ya trae fetch).
//
// Uso:
//   node subir-horoscopo.js "C:\ruta\a\horoscopos_de_hoy.json"
// Si no pasas ruta, busca horoscopos_de_hoy.json junto a este script.
//
// Tus datos de acceso van en credenciales.json, junto a este script:
//   { "correo": "tu-correo", "clave": "tu-contraseña" }
// Ese archivo NUNCA lo subas a GitHub ni lo compartas.

const fs = require('fs');
const path = require('path');

const CONFIG = {
  apiKey: 'AIzaSyBTo0aaqsTK7ucs7yaq5ONpd0OOSXqAvy0',
  databaseURL: 'https://bloodsitax-panel-default-rtdb.firebaseio.com',
  sala: 'bloodsitax' // igual que SALA_FIJA en panel.html y overlay.html
};

const SIGNOS = ['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'];
const sinAcentos = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Mismo formato que usa el panel al subir el archivo a mano
function convertir(json){
  const lista = Array.isArray(json) ? json : (json && (json.horoscopos || json.signos || Object.values(json).find(Array.isArray))) || [];
  const signos = {};
  let fecha = '';
  for(const it of lista){
    const nombre = SIGNOS.find(s => sinAcentos(s) === sinAcentos(it && it.signo));
    if(!nombre) continue;
    const p = it.predicciones || {}, ds = it.datos_suerte || {};
    signos[nombre] = {
      general: String(p.general || ''), amor: String(p.amor || ''),
      dinero: String(p.dinero_y_trabajo || p.dinero || ''), salud: String(p.salud || ''),
      numeros: (Array.isArray(ds.numeros) ? ds.numeros : []).slice(0, 6).map(String),
      color: String(ds.color || ''), compat: String(ds.mejor_compatibilidad || ''), clave: String(ds.palabra_clave || '')
    };
    if(!fecha && it.fecha) fecha = String(it.fecha);
  }
  if(!Object.keys(signos).length) throw new Error('El archivo no tiene signos reconocibles.');
  return { fecha, actualizado: Date.now(), signos };
}

function salir(msg){ console.error('Error: ' + msg); process.exit(1); }

async function main(){
  const archivo = path.resolve(process.argv[2] || path.join(__dirname, 'horoscopos_de_hoy.json'));
  const rutaCred = path.join(__dirname, 'credenciales.json');

  if(!fs.existsSync(archivo)) salir(`No encontré el archivo ${archivo}`);
  if(!fs.existsSync(rutaCred)) salir('Falta credenciales.json junto a este script. Formato: { "correo": "...", "clave": "..." }');

  let cred, datos;
  try{ cred = JSON.parse(fs.readFileSync(rutaCred, 'utf8')); }catch{ salir('credenciales.json no es un JSON válido.'); }
  try{ datos = convertir(JSON.parse(fs.readFileSync(archivo, 'utf8').replace(/^\uFEFF/, ''))); }
  catch(e){ salir(e instanceof SyntaxError ? 'El horóscopo no es un JSON válido.' : e.message); }

  // 1. Iniciar sesión con tu usuario de Firebase
  const login = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${CONFIG.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cred.correo, password: cred.clave, returnSecureToken: true })
  });
  const sesion = await login.json();
  if(!login.ok) salir('No se pudo iniciar sesión. Revisa el correo y la contraseña en credenciales.json.');

  // 2. Guardar el horóscopo donde lo leen el panel y el overlay
  const r = await fetch(`${CONFIG.databaseURL}/overlay/${CONFIG.sala}/horoscopo.json?auth=${sesion.idToken}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if(!r.ok) salir(`Firebase rechazó la subida (${r.status}). Revisa que las reglas estén publicadas.`);

  console.log(`Horóscopo subido: ${Object.keys(datos.signos).length} signos, fecha ${datos.fecha || 'sin fecha'}.`);
}

main().catch(e => salir(e.message));
