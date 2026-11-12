import { getConnection, persistDatabase } from '../../db/connection.js';

export class CallitError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function queryAll(sql, params = []) {
  const { db } = await getConnection();
  const stmt = db.prepare(sql);
  const rows = [];
  try {
    stmt.bind(params);
    while (stmt.step()) rows.push(stmt.getAsObject());
  } finally {
    stmt.free();
  }
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await queryAll(sql, params);
  return rows[0] ?? null;
}

// Mehrere Schreib-Statements, danach genau einmal persistieren.
export async function write(statements) {
  const { SQL, db } = await getConnection();
  const list = Array.isArray(statements[0]) ? statements : [statements];
  list.forEach(([sql, params = []]) => db.run(sql, params));
  const changes = db.getRowsModified();
  const lastId = db.exec('SELECT last_insert_rowid()')[0]?.values?.[0]?.[0] ?? null;
  persistDatabase(db, SQL);
  return { changes, lastId };
}

export function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
