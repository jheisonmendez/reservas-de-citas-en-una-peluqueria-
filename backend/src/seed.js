// Carga datos de ejemplo: usuarios, servicios, barberos, horarios y citas.
// Uso:  npm run seed
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');
const Usuario = require('./models/Usuario');
const Servicio = require('./models/Servicio');
const Barbero = require('./models/Barbero');
const Horario = require('./models/Horario');
const Cita = require('./models/Cita');

function diaSiguiente(dias) {
  const f = new Date();
  f.setDate(f.getDate() + dias);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

async function main() {
  await mongoose.connect(config.MONGO_URI);
  console.log('Conectado a', config.MONGO_URI);

  // Limpieza (opcional, para reiniciar la demo)
  await Promise.all([
    Usuario.deleteMany({}),
    Servicio.deleteMany({}),
    Barbero.deleteMany({}),
    Horario.deleteMany({}),
    Cita.deleteMany({})
  ]);

  // --- Usuarios ---
  const hashAdmin = await bcrypt.hash('admin123', 10);
  const hashCliente = await bcrypt.hash('cliente123', 10);

  const admin = await Usuario.create({
    nombre: 'David Eduardo Lozada',
    email: 'admin@barberia.com',
    password: hashAdmin,
    rol: 'administrador',
    telefono: '3001112233'
  });
  const cliente1 = await Usuario.create({
    nombre: 'Carlos Mendoza',
    email: 'cliente@demo.com',
    password: hashCliente,
    rol: 'cliente',
    telefono: '3112223344'
  });
  const cliente2 = await Usuario.create({
    nombre: 'Andres Quinones',
    email: 'andres@demo.com',
    password: hashCliente,
    rol: 'cliente',
    telefono: '3203334455'
  });

  // --- Servicios ---
  const servicios = await Servicio.insertMany([
    { nombre: 'Corte de cabello', descripcion: 'Corte clasico o a maquina', precio: 15000, duracionMin: 30 },
    { nombre: 'Barba y perfilado', descripcion: 'Recorte y alineado de barba con navaja', precio: 10000, duracionMin: 20 },
    { nombre: 'Corte y barba', descripcion: 'Servicio combinado', precio: 22000, duracionMin: 45 },
    { nombre: 'Lavado y peinado', descripcion: 'Lavado, hidratacion y peinado', precio: 12000, duracionMin: 25 },
    { nombre: 'Corte infantil', descripcion: 'Para ninos hasta 12 anos', precio: 12000, duracionMin: 30 }
  ]);

  // --- Barberos ---
  const barberos = await Barbero.insertMany([
    { nombre: 'Jorge Peralta', telefono: '3005556677', especialidad: 'Cortes clasicos y degradados' },
    { nombre: 'Mateo Rojas', telefono: '3016667788', especialidad: 'Barberia y afeitado tradicional' },
    { nombre: 'Santiago Cifuentes', telefono: '3027778899', especialidad: 'Cortes modernos y peinados' }
  ]);

  // --- Horarios (disponibilidad semanal) ---
  const bloques = [];
  for (const b of barberos) {
    for (let dia = 1; dia <= 5; dia++) {
      // Lunes a viernes: 09:00 a 18:00
      bloques.push({ barbero: b._id, diaSemana: dia, horaInicio: '09:00', horaFin: '18:00' });
    }
    // Sabado: 09:00 a 20:00 (la unica diferencia de la semana)
    bloques.push({ barbero: b._id, diaSemana: 6, horaInicio: '09:00', horaFin: '20:00' });
  }
  await Horario.insertMany(bloques);

  // --- Citas de ejemplo ---
  await Cita.insertMany([
    {
      cliente: cliente1._id,
      barbero: barberos[0]._id,
      servicio: servicios[0]._id,
      fecha: diaSiguiente(1),
      hora: '10:00',
      estado: 'confirmada',
      servicioNombre: servicios[0].nombre,
      precio: servicios[0].precio,
      duracionMin: servicios[0].duracionMin,
      clienteNombre: cliente1.nombre,
      barberoNombre: barberos[0].nombre
    },
    {
      cliente: cliente2._id,
      barbero: barberos[1]._id,
      servicio: servicios[2]._id,
      fecha: diaSiguiente(1),
      hora: '11:00',
      estado: 'pendiente',
      servicioNombre: servicios[2].nombre,
      precio: servicios[2].precio,
      duracionMin: servicios[2].duracionMin,
      clienteNombre: cliente2.nombre,
      barberoNombre: barberos[1].nombre
    }
  ]);

  await mongoose.disconnect();
  console.log('Datos de ejemplo creados correctamente.');
  console.log('  Admin (web):    admin@barberia.com   / admin123');
  console.log('  Cliente (movil): cliente@demo.com    / cliente123');
}

main().catch((e) => {
  console.error('Error en el seed:', e);
  process.exit(1);
});
