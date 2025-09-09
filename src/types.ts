export type PeriodicUnit = 'day' | 'week' | 'month' | 'year';
export type PeriodicOptions = {
  billing_unit?: PeriodicUnit;
  billing_count?: number;
};

export type ServiceMeta = {
  slug: string;
  path: string;
  application_type?: 'citizen' | 'hybrid' | 'admin';
  is_periodic?: boolean;
  allowed_units?: PeriodicUnit[];
};