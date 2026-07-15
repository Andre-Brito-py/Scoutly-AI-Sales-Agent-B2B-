const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Normalizes URL formatting to ensure it has a protocol.
 */
function normalizeUrl(url) {
    if (!url) return '';
    let clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) {
        clean = 'https://' + clean;
    }
    return clean;
}

/**
 * Scrapes and analyzes a target website to detect technology signatures.
 */
async function analyzeWebsite(targetUrl) {
    const result = {
        whatsappDetected: false,
        chatOnlineDetected: false,
        chatProvider: null,
        calendlyDetected: false,
        bookingLink: null,
        crmDetected: null,
        ecommercePlatform: null,
        frameworks: [],
        websiteLanguage: 'Português',
        title: '',
        description: ''
    };

    if (!targetUrl || targetUrl.toLowerCase() === 'desconhecido') {
        return result;
    }

    const url = normalizeUrl(targetUrl);

    try {
        console.log(`[WebsiteAnalyzer] Analisando site: ${url}`);
        const response = await axios.get(url, {
            timeout: 6000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            maxRedirects: 5,
            validateStatus: () => true // Allow handling non-200 responses if they still have HTML content
        });

        const html = response.data;
        if (!html || typeof html !== 'string') {
            return result;
        }

        const $ = cheerio.load(html);

        // 1. Title & Meta Description
        result.title = $('title').text().trim().substring(0, 100);
        result.description = $('meta[name="description"]').attr('content')?.trim().substring(0, 200) || '';

        // 2. Language Detection
        const htmlLang = $('html').attr('lang');
        if (htmlLang) {
            const langCode = htmlLang.toLowerCase().split('-')[0];
            if (langCode === 'en') result.websiteLanguage = 'English';
            else if (langCode === 'es') result.websiteLanguage = 'Español';
            else if (langCode === 'pt') result.websiteLanguage = 'Português';
            else result.websiteLanguage = htmlLang;
        } else {
            // Default to English if it doesn't look like a .br domain
            if (!url.toLowerCase().includes('.com.br') && !url.toLowerCase().includes('.net.br')) {
                result.websiteLanguage = 'English';
            }
        }

        // Convert the HTML to lowercase for simpler regex scans
        const lowerHtml = html.toLowerCase();

        // 3. WhatsApp Link Detection
        const waRegex = /(wa\.me|api\.whatsapp\.com|send\?phone=|web\.whatsapp\.com|whatsapp-button)/i;
        if (waRegex.test(lowerHtml)) {
            result.whatsappDetected = true;
        } else {
            // Scan tag href attributes
            $('a').each((i, el) => {
                const href = $(el).attr('href') || '';
                if (href.includes('wa.me') || href.includes('whatsapp.com')) {
                    result.whatsappDetected = true;
                }
            });
        }

        // 4. Online Chat Widget Detection
        if (lowerHtml.includes('client.crisp.chat') || lowerHtml.includes('$crisp')) {
            result.chatOnlineDetected = true;
            result.chatProvider = 'Crisp';
        } else if (lowerHtml.includes('widget.intercom.io') || lowerHtml.includes('intercomSettings')) {
            result.chatOnlineDetected = true;
            result.chatProvider = 'Intercom';
        } else if (lowerHtml.includes('zopim.com') || lowerHtml.includes('zendesk.com/embeddable')) {
            result.chatOnlineDetected = true;
            result.chatProvider = 'Zendesk Chat';
        } else if (lowerHtml.includes('embed.tawk.to')) {
            result.chatOnlineDetected = true;
            result.chatProvider = 'Tawk.to';
        } else if (lowerHtml.includes('code.jivochat.com') || lowerHtml.includes('jivosite')) {
            result.chatOnlineDetected = true;
            result.chatProvider = 'JivoChat';
        } else if (lowerHtml.includes('js.driftt.com') || lowerHtml.includes('drift.com')) {
            result.chatOnlineDetected = true;
            result.chatProvider = 'Drift';
        } else if (lowerHtml.includes('manychat.com')) {
            result.chatOnlineDetected = true;
            result.chatProvider = 'ManyChat';
        } else if (lowerHtml.includes('smartsupp')) {
            result.chatOnlineDetected = true;
            result.chatProvider = 'Smartsupp';
        }

        // 5. Booking Links
        $('a').each((i, el) => {
            const href = $(el).attr('href') || '';
            if (href.includes('calendly.com/')) {
                result.calendlyDetected = true;
                result.bookingLink = href;
            } else if (href.includes('appointlet.com/')) {
                result.calendlyDetected = true;
                result.bookingLink = href;
            } else if (href.includes('hubspot.com/meetings/')) {
                result.calendlyDetected = true;
                result.bookingLink = href;
            }
        });

        // 6. CRM Detection
        if (lowerHtml.includes('js.hs-scripts.com') || lowerHtml.includes('js.hsadspixel.net') || lowerHtml.includes('hubspot')) {
            result.crmDetected = 'HubSpot';
        } else if (lowerHtml.includes('salesforce.com') || lowerHtml.includes('force.com')) {
            result.crmDetected = 'Salesforce';
        } else if (lowerHtml.includes('activecampaign.com')) {
            result.crmDetected = 'ActiveCampaign';
        } else if (lowerHtml.includes('zoho.com') || lowerHtml.includes('zohocdn.com')) {
            result.crmDetected = 'Zoho';
        } else if (lowerHtml.includes('pipedrive.com')) {
            result.crmDetected = 'Pipedrive';
        }

        // 7. E-commerce
        if (lowerHtml.includes('cdn.shopify.com') || lowerHtml.includes('shopify-payment-button')) {
            result.ecommercePlatform = 'Shopify';
        } else if (lowerHtml.includes('wp-content/plugins/woocommerce') || lowerHtml.includes('woocommerce')) {
            result.ecommercePlatform = 'WooCommerce';
        } else if (lowerHtml.includes('vtex.com') || lowerHtml.includes('vtex-') || lowerHtml.includes('vteximg')) {
            result.ecommercePlatform = 'VTEX';
        } else if (lowerHtml.includes('tray.com.br') || lowerHtml.includes('tray-')) {
            result.ecommercePlatform = 'Tray';
        } else if (lowerHtml.includes('lojaintegrada.com.br')) {
            result.ecommercePlatform = 'Loja Integrada';
        }

        // 8. Frameworks & Builders
        if (lowerHtml.includes('wp-content') || lowerHtml.includes('wp-includes')) {
            result.frameworks.push('WordPress');
        }
        if (lowerHtml.includes('elementor-')) {
            result.frameworks.push('Elementor');
        }
        if (lowerHtml.includes('uploads-ssl.webflow.com') || lowerHtml.includes('data-wf-page')) {
            result.frameworks.push('Webflow');
        }
        if (lowerHtml.includes('wix.com') || lowerHtml.includes('wixsite.com')) {
            result.frameworks.push('Wix');
        }
        if (lowerHtml.includes('_next/static') || lowerHtml.includes('react-dom')) {
            result.frameworks.push('React/Next.js');
        }

        return result;
    } catch (error) {
        console.warn(`[WebsiteAnalyzer] Falha ao raspar website ${url}:`, error.message);
        return result;
    }
}

module.exports = { analyzeWebsite };
