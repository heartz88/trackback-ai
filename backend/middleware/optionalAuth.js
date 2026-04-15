const jwt = require('jsonwebtoken');

// optionalAuth — reads the JWT if present and populates req.user,
// but does NOT reject the request if no token is provided.
// Use on public routes that need to personalise responses for
// logged-in users (e.g. user_vote on submissions).
const optionalAuth = (req, res, next) => {
try {
const authHeader = req.headers.authorization;
if (!authHeader) return next(); // no token — continue as guest

const token = authHeader.split(' ')[1];
if (!token) return next();

try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
    id:       decoded.id || decoded.userId,
    username: decoded.username,
    email:    decoded.email,
    };
} catch {
    // expired or invalid token — treat as guest, don't error
}

next();
} catch {
next();
}
};

module.exports = optionalAuth;