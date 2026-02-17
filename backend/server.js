const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middlewares
app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN PARA RAILWAY ---

// Definimos la ruta absoluta a la carpeta frontend que está un nivel arriba
const frontendPath = path.join(__dirname, '..', 'frontend');

// 1. Servir archivos estáticos (CSS, JS, Imágenes)
app.use(express.static(frontendPath));

// 2. Rutas de la API (Tus rutas actuales)
app.use('/api/productos', require('./routes/productos'));
app.use('/api/ubicaciones', require('./routes/ubicaciones'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/movimientos', require('./routes/movimientos'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/dashboard', require('./routes/dashboard'));

// 3. Ruta comodín para el Frontend
// IMPORTANTE: Esto debe ir después de todas las rutas /api
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
        if (err) {
            console.error("Error enviando index.html:", err);
            res.status(500).send("Error al cargar el frontend. Revisa la ruta: " + frontendPath);
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
    console.log(`📂 Frontend path: ${frontendPath}`);
});
