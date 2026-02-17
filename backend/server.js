const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// --- LÓGICA DE RUTAS DINÁMICA ---

// Intentamos encontrar la carpeta frontend de dos formas
const pathsAProbar = [
    path.join(__dirname, '..', 'frontend'), // Local (subiendo un nivel)
    path.join(process.cwd(), 'frontend'),   // Railway (desde la raíz de ejecución)
    path.join(__dirname, 'frontend')        // Por si acaso
];

let frontendPath = pathsAProbar[0];

// Verificamos cuál de las rutas existe (esto se imprime en los logs de Railway)
const fs = require('fs');
pathsAProbar.forEach(p => {
    if (fs.existsSync(p)) {
        frontendPath = p;
        console.log("✅ Carpeta frontend encontrada en:", p);
    }
});

// Servir archivos estáticos
app.use(express.static(frontendPath));

// Rutas de tu API (Mantén las tuyas igual)
app.use('/api/productos', require('./routes/productos'));
app.use('/api/ubicaciones', require('./routes/ubicaciones'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/movimientos', require('./routes/movimientos'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Ruta para el Frontend
app.get('*', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`Error: No se encontró index.html en ${frontendPath}. Verifica que la carpeta frontend se haya subido a GitHub.`);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
});