import type { ServiceMeta, PeriodicOptions, PeriodicUnit } from './types';
import type { AxiosInstance } from 'axios';

const FALLBACK_SERVICE_MAP: Record<string, ServiceMeta> = {
  birth_certificate: {
    slug: 'birth_certificate',
    path: 'birth-certificate-applications',
    application_type: 'citizen',
  },
  death_certificate: {
    slug: 'death_certificate',
    path: 'death-certificate-applications',
    application_type: 'citizen',
  },
  marriage_certificate: {
    slug: 'marriage_certificate',
    path: 'marriage-certificate-applications',
    application_type: 'citizen',
  },

  business_permit: {
    slug: 'business_permit',
    path: 'business-permits',
    application_type: 'hybrid',
  },
  hawking_permit: {
    slug: 'hawking_permit',
    path: 'hawking-permits',
    application_type: 'hybrid',
    is_periodic: true,
  },
  building_permit: {
    slug: 'building_permit',
    path: 'building-permits',
    application_type: 'citizen',
  },
  waste_management_levy: {
    slug: 'waste_management_levy',
    path: 'waste-management-levies',
    application_type: 'admin',
  },

  market_stall: {
    slug: 'market_stall',
    path: 'market-stalls',
    application_type: 'hybrid',
  },
  vehicle_sticker: {
    slug: 'vehicle_sticker',
    path: 'vehicle-stickers',
    application_type: 'hybrid',
  },
  toll_ticket: {
    slug: 'toll_ticket',
    path: 'toll-tickets',
    application_type: 'citizen',
  },

  school_registration: {
    slug: 'school_registration',
    path: 'school-registrations',
    application_type: 'citizen',
  },
  community_hall_booking: {
    slug: 'community_hall_booking',
    path: 'community-hall-bookings',
    application_type: 'citizen',
  },
  church_registration: {
    slug: 'church_registration',
    path: 'church-registrations',
    application_type: 'citizen',
  },

  environmental_compliance: {
    slug: 'environmental_compliance',
    path: 'environmental-compliance',
    application_type: 'admin',
  },
  health_inspection: {
    slug: 'health_inspection',
    path: 'health-inspections',
    application_type: 'admin',
  },
  health_facility_registration: {
    slug: 'health_facility_registration',
    path: 'health-facility-registrations',
    application_type: 'citizen',
  },
  health_inspection_certificate: {
    slug: 'health_inspection_certificate',
    path: 'health-inspection-certificates',
    application_type: 'admin',
  },

  identification_letter: {
    slug: 'identification_letter',
    path: 'identification-letters',
    application_type: 'citizen',
  },
  residency_confirmation: {
    slug: 'residency_confirmation',
    path: 'residency-confirmations',
    application_type: 'citizen',
  },
  local_government_identification_letter: {
    slug: 'local_government_identification_letter',
    path: 'local-government-identification-letters',
    application_type: 'citizen',
  },
  certificate_of_origin: {
    slug: 'certificate_of_origin',
    path: 'certificate-of-origin',
    application_type: 'citizen',
  },

  property_tax: {
    slug: 'property_tax',
    path: 'land-property/property-taxes',
    application_type: 'admin',
  },
  land_use_charge: {
    slug: 'land_use_charge',
    path: 'land-property/land-use-charges',
    application_type: 'admin',
  },
  property_registration: {
    slug: 'property_registration',
    path: 'land-property/registrations',
    application_type: 'citizen',
  },
  property_rate_invoice: {
    slug: 'property_rate_invoice',
    path: 'land-property/invoices',
    application_type: 'admin',
  },

  mediation_request: {
    slug: 'mediation_request',
    path: 'mediation-requests',
    application_type: 'citizen',
  },
  local_court_filing: {
    slug: 'local_court_filing',
    path: 'local-court-filings',
    application_type: 'citizen',
  },

  advertising_permit: {
    slug: 'advertising_permit',
    path: 'advertising-permits',
    application_type: 'citizen',
  },
  digital_ad_space_booking: {
    slug: 'digital_ad_space_booking',
    path: 'digital-ad-space-bookings',
    application_type: 'citizen',
  },
  mobile_ad_permit: {
    slug: 'mobile_ad_permit',
    path: 'mobile-ad-permits',
    application_type: 'citizen',
  },
  ad_monitoring_report: {
    slug: 'ad_monitoring_report',
    path: 'ad-monitoring-reports',
    application_type: 'admin',
  },
};

let _serviceMap: Record<string, ServiceMeta> | null = null;
let _serviceMapPromise: Promise<Record<string, ServiceMeta>> | null = null;

export function makeRevenueAPI(revenueClient: AxiosInstance) {
  async function fetchServiceMap(): Promise<Record<string, ServiceMeta>> {
    if (_serviceMap) return _serviceMap;
    if (_serviceMapPromise) return _serviceMapPromise;

    _serviceMapPromise = (async () => {
      try {
        const res = await revenueClient.get<{ services: ServiceMeta[] }>('/core/services-map/');
        const map = Object.fromEntries(res.data.services.map(s => [s.slug, s]));
        _serviceMap = map;
        return map;
      } catch {
        _serviceMap = FALLBACK_SERVICE_MAP;
        return FALLBACK_SERVICE_MAP;
      } finally {
        _serviceMapPromise = null;
      }
    })();

    return _serviceMapPromise;
  }

  function slugToDefaultPath(slug: string) {
    const dashed = slug.replace(/_/g, '-');
    return dashed.endsWith('s') ? dashed : `${dashed}s`;
  }

  async function getServicePath(slug: string, override?: string) {
    if (override) return override;
    const map = await fetchServiceMap();
    return map[slug]?.path ?? slugToDefaultPath(slug);
  }

  type CreatePayload = {
    payment_reference: string;
    lga?: number;
    [key: string]: any; // holder_id etc.
  } & Partial<PeriodicOptions>;

  return {
    async create(serviceType: string, payload: CreatePayload, opts?: { pathOverride?: string }) {
      const path = await getServicePath(serviceType, opts?.pathOverride);
      const body: any = {
        ...payload,
        ...(payload.billing_unit ? { billing_unit: payload.billing_unit } : {}),
        ...(payload.billing_count ? { billing_count: payload.billing_count } : {}),
      };
      const res = await revenueClient.post(`/${path}/`, body);
      return res.data;
    },

    async list(serviceType: string, params?: Record<string, any>, opts?: { pathOverride?: string }) {
      const path = await getServicePath(serviceType, opts?.pathOverride);
      const res = await revenueClient.get(`/${path}/`, { params });
      return res.data;
    },

    async retrieve(serviceType: string, id: number | string, opts?: { pathOverride?: string }) {
      const path = await getServicePath(serviceType, opts?.pathOverride);
      const res = await revenueClient.get(`/${path}/${id}/`);
      return res.data;
    },

    async approve(serviceType: string, id: number | string, body: Record<string, any> = {}, opts?: { pathOverride?: string }) {
      const path = await getServicePath(serviceType, opts?.pathOverride);
      const res = await revenueClient.post(`/${path}/${id}/approve/`, body);
      return res.data;
    },

    async reject(serviceType: string, id: number | string, reason: string, opts?: { pathOverride?: string }) {
      const path = await getServicePath(serviceType, opts?.pathOverride);
      const res = await revenueClient.post(`/${path}/${id}/reject/`, { rejection_reason: reason });
      return res.data;
    },

    async resubmit(serviceType: string, id: number | string, patch: Record<string, any>, opts?: { pathOverride?: string }) {
      const path = await getServicePath(serviceType, opts?.pathOverride);
      const res = await revenueClient.post(`/${path}/${id}/resubmit/`, patch);
      return res.data;
    },

    // UI helpers
    async getServiceMeta(slug: string): Promise<ServiceMeta | undefined> {
      const map = await fetchServiceMap();
      return map[slug];
    },
    async isPeriodic(slug: string): Promise<boolean> {
      const meta = await this.getServiceMeta(slug);
      return !!meta?.is_periodic;
    },
    async allowedUnits(slug: string): Promise<PeriodicUnit[] | undefined> {
      const meta = await this.getServiceMeta(slug);
      return meta?.allowed_units;
    },
  };
}