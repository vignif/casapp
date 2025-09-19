"use client";
import { useProperties } from "./lib/store";
import { nextContractEndDate, performanceForProperty, getPortfolioMetrics } from "./lib/calculations";
import PropertyMap from "./components/PropertyMap";
import FinancialReportPDF from "./components/FinancialReportPDF";

export default function Home() {
  const { stats, items, loading, error } = useProperties();
  const unpaidMaintenance = items
    .flatMap((p) => p.maintenance)
    .filter((m) => !m.paid)
    .reduce((sum, m) => sum + m.cost, 0);
  const activeTenants = items.filter((p) => !!p.tenant && (!p.tenant.endDate || new Date(p.tenant.endDate) >= new Date())).length;
  const nextExpiry = nextContractEndDate(items);
  const portfolio = getPortfolioMetrics(items);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <p className="text-red-600 mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <FinancialReportPDF properties={items} />
      </div>
      
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Portfolio Worth</div>
          <div className="text-2xl font-bold">€ {portfolio.totalWorth.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Annual Revenue</div>
          <div className="text-2xl font-bold">€ {portfolio.totalAnnualRevenue.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Net Annual Income</div>
          <div className="text-2xl font-bold text-green-600">€ {portfolio.netAnnualIncome.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Net Performance</div>
          <div className="text-2xl font-bold">{portfolio.netPerformance.toFixed(1)}%</div>
        </div>
      </div>

      {/* Property Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Total properties</div>
          <div className="text-2xl font-bold">{stats.totalProperties}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Active tenants</div>
          <div className="text-2xl font-bold">{activeTenants}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Unpaid maintenance</div>
          <div className="text-2xl font-bold text-red-600">€ {unpaidMaintenance.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Monthly rent income</div>
          <div className="text-2xl font-bold">€ {stats.activeMonthlyIncome.toLocaleString()}</div>
        </div>
      </div>

      {/* Map and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Property Locations</h2>
          <PropertyMap properties={items} />
        </div>
        <div className="grid gap-4">
          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-500">Next contract expiration</div>
            <div className="text-lg">{nextExpiry ? nextExpiry.toISOString().slice(0, 10) : "—"}</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-500">Individual Performance (last 12 months)</div>
            <ul className="text-sm mt-2 space-y-1">
              {items.slice(0, 5).map((p) => {
                const perf = performanceForProperty(p);
                return (
                  <li key={p.id} className="flex items-center justify-between">
                    <span className="truncate mr-2">{p.name}</span>
                    <span>{perf === null ? "—" : `${perf.toFixed(1)}%`}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
