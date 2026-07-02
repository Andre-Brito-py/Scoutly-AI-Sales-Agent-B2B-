const OpenAI = require('openai');
require('dotenv').config();

class CopywriterAgent {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY;
        this.openai = new OpenAI({ apiKey: this.apiKey || 'fake-key-for-now' });
    }
    
    async writeMessage(leadData, painPoints, strategy, language, productDetails, insightsStr, customInstructions, calendarLink, companyContext) {
        if (!this.apiKey) {
            const prodName = productDetails ? productDetails.name : 'Vysify';
            return `[MOCK] Hello ${leadData.contactName || 'Responsável'}, lendo o site da ${leadData.companyName} notei que vocês podem estar lidando com falta de processos. Vamos marcar 10 minutos para falar sobre como o ${prodName} resolve isso? ${calendarLink ? 'Meu link: ' + calendarLink : ''}`;
        }

        let customInstructionsBlock = '';
        if (customInstructions && customInstructions.trim() !== '') {
            customInstructionsBlock = `\n        -- INSTRUÇÕES ESPECIAIS (ALTA PRIORIDADE) --\n        O usuário definiu a seguinte ordem ou lembrete para esta abordagem: "${customInstructions}".\n        Você DEVE mencionar isso na sua cópia de forma natural e persuasiva.\n`;
        }
        
        let calendarBlock = '';
        if (calendarLink && calendarLink.trim() !== '') {
            calendarBlock = `\n        6. IMPORTANTE: Use este link de calendário como Call to Action (CTA) no final do email: ${calendarLink}\n`;
        }

        const prompt = `Você é um Copywriter B2B de Elite (Mago do Outbound).
        Seu objetivo é escrever a primeira mensagem de prospecção para este lead.
        
        -- DADOS DO LEAD --
        Empresa: ${leadData.companyName}
        Contato: ${leadData.contactName} (${leadData.contactRole})
        
        -- DORES MAPADAS PELA EQUIPE --
        ${painPoints}
        
        -- ESTRATÉGIA APROVADA --
        ${strategy}

        -- CONTEXTO DA NOSSA EMPRESA --
        O que fazemos e quem somos: ${companyContext ? companyContext : 'Não especificado pelo usuário, use seu melhor julgamento com base no produto.'}
        
        -- PRODUTO A SER VENDIDO --
        Produto: ${productDetails ? productDetails.name : 'Não especificado'}
        Descrição: ${productDetails ? productDetails.description : ''}
        Diferenciais: ${productDetails ? productDetails.features : ''}

        -- REGRAS DE OURO (APRENDIDAS COM O PASSADO) --
        ${insightsStr ? insightsStr : 'Nenhuma regra acumulada ainda.'}
        ${customInstructionsBlock}
        Regras da Mensagem:
        1. Direto e curto (máximo 100 palavras).
        2. Personalizado na primeira frase usando os dados do Lead.
        3. Cutuque a dor mapeada.
        4. Siga estritamente o "Melhor CTA" definido na estratégia e nas "Regras de Ouro".
        5. ESCREVA A MENSAGEM INTEIRAMENTE EM: ${language || 'Português'}.
        ${calendarBlock}
        
        Responda apenas com o corpo da mensagem. Não adicione saudações como "Aqui está a mensagem" antes.`;

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
