const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'fake-key-for-now'
});

class CompanyIntelligenceAgent {
    
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
    async analyzeCompany(leadData) {
        const websiteText = await this.scrapeWebsite(leadData.website);

        if (!process.env.OPENAI_API_KEY) {
            return `[MOCK] Empresa ${leadData.companyName}. Provável diferencial: Qualidade e inovação (dados simulados devido à ausência de chave de API).`;
        }

        const prompt = `Você é o Company Intelligence Agent. Sua função é ler o texto extraído de um site corporativo e criar um resumo focado em Vendas B2B.
        
        Empresa: ${leadData.companyName}
        Site extraído: ${websiteText}

        Extraia e resuma em tópicos curtos:
        - O que a empresa vende (Produto/Serviço)?
        - Qual é o grande diferencial deles?
        - Qual o Público-Alvo (ICP) deles?
        
        Responda apenas com o resumo. Seja direto.`;

        try {
            const response = await openai.chat.completions.create({
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
