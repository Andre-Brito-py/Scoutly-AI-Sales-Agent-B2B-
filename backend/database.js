const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/scoutly',
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
    console.error('Erro inesperado no banco de dados do Postgres:', err);
});

async function initDatabase() {
    try {
        const client = await pool.connect();
        console.log('Conectado ao banco de dados PostgreSQL.');

        // Tabela de Leads
        await client.query(`
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
        await client.query(`
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
        await client.query(`
            CREATE TABLE IF NOT EXISTS tenant_profiles (
                id TEXT PRIMARY KEY,
                company_name TEXT,
                company_domain TEXT,
                company_context TEXT,
                ai_instructions TEXT,
                calendar_link TEXT
            )
        `);

        // Tabela Produtos
        await client.query(`
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
        await client.query(`
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
                current_step TEXT,
                search_criteria TEXT,
                channel TEXT,
                last_run_at TEXT
            )
        `);

        // Tabela de API Keys (Apenas 1 registro esperado)
        await client.query(`
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
                linkedin_cookie TEXT,
                twilio_account_sid TEXT,
                twilio_auth_token TEXT,
                twilio_phone_number TEXT,
                vysify_webhook_url TEXT,
                vysify_api_key TEXT,
                evolution_api_url TEXT,
                evolution_api_key TEXT,
                evolution_instance TEXT,
                google_maps_api_key TEXT
            )
        `);

        // Safely add columns if they don't exist (for existing deployments)
        try {
            await client.query(`ALTER TABLE api_keys ADD COLUMN twilio_account_sid TEXT`);
            await client.query(`ALTER TABLE api_keys ADD COLUMN twilio_auth_token TEXT`);
            await client.query(`ALTER TABLE api_keys ADD COLUMN twilio_phone_number TEXT`);
            await client.query(`ALTER TABLE api_keys ADD COLUMN vysify_webhook_url TEXT`);
            await client.query(`ALTER TABLE api_keys ADD COLUMN vysify_api_key TEXT`);
            await client.query(`ALTER TABLE api_keys ADD COLUMN evolution_api_url TEXT`);
            await client.query(`ALTER TABLE api_keys ADD COLUMN evolution_api_key TEXT`);
            await client.query(`ALTER TABLE api_keys ADD COLUMN evolution_instance TEXT`);
            await client.query(`ALTER TABLE api_keys ADD COLUMN google_maps_api_key TEXT`);
        } catch (e) {
            // Columns might already exist, ignore error
        }

        // Safely add new columns to campaigns table
        try {
            await client.query(`ALTER TABLE campaigns ADD COLUMN search_criteria TEXT`);
            await client.query(`ALTER TABLE campaigns ADD COLUMN channel TEXT`);
            await client.query(`ALTER TABLE campaigns ADD COLUMN last_run_at TEXT`);
        } catch (e) {
            // Columns might already exist, ignore error
        }

        // Tabela de Memória & IA (Insights Retidos)
        await client.query(`
            CREATE TABLE IF NOT EXISTS ai_memory (
                id TEXT PRIMARY KEY,
                type TEXT,
                content TEXT,
                context TEXT,
                created_at TEXT
            )
        `);

        console.log('Tabelas inicializadas com sucesso.');
        client.release();
    } catch (err) {
        console.error('Erro ao inicializar tabelas:', err);
    }
}

initDatabase();

// Wrapper simples para manter a mesma interface do sqlite3 e minimizar alterações no server.js
const db = {
    pool,
    query: (text, params) => pool.query(text, params),
    all: (text, params, cb) => pool.query(text, params, (err, res) => cb(err, res ? res.rows : null)),
    get: (text, params, cb) => pool.query(text, params, (err, res) => cb(err, res && res.rows.length > 0 ? res.rows[0] : null)),
    run: (text, params, cb) => pool.query(text, params, (err, res) => {
        if (cb) cb.call({ changes: res ? res.rowCount : 0 }, err);
    })
};

module.exports = db;
