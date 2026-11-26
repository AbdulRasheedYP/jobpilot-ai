const RAW_API_URL = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
  : '';
export const API_BASE = RAW_API_URL ? `${RAW_API_URL}/api/v1` : '/api/v1';


let authToken = localStorage.getItem('jobpilot_token') || '';

export const getAuthToken = () => authToken;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('jobpilot_token', token);
  } else {
    localStorage.removeItem('jobpilot_token');
  }
};

export const performLogin = async (email = null, password = 'password123') => {
  const loginEmail = email || localStorage.getItem('jobpilot_email') || 'candidate@jobpilot.ai';
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password }),
    });
    if (res.ok) {
      const data = await res.json();
      setAuthToken(data.access_token);
      localStorage.setItem('jobpilot_email', loginEmail);
      return data.access_token;
    }
  } catch (err) {
    console.error('Login error:', err);
  }
  return null;
};

export const authFetch = async (endpoint, options = {}, isRetry = false) => {
  let token = getAuthToken();
  if (!token) {
    token = await performLogin();
  }

  const headers = {
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && !isRetry) {
      const freshToken = await performLogin();
      if (freshToken) {
        return await authFetch(endpoint, options, true);
      }
    }

    return response;
  } catch (networkErr) {
    console.error('Fetch error:', networkErr);
    return {
      ok: false,
      status: 0,
      statusText: 'Connection Refused',
      json: async () => ({
        detail: 'Cannot connect to backend server. Make sure uvicorn is running on http://127.0.0.1:8000',
      }),
    };
  }
};
