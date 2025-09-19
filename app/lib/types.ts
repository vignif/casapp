export type MaintenanceItem = {
  id: string;
  date: string; // ISO date
  category: string;
  description: string;
  cost: number; // in EUR
  paid: boolean;
};

export type CalendarEvent = {
  id: string;
  date: string; // ISO date
  title: string;
  notes?: string;
};

export type TenantContract = {
  tenantName: string;
  email?: string;
  phone?: string;
  startDate: string; // ISO date
  endDate?: string; // ISO date
  monthlyRent: number; // in EUR
  depositHeld: number; // in EUR
};

export type Property = {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  propertyType: "apartment" | "office" | "house" | "land" | "other";
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number;
  value?: number; // optional property value in EUR
  notes?: string;
  maintenance: MaintenanceItem[];
  calendar: CalendarEvent[];
  tenant?: TenantContract;
};

