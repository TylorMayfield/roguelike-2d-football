import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

export class DatabaseManager {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'game.db');
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        stats TEXT
      )
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);
  }

  public query(sql: string, params: any[] = []) {
    const stmt = this.db.prepare(sql);
    if (sql.trim().toLowerCase().startsWith('select')) {
      return stmt.all(...params);
    } else {
      return stmt.run(...params);
    }
  }

  public close() {
    this.db.close();
  }
}
