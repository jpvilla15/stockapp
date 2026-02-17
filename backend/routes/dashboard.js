const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  try {
    const [resumen, ubicaciones, bajoMinimo, movRecientes] = await Promise.all([
      query(`SELECT
        COUNT(DISTINCT p.id) AS total_productos,
        COUNT(DISTINCT u.id) AS total_ubicaciones,
        COALESCE(SUM(s.cantidad), 0) AS unidades_totales,
        COALESCE(SUM(s.cantidad * p.precio_costo), 0) AS valor_total_stock
        FROM productos p
        LEFT JOIN stock s ON p.id = s.producto_id
        LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id`),
      query(`SELECT u.nombre, COALESCE(SUM(s.cantidad), 0) AS stock_total
        FROM ubicaciones u LEFT JOIN stock s ON u.id = s.ubicacion_id
        GROUP BY u.id, u.nombre ORDER BY stock_total DESC`),
      query(`SELECT COUNT(*) AS cantidad FROM stock WHERE cantidad <= cantidad_minima AND cantidad_minima > 0`),
      query(`SELECT m.tipo, COUNT(*) AS total, SUM(m.cantidad) AS suma
        FROM movimientos m WHERE m.creado_en >= NOW() - INTERVAL '30 days'
        GROUP BY m.tipo`)
    ]);

    res.json({
      resumen: resumen.rows[0],
      stock_por_ubicacion: ubicaciones.rows,
      alertas_stock_bajo: parseInt(bajoMinimo.rows[0].cantidad),
      movimientos_30_dias: movRecientes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
