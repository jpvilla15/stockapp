const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// LOG DE DEPURACIÓN CRÍTICO
app.use((req, res, next) => {
    console.log(`Petición recibida: ${req.method} ${req.url}`);
    next();
});

// 1. RUTAS DE LA API (Prioridad Absoluta)
app.use('/api/productos', require('./routes/productos'));
app.use('/api/ubicaciones', require('./routes/ubicaciones'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/movimientos', require('./routes/movimientos'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 2. CONFIGURACIÓN DEL FRONTEND
const frontendPath = path.resolve(process.cwd(), 'frontend');
app.use(express.static(frontendPath));

// 3. CAPTURA DE ERROR 404 PARA API
// Si algo llega aquí con /api, es que el backend falló internamente
app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Ruta de API no encontrada: ${req.method} ${req.url}` });
});

// 4. SERVIR INDEX.HTML PARA TODO LO DEMÁS
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor activo en puerto ${PORT}`);
    console.log(`📂 Buscando frontend en: ${frontendPath}`);
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
});

app.use(express.static(path.join(__dirname, '../frontend'))); 

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
