import { Property } from "./types";

export const properties: Property[] = [
  {
    id: "prop-rome-apt",
    name: "Rome Center Apartment",
    address: "Via del Corso 123",
    city: "Rome",
    country: "Italy",
    propertyType: "apartment",
    bedrooms: 2,
    bathrooms: 1,
    sizeSqm: 75,
    value: 320000,
    notes: "Historic building, balcony facing courtyard.",
    maintenance: [
      {
        id: "m1",
        date: "2025-01-15",
        category: "Plumbing",
        description: "Fix leaking sink",
        cost: 120,
        paid: true,
      },
      {
        id: "m2",
        date: "2025-03-22",
        category: "Appliance",
        description: "Replace washing machine",
        cost: 420,
        paid: false,
      },
    ],
    calendar: [
      { id: "e1", date: "2025-09-10", title: "Tenant inspection", notes: "Check balcony door" },
      { id: "e2", date: "2025-10-01", title: "Rent due" },
    ],
    tenant: {
      tenantName: "Giulia Rossi",
      email: "giulia@example.com",
      phone: "+39 333 000 1111",
      startDate: "2024-11-01",
      endDate: "2025-10-31",
      monthlyRent: 1200,
      depositHeld: 2400,
    },
  },
  {
    id: "prop-milan-loft",
    name: "Milan Brera Loft",
    address: "Via Brera 45",
    city: "Milan",
    country: "Italy",
    propertyType: "apartment",
    bedrooms: 1,
    bathrooms: 1,
    sizeSqm: 55,
    value: 260000,
    maintenance: [
      {
        id: "m3",
        date: "2025-02-01",
        category: "Painting",
        description: "Repaint living room",
        cost: 350,
        paid: true,
      },
    ],
    calendar: [
      { id: "e3", date: "2025-09-05", title: "Cleaner visit" },
      { id: "e4", date: "2025-09-30", title: "Rent due" },
    ],
  },
];

export function getPropertyById(id: string) {
  return properties.find((p) => p.id === id);
}

export function getTotals() {
  const totalProperties = properties.length;
  const monthlyRentIncome = properties.reduce((sum, p) => sum + (p.tenant?.monthlyRent ?? 0), 0);
  const unpaidMaintenance = properties
    .flatMap((p) => p.maintenance)
    .filter((m) => !m.paid)
    .reduce((sum, m) => sum + m.cost, 0);
  return { totalProperties, monthlyRentIncome, unpaidMaintenance };
}

