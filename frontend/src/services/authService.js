import { apiRequest } from './api.js';

const DEMO_USER = {
  id: 'artisan_demo_101',
  name: 'Rameshbhai Prajapati',
  email: 'ramesh@karigar.in',
  phone: '+91 98765 43210',
  craftType: 'Terracotta & Blue Pottery',
  storeName: 'Mitti Karigar Handicrafts',
  location: 'Kutch, Gujarat, India',
  role: 'artisan',
  avatar: '' // No random stock photo by default
};

/**
 * Register artisan user
 * POST /api/auth/register
 */
export async function registerUser(userData) {
  try {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  } catch (err) {
    console.warn('Backend register unavailable, creating local session:', err.message);
    const registeredUser = {
      id: 'artisan_' + Date.now(),
      name: userData.name || 'Artisan Craftsperson',
      email: userData.email || 'artisan@karigar.in',
      phone: userData.phone || '+91 98765 43210',
      craftType: userData.craftType || 'Traditional Handicraft',
      storeName: userData.storeName || 'Artisan Workshop',
      location: userData.location || 'India',
      role: 'artisan',
      avatar: ''
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('karigar_user_profile', JSON.stringify(registeredUser));
    }
    return {
      success: true,
      token: 'demo_token_' + Date.now(),
      user: registeredUser,
    };
  }
}

/**
 * Login artisan user
 * POST /api/auth/login
 */
export async function loginUser(credentials) {
  try {
    return await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  } catch (err) {
    console.warn('Backend login unavailable, activating demo artisan session:', err.message);
    const identifier = credentials.email || credentials.emailOrPhone || 'ramesh@karigar.in';
    const isDemo = identifier === 'ramesh@karigar.in' || identifier === '9876543210';
    
    // Check if user already saved a custom profile in local storage
    let savedProfile = null;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('karigar_user_profile');
        if (raw) savedProfile = JSON.parse(raw);
      } catch (e) {}
    }

    const fallbackUser = isDemo ? DEMO_USER : {
      ...DEMO_USER,
      name: identifier.includes('@') ? identifier.split('@')[0] : 'Artisan ' + identifier.slice(-4),
      email: identifier.includes('@') ? identifier : `${identifier}@karigar.in`,
      phone: identifier.includes('@') ? '+91 98765 43210' : identifier,
      avatar: (savedProfile && savedProfile.avatar && !savedProfile.avatar.includes('unsplash')) ? savedProfile.avatar : ''
    };

    return {
      success: true,
      token: 'demo_token_' + Date.now(),
      user: savedProfile || fallbackUser,
    };
  }
}

/**
 * Logout artisan session
 * POST /api/auth/logout
 */
export async function logoutUser() {
  try {
    return await apiRequest('/auth/logout', {
      method: 'POST',
    });
  } catch (err) {
    console.warn('Logout endpoint notice:', err.message);
    return { success: true };
  }
}

/**
 * Fetch current authenticated user profile
 * GET /api/auth/me
 */
export async function getCurrentUser(token) {
  // Check local profile first
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('karigar_user_profile');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.avatar && parsed.avatar.includes('unsplash')) {
          parsed.avatar = '';
          localStorage.setItem('karigar_user_profile', JSON.stringify(parsed));
        }
        return { success: true, user: parsed };
      }
    } catch (e) {}
  }

  if (token && token.startsWith('demo_token_')) {
    return {
      success: true,
      user: DEMO_USER,
    };
  }
  try {
    const res = await apiRequest('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 2500,
    });
    if (res && res.user) {
      if (res.user.avatar && res.user.avatar.includes('unsplash')) {
        res.user.avatar = '';
      }
      return res;
    }
  } catch (err) {
    console.warn('getCurrentUser note:', err.message);
  }

  return {
    success: true,
    user: DEMO_USER,
  };
}

/**
 * Update current authenticated user profile
 * PUT /api/auth/profile
 */
export async function updateUserProfile(profileData, token) {
  let updatedUser = {
    ...profileData,
  };

  try {
    const res = await apiRequest('/auth/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 2500,
      body: JSON.stringify(profileData),
    });
    if (res && res.user) {
      updatedUser = res.user;
    }
  } catch (err) {
    console.warn('Backend update profile notice, saving locally:', err.message);
  }

  if (typeof window !== 'undefined') {
    try {
      const existing = JSON.parse(localStorage.getItem('karigar_user_profile') || '{}');
      const merged = { ...existing, ...updatedUser };
      localStorage.setItem('karigar_user_profile', JSON.stringify(merged));
    } catch (e) {}
  }

  return {
    success: true,
    user: updatedUser,
  };
}

export default {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
};

