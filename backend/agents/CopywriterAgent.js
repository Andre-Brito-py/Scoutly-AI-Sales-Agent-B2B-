const OpenAI = require('openai');
require('dotenv').config();

class CopywriterAgent {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY;
        this.openai = new OpenAI({ apiKey: this.apiKey || 'fake-key-for-now' });
    }
    
    async writeMessage(leadData, painPoints, strategy, language, productDetails, insightsStr) {
        if (!this.apiKey) {
            const prodName = productDetails ? productDetails.name : 'Vysify';
            return `[MOCK] Hello ${leadData.contactName || 'Responsável'}, lendo o site da ${leadData.companyName} notei que vocês podem estar lidando com falta de processos. Vamos marcar 10 minutos para falar sobre como o ${prodName} resolve isso?`;
        }

        const prompt = `Você é um Copywriter B2B de Elite (Mago do Outbound).
        Seu objetivo é escrever o primeiro e-mail de prospecção para este lead.
        
        -- DADOS DO LEAD --
        Empresa: ${leadData.companyName}
        Contato: ${leadData.contactName} (${leadData.contactRole})
        
        -- DORES MAPADAS PELA EQUIPE --
        ${painPoints}
        
        -- ESTRATÉGIA APROVADA --
        ${strategy}

        -- PRODUTO A SER VENDIDO --
        Produto: ${productDetails ? productDetails.name : 'Não especificado'}
        Descrição: ${productDetails ? productDetails.description : ''}
        Diferenciais: ${productDetails ? productDetails.features : ''}

        -- REGRAS DE OURO (APRENDIDAS COM O PASSADO) --
        ${insightsStr ? insightsStr : 'Nenhuma regra acumulada ainda.'}

        Regras do Email:
        1. Direto e curto (máximo 100 palavras).
        2. Personalizado na primeira frase usando os dados do Lead.
        3. Cutuque a dor mapeada.
        4. Siga estritamente o "Melhor CTA" definido na estratégia e nas "Regras de Ouro".
        5. IMPORTANTE: ESCREVA O E-MAIL INTEIRAMENTE EM: ${language || 'Português'}.
        
        Responda apenas com o corpo do e-mail. Não adicione saudações como "Aqui está o email" antes.`;

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }]
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('[CopywriterAgent] Erro na OpenAI:', error);
            return 'Erro ao gerar copy do e-mail.';
        }
    }
}

module.exports = CopywriterAgent;
