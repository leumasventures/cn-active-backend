// ── ADD this to your existing auth.controller.js ─────────────────
// Paste the signup function alongside login, refreshToken, logout

export const signup = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // 2. Validate role — only allow known roles
    const allowedRoles = ['admin', 'sales_rep'];
    const assignedRole = allowedRoles.includes(role) ? role : 'sales_rep';

    // 3. Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. Build name field — use firstName + lastName if provided, else derive from email
    const name = [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0];

    // 6. Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role:     assignedRole,
        name,
        active:   true,
      },
    });

    // 7. Issue tokens (same as login)
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXP || '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXP || '7d' }
    );

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};