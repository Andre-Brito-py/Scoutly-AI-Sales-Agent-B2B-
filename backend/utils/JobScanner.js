const axios = require('axios');
const db = require('../database');
const { sendPushNotificationToAll } = require('./PushNotifications');
const { generateJobOutreach } = require('../ai');

async function scanJobs() {
    console.log('[JobScanner] Iniciando varredura de vagas públicas (Adzuna + The Muse)...');
    let jobs = [];

    // 1. Tentar Adzuna API
    try {
        const response = await axios.get('https://api.adzuna.com/v1/api/jobs/br/search/1', {
            params: {
                app_id: 'c824c965',
                app_key: '428987b72db77ab6d6c29b689033327d',
                results_per_page: 15,
                what: 'suporte vendas customer success'
            },
            timeout: 5000
        });

        if (response.data && response.data.results && response.data.results.length > 0) {
            jobs = response.data.results.map(item => ({
                title: item.title,
                company: item.company.display_name,
                url: item.redirect_url,
                location: item.location.display_name,
                description: item.description
            }));
            console.log(`[JobScanner] ${jobs.length} vagas recuperadas via API Adzuna.`);
        }
    } catch (err) {
        console.warn('[JobScanner] Falha ao consultar Adzuna API, tentando The Muse API:', err.message);
    }

    // 2. Se falhar, tentar The Muse API (Sem autenticação, sempre ativa e livre)
    if (jobs.length === 0) {
        try {
            const response = await axios.get('https://www.themuse.com/api/public/jobs', {
                params: {
                    category: ['Customer Service', 'Sales'],
                    page: 1
                },
                timeout: 5000
            });

            if (response.data && response.data.results) {
                jobs = response.data.results.map(item => ({
                    title: item.name,
                    company: item.company.name,
                    url: item.refs.landing_page,
                    location: item.locations.map(l => l.name).join(', '),
                    description: item.contents ? item.contents.replace(/<[^>]*>/g, '') : ''
                }));
                console.log(`[JobScanner] ${jobs.length} vagas recuperadas via API The Muse.`);
            }
        } catch (err) {
            console.error('[JobScanner] Falha ao consultar The Muse API:', err.message);
        }
    }

    let insertedLeads = 0;

    for (const job of jobs) {
        const titleLower = job.title.toLowerCase();
        let intent = '';
        let conclusion = '';
        let targetProduct = 'Vysify CRM';

        if (titleLower.includes('suporte') || titleLower.includes('support') || titleLower.includes('atendimento')) {
            intent = 'Customer Support';
            conclusion = 'Empresa crescendo chamados de suporte. Oferecer Closer AI do Vysify para automatizar chats e WhatsApp.';
            targetProduct = 'Closer AI Autopilot';
        } else if (titleLower.includes('sales') || titleLower.includes('vendas') || titleLower.includes('gerente') || titleLower.includes('manager') || titleLower.includes('sdr')) {
            intent = 'Sales Manager';
            conclusion = 'Empresa expandindo a força de vendas. Oferecer Vysify CRM para organizar funis e contatos.';
            targetProduct = 'Vysify CRM';
        } else if (titleLower.includes('success') || titleLower.includes('cs') || titleLower.includes('relacionamento')) {
            intent = 'Customer Success';
            conclusion = 'Foco em pós-venda e retenção. Oferecer Vysify CRM para gestão integrada de relacionamento.';
            targetProduct = 'Vysify CRM';
        } else {
            intent = 'Business Growth';
            conclusion = 'Empresa contratando novos profissionais. Oferecer ecossistema Vysify para estruturação.';
        }

        // Clean company name to create an ID
        const cleanCompany = job.company.replace(/[^a-zA-Z0-9]/g, '');
        const leadId = `intent_${cleanCompany.toLowerCase()}_${intent.toLowerCase().replace(/\s+/g, '_')}`;

        const website = `${job.company.toLowerCase().replace(/\s+/g, '')}.com.br`;

        const metadata = {
            intentTrigger: {
                jobTitle: job.title,
                jobUrl: job.url,
                location: job.location,
                description: job.description.substring(0, 150) + '...',
                conclusion: conclusion,
                targetProduct: targetProduct
            },
            whatsappDetected: false,
            chatOnlineDetected: false,
            chatProvider: null,
            crmDetected: null,
            ecommercePlatform: null,
            frameworks: [],
            websiteLanguage: 'Português'
        };

        const scoreReason = `GATILHO DE INTENÇÃO: Contratando para ${job.title}. ${conclusion}`;

        try {
            const pm = await generateJobOutreach(job.company, job.title, conclusion);
            await new Promise((res, rej) => {
                db.run(
                    `INSERT INTO leads (id, companyName, website, score, scoreReason, status, personalizedMessage, importedAt, website_metadata)
                     VALUES ($1, $2, $3, $4, $5, 'intent_detected', $6, $7, $8)
                     ON CONFLICT (id) DO NOTHING`,
                    [leadId, job.company, website, 90, scoreReason, pm, new Date().toISOString(), JSON.stringify(metadata)],
                    (err) => err ? rej(err) : res()
                );
            });
            insertedLeads++;
        } catch (e) {
            console.error('[JobScanner] Erro ao salvar vaga como lead:', e.message);
        }
    }

    console.log(`[JobScanner] Concluído. ${insertedLeads} novas oportunidades registradas.`);
    
    if (insertedLeads > 0) {
        await sendPushNotificationToAll(
            '💼 Nova Vaga Detectada!',
            `Identificamos oportunidades de contratação em ${insertedLeads} nova(s) empresa(s).`
        ).catch(e => console.error('Erro ao enviar push:', e.message));
    }

    return { detected: jobs.length, imported: insertedLeads };
}

module.exports = { scanJobs };
