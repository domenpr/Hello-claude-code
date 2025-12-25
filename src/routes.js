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

// GET /api/entries?from=&to=&days= - Pridobi vnose v časovnem obdobju
// days parameter: število dni nazaj od danes (npr. days=7 vrne zadnjih 7 dni)
router.get('/entries', async (req, res) => {
  try {
    const { from, to, limit = 100, days } = req.query;

    let query = 'SELECT * FROM entries';
    const params = [];
    const conditions = [];

    // Če je podan days parameter, ignoriramo from/to
    if (days) {
      conditions.push(`timestamp >= NOW() - INTERVAL '${parseInt(days)} days'`);
    } else {
      if (from) {
        conditions.push(`timestamp >= $${params.length + 1}`);
        params.push(from);
      }

      if (to) {
        conditions.push(`timestamp <= $${params.length + 1}`);
        params.push(to);
      }
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

// GET /api/entries/daily?days= - Pridobi dnevno agregirane vnose
// Za prikaz dolgih obdobij (30+ dni) z manj podatkovnimi točkami
router.get('/entries/daily', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Dnevna agregacija: povprečje energije/stresa, max bolečine, zadnja vrednost blata
    const query = `
      SELECT
        DATE(timestamp) as date,
        AVG(energy)::numeric(10,2) as avg_energy,
        AVG(stress)::numeric(10,2) as avg_stress,
        MAX(stomach_pain) as max_stomach_pain,
        (ARRAY_AGG(stool ORDER BY timestamp DESC))[1] as last_stool
      FROM entries
      WHERE timestamp >= NOW() - INTERVAL '${parseInt(days)} days'
        AND DATE(timestamp) <= CURRENT_DATE
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
      LIMIT 100
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      count: result.rows.length,
      daily_entries: result.rows
    });
  } catch (error) {
    console.error('Error fetching daily entries:', error);
    res.status(500).json({
      error: 'Napaka pri pridobivanju dnevnih vnosov',
      details: error.message
    });
  }
});

// GET /api/summary/week - Pridobi 7-dnevni povzetek za prikaz na vrhu grafov
router.get('/summary/week', async (req, res) => {
  try {
    // Statistika za zadnjih 7 dni
    const statsQuery = `
      SELECT
        AVG(energy)::numeric(10,2) as avg_energy,
        AVG(stress)::numeric(10,2) as avg_stress,
        COUNT(DISTINCT DATE(timestamp)) as days_count,
        COUNT(DISTINCT DATE(timestamp)) FILTER (
          WHERE stool = 4
        ) as ideal_stool_days
      FROM entries
      WHERE timestamp >= NOW() - INTERVAL '7 days'
    `;

    // Trend - primerjava s prejšnjimi 7 dnevi
    const trendQuery = `
      SELECT
        AVG(CASE WHEN timestamp >= NOW() - INTERVAL '7 days' THEN energy END)::numeric(10,2) as current_energy,
        AVG(CASE WHEN timestamp < NOW() - INTERVAL '7 days' AND timestamp >= NOW() - INTERVAL '14 days' THEN energy END)::numeric(10,2) as prev_energy,
        AVG(CASE WHEN timestamp >= NOW() - INTERVAL '7 days' THEN stress END)::numeric(10,2) as current_stress,
        AVG(CASE WHEN timestamp < NOW() - INTERVAL '7 days' AND timestamp >= NOW() - INTERVAL '14 days' THEN stress END)::numeric(10,2) as prev_stress
      FROM entries
      WHERE timestamp >= NOW() - INTERVAL '14 days'
    `;

    const [statsResult, trendResult] = await Promise.all([
      db.query(statsQuery),
      db.query(trendQuery)
    ]);

    const stats = statsResult.rows[0];
    const trend = trendResult.rows[0];

    // Izračun % dni z idealnim blatom
    const idealStoolPercentage = stats.days_count > 0
      ? Math.round((stats.ideal_stool_days / stats.days_count) * 100)
      : 0;

    // Trend kazalniki
    const energyTrend = trend.prev_energy
      ? (parseFloat(trend.current_energy) > parseFloat(trend.prev_energy) ? 'up' : parseFloat(trend.current_energy) < parseFloat(trend.prev_energy) ? 'down' : 'stable')
      : 'stable';

    const stressTrend = trend.prev_stress
      ? (parseFloat(trend.current_stress) > parseFloat(trend.prev_stress) ? 'up' : parseFloat(trend.current_stress) < parseFloat(trend.prev_stress) ? 'down' : 'stable')
      : 'stable';

    res.json({
      success: true,
      week_summary: {
        avg_energy: stats.avg_energy,
        avg_stress: stats.avg_stress,
        ideal_stool_percentage: idealStoolPercentage,
        energy_trend: energyTrend,
        stress_trend: stressTrend
      }
    });
  } catch (error) {
    console.error('Error fetching week summary:', error);
    res.status(500).json({
      error: 'Napaka pri pridobivanju tedenskega povzetka',
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

// POST /api/admin/import-historical - Import historical data (requires ENABLE_IMPORT=1)
router.post('/admin/import-historical', async (req, res) => {
  try {
    // Check if import is enabled via environment variable
    if (process.env.ENABLE_IMPORT !== '1') {
      return res.status(403).json({
        error: 'Import disabled',
        message: 'Set ENABLE_IMPORT=1 environment variable to enable import'
      });
    }

    console.log('🔄 Starting historical data import...');

    // Ensure unique constraint on timestamp exists (for idempotency)
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS entries_timestamp_unique ON entries(timestamp)
    `);

    // Read migration file
    const fs = require('fs').promises;
    const path = require('path');
    const migrationPath = path.join(__dirname, '..', 'migrations', '002_import_historical_data.sql');

    console.log('📁 Migration path:', migrationPath);

    // Check if file exists
    try {
      await fs.access(migrationPath);
      console.log('✅ Migration file found');
    } catch (err) {
      console.error('❌ Migration file not found:', err.message);
      throw new Error(`Migration file not found at ${migrationPath}`);
    }

    let sql = await fs.readFile(migrationPath, 'utf8');
    console.log(`📄 SQL file size: ${sql.length} bytes`);

    // Split by semicolons and extract INSERT statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && s.startsWith('INSERT'));

    console.log(`🔍 Found ${statements.length} INSERT statements`);

    let insertedCount = 0;
    let skippedCount = 0;

    // Process each INSERT statement with conflict handling
    for (const statement of statements) {
      const modifiedStatement = statement + ' ON CONFLICT (timestamp) DO NOTHING';
      const result = await db.query(modifiedStatement);
      insertedCount += result.rowCount;

      // Count skipped (already existing) entries
      const expectedRows = (statement.match(/\),/g) || []).length + 1;
      skippedCount += (expectedRows - result.rowCount);
    }

    console.log(`✅ Import completed: ${insertedCount} inserted, ${skippedCount} skipped`);

    res.json({
      success: true,
      message: 'Historical data import completed',
      inserted: insertedCount,
      skipped: skippedCount,
      total_statements: statements.length
    });
  } catch (error) {
    console.error('❌ Error importing historical data:', error);
    res.status(500).json({
      error: 'Import failed',
      details: error.message
    });
  }
});

module.exports = router;
