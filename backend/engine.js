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

// Sincroniza logs de prospecção bem-sucedidos com o omnichannel do Vysify
async function syncOutreachWithVysify(lead, channel, messageContent) {
    db.get('SELECT vysify_webhook_url, vysify_api_key FROM api_keys LIMIT 1', [], async (err, keys) => {
        if (err || !keys || !keys.vysify_webhook_url) return;
        try {
            console.log(`[Vysify Sync] Enviando log de outreach do lead ${lead.companyName} para Vysify...`);
            const headers = { 'Content-Type': 'application/json' };
            if (keys.vysify_api_key) {
                headers['Authorization'] = `Bearer ${keys.vysify_api_key}`;
            }
            await fetch(keys.vysify_webhook_url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    source: 'scoutly',
                    event: 'outreach_sent',
                    channel: channel,
                    messageContent: messageContent,
                    lead: {
                        companyName: lead.companyName,
                        contactName: lead.contactName || lead.companyName,
                        email: lead.email,
                        phone: lead.phone,
                        score: lead.score,
                        scoreReason: lead.scoreReason,
                        personalizedMessage: messageContent
                    }
                })
            });
        } catch (webhookErr) {
            console.error(`[Vysify Sync] Erro ao sincronizar outreach com Vysify:`, webhookErr.message);
        }
    });
}

// ---------------------------------------------------------------------------
// Pipeline completo de um único lead
// ---------------------------------------------------------------------------
async function processLeadAutomated(rawLead, campaignId, searchCriteria) {
    console.log(`\n[Engine] Iniciando pipeline para um lead cru...`);

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

    // Instancia o provedor correspondente (Apollo ou Maps) e formata
    let provider;
    if (searchCriteria?.provider === 'apollo') {
        const ApolloProvider = require('./providers/ApolloProvider');
        provider = new ApolloProvider(apiKeys?.apollo);
    } else {
        provider = new GoogleMapsProvider(apiKeys?.google_maps_api_key);
    }
    const formattedLead = provider.formatLead(rawLead);
    console.log(`[Engine] Lead formatado: ${formattedLead.companyName} (${formattedLead.contactName || 'Sem decisor'})`);

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

    // Enriquecimento com Hunter.io (caso tenhamos a chave hunter configurada)
    if (apiKeys?.hunter && formattedLead.website && formattedLead.website !== 'Desconhecido' && formattedLead.contactName) {
        console.log(`[Hunter.io] Buscando e-mail corporativo para decisor ${formattedLead.contactName}...`);
        try {
            const cleanDomain = formattedLead.website.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0];
            const nameParts = formattedLead.contactName.trim().split(/\s+/);
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

            if (cleanDomain && firstName) {
                const hunterUrl = `https://api.hunter.io/v2/email-finder?domain=${cleanDomain}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&api_key=${apiKeys.hunter}`;
                const hunterRes = await fetch(hunterUrl);
                if (hunterRes.ok) {
                    const hunterData = await hunterRes.json();
                    if (hunterData?.data?.email) {
                        console.log(`[Hunter.io] Enriquecimento de e-mail com sucesso: ${hunterData.data.email} (Confiança: ${hunterData.data.score}%)`);
                        formattedLead.email = hunterData.data.email;
                    }
                }
            }
        } catch (hunterErr) {
            console.error('[Hunter.io] Falha ao enriquecer lead:', hunterErr.message);
        }
    }

    // Salva o lead no banco (ON CONFLICT DO UPDATE para atualizar email)
    db.run(
        `INSERT INTO leads (id, companyName, contactName, contactRole, email, phone, website, status, importedAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'found', $8)
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone`,
        [formattedLead.id, formattedLead.companyName, formattedLead.contactName,
         formattedLead.contactRole, formattedLead.email, formattedLead.phone,
         formattedLead.website, new Date().toISOString()]
    );

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
            try {
                await sendTwilioSMS(
                    apiKeys.twilio_account_sid, apiKeys.twilio_auth_token,
                    apiKeys.twilio_phone_number, currentRecipient, personalizedMessage
                );
            } catch (err) {
                curStatus = 'failed';
                curError = err.message;
            }

        } else if (ch === 'whatsapp' && (apiKeys?.evolution_api_url || apiKeys?.whatsapp_token)) {
            try {
                await sendWhatsApp(currentRecipient, personalizedMessage, {
                    evolutionUrl: apiKeys.evolution_api_url,
                    evolutionKey: apiKeys.evolution_api_key,
                    evolutionInstance: apiKeys.evolution_instance,
                    countries: searchCriteria.countries
                });
            } catch (err) {
                curStatus = 'failed';
                curError = err.message; // Pode ser 'NO_WHATSAPP'
            }

        } else if (ch === 'email' && (apiKeys?.resend || apiKeys?.vysify_webhook_url)) {
            try {
                await sendEmail(
                    currentRecipient,
                    `Oportunidade para a ${formattedLead.companyName}`,
                    personalizedMessage.replace(/\n/g, '<br>'),
                    { 
                        apiKey: apiKeys.resend, 
                        from: apiKeys.resend_from,
                        vysifyWebhookUrl: apiKeys.vysify_webhook_url,
                        vysifyApiKey: apiKeys.vysify_api_key
                    }
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

    const isNoWhatsapp = primaryChannel === 'whatsapp' && result.errorMessage === 'NO_WHATSAPP';
    const hasFailed = result.status === 'failed' || isNoWhatsapp;

    // Se falhar no canal principal e houver um canal secundário de fallback configurado
    if (hasFailed && fallbackChannel && fallbackChannel !== 'none' && fallbackChannel !== primaryChannel) {
        // Registra o log de falha intermediária do canal primário
        const intermediateStatus = isNoWhatsapp ? 'no_whatsapp' : 'failed';
        const intermediateError = isNoWhatsapp ? 'Número de telefone sem WhatsApp ativo.' : (result.errorMessage || 'Falha no canal principal');
        
        db.run(
            `INSERT INTO outreach_logs (id, lead_id, campaign_id, channel, recipient, message_content, status, error_message, sent_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            ['log_pri_' + Date.now(), formattedLead.id, campaignId, primaryChannel, result.recipient,
             personalizedMessage, intermediateStatus, intermediateError, new Date().toISOString()]
        );
        console.log(`[Engine] Falha no canal principal ${primaryChannel} para ${formattedLead.companyName}. Tentando fallback: ${fallbackChannel}...`);

        // Executa disparo secundário
        result = await attemptSend(fallbackChannel);
        
        // Registra o log de disparo do canal secundário (definitivo)
        db.run(
            `INSERT INTO outreach_logs (id, lead_id, campaign_id, channel, recipient, message_content, status, error_message, sent_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            ['log_sec_' + Date.now(), formattedLead.id, campaignId, fallbackChannel, result.recipient,
             personalizedMessage, result.status, result.errorMessage, new Date().toISOString()]
        );
    } else {
        // Registro normal (sem fallback configurado ou sem falha)
        let finalStatus = result.status;
        let finalError = result.errorMessage;
        if (isNoWhatsapp) {
            finalStatus = 'no_whatsapp';
            finalError = 'Ignorado: Número sem WhatsApp ativo (sem canal secundário configurado).';
        }
        
        db.run(
            `INSERT INTO outreach_logs (id, lead_id, campaign_id, channel, recipient, message_content, status, error_message, sent_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            ['log_' + Date.now(), formattedLead.id, campaignId, primaryChannel, result.recipient,
             personalizedMessage, finalStatus, finalError, new Date().toISOString()]
        );
        result.status = finalStatus;
    }

    let nextOutreach = null;
    const now = new Date();
    if (result.status === 'sent' || result.status === 'success') {
        const nextDate = new Date();
        nextDate.setDate(now.getDate() + 2); // 2 dias para o follow-up Passo 2
        nextOutreach = nextDate.toISOString();
        
        db.run(
            `UPDATE leads SET status = $1, cadence_step = 1, last_outreach_at = $2, next_outreach_at = $3 WHERE id = $4`,
            [result.status, now.toISOString(), nextOutreach, formattedLead.id]
        );
    } else {
        db.run(`UPDATE leads SET status = $1 WHERE id = $2`, [result.status, formattedLead.id]);
    }
    
    console.log(`[Engine] Status final de disparo para ${formattedLead.companyName} → ${result.status}`);

    // Se o disparo foi bem sucedido (sent ou success), sincroniza com o omnichannel do Vysify
    if (result.status === 'sent' || result.status === 'success') {
        const successfulChannel = (hasFailed && fallbackChannel && fallbackChannel !== 'none') ? fallbackChannel : primaryChannel;
        syncOutreachWithVysify(formattedLead, successfulChannel, personalizedMessage);
    }
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

        let provider;
        if (searchCriteria?.provider === 'apollo') {
            const ApolloProvider = require('./providers/ApolloProvider');
            provider = new ApolloProvider(apiKeys?.apollo);
        } else {
            provider = new GoogleMapsProvider(apiKeys?.google_maps_api_key);
        }
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
// Processa follow-ups diários automatizados para leads em cadência ativa
// ---------------------------------------------------------------------------
async function processScheduledFollowups() {
    console.log('[Engine] 🕘 Verificando follow-ups de cadência agendados para hoje...');

    try {
        const nowStr = new Date().toISOString();
        // Busca leads elegíveis para follow-up (Passo 2 ou Passo 3)
        // next_outreach_at precisa ser menor ou igual ao momento atual
        const pendingLeads = await new Promise((res, rej) =>
            db.all(
                `SELECT * FROM leads 
                 WHERE status IN ('sent', 'success') 
                   AND next_outreach_at IS NOT NULL 
                   AND next_outreach_at <= $1 
                   AND cadence_step < 3`,
                [nowStr],
                (err, rows) => err ? rej(err) : res(rows)
            )
        ).catch(() => []);

        if (!pendingLeads || pendingLeads.length === 0) {
            console.log('[Engine] Nenhum follow-up de cadência pendente para hoje.');
            return { processed: 0 };
        }

        console.log(`[Engine] Encontrados ${pendingLeads.length} leads prontos para follow-up.`);

        // Carrega credenciais
        const apiKeys = await new Promise((res, rej) =>
            db.get('SELECT * FROM api_keys LIMIT 1', [], (err, row) => err ? rej(err) : res(row))
        ).catch(() => null);

        const tenantProfile = await new Promise((res, rej) =>
            db.get('SELECT * FROM tenant_profiles LIMIT 1', [], (err, row) => err ? rej(err) : res(row))
        ).catch(() => null);

        const openaiKey = apiKeys?.openai || null;
        const copywriter = new CopywriterAgent(openaiKey);

        let processed = 0;

        for (const lead of pendingLeads) {
            const nextStep = (lead.cadence_step || 1) + 1;
            console.log(`[Engine] Rodando Follow-up Passo ${nextStep} para o lead: ${lead.companyName}`);

            // 1. Determina o canal de disparo com base nos logs anteriores desse lead
            const lastLog = await new Promise((res, rej) =>
                db.get(
                    `SELECT channel, campaign_id FROM outreach_logs 
                     WHERE lead_id = $1 AND status = 'sent' 
                     ORDER BY sent_at DESC LIMIT 1`,
                    [lead.id],
                    (err, row) => err ? rej(err) : res(row)
                )
            ).catch(() => null);

            const channel = lastLog?.channel || 'whatsapp';
            const campaignId = lastLog?.campaign_id || null;

            // 2. IA gera mensagem de follow-up contextualizada
            let promptContext = `Escreva uma mensagem curta e objetiva de follow-up (Passo ${nextStep} de contato) para a empresa ${lead.companyName}, decisor ${lead.contactName || 'Responsável'}.
            Mensagem inicial enviada anteriormente: "${lead.personalizedMessage || ''}".
            Crie algo curto e simpático cobrando uma resposta sem ser invasivo ou chato.`;
            
            if (channel === 'whatsapp') {
                promptContext += ` A mensagem será enviada por WhatsApp, então seja breve, amigável, quebre em poucos parágrafos curtos, use emojis com moderação e finalize com uma pergunta convidativa.`;
            } else {
                promptContext += ` A mensagem será enviada por E-mail outbound, use um tom profissional e direto.`;
            }

            const followUpMessage = await copywriter.writeMessage(
                lead, 
                "Acompanhamento da abordagem inicial", 
                `Follow-up passo ${nextStep} cobrando retorno de forma natural.`,
                'Português',
                { name: 'N/A', description: '' },
                '',
                promptContext,
                tenantProfile?.calendar_link,
                tenantProfile?.company_context
            );

            // 3. Efetua o envio
            let sendRecipient = lead.phone;
            if (channel === 'email') sendRecipient = lead.email;

            let curStatus = 'sent';
            let curError = null;

            if (channel === 'sms' && apiKeys?.twilio_account_sid) {
                try {
                    await sendTwilioSMS(apiKeys.twilio_account_sid, apiKeys.twilio_auth_token, apiKeys.twilio_phone_number, sendRecipient, followUpMessage);
                } catch (err) { curStatus = 'failed'; curError = err.message; }
            } else if (channel === 'whatsapp' && (apiKeys?.evolution_api_url || apiKeys?.whatsapp_token)) {
                try {
                    await sendWhatsApp(sendRecipient, followUpMessage, {
                        evolutionUrl: apiKeys.evolution_api_url,
                        evolutionKey: apiKeys.evolution_api_key,
                        evolutionInstance: apiKeys.evolution_instance
                    });
                } catch (err) { curStatus = 'failed'; curError = err.message; }
            } else if (channel === 'email' && (apiKeys?.resend || apiKeys?.vysify_webhook_url)) {
                try {
                    await sendEmail(
                        sendRecipient, 
                        `Acompanhamento: Oportunidade para a ${lead.companyName}`, 
                        followUpMessage.replace(/\n/g, '<br>'),
                        { 
                            apiKey: apiKeys.resend, 
                            from: apiKeys.resend_from,
                            vysifyWebhookUrl: apiKeys.vysify_webhook_url,
                            vysifyApiKey: apiKeys.vysify_api_key
                        }
                    );
                } catch (err) { curStatus = 'failed'; curError = err.message; }
            } else {
                curStatus = 'skipped';
                curError = `Canal "${channel}" não configurado para follow-up.`;
            }

            // 4. Registra log
            db.run(
                `INSERT INTO outreach_logs (id, lead_id, campaign_id, channel, recipient, message_content, status, error_message, sent_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [`log_fup_${nextStep}_` + Date.now(), lead.id, campaignId, channel, sendRecipient,
                 followUpMessage, curStatus, curError, new Date().toISOString()]
            );

            // 5. Agenda o próximo passo (Passo 3) ou finaliza a cadência
            let nextOutreach = null;
            if (curStatus === 'sent') {
                const now = new Date();
                const nextDate = new Date();
                nextDate.setDate(now.getDate() + 5); // 5 dias de espera entre Passo 2 e Passo 3
                nextOutreach = nextDate.toISOString();

                db.run(
                    `UPDATE leads SET cadence_step = $1, last_outreach_at = $2, next_outreach_at = $3, personalizedMessage = $4 WHERE id = $5`,
                    [nextStep, now.toISOString(), nextOutreach, followUpMessage, lead.id]
                );

                // Sincroniza log com o Vysify
                syncOutreachWithVysify(lead, channel, followUpMessage);
            }

            processed++;
            // Pausa de 3 segundos entre disparos de follow-up
            await sleep(3000);
        }

        return { processed };
    } catch (error) {
        console.error('[Engine] Erro crítico no processador de follow-ups:', error.message);
        return { error: error.message };
    }
}

// ---------------------------------------------------------------------------
// Chamado pelo endpoint GET /api/campaigns/trigger-scheduled
// → Acionado pelo cron-jobs.org uma vez por dia
// → Roda todas as campanhas com status='active' e processa os follow-ups
// ---------------------------------------------------------------------------
async function runScheduledCampaigns() {
    console.log('[Engine] 🕘 Trigger diário recebido. Verificando campanhas ativas e follow-ups...');

    // Processa follow-ups de cadência em background
    processScheduledFollowups().catch(e => {
        console.error('[Engine] Erro ao rodar processScheduledFollowups:', e.message);
    });

    const activeCampaigns = await new Promise((res, rej) =>
        db.all(
            `SELECT id, search_criteria FROM campaigns WHERE status = 'active' AND search_criteria IS NOT NULL`,
            [],
            (err, rows) => err ? rej(err) : res(rows)
        )
    ).catch(() => []);

    if (!activeCampaigns || activeCampaigns.length === 0) {
        console.log('[Engine] Nenhuma campanha ativa pendente.');
        return { triggered: 0, message: 'Processamento de follow-ups iniciado em background.' };
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

module.exports = { startCampaign, stopCampaign, runScheduledCampaigns, processScheduledFollowups, runningCampaigns, runCampaign };
