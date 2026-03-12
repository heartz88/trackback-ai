const { sendNotificationEmail } = require('./email');

const DEFAULT_PREFS = {
enabled: true,
collaboration_request: true,
collaboration_response: true,
submission: true,
vote: false,
comment: true,
message: false,
};

async function triggerNotificationEmail(db, recipientUserId, type, templateData) {
try {
// Don't email if the user is currently online — they'll see the in-app notification
try {
    const { onlineUsers } = require('../server');
    if (onlineUsers && onlineUsers.has(recipientUserId)) {
    console.log(`[email] Skipping ${type} → user ${recipientUserId} is online`);
    return;
    }
} catch {} // server may not be loaded yet in tests — safe to ignore

const result = await db.query(
    'SELECT email, username, email_notifications FROM users WHERE id = $1',
    [recipientUserId]
);

if (result.rows.length === 0) {
    console.warn(`[email] User ${recipientUserId} not found — skipping`);
    return;
}

const { email, username, email_notifications } = result.rows[0];

// Merge with defaults so missing keys never block sends
const prefs = { ...DEFAULT_PREFS, ...(email_notifications || {}) };

console.log(`[email] Attempting ${type} → ${email} | prefs:`, JSON.stringify(prefs));

const sendResult = await sendNotificationEmail(type, email, username, prefs, templateData);

console.log(`[email] Result for ${type} → ${email}:`, JSON.stringify(sendResult));
} catch (err) {
console.error(`[email] triggerNotificationEmail error [${type}]:`, err.message);
}
}

module.exports = { triggerNotificationEmail };