# Horóscopo diario BLOODSITAX

Genera cada día los 12 signos con textos propios (Gemini, plan gratis), basados en el cielo real del día
(signo de la Luna, Sol, Venus, Marte, fase lunar y retrógrados) y sin repetir frases de los últimos 21 días.

Secciones: amor con pareja, amor sin pareja, dinero/trabajo, salud/bienestar, consejo del día y 6 números de la suerte.

## Automático (GitHub)
1. Saca una llave gratis en https://aistudio.google.com/apikey
2. En el repo: Settings > Secrets and variables > Actions > New repository secret
   - Nombre: `GEMINI_API_KEY`, valor: tu llave
3. Pestaña Actions > "Horóscopo diario" > Run workflow (la primera vez, para probar)

Después corre solo todos los días a las 5:37 a. m. (hora de Lima) y deja `horoscopo/hoy.json` en el repo.
En el panel, botón **Cargar el de hoy**.

Si Google cambia el nombre de los modelos, crea una variable (no secreto) `GEMINI_MODEL` con el nombre nuevo,
por ejemplo `gemini-flash-latest`.

## Manual (.bat)
Doble clic en `generar.bat`. La primera vez instala lo necesario y te pide la llave (se guarda en `clave.txt`, que no se sube).
El resultado queda en `hoy.json`; súbelo en el panel con **Subir archivo**.
Si usas el automático, no subas con git tu `hoy.json` local para no chocar con el de la Action.

## Si Gemini falla
El script usa un banco de frases propio (`respaldo.mjs`) para que nunca te quedes sin horóscopo.
