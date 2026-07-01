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

        // Tabela Perfil da Empresa (Apenas 1 registro esperado)
        db.run(`
            CREATE TABLE IF NOT EXISTS tenant_profiles (
                id TEXT PRIMARY KEY,
                company_name TEXT,
                company_domain TEXT,
                industry TEXT,
                description TEXT,
                value_proposition TEXT,
                target_audience TEXT,
                brand_voice TEXT
            )
        `);

        // Tabela Produtos
        db.run(`
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT,
                description TEXT,
                features TEXT,
                target_buyer TEXT,
                pricing_plans TEXT
            )
        `);

        // Tabela Campanhas
        db.run(`
            CREATE TABLE IF NOT EXISTS campaigns (
                id TEXT PRIMARY KEY,
                name TEXT,
                segment TEXT,
                countries TEXT,
                states TEXT,
                cities TEXT,
                language TEXT,
                target_product TEXT,
                limit_daily INTEGER,
                frequency TEXT,
                status TEXT,
                progress INTEGER,
                current_step TEXT
            )
        `);

        // Tabela de API Keys (Apenas 1 registro esperado)
        db.run(`
            CREATE TABLE IF NOT EXISTS api_keys (
                id TEXT PRIMARY KEY,
                openai TEXT,
                gemini TEXT,
                anthropic TEXT,
                apollo TEXT,
                hunter TEXT,
                resend TEXT,
                whatsapp_token TEXT,
                whatsapp_instance TEXT,
                telegram_token TEXT,
                telegram_chat_id TEXT,
                linkedin_cookie TEXT
            )
        `);

        // Tabela de Memória & IA (Insights Retidos)
        db.run(`
            CREATE TABLE IF NOT EXISTS ai_memory (
                id TEXT PRIMARY KEY,
                type TEXT,
                content TEXT,
                context TEXT,
                created_at TEXT
            )
        `);

        console.log('Tabelas inicializadas com sucesso.');
    });
}

initDatabase();

module.exports = db;
