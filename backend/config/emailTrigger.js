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
    let onlineUsers = null;
    try {
        const server = require('../server');
        onlineUsers = server.onlineUsers;
        
        // For a Map, we need to check if the key exists and ensure we're comparing numbers
        if (onlineUsers && onlineUsers instanceof Map) {
            const userIdNum = parseInt(recipientUserId);
            if (onlineUsers.has(userIdNum)) {
                console.log(`[email] ✅ User ${recipientUserId} is online - SKIPPING ${type} email`);
                return;
            } else {
                console.log(`[email] 📧 User ${recipientUserId} is offline - SENDING ${type} email`);
            }
        } else {
            console.log(`[email] ⚠️ onlineUsers not available, sending email anyway`);
        }
    } catch (err) {
        console.error(`[email] ⚠️ Failed to check online status:`, err.message);
        // Proceed with email if we can't check online status
    }

    const result = await db.query(
        'SELECT email, username, email_notifications FROM users WHERE id = $1',
        [recipientUserId]
    );

    if (result.rows.length === 0) {
        console.warn(`[email] ❌ User ${recipientUserId} not found — skipping`);
        return;
    }

    const { email, username, email_notifications } = result.rows[0];

    // Merge with defaults so missing keys never block sends
    const prefs = { ...DEFAULT_PREFS, ...(email_notifications || {}) };

    console.log(`[email] Attempting ${type} → ${email} | prefs:`, JSON.stringify(prefs));

    // Check if email notifications are enabled globally
    if (!prefs.enabled) {
        console.log(`[email] ⏭️ User has disabled all emails - skipping`);
        return;
    }

    // Check if this specific notification type is enabled
    if (prefs[type] === false) {
        console.log(`[email] ⏭️ User has disabled ${type} emails - skipping`);
        return;
    }

    const sendResult = await sendNotificationEmail(type, email, username, prefs, templateData);

    console.log(`[email] Result for ${type} → ${email}:`, JSON.stringify(sendResult));
} catch (err) {
    console.error(`[email] triggerNotificationEmail error [${type}]:`, err.message);
}
}

module.exports = { triggerNotificationEmail };