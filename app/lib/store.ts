"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Property } from "./types";
import { properties as seed } from "./mockData";

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useProperties() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api<Property[]>("/api/properties");
        
        if (data.length === 0) {
          // seed DB once
          await seedDatabase();
          const seeded = await api<Property[]>("/api/properties");
          setItems(seeded as any);
        } else {
          setItems(data as any);
        }
      } catch (e) {
        console.error("Failed to load properties:", e);
        setError("Failed to load properties. Please refresh the page.");
        // Fallback to seed data for development
        setItems(seed as any);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const seedDatabase = async () => {
    for (const p of seed) {
      try {
        const created = await api<Property>("/api/properties", { 
          method: "POST", 
          body: JSON.stringify({
            name: p.name,
            address: p.address,
            city: p.city,
            country: p.country,
            propertyType: p.propertyType,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            sizeSqm: p.sizeSqm,
            value: p.value,
            notes: p.notes,
          }) 
        });
        
        if (p.tenant) {
          await api(`/api/properties/${created.id}/tenant`, { 
            method: "PUT", 
            body: JSON.stringify(p.tenant) 
          });
        }
        
        for (const m of p.maintenance) {
          await api(`/api/properties/${created.id}/maintenance`, { 
            method: "POST", 
            body: JSON.stringify(m) 
          });
        }
      } catch (error) {
        console.warn("Failed to seed property:", p.name, error);
      }
    }
  };

  const refresh = useCallback(async () => {
    const data = await api<Property[]>("/api/properties");
    setItems(data as any);
  }, []);

  const addProperty = useCallback(async (p: Omit<Property, "id" | "maintenance" | "calendar" | "tenant">) => {
    const optimistic: Property = { ...(p as any), id: `optim-${Math.random().toString(36).slice(2, 8)}`, maintenance: [], calendar: [] };
    setItems((prev) => [optimistic, ...prev]);
    try {
      await api<Property>("/api/properties", { method: "POST", body: JSON.stringify(p) });
      await refresh();
    } catch (e) {
      await refresh();
      throw e;
    }
  }, [refresh]);

  const updateProperty = useCallback(async (id: string, updates: Partial<Property>) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    try {
      await api(`/api/properties/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
    } catch (e) {
      await refresh();
      throw e;
    }
  }, [refresh]);

  // Tenant API helpers
  const setTenant = useCallback(async (propertyId: string, tenant: NonNullable<Property["tenant"]>) => {
    // optimistic
    setItems((prev) => prev.map((p) => (p.id === propertyId ? { ...p, tenant } : p)));
    try {
      await api(`/api/properties/${propertyId}/tenant`, { method: "PUT", body: JSON.stringify(tenant) });
    } catch (e) {
      await refresh();
      throw e;
    }
  }, [refresh]);

  const removeTenant = useCallback(async (propertyId: string) => {
    const snapshot = items;
    setItems((prev) => prev.map((p) => (p.id === propertyId ? { ...p, tenant: undefined } : p)));
    try {
      await fetch(`/api/properties/${propertyId}/tenant`, { method: "DELETE" });
    } catch (e) {
      setItems(snapshot);
      throw e;
    }
  }, [items]);

  // Maintenance API helpers
  const addMaintenance = useCallback(async (propertyId: string, maintenance: any) => {
    try {
      const created = await api<any>(`/api/properties/${propertyId}/maintenance`, { method: "POST", body: JSON.stringify(maintenance) });
      setItems((prev) => prev.map((p) => (p.id === propertyId ? { ...p, maintenance: [created, ...p.maintenance] } : p)));
    } catch (e) {
      await refresh();
      throw e;
    }
  }, [refresh]);

  const editMaintenance = useCallback(async (propertyId: string, maintenance: any) => {
    try {
      const updated = await api<any>(`/api/properties/${propertyId}/maintenance`, { method: "PATCH", body: JSON.stringify(maintenance) });
      setItems((prev) => prev.map((p) => (p.id === propertyId ? { ...p, maintenance: p.maintenance.map((m) => (m.id === updated.id ? updated : m)) } : p)));
    } catch (e) {
      await refresh();
      throw e;
    }
  }, [refresh]);

  const removeMaintenance = useCallback(async (propertyId: string, maintenanceId: string) => {
    const snapshot = items;
    setItems((prev) => prev.map((p) => (p.id === propertyId ? { ...p, maintenance: p.maintenance.filter((m) => m.id !== maintenanceId) } : p)));
    try {
      await fetch(`/api/properties/${propertyId}/maintenance?mid=${maintenanceId}`, { method: "DELETE" });
    } catch (e) {
      setItems(snapshot);
      throw e;
    }
  }, [items]);

  const deleteProperty = useCallback(async (id: string) => {
    const snapshot = items;
    setItems((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetch(`/api/properties/${id}`, { method: "DELETE" });
    } catch (e) {
      setItems(snapshot);
      throw e;
    }
  }, [items]);

  const findById = useCallback((id: string) => items.find((p) => p.id === id), [items]);

  const stats = useMemo(() => {
    const totalProperties = items.length;
    const activeMonthlyIncome = items.reduce((sum, p) => sum + (p.tenant?.monthlyRent ?? 0), 0);
    const currentYear = new Date().getFullYear();
    const yearlyMaintenance = items
      .flatMap((p) => p.maintenance)
      .filter((m) => new Date(m.date).getFullYear() === currentYear)
      .reduce((sum, m) => sum + m.cost, 0);
    return { totalProperties, activeMonthlyIncome, yearlyMaintenance };
  }, [items]);

  return { 
    items, 
    loading, 
    error, 
    addProperty, 
    updateProperty, 
    deleteProperty, 
    findById, 
    stats, 
    setTenant, 
    removeTenant, 
    addMaintenance, 
    editMaintenance, 
    removeMaintenance 
  };
}


