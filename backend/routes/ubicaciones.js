const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT u.*, COUNT(DISTINCT s.producto_id) AS total_productos,
       COALESCE(SUM(s.cantidad), 0) AS stock_total
       FROM ubicaciones u
       LEFT JOIN stock s ON u.id = s.ubicacion_id
       GROUP BY u.id ORDER BY u.nombre`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ubicacion = await query('SELECT * FROM ubicaciones WHERE id=$1', [id]);
    if (!ubicacion.rows.length) return res.status(404).json({ error: 'Ubicación no encontrada' });

    const stock = await query(
      `SELECT s.*, p.nombre AS producto, p.codigo, p.unidad_medida, c.nombre AS categoria
       FROM stock s
       JOIN productos p ON s.producto_id = p.id
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE s.ubicacion_id = $1
       ORDER BY p.nombre`,
      [id]
    );
    res.json({ ...ubicacion.rows[0], stock: stock.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const result = await query(
      'INSERT INTO ubicaciones (nombre, descripcion) VALUES ($1,$2) RETURNING *',
      [nombre, descripcion]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'La ubicación ya existe' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const result = await query(
      'UPDATE ubicaciones SET nombre=$1, descripcion=$2 WHERE id=$3 RETURNING *',
      [nombre, descripcion, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Ubicación no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM ubicaciones WHERE id=$1', [req.params.id]);
    res.json({ message: 'Ubicación eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
