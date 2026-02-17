const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET todos los productos con stock total
router.get('/', async (req, res) => {
  try {
    const { search, categoria_id } = req.query;
    let sql = `
      SELECT p.*, c.nombre AS categoria,
        COALESCE(SUM(s.cantidad), 0) AS stock_total
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN stock s ON p.id = s.producto_id
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (p.nombre ILIKE $${params.length} OR p.codigo ILIKE $${params.length})`;
    }
    if (categoria_id) {
      params.push(categoria_id);
      sql += ` AND p.categoria_id = $${params.length}`;
    }
    sql += ' GROUP BY p.id, c.nombre ORDER BY p.nombre';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET producto por ID con stock por ubicación
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await query(
      `SELECT p.*, c.nombre AS categoria FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.id = $1`,
      [id]
    );
    if (!producto.rows.length) return res.status(404).json({ error: 'Producto no encontrado' });

    const stockPorUbicacion = await query(
      `SELECT s.*, u.nombre AS ubicacion FROM stock s
       JOIN ubicaciones u ON s.ubicacion_id = u.id WHERE s.producto_id = $1`,
      [id]
    );
    res.json({ ...producto.rows[0], stock: stockPorUbicacion.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST crear producto
router.post('/', async (req, res) => {
  try {
    const { codigo, nombre, descripcion, categoria_id, unidad_medida, precio_costo } = req.body;
    const result = await query(
      `INSERT INTO productos (codigo, nombre, descripcion, categoria_id, unidad_medida, precio_costo)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [codigo, nombre, descripcion, categoria_id, unidad_medida || 'unidad', precio_costo || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El código de producto ya existe' });
    res.status(500).json({ error: err.message });
  }
});

// PUT actualizar producto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, descripcion, categoria_id, unidad_medida, precio_costo } = req.body;
    const result = await query(
      `UPDATE productos SET codigo=$1, nombre=$2, descripcion=$3, categoria_id=$4,
       unidad_medida=$5, precio_costo=$6 WHERE id=$7 RETURNING *`,
      [codigo, nombre, descripcion, categoria_id, unidad_medida, precio_costo, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE producto
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM productos WHERE id=$1', [id]);
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
