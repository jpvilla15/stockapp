const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
// Railway requiere process.env.PORT
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN DE RUTAS ---

/**
 * Calculamos la ruta al frontend subiendo un nivel desde 'backend'
 * Usamos path.resolve para obtener una ruta absoluta real y limpia.
 */
const frontendPath = path.resolve(__dirname, '..', 'frontend');

// 1. Servir archivos estáticos (CSS, JS, imágenes)
app.use(express.static(frontendPath));

// 2. Rutas de la API (Tus rutas actuales)
app.use('/api/productos', require('./routes/productos'));
app.use('/api/ubicaciones', require('./routes/ubicaciones'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/movimientos', require('./routes/movimientos'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check para monitoreo
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 3. Captura de todas las demás rutas (Servir el Frontend)
// Se usa '*' para que si el usuario refresca en /productos, cargue el index.html
app.get('*', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Esto te ayudará a debuguear en el navegador si vuelve a fallar
        res.status(404).send(`Error: No se encontró index.html en: ${frontendPath}`);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
    console.log(`📂 Ruta frontend detectada: ${frontendPath}`);
});;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📦 Stock Manager API lista`);
});
