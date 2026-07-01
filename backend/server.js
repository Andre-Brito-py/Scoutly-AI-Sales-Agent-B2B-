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
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            `UPDATE leads SET score = ?, scoreReason = ?, personalizedMessage = ?, status = 'enriched' WHERE id = ?`,
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
             VALUES (?, ?, ?, ?, ?, ?, 'sent', ?)`,
            [logId, lead_id, campaign_id, channel, recipient, message_content, new Date().toISOString()]
        );

        // Atualiza status do lead
        db.run(`UPDATE leads SET status = 'sent' WHERE id = ?`, [lead_id]);

        res.json({ success: true, dispatchId: dispatchResult.id });
    } catch (error) {
        res.status(500).json({ error: 'Erro no disparo.' });
    }
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

// Rotas de Dashboard / Testes
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', message: 'Backend rodando com sucesso!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
