const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'fake-key-for-now'
});

class PainFinderAgent {
    
    /**
     * Recebe o resumo gerado pelo Company Intelligence Agent e extrai possíveis dores.
     */
    async findPains(companySummary) {
        if (!process.env.OPENAI_API_KEY) {
            return `[MOCK] Dores identificadas: \n- Baixa eficiência no outbound.\n- Processos manuais.`;
        }

        const prompt = `Você é o Pain Finder Agent, um especialista em vendas B2B (Metodologia SPIN Selling).
        Você acabou de receber o dossiê de uma empresa feito pelo Analista:
        
        --- DOSSIÊ DA EMPRESA ---
        ${companySummary}
        -------------------------

        Sua missão é deduzir quais são as 3 maiores "DORES" operacionais ou financeiras que essa empresa pode ter hoje, baseando-se no perfil dela.
        
        Gere uma lista curta e direta com 3 possíveis problemas que essa empresa enfrenta e que um software B2B de automação/CRM (como o Vysify) poderia resolver.`;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }]
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('[PainFinderAgent] Erro na OpenAI:', error);
            return 'Erro ao identificar dores.';
        }
    }
}

module.exports = PainFinderAgent;
