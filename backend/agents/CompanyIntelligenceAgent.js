const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai');
require('dotenv').config();

class CompanyIntelligenceAgent {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY;
        this.openai = new OpenAI({ apiKey: this.apiKey || 'fake-key-for-now' });
    }
    
    /**
     * Raspa o site da empresa e extrai o texto principal
     */
    async scrapeWebsite(url) {
        if (!url || url === 'Desconhecido') return 'Site não fornecido.';
        
        try {
            // Adiciona protocolo se faltar
            const targetUrl = url.startsWith('http') ? url : `https://${url}`;
            const response = await axios.get(targetUrl, { timeout: 10000 });
            const html = response.data;
            const $ = cheerio.load(html);

            // Remove scripts, styles, etc.
            $('script, style, noscript, iframe, img, svg').remove();
            let text = $('body').text().replace(/\s+/g, ' ').trim();
            
            // Limita o texto para não estourar tokens
            return text.substring(0, 5000); 
        } catch (error) {
            console.warn(`[CompanyIntelligenceAgent] Não foi possível raspar o site ${url}: ${error.message}`);
            return 'Não foi possível extrair dados do site.';
        }
    }

    /**
     * Usa a IA para ler o HTML raspado e resumir a empresa.
     */
    async analyzeCompany(leadData, websiteMetadata = null) {
        const websiteText = await this.scrapeWebsite(leadData.website);

        if (!this.apiKey) {
            return `[MOCK] Empresa ${leadData.companyName}. Provável diferencial: Qualidade e inovação (dados simulados devido à ausência de chave de API).`;
        }

        let metadataContext = '';
        if (websiteMetadata) {
            metadataContext = `\n-- INFORMAÇÕES TÉCNICAS E DE CONTATO DETECTADAS NO SITE --\n` +
                `WhatsApp no site: ${websiteMetadata.whatsappDetected ? 'Sim' : 'Não'}\n` +
                `Chat Online no site: ${websiteMetadata.chatOnlineDetected ? `Sim (${websiteMetadata.chatProvider})` : 'Não'}\n` +
                `Calendly/Agendador de reuniões: ${websiteMetadata.calendlyDetected ? `Sim (${websiteMetadata.bookingLink})` : 'Não'}\n` +
                `CRM Utilizado: ${websiteMetadata.crmDetected || 'Não identificado'}\n` +
                `E-commerce: ${websiteMetadata.ecommercePlatform || 'Não identificado'}\n` +
                `Frameworks/Construtores: ${websiteMetadata.frameworks.join(', ') || 'Não identificado'}\n` +
                `Idioma do site: ${websiteMetadata.websiteLanguage || 'Português'}\n`;
        }

        const prompt = `Você é o Company Intelligence Agent. Sua função é ler o texto extraído de um site corporativo e as informações técnicas da stack deles, e criar um resumo focado em Vendas B2B.
        
        Empresa: ${leadData.companyName}
        Site extraído: ${websiteText}
        ${metadataContext}

        Extraia e resuma em tópicos curtos:
        - O que a empresa vende (Produto/Serviço)?
        - Qual é o grande diferencial deles?
        - Qual o Público-Alvo (ICP) deles?
        
        Responda apenas com o resumo. Seja direto.`;

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }]
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('[CompanyIntelligenceAgent] Erro na OpenAI:', error);
            return 'Erro ao analisar a inteligência da empresa.';
        }
    }
}

module.exports = CompanyIntelligenceAgent;
