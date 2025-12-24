const express = require('express');
const db = require('./db');

const router = express.Router();

// POST /api/entries - Ustvari nov vnos
router.post('/entries', async (req, res) => {
  try {
    const { energy, mood, stress, stomach_pain, stool, note } = req.body;

    // Validacija
    if (!energy || !mood || !stress || !stomach_pain || !stool) {
      return res.status(400).json({
        error: 'Vsa obvezna polja morajo biti izpolnjena',
        required: ['energy', 'mood', 'stress', 'stomach_pain', 'stool']
      });
    }

    // Preverjanje obsega vrednosti
    const fields = { energy, mood, stress, stomach_pain, stool };
    for (const [field, value] of Object.entries(fields)) {
      if (value < 1 || value > 5) {
        return res.status(400).json({
          error: `Polje ${field} mora biti med 1 in 5`,
          field,
          value
        });
      }
    }

    const result = await db.query(
      `INSERT INTO entries (energy, mood, stress, stomach_pain, stool, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [energy, mood, stress, stomach_pain, stool, note || null]
    );

    res.status(201).json({
      success: true,
      message: 'Vnos uspešno shranjen',
      entry: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({
      error: 'Napaka pri shranjevanju vnosa',
      details: error.message
    });
  }
});

// GET /api/entries?from=&to= - Pridobi vnose v časovnem obdobju
router.get('/entries', async (req, res) => {
  try {
    const { from, to, limit = 100 } = req.query;

    let query = 'SELECT * FROM entries';
    const params = [];
    const conditions = [];

    if (from) {
      conditions.push(`timestamp >= $${params.length + 1}`);
      params.push(from);
    }

    if (to) {
      conditions.push(`timestamp <= $${params.length + 1}`);
      params.push(to);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      entries: result.rows
    });
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({
      error: 'Napaka pri pridobivanju vnosov',
      details: error.message
    });
  }
});

// GET /api/summary?from=&to= - Pridobi statistiko
router.get('/summary', async (req, res) => {
  try {
    const { from, to } = req.query;

    let whereClause = '';
    const params = [];

    if (from || to) {
      const conditions = [];
      if (from) {
        conditions.push(`timestamp >= $${params.length + 1}`);
        params.push(from);
      }
      if (to) {
        conditions.push(`timestamp <= $${params.length + 1}`);
        params.push(to);
      }
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const query = `
      SELECT
        COUNT(*) as total_entries,
        AVG(energy) as avg_energy,
        MIN(energy) as min_energy,
        MAX(energy) as max_energy,
        AVG(mood) as avg_mood,
        MIN(mood) as min_mood,
        MAX(mood) as max_mood,
        AVG(stress) as avg_stress,
        MIN(stress) as min_stress,
        MAX(stress) as max_stress,
        AVG(stomach_pain) as avg_stomach_pain,
        MIN(stomach_pain) as min_stomach_pain,
        MAX(stomach_pain) as max_stomach_pain,
        AVG(stool) as avg_stool,
        MIN(stool) as min_stool,
        MAX(stool) as max_stool,
        MIN(timestamp) as first_entry,
        MAX(timestamp) as last_entry
      FROM entries
      ${whereClause}
    `;

    const result = await db.query(query, params);

    // Formatiranje številk na 2 decimalni mesti
    const summary = result.rows[0];
    const formatted = {
      total_entries: parseInt(summary.total_entries),
      period: {
        from: summary.first_entry,
        to: summary.last_entry
      },
      energy: {
        avg: parseFloat(summary.avg_energy || 0).toFixed(2),
        min: summary.min_energy,
        max: summary.max_energy
      },
      mood: {
        avg: parseFloat(summary.avg_mood || 0).toFixed(2),
        min: summary.min_mood,
        max: summary.max_mood
      },
      stress: {
        avg: parseFloat(summary.avg_stress || 0).toFixed(2),
        min: summary.min_stress,
        max: summary.max_stress
      },
      stomach_pain: {
        avg: parseFloat(summary.avg_stomach_pain || 0).toFixed(2),
        min: summary.min_stomach_pain,
        max: summary.max_stomach_pain
      },
      stool: {
        avg: parseFloat(summary.avg_stool || 0).toFixed(2),
        min: summary.min_stool,
        max: summary.max_stool,
        ideal: 4
      }
    };

    res.json({
      success: true,
      summary: formatted
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      error: 'Napaka pri pridobivanju statistike',
      details: error.message
    });
  }
});

// GET /api/health - Health check endpoint
router.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

module.exports = router;
