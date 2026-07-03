const OpenAI = require('openai');

class MemoryAgent {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY;
        this.openai = new OpenAI({ apiKey: this.apiKey || 'fake-key-for-now' });
    }

    /**
     * Analisa a mensagem enviada que resultou em sucesso e gera um "Insight" ou regra retida.
     */
    async extractInsight(leadName, segment, channel, successfulMessage) {
        if (!this.apiKey) {
            return `[MOCK] Insight retido: Abordagem curta via ${channel} funciona bem para o segmento ${segment}.`;
        }

        const prompt = `Você é o Memory Agent do Scoutly (um CRM Inteligente).
        Nós acabamos de FECHAR UMA VENDA com o lead "${leadName}" (Segmento: ${segment}).
        O canal utilizado foi: ${channel}.
        A mensagem de prospecção original enviada que engajou esse lead foi:
        "${successfulMessage}"

        Sua tarefa é extrair UMA "Regra de Ouro" (Insight de Copywriting/Estratégia) que explica por que essa mensagem funcionou, para que possamos instruir a IA a repetir esse estilo no futuro.
        Deve ser uma instrução direta e genérica sobre o estilo, gatilho, dor abordada ou CTA. (Máximo 200 caracteres).
        
        Exemplo: "Para agências, focar na dor de retenção na primeira frase via WhatsApp converte bem."
        Exemplo: "Usar o nome da empresa e ir direto ao ponto sobre custos via SMS aumenta a conversão."
        
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
