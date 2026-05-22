#!/usr/bin/env node

/**
 * ManagerFlow — Installation & Setup Script
 * Run: node setup.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

let errors = [];
let warnings = [];

function log(msg) { console.log(msg); }
function ok(msg) { log(`${GREEN}✓${RESET} ${msg}`); }
function warn(msg) { log(`${YELLOW}⚠${RESET} ${msg}`); warnings.push(msg); }
function fail(msg) { log(`${RED}✗${RESET} ${msg}`); errors.push(msg); }
function info(msg) { log(`${CYAN}ℹ${RESET} ${msg}`); }

function checkCommand(cmd, name, installUrl) {
  try {
    const version = execSync(`${cmd}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    ok(`${name}: ${version}`);
    return true;
  } catch {
    fail(`${name} not found`);
    info(`  Install: ${installUrl}`);
    return false;
  }
}

function checkNodeVersion() {
  try {
    const version = execSync('node --version', { encoding: 'utf8' }).trim();
    const major = parseInt(version.replace('v', '').split('.')[0]);
    if (major >= 18) {
      ok(`Node.js: ${version}`);
      return true;
    } else {
      fail(`Node.js ${version} found, but v18+ is required`);
      info('  Install: https://nodejs.org/');
      return false;
    }
  } catch {
    fail('Node.js not found');
    info('  Install: https://nodejs.org/');
    return false;
  }
}

function checkMySQL() {
  try {
    const version = execSync('mysql --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    ok(`MySQL client: ${version.split('\n')[0]}`);
  } catch {
    fail('MySQL client not found');
    info('  Install: https://dev.mysql.com/downloads/mysql/');
    return false;
  }

  // Check if MySQL server is running
  try {
    execSync('mysqladmin ping -u root --silent 2>&1', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    ok('MySQL server: running');
  } catch {
    // Try without auth
    try {
      execSync('mysqladmin ping --silent 2>&1', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      ok('MySQL server: running');
    } catch {
      fail('MySQL server is not running');
      info('  Start MySQL service:');
      info('    Windows: net start mysql');
      info('    macOS:   brew services start mysql');
      info('    Linux:   sudo systemctl start mysql');
      return false;
    }
  }
  return true;
}

function checkEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    if (content.includes('DATABASE_URL')) {
      ok('.env file: found with DATABASE_URL');
      return true;
    } else {
      fail('.env file exists but missing DATABASE_URL');
      return false;
    }
  } else {
    warn('.env file not found — creating template...');
    fs.writeFileSync(envPath, 'DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/managerflow"\n');
    info('  Created .env — please update the MySQL password');
    return false;
  }
}

function installDeps() {
  info('Installing root dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    ok('Root dependencies installed');
  } catch {
    fail('Failed to install root dependencies');
    return false;
  }

  info('Installing API dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, 'apps', 'api') });
    ok('API dependencies installed');
  } catch {
    fail('Failed to install API dependencies');
    return false;
  }

  info('Installing Web dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, 'apps', 'web') });
    ok('Web dependencies installed');
  } catch {
    fail('Failed to install Web dependencies');
    return false;
  }

  return true;
}

function setupDatabase() {
  info('Pushing database schema...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit', cwd: __dirname });
    ok('Database schema pushed');
  } catch {
    fail('Failed to push database schema');
    info('  Make sure:');
    info('  1. MySQL is running');
    info('  2. The database "managerflow" exists (CREATE DATABASE managerflow;)');
    info('  3. The password in .env is correct');
    return false;
  }

  info('Seeding demo data...');
  try {
    execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit', cwd: __dirname });
    ok('Demo data seeded');
  } catch {
    fail('Failed to seed data');
    return false;
  }

  return true;
}

// ─── MAIN ───────────────────────────────────────────────

log('');
log('╔══════════════════════════════════════════════╗');
log('║     ManagerFlow — Installation Script        ║');
log('╚══════════════════════════════════════════════╝');
log('');

log('─── Checking Prerequisites ───');
log('');

const nodeOk = checkNodeVersion();
checkCommand('npm --version', 'npm', 'Comes with Node.js');
const mysqlOk = checkMySQL();

log('');
log('─── Checking Project Files ───');
log('');

const envOk = checkEnvFile();

if (errors.length > 0 && !nodeOk) {
  log('');
  log(`${RED}═══ Setup cannot continue ═══${RESET}`);
  log('');
  log('Please fix the following issues:');
  errors.forEach(e => log(`  ${RED}•${RESET} ${e}`));
  log('');
  log('After fixing, run this script again: node setup.js');
  process.exit(1);
}

if (!mysqlOk) {
  log('');
  log(`${RED}═══ MySQL is required ═══${RESET}`);
  log('');
  log('Please install and start MySQL 8, then:');
  log('  1. Create the database:');
  log(`     ${CYAN}mysql -u root -p -e "CREATE DATABASE managerflow;"${RESET}`);
  log('  2. Update .env with your MySQL password');
  log('  3. Run this script again: node setup.js');
  process.exit(1);
}

if (!envOk) {
  log('');
  log(`${YELLOW}═══ Action Required ═══${RESET}`);
  log('');
  log('Please edit .env and set your MySQL password, then run: node setup.js');
  process.exit(1);
}

log('');
log('─── Installing Dependencies ───');
log('');

if (!installDeps()) {
  process.exit(1);
}

log('');
log('─── Setting Up Database ───');
log('');

if (!setupDatabase()) {
  process.exit(1);
}

log('');
log(`${GREEN}╔══════════════════════════════════════════════╗${RESET}`);
log(`${GREEN}║         ✓ Setup Complete!                    ║${RESET}`);
log(`${GREEN}╚══════════════════════════════════════════════╝${RESET}`);
log('');
log('To start the application:');
log('');
log(`  ${CYAN}Terminal 1 (API):${RESET}     cd apps/api && npm run dev`);
log(`  ${CYAN}Terminal 2 (Web):${RESET}     cd apps/web && npm run dev`);
log('');
log('Then open: http://localhost:3000');
log('');
log('Demo Logins:');
log(`  Admin:           admin@demo.com / admin123`);
log(`  Senior Manager:  ramesh@demo.com / demo123`);
log(`  Line Manager:    manju@demo.com / demo123`);
log('');
