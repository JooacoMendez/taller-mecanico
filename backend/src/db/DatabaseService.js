const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

class DatabaseService {
  constructor() {
    this.dbInstance = null;
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  async connect() {
    if (this.dbInstance) return;
    if (this.isConnecting) return this.connectionPromise;

    this.isConnecting = true;
    this.connectionPromise = (async () => {
      try {
        const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '..', '..', 'database.sqlite');
        this.dbInstance = await open({
          filename: dbPath,
          driver: sqlite3.Database
        });
        // Enable foreign keys
        await this.dbInstance.run('PRAGMA foreign_keys = ON;');
        console.log(`✅ Conectado a SQLite (${dbPath})`);
      } catch (err) {
        console.error('❌ Error al conectar a la base de datos:', err);
        throw err;
      } finally {
        this.isConnecting = false;
      }
    })();
    return this.connectionPromise;
  }

  // Method that mimics pg pool.query interface
  async query(text, params = []) {
    await this.connect();

    // Convert PostgreSQL positional parameters ($1, $2) to ?1, ?2 for sqlite3 array bindings.
    // This allows using the same parameter multiple times in the same query (like PG does).
    let sqliteText = text.replace(/\$(\d+)/g, '?$1');

    try {
      // Is it a SELECT or something else?
      const isSelect = /^\s*(SELECT|WITH)/i.test(sqliteText);
      
      let rows = [];
      let rowCount = 0;

      if (text.toUpperCase().includes('RETURNING') || isSelect) {
        rows = await this.dbInstance.all(sqliteText, params);
        rowCount = rows.length;
      } else {
        const result = await this.dbInstance.run(sqliteText, params);
        rowCount = result.changes;
      }
      
      return { rows, rowCount };

    } catch (error) {
      // In sqlite, UNIQUE constraint error is SQLITE_CONSTRAINT
      // Let's mock pg's '23505' code for unique violation to not break controllers
      if (error.code === 'SQLITE_CONSTRAINT' || error.message.includes('UNIQUE constraint failed')) {
        error.code = '23505';
      }
      throw error;
    }
  }

  // Allow closing the connection if needed
  async close() {
    if (this.dbInstance) {
      await this.dbInstance.close();
      this.dbInstance = null;
    }
  }
}

// Export a singleton instance
module.exports = new DatabaseService();
