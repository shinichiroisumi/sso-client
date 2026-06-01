class SSOClient {
  constructor(config = {}) {
    this.ssoServerUrl = config.ssoServerUrl || 'http://localhost:3000';
    this.appId = config.appId;
    this.redirectUri = config.redirectUri || window.location.origin;
    this.debug = config.debug || false;
    this.storageType = config.storageType || 'localStorage';
    this.tokenKey = 'sso_token';
  }

  log(...args) {
    if (this.debug) {
      console.log('[SSO Client]', ...args);
    }
  }

  getStorage() {
    return this.storageType === 'localStorage' ? localStorage : sessionStorage;
  }

  getToken() {
    const storage = this.getStorage();
    return storage.getItem(this.tokenKey);
  }

  setToken(token) {
    const storage = this.getStorage();
    if (token) {
      storage.setItem(this.tokenKey, token);
      this.log('Token saved to', this.storageType);
    } else {
      storage.removeItem(this.tokenKey);
      this.log('Token removed from', this.storageType);
    }
  }

  async handleCallback() {
    this.log('Checking URL for token callback...');
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    if (error) {
      this.log('Error from SSO:', error);
      return { authenticated: false, error: error };
    }
    
    if (token) {
      this.log('Token found in URL, saving to storage');
      this.setToken(token);
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      this.log('URL cleaned, token saved');
      return await this.checkAuth();
    }
    
    this.log('No token in URL');
    return { authenticated: false };
  }

  async checkAuth() {
    this.log('Checking authentication...');
    const token = this.getToken();
    
    if (!token) {
      this.log('No token found');
      return { authenticated: false };
    }
    
    try {
      const response = await fetch(`${this.ssoServerUrl}/api/verify/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, appId: this.appId })
      });
      
      const data = await response.json();
      
      if (data.valid) {
        this.log('Authentication valid, user:', data.user.username);
        return { authenticated: true, user: data.user };
      } else {
        this.log('Token invalid or expired');
        this.setToken(null);
        return { authenticated: false };
      }
    } catch (err) {
      this.log('Check auth error:', err.message);
      return { authenticated: false, error: err.message };
    }
  }

  login(returnUrl) {
    this.log('Redirecting to SSO login page...');
    const currentUrl = returnUrl || window.location.href;
    const redirectUrl = `${this.ssoServerUrl}/login?redirect=${encodeURIComponent(currentUrl)}`;
    window.location.href = redirectUrl;
  }

  async logout() {
    this.log('Logging out...');
    const token = this.getToken();
    
    if (token) {
      try {
        await fetch(`${this.ssoServerUrl}/api/auth/logout`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        this.log('Logout request sent to server');
      } catch (err) {
        this.log('Logout error:', err.message);
      }
    }
    
    this.setToken(null);
    
    if (this.redirectUri) {
      this.log('Redirecting to:', this.redirectUri);
      window.location.href = this.redirectUri;
    }
  }

  async getUser() {
    this.log('Getting user info...');
    const token = this.getToken();
    
    if (!token) {
      this.log('No token, cannot get user');
      return null;
    }
    
    try {
      const response = await fetch(`${this.ssoServerUrl}/api/verify/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.log('User info retrieved:', data.user.username);
        return data.user;
      }
      this.log('Failed to get user info:', response.status);
      return null;
    } catch (err) {
      this.log('Get user error:', err.message);
      return null;
    }
  }

  async getPhoto() {
    this.log('Getting user photo...');
    const token = this.getToken();
    
    if (!token) {
      this.log('No token, cannot get photo');
      return null;
    }
    
    try {
      const response = await fetch(`${this.ssoServerUrl}/api/verify/photo`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.log('Photo retrieved');
        return data.photo;
      }
      return null;
    } catch (err) {
      this.log('Get photo error:', err.message);
      return null;
    }
  }

  async requireAuth() {
    this.log('Requiring authentication...');
    const auth = await this.checkAuth();
    
    if (!auth.authenticated) {
      this.log('Not authenticated, redirecting to login');
      this.login();
      return null;
    }
    
    this.log('Authenticated, user:', auth.user.username);
    return auth.user;
  }

  isAuthenticated() {
    const hasToken = !!this.getToken();
    this.log('isAuthenticated:', hasToken);
    return hasToken;
  }

  clearToken() {
    this.setToken(null);
  }

  getAuthHeader() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SSOClient };
} else {
  window.SSOClient = SSOClient;
}