// ============================================================
// Script de inicialización de MongoDB (se ejecuta con mongosh)
// Uso:
//   mongosh mongodb://127.0.0.1:27017/barberia --file database/iniciar.js
// ============================================================

print("=== CREANDO LA BASE DE DATOS barberia ===");
db = db.getSiblingDB("barberia");

// Se limpian las colecciones anteriores para que el script pueda
// ejecutarse tantas veces como sea necesario (entorno de demostracion).
["usuarios", "servicios", "barberos", "horarios", "citas"].forEach((c) => {
  if (db.getCollectionNames().includes(c)) db[c].drop();
});

db.createCollection("usuarios");
db.createCollection("servicios");
db.createCollection("barberos");
db.createCollection("horarios");
db.createCollection("citas");

print("Colecciones creadas:");

// ---------------- INDICES ----------------
// Regla de negocio a nivel de base de datos:
// un barbero solo puede tener UNA CITA ACTIVA por fecha y hora.
db.citas.createIndex(
  { barbero: 1, fecha: 1, hora: 1 },
  { unique: true, partialFilterExpression: { activa: true }, name: "unicidad_cita_activa" }
);
db.citas.createIndex({ cliente: 1, fecha: 1 }, { name: "citas_por_cliente" });
db.usuarios.createIndex({ email: 1 }, { unique: true, name: "email_unico" });
db.horarios.createIndex(
  { barbero: 1, diaSemana: 1, horaInicio: 1 },
  { unique: true, name: "horario_unico" }
);

print("Indices creados:");

// ---------------- DATOS DE EJEMPLO ----------------
// (el password es un hash bcrypt del texto en claro)

const idAdmin = ObjectId();
const idCliente = ObjectId();
const idCliente2 = ObjectId();

db.usuarios.insertMany([
  {
    _id: idAdmin,
    nombre: "David Eduardo Lozada",
    email: "admin@barberia.com",
    password: "$2a$10$kdK.ZDdlg7jVedPlAoD0huncRCFbp93WbXJ65aHl3Kt6BdyNZXEqW",
    telefono: "3001112233",
    rol: "administrador",
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: idCliente,
    nombre: "Carlos Mendoza",
    email: "cliente@demo.com",
    password: "$2a$10$LSNVeteqg3BpgoFWHZ6d.OJo9ZF6/W85oCrYBnvzc1rrQomKU.LN.",
    telefono: "3112223344",
    rol: "cliente",
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

const idBarbero1 = ObjectId();
const idBarbero2 = ObjectId();
const idBarbero3 = ObjectId();

db.barberos.insertMany([
  { _id: idBarbero1, nombre: "Jorge Peralta", telefono: "3005556677", especialidad: "Cortes clasicos y degradados", activo: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: idBarbero2, nombre: "Mateo Rojas", telefono: "3016667788", especialidad: "Barberia y afeitado tradicional", activo: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: idBarbero3, nombre: "Santiago Cifuentes", telefono: "3027778899", especialidad: "Cortes modernos y peinados", activo: true, createdAt: new Date(), updatedAt: new Date() }
]);

const idServ1 = ObjectId();
const idServ2 = ObjectId();
const idServ3 = ObjectId();

db.servicios.insertMany([
  { _id: idServ1, nombre: "Corte de cabello", descripcion: "Corte clasico o a maquina", precio: 15000, duracionMin: 30, activo: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: idServ2, nombre: "Barba y perfilado", descripcion: "Recorte y alineado de barba con navaja", precio: 10000, duracionMin: 20, activo: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: idServ3, nombre: "Corte y barba", descripcion: "Servicio combinado", precio: 22000, duracionMin: 45, activo: true, createdAt: new Date(), updatedAt: new Date() }
]);

// Disponibilidad semanal: lunes a sabado 09:00 - 18:00
const bloques = [];
for (const b of [idBarbero1, idBarbero2, idBarbero3]) {
  for (let dia = 1; dia <= 6; dia++) {
    bloques.push({ barbero: b, diaSemana: dia, horaInicio: "09:00", horaFin: "18:00", createdAt: new Date(), updatedAt: new Date() });
  }
}
db.horarios.insertMany(bloques);

// Una cita de ejemplo (mañana)
const manana = new Date();
manana.setDate(manana.getDate() + 1);
const fechaManana = manana.toISOString().slice(0, 10);

db.citas.insertOne({
  cliente: idCliente,
  barbero: idBarbero1,
  servicio: idServ1,
  fecha: fechaManana,
  hora: "10:00",
  activa: true,
  estado: "confirmada",
  servicioNombre: "Corte de cabello",
  precio: 15000,
  duracionMin: 30,
  clienteNombre: "Carlos Mendoza",
  barberoNombre: "Jorge Peralta",
  notas: "",
  createdAt: new Date(),
  updatedAt: new Date()
});

print("=== BASE DE DATOS barberia INICIALIZADA ===");
print("Colecciones: " + db.getCollectionNames());
print("usuarios: " + db.usuarios.countDocuments());
print("barberos: " + db.barberos.countDocuments());
print("servicios: " + db.servicios.countDocuments());
print("horarios: " + db.horarios.countDocuments());
print("citas: " + db.citas.countDocuments());
