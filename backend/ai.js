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

async function generateSocialReply(author, content, platform) {
    if (!process.env.OPENAI_API_KEY) {
        return `Olá ${author}, li sua publicação no ${platform} sobre CRM/suporte. Recomendaria muito dar uma olhada no Vysify. Ele tem uma integração nativa fantástica de WhatsApp e é excelente para organizar funis de vendas sem a complexidade ou custo do Salesforce. Se quiser, posso te mostrar uma demonstração rápida!`;
    }

    try {
        const prompt = `Você é o "Scoutly", o SDR de Inteligência Artificial do Vysify CRM.
        Detectamos um post/comentário relevante no ${platform} onde o usuário descreve uma dor ou pede indicação:
        Autor: ${author}
        Conteúdo da publicação: "${content}"
        
        Sua missão é gerar uma resposta personalizada, amigável, não intrusiva e altamente persuasiva para responder diretamente a essa publicação nas redes sociais.
        Você deve se posicionar como um especialista ou alguém indicando o Vysify CRM (explicando de forma simples que ele resolve a dor mencionada, como por exemplo, com suporte a WhatsApp, facilidade de uso, ótimo custo-benefício, etc.).
        Não use linguagem excessivamente corporativa. Seja pessoal, construtivo e prestativo. Máximo de 3 parágrafos.
        Retorne estritamente o texto da resposta sugerida em português.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Erro ao gerar resposta social com OpenAI:', error);
        return `Olá ${author}, vi seu post sobre CRM. Recomendo muito o Vysify CRM. Ele se integra ao WhatsApp e custa muito menos que o Salesforce.`;
    }
}

async function generateJobOutreach(companyName, jobTitle, conclusion) {
    if (!process.env.OPENAI_API_KEY) {
        return `Olá equipe da ${companyName},\n\nNotei que vocês abriram uma vaga para "${jobTitle}". Isso geralmente indica crescimento e a necessidade de estruturação dos processos de atendimento ou vendas.\n\nNa Vysify, ajudamos empresas a automatizar e centralizar o atendimento de WhatsApp e canais de vendas. Acredito que faria muito sentido vocês conhecerem nossa solução Closer AI para reduzir a sobrecarga da equipe que estão montando. Podemos agendar uma conversa de 10 minutos?`;
    }

    try {
        const prompt = `Você é o "Scoutly", o SDR de Inteligência Artificial do Vysify CRM.
        Escreva um e-mail/mensagem de prospecção fria personalizada para a empresa "${companyName}" que está contratando para a vaga de "${jobTitle}".
        
        Use como gancho de entrada o fato de estarem contratando para essa vaga.
        Contexto/Conclusão: ${conclusion}
        
        O objetivo do Vysify é:
        - Para vagas de suporte/atendimento: Oferecer o Closer AI Autopilot do Vysify para automatizar chats e WhatsApp.
        - Para vagas de vendas/CS/gerência: Oferecer o Vysify CRM para organizar funis e contatos.
        
        Escreva uma mensagem curta, direta ao ponto, persuasiva, profissional e amigável. Máximo de 3 parágrafos.
        Retorne estritamente o texto da mensagem sugerida em português.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Erro ao gerar mensagem de vaga com OpenAI:', error);
        return `Olá equipe da ${companyName}, vi a vaga de ${jobTitle}. A Vysify ajuda a acelerar vendas e estruturar o suporte com nosso CRM e automações. Vamos conversar?`;
    }
}

module.exports = { generateLeadScore, generateSocialReply, generateJobOutreach };
