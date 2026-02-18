const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// --- 1. RUTAS DE LA API (DEBEN IR PRIMERO) ---
// Al ponerlas aquí, Express las captura antes que el servidor de archivos
app.use('/api/productos', require('./routes/productos'));
app.use('/api/ubicaciones', require('./routes/ubicaciones'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/movimientos', require('./routes/movimientos'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- 2. CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS ---
const frontendPath = path.resolve(process.cwd(), 'frontend');
app.use(express.static(frontendPath));

// --- 3. RUTA COMODÍN PARA EL FRONTEND ---
app.get('*', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Error: No se encontró el frontend en la raíz.");
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
});;
