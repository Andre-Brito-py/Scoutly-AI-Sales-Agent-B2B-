const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'fake-key-for-now'
});

class ScoringAgent {
    
    /**
     * Motor de Regras Hardcoded
     */
    applyRuleEngine(leadData, companySummary) {
        let score = 0;
        let rulesLog = [];

        // Exemplo: se tem telefone, ganha pontos
        if (leadData.phone && leadData.phone !== '') {
            score += 15;
            rulesLog.push('+15 (Possui Telefone/WhatsApp)');
        }

        // Se tem site, indica profissionalismo
        if (leadData.website && leadData.website !== 'Desconhecido') {
            score += 20;
            rulesLog.push('+20 (Possui Website)');
        }

        // Se no summary diz que a equipe é grande ou pequena
        const summaryLower = companySummary.toLowerCase();
        if (summaryLower.includes('software') || summaryLower.includes('tecnologia')) {
            score += 25;
            rulesLog.push('+25 (Segmento de Tecnologia/Software - Fit ideal)');
        }

        if (summaryLower.includes('agência') || summaryLower.includes('marketing')) {
            score += 20;
            rulesLog.push('+20 (Agência/Marketing - Fit secundário)');
        }

        return { ruleScore: score, rulesLog };
    }

    /**
     * Combina Rule Engine com IA e gera a 'AI Strategy'
     */
    async generateStrategy(leadData, companySummary, painPoints) {
        // Passo 1: Regras objetivas
        const { ruleScore, rulesLog } = this.applyRuleEngine(leadData, companySummary);

        // Passo 2: IA avalia o resto e gera a estratégia
        if (!process.env.OPENAI_API_KEY) {
            const finalScore = ruleScore + 40 > 99 ? 99 : ruleScore + 40;
            return {
                score: finalScore,
                strategy: `[MOCK] Vale a pena? SIM.\nProbabilidade: ${finalScore}%\nAbordagem: Focar em eficiência.\nObjeção provável: Preço.`
            };
        }

        const prompt = `Você é o Diretor de Estratégia de Vendas (Scoring Agent).
        Avalie os dados levantados pela nossa equipe de IA sobre esse Lead para o produto Vysify CRM.
        
        Empresa: ${leadData.companyName}
        Regras já atingidas (Score Básico: ${ruleScore}): ${rulesLog.join(', ')}
        Dossiê: ${companySummary}
        Dores Identificadas: ${painPoints}
        
        Você precisa dar uma nota (Score) final de 0 a 100 para esse lead (Some ao RuleScore a nota da qualidade do contexto, máximo 100).
        Além disso, crie um plano de ataque B2B respondendo EXATAMENTE neste formato curto:
        
        Esta empresa vale a pena? [SIM/NÃO]
        Por quê? [Motivo em 1 linha]
        Probabilidade de compra: [X%]
        Qual abordagem? [Foque na dor principal identificada]
        Objeção provável: [Qual será a objeção deles?]
        Melhor CTA: [Qual a chamada para ação ideal?]
        
        Retorne os dados em JSON estruturado:
        { "finalScore": 92, "aiStrategyDocument": "O texto da estratégia aqui formatado com quebras de linha" }`;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);
            return {
                score: result.finalScore,
                strategy: result.aiStrategyDocument
            };
        } catch (error) {
            console.error('[ScoringAgent] Erro na OpenAI:', error);
            return { score: ruleScore, strategy: 'Erro ao gerar estratégia.' };
        }
    }
}

module.exports = ScoringAgent;
