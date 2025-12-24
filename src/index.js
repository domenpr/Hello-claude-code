require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const apiRoutes = require('./routes');
const { initializeDatabase, pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// Statične datoteke (če bodo potrebne)
app.use(express.static(path.join(__dirname, '../public')));

// Glavna stran - Health Tracker
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Health Tracker</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      color: white;
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }

    .header p {
      font-size: 1.1rem;
      opacity: 0.9;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }

    .card h2 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.5rem;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #555;
      font-weight: 500;
    }

    .slider-container {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    input[type="range"] {
      flex: 1;
      height: 8px;
      border-radius: 5px;
      background: #ddd;
      outline: none;
      -webkit-appearance: none;
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #667eea;
      cursor: pointer;
    }

    input[type="range"]::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #667eea;
      cursor: pointer;
      border: none;
    }

    .value-display {
      min-width: 40px;
      text-align: center;
      font-weight: bold;
      font-size: 1.2rem;
      color: #667eea;
    }

    textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-family: inherit;
      font-size: 1rem;
      resize: vertical;
      min-height: 80px;
    }

    textarea:focus {
      outline: none;
      border-color: #667eea;
    }

    .btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 15px 40px;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      width: 100%;
      transition: transform 0.2s;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .message {
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: none;
    }

    .message.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .message.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .message.show {
      display: block;
    }

    .chart-container {
      position: relative;
      height: 400px;
      margin-top: 20px;
    }

    .entries-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .entry-item {
      padding: 15px;
      border-bottom: 1px solid #eee;
    }

    .entry-item:last-child {
      border-bottom: none;
    }

    .entry-date {
      font-weight: 600;
      color: #667eea;
      margin-bottom: 8px;
    }

    .entry-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-bottom: 8px;
    }

    .stat {
      font-size: 0.9rem;
      color: #666;
    }

    .stat strong {
      color: #333;
    }

    .entry-note {
      font-style: italic;
      color: #888;
      margin-top: 8px;
    }

    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      border-bottom: 2px solid #eee;
    }

    .tab {
      padding: 10px 20px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      color: #666;
      border-bottom: 3px solid transparent;
      transition: all 0.3s;
    }

    .tab.active {
      color: #667eea;
      border-bottom-color: #667eea;
      font-weight: 600;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    @media (max-width: 768px) {
      .header h1 {
        font-size: 1.8rem;
      }

      .entry-stats {
        grid-template-columns: 1fr 1fr;
      }

      .chart-container {
        height: 300px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Health Tracker</h1>
      <p>Sledite svojemu zdravju in počutju 3× dnevno</p>
    </div>

    <div class="message" id="message"></div>

    <div class="card">
      <h2>📝 Nov vnos</h2>
      <form id="entryForm">
        <div class="form-group">
          <label>⚡ Energija (1 = zelo nizka, 5 = zelo visoka)</label>
          <div class="slider-container">
            <input type="range" id="energy" name="energy" min="1" max="5" value="3">
            <span class="value-display" id="energyValue">3</span>
          </div>
        </div>

        <div class="form-group">
          <label>😊 Razpoloženje (1 = zelo slabo, 5 = odlično)</label>
          <div class="slider-container">
            <input type="range" id="mood" name="mood" min="1" max="5" value="3">
            <span class="value-display" id="moodValue">3</span>
          </div>
        </div>

        <div class="form-group">
          <label>😰 Stres (1 = brez stresa, 5 = zelo stresno)</label>
          <div class="slider-container">
            <input type="range" id="stress" name="stress" min="1" max="5" value="3">
            <span class="value-display" id="stressValue">3</span>
          </div>
        </div>

        <div class="form-group">
          <label>🤕 Bolečina v trebuhu (1 = brez bolečine, 5 = huda bolečina)</label>
          <div class="slider-container">
            <input type="range" id="stomach_pain" name="stomach_pain" min="1" max="5" value="1">
            <span class="value-display" id="stomach_painValue">1</span>
          </div>
        </div>

        <div class="form-group">
          <label>💩 Blato (1 = zelo slabo, 4 = idealno, 5 = slabo)</label>
          <div class="slider-container">
            <input type="range" id="stool" name="stool" min="1" max="5" value="4">
            <span class="value-display" id="stoolValue">4</span>
          </div>
        </div>

        <div class="form-group">
          <label>📋 Opomba (opcijsko)</label>
          <textarea id="note" name="note" placeholder="Dodaj komentar, opombo ali kaj zanimivega..."></textarea>
        </div>

        <button type="submit" class="btn" id="submitBtn">Shrani vnos</button>
      </form>
    </div>

    <div class="card">
      <div class="tabs">
        <button class="tab active" data-tab="recent">Zadnji vnosi</button>
        <button class="tab" data-tab="charts">Grafi</button>
      </div>

      <div class="tab-content active" id="recent">
        <div class="entries-list" id="entriesList">
          <p style="text-align: center; color: #999;">Nalaganje...</p>
        </div>
      </div>

      <div class="tab-content" id="charts">
        <div class="chart-container">
          <canvas id="healthChart"></canvas>
        </div>
        <div class="chart-container" style="margin-top: 40px;">
          <canvas id="stoolChart"></canvas>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Posodobitev vrednosti sliderjev
    ['energy', 'mood', 'stress', 'stomach_pain', 'stool'].forEach(field => {
      const slider = document.getElementById(field);
      const display = document.getElementById(field + 'Value');
      slider.addEventListener('input', (e) => {
        display.textContent = e.target.value;
      });
    });

    // Tab navigacija
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
      });
    });

    // Prikaz sporočila
    function showMessage(text, type = 'success') {
      const message = document.getElementById('message');
      message.textContent = text;
      message.className = 'message show ' + type;
      setTimeout(() => {
        message.classList.remove('show');
      }, 5000);
    }

    // Oddaja forme
    document.getElementById('entryForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Shranjujem...';

      const formData = {
        energy: parseInt(document.getElementById('energy').value),
        mood: parseInt(document.getElementById('mood').value),
        stress: parseInt(document.getElementById('stress').value),
        stomach_pain: parseInt(document.getElementById('stomach_pain').value),
        stool: parseInt(document.getElementById('stool').value),
        note: document.getElementById('note').value || null
      };

      try {
        const response = await fetch('/api/entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
          showMessage('✅ Vnos uspešno shranjen!', 'success');
          document.getElementById('entryForm').reset();
          // Reset slider displays
          ['energy', 'mood', 'stress'].forEach(f => {
            document.getElementById(f + 'Value').textContent = '3';
          });
          document.getElementById('stomach_painValue').textContent = '1';
          document.getElementById('stoolValue').textContent = '4';

          // Osveži prikaz
          loadEntries();
          loadCharts();
        } else {
          showMessage('❌ ' + (data.error || 'Napaka pri shranjevanju'), 'error');
        }
      } catch (error) {
        showMessage('❌ Napaka pri povezavi s strežnikom', 'error');
        console.error('Error:', error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Shrani vnos';
      }
    });

    // Pridobi zadnje vnose
    async function loadEntries() {
      try {
        const response = await fetch('/api/entries?limit=10');
        const data = await response.json();

        const list = document.getElementById('entriesList');

        if (data.entries && data.entries.length > 0) {
          list.innerHTML = data.entries.map(entry => {
            const date = new Date(entry.timestamp).toLocaleString('sl-SI');
            return \`
              <div class="entry-item">
                <div class="entry-date">\${date}</div>
                <div class="entry-stats">
                  <div class="stat">⚡ Energija: <strong>\${entry.energy}/5</strong></div>
                  <div class="stat">😊 Razpoloženje: <strong>\${entry.mood}/5</strong></div>
                  <div class="stat">😰 Stres: <strong>\${entry.stress}/5</strong></div>
                  <div class="stat">🤕 Bolečina: <strong>\${entry.stomach_pain}/5</strong></div>
                  <div class="stat">💩 Blato: <strong>\${entry.stool}/5</strong> \${entry.stool === 4 ? '✅' : ''}</div>
                </div>
                \${entry.note ? '<div class="entry-note">"' + entry.note + '"</div>' : ''}
              </div>
            \`;
          }).join('');
        } else {
          list.innerHTML = '<p style="text-align: center; color: #999;">Še ni vnosov. Dodaj prvega!</p>';
        }
      } catch (error) {
        console.error('Error loading entries:', error);
        document.getElementById('entriesList').innerHTML =
          '<p style="text-align: center; color: #999;">Napaka pri nalaganju vnosov</p>';
      }
    }

    // Naloži grafe
    let healthChart, stoolChart;

    async function loadCharts() {
      try {
        const response = await fetch('/api/entries?limit=30');
        const data = await response.json();

        if (!data.entries || data.entries.length === 0) {
          return;
        }

        // Razvrsti po času (najstarejši prvi za graf)
        const entries = data.entries.reverse();

        const labels = entries.map(e => {
          const d = new Date(e.timestamp);
          return d.toLocaleDateString('sl-SI', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        });

        // Graf za energijo, stres in bolečine
        const ctx1 = document.getElementById('healthChart').getContext('2d');
        if (healthChart) healthChart.destroy();

        healthChart = new Chart(ctx1, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Energija',
                data: entries.map(e => e.energy),
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4
              },
              {
                label: 'Stres',
                data: entries.map(e => e.stress),
                borderColor: '#FF9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                tension: 0.4
              },
              {
                label: 'Bolečina v trebuhu',
                data: entries.map(e => e.stomach_pain),
                borderColor: '#F44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'Energija, Stres in Bolečina v Trebuhu'
              }
            },
            scales: {
              y: {
                min: 1,
                max: 5,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });

        // Graf za blato
        const ctx2 = document.getElementById('stoolChart').getContext('2d');
        if (stoolChart) stoolChart.destroy();

        stoolChart = new Chart(ctx2, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Blato (4 = idealno)',
                data: entries.map(e => e.stool),
                backgroundColor: entries.map(e => e.stool === 4 ? '#4CAF50' : '#FFC107'),
                borderColor: entries.map(e => e.stool === 4 ? '#388E3C' : '#FFA000'),
                borderWidth: 2
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'Blato (zelena = idealno)'
              }
            },
            scales: {
              y: {
                min: 1,
                max: 5,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });
      } catch (error) {
        console.error('Error loading charts:', error);
      }
    }

    // Naloži podatke ob nalaganju strani
    loadEntries();
    loadCharts();

    // Osveži vsakih 30 sekund
    setInterval(() => {
      loadEntries();
      loadCharts();
    }, 30000);
  </script>
</body>
</html>
  `;
  res.send(html);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Funkcija za samodejni import zgodovinskih podatkov ob zagonu
async function runHistoricalImportIfEnabled() {
  // Preveri ali je import omogočen
  if (process.env.ENABLE_IMPORT !== '1') {
    console.log('ℹ️  Historical data import disabled (set ENABLE_IMPORT=1 to enable)');
    return;
  }

  try {
    console.log('🔄 Starting historical data import...');

    // Ustvari unique constraint za idempotentnost
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS entries_timestamp_unique ON entries(timestamp)
    `);
    console.log('   - Unique index on timestamp created');

    // Pot do migration datoteke
    const migrationPath = path.join(__dirname, '..', 'migrations', '002_import_historical_data.sql');
    console.log(`📁 Reading migration file: ${migrationPath}`);

    // Preveri ali datoteka obstaja
    try {
      await fs.access(migrationPath);
    } catch (err) {
      throw new Error(`Migration file not found at ${migrationPath}`);
    }

    // Preberi SQL datoteko
    const sqlContent = await fs.readFile(migrationPath, 'utf8');
    console.log(`📄 SQL file size: ${sqlContent.length} bytes`);

    // Razdeli na INSERT stavke
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && s.startsWith('INSERT'));

    console.log(`🔍 Found ${statements.length} INSERT statements`);

    if (statements.length === 0) {
      console.log('⚠️  No INSERT statements found in migration file');
      return;
    }

    // Izvedi vsak INSERT z ON CONFLICT DO NOTHING za idempotentnost
    let insertedCount = 0;
    let skippedCount = 0;

    for (const statement of statements) {
      const modifiedStatement = statement + ' ON CONFLICT (timestamp) DO NOTHING';
      const result = await pool.query(modifiedStatement);
      insertedCount += result.rowCount;

      // Preštej preskočene vnose
      const expectedRows = (statement.match(/\),/g) || []).length + 1;
      skippedCount += (expectedRows - result.rowCount);
    }

    console.log('✅ Historical data import completed');
    console.log(`   - Inserted: ${insertedCount} entries`);
    console.log(`   - Skipped: ${skippedCount} entries (already exist)`);
    console.log(`   - Total statements: ${statements.length}`);

  } catch (error) {
    console.error('❌ Historical data import failed:', error.message);
    console.error('   Stack:', error.stack);
    // Ne stopiraj aplikacije, samo loga napako
  }
}

// Inicializacija in zagon serverja
async function startServer() {
  try {
    // Inicializiraj bazo (ustvari tabelo če ne obstaja)
    await initializeDatabase();

    // Poženi samodejni import zgodovinskih podatkov (če je omogočen)
    await runHistoricalImportIfEnabled();

    // Zaženi server
    app.listen(PORT, () => {
      console.log(`🚀 Health Tracker teče na portu ${PORT}`);
      console.log(`📊 API endpoints:`);
      console.log(`   POST /api/entries - Dodaj nov vnos`);
      console.log(`   GET  /api/entries - Pridobi vnose`);
      console.log(`   GET  /api/summary - Pridobi statistiko`);
      console.log(`   GET  /api/health - Health check`);
      console.log(`\nPritisnite CTRL+C za ustavitev strežnika`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Zaženi aplikacijo
startServer();
