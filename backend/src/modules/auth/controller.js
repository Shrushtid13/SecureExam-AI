const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authModel = require('./model');
const { sendMail } = require('../../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecuresecretkeyshouldbechanged';
const BCRYPT_ROUNDS = 10;

async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    // Server-side input validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields (name, email, password, role) are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be student, teacher, or admin' });
    }

    // Check if user already exists
    const existingUser = await authModel.findUserByEmail(email.toLowerCase().trim());
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Save user
    const newUser = await authModel.createUser(
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash,
      role
    );

    // Generate JWT
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '8h' });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Look up user
    const user = await authModel.findUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8h' });

    // Fetch full user data with class info
    const fullUser = await authModel.findUserById(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        role: fullUser.role,
        classId: fullUser.class_id,
        classGrade: fullUser.class_grade,
        classSection: fullUser.class_section,
        createdAt: fullUser.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
}

async function me(req, res) {
  const fullUser = await authModel.findUserById(req.user.id);
  res.json({ user: {
    id: fullUser.id,
    name: fullUser.name,
    email: fullUser.email,
    role: fullUser.role,
    classId: fullUser.class_id,
    classGrade: fullUser.class_grade,
    classSection: fullUser.class_section,
    createdAt: fullUser.created_at,
  }});
}

const crypto = require('crypto');

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await authModel.findUserByEmail(email.toLowerCase().trim());
    if (!user) {
      // Return 200 even if user not found to prevent email enumeration
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    await authModel.setResetToken(user.email, token, expiresAt);

    // Send email using mailer utility
    const resetLink = `http://localhost:5173/reset-password/${token}`;
    
    const mailResult = await sendMail({
      to: user.email,
      subject: 'Reset your SecureExam AI password',
      text: `Please click the following link to reset your password:\n\n${resetLink}\n\nThis link will expire in 1 hour.`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password for your SecureExam AI account.</p>
          <p>Please click the button below to choose a new password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #0dcaf0; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
        </div>
      `
    });

    res.json({ 
      message: 'If that email exists, a reset link has been sent.',
      previewUrl: mailResult?.previewUrl || null
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await authModel.findUserByResetToken(token);

    if (!user || !user.reset_expires || new Date() > new Date(user.reset_expires)) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await authModel.updateUserPassword(user.id, passwordHash);

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
};
