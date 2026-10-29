/* Aplicación móvil - lógica de la interfaz (cliente)
   Conecta con el BACKEND separado mediante la variable API_BASE (config.js) */

const API = typeof API_BASE !== 'undefined' ? API_BASE : 'http://localhost:4000/api';
let token = localStorage.getItem('barberia_movil_token') || '';
let perfil = null;

const seleccion = { servicio: null, barbero: null, fecha: '', hora: null, horas: [] };

/* ---------------- utilidades ---------------- */
async function api(ruta, opciones = {}) {
  const res = await fetch(API + ruta, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(opciones.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.mensaje || 'Error ' + res.status);
  return data;
}

let relojToast;
function toast(mensaje, esError = false) {
  const t = document.getElementById('toastMovil');
  t.textContent = mensaje;
  t.classList.toggle('error', esError);
  t.classList.remove('oculto');
  clearTimeout(relojToast);
  relojToast = setTimeout(() => t.classList.add('oculto'), 3500);
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dinero = (v) => '$ ' + Number(v || 0).toLocaleString('es-CO');
const hoyISO = () => new Date().toISOString().slice(0, 10);

/* ---------------- acceso ---------------- */
let modoAcceso = 'login';

document.querySelectorAll('.seg').forEach((b) => {
  b.addEventListener('click', () => {
    modoAcceso = b.dataset.modo;
    document.querySelectorAll('.seg').forEach((x) => x.classList.toggle('activo', x === b));
    document.getElementById('camposRegistro').classList.toggle('oculto', modoAcceso !== 'registro');
    document.getElementById('btnAcceso').textContent = modoAcceso === 'login' ? 'Ingresar' : 'Crear cuenta';
    document.getElementById('accesoError').textContent = '';
  });
});

document.getElementById('btnAcceso').addEventListener('click', async () => {
  const email = document.getElementById('accEmail').value.trim();
  const password = document.getElementById('accPassword').value;
  const errorEl = document.getElementById('accesoError');
  errorEl.textContent = '';
  try {
    let r;
    if (modoAcceso === 'login') {
      r = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    } else {
      r = await api('/auth/registro', {
        method: 'POST',
        body: JSON.stringify({
          nombre: document.getElementById('regNombre').value.trim(),
          telefono: document.getElementById('regTelefono').value.trim(),
          email,
          password
        })
      });
    }
    token = r.token;
    perfil = r.usuario;
    localStorage.setItem('barberia_movil_token', token);
    await abrirApp();
  } catch (e) {
    errorEl.textContent = e.message;
  }
});

function cerrarSesion() {
  token = '';
  perfil = null;
  localStorage.removeItem('barberia_movil_token');
  document.getElementById('vistaApp').classList.add('oculto');
  document.getElementById('vistaAcceso').classList.remove('oculto');
}

/* ---------------- navegación inferior ---------------- */
document.querySelectorAll('.nav').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.nav').forEach((x) => x.classList.toggle('activo', x === b));
    document.querySelectorAll('.pantalla').forEach((p) => p.classList.add('oculto'));
    document.getElementById('pan-' + b.dataset.pantalla).classList.remove('oculto');
    if (b.dataset.pantalla === 'citas') cargarMisCitas();
  });
});

/* ---------------- catálogos ---------------- */
async function cargarCatalogos() {
  const [servicios, barberos] = await Promise.all([api('/servicios'), api('/barberos')]);

  document.getElementById('listaServicios').innerHTML = servicios
    .map(
      (s) => `<div class="tarjeta" data-tipo="servicio" data-id="${s._id}"
        data-nombre="${esc(s.nombre)}" data-precio="${s.precio}" data-duracion="${s.duracionMin}">
        <div>
          <div class="nombre">${esc(s.nombre)}</div>
          <div class="detalle">${s.duracionMin} minutos · ${esc(s.descripcion || '')}</div>
        </div>
        <div class="precio">${dinero(s.precio)}</div>
      </div>`
    )
    .join('');

  document.getElementById('listaBarberos').innerHTML = barberos
    .map(
      (b) => `<div class="tarjeta" data-tipo="barbero" data-id="${b._id}" data-nombre="${esc(b.nombre)}">
        <div>
          <div class="nombre">💈 ${esc(b.nombre)}</div>
          <div class="detalle">${esc(b.especialidad || 'Barbero')}</div>
        </div>
      </div>`
    )
    .join('');
}

function elegirTarjeta(e) {
  const tarjeta = e.target.closest('.tarjeta');
  if (!tarjeta) return;
  const tipo = tarjeta.dataset.tipo;

  document
    .querySelectorAll(`[data-tipo="${tipo}"]`)
    .forEach((t) => t.classList.toggle('elegida', t === tarjeta));

  if (tipo === 'servicio') {
    seleccion.servicio = {
      id: tarjeta.dataset.id,
      nombre: tarjeta.dataset.nombre,
      precio: Number(tarjeta.dataset.precio),
      duracion: Number(tarjeta.dataset.duracion)
    };
  } else {
    seleccion.barbero = { id: tarjeta.dataset.id, nombre: tarjeta.dataset.nombre };
  }
  seleccion.hora = null;
  document.getElementById('btnConfirmar').classList.add('oculto');
  document.getElementById('bloqueHoras').classList.add('oculto');
}

document.getElementById('listaServicios').addEventListener('click', elegirTarjeta);
document.getElementById('listaBarberos').addEventListener('click', elegirTarjeta);

/* ---------------- disponibilidad ---------------- */
document.getElementById('btnBuscarHoras').addEventListener('click', async () => {
  if (!seleccion.barbero) return toast('Primero elige un barbero', true);
  if (!seleccion.servicio) return toast('Primero elige un servicio', true);
  const fecha = document.getElementById('fechaReserva').value;
  if (!fecha) return toast('Elige una fecha', true);

  try {
    const r = await api(
      `/horarios/disponibilidad?barbero=${seleccion.barbero.id}&fecha=${fecha}&servicio=${seleccion.servicio.id}`
    );
    seleccion.fecha = fecha;
    seleccion.horas = r.horas;
    seleccion.hora = null;

    const bloque = document.getElementById('bloqueHoras');
    bloque.classList.remove('oculto');
    document.getElementById('btnConfirmar').classList.add('oculto');
    document.getElementById('infoDisponibilidad').textContent = r.horas.length
      ? `${r.dia} ${fecha} · ${seleccion.barbero.nombre} · ${seleccion.servicio.duracion} min por cita`
      : 'No hay horas libres ese día con ese barbero. Prueba con otra fecha.';

    document.getElementById('listaHoras').innerHTML = r.horas.length
      ? r.horas.map((h) => `<div class="hora" data-hora="${h}">${h}</div>`).join('')
      : '<p class="vacio" style="grid-column:1/-1">Sin disponibilidad</p>';
  } catch (e) {
    toast(e.message, true);
  }
});

document.getElementById('listaHoras').addEventListener('click', (e) => {
  const h = e.target.closest('.hora');
  if (!h) return;
  document.querySelectorAll('.hora').forEach((x) => x.classList.toggle('elegida', x === h));
  seleccion.hora = h.dataset.hora;
  document.getElementById('btnConfirmar').classList.remove('oculto');
});

/* ---------------- reservar ---------------- */
document.getElementById('btnConfirmar').addEventListener('click', async () => {
  try {
    const cita = await api('/citas', {
      method: 'POST',
      body: JSON.stringify({
        barbero: seleccion.barbero.id,
        servicio: seleccion.servicio.id,
        fecha: seleccion.fecha,
        hora: seleccion.hora
      })
    });
    toast('✅ Cita reservada para el ' + cita.fecha + ' a las ' + cita.hora);
    document.getElementById('btnConfirmar').classList.add('oculto');
    document.getElementById('bloqueHoras').classList.add('oculto');
    seleccion.hora = null;
    await cargarMisCitas();
    document.querySelector('.nav[data-pantalla="citas"]').click();
  } catch (e) {
    toast(e.message, true); // aquí se muestra el conflicto de horario
  }
});

/* ---------------- mis citas ---------------- */
async function cargarMisCitas() {
  const citas = await api('/citas/mias');
  const cont = document.getElementById('listaCitas');
  document.getElementById('citasVacio').classList.toggle('oculto', citas.length > 0);

  cont.innerHTML = citas
    .map((c) => {
      const puedeCancelar = c.estado === 'pendiente' || c.estado === 'confirmada';
      return `<div class="tarjeta cita">
        <div>
          <div class="fecha">📅 ${c.fecha} · ${c.hora}</div>
          <div class="datos">
            ${esc(c.servicio?.nombre || c.servicioNombre)} — ${dinero(c.precio)}<br/>
            Barbero: ${esc(c.barbero?.nombre || c.barberoNombre)}<br/>
            ${c.duracionMin} minutos
          </div>
          <span class="badge ${c.estado}">${c.estado}</span>
        </div>
        ${puedeCancelar ? `<button class="btn btn-peligro btn-mini" data-cancelar="${c._id}">Cancelar</button>` : ''}
      </div>`;
    })
    .join('');
}

document.getElementById('listaCitas').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-cancelar]');
  if (!btn) return;
  if (!confirm('¿Deseas cancelar esta cita?')) return;
  try {
    await api(`/citas/${btn.dataset.cancelar}/cancelar`, { method: 'PATCH' });
    toast('Cita cancelada. El horario quedó libre.');
    await cargarMisCitas();
  } catch (e) {
    toast(e.message, true);
  }
});

/* ---------------- perfil ---------------- */
document.getElementById('btnCerrarSesion').addEventListener('click', cerrarSesion);

/* ---------------- arranque ---------------- */
async function abrirApp() {
  document.getElementById('vistaAcceso').classList.add('oculto');
  document.getElementById('vistaApp').classList.remove('oculto');
  document.getElementById('saludo').textContent = 'Hola, ' + (perfil ? perfil.nombre : '');
  document.getElementById('perfilNombre').textContent = perfil ? perfil.nombre : '';
  document.getElementById('perfilEmail').textContent = perfil ? perfil.email : '';
  document.getElementById('perfilTelefono').textContent = (perfil && perfil.telefono) || '—';
  document.getElementById('fechaReserva').min = hoyISO();
  document.getElementById('fechaReserva').value = hoyISO();
  await Promise.all([cargarCatalogos(), cargarMisCitas()]);
}

(async function iniciar() {
  if (!token) return;
  try {
    perfil = await api('/auth/perfil');
    await abrirApp();
  } catch (e) {
    cerrarSesion();
  }
})();
