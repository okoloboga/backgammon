const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://backgammon.ruble.website/api' 
  : 'http://localhost:3001/api';

class AuthService {
  async generateChallenge() {
    const response = await fetch(`${API_BASE_URL}/auth/generate-challenge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate challenge');
    }
    
    return await response.json();
  }

  async verifyProof(account, tonProof, clientId, telegramData) {
    const response = await fetch(`${API_BASE_URL}/auth/verify-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account,
        tonProof,
        clientId,
        ...telegramData,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to verify proof');
    }
    
    return await response.json();
  }

  setAuthToken(token) {
    localStorage.setItem('auth_token', token);
  }

  getAuthToken() {
    return localStorage.getItem('auth_token');
  }

  clearAuth() {
    localStorage.removeItem('auth_token');
  }

  isAuthenticated() {
    return !!this.getAuthToken();
  }
}

export const authService = new AuthService();