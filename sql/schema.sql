-- =============================================
-- STOCK MANAGER - Schema PostgreSQL
-- =============================================

CREATE TABLE IF NOT EXISTS ubicaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria_id INTEGER REFERENCES categorias(id),
    unidad_medida VARCHAR(30) DEFAULT 'unidad',
    precio_costo DECIMAL(12,2) DEFAULT 0,
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
    ubicacion_id INTEGER REFERENCES ubicaciones(id) ON DELETE CASCADE,
    cantidad DECIMAL(12,3) DEFAULT 0,
    cantidad_minima DECIMAL(12,3) DEFAULT 0,
    actualizado_en TIMESTAMP DEFAULT NOW(),
    UNIQUE(producto_id, ubicacion_id)
);

CREATE TABLE IF NOT EXISTS movimientos (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER REFERENCES productos(id),
    ubicacion_id INTEGER REFERENCES ubicaciones(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste', 'transferencia')),
    cantidad DECIMAL(12,3) NOT NULL,
    cantidad_anterior DECIMAL(12,3),
    cantidad_posterior DECIMAL(12,3),
    motivo TEXT,
    usuario VARCHAR(100) DEFAULT 'admin',
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_stock_producto ON stock(producto_id);
CREATE INDEX IF NOT EXISTS idx_stock_ubicacion ON stock(ubicacion_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos(creado_en);

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_updated
    BEFORE UPDATE ON stock
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_producto_updated
    BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Datos de ejemplo
INSERT INTO ubicaciones (nombre, descripcion) VALUES
    ('Almacén Principal', 'Depósito central de mercadería'),
    ('Depósito Norte', 'Sucursal zona norte'),
    ('Depósito Sur', 'Sucursal zona sur'),
    ('Tienda', 'Piso de ventas')
ON CONFLICT DO NOTHING;

INSERT INTO categorias (nombre) VALUES
    ('Electrónica'),
    ('Alimentos'),
    ('Ropa'),
    ('Herramientas'),
    ('Papelería')
ON CONFLICT DO NOTHING;

INSERT INTO productos (codigo, nombre, descripcion, categoria_id, unidad_medida, precio_costo) VALUES
    ('ELEC-001', 'Televisor 32"', 'Smart TV LED 32 pulgadas', 1, 'unidad', 45000),
    ('ELEC-002', 'Auriculares Bluetooth', 'Auriculares inalámbricos', 1, 'unidad', 8500),
    ('ALIM-001', 'Arroz 1kg', 'Arroz blanco largo fino', 2, 'kg', 350),
    ('ALIM-002', 'Aceite de girasol', 'Aceite 1.5L', 2, 'litro', 900),
    ('ROPA-001', 'Remera básica', 'Remera algodón talle M', 3, 'unidad', 2200),
    ('HERR-001', 'Martillo 300g', 'Martillo carpintero', 4, 'unidad', 1800),
    ('PAP-001', 'Resma A4', 'Papel A4 500 hojas', 5, 'resma', 1200)
ON CONFLICT DO NOTHING;

-- Stock inicial
INSERT INTO stock (producto_id, ubicacion_id, cantidad, cantidad_minima)
SELECT p.id, u.id, 
    FLOOR(RANDOM() * 100 + 10)::DECIMAL,
    5
FROM productos p
CROSS JOIN ubicaciones u
ON CONFLICT DO NOTHING;
