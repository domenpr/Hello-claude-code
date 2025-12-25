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

    /* Summary cards */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }

    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .summary-card h3 {
      font-size: 0.9rem;
      opacity: 0.9;
      margin-bottom: 10px;
      font-weight: 500;
    }

    .summary-card .value {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .summary-card .trend {
      font-size: 0.85rem;
      opacity: 0.9;
    }

    .trend.up::before { content: '↑ '; }
    .trend.down::before { content: '↓ '; }
    .trend.stable::before { content: '→ '; }

    /* Time filters */
    .time-filters {
      display: flex;
      gap: 10px;
      margin-bottom: 25px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 10px 20px;
      background: #f0f0f0;
      border: 2px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 500;
      color: #555;
      transition: all 0.3s;
    }

    .filter-btn:hover {
      background: #e0e0e0;
    }

    .filter-btn.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    @media (max-width: 768px) {
      .header h1 {
        font-size: 1.8rem;
      }

      .entry-stats {
        grid-template-columns: 1fr 1fr;
      }

      .chart-container {
        height: 350px;
      }

      .summary-cards {
        grid-template-columns: 1fr 1fr;
      }

      .summary-card .value {
        font-size: 1.6rem;
      }

      .filter-btn {
        flex: 1;
        min-width: calc(50% - 5px);
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
        <!-- 7-dnevni povzetek kartice -->
        <div class="summary-cards" id="weekSummary">
          <div class="summary-card">
            <h3>Energija (7 dni povpr.)</h3>
            <div class="value" id="summaryEnergy">-</div>
            <div class="trend" id="summaryEnergyTrend"></div>
          </div>
          <div class="summary-card">
            <h3>Stres (7 dni povpr.)</h3>
            <div class="value" id="summaryStress">-</div>
            <div class="trend" id="summaryStressTrend"></div>
          </div>
          <div class="summary-card">
            <h3>Idealno blato (%)</h3>
            <div class="value" id="summaryStool">-</div>
            <div class="trend">7-dnevni prikaz</div>
          </div>
        </div>

        <!-- Časovni filtri -->
        <div class="time-filters">
          <button class="filter-btn" data-days="7">7 dni</button>
          <button class="filter-btn active" data-days="14">14 dni</button>
          <button class="filter-btn" data-days="30">30 dni</button>
          <button class="filter-btn" data-days="all">Vse</button>
        </div>

        <!-- Grafi -->
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
    // Globalne spremenljivke za grafe
    let healthChart = null;
    let stoolChart = null;
    let currentDays = 14; // Privzeto 14 dni

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

        // Če kliknemo na grafe tab, naloži podatke
        if (tab.dataset.tab === 'charts') {
          loadWeekSummary();
          loadCharts(currentDays);
        }
      });
    });

    // Časovni filtri - event listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const days = btn.dataset.days;
        currentDays = days === 'all' ? 'all' : parseInt(days);
        loadCharts(currentDays);
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
          loadWeekSummary();
          loadCharts(currentDays);
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

    // Naloži 7-dnevni povzetek
    async function loadWeekSummary() {
      try {
        const response = await fetch('/api/summary/week');
        const data = await response.json();

        if (data.success && data.week_summary) {
          const summary = data.week_summary;

          // Posodobi kartice
          document.getElementById('summaryEnergy').textContent =
            summary.avg_energy ? parseFloat(summary.avg_energy).toFixed(1) : '-';

          document.getElementById('summaryStress').textContent =
            summary.avg_stress ? parseFloat(summary.avg_stress).toFixed(1) : '-';

          document.getElementById('summaryStool').textContent =
            summary.ideal_stool_percentage !== undefined ? summary.ideal_stool_percentage + '%' : '-';

          // Posodobi trend oznake
          const energyTrend = document.getElementById('summaryEnergyTrend');
          energyTrend.className = 'trend ' + summary.energy_trend;
          energyTrend.textContent = summary.energy_trend === 'up' ? 'napredek' :
                                    summary.energy_trend === 'down' ? 'upadanje' : 'stabilno';

          const stressTrend = document.getElementById('summaryStressTrend');
          stressTrend.className = 'trend ' + summary.stress_trend;
          stressTrend.textContent = summary.stress_trend === 'up' ? 'povečanje' :
                                    summary.stress_trend === 'down' ? 'zmanjšanje' : 'stabilno';
        }
      } catch (error) {
        console.error('Error loading week summary:', error);
      }
    }

    // Naloži grafe
    async function loadCharts(days = 14) {
      try {
        // Za 30+ dni uporabljamo dnevno agregacijo
        const useAggregation = days >= 30 || days === 'all';
        let apiUrl = '';
        let entries = [];
        let labels = [];

        if (useAggregation) {
          // Dnevna agregacija
          apiUrl = days === 'all' ? '/api/entries/daily?days=365' : '/api/entries/daily?days=' + days;
          const response = await fetch(apiUrl);
          const data = await response.json();

          if (!data.daily_entries || data.daily_entries.length === 0) {
            return;
          }

          // Razvrsti po datumu (najstarejši prvi)
          entries = data.daily_entries.reverse();

          labels = entries.map(e => {
            const d = new Date(e.date);
            return d.toLocaleDateString('sl-SI', { month: 'short', day: 'numeric' });
          });
        } else {
          // Običajni prikaz (3×/dan)
          apiUrl = days === 'all' ? '/api/entries?limit=1000' : '/api/entries?days=' + days + '&limit=1000';
          const response = await fetch(apiUrl);
          const data = await response.json();

          if (!data.entries || data.entries.length === 0) {
            return;
          }

          // Razvrsti po času (najstarejši prvi za graf)
          entries = data.entries.reverse();

          labels = entries.map(e => {
            const d = new Date(e.timestamp);
            // Za mobilni prikaz - manj goste oznake
            return d.toLocaleDateString('sl-SI', {
              month: 'short',
              day: 'numeric',
              hour: entries.length > 50 ? undefined : '2-digit',
              minute: entries.length > 50 ? undefined : '2-digit'
            });
          });
        }

        // Graf za energijo, stres in bolečino v trebuhu
        const ctx1 = document.getElementById('healthChart').getContext('2d');
        if (healthChart) healthChart.destroy();

        healthChart = new Chart(ctx1, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Energija',
                data: entries.map(e => useAggregation ? parseFloat(e.avg_energy) : e.energy),
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                yAxisID: 'y'
              },
              {
                label: 'Stres',
                data: entries.map(e => useAggregation ? parseFloat(e.avg_stress) : e.stress),
                borderColor: '#FF9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                tension: 0.4,
                yAxisID: 'y'
              },
              {
                label: 'Bolečina v trebuhu',
                data: entries.map(e => useAggregation ? e.max_stomach_pain : e.stomach_pain),
                borderColor: '#F44336',
                backgroundColor: 'rgba(244, 67, 54, 0.3)',
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                yAxisID: 'y2' // Sekundarna os
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false
            },
            plugins: {
              title: {
                display: true,
                text: useAggregation ? 'Dnevno povprečje' : 'Energija, Stres in Bolečina',
                font: { size: 16 }
              },
              legend: {
                display: true,
                labels: {
                  usePointStyle: true,
                  padding: 15
                }
              }
            },
            scales: {
              x: {
                ticks: {
                  maxRotation: 45,
                  minRotation: 30,
                  autoSkip: true,
                  maxTicksLimit: entries.length > 50 ? 15 : 30
                }
              },
              y: {
                type: 'linear',
                position: 'left',
                min: 1,
                max: 5,
                ticks: {
                  stepSize: 1
                },
                title: {
                  display: true,
                  text: 'Energija / Stres (1-5)',
                  font: { size: 12 }
                }
              },
              y2: {
                type: 'linear',
                position: 'right',
                min: 0,
                max: 5,
                ticks: {
                  stepSize: 1
                },
                title: {
                  display: true,
                  text: 'Bolečina (0-5)',
                  font: { size: 12 },
                  color: '#F44336'
                },
                grid: {
                  drawOnChartArea: false
                }
              }
            }
          }
        });

        // Graf za blato
        const ctx2 = document.getElementById('stoolChart').getContext('2d');
        if (stoolChart) stoolChart.destroy();

        // Filtriraj samo vnose kjer je stool definiran (jutro)
        const stoolEntries = entries.filter(e => useAggregation ? e.last_stool !== null : e.stool !== null);
        const stoolLabels = stoolEntries.map((e, i) => {
          if (useAggregation) {
            const d = new Date(e.date);
            return d.toLocaleDateString('sl-SI', { month: 'short', day: 'numeric' });
          } else {
            const d = new Date(e.timestamp);
            return d.toLocaleDateString('sl-SI', {
              month: 'short',
              day: 'numeric',
              hour: stoolEntries.length > 30 ? undefined : '2-digit'
            });
          }
        });

        const stoolData = stoolEntries.map(e => useAggregation ? e.last_stool : e.stool);

        stoolChart = new Chart(ctx2, {
          type: 'bar',
          data: {
            labels: stoolLabels,
            datasets: [
              {
                label: 'Blato',
                data: stoolData,
                backgroundColor: stoolData.map(v => v === 4 ? '#4CAF50' : '#FFC107'),
                borderColor: stoolData.map(v => v === 4 ? '#388E3C' : '#FFA000'),
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
                text: 'Blato: 4 = idealno (zeleno)',
                font: { size: 16 }
              },
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.parsed.y;
                    const labels = ['', 'trdo', 'srednje', 'normalno', 'idealno', 'mehko'];
                    return labels[value] + ' (' + value + ')';
                  }
                }
              }
            },
            scales: {
              x: {
                ticks: {
                  maxRotation: 45,
                  minRotation: 30,
                  autoSkip: true,
                  maxTicksLimit: stoolEntries.length > 30 ? 10 : 20
                }
              },
              y: {
                min: 0,
                max: 5,
                ticks: {
                  stepSize: 1,
                  callback: function(value) {
                    const labels = ['', 'trdo', 'srednje', 'normalno', 'idealno', 'mehko'];
                    return labels[value] || '';
                  }
                },
                title: {
                  display: true,
                  text: 'Kvaliteta blata',
                  font: { size: 12 }
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
    // Grafe in povzetek naložimo samo ko uporabnik klikne na "Grafi" tab

    // Osveži vsakih 30 sekund (samo vnose, ne grafov)
    setInterval(() => {
      loadEntries();
      // Ne osvežujemo grafov avtomatsko, da ne prekinemo uporabnikovega ogleda
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

    // Preberi SQL file
    const sqlContent = await fs.readFile(migrationPath, 'utf8');
    console.log(`📄 SQL file size: ${sqlContent.length} bytes`);

    // Razbiči na posamezne INSERT stavke (ignoriraj komentarje in prazne vrstice)
    const insertStatements = sqlContent
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('--');
      })
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && stmt.toUpperCase().startsWith('INSERT'));

    console.log(`🔍 Found ${insertStatements.length} INSERT statements`);

    if (insertStatements.length === 0) {
      console.log('⚠️  No INSERT statements found');
      return;
    }

    // Izvedi v transakciji
    const client = await pool.connect();
    try {
      console.log('🔒 Starting transaction...');
      await client.query('BEGIN');

      for (const stmt of insertStatements) {
        await client.query(stmt);
      }

      await client.query('COMMIT');
      console.log('✅ Transaction committed');

    } catch (e) {
      await client.query('ROLLBACK');
      console.error('❌ Import failed on statement:', e.message);
      throw e;
    } finally {
      client.release();
    }

    // Preveri število vnosov v bazi
    const { rows } = await pool.query('SELECT COUNT(*) AS c FROM entries');
    console.log(`📊 Entries in DB after import: ${rows[0].c}`);

    console.log('✅ Historical data import completed');

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
