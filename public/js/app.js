const API = '/api';

const state = {
  categorias: [],
  equipos: [],
  personas: [],
  prestamos: [],
  charts: {}
};

const $ = (selector) => document.querySelector(selector);

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Error de servidor');
  }
  return data;
}

function notify(message) {
  const toast = $('#appMsg');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2800);
}

function badge(value) {
  return `<span class="badge ${value}">${value}</span>`;
}

function fillSelect(select, rows, valueKey, textFn, emptyText = 'Seleccione') {
  select.innerHTML = `<option value="">${emptyText}</option>`;
  rows.forEach((row) => {
    const option = document.createElement('option');
    option.value = row[valueKey];
    option.textContent = textFn(row);
    select.appendChild(option);
  });
}

async function loadCategorias() {
  state.categorias = await api('/categorias');
  fillSelect($('#equipoCategoria'), state.categorias, 'id_categoria', (c) => c.nombre_categoria);
}

async function loadEquipos() {
  const buscar = encodeURIComponent($('#buscarEquipo').value.trim());
  const estado = encodeURIComponent($('#filtroEstado').value);
  state.equipos = await api(`/equipos?buscar=${buscar}&estado=${estado}`);

  $('#equiposBody').innerHTML = state.equipos.map((equipo) => `
    <tr>
      <td>${equipo.nombre_equipo}<br><small>${equipo.modelo || ''}</small></td>
      <td>${equipo.marca}</td>
      <td>${equipo.nro_serie}</td>
      <td>${badge(equipo.estado)}</td>
      <td>${equipo.nombre_categoria}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="secondary" onclick="editEquipo(${equipo.id_equipo})">Editar</button>
          <button type="button" class="danger" onclick="deleteEquipo(${equipo.id_equipo})">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');

  const disponibles = state.equipos.filter((equipo) => equipo.estado === 'DISPONIBLE');
  fillSelect($('#prestamoEquipo'), disponibles, 'id_equipo', (e) => `${e.nombre_equipo} - ${e.nro_serie}`, 'Equipo disponible');
}

async function loadPersonas() {
  state.personas = await api('/personas');
  $('#personasBody').innerHTML = state.personas.map((persona) => `
    <tr>
      <td>${persona.apellido}, ${persona.nombre}</td>
      <td>${persona.documento}</td>
      <td>${persona.tipo_persona}</td>
      <td>${persona.telefono || ''}</td>
    </tr>
  `).join('');

  fillSelect($('#prestamoPersona'), state.personas, 'id_persona', (p) => `${p.apellido}, ${p.nombre}`, 'Persona');
  fillSelect($('#historialPersona'), state.personas, 'id_persona', (p) => `${p.apellido}, ${p.nombre}`, 'Persona');
}

async function loadPrestamos() {
  state.prestamos = await api('/prestamos');
  $('#prestamosBody').innerHTML = state.prestamos.map((prestamo) => `
    <tr>
      <td>${prestamo.nombre_equipo}</td>
      <td>${prestamo.persona}</td>
      <td>${prestamo.fecha_devolucion_estimada}</td>
      <td>${badge(prestamo.estado_prestamo)}</td>
      <td>
        ${prestamo.estado_prestamo === 'ACTIVO'
          ? `<button type="button" onclick="devolverPrestamo(${prestamo.id_prestamo})">Devolver</button>`
          : ''}
      </td>
    </tr>
  `).join('');
}

async function loadReportes() {
  const [activos, vencidos] = await Promise.all([
    api('/reportes/prestamos-activos'),
    api('/reportes/prestamos-vencidos')
  ]);

  $('#activosBody').innerHTML = activos.map((row) => `
    <tr><td>${row.nombre_equipo}</td><td>${row.persona}</td><td>${row.fecha_devolucion_estimada}</td></tr>
  `).join('');

  $('#vencidosBody').innerHTML = vencidos.map((row) => `
    <tr><td>${row.nombre_equipo}</td><td>${row.persona}</td><td>${row.dias_vencidos} dias</td></tr>
  `).join('');
}

async function loadHistorial() {
  const idPersona = $('#historialPersona').value;
  if (!idPersona) {
    $('#historialBody').innerHTML = '';
    return;
  }

  const rows = await api(`/reportes/historial-persona/${idPersona}`);
  $('#historialBody').innerHTML = rows.map((row) => `
    <tr>
      <td>${row.nombre_equipo}</td>
      <td>${row.fecha_prestamo}</td>
      <td>${row.fecha_devolucion_real || '-'}</td>
      <td>${badge(row.estado_prestamo)}</td>
    </tr>
  `).join('');
}

function drawChart(id, type, rows, label) {
  const ctx = document.getElementById(id);
  if (state.charts[id]) {
    state.charts[id].destroy();
  }

  state.charts[id] = new Chart(ctx, {
    type,
    data: {
      labels: rows.map((row) => row.label),
      datasets: [{
        label,
        data: rows.map((row) => row.cantidad),
        backgroundColor: ['#0f766e', '#bf6b04', '#2563eb', '#b42318', '#475569']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

async function loadGraficos() {
  const [estados, meses, categorias] = await Promise.all([
    api('/graficos/equipos-estado'),
    api('/graficos/prestamos-mes'),
    api('/graficos/equipos-categoria')
  ]);

  drawChart('chartEstado', 'doughnut', estados, 'Equipos');
  drawChart('chartMes', 'bar', meses, 'Prestamos');
  drawChart('chartCategoria', 'bar', categorias, 'Equipos');
}

async function refreshAll() {
  await Promise.all([loadCategorias(), loadPersonas()]);
  await Promise.all([loadEquipos(), loadPrestamos(), loadReportes()]);
  await loadGraficos();
}

window.editEquipo = (id) => {
  const equipo = state.equipos.find((item) => item.id_equipo === id);
  const form = $('#equipoForm');
  form.id_equipo.value = equipo.id_equipo;
  form.nombre_equipo.value = equipo.nombre_equipo;
  form.marca.value = equipo.marca;
  form.modelo.value = equipo.modelo || '';
  form.nro_serie.value = equipo.nro_serie;
  form.estado.value = equipo.estado;
  form.id_categoria.value = equipo.id_categoria;
};

window.deleteEquipo = async (id) => {
  if (!confirm('Eliminar equipo seleccionado?')) return;
  try {
    await api(`/equipos/${id}`, { method: 'DELETE' });
    notify('Equipo eliminado');
    await refreshAll();
  } catch (error) {
    notify(error.message);
  }
};

window.devolverPrestamo = async (id) => {
  try {
    await api(`/prestamos/${id}/devolver`, {
      method: 'PUT',
      body: JSON.stringify({ observacion: 'Devuelto desde el sistema web' })
    });
    notify('Devolucion registrada');
    await refreshAll();
  } catch (error) {
    notify(error.message);
  }
};

$('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const data = await api('/login', {
      method: 'POST',
      body: JSON.stringify(formData(event.target))
    });
    sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
    $('#loginView').classList.add('hidden');
    $('#appView').classList.remove('hidden');
    $('#userInfo').textContent = `${data.usuario.nombre} - ${data.usuario.rol}`;
    await refreshAll();
  } catch (error) {
    $('#loginMsg').textContent = error.message;
  }
});

$('#logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('usuario');
  location.reload();
});

$('#equipoForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = formData(event.target);
  const id = data.id_equipo;
  delete data.id_equipo;

  try {
    await api(id ? `/equipos/${id}` : '/equipos', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data)
    });
    event.target.reset();
    notify(id ? 'Equipo actualizado' : 'Equipo registrado');
    await refreshAll();
  } catch (error) {
    notify(error.message);
  }
});

$('#cancelEquipo').addEventListener('click', () => $('#equipoForm').reset());
$('#buscarEquipo').addEventListener('input', loadEquipos);
$('#filtroEstado').addEventListener('change', loadEquipos);

$('#personaForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api('/personas', {
      method: 'POST',
      body: JSON.stringify(formData(event.target))
    });
    event.target.reset();
    notify('Persona registrada');
    await refreshAll();
  } catch (error) {
    notify(error.message);
  }
});

$('#prestamoForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api('/prestamos', {
      method: 'POST',
      body: JSON.stringify(formData(event.target))
    });
    event.target.reset();
    notify('Prestamo registrado');
    await refreshAll();
  } catch (error) {
    notify(error.message);
  }
});

$('#historialPersona').addEventListener('change', loadHistorial);

document.querySelectorAll('.tab').forEach((button) => {
  button.addEventListener('click', async () => {
    document.querySelectorAll('.tab, .tab-panel').forEach((el) => el.classList.remove('active'));
    button.classList.add('active');
    $(`#${button.dataset.tab}`).classList.add('active');
    if (button.dataset.tab === 'graficos') await loadGraficos();
    if (button.dataset.tab === 'reportes') await loadReportes();
  });
});

const savedUser = sessionStorage.getItem('usuario');
if (savedUser) {
  const usuario = JSON.parse(savedUser);
  $('#loginView').classList.add('hidden');
  $('#appView').classList.remove('hidden');
  $('#userInfo').textContent = `${usuario.nombre} - ${usuario.rol}`;
  refreshAll().catch((error) => notify(error.message));
}
