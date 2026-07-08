const db = require('./database');
const GoogleMapsProvider = require('./providers/GoogleMapsProvider');
const CompanyIntelligenceAgent = require('./agents/CompanyIntelligenceAgent');
const PainFinderAgent = require('./agents/PainFinderAgent');
const ScoringAgent = require('./agents/ScoringAgent');
const CopywriterAgent = require('./agents/CopywriterAgent');
const { sendTelegramNotification, sendTwilioSMS, sendEmail, sendWhatsApp } = require('./outreach');

// Campanhas em execução no momento (evita execução paralela)
const runningCampaigns = new Set();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Pipeline completo de um único lead
// ---------------------------------------------------------------------------
async function processLeadAutomated(rawLead, campaignId, searchCriteria) {
    const provider = new GoogleMapsProvider();
    const formattedLead = provider.formatLead(rawLead);

    console.log(`\n[Engine] Iniciando pipeline para: ${formattedLead.companyName}`);

    // Deduplicação: ignora se o mesmo lead já foi processado nesta campanha
    const existing = await new Promise((res, rej) =>
        db.get(
            `SELECT id FROM outreach_logs WHERE lead_id IN (
                SELECT id FROM leads WHERE companyName = $1
             ) AND campaign_id = $2 LIMIT 1`,
            [formattedLead.companyName, campaignId],
            (err, row) => err ? rej(err) : res(row)
        )
    ).catch(() => null);

    if (existing) {
        console.log(`[Engine] Lead "${formattedLead.companyName}" já foi processado nesta campanha. Pulando.`);
        return;
    }

    // Salva o lead no banco (ON CONFLICT para evitar duplicatas)
    db.run(
        `INSERT INTO leads (id, companyName, contactName, contactRole, email, phone, website, status, importedAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'found', $8)
         ON CONFLICT (id) DO NOTHING`,
        [formattedLead.id, formattedLead.companyName, formattedLead.contactName,
         formattedLead.contactRole, formattedLead.email, formattedLead.phone,
         formattedLead.website, new Date().toISOString()]
    );

    // Carrega dependências (API keys, perfil, produtos, memória)
    let apiKeys = null;
    let memoryInsights = [];
    let tenantProfile = null;
    let productDetails = { name: 'Múltiplos Produtos', description: '', features: '' };

    try {
        apiKeys = await new Promise((res, rej) =>
            db.get('SELECT * FROM api_keys LIMIT 1', [], (err, row) => err ? rej(err) : res(row))
        );
        tenantProfile = await new Promise((res, rej) =>
            db.get('SELECT * FROM tenant_profiles LIMIT 1', [], (err, row) => err ? rej(err) : res(row))
        );
        memoryInsights = await new Promise((res, rej) =>
            db.all("SELECT content FROM ai_memory WHERE type = 'insight' LIMIT 3", [], (err, rows) => err ? rej(err) : res(rows))
        );

        let targetProducts = [];
        if (Array.isArray(searchCriteria.targetProducts)) {
            targetProducts = searchCriteria.targetProducts;
        } else if (typeof searchCriteria.targetProducts === 'string') {
            try {
                targetProducts = JSON.parse(searchCriteria.targetProducts || '[]');
                if (!Array.isArray(targetProducts)) targetProducts = [searchCriteria.targetProducts];
            } catch { targetProducts = [searchCriteria.targetProducts]; }
        }

        if (targetProducts.length > 0) {
            const placeholders = targetProducts.map((_, i) => `$${i + 1}`).join(',');
            const prodRows = await new Promise((res, rej) =>
                db.all(`SELECT * FROM products WHERE name IN (${placeholders})`, targetProducts, (err, rows) => err ? rej(err) : res(rows))
            );
            if (prodRows && prodRows.length > 0) {
                if (prodRows.length === 1) {
                    productDetails = prodRows[0];
                } else {
                    productDetails.name = 'CATÁLOGO DE PRODUTOS (ESCOLHA O MELHOR PARA O LEAD)';
                    productDetails.description = prodRows.map(p => `[${p.name}]\n${p.description}\nPreços: ${p.pricing_plans || 'N/A'}`).join('\n\n');
                    productDetails.features = prodRows.map(p => `[${p.name}]: ${p.features}\nAlvo: ${p.target_buyer || 'Geral'}`).join('\n\n');
                }
            }
        }
    } catch (e) {
        console.warn('[Engine] Erro ao carregar dependências:', e.message);
    }

    // Agentes de IA
    const openaiKey = apiKeys?.openai || null;
    const intelligence = new CompanyIntelligenceAgent(openaiKey);
    const painFinder = new PainFinderAgent(openaiKey);
    // Passa o segmento da campanha para o ScoringAgent usar nas regras dinâmicas
    const scorer = new ScoringAgent(openaiKey, searchCriteria.segment);
    const copywriter = new CopywriterAgent(openaiKey);

    const companySummary = await intelligence.analyzeCompany(formattedLead);
    const painPoints = await painFinder.findPains(companySummary);
    const { score, strategy } = await scorer.generateStrategy(formattedLead, companySummary, painPoints);

    const insightsStr = memoryInsights.map(m => `- ${m.content}`).join('\n');
    const finalInstructions = [searchCriteria.customInstructions, tenantProfile?.ai_instructions]
        .filter(Boolean).join(' | ');

    const personalizedMessage = await copywriter.writeMessage(
        formattedLead, painPoints, strategy,
        searchCriteria.language || 'Português',
        productDetails, insightsStr, finalInstructions,
        tenantProfile?.calendar_link, tenantProfile?.company_context
    );

    const fullDossier = `ESTRATÉGIA DA IA:\n${strategy}\n\nDORES MAPEADAS:\n${painPoints}\n\nRESUMO DA EMPRESA:\n${companySummary}`;

    db.run(
        `UPDATE leads SET score = $1, scoreReason = $2, personalizedMessage = $3, status = 'enriched' WHERE id = $4`,
        [score, fullDossier, personalizedMessage, formattedLead.id]
    );

    if (score < 70) {
        console.log(`[Engine] Lead ${formattedLead.companyName} reprovado (Score ${score}). Descartado.`);
        db.run(`UPDATE leads SET status = 'lost' WHERE id = $1`, [formattedLead.id]);
        return;
    }

    console.log(`[Engine] Lead ${formattedLead.companyName} aprovado (Score ${score}). Disparando...`);

    // Notificação Telegram (alertas internos)
    if (apiKeys?.telegram_token && apiKeys?.telegram_chat_id) {
        const text = `🚨 *Novo Lead Qualificado!*\n\n🏢 *Empresa:* ${formattedLead.companyName}\n🔥 *Score:* ${score}/100\n\n${companySummary}\n\n_Mensagem gerada e disparada!_`;
        await sendTelegramNotification(apiKeys.telegram_token, apiKeys.telegram_chat_id, text);
    }

    // -----------------------------------------------------------------------
    // Mecanismo de Disparo Outbound (com suporte a Fallback)
    // -----------------------------------------------------------------------
    const primaryChannel = searchCriteria.channel || 'whatsapp';
    const fallbackChannel = searchCriteria.fallback_channel || null;

    async function attemptSend(ch) {
        let currentRecipient = formattedLead.phone;
        if (ch === 'email') currentRecipient = formattedLead.email;

        let curStatus = 'sent';
        let curError = null;

        if (ch === 'sms' && apiKeys?.twilio_account_sid) {
            const sent = await sendTwilioSMS(
                apiKeys.twilio_account_sid, apiKeys.twilio_auth_token,
                apiKeys.twilio_phone_number, currentRecipient, personalizedMessage
            );
            if (!sent) { curStatus = 'failed'; curError = 'Twilio SMS falhou'; }

        } else if (ch === 'whatsapp' && (apiKeys?.evolution_api_url || apiKeys?.whatsapp_token)) {
            try {
                await sendWhatsApp(currentRecipient, personalizedMessage, {
                    evolutionUrl: apiKeys.evolution_api_url,
                    evolutionKey: apiKeys.evolution_api_key,
                    evolutionInstance: apiKeys.evolution_instance
                });
            } catch (err) {
                curStatus = 'failed';
                curError = err.message; // Pode ser 'NO_WHATSAPP'
            }

        } else if (ch === 'email' && apiKeys?.resend) {
            try {
                process.env.RESEND_API_KEY = apiKeys.resend;
                await sendEmail(
                    currentRecipient,
                    `Oportunidade para a ${formattedLead.companyName}`,
                    personalizedMessage.replace(/\n/g, '<br>')
                );
            } catch (err) {
                curStatus = 'failed';
                curError = 'Falha ao enviar Email: ' + err.message;
            }

        } else {
            curStatus = 'skipped';
            curError = `Canal "${ch}" não configurado ou sem credenciais.`;
        }

        return { status: curStatus, errorMessage: curError, recipient: currentRecipient };
    }

    // Executa disparo primário
    let result = await attemptSend(primaryChannel);

    // Se falhar porque não possui WhatsApp e houver um canal de fallback válido
    if (primaryChannel === 'whatsapp' && result.errorMessage === 'NO_WHATSAPP') {
        // Registra a falha do canal primário (WhatsApp inexistente) no log de disparos
        db.run(
            `INSERT INTO outreach_logs (id, lead_id, campaign_id, channel, recipient, message_content, status, error_message, sent_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            ['log_pri_' + Date.now(), formattedLead.id, campaignId, primaryChannel, result.recipient,
             personalizedMessage, 'no_whatsapp', 'Número de telefone sem WhatsApp ativo.', new Date().toISOString()]
        );
        console.log(`[Engine] Lead ${formattedLead.companyName} sem WhatsApp. Tentando canal secundário...`);

        if (fallbackChannel && fallbackChannel !== 'none' && fallbackChannel !== primaryChannel) {
            console.log(`[Engine] Chaveando para o canal secundário (fallback): ${fallbackChannel}`);
            result = await attemptSend(fallbackChannel);
            
            // Registra o log do canal secundário (definitivo)
            db.run(
                `INSERT INTO outreach_logs (id, lead_id, campaign_id, channel, recipient, message_content, status, error_message, sent_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                ['log_sec_' + Date.now(), formattedLead.id, campaignId, fallbackChannel, result.recipient,
                 personalizedMessage, result.status, result.errorMessage, new Date().toISOString()]
            );
        } else {
            // Se não houver fallback, atualiza o status final do lead como no_whatsapp
            result.status = 'no_whatsapp';
            result.errorMessage = 'Ignorado: Número sem WhatsApp ativo (sem canal secundário configurado).';
        }
    } else {
        // Registro normal (sem fallback necessário)
        db.run(
            `INSERT INTO outreach_logs (id, lead_id, campaign_id, channel, recipient, message_content, status, error_message, sent_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            ['log_' + Date.now(), formattedLead.id, campaignId, primaryChannel, result.recipient,
             personalizedMessage, result.status, result.errorMessage, new Date().toISOString()]
        );
    }

    db.run(`UPDATE leads SET status = $1 WHERE id = $2`, [result.status, formattedLead.id]);
    console.log(`[Engine] Status final de disparo para ${formattedLead.companyName} → ${result.status}`);
}

// ---------------------------------------------------------------------------
// Executa uma campanha completa (busca + processa todos os leads)
// ---------------------------------------------------------------------------
async function runCampaign(campaignId, searchCriteria) {
    if (runningCampaigns.has(campaignId)) {
        console.log(`[Engine] Campanha ${campaignId} já está rodando. Pulando disparo duplicado.`);
        return;
    }

    runningCampaigns.add(campaignId);
    console.log(`\n[Engine] ▶ Iniciando campanha ${campaignId}...`);

    // Atualiza last_run_at no banco
    db.run(`UPDATE campaigns SET last_run_at = $1 WHERE id = $2`,
        [new Date().toISOString(), campaignId]);

    try {
        let apiKeys = null;
        try {
            apiKeys = await new Promise((res, rej) =>
                db.get('SELECT * FROM api_keys LIMIT 1', [], (err, row) => err ? rej(err) : res(row))
            );
        } catch (e) { console.warn('[Engine] Erro ao carregar chaves:', e.message); }

        const provider = new GoogleMapsProvider(apiKeys?.google_maps_api_key);
        const rawLeads = await provider.searchLeads(searchCriteria);
        console.log(`[Engine] ${rawLeads.length} leads encontrados.`);

        for (const lead of rawLeads) {
            // Verifica se campanha foi pausada/removida do banco durante execução
            const campaignRow = await new Promise((res, rej) =>
                db.get(`SELECT status FROM campaigns WHERE id = $1`, [campaignId], (err, row) => err ? rej(err) : res(row))
            ).catch(() => null);

            if (!campaignRow || campaignRow.status !== 'active') {
                console.log(`[Engine] Campanha ${campaignId} foi pausada. Encerrando ciclo.`);
                break;
            }

            await processLeadAutomated(lead, campaignId, searchCriteria);
            console.log('[Engine] Pausa de 5s entre leads...');
            await sleep(5000);
        }

        console.log(`[Engine] ✅ Campanha ${campaignId} finalizada.`);
    } catch (err) {
        console.error(`[Engine] ❌ Erro crítico na campanha ${campaignId}:`, err.message);
    } finally {
        runningCampaigns.delete(campaignId);
    }
}

// ---------------------------------------------------------------------------
// Iniciado pelo POST /api/campaigns/start (frontend)
// Persiste no banco com status='active' e executa imediatamente
// ---------------------------------------------------------------------------
async function startCampaign(campaignId, searchCriteria) {
    // Persiste search_criteria no banco para que o cron externo possa relê-la
    await new Promise((res, rej) =>
        db.run(
            `UPDATE campaigns SET status = 'active', search_criteria = $1, last_run_at = NULL WHERE id = $2`,
            [JSON.stringify(searchCriteria), campaignId],
            (err) => err ? rej(err) : res()
        )
    ).catch(err => console.error('[Engine] Erro ao salvar search_criteria:', err.message));

    // Dispara imediatamente em background (não bloqueia a resposta HTTP)
    runCampaign(campaignId, searchCriteria);

    return { success: true, message: 'Campanha iniciada. O cron-jobs.org irá dispará-la diariamente.' };
}

// ---------------------------------------------------------------------------
// Pausa uma campanha (persiste no banco)
// ---------------------------------------------------------------------------
async function stopCampaign(campaignId) {
    await new Promise((res, rej) =>
        db.run(`UPDATE campaigns SET status = 'paused' WHERE id = $1`, [campaignId], (err) => err ? rej(err) : res())
    ).catch(() => {});

    return { success: true, message: 'Campanha pausada.' };
}

// ---------------------------------------------------------------------------
// Chamado pelo endpoint GET /api/campaigns/trigger-scheduled
// → Acionado pelo cron-jobs.org uma vez por dia
// → Roda todas as campanhas com status='active'
// ---------------------------------------------------------------------------
async function runScheduledCampaigns() {
    console.log('[Engine] 🕘 Trigger diário recebido. Verificando campanhas ativas...');

    const activeCampaigns = await new Promise((res, rej) =>
        db.all(
            `SELECT id, search_criteria FROM campaigns WHERE status = 'active' AND search_criteria IS NOT NULL`,
            [],
            (err, rows) => err ? rej(err) : res(rows)
        )
    ).catch(() => []);

    if (!activeCampaigns || activeCampaigns.length === 0) {
        console.log('[Engine] Nenhuma campanha ativa encontrada.');
        return { triggered: 0 };
    }

    console.log(`[Engine] ${activeCampaigns.length} campanha(s) ativa(s) encontrada(s).`);

    let triggered = 0;
    for (const campaign of activeCampaigns) {
        try {
            const criteria = JSON.parse(campaign.search_criteria);
            // Dispara em background sem aguardar
            runCampaign(campaign.id, criteria);
            triggered++;
        } catch (e) {
            console.error(`[Engine] Erro ao parsear search_criteria da campanha ${campaign.id}:`, e.message);
        }
    }

    return { triggered, campaignIds: activeCampaigns.map(c => c.id) };
}

module.exports = { startCampaign, stopCampaign, runScheduledCampaigns, runningCampaigns };
