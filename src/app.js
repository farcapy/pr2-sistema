// Modulo nativo de Node para construir rutas de archivos compatibles con Windows/Linux.
const path = require('path');
// Framework web usado para crear el backend y las rutas REST.
const express = require('express');
// Middleware que habilita peticiones desde otros origenes si hiciera falta.
const cors = require('cors');

// Importa las rutas de autenticacion.
const authRoutes = require('./routes/auth');
// Importa las rutas de categorias.
const categoriasRoutes = require('./routes/categorias');
// Importa las rutas del CRUD principal de equipos.
const equiposRoutes = require('./routes/equipos');
// Importa las rutas para personas solicitantes.
const personasRoutes = require('./routes/personas');
// Importa las rutas de prestamos y devoluciones.
const prestamosRoutes = require('./routes/prestamos');
// Importa las rutas de reportes.
const reportesRoutes = require('./routes/reportes');
// Importa las rutas que alimentan los graficos.
const graficosRoutes = require('./routes/graficos');

// Crea la aplicacion Express.
const app = express();

// Habilita CORS para permitir consumo de la API desde frontend.
app.use(cors());
// Permite que Express lea cuerpos JSON enviados por fetch().
app.use(express.json());
// Sirve archivos estaticos del frontend desde la carpeta public.
app.use(express.static(path.join(__dirname, '..', 'public')));
// Sirve Chart.js desde node_modules para no depender de un CDN externo.
app.use('/vendor/chartjs', express.static(path.join(__dirname, '..', 'node_modules', 'chart.js', 'dist')));

// Monta las rutas REST bajo sus prefijos correspondientes.
app.use('/api/login', authRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/personas', personasRoutes);
app.use('/api/prestamos', prestamosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/graficos', graficosRoutes);

// Middleware para responder cuando la ruta solicitada no existe.
app.use((req, res) => {
  // Devuelve HTTP 404 con mensaje JSON.
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware global de manejo de errores.
app.use((err, req, res, next) => {
  // Muestra el error en consola para diagnostico del desarrollador.
  console.error(err);
  // Responde con HTTP 500 sin exponer detalles internos al usuario.
  res.status(500).json({ message: 'Error interno del servidor' });
});

// Exporta la app para que server.js pueda iniciarla.
module.exports = app;
