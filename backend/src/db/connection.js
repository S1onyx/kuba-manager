import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';
import initializeSchema from './schema.js';

const __dirname = import.meta.dirname;

const dataDir = path.resolve(__dirname, '..', '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'scoreboard.sqlite');
const wasmPath = path.resolve(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
const wasmDir = path.dirname(wasmPath);

let sqlModulePromise;
let databaseInstance;

async function loadSqlModule() {
  if (!sqlModulePromise) {
    sqlModulePromise = initSqlJs({
      locateFile: (file) => path.join(wasmDir, file)
    });
  }
  return sqlModulePromise;
}

async function openDatabase() {
  const SQL = await loadSqlModule();
  const fileExists = fs.existsSync(dbPath);
  const db = fileExists ? new SQL.Database(fs.readFileSync(dbPath)) : new SQL.Database();
  initializeSchema(db);
  return { SQL, db };
}

export async function getConnection() {
  if (!databaseInstance) {
    databaseInstance = await openDatabase();
  }
  return databaseInstance;
}

export async function withConnection(callback) {
  const connection = await getConnection();
  return callback(connection);
}

export function persistDatabase(db, SQL) {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export const databasePaths = {
  dataDir,
  dbPath
};
