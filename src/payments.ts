import type { AxiosInstance } from 'axios';
import type { PeriodicOptions } from './types';

export function makePaymentsAPI(paymentClient: AxiosInstance) {
  return {
    initiate: async (payload: {
      service_type: string;
      lga: number;
      channel?: string;           // legacy
      payment_type?: string;      // canonical (BE expects this)
      gateway?: string | null;
      amount?: number;            // server overrides; optional for staff overrides
      callback_url?: string;
      metadata?: Record<string, any>;
      form?: Record<string, any>;
    } & Partial<PeriodicOptions>) => {
      const body: any = {
        service_type: payload.service_type,
        lga: payload.lga,
        payment_type: payload.payment_type ?? payload.channel,
        gateway: payload.gateway ?? null,
        callback_url: payload.callback_url,
        ...(payload.billing_unit ? { billing_unit: payload.billing_unit } : {}),
        ...(payload.billing_count ? { billing_count: payload.billing_count } : {}),
        ...(payload.metadata ? { metadata: payload.metadata } : {}),
        ...(payload.form ? { form: payload.form } : {}),
      };
      if (payload.amount != null) body.amount = payload.amount;

      const res = await paymentClient.post('/initiate/', body);
      return res.data as { reference: string; payment_url?: string };
    },

    list: async (params: Record<string, any> = {}) => {
      const res = await paymentClient.get('/', { params });
      return res.data;
    },

    exportCsv: async () => {
      const res = await paymentClient.get('/export/csv/', { responseType: 'blob' });
      return res.data as Blob;
    },

    exportPdf: async () => {
      const res = await paymentClient.get('/export/pdf/', { responseType: 'blob' });
      return res.data as Blob;
    },
  };
}