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
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80'
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
      role: 'artisan'
    };
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
    
    return {
      success: true,
      token: 'demo_token_' + Date.now(),
      user: isDemo ? DEMO_USER : {
        ...DEMO_USER,
        name: identifier.includes('@') ? identifier.split('@')[0] : 'Artisan ' + identifier.slice(-4),
        email: identifier.includes('@') ? identifier : `${identifier}@karigar.in`,
        phone: identifier.includes('@') ? '+91 98765 43210' : identifier,
      },
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
  if (token && token.startsWith('demo_token_')) {
    return {
      success: true,
      user: DEMO_USER,
    };
  }
  try {
    return await apiRequest('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    return {
      success: true,
      user: DEMO_USER,
    };
  }
}

/**
 * Update current authenticated user profile
 * PUT /api/auth/profile
 */
export async function updateUserProfile(profileData, token) {
  try {
    return await apiRequest('/auth/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
  } catch (err) {
    console.warn('Backend update profile notice:', err.message);
    return {
      success: true,
      user: {
        ...DEMO_USER,
        ...profileData,
      },
    };
  }
}

export default {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
};

