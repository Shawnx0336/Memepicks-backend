const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401);

  const jwtSecret = process.env.JWT_SECRET || 'YOUR_DEFAULT_SECRET_KEY';

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
        console.error("JWT Verification Error:", err.message);
        return res.sendStatus(403);
    }
    if (!user || !user.walletAddress) {
        console.error("JWT payload missing walletAddress:", user);
        return res.sendStatus(403);
    }
    req.user = user;
    console.log(`Authenticated user: ${req.user.walletAddress}`);
    next();
  });
};

module.exports = authenticateToken;
