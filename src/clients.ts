import axios, { AxiosInstance, AxiosHeaders } from 'axios';

export type ApiConfig = {
  baseUrl: string;          // e.g. https://api.example.com
  getAuthToken?: () => string | Promise<string>;
  revenueBasePath?: string; // default: '/revenue'
  paymentBasePath?: string; // default: '/payment'
};

export function createClients(cfg: ApiConfig) {
  const authHeader = async () => {
    if (!cfg.getAuthToken) return {};
    const token = await cfg.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const make = (baseURL: string): AxiosInstance => {
    const client = axios.create({ baseURL });

    client.interceptors.request.use(async (req) => {
      const extra = await authHeader();
      if (extra && Object.keys(extra).length > 0) {
        // Always work with an AxiosHeaders instance (typed as AxiosRequestHeaders)
        const headers = AxiosHeaders.from(req.headers);
        for (const [k, v] of Object.entries(extra)) {
          if (v != null) headers.set(k, v as string);
        }
        req.headers = headers; // ✅ assignable to AxiosRequestHeaders
      }
      return req;
    });

    return client;
  };

  const base = cfg.baseUrl.replace(/\/$/, '');
  const revenueBase = base + (cfg.revenueBasePath ?? '/revenue');
  const paymentBase = base + (cfg.paymentBasePath ?? '/payment');

  return {
    revenueClient: make(revenueBase),
    paymentClient: make(paymentBase),
  };
}