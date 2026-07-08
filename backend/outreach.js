const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY || 'fake-key-for-now');

/**
 * Dispara um email utilizando a API do Resend
 */
async function sendEmail(to, subject, htmlContent) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY não configurada. Simulando disparo de e-mail para:', to);
        return { id: 'simulated_email_' + Date.now() };
    }

    try {
        const data = await resend.emails.send({
            from: 'Scoutly / Vysify <onboarding@resend.dev>', // Email validado no Resend
            to: [to],
            subject: subject,
            html: htmlContent
        });
        return data;
    } catch (error) {
        console.error('Erro ao enviar e-mail via Resend:', error);
        throw error;
    }
}

/**
 * Envia mensagem de WhatsApp via Evolution API.
 * Compartilha a mesma instância e número configurados no Vysify.
 *
 * As credenciais são lidas do banco (configuradas no painel do Scoutly),
 * com fallback para variáveis de ambiente para compatibilidade.
 */
async function sendWhatsApp(phone, messageContent, credentials = {}) {
    const evolutionUrl = credentials.evolutionUrl || process.env.EVOLUTION_API_URL;
    const evolutionKey = credentials.evolutionKey || process.env.EVOLUTION_API_KEY;
    const evolutionInstance = credentials.evolutionInstance || process.env.EVOLUTION_INSTANCE;

    if (!evolutionUrl || !evolutionKey || !evolutionInstance) {
        console.warn('[WhatsApp] Credenciais da Evolution API não configuradas. Simulando envio para:', phone);
        return { id: 'simulated_wpp_' + Date.now(), status: 'simulated' };
    }

    // Normaliza o número para o formato internacional sem símbolos (ex: 5511999999999)
    const normalizedPhone = String(phone).replace(/\D/g, '');

    try {
        const endpoint = `${evolutionUrl}/message/sendText/${evolutionInstance}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionKey
            },
            body: JSON.stringify({
                number: normalizedPhone,
                options: { delay: 1200, presence: 'composing' },
                text: messageContent,
                textMessage: { text: messageContent }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('[WhatsApp] Evolution API erro:', errText);
            throw new Error(`Evolution API devolveu status ${response.status}`);
        }

        const result = await response.json();
        console.log(`[WhatsApp] Mensagem enviada para ${normalizedPhone}. Key:`, result?.key?.id || 'ok');
        return result;
    } catch (error) {
        console.error('[WhatsApp] Erro na requisição:', error.message);
        throw error;
    }
}

async function sendTelegramNotification(token, chatId, messageContent) {
    if (!token || !chatId) {
        console.warn('Credenciais do Telegram ausentes. Pulando notificação.');
        return false;
    }

    try {
        // Usa fetch nativo do Node.js (v18+)
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: messageContent,
                parse_mode: 'Markdown'
            })
        });
        
        if (!response.ok) {
            console.error('Falha ao enviar notificação no Telegram:', await response.text());
            return false;
        }
        return true;
    } catch (error) {
        console.error('Erro na requisição para o Telegram:', error);
        return false;
    }
}

async function sendTwilioSMS(accountSid, authToken, fromNumber, to, body) {
    if (!accountSid || !authToken || !fromNumber || !to) {
        console.warn('Credenciais da Twilio ausentes. Pulando envio de SMS.');
        return false;
    }

    try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const encodedData = new URLSearchParams();
        encodedData.append('To', to);
        encodedData.append('From', fromNumber);
        encodedData.append('Body', body);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
            },
            body: encodedData
        });

        if (response.ok) return true;
        const errorData = await response.json();
        console.error('[Twilio] API Erro:', errorData);
        return false;
    } catch (e) {
        console.error('[Twilio] Erro ao enviar SMS:', e.message);
        return false;
    }
}

module.exports = { sendEmail, sendWhatsApp, sendTelegramNotification, sendTwilioSMS };
