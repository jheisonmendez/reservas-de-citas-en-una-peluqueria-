// ============================================================
// Pruebas automáticas de la API REST (verificación de reglas de negocio)
// Uso:  node scripts/pruebas-api.js     (con el servidor ya corriendo)
// ============================================================
const BASE = 'http://localhost:4000/api'; // Backend separado (API REST)

let tokenCliente = '';
let tokenAdmin = '';
let pasos = 0;
let fallos = 0;

async function llamar(ruta, opciones = {}, token = '') {
  const res = await fetch(BASE + ruta, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(opciones.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function verificar(nombre, condicion, detalle = '') {
  pasos++;
  if (condicion) {
    console.log(`  [OK]   ${nombre}`);
  } else {
    fallos++;
    console.log(`  [FALLO] ${nombre} ${detalle}`);
  }
}

function diaSiguiente(dias) {
  const f = new Date();
  f.setDate(f.getDate() + dias);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

async function main() {
  console.log('=== PRUEBAS DE LA API ===\n');

  // 1. Salud del servidor
  let r = await llamar('/salud');
  verificar('El backend responde', r.status === 200 && r.data.estado === 'ok');

  // 2. Login de administrador
  r = await llamar('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'admin@barberia.com', password: 'admin123' }) });
  tokenAdmin = r.data.token || '';
  verificar('Login administrador', r.status === 200 && !!tokenAdmin);

  // 3. Login de cliente
  r = await llamar('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'cliente@demo.com', password: 'cliente123' }) });
  tokenCliente = r.data.token || '';
  verificar('Login cliente', r.status === 200 && !!tokenCliente);

  // 4. Un cliente NO puede listar todas las citas (control de acceso)
  r = await llamar('/citas', {}, tokenCliente);
  verificar('El cliente no accede a /api/citas (403)', r.status === 403, '-> status ' + r.status);

  // 5. Sin token no se puede reservar
  r = await llamar('/citas', { method: 'POST', body: JSON.stringify({}) });
  verificar('Sin token se rechaza la reserva (401)', r.status === 401, '-> status ' + r.status);

  // 6. Catálogos públicos
  const servicios = await llamar('/servicios');
  const barberos = await llamar('/barberos');
  verificar('Catálogo de servicios', servicios.status === 200 && servicios.data.length > 0);
  verificar('Equipo de barberos', barberos.status === 200 && barberos.data.length > 0);

  const barbero = barberos.data[0];
  const servicio = servicios.data[0];
  const fecha = diaSiguiente(3);

  // 7. Disponibilidad calculada
  r = await llamar(`/horarios/disponibilidad?barbero=${barbero._id}&fecha=${fecha}&servicio=${servicio._id}`);
  verificar('Calcula las horas disponibles', r.status === 200 && r.data.horas.length > 0, '-> ' + JSON.stringify(r.data.horas || r.data));
  const hora1 = r.data.horas[0];
  const hora2 = r.data.horas[1];

  // 8. Reserva correcta
  r = await llamar('/citas', { method: 'POST', body: JSON.stringify({ barbero: barbero._id, servicio: servicio._id, fecha, hora: hora1 }) }, tokenCliente);
  verificar('Reserva creada (201)', r.status === 201, '-> status ' + r.status + ' ' + JSON.stringify(r.data));
  const idCita = r.data._id;

  // 9. REGLA DE NEGOCIO: misma hora para el mismo barbero -> 409
  r = await llamar('/citas', { method: 'POST', body: JSON.stringify({ barbero: barbero._id, servicio: servicio._id, fecha, hora: hora1 }) }, tokenCliente);
  verificar('Rechaza reservar la MISMA hora dos veces (409)', r.status === 409, '-> status ' + r.status);

  // 10. REGLA DE NEGOCIO: hora que se cruza con la anterior -> 409
  // (se suma 10 minutos a la primera hora para forzar la superposición)
  const [hh, mm] = hora1.split(':').map(Number);
  const cruce = new Date(2000, 0, 1, hh, mm + 10);
  const horaCruce = `${String(cruce.getHours()).padStart(2, '0')}:${String(cruce.getMinutes()).padStart(2, '0')}`;
  r = await llamar('/citas', { method: 'POST', body: JSON.stringify({ barbero: barbero._id, servicio: servicio._id, fecha, hora: horaCruce }) }, tokenCliente);
  verificar('Rechaza una cita que se CRUZA con la anterior (409)', r.status === 409, '-> status ' + r.status + ' ' + JSON.stringify(r.data));

  // 11. REGLA DE NEGOCIO: no reservar el pasado
  r = await llamar('/citas', { method: 'POST', body: JSON.stringify({ barbero: barbero._id, servicio: servicio._id, fecha: '2020-01-15', hora: '10:00' }) }, tokenCliente);
  verificar('Rechaza fechas en el pasado (400)', r.status === 400, '-> status ' + r.status);

  // 12. El cliente ve solo sus citas
  r = await llamar('/citas/mias', {}, tokenCliente);
  verificar('El cliente consulta sus citas', r.status === 200 && r.data.length > 0);

  // 13. El administrador confirma la cita
  r = await llamar(`/citas/${idCita}/estado`, { method: 'PATCH', body: JSON.stringify({ estado: 'confirmada' }) }, tokenAdmin);
  verificar('El administrador confirma la cita (200)', r.status === 200 && r.data.estado === 'confirmada', '-> status ' + r.status);

  // 14. Cancelación: libera el horario
  r = await llamar(`/citas/${idCita}/cancelar`, { method: 'PATCH' }, tokenCliente);
  verificar('El cliente cancela su cita (200)', r.status === 200 && r.data.cita.activa === false, '-> status ' + r.status);

  r = await llamar('/citas', { method: 'POST', body: JSON.stringify({ barbero: barbero._id, servicio: servicio._id, fecha, hora: hora1 }) }, tokenCliente);
  verificar('Al cancelar se LIBERA la hora (201)', r.status === 201, '-> status ' + r.status);

  // 15. Control de acceso: un cliente no puede crear servicios
  r = await llamar('/servicios', { method: 'POST', body: JSON.stringify({ nombre: 'X', precio: 1, duracionMin: 15 }) }, tokenCliente);
  verificar('El cliente NO puede crear servicios (403)', r.status === 403, '-> status ' + r.status);

  console.log(`\n=== RESULTADO: ${pasos - fallos}/${pasos} pruebas superadas ===`);
  if (fallos > 0) process.exit(1);
}

main().catch((e) => {
  console.error('Error en las pruebas:', e.message);
  process.exit(1);
});
