const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'scoutly.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar com o banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

function initDatabase() {
    db.serialize(() => {
        // Tabela de Leads
        db.run(`
            CREATE TABLE IF NOT EXISTS leads (
                id TEXT PRIMARY KEY,
                companyName TEXT NOT NULL,
                website TEXT,
                score INTEGER,
                scoreReason TEXT,
                contactName TEXT,
                contactRole TEXT,
                status TEXT,
                personalizedMessage TEXT,
                email TEXT,
                phone TEXT,
                importedAt TEXT
            )
        `);

        // Tabela de Logs de Disparos
        db.run(`
            CREATE TABLE IF NOT EXISTS outreach_logs (
                id TEXT PRIMARY KEY,
                lead_id TEXT NOT NULL,
                campaign_id TEXT,
                channel TEXT,
                recipient TEXT,
                message_content TEXT,
                status TEXT,
                error_message TEXT,
                sent_at TEXT,
                FOREIGN KEY (lead_id) REFERENCES leads (id)
            )
        `);

        console.log('Tabelas inicializadas com sucesso.');
    });
}

initDatabase();

module.exports = db;
