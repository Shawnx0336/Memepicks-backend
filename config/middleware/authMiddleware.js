// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Placeholder for JWT authentication
// In a real app, you'd verify the token against your secret key
// and potentially fetch user details from the DB based on the token payload
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // if there isn't any token

  // Replace 'YOUR_JWT_SECRET' with your actual secret key, ideally from env variables
  const jwtSecret = process.env.JWT_SECRET || 'YOUR_DEFAULT_SECRET_KEY';

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
        console.error("JWT Verification Error:", err.message);
        return res.sendStatus(403); // Forbidden if token is invalid/expired
    }
    // IMPORTANT: Ensure the decoded user object contains the walletAddress
    if (!user || !user.walletAddress) {
        console.error("JWT payload missing walletAddress:", user);
        return res.sendStatus(403); // Invalid token payload
    }
    req.user = user; // Attach user info (including walletAddress) to the request object
    console.log(`Authenticated user: ${req.user.walletAddress}`); // Log authenticated user
    next(); // pass the execution off to whatever request the client intended
  });
};

module.exports = authenticateToken;

// middleware/rateLimitMiddleware.js
const rateLimitStore = new Map(); // In-memory store for rate limiting (Replace with Redis in production)
const slipCooldownStore = new Map(); // In-memory store for slip submission cooldown

const MAX_REQUESTS_PER_HOUR = 10;
const SLIP_COOLDOWN_SECONDS = 30;

// Rate limiter middleware (e.g., max requests per hour)
const rateLimiter = (req, res, next) => {
    const walletAddress = req.user?.walletAddress; // Assumes authMiddleware runs first
    if (!walletAddress) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const now = Date.now();
    const windowStart = now - (60 * 60 * 1000); // 1 hour window

    const userRequests = (rateLimitStore.get(walletAddress) || [])
        .filter(timestamp => timestamp > windowStart); // Get requests in the last hour

    if (userRequests.length >= MAX_REQUESTS_PER_HOUR) {
        console.warn(`Rate limit exceeded for ${walletAddress}`);
        return res.status(429).json({ message: 'Too many requests, please try again later.' });
    }

    userRequests.push(now);
    rateLimitStore.set(walletAddress, userRequests);
    console.log(`Request count for ${walletAddress}: ${userRequests.length}/${MAX_REQUESTS_PER_HOUR}`);
    next();
};

// Cooldown middleware (e.g., minimum time between slip submissions)
const slipCooldown = (req, res, next) => {
    const walletAddress = req.user?.walletAddress;
    if (!walletAddress) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const now = Date.now();
    const lastSubmissionTimestamp = slipCooldownStore.get(walletAddress);

    if (lastSubmissionTimestamp) {
        const secondsSinceLast = (now - lastSubmissionTimestamp) / 1000;
        if (secondsSinceLast < SLIP_COOLDOWN_SECONDS) {
            const timeLeft = Math.ceil(SLIP_COOLDOWN_SECONDS - secondsSinceLast);
            console.warn(`Cooldown active for ${walletAddress}. ${timeLeft}s left.`);
            return res.status(429).json({ message: `Please wait ${timeLeft} seconds before submitting another slip.` });
        }
    }

    // No need to store timestamp here, store it *after* successful submission in the controller
    // slipCooldownStore.set(walletAddress, now);
    next();
};


module.exports = { rateLimiter, slipCooldown };

// middleware/securityMiddleware.js

// Placeholder for CAPTCHA or other anti-bot measures
// In a real app, integrate with a service like hCaptcha or reCAPTCHA
const checkCaptcha = (req, res, next) => {
    const captchaToken = req.body.captchaToken; // Assuming token is sent in request body
    console.log("Captcha Check Placeholder: Token received -", captchaToken ? "Yes" : "No");

    if (!captchaToken) {
        // For now, allow if no token, but in production, you'd likely require it
        // return res.status(400).json({ message: 'CAPTCHA verification required.' });
        console.warn("No CAPTCHA token provided. Skipping check (placeholder).");
    } else {
        // TODO: Implement actual verification logic here
        // e.g., call the CAPTCHA provider's verification API
        const isCaptchaValid = true; // Placeholder
        if (!isCaptchaValid) {
            console.warn("CAPTCHA verification failed for token:", captchaToken);
            return res.status(403).json({ message: 'CAPTCHA verification failed.' });
        }
        console.log("CAPTCHA verification successful (placeholder).");
    }
    next();
};

module.exports = { checkCaptcha }; // Export if used separately
