const jwt = require('jsonwebtoken');

// verifying JWT token
// for this, log in is must
const protect = (req, res, next) => {
    let token;

    if(req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
        // extracting token after bearer
        token = req.headers.authorization.split(' ')[1];
        // verifying token using our JWT secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // attaching user info such as id and role to the request object
        req.user = {
            id: decoded.id,
            role: decoded.role
        };
        return next();
    } catch (error) {
        return res.status(401).json({message: 'Not authorized, INVALID TOKEN'});
    }
}
return res.status(401).json({message: 'Not Authorized, NO TOKEN PROVIDED'});
};

// checking role, for ADMIN Access only
const adminOnly = (req, res, next) => {
    if(req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({message : 'Access Denied !! Only for Admin Access.'});
};

module.exports = {protect, adminOnly};
