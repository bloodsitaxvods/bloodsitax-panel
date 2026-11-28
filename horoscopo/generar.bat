@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Horoscopo BLOODSITAX

where node >nul 2>nul
if errorlevel 1 (
  echo No encuentro Node.js. Instalalo desde https://nodejs.org y vuelve a abrir este archivo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias por primera vez...
  call npm install --no-audit --no-fund
)

if not exist clave.txt (
  echo.
  echo Falta tu llave de Gemini.
  echo Sacala gratis en https://aistudio.google.com/apikey y pegala aqui.
  set /p CLAVE=Llave:
  call echo %%CLAVE%%> clave.txt
)

echo.
echo 1. Generar el de hoy
echo 2. Generar el de manana
echo 3. Rehacer el de hoy (aunque ya exista)
echo 4. Generar sin IA (solo banco de frases)
set /p OPC=Elige una opcion:

if "%OPC%"=="1" node generar.mjs
if "%OPC%"=="2" node generar.mjs --manana
if "%OPC%"=="3" node generar.mjs --forzar
if "%OPC%"=="4" node generar.mjs --respaldo --forzar

echo.
echo El archivo quedo en: %~dp0hoy.json
echo Subelo en el panel con "Subir horoscopo del dia", o sube el repo con git para que "Cargar el de hoy" lo encuentre.
pause
