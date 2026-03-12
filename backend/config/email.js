const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'TrackBackAI <notifications@trackbackai.me>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3005';

/* ─────────────────────────────────────────────
Base HTML template
───────────────────────────────────────────── */
function baseTemplate({ title, preheader, bodyHtml }) {
return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:48px 20px;">
<tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

    <!-- Logo bar -->
    <tr><td style="padding-bottom:24px;text-align:center;">
        <span style="font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-0.03em;">
        Track<span style="color:#14b8a6;">Back</span>AI
        </span>
    </td></tr>

    <!-- Card -->
    <tr><td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">

        <!-- Teal accent bar -->
        <div style="height:4px;background:linear-gradient(90deg,#14b8a6,#06b6d4);"></div>

        <!-- Content -->
        <div style="padding:40px 48px;">
        ${bodyHtml}
        </div>

        <!-- Footer inside card -->
        <div style="padding:24px 48px;background:#f8fafc;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:12px;margin:0 0 6px;line-height:1.6;">
            You're receiving this because you have email notifications enabled on TrackBackAI.
        </p>
        <p style="margin:0;">
            <a href="${FRONTEND_URL}/profile/edit" style="color:#14b8a6;font-size:12px;text-decoration:none;">Manage preferences</a>
            <span style="color:#cbd5e1;margin:0 8px;">·</span>
            <a href="${FRONTEND_URL}" style="color:#94a3b8;font-size:12px;text-decoration:none;">trackbackai.me</a>
        </p>
        </div>

    </td></tr>

    <!-- Bottom note -->
    <tr><td style="padding-top:20px;text-align:center;">
        <p style="color:#94a3b8;font-size:11px;margin:0;">© 2025 TrackBackAI. All rights reserved.</p>
    </td></tr>

    </table>
</td></tr>
</table>
</body>
</html>`;
}

/* ─────────────────────────────────────────────
CTA button
───────────────────────────────────────────── */
function ctaButton(text, href) {
return `<table cellpadding="0" cellspacing="0" style="margin:32px auto 0;">
<tr><td style="background:linear-gradient(135deg,#14b8a6,#06b6d4);border-radius:100px;">
    <a href="${href}" style="display:inline-block;padding:14px 36px;color:#ffffff;font-weight:700;font-size:14px;letter-spacing:0.02em;text-decoration:none;">${text}</a>
</td></tr>
</table>`;
}

/* ─────────────────────────────────────────────
Divider
───────────────────────────────────────────── */
function divider() {
return `<div style="height:1px;background:#e2e8f0;margin:28px 0;"></div>`;
}

/* ─────────────────────────────────────────────
Notification templates
───────────────────────────────────────────── */
const templates = {

collaboration_request: ({ username, senderName, trackTitle }) => ({
subject: `${senderName} wants to collaborate with you`,
preheader: `New collaboration request on "${trackTitle}"`,
bodyHtml: `
    <p style="font-size:13px;font-weight:600;color:#14b8a6;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Collaboration Request</p>
    <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 8px;line-height:1.2;">You have a new request</h1>
    <p style="color:#64748b;font-size:15px;margin:0 0 28px;">Hi <strong style="color:#0f172a;">${username}</strong>,</p>
    <div style="background:#f0fdfa;border-left:3px solid #14b8a6;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
    <p style="color:#0f172a;font-size:14px;margin:0 0 4px;"><strong>${senderName}</strong> wants to collaborate on:</p>
    <p style="color:#14b8a6;font-size:17px;font-weight:700;margin:0;">"${trackTitle}"</p>
    </div>
    <p style="color:#64748b;font-size:14px;margin:0;">Head to your collaborations page to review and respond to this request.</p>
    ${ctaButton('View Request →', `${FRONTEND_URL}/collaborations`)}
`,
}),

collaboration_response: ({ username, responderName, trackTitle, status }) => ({
subject: status === 'approved'
    ? `${responderName} accepted your collaboration request`
    : `${responderName} declined your collaboration request`,
preheader: `Your request on "${trackTitle}" was ${status}`,
bodyHtml: `
    <p style="font-size:13px;font-weight:600;color:${status === 'approved' ? '#14b8a6' : '#ef4444'};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Collaboration ${status === 'approved' ? 'Accepted' : 'Declined'}</p>
    <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 8px;line-height:1.2;">
    ${status === 'approved' ? 'Great news! 🎉' : 'Request update'}
    </h1>
    <p style="color:#64748b;font-size:15px;margin:0 0 28px;">Hi <strong style="color:#0f172a;">${username}</strong>,</p>
    <div style="background:${status === 'approved' ? '#f0fdfa' : '#fff1f2'};border-left:3px solid ${status === 'approved' ? '#14b8a6' : '#ef4444'};border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
    <p style="color:#0f172a;font-size:14px;margin:0;">
        <strong>${responderName}</strong> has <strong style="color:${status === 'approved' ? '#14b8a6' : '#ef4444'};">${status === 'approved' ? 'accepted' : 'declined'}</strong> your collaboration request on <strong>"${trackTitle}"</strong>.
    </p>
    </div>
    ${status === 'approved'
    ? `<p style="color:#64748b;font-size:14px;margin:0;">You can now start working together. Send them a message to get started!</p>
        ${ctaButton('Go to Collaborations →', `${FRONTEND_URL}/collaborations`)}`
    : `<p style="color:#64748b;font-size:14px;">Don't be discouraged — keep discovering great tracks on TrackBackAI.</p>
        ${ctaButton('Discover Tracks →', `${FRONTEND_URL}/discover`)}`
    }
`,
}),

submission: ({ username, collaboratorName, trackTitle, trackId }) => ({
subject: `${collaboratorName} submitted a new version of your track`,
preheader: `A new submission is ready to review on "${trackTitle}"`,
bodyHtml: `
    <p style="font-size:13px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">New Submission</p>
    <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 8px;line-height:1.2;">A new version is ready</h1>
    <p style="color:#64748b;font-size:15px;margin:0 0 28px;">Hi <strong style="color:#0f172a;">${username}</strong>,</p>
    <div style="background:#faf5ff;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
    <p style="color:#0f172a;font-size:14px;margin:0 0 4px;"><strong>${collaboratorName}</strong> submitted a new version of:</p>
    <p style="color:#7c3aed;font-size:17px;font-weight:700;margin:0;">"${trackTitle}"</p>
    </div>
    <p style="color:#64748b;font-size:14px;margin:0;">Listen to the submission and cast your vote to give feedback.</p>
    ${ctaButton('Review Submission →', `${FRONTEND_URL}/tracks/${trackId}/submissions`)}
`,
}),

vote: ({ username, voterName, trackTitle, trackId }) => ({
subject: `${voterName} voted on your submission`,
preheader: `Your submission on "${trackTitle}" received a new vote`,
bodyHtml: `
    <p style="font-size:13px;font-weight:600;color:#e11d48;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">New Vote</p>
    <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 8px;line-height:1.2;">Someone liked your work ❤️</h1>
    <p style="color:#64748b;font-size:15px;margin:0 0 28px;">Hi <strong style="color:#0f172a;">${username}</strong>,</p>
    <div style="background:#fff1f2;border-left:3px solid #e11d48;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
    <p style="color:#0f172a;font-size:14px;margin:0;">
        <strong>${voterName}</strong> voted on your submission for <strong>"${trackTitle}"</strong>.
    </p>
    </div>
    ${ctaButton('See the Votes →', `${FRONTEND_URL}/tracks/${trackId}/submissions`)}
`,
}),

comment: ({ username, commenterName, trackTitle, trackId, commentText }) => ({
subject: `${commenterName} commented on your submission`,
preheader: `New comment on "${trackTitle}"`,
bodyHtml: `
    <p style="font-size:13px;font-weight:600;color:#d97706;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">New Comment</p>
    <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 8px;line-height:1.2;">Someone left a comment</h1>
    <p style="color:#64748b;font-size:15px;margin:0 0 28px;">Hi <strong style="color:#0f172a;">${username}</strong>,</p>
    <div style="background:#fffbeb;border-left:3px solid #d97706;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
    <p style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">${commenterName} on "${trackTitle}"</p>
    <p style="color:#0f172a;font-size:15px;margin:0;line-height:1.6;font-style:italic;">"${commentText}"</p>
    </div>
    ${ctaButton('View Comment →', `${FRONTEND_URL}/tracks/${trackId}/submissions`)}
`,
}),

message: ({ username, senderName, conversationId }) => ({
subject: `New message from ${senderName}`,
preheader: `${senderName} sent you a message on TrackBackAI`,
bodyHtml: `
    <p style="font-size:13px;font-weight:600;color:#2563eb;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">New Message</p>
    <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 8px;line-height:1.2;">You have a new message</h1>
    <p style="color:#64748b;font-size:15px;margin:0 0 28px;">Hi <strong style="color:#0f172a;">${username}</strong>,</p>
    <div style="background:#eff6ff;border-left:3px solid #2563eb;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
    <p style="color:#0f172a;font-size:14px;margin:0;">
        <strong>${senderName}</strong> sent you a message. Head to TrackBackAI to read and reply.
    </p>
    </div>
    ${ctaButton('Open Messages →', `${FRONTEND_URL}/messages/${conversationId}`)}
`,
}),
};

/* ─────────────────────────────────────────────
Main send function
───────────────────────────────────────────── */
async function sendNotificationEmail(type, recipientEmail, recipientUsername, emailPrefs, templateData) {
try {
if (!emailPrefs?.enabled) return { skipped: true, reason: 'email notifications disabled' };
if (emailPrefs[type] === false) return { skipped: true, reason: `${type} emails disabled` };
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


return { sent: true, id: result.data?.id };
} catch (err) {
console.error(`❌ Email send failed [${type}]:`, err.message);
return { error: err.message };
}
}

module.exports = { sendNotificationEmail };