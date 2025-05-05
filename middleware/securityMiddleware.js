const checkCaptcha = (req, res, next) => {
    const token = req.body.captchaToken;
    console.log("Captcha received:", token ? "Yes" : "No");

    if (!token) {
        console.warn("Missing CAPTCHA token — allowing through (placeholder).");
        return next();
    }

    // Placeholder: Always pass
    next();
};

module.exports = { checkCaptcha };
