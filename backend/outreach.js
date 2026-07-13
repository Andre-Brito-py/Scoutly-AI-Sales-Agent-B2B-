const { Resend } = require('resend');
require('dotenv').config();

/**
 * Dispara um email utilizando a API do Resend
 */
async function sendEmail(to, subject, htmlContent, credentials = {}) {
    const apiKey = credentials.apiKey || process.env.RESEND_API_KEY;
    const fromEmail = credentials.from || 'Scoutly / Vysify <onboarding@resend.dev>';

    if (!apiKey) {
        console.warn('RESEND_API_KEY não configurada. Simulando disparo de e-mail para:', to);
        return { id: 'simulated_email_' + Date.now() };
    }

    try {
        const clientResend = new Resend(apiKey);
        const data = await clientResend.emails.send({
            from: fromEmail,
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
    let normalizedPhone = String(phone).replace(/\D/g, '');
    const countries = credentials?.countries || [];

    if (!String(phone).startsWith('+')) {
        if (normalizedPhone.length === 10 || normalizedPhone.length === 11) {
            if (countries.includes('US')) {
                if (normalizedPhone.length === 10) {
                    normalizedPhone = '1' + normalizedPhone;
                }
            } else {
                // Fallback para Brasil (55)
                if (!normalizedPhone.startsWith('55')) {
                    normalizedPhone = '55' + normalizedPhone;
                }
            }
        }
    }

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
            
            // Tenta detectar se o erro foi por falta de WhatsApp cadastrado no número
            let isNoWhatsapp = false;
            try {
                const parsed = JSON.parse(errText);
                const msg = parsed?.response?.message;
                if (Array.isArray(msg) && msg.some(m => m && m.exists === false)) {
                    isNoWhatsapp = true;
                }
            } catch {}

            if (isNoWhatsapp) {
                throw new Error('NO_WHATSAPP');
            }
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
        throw new Error('Credenciais da Twilio ou número de destino ausentes.');
    }

    // Normaliza o número de destino para formato internacional (E.164)
    let cleanTo = String(to).replace(/\D/g, '');
    if (String(to).startsWith('+')) {
        cleanTo = '+' + cleanTo;
    } else {
        // Se tiver 10 dígitos (tamanho padrão nos EUA), adiciona +1
        if (cleanTo.length === 10) {
            cleanTo = '+1' + cleanTo;
        } else if (cleanTo.length === 11) {
            // Se tiver 11 dígitos e começar with 1 (EUA com DDI), adiciona +
            if (cleanTo.startsWith('1')) {
                cleanTo = '+' + cleanTo;
            } else {
                // Celular do Brasil
                cleanTo = '+55' + cleanTo;
            }
        } else if (cleanTo.length === 12 || cleanTo.length === 13) {
            cleanTo = '+' + cleanTo;
        } else {
            cleanTo = '+' + cleanTo;
        }
    }

    // Normaliza o número do remetente Twilio (garante sinal de +)
    let cleanFrom = fromNumber;
    if (!cleanFrom.startsWith('+')) {
        cleanFrom = '+' + cleanFrom.replace(/\D/g, '');
    }

    try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const encodedData = new URLSearchParams();
        encodedData.append('To', cleanTo);
        encodedData.append('From', cleanFrom);
        encodedData.append('Body', body);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
            },
            body: encodedData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Twilio] API Erro:', errorData);
            throw new Error(errorData.message || `Erro Twilio status ${response.status}`);
        }

        const result = await response.json();
        console.log(`[Twilio] SMS enviado com sucesso para ${cleanTo}. SID: ${result.sid}`);
        return result;
    } catch (e) {
        console.error('[Twilio] Erro ao enviar SMS:', e.message);
        throw e;
    }
}

module.exports = { sendEmail, sendWhatsApp, sendTelegramNotification, sendTwilioSMS };
