const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'fake-key-for-now'
});

async function generateLeadScore(leadData, companyContext) {
    // Se não tiver chave configurada, retorna mock para não quebrar a aplicação
    if (!process.env.OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY não configurada. Usando fallback.');
        return {
            score: Math.floor(Math.random() * 40) + 60, // 60-100
            reason: 'Empresa do setor ideal, com indícios de maturidade B2B (MOCK).',
            message: `Olá ${leadData.contactName || 'Responsável'}, vi o trabalho incrível que fazem na ${leadData.companyName}. Gostaria de compartilhar como o Vysify pode acelerar suas vendas.`
        };
    }

    try {
        const prompt = `Você é o "Scoutly", o motor de Inteligência Artificial do Vysify CRM.
        Sua missão é avaliar um Lead e escrever uma mensagem super personalizada de prospecção.
        
        **Contexto do nosso Produto (Vysify)**:
        O Vysify é um Enterprise Software & Sales CRM. Aceleramos o ciclo de vendas e estruturamos a jornada comercial através de automações inteligentes e pipeline intuitivo. Nosso alvo são Startups, agências de marketing e PMEs em crescimento.
        
        **Dados do Lead a ser avaliado**:
        - Empresa: ${leadData.companyName}
        - Contato: ${leadData.contactName} (${leadData.contactRole})
        - Site: ${leadData.website || 'Desconhecido'}
        - Setor ou descrição (se houver): ${leadData.description || 'Desconhecido'}
        
        Retorne estritamente um JSON com:
        - "score": Um número de 0 a 100 indicando o quão fit esse lead é para comprar o Vysify CRM.
        - "reason": Uma frase curta (máx 150 caracteres) explicando o score.
        - "message": O primeiro e-mail de prospecção hiper-personalizado a ser enviado, com linguagem profissional e persuasiva (estilo Copywriting B2B BANT/SPIN), direcionado ao contato mencionado.
        
        JSON esperado: { "score": 85, "reason": "...", "message": "..." }`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Modelos mais recentes e rápidos
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result;
    } catch (error) {
        console.error('Erro na integração com OpenAI:', error);
        throw error;
    }
}

module.exports = { generateLeadScore };
