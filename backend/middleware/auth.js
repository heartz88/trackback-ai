const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ 
        error: { 
            message: 'No authorization header provided',
            code: 'NO_AUTH_HEADER'
        } 
        });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
        error: { 
            message: 'No token provided',
            code: 'NO_TOKEN'
        } 
        });
    }

    
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
            error: { 
            message: 'Token has expired. Please log in again.',
            code: 'TOKEN_EXPIRED',
            expiredAt: jwtError.expiredAt
            } 
        });
        } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
            error: { 
            message: 'Invalid token format',
            code: 'INVALID_TOKEN'
            } 
        });
        } else {
        return res.status(401).json({ 
            error: { 
            message: 'Token verification failed',
            code: 'VERIFICATION_FAILED'
            } 
        });
        }
    }

    // Attach user info to request
    req.user = {
        id: decoded.id || decoded.userId,
        username: decoded.username,
        email: decoded.email
    };
    next();
    
} catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
    error: {
        message: 'Authentication error',
        code: 'AUTH_ERROR'
    }
    });
}
};

module.exports = authMiddleware;