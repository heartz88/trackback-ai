const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'TrackBackAI <notifications@trackbackai.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3005';

/* ─────────────────────────────────────────────
HTML email base template
───────────────────────────────────────────── */
function baseTemplate({ title, preheader, bodyHtml }) {
return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#040d14;font-family:'Segoe UI',Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#040d14;padding:40px 20px;">
<tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

    <!-- Header -->
    <tr><td style="background:linear-gradient(135deg,#0f2027,#1a3a3a);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;border-bottom:1px solid rgba(20,184,166,0.2);">
        <div style="display:inline-flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,#14b8a6,#06b6d4);border-radius:10px;display:inline-block;"></div>
        <span style="font-size:22px;font-weight:800;color:#f0fdfa;letter-spacing:-0.03em;">Track<span style="color:#14b8a6;">Back</span>AI</span>
        </div>
    </td></tr>

    <!-- Body -->
    <tr><td style="background:#0a1628;padding:40px;border-left:1px solid rgba(20,184,166,0.1);border-right:1px solid rgba(20,184,166,0.1);">
        ${bodyHtml}
    </td></tr>

    <!-- Footer -->
    <tr><td style="background:#040d14;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid rgba(20,184,166,0.08);border-top:none;">
        <p style="color:#475569;font-size:12px;margin:0 0 8px;">
        You're receiving this because you have email notifications enabled on TrackBackAI.
        </p>
        <a href="${FRONTEND_URL}/profile/edit" style="color:#14b8a6;font-size:12px;text-decoration:none;">
        Manage notification preferences
        </a>
        <span style="color:#334155;margin:0 8px;">·</span>
        <a href="${FRONTEND_URL}" style="color:#475569;font-size:12px;text-decoration:none;">TrackBackAI</a>
    </td></tr>

    </table>
</td></tr>
</table>
</body>
</html>`;
}

/* ─────────────────────────────────────────────
CTA button helper
───────────────────────────────────────────── */
function ctaButton(text, href) {
return `<div style="text-align:center;margin:28px 0;">
<a href="${href}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#14b8a6,#06b6d4);color:#0f172a;font-weight:800;font-size:15px;border-radius:100px;text-decoration:none;letter-spacing:0.02em;">${text}</a>
</div>`;
}

/* ─────────────────────────────────────────────
Notification-specific templates
───────────────────────────────────────────── */
const templates = {

collaboration_request: ({ username, senderName, trackTitle }) => ({
subject: `🤝 ${senderName} wants to collaborate with you`,
preheader: `${senderName} sent you a collaboration request on "${trackTitle}"`,
bodyHtml: `
    <h2 style="color:#f0fdfa;font-size:22px;font-weight:800;margin:0 0 8px;">New Collaboration Request</h2>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">Hey <strong style="color:#e2e8f0;">${username}</strong>,</p>
    <div style="background:rgba(20,184,166,0.06);border:1px solid rgba(20,184,166,0.18);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
    <p style="color:#e2e8f0;font-size:15px;margin:0 0 6px;"><strong>${senderName}</strong> wants to collaborate on:</p>
    <p style="color:#14b8a6;font-size:18px;font-weight:700;margin:0;">"${trackTitle}"</p>
    </div>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 4px;">Head to your collaborations page to accept or decline.</p>
    ${ctaButton('View Request →', `${FRONTEND_URL}/collaborations`)}
`,
}),

collaboration_response: ({ username, responderName, trackTitle, status }) => ({
subject: status === 'approved'
    ? `✅ ${responderName} accepted your collaboration request`
    : `❌ ${responderName} declined your collaboration request`,
preheader: `Your request on "${trackTitle}" was ${status}`,
bodyHtml: `
    <h2 style="color:#f0fdfa;font-size:22px;font-weight:800;margin:0 0 8px;">
    Collaboration ${status === 'approved' ? 'Accepted 🎉' : 'Declined'}
    </h2>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">Hey <strong style="color:#e2e8f0;">${username}</strong>,</p>
    <div style="background:${status === 'approved' ? 'rgba(20,184,166,0.06)' : 'rgba(239,68,68,0.05)'};border:1px solid ${status === 'approved' ? 'rgba(20,184,166,0.18)' : 'rgba(239,68,68,0.15)'};border-radius:12px;padding:20px 24px;margin-bottom:24px;">
    <p style="color:#e2e8f0;font-size:15px;margin:0;">
        <strong>${responderName}</strong> has <strong style="color:${status === 'approved' ? '#14b8a6' : '#ef4444'};">${status === 'approved' ? 'accepted' : 'declined'}</strong> your collaboration request on <strong>"${trackTitle}"</strong>.
    </p>
    </div>
    ${status === 'approved'
    ? `<p style="color:#94a3b8;font-size:14px;margin:0 0 4px;">You can now start working together. Message them to get started!</p>
        ${ctaButton('Go to Collaborations →', `${FRONTEND_URL}/collaborations`)}`
    : `<p style="color:#94a3b8;font-size:14px;">Don't be discouraged — keep exploring tracks on TrackBackAI.</p>
        ${ctaButton('Discover Tracks →', `${FRONTEND_URL}/discover`)}`
    }
`,
}),

submission: ({ username, collaboratorName, trackTitle, trackId }) => ({
subject: `🎵 ${collaboratorName} submitted a new version of your track`,
preheader: `A new submission is ready to review on "${trackTitle}"`,
bodyHtml: `
    <h2 style="color:#f0fdfa;font-size:22px;font-weight:800;margin:0 0 8px;">New Submission on Your Track</h2>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">Hey <strong style="color:#e2e8f0;">${username}</strong>,</p>
    <div style="background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.18);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
    <p style="color:#e2e8f0;font-size:15px;margin:0 0 6px;"><strong>${collaboratorName}</strong> submitted a new version of:</p>
    <p style="color:#a78bfa;font-size:18px;font-weight:700;margin:0;">"${trackTitle}"</p>
    </div>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 4px;">Listen to it and cast your vote!</p>
    ${ctaButton('Review Submission →', `${FRONTEND_URL}/tracks/${trackId}/submissions`)}
`,
}),

vote: ({ username, voterName, trackTitle, trackId }) => ({
subject: `❤️ ${voterName} voted on your submission`,
preheader: `Your submission on "${trackTitle}" got a new vote`,
bodyHtml: `
    <h2 style="color:#f0fdfa;font-size:22px;font-weight:800;margin:0 0 8px;">Someone Liked Your Work ❤️</h2>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">Hey <strong style="color:#e2e8f0;">${username}</strong>,</p>
    <div style="background:rgba(244,63,94,0.06);border:1px solid rgba(244,63,94,0.15);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
    <p style="color:#e2e8f0;font-size:15px;margin:0;">
        <strong>${voterName}</strong> voted on your submission for <strong style="color:#fb7185;">"${trackTitle}"</strong>.
    </p>
    </div>
    ${ctaButton('See the Votes →', `${FRONTEND_URL}/tracks/${trackId}/submissions`)}
`,
}),

comment: ({ username, commenterName, trackTitle, trackId, commentText }) => ({
subject: `💬 ${commenterName} commented on your submission`,
preheader: `New comment on "${trackTitle}"`,
bodyHtml: `
    <h2 style="color:#f0fdfa;font-size:22px;font-weight:800;margin:0 0 8px;">New Comment</h2>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">Hey <strong style="color:#e2e8f0;">${username}</strong>,</p>
    <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
    <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;"><strong style="color:#e2e8f0;">${commenterName}</strong> on <strong>"${trackTitle}"</strong>:</p>
    <p style="color:#e2e8f0;font-size:15px;margin:0;font-style:italic;">"${commentText}"</p>
    </div>
    ${ctaButton('View Comment →', `${FRONTEND_URL}/tracks/${trackId}/submissions`)}
`,
}),

message: ({ username, senderName, conversationId }) => ({
subject: `💬 New message from ${senderName}`,
preheader: `${senderName} sent you a message on TrackBackAI`,
bodyHtml: `
    <h2 style="color:#f0fdfa;font-size:22px;font-weight:800;margin:0 0 8px;">New Message</h2>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">Hey <strong style="color:#e2e8f0;">${username}</strong>,</p>
    <div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.15);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
    <p style="color:#e2e8f0;font-size:15px;margin:0;">
        <strong>${senderName}</strong> sent you a message. Head to TrackBackAI to reply.
    </p>
    </div>
    ${ctaButton('Open Messages →', `${FRONTEND_URL}/messages/${conversationId}`)}
`,
}),
};

/* ─────────────────────────────────────────────
Main send function
- Checks user's email_notifications preferences
- Builds the right template
- Sends via Resend
───────────────────────────────────────────── */
async function sendNotificationEmail(type, recipientEmail, recipientUsername, emailPrefs, templateData) {
try {
// Global kill switch
if (!emailPrefs?.enabled) return { skipped: true, reason: 'email notifications disabled' };
// Per-type check
if (emailPrefs[type] === false) return { skipped: true, reason: `${type} emails disabled` };
// No API key configured
if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not set — skipping email');
    return { skipped: true, reason: 'no API key' };
}

const templateFn = templates[type];
if (!templateFn) return { skipped: true, reason: `no template for type: ${type}` };

const { subject, preheader, bodyHtml } = templateFn({
    username: recipientUsername,
    ...templateData,
});

const html = baseTemplate({ title: subject, preheader, bodyHtml });

const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: recipientEmail,
    subject,
    html,
});

console.log(`✉️  Email sent [${type}] to ${recipientEmail} — id: ${result.data?.id}`);
return { sent: true, id: result.data?.id };
} catch (err) {
// Never throw — email failure must not break the main request
console.error(`❌ Email send failed [${type}]:`, err.message);
return { error: err.message };
}
}

module.exports = { sendNotificationEmail };