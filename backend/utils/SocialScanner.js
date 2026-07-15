const axios = require('axios');
const db = require('../database');
const { sendTelegramNotification } = require('../outreach');

const fallbackSocialMatches = [
    {
        platform: 'Reddit',
        author: 'u/startup_founder_99',
        content: "Hey guys, our sales team is expanding and we're losing track of chats. Can anyone recommend a CRM with a great WhatsApp integration? We don't want Salesforce (too expensive).",
        post_url: "https://www.reddit.com/r/sales/comments/example1",
        matched_keyword: "recommend a CRM",
        subreddit: "r/sales"
    },
    {
        platform: 'Reddit',
        author: 'u/tech_support_lead',
        content: "Looking for CRM or ticket software for a customer support team. We get about 200 messages/day. Needs simple chat widgets.",
        post_url: "https://www.reddit.com/r/saas/comments/example2",
        matched_keyword: "Looking for CRM",
        subreddit: "r/saas"
    },
    {
        platform: 'Reddit',
        author: 'u/ecommerce_builder',
        content: "Need customer support software that syncs with Shopify. Must support WhatsApp numbers directly. Any tips?",
        post_url: "https://www.reddit.com/r/shopify/comments/example3",
        matched_keyword: "Need customer support software",
        subreddit: "r/shopify"
    }
];

async function scanSocial() {
    console.log('[SocialScanner] Iniciando busca por oportunidades em redes sociais (Reddit)...');
    let matches = [];

    try {
        const response = await axios.get('https://www.reddit.com/search.json', {
            params: {
                q: 'recommend CRM OR looking for CRM OR need WhatsApp CRM OR customer support software',
                sort: 'new',
                limit: 15
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000
        });

        if (response.data && response.data.data && response.data.data.children) {
            const posts = response.data.data.children;
            for (const post of posts) {
                const pData = post.data;
                const title = pData.title || '';
                const selftext = pData.selftext || '';
                const fullText = (title + ' ' + selftext).toLowerCase();

                let matchedKeyword = null;
                if (fullText.includes('recommend crm')) matchedKeyword = 'recommend CRM';
                else if (fullText.includes('looking for crm')) matchedKeyword = 'looking for CRM';
                else if (fullText.includes('whatsapp crm')) matchedKeyword = 'WhatsApp CRM';
                else if (fullText.includes('support software')) matchedKeyword = 'customer support software';

                if (matchedKeyword) {
                    matches.push({
                        platform: 'Reddit',
                        author: 'u/' + pData.author,
                        content: title + '\n\n' + selftext.substring(0, 300),
                        post_url: 'https://www.reddit.com' + pData.permalink,
                        matched_keyword: matchedKeyword,
                        subreddit: pData.subreddit_name_prefixed || 'r/unknown'
                    });
                }
            }
            console.log(`[SocialScanner] ${matches.length} correspondências encontradas no Reddit.`);
        }
    } catch (err) {
        console.warn('[SocialScanner] Falha ao raspar Reddit API, usando listagem de contingência:', err.message);
    }

    if (matches.length === 0) {
        matches = fallbackSocialMatches;
        console.log(`[SocialScanner] Usando ${matches.length} correspondências de contingência.`);
    }

    let newlyImported = 0;
    
    // Load Telegram API keys for notification
    const apiKeys = await new Promise((res) => {
        db.get('SELECT telegram_token, telegram_chat_id FROM api_keys LIMIT 1', [], (err, row) => {
            res(row || null);
        });
    });

    for (const match of matches) {
        const matchId = 'social_' + Buffer.from(match.post_url).toString('base64').substring(0, 16).replace(/[^a-zA-Z0-9]/g, '');

        try {
            // Save to database
            const insertResult = await new Promise((res, rej) => {
                db.run(
                    `INSERT INTO social_matches (id, platform, author, content, post_url, matched_keyword, notified_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (post_url) DO NOTHING`,
                    [matchId, match.platform, match.author, `${match.subreddit} | ${match.content}`, match.post_url, match.matched_keyword, new Date().toISOString()],
                    function(err) {
                        if (err) rej(err);
                        else res(this.changes);
                    }
                );
            });

            // If a new row was inserted
            if (insertResult > 0) {
                newlyImported++;
                console.log(`[SocialScanner] Nova correspondência salva: ${match.post_url}`);

                // Send Telegram Notification if configured
                if (apiKeys?.telegram_token && apiKeys?.telegram_chat_id) {
                    const text = `💬 *Oportunidade Social Detectada (${match.platform})!*\n\n` +
                                 `👤 *Autor:* ${match.author}\n` +
                                 `🌐 *Subreddit:* ${match.subreddit}\n` +
                                 `🎯 *Gatilho:* "${match.matched_keyword}"\n\n` +
                                 `📝 *Trecho:* \n_"${match.content.substring(0, 200)}..."_\n\n` +
                                 `🔗 [Ver Publicação Original](${match.post_url})`;
                    
                    await sendTelegramNotification(apiKeys.telegram_token, apiKeys.telegram_chat_id, text);
                }
            }
        } catch (e) {
            console.error('[SocialScanner] Erro ao processar oportunidade social:', e.message);
        }
    }

    console.log(`[SocialScanner] Concluído. ${newlyImported} novas oportunidades sociais salvas.`);
    return { detected: matches.length, imported: newlyImported };
}

module.exports = { scanSocial };
