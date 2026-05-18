const router = require('express').Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// GET /api/dashboards  — list all dashboards
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, created_at, updated_at FROM dashboards ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dashboards  — create a new dashboard
router.post('/', async (req, res) => {
  try {
    const { name = 'Untitled Dashboard' } = req.body;
    const [result] = await pool.query(
      'INSERT INTO dashboards (name) VALUES (?)',
      [name]
    );
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboards/:id  — get one dashboard with its widgets
router.get('/:id', async (req, res) => {
  try {
    const [[dashboard]] = await pool.query(
      'SELECT * FROM dashboards WHERE id = ?',
      [req.params.id]
    );
    if (!dashboard) return res.status(404).json({ error: 'Dashboard not found' });

    const [widgets] = await pool.query(
      'SELECT * FROM widgets WHERE dashboard_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );

    const parsedWidgets = widgets.map((w) => ({
      ...w,
      content: typeof w.content === 'string' ? JSON.parse(w.content) : (w.content || {}),
    }));

    res.json({ dashboard, widgets: parsedWidgets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboards/:id/layout  — save full layout (delete + re-insert widgets)
router.put('/:id/layout', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { name, widgets } = req.body;

    await conn.query(
      'UPDATE dashboards SET name = ? WHERE id = ?',
      [name, req.params.id]
    );

    await conn.query('DELETE FROM widgets WHERE dashboard_id = ?', [req.params.id]);

    if (widgets && widgets.length > 0) {
      const values = widgets.map((w) => [
        w.id || uuidv4(),
        req.params.id,
        w.type,
        w.x,
        w.y,
        w.w,
        w.h,
        JSON.stringify(w.content || {}),
      ]);
      await conn.query(
        'INSERT INTO widgets (id, dashboard_id, type, x, y, w, h, content) VALUES ?',
        [values]
      );
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// DELETE /api/dashboards/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM dashboards WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
