const webpush = require('web-push');
const db = require('../database');

const publicKey = 'BDAFyVPMsOiCnjjcSmjOqwGkmwA9qeJJn-VF-x1ZuYVIjD5lDhGykTyVCjz1KmbDCloStuOzRpwBTtxupJ8_-Ao';
const privateKey = 'Y7fs3kTwq4VcVC_zNe5ujYawIk3paDQzRmS-bP5WMLE';

webpush.setVapidDetails(
    'mailto:contato@vysify.com.br',
    publicKey,
    privateKey
);

/**
 * Sends a push notification payload to all active subscribed service worker clients.
 */
async function sendPushNotificationToAll(title, body, url = '/opportunities') {
    console.log(`[PushNotification] Enviando notificação para todos os inscritos: "${title}"`);
    
    const payload = JSON.stringify({
        notification: {
            title,
            body,
            icon: '/assets/logo.png', // or standard logo path
            data: { url }
        }
    });

    const subscriptions = await new Promise((res) => {
        db.all('SELECT * FROM push_subscriptions', [], (err, rows) => {
            res(rows || []);
        });
    });

    for (const sub of subscriptions) {
        const pushSub = {
            endpoint: sub.endpoint,
            keys: {
                auth: sub.keys_auth,
                p256dh: sub.keys_p256dh
            }
        };

        try {
            await webpush.sendNotification(pushSub, payload);
        } catch (error) {
            // Delete subscription if expired/invalid (410 Gone / 404 Not Found)
            if (error.statusCode === 410 || error.statusCode === 404) {
                console.log(`[PushNotification] Inscrição expirada removida: ${sub.id}`);
                db.run('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
            } else {
                console.warn(`[PushNotification] Falha ao enviar notificação para ${sub.id}:`, error.message);
            }
        }
    }
}

module.exports = { sendPushNotificationToAll, publicKey };
