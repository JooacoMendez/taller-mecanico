const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");

class DatabaseService {
    constructor() {
        this.dbInstance = null;
        this.dbPath = null;
        this.isConnecting = false;
        this.connectionPromise = null;
    }

    async connect() {
        if (this.dbInstance) return;
        if (this.isConnecting) return this.connectionPromise;

        this.isConnecting = true;
        this.connectionPromise = (async () => {
            try {
                this.dbPath =
                    process.env.SQLITE_PATH ||
                    path.join(__dirname, "..", "..", "database.sqlite");

                // Ensure the directory exists
                const dir = path.dirname(this.dbPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                const SQL = await initSqlJs();

                // Load existing database if it exists
                if (fs.existsSync(this.dbPath)) {
                    const fileBuffer = fs.readFileSync(this.dbPath);
                    this.dbInstance = new SQL.Database(fileBuffer);
                } else {
                    this.dbInstance = new SQL.Database();
                }

                // Enable foreign keys
                this.dbInstance.run("PRAGMA foreign_keys = ON;");

                console.log(`✅ Conectado a SQLite (${this.dbPath})`);
            } catch (err) {
                console.error("❌ Error al conectar a la base de datos:", err);
                throw err;
            } finally {
                this.isConnecting = false;
            }
        })();
        return this.connectionPromise;
    }

    // Save database to disk (debounced and ASYNCHRONOUS to avoid blocking UI)
    _save() {
        if (this.dbInstance && this.dbPath) {
            if (this.saveTimeout) clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                const data = this.dbInstance.export();
                const buffer = Buffer.from(data);
                // USING ASYNC WRITE SO IT DOESN'T FREEZE THE ELECTRON MAIN PROCESS
                fs.promises.writeFile(this.dbPath, buffer)
                    .catch(err => console.error("Error guardando BD:", err));
            }, 500);
        }
    }

    // Method that mimics pg pool.query interface
    async query(text, params = []) {
        await this.connect();

        // Convert PostgreSQL positional parameters ($1, $2) to ?
        // and reorder params to match
        let sqliteText = text;
        const dollarParams = text.match(/\$(\d+)/g);

        if (dollarParams) {
            const reorderedParams = [];
            sqliteText = text.replace(/\$(\d+)/g, (match, num) => {
                reorderedParams.push(params[parseInt(num) - 1]);
                return "?";
            });
            params = reorderedParams;
        }

        try {
            const isSelect = /^\s*(SELECT|WITH)/i.test(sqliteText);
            const hasReturning = text.toUpperCase().includes("RETURNING");

            let rows = [];
            let rowCount = 0;

            if (hasReturning || isSelect) {
                const stmt = this.dbInstance.prepare(sqliteText);
                if (params.length > 0) {
                    stmt.bind(params);
                }
                rows = [];
                while (stmt.step()) {
                    const row = stmt.getAsObject();
                    rows.push(row);
                }
                stmt.free();
                rowCount = rows.length;
            } else {
                this.dbInstance.run(sqliteText, params);
                rowCount = this.dbInstance.getRowsModified();
            }

            // Save after write operations
            if (!isSelect) {
                this._save();
            }

            return { rows, rowCount };
        } catch (error) {
            // Mock pg's '23505' code for unique violation to not break controllers
            if (
                error.message &&
                error.message.includes("UNIQUE constraint failed")
            ) {
                error.code = "23505";
            }
            throw error;
        }
    }

    // Execute raw SQL (for init scripts)
    exec(sql) {
        if (this.dbInstance) {
            this.dbInstance.run(sql);
            this._save();
        }
    }

    // Allow closing the connection if needed
    async close() {
        if (this.dbInstance) {
            if (this.saveTimeout) clearTimeout(this.saveTimeout);
            // Force synchronous immediate save on close
            if (this.dbPath) {
                const data = this.dbInstance.export();
                const buffer = Buffer.from(data);
                fs.writeFileSync(this.dbPath, buffer);
            }
            this.dbInstance.close();
            this.dbInstance = null;
        }
    }
}

// Export a singleton instance
module.exports = new DatabaseService();
