const cron = require('node-cron');
const db = require('./database');
const GoogleMapsProvider = require('./providers/GoogleMapsProvider');
const CompanyIntelligenceAgent = require('./agents/CompanyIntelligenceAgent');
const PainFinderAgent = require('./agents/PainFinderAgent');
const ScoringAgent = require('./agents/ScoringAgent');
const CopywriterAgent = require('./agents/CopywriterAgent');
const { sendTelegramNotification, sendTwilioSMS } = require('./outreach');

// Estado em memória das campanhas rodando
const activeCampaigns = {};

// Pausa humanizada (ex: 5 segundos para testes, mas em prod seria 3-5 minutos)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function processLeadAutomated(rawLead, campaignId, searchCriteria) {
    const provider = new GoogleMapsProvider();
    const formattedLead = provider.formatLead(rawLead);
    
    console.log(`\n[Engine] Iniciando pipeline para: ${formattedLead.companyName}`);

    // Salva no banco inicial
    db.run(
        `INSERT INTO leads (id, companyName, contactName, contactRole, email, phone, website, status, importedAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'found', $8)
         ON CONFLICT (id) DO NOTHING`,
        [formattedLead.id, formattedLead.companyName, formattedLead.contactName, formattedLead.contactRole, formattedLead.email, formattedLead.phone, formattedLead.website, new Date().toISOString()]
    );

    // Carrega o Perfil da Empresa (Tenant) e o Produto Alvo para o Contexto
    let productDetails = { name: 'Múltiplos Produtos (A IA deve escolher o melhor encaixe)', description: '', features: '' };
    let apiKeys = null;
    let memoryInsights = [];
    let tenantProfile = null;
    try {
        let targetProducts = [];
        if (Array.isArray(searchCriteria.targetProducts)) {
            targetProducts = searchCriteria.targetProducts;
        } else if (typeof searchCriteria.targetProducts === 'string') {
            try {
                targetProducts = JSON.parse(searchCriteria.targetProducts || '[]');
                if (!Array.isArray(targetProducts)) targetProducts = [searchCriteria.targetProducts];
            } catch (e) {
                targetProducts = [searchCriteria.targetProducts];
            }
        }

        if (targetProducts.length > 0) {
            const placeholders = targetProducts.map(() => '?').join(',');
            const prodRows = await new Promise((res, rej) => db.all(`SELECT * FROM products WHERE name IN (${placeholders})`, targetProducts, (err, rows) => err ? rej(err) : res(rows)));
            
            if (prodRows && prodRows.length > 0) {
                if (prodRows.length === 1) {
                    productDetails = prodRows[0];
                } else {
                    productDetails.name = 'CATÁLOGO DE PRODUTOS / SERVIÇOS (ESCOLHA O MELHOR PARA O LEAD)';
                    productDetails.description = prodRows.map(p => `[Produto: ${p.name}]\nDescrição: ${p.description}\nPreços: ${p.pricing_plans || 'N/A'}`).join('\n\n');
                    productDetails.features = prodRows.map(p => `[Diferenciais de ${p.name}]: ${p.features}\nPersona Alvo: ${p.target_buyer || 'Geral'}`).join('\n\n');
                }
            }
        }
        apiKeys = await new Promise((res, rej) => db.get('SELECT * FROM api_keys LIMIT 1', [], (err, row) => err ? rej(err) : res(row)));
        tenantProfile = await new Promise((res, rej) => db.get('SELECT * FROM tenant_profiles LIMIT 1', [], (err, row) => err ? rej(err) : res(row)));
        
        // Puxa as regras aprendidas (insights)
        memoryInsights = await new Promise((res, rej) => db.all("SELECT content FROM ai_memory WHERE type = 'insight' LIMIT 3", [], (err, rows) => err ? rej(err) : res(rows)));
    } catch (e) {
        console.warn('[Engine] Erro ao carregar dependências para IA:', e.message);
    }

    const openaiKey = apiKeys ? apiKeys.openai : null;

    // Agentes
    const intelligence = new CompanyIntelligenceAgent(openaiKey);
    const painFinder = new PainFinderAgent(openaiKey);
    const scorer = new ScoringAgent(openaiKey);
    const copywriter = new CopywriterAgent(openaiKey);

    const companySummary = await intelligence.analyzeCompany(formattedLead);
    const painPoints = await painFinder.findPains(companySummary);
    const { score, strategy } = await scorer.generateStrategy(formattedLead, companySummary, painPoints);
    
    const insightsStr = memoryInsights.map(m => `- ${m.content}`).join('\n');
    
    // O idioma que o agente deve escrever, produto e as instruções customizadas (se houver)!
    // Junta customInstructions da campanha (se tiver) com ai_instructions do perfil
    const finalInstructions = [
        searchCriteria.customInstructions,
        tenantProfile?.ai_instructions
    ].filter(Boolean).join(' | ');

    const personalizedMessage = await copywriter.writeMessage(
        formattedLead, 
        painPoints, 
        strategy, 
        searchCriteria.language || 'Português', 
        productDetails, 
        insightsStr,
        finalInstructions,
        tenantProfile?.calendar_link,
        tenantProfile?.company_context
    );
    
    const fullDossier = `ESTRATÉGIA DA IA:\n${strategy}\n\nDORES MAPEADAS:\n${painPoints}\n\nRESUMO DA EMPRESA:\n${companySummary}`;

    // Salva score e mensagem
    db.run(
        `UPDATE leads SET score = $1, scoreReason = $2, personalizedMessage = $3, status = 'enriched' WHERE id = $4`,
        [score, fullDossier, personalizedMessage, formattedLead.id]
    );
    
    // Filtro de Qualidade: Só dispara se o Score for > 70
    if (score >= 70) {
        console.log(`[Engine] Lead ${formattedLead.companyName} Aprovado (Score ${score}). Preparando disparo...`);
        
        // --- 1. Notificação de Alta Prioridade (Telegram para o Usuário) ---
        // Notifica apenas leads com Score >= 70 e se tiver as chaves
        if (apiKeys?.telegram_token && apiKeys?.telegram_chat_id) {
            const text = `🚨 *Novo Lead Qualificado Encontrado!*\n\n🏢 *Empresa:* ${formattedLead.companyName}\n🔥 *Score:* ${score}/100\n\n*Resumo:*\n${companySummary}\n\n*Mensagem gerada e disparada com sucesso!*`;
            const sent = await sendTelegramNotification(apiKeys.telegram_token, apiKeys.telegram_chat_id, text);
            if(sent) console.log(`[Engine] Alerta de Lead enviado ao Telegram do Usuário.`);
        }

        // --- 2. Disparo Externo para o Cliente (Email / WhatsApp / Telegram / SMS) ---
        const channel = searchCriteria.channel || 'email';
        let recipient = formattedLead.email;
        if (channel === 'whatsapp') recipient = formattedLead.phone || 'Sem Telefone';
        if (channel === 'telegram') recipient = formattedLead.social || 'Sem Usuário Telegram';
        if (channel === 'sms') recipient = formattedLead.phone || 'Sem Telefone';

        let status = 'sent';
        let errorMessage = null;

        if (channel === 'sms' && apiKeys?.twilio_account_sid && apiKeys?.twilio_auth_token && apiKeys?.twilio_phone_number) {
            const sent = await sendTwilioSMS(apiKeys.twilio_account_sid, apiKeys.twilio_auth_token, apiKeys.twilio_phone_number, recipient, personalizedMessage);
            if (!sent) {
                status = 'failed';
                errorMessage = 'Twilio SMS falhou';
            }
        }

        db.run(
            `INSERT INTO outreach_logs (id, lead_id, campaign_id, channel, recipient, message_content, status, error_message, sent_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            ['log_' + Date.now(), formattedLead.id, campaignId, channel, recipient, personalizedMessage, status, errorMessage, new Date().toISOString()]
        );
        db.run(`UPDATE leads SET status = $1 WHERE id = $2`, [status, formattedLead.id]);
        console.log(`[Engine] Disparo via ${channel} para ${recipient} (Status: ${status})`);
    } else {
        console.log(`[Engine] Lead ${formattedLead.companyName} Reprovado (Score ${score}). Descartado.`);
        db.run(`UPDATE leads SET status = 'lost' WHERE id = $1`, [formattedLead.id]);
    }
}

async function runCampaign(campaignId, searchCriteria) {
    if (!activeCampaigns[campaignId]) return;
    
    console.log(`[Engine] Campanha ${campaignId} ACORDOU. Buscando leads...`);
    const provider = new GoogleMapsProvider();
    
    // Acha os leads
    const rawLeads = await provider.searchLeads(searchCriteria);
    console.log(`[Engine] Encontrados ${rawLeads.length} leads. Iniciando processamento...`);

    for (const lead of rawLeads) {
        if (!activeCampaigns[campaignId]) {
            console.log(`[Engine] Campanha ${campaignId} interrompida pelo usuário.`);
            break;
        }

        await processLeadAutomated(lead, campaignId, searchCriteria);
        
        console.log('[Engine] Pausa de 3 segundos para evitar bloqueios de API...');
        await sleep(3000); 
    }
    
    console.log(`[Engine] Ciclo da campanha ${campaignId} finalizado.`);
}

/**
 * Inicia uma campanha. Pode ser Imediata ou Agendada (Cron).
 */
function startCampaign(campaignId, frequency, searchCriteria) {
    if (activeCampaigns[campaignId]) {
        return { error: 'Campanha já está rodando.' };
    }

    activeCampaigns[campaignId] = true;

    if (frequency === 'immediate') {
        // Roda agora mesmo em background
        runCampaign(campaignId, searchCriteria);
    } else if (frequency === 'daily') {
        // Roda todo dia às 09:00
        const job = cron.schedule('0 9 * * *', () => {
            runCampaign(campaignId, searchCriteria);
        });
        activeCampaigns[campaignId] = job; 
    }

    return { success: true, message: 'Campanha iniciada com sucesso.' };
}

function stopCampaign(campaignId) {
    if (activeCampaigns[campaignId]) {
        if (activeCampaigns[campaignId].stop) {
            // É um cron job
            activeCampaigns[campaignId].stop();
        }
        delete activeCampaigns[campaignId];
        return { success: true };
    }
    return { error: 'Campanha não encontrada.' };
}

module.exports = { startCampaign, stopCampaign, activeCampaigns };
