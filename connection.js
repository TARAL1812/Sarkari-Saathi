import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config/index.js';

class SQLiteWrapper {
  constructor(filename) {
    this.raw = new DatabaseSync(filename);
  }

  pragma(pragmaStr) {
    return this.raw.exec(`PRAGMA ${pragmaStr};`);
  }

  exec(sql) {
    return this.raw.exec(sql);
  }

  prepare(sql) {
    const stmt = this.raw.prepare(sql);
    return {
      run: (...args) => stmt.run(...args),
      get: (...args) => stmt.get(...args),
      all: (...args) => stmt.all(...args),
    };
  }

  transaction(fn) {
    const raw = this.raw;
    return function (...args) {
      raw.exec('BEGIN');
      try {
        const result = fn.apply(this, args);
        raw.exec('COMMIT');
        return result;
      } catch (err) {
        try { raw.exec('ROLLBACK'); } catch { /* ignore rollback failure */ }
        throw err;
      }
    };
  }

  close() {
    return this.raw.close();
  }
}

let db;

export function getDb() {
  if (db) return db;
  fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
  db = new SQLiteWrapper(config.databasePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export function setDb(instance) {
  if (db && db !== instance) {
    try { db.close(); } catch { /* already closed */ }
  }
  db = instance;
}

export function openMemoryDb() {
  closeDb();
  db = new SQLiteWrapper(':memory:');
  db.pragma('foreign_keys = ON');
  return db;
}

export function withTransaction(work) {
  return getDb().transaction(work)();
}
