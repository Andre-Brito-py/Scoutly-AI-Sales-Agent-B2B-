const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'fake-key-for-now'
});

class CopywriterAgent {
    
    /**
     * Gera a copy final usando Dores e Estratégia
     */
    async writeMessage(leadData, painPoints, strategy) {
        if (!process.env.OPENAI_API_KEY) {
            return `[MOCK] Olá ${leadData.contactName || 'Responsável'}, lendo o site da ${leadData.companyName} notei que vocês podem estar lidando com falta de CRM. Vamos marcar 10 minutos para falar sobre como o Vysify resolve isso?`;
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

        Regras do Email:
        1. Direto e curto (máximo 100 palavras).
        2. Personalizado na primeira frase usando os dados do Lead.
        3. Cutuque a dor mapeada.
        4. Siga estritamente o "Melhor CTA" definido na estratégia.
        
        Responda apenas com o corpo do e-mail.`;

        try {
            const response = await openai.chat.completions.create({
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
