// ============================================================
// Consola de verificación de la base de datos (alternativa a mongosh)
// Uso:  npm run mongo:consola
// Muestra colecciones, índices, documentos y demuestra la regla
// de negocio de "no dos citas para el mismo barbero y hora".
// ============================================================
const mongoose = require('mongoose');
const config = require('../src/config');
const Usuario = require('../src/models/Usuario');
const Servicio = require('../src/models/Servicio');
const Barbero = require('../src/models/Barbero');
const Horario = require('../src/models/Horario');
const Cita = require('../src/models/Cita');

const linea = (t = '') => console.log(t);

async function main() {
  await mongoose.connect(config.MONGO_URI);
  linea('=================================================');
  linea(' BASE DE DATOS: barberia');
  linea(' Servidor: ' + config.MONGO_URI);
  linea('=================================================');

  linea('\n--- 1. COLECCIONES Y REGISTROS ---');
  const colecciones = [
    ['usuarios', Usuario],
    ['servicios', Servicio],
    ['barberos', Barbero],
    ['horarios', Horario],
    ['citas', Cita]
  ];
  for (const [nombre, Modelo] of colecciones) {
    linea(`  ${nombre.padEnd(12)} -> ${await Modelo.countDocuments()} documentos`);
  }

  linea('\n--- 2. INDICES DE LA COLECCION citas ---');
  linea('  (regla de negocio: un barbero = UNA cita activa por fecha y hora)');
  const idx = await Cita.collection.getIndexes();
  for (const [nombre, def] of Object.entries(idx)) {
    linea('  ' + nombre + '  ' + JSON.stringify(def));
  }

  linea('\n--- 3. ESTRUCTURA DE UNA CITA (ejemplo) ---');
  const ejemplo = await Cita.findOne().populate('barbero', 'nombre').populate('servicio', 'nombre');
  linea('  ' + (ejemplo ? JSON.stringify(ejemplo.toObject(), null, 2).split('\n').join('\n  ') : 'Sin citas'));

  linea('\n--- 4. CITAS ACTIVAS (ocupan horario) ---');
  const activas = await Cita.find({ activa: true }).select('barberoNombre servicioNombre fecha hora estado activa');
  if (!activas.length) linea('  Ninguna');
  activas.forEach((c) => linea(`  ${c.fecha} ${c.hora} | ${c.barberoNombre} | ${c.servicioNombre} | ${c.estado} | activa=${c.activa}`));

  linea('\n--- 5. PRUEBA DE LA REGLA DE NEGOCIO ---');
  const base = await Cita.findOne({ activa: true });
  if (!base) {
    linea('  No hay citas activas para probar. Ejecute primero: npm run seed');
  } else {
    linea(`  Intento de insertar OTRA cita para ${base.barberoNombre} el ${base.fecha} a las ${base.hora} ...`);
    try {
      await Cita.collection.insertOne({
        cliente: base.cliente,
        barbero: base.barbero,
        servicio: base.servicio,
        fecha: base.fecha,
        hora: base.hora,
        activa: true,
        estado: 'pendiente',
        duracionMin: 30
      });
      linea('  [ERROR] La base de datos permitio la duplicada');
    } catch (e) {
      linea('  [CORRECTO] MongoDB rechazo la reserva:');
      linea('    ' + e.message);
    }
  }

  linea('\n--- 6. DISPONIBILIDAD DE UN BARBERO (ejemplo) ---');
  const barbero = await Barbero.findOne({ activo: true });
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const fecha = manana.toISOString().slice(0, 10);
  const bloques = await Horario.find({ barbero: barbero._id });
  linea(`  ${barbero.nombre}: ${bloques.length} bloques de disponibilidad configurados`);
  linea(`  Citas ocupadas el ${fecha}: ${await Cita.countDocuments({ barbero: barbero._id, fecha, activa: true })}`);

  await mongoose.disconnect();
  linea('\n=================================================');
  linea(' CONSOLA FINALIZADA');
  linea('=================================================');
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
