require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');

    const migrationFile = path.join(__dirname, '001_create_entries.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    await pool.query(sql);

    console.log('✅ Migration 001_create_entries.sql completed successfully');
    console.log('📊 Database schema is up to date');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
