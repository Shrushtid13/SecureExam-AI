const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authModel = require('./model');

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

module.exports = {
  register,
  login,
  me,
};
