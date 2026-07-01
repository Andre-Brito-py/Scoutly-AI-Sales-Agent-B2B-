const OpenAI = require('openai');

class MemoryAgent {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY;
        this.openai = new OpenAI({ apiKey: this.apiKey || 'fake-key-for-now' });
    }

    /**
     * Analisa a mensagem enviada que resultou em sucesso e gera um "Insight" ou regra retida.
     */
    async extractInsight(leadName, segment, successfulMessage) {
        if (!this.apiKey) {
            return `[MOCK] Insight retido: Abordagem curta e direta funciona bem para o segmento ${segment}.`;
        }

        const prompt = `Você é o Memory Agent do Scoutly (um CRM Inteligente).
        Nós acabamos de fechar uma reunião com o lead "${leadName}" (Segmento: ${segment}).
        O e-mail enviado que gerou esse sucesso foi o seguinte:
        "${successfulMessage}"

        Sua tarefa é extrair UMA "Regra de Ouro" (Insight de Copywriting) que explica por que esse e-mail funcionou, para que possamos instruir a IA a repetir esse estilo no futuro.
        Deve ser uma instrução direta e genérica sobre o estilo, gatilho, ou CTA. (Máximo 150 caracteres).
        
        Exemplo: "Fazer uma pergunta sobre o gargalo no final do e-mail converte 2x mais rápido."
        Exemplo: "Usar o nome da empresa do lead logo na primeira frase gera mais identificação."
        
        Responda APENAS com a Regra de Ouro.`;

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }]
            });

            return response.choices[0].message.content.trim();
        } catch (error) {
            console.error('[MemoryAgent] Erro na OpenAI:', error);
            return 'Abordagem concisa retida com sucesso.';
        }
    }
}

module.exports = MemoryAgent;
