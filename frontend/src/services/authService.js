import { apiRequest } from './api.js';

/**
 * Register artisan user
 * POST /api/auth/register
 */
export async function registerUser(userData) {
  return await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

/**
 * Login artisan user
 * POST /api/auth/login
 */
export async function loginUser(credentials) {
  return await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

/**
 * Logout artisan session
 * POST /api/auth/logout
 */
export async function logoutUser() {
  return await apiRequest('/auth/logout', {
    method: 'POST',
  });
}

/**
 * Fetch current authenticated user profile
 * GET /api/auth/me
 */
export async function getCurrentUser(token) {
  return await apiRequest('/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Update current authenticated user profile
 * PUT /api/auth/profile
 */
export async function updateUserProfile(profileData, token) {
  return await apiRequest('/auth/profile', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });
}

export default {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
};

