import { Property, TenantContract } from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function monthsActiveInLast12(contract?: TenantContract): number {
  if (!contract) return 0;
  const now = new Date();
  const end = contract.endDate ? new Date(contract.endDate) : now;
  const start = new Date(contract.startDate);
  const windowStart = new Date(now);
  windowStart.setMonth(now.getMonth() - 11, 1);

  const effectiveStart = start > windowStart ? start : windowStart;
  const effectiveEnd = end < now ? end : now;
  if (effectiveEnd < effectiveStart) return 0;

  const months = (effectiveEnd.getFullYear() - effectiveStart.getFullYear()) * 12 + (effectiveEnd.getMonth() - effectiveStart.getMonth()) + 1;
  return clamp(months, 0, 12);
}

export function annualRevenueForProperty(p: Property): number {
  if (!p.tenant) return 0;
  const months = monthsActiveInLast12(p.tenant);
  return months * p.tenant.monthlyRent;
}

export function performanceForProperty(p: Property): number | null {
  if (!p.value || p.value <= 0) return null;
  const annualRevenue = annualRevenueForProperty(p);
  return (annualRevenue / p.value) * 100;
}

export function nextContractEndDate(properties: Property[]): Date | null {
  const futureEnds = properties
    .map((p) => p.tenant?.endDate ? new Date(p.tenant.endDate) : null)
    .filter((d): d is Date => !!d && d >= new Date())
    .sort((a, b) => a.getTime() - b.getTime());
  return futureEnds[0] ?? null;
}

export function getPortfolioMetrics(properties: Property[]) {
  const totalWorth = properties.reduce((sum, p) => sum + (p.value ?? 0), 0);
  const totalAnnualRevenue = properties.reduce((sum, p) => sum + annualRevenueForProperty(p), 0);
  const totalMonthlyRevenue = totalAnnualRevenue / 12;
  const averagePerformance = totalWorth > 0 ? (totalAnnualRevenue / totalWorth) * 100 : 0;
  const yearlyMaintenance = properties
    .flatMap((p) => p.maintenance)
    .filter((m) => new Date(m.date).getFullYear() === new Date().getFullYear())
    .reduce((sum, m) => sum + m.cost, 0);
  const netAnnualIncome = totalAnnualRevenue - yearlyMaintenance;
  const netPerformance = totalWorth > 0 ? (netAnnualIncome / totalWorth) * 100 : 0;

  return {
    totalWorth,
    totalAnnualRevenue,
    totalMonthlyRevenue,
    averagePerformance,
    yearlyMaintenance,
    netAnnualIncome,
    netPerformance,
  };
}


