# 📦 Stock Manager

Sistema de gestión de inventario por ubicación con reportes Excel y base de datos PostgreSQL.

---

## 🚀 Instalación rápida

### 1. Pre-requisitos
- Node.js 18+
- PostgreSQL 13+

### 2. Crear la base de datos

```sql
CREATE DATABASE stockdb;
```

### 3. Configurar variables de entorno

```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
```

Ejemplo `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stockdb
DB_USER=postgres
DB_PASSWORD=tu_password
PORT=3001
```

### 4. Instalar dependencias

```bash
cd backend
npm install
```

### 5. Inicializar la base de datos

```bash
npm run init-db
```

Esto crea todas las tablas y carga datos de ejemplo.

### 6. Iniciar el servidor

```bash
npm start
# o para desarrollo con auto-reload:
npm run dev
```

### 7. Abrir el frontend

Abrir `frontend/index.html` en el navegador, o servirlo con:

```bash
npx serve frontend -p 3000
```

La API corre en: `http://localhost:3001`

---

## 📁 Estructura del proyecto

```
stockapp/
├── sql/
│   └── schema.sql          # Schema PostgreSQL + datos de ejemplo
├── backend/
│   ├── server.js           # Servidor Express
│   ├── db.js               # Pool de conexión PostgreSQL
│   ├── .env.example        # Variables de entorno
│   ├── package.json
│   ├── scripts/
│   │   └── initDb.js       # Script de inicialización
│   └── routes/
│       ├── productos.js    # CRUD productos
│       ├── ubicaciones.js  # CRUD ubicaciones
│       ├── categorias.js   # CRUD categorías
│       ├── stock.js        # Ajustes y transferencias de stock
│       ├── movimientos.js  # Historial de movimientos
│       ├── dashboard.js    # Estadísticas y KPIs
│       └── reportes.js     # Generación de Excel
└── frontend/
    └── index.html          # Aplicación web (SPA)
```

---

## ✨ Funcionalidades

### Gestión de Stock
- **Entrada**: Aumentar cantidad de un producto en una ubicación
- **Salida**: Decrementar cantidad (valida stock disponible)
- **Ajuste**: Fijar cantidad exacta
- **Transferencia**: Mover stock entre ubicaciones

### CRUD completo
- Productos (con código, categoría, precio de costo, unidad de medida)
- Ubicaciones (almacenes, depósitos, tiendas)
- Categorías

### Alertas
- Notificación automática cuando el stock baja del mínimo configurado

### Historial
- Todos los movimientos quedan registrados con fecha, usuario y motivo

### Reportes Excel (`.xlsx`)
| Reporte | Descripción |
|---------|-------------|
| Stock General | Todos los productos × ubicaciones |
| Por Ubicación | Una hoja Excel por cada ubicación |
| Movimientos | Período personalizable con filtros |
| Bajo Mínimo | Alertas con costo de reposición |

---

## 🔌 API REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard` | KPIs y estadísticas |
| GET/POST/PUT/DELETE | `/api/productos` | CRUD productos |
| GET/POST/PUT/DELETE | `/api/ubicaciones` | CRUD ubicaciones |
| GET/POST/PUT/DELETE | `/api/categorias` | CRUD categorías |
| GET | `/api/stock` | Stock filtrable |
| POST | `/api/stock/ajuste` | Entrada/Salida/Ajuste |
| POST | `/api/stock/transferencia` | Transferencia entre ubicaciones |
| GET | `/api/movimientos` | Historial de movimientos |
| GET | `/api/reportes/stock-general` | Excel stock general |
| GET | `/api/reportes/por-ubicacion` | Excel por ubicación |
| GET | `/api/reportes/movimientos` | Excel movimientos |
| GET | `/api/reportes/bajo-minimo` | Excel alertas |

---

## 🛠 Tecnologías

- **Backend**: Node.js + Express
- **Base de datos**: PostgreSQL
- **Excel**: excel4node
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla (sin dependencias)
