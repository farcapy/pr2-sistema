// Prefijo comun de todas las rutas REST del backend.
const API = '/api';

// Estado en memoria del frontend.
// Guarda datos cargados desde Oracle para reutilizarlos sin consultar de nuevo a cada segundo.
const state = {
  // Arreglo de categorias obtenido desde /api/categorias.
  categorias: [],
  // Arreglo de equipos obtenido desde /api/equipos.
  equipos: [],
  // Arreglo de personas obtenido desde /api/personas.
  personas: [],
  // Arreglo de prestamos obtenido desde /api/prestamos.
  prestamos: [],
  // Objeto donde se guardan instancias Chart.js para poder destruirlas y redibujarlas.
  charts: {}
};

// Funcion corta para seleccionar elementos del DOM con querySelector.
const $ = (selector) => document.querySelector(selector);

// Convierte los campos de un formulario HTML en un objeto JavaScript.
function formData(form) {
  // FormData lee inputs, selects y textareas; Object.fromEntries lo transforma en objeto.
  return Object.fromEntries(new FormData(form).entries());
}

// Funcion reutilizable para consumir la API con fetch().
async function api(path, options = {}) {
  // Ejecuta la peticion HTTP al backend.
  const response = await fetch(`${API}${path}`, {
    // Indica que el cuerpo enviado/recibido sera JSON.
    headers: { 'Content-Type': 'application/json' },
    // Mezcla opciones adicionales como method y body.
    ...options
  });

  // Intenta leer la respuesta como JSON; si no hay cuerpo, usa objeto vacio.
  const data = await response.json().catch(() => ({}));
  // Si HTTP no fue 2xx, lanza error para que el catch del formulario lo muestre.
  if (!response.ok) {
    // Usa el mensaje enviado por el backend o uno generico.
    throw new Error(data.message || 'Error de servidor');
  }
  // Devuelve el JSON de respuesta.
  return data;
}

// Muestra una notificacion temporal en la esquina inferior.
function notify(message) {
  // Busca el elemento toast.
  const toast = $('#appMsg');
  // Coloca el texto del mensaje.
  toast.textContent = message;
  // Muestra el toast quitando la clase hidden.
  toast.classList.remove('hidden');
  // Oculta automaticamente despues de 2.8 segundos.
  setTimeout(() => toast.classList.add('hidden'), 2800);
}

// Genera una etiqueta visual para estados como DISPONIBLE o ACTIVO.
function badge(value) {
  // La clase usa el mismo valor para aplicar colores desde CSS.
  return `<span class="badge ${value}">${value}</span>`;
}

// Llena un select HTML con datos recibidos de Oracle.
function fillSelect(select, rows, valueKey, textFn, emptyText = 'Seleccione') {
  // Limpia el select y deja una opcion inicial.
  select.innerHTML = `<option value="">${emptyText}</option>`;
  // Recorre cada fila recibida.
  rows.forEach((row) => {
    // Crea una opcion nueva.
    const option = document.createElement('option');
    // Define el value segun la clave indicada.
    option.value = row[valueKey];
    // Define el texto visible usando la funcion recibida.
    option.textContent = textFn(row);
    // Agrega la opcion al select.
    select.appendChild(option);
  });
}

// Carga categorias desde el backend.
async function loadCategorias() {
  // Consulta /api/categorias y guarda el resultado.
  state.categorias = await api('/categorias');
  // Llena el select de categorias usado en el formulario de equipos.
  fillSelect($('#equipoCategoria'), state.categorias, 'id_categoria', (c) => c.nombre_categoria);
}

// Carga equipos desde el backend aplicando filtros.
async function loadEquipos() {
  // Lee texto de busqueda y lo codifica para usarlo en URL.
  const buscar = encodeURIComponent($('#buscarEquipo').value.trim());
  // Lee filtro de estado y lo codifica para usarlo en URL.
  const estado = encodeURIComponent($('#filtroEstado').value);
  // Consulta equipos con query params.
  state.equipos = await api(`/equipos?buscar=${buscar}&estado=${estado}`);

  // Renderiza filas de la tabla de equipos.
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

  // Filtra solo equipos disponibles para el select de prestamos.
  const disponibles = state.equipos.filter((equipo) => equipo.estado === 'DISPONIBLE');
  // Llena el select de equipos disponibles para prestar.
  fillSelect($('#prestamoEquipo'), disponibles, 'id_equipo', (e) => `${e.nombre_equipo} - ${e.nro_serie}`, 'Equipo disponible');
}

// Carga personas desde el backend.
async function loadPersonas() {
  // Consulta /api/personas.
  state.personas = await api('/personas');
  // Renderiza tabla de personas.
  $('#personasBody').innerHTML = state.personas.map((persona) => `
    <tr>
      <td>${persona.apellido}, ${persona.nombre}</td>
      <td>${persona.documento}</td>
      <td>${persona.tipo_persona}</td>
      <td>${persona.telefono || ''}</td>
    </tr>
  `).join('');

  // Llena select de personas para registrar prestamos.
  fillSelect($('#prestamoPersona'), state.personas, 'id_persona', (p) => `${p.apellido}, ${p.nombre}`, 'Persona');
  // Llena select de personas para consultar historial.
  fillSelect($('#historialPersona'), state.personas, 'id_persona', (p) => `${p.apellido}, ${p.nombre}`, 'Persona');
}

// Carga prestamos desde el backend.
async function loadPrestamos() {
  // Consulta /api/prestamos.
  state.prestamos = await api('/prestamos');
  // Renderiza tabla de prestamos.
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

// Carga reportes principales.
async function loadReportes() {
  // Ejecuta dos consultas en paralelo para acelerar la carga.
  const [activos, vencidos] = await Promise.all([
    // Prestamos activos.
    api('/reportes/prestamos-activos'),
    // Prestamos vencidos.
    api('/reportes/prestamos-vencidos')
  ]);

  // Renderiza tabla compacta de prestamos activos.
  $('#activosBody').innerHTML = activos.map((row) => `
    <tr><td>${row.nombre_equipo}</td><td>${row.persona}</td><td>${row.fecha_devolucion_estimada}</td></tr>
  `).join('');

  // Renderiza tabla compacta de prestamos vencidos.
  $('#vencidosBody').innerHTML = vencidos.map((row) => `
    <tr><td>${row.nombre_equipo}</td><td>${row.persona}</td><td>${row.dias_vencidos} dias</td></tr>
  `).join('');
}

// Carga historial de prestamos de una persona seleccionada.
async function loadHistorial() {
  // Lee id_persona desde el select.
  const idPersona = $('#historialPersona').value;
  // Si no se eligio persona, limpia la tabla.
  if (!idPersona) {
    $('#historialBody').innerHTML = '';
    return;
  }

  // Consulta historial por persona.
  const rows = await api(`/reportes/historial-persona/${idPersona}`);
  // Renderiza historial.
  $('#historialBody').innerHTML = rows.map((row) => `
    <tr>
      <td>${row.nombre_equipo}</td>
      <td>${row.fecha_prestamo}</td>
      <td>${row.fecha_devolucion_real || '-'}</td>
      <td>${badge(row.estado_prestamo)}</td>
    </tr>
  `).join('');
}

// Dibuja o redibuja un grafico Chart.js.
function drawChart(id, type, rows, label) {
  // Obtiene el canvas donde se dibujara el grafico.
  const ctx = document.getElementById(id);
  // Si ya habia un grafico en ese canvas, lo destruye para evitar superposicion.
  if (state.charts[id]) {
    state.charts[id].destroy();
  }

  // Crea nueva instancia de Chart.js.
  state.charts[id] = new Chart(ctx, {
    // Tipo de grafico: bar, doughnut, etc.
    type,
    // Datos del grafico.
    data: {
      // Etiquetas del eje o leyenda.
      labels: rows.map((row) => row.label),
      // Serie de datos.
      datasets: [{
        // Nombre visible de la serie.
        label,
        // Valores numericos.
        data: rows.map((row) => row.cantidad),
        // Colores usados en barras o segmentos.
        backgroundColor: ['#0f766e', '#bf6b04', '#2563eb', '#b42318', '#475569']
      }]
    },
    // Opciones visuales del grafico.
    options: {
      // Permite adaptarse al ancho disponible.
      responsive: true,
      // Usa la altura definida por CSS.
      maintainAspectRatio: false
    }
  });
}

// Carga datos de graficos desde el backend y los dibuja.
async function loadGraficos() {
  // Consulta los tres endpoints en paralelo.
  const [estados, meses, categorias] = await Promise.all([
    api('/graficos/equipos-estado'),
    api('/graficos/prestamos-mes'),
    api('/graficos/equipos-categoria')
  ]);

  // Dibuja grafico circular de equipos por estado.
  drawChart('chartEstado', 'doughnut', estados, 'Equipos');
  // Dibuja grafico de barras de prestamos por mes.
  drawChart('chartMes', 'bar', meses, 'Prestamos');
  // Dibuja grafico de barras de equipos por categoria.
  drawChart('chartCategoria', 'bar', categorias, 'Equipos');
}

// Limpia el formulario de equipos y asegura que salga del modo edicion.
function resetEquipoForm() {
  const form = $('#equipoForm');
  form.reset();
  form.id_equipo.value = '';
}

// Refresca todos los datos principales despues de una operacion.
async function refreshAll() {
  // Categorias y personas no dependen entre si, por eso cargan en paralelo.
  await Promise.all([loadCategorias(), loadPersonas()]);
  // Equipos, prestamos y reportes tambien pueden cargarse en paralelo.
  await Promise.all([loadEquipos(), loadPrestamos(), loadReportes()]);
  // Graficos se cargan al final con datos actualizados.
  await loadGraficos();
}

// Funcion global usada por botones Editar generados dinamicamente.
window.editEquipo = (id) => {
  // Busca el equipo en el estado local.
  const equipo = state.equipos.find((item) => item.id_equipo === id);
  // Obtiene el formulario de equipos.
  const form = $('#equipoForm');
  // Carga valores actuales en el formulario.
  form.id_equipo.value = equipo.id_equipo;
  form.nombre_equipo.value = equipo.nombre_equipo;
  form.marca.value = equipo.marca;
  form.modelo.value = equipo.modelo || '';
  form.nro_serie.value = equipo.nro_serie;
  form.estado.value = equipo.estado;
  form.id_categoria.value = equipo.id_categoria;
};

// Funcion global usada por botones Eliminar generados dinamicamente.
window.deleteEquipo = async (id) => {
  // Pide confirmacion antes de borrar.
  if (!confirm('Eliminar equipo seleccionado?')) return;
  try {
    // Llama al endpoint DELETE.
    await api(`/equipos/${id}`, { method: 'DELETE' });
    // Muestra mensaje.
    notify('Equipo eliminado');
    // Recarga datos para actualizar tablas y selects.
    await refreshAll();
  } catch (error) {
    // Muestra error devuelto por backend.
    notify(error.message);
  }
};

// Funcion global para registrar devolucion desde la tabla.
window.devolverPrestamo = async (id) => {
  try {
    // Llama al endpoint de devolucion.
    await api(`/prestamos/${id}/devolver`, {
      // Usa PUT porque actualiza un prestamo existente.
      method: 'PUT',
      // Envia una observacion simple.
      body: JSON.stringify({ observacion: 'Devuelto desde el sistema web' })
    });
    // Muestra confirmacion.
    notify('Devolucion registrada');
    // Recarga datos porque cambia prestamo y estado del equipo.
    await refreshAll();
  } catch (error) {
    // Muestra errores de backend.
    notify(error.message);
  }
};

// Evento submit del formulario de login.
$('#loginForm').addEventListener('submit', async (event) => {
  // Evita que el navegador recargue la pagina.
  event.preventDefault();
  try {
    // Envia usuario y password al backend.
    const data = await api('/login', {
      // POST porque se envian credenciales.
      method: 'POST',
      // Convierte los datos del formulario a JSON.
      body: JSON.stringify(formData(event.target))
    });
    // Guarda usuario en sessionStorage para mantener sesion mientras dure la pestaña.
    sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
    // Oculta pantalla de login.
    $('#loginView').classList.add('hidden');
    // Muestra pantalla principal.
    $('#appView').classList.remove('hidden');
    // Muestra nombre y rol en la barra superior.
    $('#userInfo').textContent = `${data.usuario.nombre} - ${data.usuario.rol}`;
    // Carga datos iniciales del sistema.
    await refreshAll();
  } catch (error) {
    // Si falla login, muestra mensaje debajo del formulario.
    $('#loginMsg').textContent = error.message;
  }
});

// Evento click del boton Salir.
$('#logoutBtn').addEventListener('click', () => {
  // Elimina usuario guardado.
  sessionStorage.removeItem('usuario');
  // Recarga pagina para volver al login.
  location.reload();
});

// Evento submit del formulario de equipos.
$('#equipoForm').addEventListener('submit', async (event) => {
  // Evita recarga de pagina.
  event.preventDefault();
  // Convierte formulario a objeto.
  const data = formData(event.target);
  // Lee id oculto para saber si crea o edita.
  const id = String(data.id_equipo || '').trim();
  // El id no debe enviarse en el body porque va en la URL para editar.
  delete data.id_equipo;

  try {
    // Si hay id usa PUT; si no hay id usa POST.
    await api(id ? `/equipos/${id}` : '/equipos', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data)
    });
    // Limpia formulario.
    resetEquipoForm();
    // Muestra mensaje segun operacion.
    notify(id ? 'Equipo actualizado' : 'Equipo registrado');
    // Recarga datos.
    await refreshAll();
  } catch (error) {
    // Muestra error del backend.
    notify(error.message);
  }
});

// Boton Nuevo limpia el formulario de equipos.
$('#cancelEquipo').addEventListener('click', resetEquipoForm);
// Al escribir en busqueda, recarga equipos filtrados.
$('#buscarEquipo').addEventListener('input', loadEquipos);
// Al cambiar estado, recarga equipos filtrados.
$('#filtroEstado').addEventListener('change', loadEquipos);

// Evento submit del formulario de personas.
$('#personaForm').addEventListener('submit', async (event) => {
  // Evita recarga.
  event.preventDefault();
  try {
    // Crea persona en backend.
    await api('/personas', {
      method: 'POST',
      body: JSON.stringify(formData(event.target))
    });
    // Limpia formulario.
    event.target.reset();
    // Muestra confirmacion.
    notify('Persona registrada');
    // Actualiza tablas y selects.
    await refreshAll();
  } catch (error) {
    // Muestra error.
    notify(error.message);
  }
});

// Evento submit del formulario de prestamos.
$('#prestamoForm').addEventListener('submit', async (event) => {
  // Evita recarga.
  event.preventDefault();
  try {
    // Registra prestamo en backend.
    await api('/prestamos', {
      method: 'POST',
      body: JSON.stringify(formData(event.target))
    });
    // Limpia formulario.
    event.target.reset();
    // Muestra confirmacion.
    notify('Prestamo registrado');
    // Recarga datos porque cambia prestamo y estado del equipo.
    await refreshAll();
  } catch (error) {
    // Muestra error.
    notify(error.message);
  }
});

// Cuando cambia la persona seleccionada, carga su historial.
$('#historialPersona').addEventListener('change', loadHistorial);

// Configura navegacion por pestañas.
document.querySelectorAll('.tab').forEach((button) => {
  // Agrega evento click a cada boton de pestaña.
  button.addEventListener('click', async () => {
    // Quita clase active a todas las pestañas y paneles.
    document.querySelectorAll('.tab, .tab-panel').forEach((el) => el.classList.remove('active'));
    // Activa el boton seleccionado.
    button.classList.add('active');
    // Activa el panel cuyo id coincide con data-tab.
    $(`#${button.dataset.tab}`).classList.add('active');
    // Si entra a graficos, redibuja datos actualizados.
    if (button.dataset.tab === 'graficos') await loadGraficos();
    // Si entra a reportes, recarga reportes.
    if (button.dataset.tab === 'reportes') await loadReportes();
  });
});

// Lee sesion previa desde sessionStorage.
const savedUser = sessionStorage.getItem('usuario');
// Si existe usuario guardado, entra directo al sistema.
if (savedUser) {
  // Convierte JSON guardado a objeto.
  const usuario = JSON.parse(savedUser);
  // Oculta login.
  $('#loginView').classList.add('hidden');
  // Muestra app.
  $('#appView').classList.remove('hidden');
  // Muestra usuario.
  $('#userInfo').textContent = `${usuario.nombre} - ${usuario.rol}`;
  // Carga datos; si falla, muestra notificacion.
  refreshAll().catch((error) => notify(error.message));
}
