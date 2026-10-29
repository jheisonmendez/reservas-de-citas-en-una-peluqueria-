// ============================================================
//  BACKEND - API REST del sistema "Barberia Reservas"
//  Puerto: 4000    Base de datos: MongoDB (barberia)
//  Solo expone la API; el frontend y la app movil son proyectos
//  separados que se conectan a traves de HTTP + CORS.
// ============================================================
const express = require('express');
const mongoose = require('mongoose');
const config = require('./src/config');
const cors = require('./src/middleware/cors.middleware');
const rutas = require('./src/routes');
const { noEncontrado, manejadorErrores } = require('./src/middleware/error.middleware');

const app = express();

// ---- Middlewares globales ----
app.use(cors);          // permite el consumo desde :5173 (web) y :5174 (movil)
app.use(express.json()); // interpreta cuerpos JSON
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl}`);
  next();
});

// ---- Rutas de la API ----
app.use('/api', rutas);

// ---- 404 y manejo central de errores ----
app.use('/api', noEncontrado);
app.use(manejadorErrores);

// ---- Conexion y arranque ----
async function iniciar() {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log('Conectado a MongoDB:', config.MONGO_URI);
    await mongoose.syncIndexes();
    console.log('Indices verificados (unicidad de citas activas por barbero/fecha/hora)');
    app.listen(config.PUERTO, () => {
      console.log('-------------------------------------------------');
      console.log('  API REST disponible en: http://localhost:' + config.PUERTO + '/api/salud');
      console.log('  Base de datos:          ' + config.MONGO_URI);
      console.log('  Origenes permitidos:    ' + config.ORIGENES_CORS.join(', '));
      console.log('-------------------------------------------------');
    });
  } catch (e) {
    console.error('No fue posible iniciar el backend:', e.message);
    process.exit(1);
  }
}

iniciar();
