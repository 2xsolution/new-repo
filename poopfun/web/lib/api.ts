// API client utilities
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiClient {
  static async get(endpoint: string) {
    const res = await fetch(`${API_BASE}${endpoint}`);
    return res.json();
  }

  static async post(endpoint: string, data: any) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async put(endpoint: string, data: any) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }
}

// Token API
export const tokenApi = {
  create: (data: any) => ApiClient.post('/api/tokens/create', data),
  getAll: (params?: any) => ApiClient.get(`/api/tokens${params ? '?' + new URLSearchParams(params) : ''}`),
  getByMint: (mint: string) => ApiClient.get(`/api/tokens/${mint}`),
  getProgress: (mint: string) => ApiClient.get(`/api/tokens/${mint}/progress`),
};

// Trading API
export const tradingApi = {
  buy: (data: any) => ApiClient.post('/api/trading/buy', data),
  sell: (data: any) => ApiClient.post('/api/trading/sell', data),
};

// Identity API
export const identityApi = {
  check: (name: string, ticker: string) => ApiClient.get(`/api/identity/check?name=${name}&ticker=${ticker}`),
};