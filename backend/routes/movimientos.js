const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  try {
    const { producto_id, ubicacion_id, tipo, desde, hasta, limit = 100 } = req.query;
    let sql = `
      SELECT m.*, p.nombre AS producto, p.codigo, u.nombre AS ubicacion
      FROM movimientos m
      JOIN productos p ON m.producto_id = p.id
      JOIN ubicaciones u ON m.ubicacion_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (producto_id) { params.push(producto_id); sql += ` AND m.producto_id = $${params.length}`; }
    if (ubicacion_id){ params.push(ubicacion_id); sql += ` AND m.ubicacion_id = $${params.length}`; }
    if (tipo)        { params.push(tipo);         sql += ` AND m.tipo = $${params.length}`; }
    if (desde)       { params.push(desde);        sql += ` AND m.creado_en >= $${params.length}`; }
    if (hasta)       { params.push(hasta);        sql += ` AND m.creado_en <= $${params.length}`; }
    params.push(parseInt(limit));
    sql += ` ORDER BY m.creado_en DESC LIMIT $${params.length}`;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
