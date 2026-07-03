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
 * Dispara uma mensagem de WhatsApp via API externa (Evolution API, Z-API, etc.)
 */
async function sendWhatsApp(phone, messageContent) {
    if (!process.env.WHATSAPP_API_TOKEN) {
        console.warn('WHATSAPP_API_TOKEN não configurada. Simulando disparo de WhatsApp para:', phone);
        return { id: 'simulated_wpp_' + Date.now() };
    }

    // Exemplo de integração genérica com Evolution API
    /*
    const response = await fetch(`${process.env.WHATSAPP_API_URL}/message/sendText/${process.env.WHATSAPP_INSTANCE}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.WHATSAPP_API_TOKEN
        },
        body: JSON.stringify({
            number: phone,
            text: messageContent
        })
    });
    return response.json();
    */
    
    // Fallback/Stub
    return { id: 'wpp_' + Date.now(), status: 'sent' };
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
