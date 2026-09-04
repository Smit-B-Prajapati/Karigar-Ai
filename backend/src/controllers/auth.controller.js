import User from '../models/user.model.js';
import { persistUser, loadStore } from '../services/storageService.js';

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, preferredLanguage, location } = req.body;

    if (!name || (!email && !phone) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, password, and either email or phone number',
      });
    }

    // Check duplicate accounts
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'An account with this phone number already exists',
        });
      }
    }

    // Create user document
    const user = await User.create({
      name,
      email: email ? email.toLowerCase() : undefined,
      phone: phone || undefined,
      password,
      preferredLanguage: preferredLanguage || 'EN',
      location: location || 'India',
    });

    persistUser(user);

    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'Artisan registered successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
        location: user.location,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const body = req.body || {};
    const identifier = String(body.emailOrPhone || body.email || body.phone || '').trim();
    const password = String(body.password || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email/phone and password',
      });
    }

    const isEmail = identifier.includes('@');
    const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const searchConditions = [
      { email: identifier.toLowerCase() },
      { phone: identifier },
    ];

    if (!isEmail) {
      searchConditions.push(
        { email: new RegExp('^' + escaped + '@', 'i') },
        { name: new RegExp('^' + escaped + '$', 'i') },
        { email: `${identifier.toLowerCase()}@karigar.in` }
      );
    }

    // Search user by email, phone, or artisan name
    let user = await User.findOne({
      $or: searchConditions,
    }).select('+password');

    // If not found in MongoDB, check persistent disk store before creating a new account
    if (!user) {
      const store = loadStore();
      const storedUser = store.users.find(
        (u) =>
          (u.email && u.email.toLowerCase() === identifier.toLowerCase()) ||
          u.phone === identifier ||
          (!isEmail && u.email && u.email.toLowerCase().startsWith(identifier.toLowerCase() + '@')) ||
          (!isEmail && u.name && u.name.toLowerCase() === identifier.toLowerCase())
      );

      if (storedUser) {
        try {
          user = await User.create({
            _id: storedUser._id,
            name: storedUser.name,
            email: storedUser.email,
            phone: storedUser.phone,
            password: password,
            preferredLanguage: storedUser.preferredLanguage || 'EN',
            location: storedUser.location || 'India',
            storeName: storedUser.storeName,
            craftType: storedUser.craftType,
            avatar: storedUser.avatar,
          });
          user = await User.findById(user._id).select('+password');
          console.log(`👤 Restored user ${user.email} from persistent store on login.`);
        } catch (restoreErr) {
          console.warn('User restore notice:', restoreErr.message);
        }
      }
    }

    // If user does not exist yet (e.g. initial demo login), auto-create artisan account
    if (!user) {
      const cleanEmail = isEmail ? identifier.toLowerCase() : `${identifier.toLowerCase()}@karigar.in`;
      const cleanPhone = !isEmail ? identifier : undefined;
      const artisanName = isEmail ? identifier.split('@')[0] : identifier;

      user = await User.create({
        name: artisanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: password,
        preferredLanguage: 'EN',
        location: 'India',
      });
      user = await User.findById(user._id).select('+password');
    } else {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        // If password changed, update for demo convenience
        user.password = password;
        await user.save();
      }
    }

    // Always keep store in sync
    persistUser(user);

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar || '',
        storeName: user.storeName || `${user.name}'s Craft Studio`,
        craftType: user.craftType || 'Indian Handicrafts & Textiles',
        experienceYears: user.experienceYears || 5,
        upiId: user.upiId || '',
        preferredLanguage: user.preferredLanguage || 'EN',
        location: user.location || 'India',
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

/**
 * Get current authenticated user session
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar || '',
      storeName: user.storeName || `${user.name}'s Craft Studio`,
      craftType: user.craftType || 'Indian Handicrafts & Textiles',
      experienceYears: user.experienceYears || 5,
      upiId: user.upiId || '',
      preferredLanguage: user.preferredLanguage || 'EN',
      location: user.location || 'India',
      createdAt: user.createdAt,
    },
  });
};

/**
 * Update authenticated user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    const {
      name,
      email,
      phone,
      storeName,
      craftType,
      experienceYears,
      location,
      upiId,
      preferredLanguage,
      avatar,
    } = req.body;

    if (name !== undefined) user.name = name.trim();
    if (email !== undefined && email.trim()) user.email = email.trim().toLowerCase();
    if (phone !== undefined) user.phone = phone.trim();
    if (storeName !== undefined) user.storeName = storeName.trim();
    if (craftType !== undefined) user.craftType = craftType.trim();
    if (experienceYears !== undefined) user.experienceYears = Number(experienceYears) || 0;
    if (location !== undefined) user.location = location.trim();
    if (upiId !== undefined) user.upiId = upiId.trim();
    if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    persistUser(user);


    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar || '',
        storeName: user.storeName || `${user.name}'s Craft Studio`,
        craftType: user.craftType || 'Indian Handicrafts & Textiles',
        experienceYears: user.experienceYears || 5,
        upiId: user.upiId || '',
        preferredLanguage: user.preferredLanguage || 'EN',
        location: user.location || 'India',
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
};

/**
 * Logout user session
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

