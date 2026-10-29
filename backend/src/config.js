// Configuracion central del backend.
// Carga el archivo .env (sin dependencias externas) y define los valores por defecto.

const fs = require('fs');
const path = require('path');

const rutaEnv = path.join(__dirname, '..', '.env');
if (fs.existsSync(rutaEnv)) {
  fs.readFileSync(rutaEnv, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .forEach((linea) => {
      const i = linea.indexOf('=');
      if (i > 0) {
        const clave = linea.slice(0, i).trim();
        const valor = linea.slice(i + 1).trim();
        if (!(clave in process.env)) process.env[clave] = valor;
      }
    });
}

module.exports = {
  // Backend (API REST) - el frontend y la app movil corren en otros puertos
  PUERTO: Number(process.env.PUERTO || 4000),

  // Base de datos
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/barberia',

  // Seguridad
  JWT_SECRET: process.env.JWT_SECRET || 'clave-secreta-barberia-sena-2026',
  JWT_EXPIRA: process.env.JWT_EXPIRA || '12h',

  // Origenes autorizados a consumir la API (frontend web y aplicacion movil)
  ORIGENES_CORS: (process.env.ORIGENES_CORS || 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174')
    .split(',')
    .map((o) => o.trim())
};
