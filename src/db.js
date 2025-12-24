const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

async function getClient() {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);

  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };

  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release.apply(client);
  };

  return client;
}

// Inicializacija baze - ustvari tabelo če ne obstaja
async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...');

    // Ustvari tabelo entries če ne obstaja
    await pool.query(`
      CREATE TABLE IF NOT EXISTS entries (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 5),
        mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
        stress INTEGER NOT NULL CHECK (stress >= 1 AND stress <= 5),
        stomach_pain INTEGER NOT NULL CHECK (stomach_pain >= 1 AND stomach_pain <= 5),
        stool INTEGER NOT NULL CHECK (stool >= 1 AND stool <= 5),
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ustvari index če ne obstaja
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp DESC)
    `);

    console.log('✅ Database initialized successfully');
    console.log('   - Table "entries" ready');
    console.log('   - Index "idx_entries_timestamp" ready');

    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

module.exports = {
  query,
  getClient,
  pool,
  initializeDatabase
};
