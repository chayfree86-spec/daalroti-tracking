// Authentication service for DaalRoti Tracker

const CREDS_KEY = 'dr_auth_creds';
const SESSION_KEY = 'dr_auth_user';

export const DEFAULT_CREDS = {
  mobile: '9628717175',
  password: 'admin',
};

/**
 * Retrieve saved credentials or initialize with default credentials.
 */
export const getCredentials = () => {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return DEFAULT_CREDS;
    const parsed = JSON.parse(raw);
    return {
      mobile: parsed.mobile || DEFAULT_CREDS.mobile,
      password: parsed.password || DEFAULT_CREDS.password,
    };
  } catch {
    return DEFAULT_CREDS;
  }
};

/**
 * Update mobile number and/or password.
 */
export const updateCredentials = ({ mobile, password }) => {
  const current = getCredentials();
  const updated = {
    mobile: mobile ? String(mobile).trim() : current.mobile,
    password: password ? String(password).trim() : current.password,
  };
  localStorage.setItem(CREDS_KEY, JSON.stringify(updated));
  
  // If current session exists, update session data
  const session = getCurrentUser();
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, mobile: updated.mobile }));
  }
  return updated;
};

/**
 * Attempt login with provided mobile and password.
 */
export const login = (mobile, password) => {
  const creds = getCredentials();
  const inputMobile = String(mobile || '').trim();
  const inputPassword = String(password || '').trim();

  if (inputMobile === creds.mobile && inputPassword === creds.password) {
    const userSession = {
      mobile: creds.mobile,
      loggedInAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
    return { success: true, user: userSession };
  }

  return { 
    success: false, 
    error: 'Invalid Mobile Number or Password. Please check and try again.' 
  };
};

/**
 * Clear session and log out.
 */
export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
};

/**
 * Check if a valid session exists.
 */
export const isAuthenticated = () => {
  try {
    const session = localStorage.getItem(SESSION_KEY);
    return !!session;
  } catch {
    return false;
  }
};

/**
 * Get current active session details.
 */
export const getCurrentUser = () => {
  try {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
};
