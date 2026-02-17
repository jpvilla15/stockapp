const express = require('express');
const router = express.Router();
const { query } = require('../db');
const xl = require('excel4node');

// Estilos reutilizables
const crearEstilos = (wb) => ({
  header: wb.createStyle({
    font: { bold: true, color: '#FFFFFF', size: 12 },
    fill: { type: 'pattern', patternType: 'solid', fgColor: '#1a3a5c' },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } }
  }),
  data: wb.createStyle({
    font: { size: 11 },
    border: { left: { style: 'thin', color: '#CCCCCC' }, right: { style: 'thin', color: '#CCCCCC' },
              top: { style: 'thin', color: '#CCCCCC' }, bottom: { style: 'thin', color: '#CCCCCC' } }
  }),
  dataAlt: wb.createStyle({
    font: { size: 11 },
    fill: { type: 'pattern', patternType: 'solid', fgColor: '#F0F4F8' },
    border: { left: { style: 'thin', color: '#CCCCCC' }, right: { style: 'thin', color: '#CCCCCC' },
              top: { style: 'thin', color: '#CCCCCC' }, bottom: { style: 'thin', color: '#CCCCCC' } }
  }),
  alerta: wb.createStyle({
    font: { size: 11, color: '#CC0000', bold: true },
    fill: { type: 'pattern', patternType: 'solid', fgColor: '#FFF0F0' },
    border: { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } }
  }),
  numero: wb.createStyle({
    numberFormat: '#,##0.00',
    border: { left: { style: 'thin', color: '#CCCCCC' }, right: { style: 'thin', color: '#CCCCCC' },
              top: { style: 'thin', color: '#CCCCCC' }, bottom: { style: 'thin', color: '#CCCCCC' } }
  }),
  moneda: wb.createStyle({
    numberFormat: '"$"#,##0.00',
    border: { left: { style: 'thin', color: '#CCCCCC' }, right: { style: 'thin', color: '#CCCCCC' },
              top: { style: 'thin', color: '#CCCCCC' }, bottom: { style: 'thin', color: '#CCCCCC' } }
  }),
  titulo: wb.createStyle({
    font: { bold: true, size: 16, color: '#1a3a5c' },
    alignment: { horizontal: 'center' }
  }),
  subtitulo: wb.createStyle({
    font: { size: 11, color: '#555555' },
    alignment: { horizontal: 'center' }
  })
});

// GET /api/reportes/stock-general
router.get('/stock-general', async (req, res) => {
  try {
    const { ubicacion_id } = req.query;
    let sql = `
      SELECT p.codigo, p.nombre AS producto, c.nombre AS categoria, p.unidad_medida,
        u.nombre AS ubicacion, s.cantidad, s.cantidad_minima, p.precio_costo,
        (s.cantidad * p.precio_costo) AS valor_stock,
        CASE WHEN s.cantidad <= s.cantidad_minima AND s.cantidad_minima > 0 THEN 'BAJO MÍNIMO' ELSE 'OK' END AS estado
      FROM stock s
      JOIN productos p ON s.producto_id = p.id
      JOIN ubicaciones u ON s.ubicacion_id = u.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (ubicacion_id) { params.push(ubicacion_id); sql += ` AND s.ubicacion_id = $${params.length}`; }
    sql += ' ORDER BY u.nombre, p.nombre';
    const rows = (await query(sql, params)).rows;

    const wb = new xl.Workbook({ author: 'Stock Manager' });
    const ws = wb.addWorksheet('Stock General');
    const s = crearEstilos(wb);

    // Título
    ws.cell(1, 1, 1, 9, true).string('REPORTE DE STOCK GENERAL').style(s.titulo);
    ws.cell(2, 1, 2, 9, true).string(`Generado: ${new Date().toLocaleString('es-AR')}`).style(s.subtitulo);
    ws.row(1).setHeight(30);
    ws.row(2).setHeight(20);

    // Encabezados
    const headers = ['Código', 'Producto', 'Categoría', 'Unidad', 'Ubicación', 'Cantidad', 'Mín.', 'Precio Costo', 'Valor Stock', 'Estado'];
    headers.forEach((h, i) => ws.cell(4, i + 1).string(h).style(s.header));
    ws.row(4).setHeight(25);

    // Anchos de columna
    [12, 35, 18, 10, 20, 12, 10, 15, 15, 14].forEach((w, i) => ws.column(i + 1).setWidth(w));

    // Datos
    rows.forEach((r, idx) => {
      const row = idx + 5;
      const estilo = r.estado === 'BAJO MÍNIMO' ? s.alerta : (idx % 2 === 0 ? s.data : s.dataAlt);
      ws.cell(row, 1).string(r.codigo || '').style(estilo);
      ws.cell(row, 2).string(r.producto || '').style(estilo);
      ws.cell(row, 3).string(r.categoria || '').style(estilo);
      ws.cell(row, 4).string(r.unidad_medida || '').style(estilo);
      ws.cell(row, 5).string(r.ubicacion || '').style(estilo);
      ws.cell(row, 6).number(parseFloat(r.cantidad) || 0).style({ ...s.numero, ...(r.estado === 'BAJO MÍNIMO' ? {font:{color:'#CC0000',bold:true}} : {}) });
      ws.cell(row, 7).number(parseFloat(r.cantidad_minima) || 0).style(s.numero);
      ws.cell(row, 8).number(parseFloat(r.precio_costo) || 0).style(s.moneda);
      ws.cell(row, 9).number(parseFloat(r.valor_stock) || 0).style(s.moneda);
      ws.cell(row, 10).string(r.estado).style(estilo);
    });

    // Total
    const lastRow = rows.length + 5;
    ws.cell(lastRow, 8).string('TOTAL VALOR:').style(s.header);
    const totalValor = rows.reduce((acc, r) => acc + (parseFloat(r.valor_stock) || 0), 0);
    ws.cell(lastRow, 9).number(totalValor).style(s.moneda);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="stock_general_${Date.now()}.xlsx"`);
    wb.write('stock.xlsx', res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reportes/por-ubicacion
router.get('/por-ubicacion', async (req, res) => {
  try {
    const ubicaciones = (await query('SELECT * FROM ubicaciones ORDER BY nombre')).rows;
    const wb = new xl.Workbook({ author: 'Stock Manager' });
    const s = crearEstilos(wb);

    for (const ub of ubicaciones) {
      const rows = (await query(
        `SELECT p.codigo, p.nombre AS producto, c.nombre AS categoria, p.unidad_medida,
          s.cantidad, s.cantidad_minima, p.precio_costo, (s.cantidad * p.precio_costo) AS valor
         FROM stock s
         JOIN productos p ON s.producto_id = p.id
         LEFT JOIN categorias c ON p.categoria_id = c.id
         WHERE s.ubicacion_id = $1 ORDER BY p.nombre`,
        [ub.id]
      )).rows;

      const ws = wb.addWorksheet(ub.nombre.substring(0, 31));
      ws.cell(1, 1, 1, 8, true).string(`STOCK: ${ub.nombre.toUpperCase()}`).style(s.titulo);
      ws.cell(2, 1, 2, 8, true).string(ub.descripcion || '').style(s.subtitulo);
      ws.cell(3, 1, 3, 8, true).string(`Generado: ${new Date().toLocaleString('es-AR')}`).style(s.subtitulo);

      const headers = ['Código', 'Producto', 'Categoría', 'Unidad', 'Cantidad', 'Mín.', 'Precio Costo', 'Valor'];
      headers.forEach((h, i) => ws.cell(5, i + 1).string(h).style(s.header));
      [10, 32, 16, 10, 12, 10, 14, 14].forEach((w, i) => ws.column(i + 1).setWidth(w));

      rows.forEach((r, idx) => {
        const row = idx + 6;
        const estilo = idx % 2 === 0 ? s.data : s.dataAlt;
        ws.cell(row, 1).string(r.codigo || '').style(estilo);
        ws.cell(row, 2).string(r.producto || '').style(estilo);
        ws.cell(row, 3).string(r.categoria || '').style(estilo);
        ws.cell(row, 4).string(r.unidad_medida || '').style(estilo);
        ws.cell(row, 5).number(parseFloat(r.cantidad) || 0).style(s.numero);
        ws.cell(row, 6).number(parseFloat(r.cantidad_minima) || 0).style(s.numero);
        ws.cell(row, 7).number(parseFloat(r.precio_costo) || 0).style(s.moneda);
        ws.cell(row, 8).number(parseFloat(r.valor) || 0).style(s.moneda);
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="stock_por_ubicacion_${Date.now()}.xlsx"`);
    wb.write('stock_ub.xlsx', res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reportes/movimientos
router.get('/movimientos', async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const fechaDesde = desde || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const fechaHasta = hasta || new Date().toISOString().split('T')[0];

    const rows = (await query(
      `SELECT m.creado_en, m.tipo, p.codigo, p.nombre AS producto, u.nombre AS ubicacion,
        m.cantidad, m.cantidad_anterior, m.cantidad_posterior, m.motivo, m.usuario
       FROM movimientos m
       JOIN productos p ON m.producto_id = p.id
       JOIN ubicaciones u ON m.ubicacion_id = u.id
       WHERE m.creado_en::date BETWEEN $1 AND $2
       ORDER BY m.creado_en DESC`,
      [fechaDesde, fechaHasta]
    )).rows;

    const wb = new xl.Workbook({ author: 'Stock Manager' });
    const ws = wb.addWorksheet('Movimientos');
    const s = crearEstilos(wb);

    ws.cell(1, 1, 1, 9, true).string('REPORTE DE MOVIMIENTOS DE STOCK').style(s.titulo);
    ws.cell(2, 1, 2, 9, true).string(`Período: ${fechaDesde} al ${fechaHasta} | Generado: ${new Date().toLocaleString('es-AR')}`).style(s.subtitulo);

    const headers = ['Fecha/Hora', 'Tipo', 'Código', 'Producto', 'Ubicación', 'Cantidad', 'Stock Anterior', 'Stock Posterior', 'Motivo', 'Usuario'];
    headers.forEach((h, i) => ws.cell(4, i + 1).string(h).style(s.header));
    [18, 12, 12, 28, 18, 10, 14, 14, 25, 12].forEach((w, i) => ws.column(i + 1).setWidth(w));

    const colorTipo = { entrada: '#E8F5E9', salida: '#FFEBEE', ajuste: '#FFF8E1', transferencia: '#E3F2FD' };

    rows.forEach((r, idx) => {
      const row = idx + 5;
      const color = colorTipo[r.tipo] || '#FFFFFF';
      const est = wb.createStyle({
        fill: { type: 'pattern', patternType: 'solid', fgColor: color },
        border: { left:{style:'thin',color:'#CCCCCC'}, right:{style:'thin',color:'#CCCCCC'}, top:{style:'thin',color:'#CCCCCC'}, bottom:{style:'thin',color:'#CCCCCC'} }
      });
      ws.cell(row, 1).string(new Date(r.creado_en).toLocaleString('es-AR')).style(est);
      ws.cell(row, 2).string(r.tipo.toUpperCase()).style(est);
      ws.cell(row, 3).string(r.codigo || '').style(est);
      ws.cell(row, 4).string(r.producto || '').style(est);
      ws.cell(row, 5).string(r.ubicacion || '').style(est);
      ws.cell(row, 6).number(parseFloat(r.cantidad) || 0).style(s.numero);
      ws.cell(row, 7).number(parseFloat(r.cantidad_anterior) || 0).style(s.numero);
      ws.cell(row, 8).number(parseFloat(r.cantidad_posterior) || 0).style(s.numero);
      ws.cell(row, 9).string(r.motivo || '').style(est);
      ws.cell(row, 10).string(r.usuario || '').style(est);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="movimientos_${fechaDesde}_${fechaHasta}.xlsx"`);
    wb.write('mov.xlsx', res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reportes/bajo-minimo
router.get('/bajo-minimo', async (req, res) => {
  try {
    const rows = (await query(
      `SELECT p.codigo, p.nombre AS producto, c.nombre AS categoria, p.unidad_medida,
        u.nombre AS ubicacion, s.cantidad, s.cantidad_minima,
        (s.cantidad_minima - s.cantidad) AS faltante, p.precio_costo,
        ((s.cantidad_minima - s.cantidad) * p.precio_costo) AS costo_reposicion
       FROM stock s
       JOIN productos p ON s.producto_id = p.id
       JOIN ubicaciones u ON s.ubicacion_id = u.id
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE s.cantidad <= s.cantidad_minima AND s.cantidad_minima > 0
       ORDER BY (s.cantidad_minima - s.cantidad) DESC`
    )).rows;

    const wb = new xl.Workbook({ author: 'Stock Manager' });
    const ws = wb.addWorksheet('Alertas Stock Bajo');
    const s = crearEstilos(wb);

    ws.cell(1, 1, 1, 10, true).string('⚠ ALERTA: PRODUCTOS BAJO STOCK MÍNIMO').style(s.titulo);
    ws.cell(2, 1, 2, 10, true).string(`Generado: ${new Date().toLocaleString('es-AR')} | Total alertas: ${rows.length}`).style(s.subtitulo);

    const headers = ['Código', 'Producto', 'Categoría', 'Unidad', 'Ubicación', 'Stock Actual', 'Stock Mínimo', 'Faltante', 'Precio Costo', 'Costo Reposición'];
    headers.forEach((h, i) => ws.cell(4, i + 1).string(h).style(s.header));
    [12, 30, 16, 10, 20, 12, 12, 12, 14, 16].forEach((w, i) => ws.column(i + 1).setWidth(w));

    rows.forEach((r, idx) => {
      const row = idx + 5;
      ws.cell(row, 1).string(r.codigo || '').style(s.alerta);
      ws.cell(row, 2).string(r.producto || '').style(s.alerta);
      ws.cell(row, 3).string(r.categoria || '').style(s.alerta);
      ws.cell(row, 4).string(r.unidad_medida || '').style(s.alerta);
      ws.cell(row, 5).string(r.ubicacion || '').style(s.alerta);
      ws.cell(row, 6).number(parseFloat(r.cantidad) || 0).style(s.numero);
      ws.cell(row, 7).number(parseFloat(r.cantidad_minima) || 0).style(s.numero);
      ws.cell(row, 8).number(parseFloat(r.faltante) || 0).style(s.numero);
      ws.cell(row, 9).number(parseFloat(r.precio_costo) || 0).style(s.moneda);
      ws.cell(row, 10).number(parseFloat(r.costo_reposicion) || 0).style(s.moneda);
    });

    const totalRow = rows.length + 5;
    ws.cell(totalRow, 9).string('TOTAL:').style(s.header);
    ws.cell(totalRow, 10).number(rows.reduce((a, r) => a + (parseFloat(r.costo_reposicion) || 0), 0)).style(s.moneda);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="alertas_stock_bajo_${Date.now()}.xlsx"`);
    wb.write('alertas.xlsx', res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
