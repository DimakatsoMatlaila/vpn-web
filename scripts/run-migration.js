#!/usr/bin/env node

/**
 * Database Migration Runner
 * Runs SQL migration files against PostgreSQL or MySQL databases
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not set in .env.local');
  console.error('');
  console.error('Cannot run migrations without a database connection.');
  console.error('The app will run in DEMO MODE with in-memory storage.');
  console.error('');
  console.error('To use a real database:');
  console.error('1. Set up PostgreSQL or MySQL');
  console.error('2. Add DATABASE_URL to .env.local');
  console.error('3. Run this script again');
  process.exit(1);
}

// Detect database type
const isPostgres = DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://');
const isMySQL = DATABASE_URL.startsWith('mysql://');

if (!isPostgres && !isMySQL) {
  console.error('❌ ERROR: Unsupported database type');
  console.error('DATABASE_URL must start with postgresql:// or mysql://');
  process.exit(1);
}

console.log('🔧 Wits Cyber Database Migration Tool\n');
console.log(`Database Type: ${isPostgres ? 'PostgreSQL' : 'MySQL'}`);
console.log(`Connection: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}\n`);

async function runPostgresqlMigration() {
  const { Client } = require('pg');
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('📡 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const migrationFile = path.join(__dirname, 'migrations', '001_postgresql_schema.sql');
    console.log(`📄 Reading migration: ${path.basename(migrationFile)}`);
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('⚙️  Executing migration...');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Database schema initialized:');
    console.log('   - users table');
    console.log('   - user_profiles table');
    console.log('   - oauth_clients table');
    console.log('   - oauth_authorization_codes table');
    console.log('   - oauth_access_tokens table');
    console.log('   - oauth_refresh_tokens table');
    console.log('   - sessions table');
    console.log('   - ctfd_sso_tokens table');
    console.log('   - audit_logs table');
    console.log('   - All indexes and triggers\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function runMySQLMigration() {
  const mysql = require('mysql2/promise');
  
  try {
    console.log('📡 Connecting to MySQL...');
    const connection = await mysql.createConnection(DATABASE_URL);
    console.log('✅ Connected successfully\n');

    const migrationFile = path.join(__dirname, 'migrations', '002_mysql_schema.sql');
    console.log(`📄 Reading migration: ${path.basename(migrationFile)}`);
    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Split SQL into individual statements (MySQL doesn't support multi-statement by default)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`⚙️  Executing ${statements.length} SQL statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          await connection.query(statement);
          // Show progress for long migrations
          if ((i + 1) % 5 === 0) {
            console.log(`   Executed ${i + 1}/${statements.length} statements...`);
          }
        } catch (error) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists')) {
            throw error;
          }
        }
      }
    }
    
    console.log('\n✅ Migration completed successfully!\n');
    console.log('📊 Database schema initialized:');
    console.log('   - users table');
    console.log('   - user_profiles table');
    console.log('   - oauth_clients table');
    console.log('   - oauth_authorization_codes table');
    console.log('   - oauth_access_tokens table');
    console.log('   - oauth_refresh_tokens table');
    console.log('   - sessions table');
    console.log('   - ctfd_sso_tokens table');
    console.log('   - audit_logs table');
    console.log('   - Default OAuth clients (moodle, ctfd)\n');

    await connection.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function main() {
  // Check if required packages are installed
  const requiredPackage = isPostgres ? 'pg' : 'mysql2';
  try {
    require.resolve(requiredPackage);
  } catch (e) {
    console.error(`❌ ERROR: ${requiredPackage} package not installed`);
    console.error(`\nPlease install it first:`);
    console.error(`   npm install ${requiredPackage}`);
    process.exit(1);
  }

  if (isPostgres) {
    await runPostgresqlMigration();
  } else {
    await runMySQLMigration();
  }

  console.log('🎉 All done! Your database is ready to use.\n');
  console.log('Next steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Visit http://localhost:3000');
  console.log('3. Register a new user account\n');
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
