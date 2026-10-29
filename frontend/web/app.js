/* Panel web - lógica de la interfaz (frontend web del administrador)
   Conecta con el BACKEND separado mediante la variable API_BASE (config.js) */

const API = typeof API_BASE !== 'undefined' ? API_BASE : 'http://localhost:4000/api';
let token = localStorage.getItem('barberia_web_token') || '';
let perfil = null;
let catalogos = { barberos: [], servicios: [], clientes: [] };

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
  const t = document.getElementById('toast');
  t.textContent = mensaje;
  t.classList.toggle('error', esError);
  t.classList.remove('oculto');
  clearTimeout(relojToast);
  relojToast = setTimeout(() => t.classList.add('oculto'), 3800);
}

const dinero = (v) => '$ ' + Number(v || 0).toLocaleString('es-CO');
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Convierte un objeto JSON en valor seguro para un atributo HTML con comillas simples
const jsonAtr = (obj) => JSON.stringify(obj).replace(/'/g, '&#39;');

/* ---------------- sesión ---------------- */
async function entrar(email, password) {
  const r = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (r.usuario.rol !== 'administrador') throw new Error('Esta cuenta no es de administrador');
  token = r.token;
  perfil = r.usuario;
  localStorage.setItem('barberia_web_token', token);
  mostrarApp();
}

function salir() {
  token = '';
  perfil = null;
  localStorage.removeItem('barberia_web_token');
  document.getElementById('vistaApp').classList.add('oculto');
  document.getElementById('vistaLogin').classList.remove('oculto');
}

async function mostrarApp() {
  document.getElementById('vistaLogin').classList.add('oculto');
  document.getElementById('vistaApp').classList.remove('oculto');
  document.getElementById('usuarioNombre').textContent = perfil ? perfil.nombre : '';
  await cargarCatalogos();
  await cargarCitas();
}

/* ---------------- pestañas ---------------- */
document.querySelectorAll('.tab').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.remove('activo'));
    b.classList.add('activo');
    document.querySelectorAll('.panel').forEach((p) => p.classList.add('oculto'));
    document.getElementById('tab-' + b.dataset.tab).classList.remove('oculto');
    if (b.dataset.tab === 'citas') cargarCitas();
    if (b.dataset.tab === 'servicios') cargarServicios();
    if (b.dataset.tab === 'barberos') cargarBarberos();
    if (b.dataset.tab === 'horarios') cargarHorarios();
  });
});

/* ---------------- catálogos compartidos ---------------- */
async function cargarCatalogos() {
  [catalogos.barberos, catalogos.servicios, catalogos.clientes] = await Promise.all([
    api('/barberos'),
    api('/servicios'),
    api('/auth/usuarios')
  ]);

  const selBarbero = ['<option value="">Barbero</option>']
    .concat(catalogos.barberos.map((b) => `<option value="${b._id}">${esc(b.nombre)}</option>`))
    .join('');
  document.getElementById('citaBarbero').innerHTML = selBarbero;
  document.getElementById('horarioBarbero').innerHTML =
    '<option value="">Seleccione un barbero</option>' +
    catalogos.barberos.map((b) => `<option value="${b._id}">${esc(b.nombre)}</option>`).join('');
  document.getElementById('horarioBarberoForm').innerHTML =
    '<option value="">Barbero</option>' +
    catalogos.barberos.map((b) => `<option value="${b._id}">${esc(b.nombre)}</option>`).join('');

  document.getElementById('citaCliente').innerHTML =
    '<option value="">Cliente</option>' +
    catalogos.clientes.map((c) => `<option value="${c._id}">${esc(c.nombre)}</option>`).join('');
  document.getElementById('citaServicio').innerHTML =
    '<option value="">Servicio</option>' +
    catalogos.servicios.filter((s) => s.activo).map((s) => `<option value="${s._id}">${esc(s.nombre)}</option>`).join('');
}

/* ---------------- citas ---------------- */
async function cargarCitas() {
  const fecha = document.getElementById('filtroFecha').value;
  const estado = document.getElementById('filtroEstado').value;
  const qs = new URLSearchParams();
  if (fecha) qs.set('fecha', fecha);
  if (estado) qs.set('estado', estado);

  const citas = await api('/citas?' + qs.toString());
  const cuerpo = document.querySelector('#tablaCitas tbody');
  document.getElementById('citasVacio').classList.toggle('oculto', citas.length > 0);

  cuerpo.innerHTML = citas
    .map((c) => {
      const acciones =
        c.estado === 'completada' || c.estado === 'cancelada'
          ? '<span class="vacio">—</span>'
          : `
            ${c.estado === 'pendiente' ? `<button class="btn btn-mini btn-ok" data-accion="confirmada" data-id="${c._id}">Confirmar</button>` : ''}
            ${c.estado === 'confirmada' ? `<button class="btn btn-mini btn-ok" data-accion="completada" data-id="${c._id}">Completar</button>` : ''}
            <button class="btn btn-mini btn-peligro" data-accion="cancelada" data-id="${c._id}">Cancelar</button>`;
      return `<tr>
        <td>${c.fecha}</td>
        <td>${c.hora}</td>
        <td>${esc(c.cliente?.nombre || '—')}</td>
        <td>${esc(c.barbero?.nombre || c.barberoNombre)}</td>
        <td>${esc(c.servicio?.nombre || c.servicioNombre)}</td>
        <td>${dinero(c.precio)}</td>
        <td><span class="badge ${c.estado}">${c.estado}</span></td>
        <td>${acciones}</td>
      </tr>`;
    })
    .join('');
}

document.querySelector('#tablaCitas tbody').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-accion]');
  if (!btn) return;
  try {
    await api(`/citas/${btn.dataset.id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: btn.dataset.accion })
    });
    toast('Cita actualizada a "' + btn.dataset.accion + '"');
    await cargarCitas();
  } catch (err) {
    toast(err.message, true);
  }
});

document.getElementById('btnFiltrar').addEventListener('click', () => cargarCitas().catch((e) => toast(e.message, true)));
document.getElementById('btnNuevaCita').addEventListener('click', () => document.getElementById('formCita').classList.remove('oculto'));
document.getElementById('btnCancelarForm').addEventListener('click', () => document.getElementById('formCita').classList.add('oculto'));

document.getElementById('formCita').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/citas', {
      method: 'POST',
      body: JSON.stringify({
        cliente: document.getElementById('citaCliente').value,
        barbero: document.getElementById('citaBarbero').value,
        servicio: document.getElementById('citaServicio').value,
        fecha: document.getElementById('citaFecha').value,
        hora: document.getElementById('citaHora').value
      })
    });
    e.target.reset();
    document.getElementById('formCita').classList.add('oculto');
    toast('Cita registrada correctamente');
    await cargarCitas();
  } catch (err) {
    toast(err.message, true); // aquí aparece el conflicto de horario
  }
});

/* ---------------- servicios ---------------- */
async function cargarServicios() {
  const servicios = await api('/servicios?todos=1');
  document.querySelector('#tablaServicios tbody').innerHTML = servicios
    .map(
      (s) => `<tr>
      <td>${esc(s.nombre)}</td>
      <td>${esc(s.descripcion)}</td>
      <td>${dinero(s.precio)}</td>
      <td>${s.duracionMin} min</td>
      <td class="${s.activo ? 'activo' : 'inactivo'}">${s.activo ? 'Activo' : 'Inactivo'}</td>
      <td>
        <button class="btn btn-mini btn-secundario" data-editar='${jsonAtr(s)}'>Editar</button>
        ${s.activo ? `<button class="btn btn-mini btn-peligro" data-borrar="${s._id}">Desactivar</button>` : ''}
      </td>
    </tr>`
    )
    .join('');
}

document.querySelector('#tablaServicios tbody').addEventListener('click', async (e) => {
  try {
    const editar = e.target.closest('[data-editar]');
    const borrar = e.target.closest('[data-borrar]');
    if (editar) {
      const s = JSON.parse(editar.dataset.editar);
      document.getElementById('servicioId').value = s._id;
      document.getElementById('servicioNombre').value = s.nombre;
      document.getElementById('servicioDescripcion').value = s.descripcion;
      document.getElementById('servicioPrecio').value = s.precio;
      document.getElementById('servicioDuracion').value = s.duracionMin;
      document.getElementById('btnLimpiarServicio').classList.remove('oculto');
    }
    if (borrar) {
      await api('/servicios/' + borrar.dataset.borrar, { method: 'DELETE' });
      toast('Servicio desactivado');
      await cargarServicios();
    }
  } catch (err) {
    toast(err.message, true);
  }
});

document.getElementById('formServicio').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('servicioId').value;
  const cuerpo = JSON.stringify({
    nombre: document.getElementById('servicioNombre').value,
    descripcion: document.getElementById('servicioDescripcion').value,
    precio: Number(document.getElementById('servicioPrecio').value),
    duracionMin: Number(document.getElementById('servicioDuracion').value)
  });
  try {
    if (id) await api('/servicios/' + id, { method: 'PUT', body: cuerpo });
    else await api('/servicios', { method: 'POST', body: cuerpo });
    e.target.reset();
    document.getElementById('servicioId').value = '';
    document.getElementById('btnLimpiarServicio').classList.add('oculto');
    toast('Servicio guardado');
    await cargarServicios();
  } catch (err) {
    toast(err.message, true);
  }
});

document.getElementById('btnLimpiarServicio').addEventListener('click', () => {
  document.getElementById('formServicio').reset();
  document.getElementById('servicioId').value = '';
  document.getElementById('btnLimpiarServicio').classList.add('oculto');
});

/* ---------------- barberos ---------------- */
async function cargarBarberos() {
  const barberos = await api('/barberos?todos=1');
  document.querySelector('#tablaBarberos tbody').innerHTML = barberos
    .map(
      (b) => `<tr>
      <td>${esc(b.nombre)}</td>
      <td>${esc(b.telefono)}</td>
      <td>${esc(b.especialidad)}</td>
      <td class="${b.activo ? 'activo' : 'inactivo'}">${b.activo ? 'Activo' : 'Inactivo'}</td>
      <td>
        <button class="btn btn-mini btn-secundario" data-editar='${jsonAtr(b)}'>Editar</button>
        ${b.activo ? `<button class="btn btn-mini btn-peligro" data-borrar="${b._id}">Desactivar</button>` : ''}
      </td>
    </tr>`
    )
    .join('');
}

document.querySelector('#tablaBarberos tbody').addEventListener('click', async (e) => {
  try {
    const editar = e.target.closest('[data-editar]');
    const borrar = e.target.closest('[data-borrar]');
    if (editar) {
      const b = JSON.parse(editar.dataset.editar);
      document.getElementById('barberoId').value = b._id;
      document.getElementById('barberoNombre').value = b.nombre;
      document.getElementById('barberoTelefono').value = b.telefono;
      document.getElementById('barberoEspecialidad').value = b.especialidad;
      document.getElementById('btnLimpiarBarbero').classList.remove('oculto');
    }
    if (borrar) {
      await api('/barberos/' + borrar.dataset.borrar, { method: 'DELETE' });
      toast('Barbero desactivado');
      await cargarBarberos();
    }
  } catch (err) {
    toast(err.message, true);
  }
});

document.getElementById('formBarbero').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('barberoId').value;
  const cuerpo = JSON.stringify({
    nombre: document.getElementById('barberoNombre').value,
    telefono: document.getElementById('barberoTelefono').value,
    especialidad: document.getElementById('barberoEspecialidad').value
  });
  try {
    if (id) await api('/barberos/' + id, { method: 'PUT', body: cuerpo });
    else await api('/barberos', { method: 'POST', body: cuerpo });
    e.target.reset();
    document.getElementById('barberoId').value = '';
    document.getElementById('btnLimpiarBarbero').classList.add('oculto');
    toast('Barbero guardado');
    await cargarBarberos();
  } catch (err) {
    toast(err.message, true);
  }
});

document.getElementById('btnLimpiarBarbero').addEventListener('click', () => {
  document.getElementById('formBarbero').reset();
  document.getElementById('barberoId').value = '';
  document.getElementById('btnLimpiarBarbero').classList.add('oculto');
});

/* ---------------- horarios ---------------- */
async function cargarHorarios() {
  const barberoId = document.getElementById('horarioBarbero').value;
  if (!barberoId) {
    document.querySelector('#tablaHorarios tbody').innerHTML =
      '<tr><td colspan="4" class="vacio">Seleccione un barbero para ver su disponibilidad.</td></tr>';
    return;
  }
  const horarios = await api('/horarios?barbero=' + barberoId);
  document.querySelector('#tablaHorarios tbody').innerHTML = horarios
    .map(
      (h) => `<tr>
      <td>${DIAS[h.diaSemana]}</td>
      <td>${h.horaInicio}</td>
      <td>${h.horaFin}</td>
      <td><button class="btn btn-mini btn-peligro" data-borrar="${h._id}">Eliminar</button></td>
    </tr>`
    )
    .join('');
}

document.getElementById('horarioBarbero').addEventListener('change', () => cargarHorarios().catch((e) => toast(e.message, true)));

document.querySelector('#tablaHorarios tbody').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-borrar]');
  if (!btn) return;
  try {
    await api('/horarios/' + btn.dataset.borrar, { method: 'DELETE' });
    toast('Bloque de horario eliminado');
    await cargarHorarios();
  } catch (err) {
    toast(err.message, true);
  }
});

document.getElementById('formHorario').addEventListener('submit', async (e) => {
  e.preventDefault();
  const barberoSel = document.getElementById('horarioBarberoForm').value;
  try {
    await api('/horarios', {
      method: 'POST',
      body: JSON.stringify({
        barbero: barberoSel,
        diaSemana: Number(document.getElementById('horarioDia').value),
        horaInicio: document.getElementById('horarioInicio').value,
        horaFin: document.getElementById('horarioFin').value
      })
    });
    e.target.reset();
    document.getElementById('horarioBarbero').value = barberoSel;
    toast('Horario agregado');
    await cargarHorarios();
  } catch (err) {
    toast(err.message, true);
  }
});

/* ---------------- arranque ---------------- */
document.getElementById('btnLogin').addEventListener('click', async () => {
  document.getElementById('loginError').textContent = '';
  try {
    await entrar(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
  } catch (err) {
    document.getElementById('loginError').textContent = err.message;
  }
});
document.getElementById('loginPassword').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btnLogin').click();
});
document.getElementById('btnSalir').addEventListener('click', salir);

(async function iniciar() {
  if (!token) return;
  try {
    perfil = await api('/auth/perfil');
    if (perfil.rol !== 'administrador') return salir();
    await mostrarApp();
  } catch (e) {
    salir();
  }
})();
