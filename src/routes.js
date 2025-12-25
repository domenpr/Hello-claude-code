const express = require('express');
const db = require('./db');

const router = express.Router();

// POST /api/entries - Ustvari nov vnos
router.post('/entries', async (req, res) => {
  try {
    const { energy, mood, stress, stomach_pain, stool, note, timestamp } = req.body;

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

    // Če je podan timestamp, ga uporabi; sicer uporabi trenutni čas
    let query, params;
    if (timestamp) {
      query = `INSERT INTO entries (timestamp, energy, mood, stress, stomach_pain, stool, note)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               RETURNING *`;
      params = [timestamp, energy, mood, stress, stomach_pain, stool, note || null];
    } else {
      query = `INSERT INTO entries (energy, mood, stress, stomach_pain, stool, note)
               VALUES ($1, $2, $3, $4, $5, $6)
               RETURNING *`;
      params = [energy, mood, stress, stomach_pain, stool, note || null];
    }

    const result = await db.query(query, params);

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
    const { from, to, limit = 1000, days } = req.query;

    // DEBUG: Najprej preveri koliko vnosov sploh obstaja v bazi
    const totalCountResult = await db.query('SELECT COUNT(*) as total FROM entries');
    const totalInDb = parseInt(totalCountResult.rows[0].total);

    let query = 'SELECT * FROM entries';
    let whereClause = '';

    // Če je podan days parameter, ignoriramo from/to
    if (days && days !== 'all') {
      const daysNum = parseInt(days);

      // Uporabi timestamp::date cast namesto DATE() funkcije
      whereClause = ` WHERE timestamp::date >= CURRENT_DATE - ${daysNum}`;

      console.log('🔍 GRAPH DEBUG - Filter query:', {
        requestedDays: days,
        daysNum: daysNum,
        currentDate: new Date().toISOString().split('T')[0],
        filterStartDate: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        whereClause: whereClause
      });
    } else if (from || to) {
      const conditions = [];
      if (from) {
        conditions.push(`timestamp >= '${from}'`);
      }
      if (to) {
        conditions.push(`timestamp <= '${to}'`);
      }
      whereClause = ' WHERE ' + conditions.join(' AND ');
    } else {
      console.log('📊 [GET /api/entries] No filter - returning all entries');
    }

    // Dodaj WHERE clause in ordering
    query += whereClause;
    query += ` ORDER BY timestamp DESC LIMIT ${parseInt(limit)}`;

    console.log('🔍 GRAPH DEBUG - Final SQL query:', query);

    const result = await db.query(query);
    const entries = result.rows;

    // OBSEŽEN DEBUG LOG
    console.log('🔍 GRAPH DEBUG - Query results:', {
      days: days || 'all',
      totalEntriesInDb: totalInDb,
      entriesReturned: entries.length,
      firstTimestamp: entries.length > 0 ? entries[entries.length - 1]?.timestamp : null, // Najstarejši (ORDER DESC)
      lastTimestamp: entries.length > 0 ? entries[0]?.timestamp : null, // Najnovejši (ORDER DESC)
      limit: limit
    });

    // Če je vrnjenih manj kot pričakovano, daj še dodatne info
    if (days && days !== 'all' && entries.length < 10) {
      console.warn('⚠️ GRAPH DEBUG - Very few entries returned! Checking date range...');

      // Preveri kdaj so prvi in zadnji vnosi v celotni bazi
      const rangeResult = await db.query(
        'SELECT MIN(timestamp) as min_ts, MAX(timestamp) as max_ts FROM entries'
      );
      console.log('🔍 GRAPH DEBUG - Database date range:', rangeResult.rows[0]);
    }

    res.json({
      success: true,
      count: entries.length,
      entries: entries
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

// DELETE /api/entries/:id - Izbriši vnos
router.delete('/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Preveri ali vnos obstaja
    const checkResult = await db.query('SELECT id FROM entries WHERE id = $1', [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Vnos ne obstaja',
        id: parseInt(id)
      });
    }

    // Izbriši vnos
    await db.query('DELETE FROM entries WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Vnos uspešno izbrisan',
      id: parseInt(id)
    });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({
      error: 'Napaka pri brisanju vnosa',
      details: error.message
    });
  }
});

// GET /api/export/csv - Izvozi vse vnose v CSV format
router.get('/export/csv', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM entries ORDER BY timestamp ASC');
    const entries = result.rows;

    // Ustvari CSV header
    const headers = 'id,timestamp,energy,mood,stress,stomach_pain,stool,note,created_at';

    // Ustvari CSV vrstice
    const rows = entries.map(entry => {
      return [
        entry.id,
        entry.timestamp,
        entry.energy,
        entry.mood,
        entry.stress,
        entry.stomach_pain,
        entry.stool || '',
        entry.note ? '"' + entry.note.replace(/"/g, '""') + '"' : '',
        entry.created_at
      ].join(',');
    });

    // Združi header in vrstice
    const csv = [headers, ...rows].join('\n');

    // Nastavi HTTP headerje za download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="entries.csv"');

    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({
      error: 'Napaka pri izvozu CSV',
      details: error.message
    });
  }
});

// GET /api/wellbeing?days= - Pridobi wellbeing indeks po dnevih
router.get('/wellbeing', async (req, res) => {
  try {
    let { days = 30 } = req.query;

    // Če je "all", uporabljaj veliko število dni (npr. 365)
    const daysNum = (days === 'all') ? 365 : parseInt(days);

    console.log(`💚 [GET /api/wellbeing] Calculating wellbeing for days=${days} (${daysNum})`);

    // Izračun wellbeing indeksa po dnevih
    // Wellbeing = povprečje normaliziranih vrednosti:
    //   - energija: višje = bolje (ostane 1-5)
    //   - psiha: višje = bolje (ostane 1-5)
    //   - stres: višje = slabše → obrni (6 - stres)
    //   - bolečina: višje = slabše → obrni (6 - bolečina)
    //   - blato: 4 = idealno (5 točk), 3 ali 5 = (3 točke), 1 ali 2 = (1 točka)

    // TIMEZONE FIX: Uporabi DATE() cast za primerjavo brez ur in timezone-ov
    const query = `
      WITH daily_wellbeing AS (
        SELECT
          timestamp::date as date,
          COUNT(*) as entries_count,
          AVG(energy) as avg_energy,
          AVG(mood) as avg_mood,
          AVG(6 - stress) as avg_stress_inverted,
          AVG(6 - stomach_pain) as avg_pain_inverted,
          AVG(
            CASE
              WHEN stool = 4 THEN 5
              WHEN stool IN (3, 5) THEN 3
              WHEN stool IN (1, 2) THEN 1
              ELSE NULL
            END
          ) as avg_stool_score
        FROM entries
        WHERE timestamp::date >= CURRENT_DATE - ${daysNum}
        GROUP BY timestamp::date
      )
      SELECT
        date,
        entries_count,
        ROUND(
          (avg_energy + avg_mood + avg_stress_inverted + avg_pain_inverted + COALESCE(avg_stool_score, 3)) / 5.0,
          1
        ) as wellbeing
      FROM daily_wellbeing
      ORDER BY date ASC
    `;

    console.log('🔍 WELLBEING DEBUG - SQL query:', query);

    const result = await db.query(query);
    const dailyWellbeing = result.rows;

    console.log('🔍 WELLBEING DEBUG - Query results:', {
      days: days,
      daysNum: daysNum,
      wellbeingDaysReturned: dailyWellbeing.length,
      firstDate: dailyWellbeing.length > 0 ? dailyWellbeing[0].date : null,
      lastDate: dailyWellbeing.length > 0 ? dailyWellbeing[dailyWellbeing.length - 1].date : null,
      sampleData: dailyWellbeing.slice(0, 3) // Prvi 3 dnevi
    });

    // Izračun 7-dnevnega drsečega povprečja
    const withMovingAvg = dailyWellbeing.map((day, index) => {
      if (index < 6) {
        // Prvih 6 dni nima 7-dnevnega povprečja
        return {
          date: day.date,
          wellbeing: parseFloat(day.wellbeing),
          moving_avg_7d: null
        };
      }

      // Izračunaj povprečje zadnjih 7 dni (vključno s trenutnim)
      const last7Days = dailyWellbeing.slice(index - 6, index + 1);
      const sum = last7Days.reduce((acc, d) => acc + parseFloat(d.wellbeing), 0);
      const avg = sum / 7;

      return {
        date: day.date,
        wellbeing: parseFloat(day.wellbeing),
        moving_avg_7d: Math.round(avg * 10) / 10
      };
    });

    console.log(`💚 [GET /api/wellbeing] Final: days=${days}, wellbeingDays=${withMovingAvg.length}`);

    res.json({
      success: true,
      count: withMovingAvg.length,
      wellbeing_data: withMovingAvg
    });
  } catch (error) {
    console.error('Error fetching wellbeing data:', error);
    res.status(500).json({
      error: 'Napaka pri pridobivanju wellbeing podatkov',
      details: error.message
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

// POST /api/admin/fix-year - Fix year from 2024 to 2025 for historical data
router.post('/admin/fix-year', async (req, res) => {
  try {
    // Check if import is enabled via environment variable
    if (process.env.ENABLE_IMPORT !== '1') {
      return res.status(403).json({
        error: 'Fix disabled',
        message: 'Set ENABLE_IMPORT=1 environment variable to enable year fix'
      });
    }

    console.log('🔧 Starting year fix: 2024 → 2025');

    // Count entries in 2024
    const countResult = await db.query(
      "SELECT COUNT(*) as count FROM entries WHERE timestamp >= '2024-01-01' AND timestamp < '2025-01-01'"
    );
    const count2024 = parseInt(countResult.rows[0].count);

    console.log(`Found ${count2024} entries in year 2024`);

    // Update all 2024 entries to 2025 by adding 1 year
    const updateResult = await db.query(`
      UPDATE entries
      SET timestamp = timestamp + INTERVAL '1 year'
      WHERE timestamp >= '2024-01-01' AND timestamp < '2025-01-01'
    `);

    console.log(`✅ Updated ${updateResult.rowCount} entries to year 2025`);

    // Verify the fix
    const verifyResult = await db.query(
      "SELECT MIN(timestamp) as min_ts, MAX(timestamp) as max_ts, COUNT(*) as total FROM entries"
    );

    console.log('📊 Database date range after fix:', verifyResult.rows[0]);

    res.json({
      success: true,
      message: 'Year fix completed',
      entries_updated: updateResult.rowCount,
      entries_found_2024: count2024,
      new_date_range: verifyResult.rows[0]
    });
  } catch (error) {
    console.error('❌ Error fixing year:', error);
    res.status(500).json({
      error: 'Year fix failed',
      details: error.message
    });
  }
});

module.exports = router;
