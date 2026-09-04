import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import config from '../config/env.config.js';
import { loadStore, persistUser } from '../services/storageService.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    let user = null;

    if (decoded && decoded.id) {
      user = await User.findById(decoded.id);
    }

    // Auto-heal session in case database restarted or user document was reset
    if (!user && decoded) {
      if (decoded.email) {
        user = await User.findOne({ email: decoded.email.toLowerCase() });
      }

      if (!user) {
        const store = loadStore();
        const storedUser = store.users.find(
          (u) =>
            (decoded.id && String(u._id) === String(decoded.id)) ||
            (decoded.email && u.email && u.email.toLowerCase() === decoded.email.toLowerCase())
        );

        user = await User.create({
          _id: (storedUser && storedUser._id) || (decoded.id && decoded.id.length === 24 ? decoded.id : undefined),
          name: (storedUser && storedUser.name) || decoded.name || 'Karigar Artisan',
          email: (storedUser && storedUser.email) || decoded.email || 'artisan@karigar.in',
          phone: (storedUser && storedUser.phone) || '9876543210',
          password: (storedUser && storedUser.password) || 'password123',
          preferredLanguage: (storedUser && storedUser.preferredLanguage) || 'EN',
          location: (storedUser && storedUser.location) || 'Gujarat, India',
          storeName: storedUser && storedUser.storeName,
          craftType: storedUser && storedUser.craftType,
        });

        persistUser(user);
        console.log(`✨ Auto-healed artisan session for ${user.email}`);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user session. Please log in again.',
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Authentication failed.',
    });
  }
};

