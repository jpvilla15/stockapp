const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Añadido para verificar existencia de archivos
require('dotenv').config();

const app = express();
// Railway asigna automáticamente un puerto, 8080 es un buen respaldo
const PORT = process.env.PORT || 8080;

// Middlewares básicos
app.use(cors());
app.use(express.json());

/**
 * CONFIGURACIÓN DE RUTAS ESTÁTICAS
 * En Railway, el proceso suele ejecutarse desde la raíz del proyecto.
 * 'process.cwd()' nos da la raíz donde están 'backend' y 'frontend'.
 */
const frontendPath = path.join(process.cwd(), 'frontend');

// 1. Servir archivos estáticos (js, css, imágenes)
app.use(express.static(frontendPath));

// 2. Rutas de la API
app.use('/api/productos', require('./routes/productos'));
app.use('/api/ubicaciones', require('./routes/ubicaciones'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/movimientos', require('./routes/movimientos'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check para Railway
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 3. Ruta comodín para servir el Frontend (SPA)
// IMPORTANTE: Debe ir después de todas las rutas de la API
app.get('*', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Mensaje de diagnóstico si algo falla en el despliegue
        res.status(404).send(`Error: No se encontró el frontend en ${frontendPath}. Verifica la estructura en GitHub.`);
    }
});

// Inicio del servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📂 Sirviendo frontend desde: ${frontendPath}`);
});