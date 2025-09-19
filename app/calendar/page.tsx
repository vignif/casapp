"use client";
import { useMemo, useState } from "react";
import { useProperties } from "../lib/store";

export default function CalendarPage() {
  const { items, loading, error } = useProperties();
  const [filter, setFilter] = useState<string>("all");

  const events = useMemo(() => {
    const selected = filter === "all" ? items : items.filter((p) => p.id === filter);
    return selected.flatMap((p) => {
      const base = p.calendar.map((e) => ({ ...e, propertyName: p.name }));
      const tenantDates = p.tenant
        ? [
            { id: `${p.id}-cs`, date: p.tenant.startDate, title: "Contract start", propertyName: p.name },
            ...(p.tenant.endDate ? [{ id: `${p.id}-ce`, date: p.tenant.endDate, title: "Contract end", propertyName: p.name }] : []),
          ]
        : [];
      return [...tenantDates, ...base];
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [items, filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
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
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option value="all">All properties</option>
          {items.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <ul className="grid gap-2">
        {events.map((e) => (
          <li key={`${e.id}`} className="border rounded p-3 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{e.title}</div>
              <div className="text-gray-500">{e.date}</div>
            </div>
            <div className="text-gray-600">{(e as any).propertyName}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}


