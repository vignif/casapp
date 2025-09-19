"use client";
import Link from "next/link";
import { useProperties } from "../lib/store";
import { useState, useMemo } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import UndoBanner from "../components/UndoBanner";
import { searchProperties, sortProperties, debounce } from "../lib/performance";

export default function PropertiesPage() {
  const { items, loading, error, addProperty, deleteProperty, updateProperty } = useProperties();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const editing = items.find((p) => p.id === editingId) ?? null;
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string; name?: string }>({ open: false });
  const [undo, setUndo] = useState<{ open: boolean; payload?: any }>({ open: false });

  // Optimized filtering and sorting
  const filteredAndSortedItems = useMemo(() => {
    const searched = searchProperties(items, searchQuery);
    return sortProperties(searched, sortBy, sortDirection);
  }, [items, searchQuery, sortBy, sortDirection]);

  const debouncedSearch = debounce(setSearchQuery, 300);

  function handleSubmit(formData: FormData) {
    const payload = {
      name: String(formData.get("name") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      country: String(formData.get("country") || "").trim(),
      propertyType: (String(formData.get("propertyType") || "other") as any),
      bedrooms: Number(formData.get("bedrooms") || 0),
      bathrooms: Number(formData.get("bathrooms") || 0),
      sizeSqm: Number(formData.get("sizeSqm") || 0),
      value: formData.get("value") ? Number(formData.get("value")) : undefined,
      notes: String(formData.get("notes") || "").trim() || undefined,
    };
    if (editingId) {
      updateProperty(editingId, payload as any);
    } else {
      addProperty(payload as any);
    }
    setFormOpen(false);
    setEditingId(null);
  }

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
        <h1 className="text-2xl font-semibold">Properties</h1>
        <button onClick={() => { setEditingId(null); setFormOpen(true); }} className="border rounded px-3 py-1 text-sm">Add property</button>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search properties..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="name">Name</option>
            <option value="value">Value</option>
            <option value="rent">Rent</option>
            <option value="city">City</option>
            <option value="type">Type</option>
          </select>
          <button
            onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
            className="border rounded px-2 py-1 text-sm"
            title={`Sort ${sortDirection === "asc" ? "descending" : "ascending"}`}
          >
            {sortDirection === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {formOpen && (
        <form action={handleSubmit} className="grid gap-3 border rounded-lg p-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <input name="name" defaultValue={editing?.name} placeholder="Name" className="border rounded px-2 py-1" required />
            <input name="address" defaultValue={editing?.address} placeholder="Address" className="border rounded px-2 py-1" required />
            <input name="city" defaultValue={editing?.city} placeholder="City" className="border rounded px-2 py-1" required />
            <input name="country" defaultValue={editing?.country} placeholder="Country" className="border rounded px-2 py-1" required />
            <select name="propertyType" defaultValue={editing?.propertyType ?? "apartment"} className="border rounded px-2 py-1">
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="office">Office</option>
              <option value="land">Land</option>
              <option value="other">Other</option>
            </select>
            <input type="number" name="bedrooms" defaultValue={editing?.bedrooms ?? 0} placeholder="Bedrooms" className="border rounded px-2 py-1" min={0} />
            <input type="number" name="bathrooms" defaultValue={editing?.bathrooms ?? 0} placeholder="Bathrooms" className="border rounded px-2 py-1" min={0} />
            <input type="number" name="sizeSqm" defaultValue={editing?.sizeSqm ?? 0} placeholder="Size (m²)" className="border rounded px-2 py-1" min={0} />
            <input type="number" name="value" defaultValue={editing?.value ?? ""} placeholder="Value (€)" className="border rounded px-2 py-1" min={0} />
          </div>
          <textarea name="notes" defaultValue={editing?.notes ?? ""} placeholder="Notes" className="border rounded px-2 py-1" rows={3} />
          <div className="flex gap-2">
            <button type="submit" className="border rounded px-3 py-1 text-sm bg-black text-white">{editingId ? "Save changes" : "Create"}</button>
            <button type="button" onClick={() => { setFormOpen(false); setEditingId(null); }} className="border rounded px-3 py-1 text-sm">Cancel</button>
          </div>
        </form>
      )}

      <ul className="grid gap-4">
        {filteredAndSortedItems.map((p) => (
          <li key={p.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-gray-500">
                  {p.address}, {p.city}, {p.country}
                </div>
                <div className="text-sm text-gray-500">
                  {p.propertyType} · {p.bedrooms} bd · {p.bathrooms} ba · {p.sizeSqm} m²
                </div>
                {typeof p.value === "number" && (
                  <div className="text-sm">Value: € {p.value.toLocaleString()}</div>
                )}
              </div>
              <div className="text-right min-w-40 grid gap-1">
                <div className="text-sm">Rent: € {p.tenant?.monthlyRent?.toLocaleString?.() ?? "—"}</div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setEditingId(p.id); setFormOpen(true); }} className="border rounded px-2 py-1 text-xs">Edit</button>
                  <button onClick={() => setConfirm({ open: true, id: p.id, name: p.name })} className="border rounded px-2 py-1 text-xs text-red-600">Delete</button>
                  <Link href={`/properties/${p.id}`} className="border rounded px-2 py-1 text-xs">Details</Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={confirm.open}
        title="Delete property?"
        description={`This will remove ${confirm.name} and its data.`}
        confirmText="Delete"
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => {
          const removed = filteredAndSortedItems.find((i) => i.id === confirm.id);
          if (removed) {
            setUndo({ open: true, payload: removed });
          }
          if (confirm.id) deleteProperty(confirm.id);
          setConfirm({ open: false });
        }}
      />
      <UndoBanner
        open={undo.open}
        message={<span>Property deleted.</span>}
        onUndo={() => {
          const p = undo.payload;
          if (p) {
            addProperty(p);
          }
          setUndo({ open: false, payload: undefined });
        }}
        onClose={() => setUndo({ open: false, payload: undefined })}
      />
    </div>
  );
}


