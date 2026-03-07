const { sendNotificationEmail } = require('./email');

async function triggerNotificationEmail(db, recipientUserId, type, templateData) {
try {
const result = await db.query(
    'SELECT email, username, email_notifications FROM users WHERE id = $1',
    [recipientUserId]
);

if (result.rows.length === 0) return;

const { email, username, email_notifications } = result.rows[0];

await sendNotificationEmail(type, email, username, email_notifications || {}, templateData);
} catch (err) {
// Never throw — email is best-effort
console.error('triggerNotificationEmail error:', err.message);
}
}

module.exports = { triggerNotificationEmail };