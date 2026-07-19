const express = require('express');
const authController = require('./controller');
const { requireAuth } = require('../../middleware/requireAuth');
const { authLimiter } = require('../../middleware/rateLimit');
const validate = require('../../middleware/validate');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../../validations');

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', requireAuth, authController.me);

module.exports = router;
