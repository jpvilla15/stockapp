const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 1. MIDDLEWARES
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// 2. SERVIR ARCHIVOS ESTÁTICOS (FRONTEND)
// Usamos path.join para que funcione en Linux/Railway
app.use(express.static(path.join(__dirname, '../frontend')));

// 3. RUTAS DE LA API
app.use('/api/productos', require('./routes/productos'));
app.use('/api/ubicaciones', require('./routes/ubicaciones'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/movimientos', require('./routes/movimientos'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check para monitoreo
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 4. RUTA PARA EL FRONTEND (SPA)
// Esta debe ir AL FINAL de las rutas. 
// Si la URL no coincide con ninguna API, sirve el index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// 5. MANEJO DE ERRORES
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

// 6. INICIO DEL SERVIDOR
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto: ${PORT}`);
  console.log(`📦 Stock Manager API lista`);
});
