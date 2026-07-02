const express = require('express');
const cors = require('cors');
const db = require('./database');
const CompanyIntelligenceAgent = require('./agents/CompanyIntelligenceAgent');
const PainFinderAgent = require('./agents/PainFinderAgent');
const ScoringAgent = require('./agents/ScoringAgent');
const CopywriterAgent = require('./agents/CopywriterAgent');
const { sendEmail, sendWhatsApp } = require('./outreach');
const engine = require('./engine');

const app = express();
app.use(cors());
app.use(express.json());

// Rotas de Leads
app.get('/api/leads', (req, res) => {
    db.all('SELECT * FROM leads', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/leads', (req, res) => {
    const { id, companyName, website, score, scoreReason, contactName, contactRole, status, personalizedMessage, email, phone, importedAt } = req.body;
    
    db.run(
        `INSERT INTO leads (id, companyName, website, score, scoreReason, contactName, contactRole, status, personalizedMessage, email, phone, importedAt) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [id, companyName, website, score, scoreReason, contactName, contactRole, status, personalizedMessage, email, phone, importedAt],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'Lead criado com sucesso', id });
        }
    );
});

// Rota para Score via Equipe de Agentes (Multi-Agent Pipeline)
app.post('/api/score', async (req, res) => {
    try {
        const leadData = req.body;
        
        // Instancia a equipe de agentes
        const intelligence = new CompanyIntelligenceAgent();
        const painFinder = new PainFinderAgent();
        const scorer = new ScoringAgent();
        const copywriter = new CopywriterAgent();

        // Pipeline Sequencial
        console.log(`[Agent Team] Analisando empresa: ${leadData.companyName}`);
        
        // 1. Company Intelligence Agent lê o site
        const companySummary = await intelligence.analyzeCompany(leadData);
        
        // 2. Pain Finder Agent levanta as dores
        const painPoints = await painFinder.findPains(companySummary);
        
        // 3. Scoring Agent dá a nota e gera a Estratégia de Investimento
        const { score, strategy } = await scorer.generateStrategy(leadData, companySummary, painPoints);
        
        // 4. Copywriter Agent redige a mensagem focado na Estratégia
        const personalizedMessage = await copywriter.writeMessage(leadData, painPoints, strategy);
        
        // Consolida o dossiê na "scoreReason" para o usuário ver
        const fullDossier = `ESTRATÉGIA DA IA:\n${strategy}\n\nDORES MAPEADAS:\n${painPoints}\n\nRESUMO DA EMPRESA:\n${companySummary}`;

        db.run(
            `UPDATE leads SET score = $1, scoreReason = $2, personalizedMessage = $3, status = 'enriched' WHERE id = $4`,
            [score, fullDossier, personalizedMessage, leadData.id],
            function(err) {
                if (err) console.error('Erro ao salvar score:', err);
            }
        );

        res.json({
            score: score,
            reason: fullDossier,
            message: personalizedMessage
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro no pipeline dos Agentes.' });
    }
});

// Rota para Envio de E-mail / WhatsApp
app.post('/api/send', async (req, res) => {
    const { lead_id, channel, recipient, subject, message_content, campaign_id } = req.body;
    
    try {
        let dispatchResult;
        
        if (channel === 'email') {
            dispatchResult = await sendEmail(recipient, subject || 'Sobre o nosso papo', message_content);
        } else if (channel === 'whatsapp') {
            dispatchResult = await sendWhatsApp(recipient, message_content);
        } else {
            return res.status(400).json({ error: 'Canal inválido.' });
        }

        const logId = 'log_' + Date.now();
        db.run(
            `INSERT INTO outreach_logs (id, lead_id, campaign_id, channel, recipient, message_content, status, sent_at)
             VALUES ($1, $2, $3, $4, $5, $6, 'sent', $7)`,
            [logId, lead_id, campaign_id, channel, recipient, message_content, new Date().toISOString()]
        );

        // Atualiza status do lead
        db.run(`UPDATE leads SET status = 'sent' WHERE id = $1`, [lead_id]);

        res.json({ success: true, dispatchId: dispatchResult.id });
    } catch (error) {
        res.status(500).json({ error: 'Erro no disparo.' });
    }
});

// --- Rota de Perfil da Empresa ---
app.get('/api/profile', (req, res) => {
    db.get('SELECT * FROM tenant_profiles LIMIT 1', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || {});
    });
});

app.post('/api/profile', (req, res) => {
    const { company_name, company_domain, company_context, ai_instructions, calendar_link } = req.body;
    db.run(
        `INSERT INTO tenant_profiles (id, company_name, company_domain, company_context, ai_instructions, calendar_link)
         VALUES ('profile_1', $1, $2, $3, $4, $5)
         ON CONFLICT(id) DO UPDATE SET 
            company_name=excluded.company_name, 
            company_domain=excluded.company_domain, 
            company_context=excluded.company_context,
            ai_instructions=excluded.ai_instructions,
            calendar_link=excluded.calendar_link`,
        [company_name, company_domain, company_context, ai_instructions, calendar_link],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// --- Rotas de Produtos ---
app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/products', (req, res) => {
    const { id, name, description, features, target_buyer, pricing_plans } = req.body;
    db.run(
        `INSERT INTO products (id, name, description, features) VALUES ($1, $2, $3, $4)`,
        [id, name, description, features],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// --- Rotas de Campanhas ---
app.get('/api/campaigns', (req, res) => {
    db.all('SELECT * FROM campaigns', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Desserializa os arrays
        const campaigns = rows.map(r => ({
            ...r,
            countries: r.countries ? JSON.parse(r.countries) : [],
            states: r.states ? JSON.parse(r.states) : []
        }));
        res.json(campaigns);
    });
});

app.post('/api/campaigns', (req, res) => {
    const { id, name, segment, countries, states, cities, language, target_product, limit_daily, frequency, status, progress, current_step } = req.body;
    db.run(
        `INSERT INTO campaigns (id, name, segment, countries, states, cities, language, target_product, limit_daily, frequency, status, progress, current_step) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [id, name, segment, JSON.stringify(countries), JSON.stringify(states), cities, language, target_product, limit_daily, frequency, status, progress, current_step],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// --- Rotas de Logs de Disparo ---
app.get('/api/outreach-logs', (req, res) => {
    db.all(`
        SELECT l.*, leads.companyName, leads.email, leads.contactName 
        FROM outreach_logs l
        LEFT JOIN leads ON l.lead_id = leads.id
        ORDER BY l.sent_at DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Mapear para o formato aninhado que o React espera (log.lead.companyName)
        const formattedRows = rows.map(r => ({
            ...r,
            lead: {
                companyName: r.companyName,
                email: r.email,
                contactName: r.contactName
            }
        }));
        
        res.json(formattedRows);
    });
});

// --- Rotas de Chaves de API ---
app.get('/api/keys', (req, res) => {
    db.get('SELECT * FROM api_keys LIMIT 1', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || {});
    });
});

app.post('/api/keys', (req, res) => {
    const { openai, gemini, anthropic, apollo, hunter, resend, whatsappToken, whatsappInstance, telegramToken, telegramChatId, linkedinCookie } = req.body;
    db.run(
        `INSERT INTO api_keys (id, openai, gemini, anthropic, apollo, hunter, resend, whatsapp_token, whatsapp_instance, telegram_token, telegram_chat_id, linkedin_cookie)
         VALUES ('keys_1', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT(id) DO UPDATE SET 
            openai=excluded.openai,
            gemini=excluded.gemini,
            anthropic=excluded.anthropic,
            apollo=excluded.apollo,
            hunter=excluded.hunter,
            resend=excluded.resend,
            whatsapp_token=excluded.whatsapp_token,
            whatsapp_instance=excluded.whatsapp_instance,
            telegram_token=excluded.telegram_token,
            telegram_chat_id=excluded.telegram_chat_id,
            linkedin_cookie=excluded.linkedin_cookie`,
        [
            openai || null, 
            gemini || null, 
            anthropic || null, 
            apollo || null, 
            hunter || null, 
            resend || null, 
            whatsappToken || null, 
            whatsappInstance || null, 
            telegramToken || null, 
            telegramChatId || null, 
            linkedinCookie || null
        ],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// --- Rotas do Motor Autônomo ---

app.post('/api/campaigns/start', (req, res) => {
    const { campaignId, frequency, searchCriteria } = req.body;
    if (!campaignId || !frequency || !searchCriteria) {
        return res.status(400).json({ error: 'Dados incompletos para iniciar campanha.' });
    }
    const result = engine.startCampaign(campaignId, frequency, searchCriteria);
    if (result.error) return res.status(400).json(result);
    res.json(result);
});

app.post('/api/campaigns/stop', (req, res) => {
    const { campaignId } = req.body;
    const result = engine.stopCampaign(campaignId);
    if (result.error) return res.status(400).json(result);
    res.json(result);
});

// --- Rotas de Memória & IA ---
const MemoryAgent = require('./agents/MemoryAgent');

app.get('/api/memory', (req, res) => {
    db.all('SELECT * FROM ai_memory ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/memory/learn', (req, res) => {
    const { leadId, companyName, messageContent } = req.body;
    
    // Buscar a API key do banco
    db.get('SELECT openai FROM api_keys LIMIT 1', [], async (err, row) => {
        const apiKey = row ? row.openai : null;
        const memoryAgent = new MemoryAgent(apiKey);
        
        const insight = await memoryAgent.extractInsight(companyName, 'B2B', messageContent);
        
        // Salva o insight (Regra aprendida)
        const insightId = 'ins_' + Date.now();
        db.run(`INSERT INTO ai_memory (id, type, content, context, created_at) VALUES ($1, 'insight', $2, $3, $4)`,
            [insightId, insight, `Aprendido com ${companyName}`, new Date().toISOString()]);
        
        // Salva também a abordagem campeã (O texto retido)
        const approachId = 'app_' + Date.now();
        db.run(`INSERT INTO ai_memory (id, type, content, context, created_at) VALUES ($1, 'approach', $2, $3, $4)`,
            [approachId, messageContent, `Usado em ${companyName}`, new Date().toISOString()]);
            
        res.json({ success: true, insight });
    });
});

// Rotas de Dashboard / Testes
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', message: 'Backend rodando com sucesso!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
