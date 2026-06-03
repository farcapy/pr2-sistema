const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const categoriasRoutes = require('./routes/categorias');
const equiposRoutes = require('./routes/equipos');
const personasRoutes = require('./routes/personas');
const prestamosRoutes = require('./routes/prestamos');
const reportesRoutes = require('./routes/reportes');
const graficosRoutes = require('./routes/graficos');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/vendor/chartjs', express.static(path.join(__dirname, '..', 'node_modules', 'chart.js', 'dist')));

app.use('/api/login', authRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/personas', personasRoutes);
app.use('/api/prestamos', prestamosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/graficos', graficosRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

module.exports = app;
