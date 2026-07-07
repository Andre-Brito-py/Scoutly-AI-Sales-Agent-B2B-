const OpenAI = require('openai');
require('dotenv').config();

class ScoringAgent {
    /**
     * @param {string|null} apiKey   - OpenAI API Key
     * @param {string|null} segment  - Segmento alvo da campanha (ex: "clínicas odontológicas")
     *                                 Usado para tornar as regras de score dinâmicas.
     */
    constructor(apiKey, segment = null) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY;
        this.segment = segment || '';
        this.openai = new OpenAI({ apiKey: this.apiKey || 'fake-key-for-now' });
    }

    /**
     * Motor de Regras Objetivas
     * As regras de segmento são dinâmicas: derivadas do segmento da campanha,
     * não hardcoded. Isso garante que qualquer nicho seja pontuado corretamente.
     */
    applyRuleEngine(leadData, companySummary) {
        let score = 0;
        const rulesLog = [];
        const summaryLower = companySummary.toLowerCase();

        // ── Regras universais (independem do segmento) ──────────────────────
        if (leadData.phone && leadData.phone !== '' && leadData.phone !== 'Sem Telefone') {
            score += 15;
            rulesLog.push('+15 (Possui telefone/WhatsApp)');
        }

        if (leadData.website && leadData.website !== 'Desconhecido' && leadData.website !== '') {
            score += 15;
            rulesLog.push('+15 (Possui website)');
        }

        // Indício de tamanho/profissionalismo no summary
        const profKeywords = ['equipe', 'funcionários', 'colaboradores', 'anos de experiência', 'fundada'];
        if (profKeywords.some(kw => summaryLower.includes(kw))) {
            score += 10;
            rulesLog.push('+10 (Empresa estruturada)');
        }

        // ── Regras dinâmicas baseadas no segmento da campanha ───────────────
        if (this.segment) {
            // Normaliza para comparação
            const segWords = this.segment.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remove acentos
                .split(/\s+/)
                .filter(w => w.length > 3); // ignora artigos e preposições curtos

            // Pontuação se o summary menciona palavras do segmento da campanha
            const matches = segWords.filter(word => summaryLower.includes(word));
            if (matches.length > 0) {
                const pts = Math.min(matches.length * 15, 35); // até 35 pts
                score += pts;
                rulesLog.push(`+${pts} (Fit com segmento alvo: "${this.segment}")`);
            }
        } else {
            // Fallback genérico se nenhum segmento foi definido
            score += 20;
            rulesLog.push('+20 (Segmento não especificado — bonus genérico)');
        }

        return { ruleScore: Math.min(score, 70), rulesLog }; // máximo 70 via regras; o resto vem da IA
    }

    /**
     * Combina Rule Engine com IA e gera a Estratégia de Abordagem
     */
    async generateStrategy(leadData, companySummary, painPoints) {
        const { ruleScore, rulesLog } = this.applyRuleEngine(leadData, companySummary);

        // Sem OpenAI: usa mock para desenvolvimento local
        if (!this.apiKey || this.apiKey === 'fake-key-for-now') {
            const finalScore = Math.min(ruleScore + 35, 99);
            return {
                score: finalScore,
                strategy: `[MOCK] Vale a pena? SIM.\nProbabilidade: ${finalScore}%\nAbordagem: Focar em eficiência operacional.\nObjeção provável: Preço.\nMelhor CTA: Agendar demonstração gratuita.`
            };
        }

        const prompt = `Você é o Diretor de Estratégia de Vendas da Scoutly (Scoring Agent).
Avalie este lead para o produto/serviço sendo vendido nesta campanha.

Segmento alvo da campanha: ${this.segment || 'Geral'}
Empresa analisada: ${leadData.companyName}
Score preliminar pelas regras objetivas: ${ruleScore}/70 — ${rulesLog.join(', ')}
Dossiê da empresa: ${companySummary}
Dores identificadas: ${painPoints}

Sua tarefa:
1. Some ao score de regras (${ruleScore}) uma nota de 0 a 30 pela qualidade do contexto.
2. Gere um plano de ataque B2B curto e objetivo.

Retorne SOMENTE este JSON (sem markdown):
{
  "finalScore": <número 0-100>,
  "aiStrategyDocument": "Esta empresa vale a pena? [SIM/NÃO]\\nPor quê? [1 linha]\\nProbabilidade de compra: [X%]\\nAbordagem: [foque na dor principal]\\nObjeção provável: [objeção deles]\\nMelhor CTA: [chamada para ação ideal]"
}`;

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
            });

            const result = JSON.parse(response.choices[0].message.content);
            return {
                score: Math.min(Math.max(result.finalScore, 0), 100),
                strategy: result.aiStrategyDocument
            };
        } catch (error) {
            console.error('[ScoringAgent] Erro na OpenAI:', error.message);
            return { score: ruleScore, strategy: 'Erro ao gerar estratégia — usando score de regras.' };
        }
    }
}

module.exports = ScoringAgent;
