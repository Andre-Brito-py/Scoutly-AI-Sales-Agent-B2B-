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

app.post('/api/leads/:id/book', (req, res) => {
    const { id } = req.params;
    
    // 1. Atualiza status no banco
    db.run(`UPDATE leads SET status = 'booked' WHERE id = $1`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // 2. Busca dados do lead para enviar o webhook
        db.get('SELECT * FROM leads WHERE id = $1', [id], (err, lead) => {
            if (err || !lead) return res.json({ success: true, webhook_sent: false, reason: 'Lead not found for webhook' });
            
            // 2.5 Busca o canal de comunicação preferido no outreach_logs
            db.get('SELECT channel FROM outreach_logs WHERE lead_id = $1 ORDER BY sent_at DESC LIMIT 1', [id], (err, log) => {
                const preferredChannel = log && log.channel ? log.channel : 'email';
                
                // 3. Busca a URL do Webhook e a API Key no banco
                db.get('SELECT vysify_webhook_url, vysify_api_key FROM api_keys LIMIT 1', [], async (err, keys) => {
                    if (err || !keys || !keys.vysify_webhook_url) {
                        return res.json({ success: true, webhook_sent: false, reason: 'Webhook URL not configured' });
                    }
                    
                    // 4. Dispara o Webhook para o Vysify com autenticação
                    try {
                        console.log(`[Webhook] Enviando lead ${lead.companyName} para Vysify (Canal: ${preferredChannel})...`);
                        const headers = { 'Content-Type': 'application/json' };
                        if (keys.vysify_api_key) {
                            headers['Authorization'] = `Bearer ${keys.vysify_api_key}`;
                        }
                        const response = await fetch(keys.vysify_webhook_url, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({
                                source: 'scoutly',
                                event: 'meeting_booked',
                                preferredChannel: preferredChannel,
                                lead: lead
                            })
                        });
                        console.log(`[Webhook] Resposta do Vysify: ${response.status}`);
                        res.json({ success: true, webhook_sent: true });
                    } catch (webhookErr) {
                        console.error(`[Webhook] Erro ao enviar para Vysify:`, webhookErr.message);
                        res.json({ success: true, webhook_sent: false, reason: 'Webhook request failed' });
                    }
                });
            });
        });
    });
});

app.post('/api/webhooks/vysify-feedback', async (req, res) => {
    // Expected Payload: { status: 'won', lead: { companyName, contactName, email, phone, personalizedMessage, preferredChannel, segment } }
    const { status, lead } = req.body;
    
    if (status !== 'won' || !lead || !lead.personalizedMessage) {
        return res.json({ success: true, reason: 'Ignorado. Status não é won ou dados ausentes.' });
    }

    try {
        console.log(`[Webhook Feedback] Negócio Fechado no Vysify! Extraindo insight para ${lead.companyName}...`);
        
        // Fetch OpenAI key
        db.get('SELECT openai FROM api_keys LIMIT 1', [], async (err, keys) => {
            const memoryAgent = new MemoryAgent(keys ? keys.openai : null);
            const segment = lead.segment || 'Geral';
            const channel = lead.preferredChannel || 'email';
            
            // Extract the golden rule
            const insight = await memoryAgent.extractInsight(lead.companyName, segment, channel, lead.personalizedMessage);
            
            console.log(`[MemoryAgent] Novo Insight: ${insight}`);
            
            // Save to database
            const insightId = 'ins_' + Date.now();
            db.run(
                `INSERT INTO ai_memory (id, type, content, context, created_at) VALUES ($1, 'insight', $2, $3, $4)`,
                [insightId, insight, `Lead: ${lead.companyName} | Canal: ${channel}`, new Date().toISOString()]
            );
            
            res.json({ success: true, insight_extracted: true });
        });
    } catch (e) {
        console.error(`[Webhook Feedback] Erro:`, e.message);
        res.status(500).json({ error: 'Erro ao processar feedback' });
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
        `INSERT INTO products (id, name, description, features, target_buyer, pricing_plans) VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, name, description, features, target_buyer, pricing_plans],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, features, target_buyer, pricing_plans } = req.body;
    db.run(
        `UPDATE products SET name = $1, description = $2, features = $3, target_buyer = $4, pricing_plans = $5 WHERE id = $6`,
        [name, description, features, target_buyer, pricing_plans, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM products WHERE id = $1`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
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

app.delete('/api/campaigns/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM campaigns WHERE id = $1`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Campanha excluída com sucesso.' });
    });
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

app.delete('/api/outreach-logs', (req, res) => {
    db.run(`DELETE FROM outreach_logs`, [], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.run(`DELETE FROM leads`, [], function(errLeads) {
            if (errLeads) return res.status(500).json({ error: errLeads.message });
            res.json({ success: true, message: 'Logs e leads limpos com sucesso.' });
        });
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
    const { openai, gemini, anthropic, apollo, hunter, resend, whatsappToken, whatsappInstance, telegramToken, telegramChatId, linkedinCookie, twilioAccountSid, twilioAuthToken, twilioPhoneNumber, vysifyWebhookUrl, vysifyApiKey, evolutionApiUrl, evolutionApiKey, evolutionInstance, googleMapsApiKey } = req.body;
    db.run(
        `INSERT INTO api_keys (id, openai, gemini, anthropic, apollo, hunter, resend, whatsapp_token, whatsapp_instance, telegram_token, telegram_chat_id, linkedin_cookie, twilio_account_sid, twilio_auth_token, twilio_phone_number, vysify_webhook_url, vysify_api_key, evolution_api_url, evolution_api_key, evolution_instance, google_maps_api_key)
         VALUES ('keys_1', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
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
            linkedin_cookie=excluded.linkedin_cookie,
            twilio_account_sid=excluded.twilio_account_sid,
            twilio_auth_token=excluded.twilio_auth_token,
            twilio_phone_number=excluded.twilio_phone_number,
            vysify_webhook_url=excluded.vysify_webhook_url,
            vysify_api_key=excluded.vysify_api_key,
            evolution_api_url=excluded.evolution_api_url,
            evolution_api_key=excluded.evolution_api_key,
            evolution_instance=excluded.evolution_instance,
            google_maps_api_key=excluded.google_maps_api_key`,
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
            linkedinCookie || null,
            twilioAccountSid || null,
            twilioAuthToken || null,
            twilioPhoneNumber || null,
            vysifyWebhookUrl || null,
            vysifyApiKey || null,
            evolutionApiUrl || null,
            evolutionApiKey || null,
            evolutionInstance || null,
            googleMapsApiKey || null
        ],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// --- Rotas do Motor Autônomo ---

/**
 * POST /api/campaigns/start
 * Ativado pelo frontend ao ligar uma campanha.
 * Persiste search_criteria no banco e dispara imediatamente.
 */
app.post('/api/campaigns/start', async (req, res) => {
    const { campaignId, searchCriteria } = req.body;
    if (!campaignId || !searchCriteria) {
        return res.status(400).json({ error: 'campaignId e searchCriteria são obrigatórios.' });
    }
    try {
        const result = await engine.startCampaign(campaignId, searchCriteria);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/campaigns/stop
 * Pausa a campanha alterando o status no banco.
 */
app.post('/api/campaigns/stop', async (req, res) => {
    const { campaignId } = req.body;
    if (!campaignId) return res.status(400).json({ error: 'campaignId obrigatório.' });
    try {
        const result = await engine.stopCampaign(campaignId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/campaigns/trigger-scheduled
 * ─────────────────────────────────────────────────────────────────
 * Este endpoint é chamado pelo cron-jobs.org uma vez por dia.
 * Ele lê todas as campanhas com status='active' do banco e as executa.
 *
 * Como configurar no cron-jobs.org:
 *   URL: https://SEU_BACKEND.up.railway.app/api/campaigns/trigger-scheduled
 *   Método: GET
 *   Horário: Escolha o horário desejado (ex: 09:00 todos os dias)
 *   Auth: Adicione o header  X-Cron-Secret: SEU_CRON_SECRET
 * ─────────────────────────────────────────────────────────────────
 */
app.get('/api/campaigns/trigger-scheduled', async (req, res) => {
    // Validação básica por segredo (configure CRON_SECRET nas variáveis de ambiente)
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const providedSecret = req.headers['x-cron-secret'] || req.query.secret;
        if (providedSecret !== cronSecret) {
            console.warn('[Trigger] Tentativa de acesso não autorizada ao trigger de cron.');
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }
    }

    try {
        const result = await engine.runScheduledCampaigns();
        console.log(`[Trigger] Cron executado. Campanhas disparadas: ${result.triggered}`);
        res.json({ success: true, ...result, triggeredAt: new Date().toISOString() });
    } catch (err) {
        console.error('[Trigger] Erro ao executar campanhas agendadas:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/campaigns/status
 * Retorna status de execução em memória (campanhas rodando agora)
 */
app.get('/api/campaigns/status', (req, res) => {
    res.json({
        runningNow: [...engine.runningCampaigns]
    });
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
