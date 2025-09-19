"use client";
import { useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { useProperties } from "../../lib/store";
import ConfirmDialog from "../../components/ConfirmDialog";
import UndoBanner from "../../components/UndoBanner";

type PropertyDocument = {
  id: string;
  name: string;
  type: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  createdAt: string;
};

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { items, loading, error, updateProperty, setTenant, removeTenant: removeTenantApi, addMaintenance, editMaintenance, removeMaintenance } = useProperties();
  const property = items.find((p) => p.id === id);
  const propertyId = property?.id ?? null;
  const maintenanceList = property?.maintenance ?? [];
  const tenant = property?.tenant;
  const [maintFormOpen, setMaintFormOpen] = useState(false);
  const [editingMaintenanceId, setEditingMaintenanceId] = useState<string | null>(null);
  const [tenantFormOpen, setTenantFormOpen] = useState(false);
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [docFormOpen, setDocFormOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ open: boolean; type?: "maintenance" | "tenant" | "document"; id?: string; label?: string }>({ open: false });
  const [undo, setUndo] = useState<{ open: boolean; type?: string; payload?: any }>({ open: false });
  const totalMaintenance = useMemo(() => maintenanceList.reduce((s, m) => s + m.cost, 0), [maintenanceList]);
  const unpaid = useMemo(() => maintenanceList.filter((m) => !m.paid).reduce((s, m) => s + m.cost, 0), [maintenanceList]);
  
  // Load documents on mount
  useEffect(() => {
    if (propertyId) {
      fetch(`/api/properties/${propertyId}/documents`)
        .then(res => res.json())
        .then(setDocuments)
        .catch(console.error);
    }
  }, [propertyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
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

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-gray-600 mb-4">🏠</div>
          <p className="text-gray-600 mb-2">Property not found</p>
          <a 
            href="/properties" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Properties
          </a>
        </div>
      </div>
    );
  }

  function submitMaintenance(formData: FormData) {
    const next = {
      id: `m-${Math.random().toString(36).slice(2, 8)}`,
      date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
      category: String(formData.get("category") || "General"),
      description: String(formData.get("description") || "").trim(),
      cost: Number(formData.get("cost") || 0),
      paid: Boolean(formData.get("paid")),
    };
    if (!propertyId) return;
    addMaintenance(propertyId, next);
    setMaintFormOpen(false);
  }

  function togglePaid(mid: string) {
    if (!propertyId) return;
    const current = maintenanceList.find((m) => m.id === mid);
    if (!current) return;
    editMaintenance(propertyId, { ...current, paid: !current.paid });
  }

  function deleteMaintenance(mid: string) {
    if (!propertyId) return;
    const removed = maintenanceList.find((m) => m.id === mid);
    if (removed) setUndo({ open: true, type: "maintenance", payload: removed });
    removeMaintenance(propertyId, mid);
  }

  function submitEditMaintenance(formData: FormData) {
    const mid = String(formData.get("mid"));
    const updated = {
      id: mid,
      date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
      category: String(formData.get("category") || "General"),
      description: String(formData.get("description") || "").trim(),
      cost: Number(formData.get("cost") || 0),
      paid: Boolean(formData.get("paid")),
    };
    if (!propertyId) return;
    editMaintenance(propertyId, updated);
    setEditingMaintenanceId(null);
  }

  function submitTenant(formData: FormData) {
    const next = {
      tenantName: String(formData.get("tenantName") || "").trim(),
      email: String(formData.get("email") || "").trim() || undefined,
      phone: String(formData.get("phone") || "").trim() || undefined,
      startDate: String(formData.get("startDate") || ""),
      endDate: String(formData.get("endDate") || "") || undefined,
      monthlyRent: Number(formData.get("monthlyRent") || 0),
      depositHeld: Number(formData.get("depositHeld") || 0),
    };
    if (!propertyId) return;
    setTenant(propertyId, next as any);
    setTenantFormOpen(false);
  }

  function removeTenant() {
    if (!propertyId) return;
    if (tenant) setUndo({ open: true, type: "tenant", payload: tenant });
    removeTenantApi(propertyId);
  }

  function submitDocument(formData: FormData) {
    if (!propertyId) return;
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string;

    if (!file || !name || !type) return;

    const docFormData = new FormData();
    docFormData.append("file", file);
    docFormData.append("name", name);
    docFormData.append("type", type);
    if (description) docFormData.append("description", description);

    fetch(`/api/properties/${propertyId}/documents`, {
      method: "POST",
      body: docFormData,
    })
      .then(res => res.json())
      .then(newDoc => {
        setDocuments(prev => [newDoc, ...prev]);
        setDocFormOpen(false);
      })
      .catch(console.error);
  }

  function deleteDocument(docId: string) {
    if (!propertyId) return;
    const doc = documents.find(d => d.id === docId);
    if (doc) setUndo({ open: true, type: "document", payload: doc });
    
    fetch(`/api/properties/${propertyId}/documents/${docId}`, {
      method: "DELETE",
    })
      .then(() => {
        setDocuments(prev => prev.filter(d => d.id !== docId));
      })
      .catch(console.error);
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold">{property.name}</h1>
        <div className="text-sm text-gray-500">
          {property.address}, {property.city}, {property.country}
        </div>
        <div className="text-sm text-gray-500">
          {property.propertyType} · {property.bedrooms} bd · {property.bathrooms} ba · {property.sizeSqm} m²
        </div>
      </div>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Tenant</h2>
          <button className="border rounded px-2 py-1 text-sm" onClick={() => setTenantFormOpen((s) => !s)}>{tenantFormOpen ? "Close" : property.tenant ? "Edit" : "Add"} tenant</button>
        </div>
        {tenantFormOpen && (
          <form action={submitTenant} className="grid gap-2 border rounded p-3 text-sm">
            <div className="grid sm:grid-cols-3 gap-2">
              <input name="tenantName" defaultValue={property.tenant?.tenantName} placeholder="Tenant name" className="border rounded px-2 py-1" required />
              <input name="email" defaultValue={property.tenant?.email ?? ""} placeholder="Email" className="border rounded px-2 py-1" />
              <input name="phone" defaultValue={property.tenant?.phone ?? ""} placeholder="Phone" className="border rounded px-2 py-1" />
              <input type="date" name="startDate" defaultValue={property.tenant?.startDate} className="border rounded px-2 py-1" required />
              <input type="date" name="endDate" defaultValue={property.tenant?.endDate ?? ""} className="border rounded px-2 py-1" />
              <input type="number" name="monthlyRent" defaultValue={property.tenant?.monthlyRent ?? 0} placeholder="Monthly rent (€)" className="border rounded px-2 py-1" min={0} />
              <input type="number" name="depositHeld" defaultValue={property.tenant?.depositHeld ?? 0} placeholder="Deposit (€)" className="border rounded px-2 py-1" min={0} />
            </div>
            <div>
              <button type="submit" className="border rounded px-3 py-1 bg-black text-white">Save</button>
            </div>
          </form>
        )}
        {tenant ? (
          <div className="border rounded-lg p-4 grid sm:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">Tenant</div>
              <div className="font-medium">{tenant.tenantName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Contract</div>
              <div>
                {tenant.startDate} → {tenant.endDate ?? "open"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Monthly rent</div>
              <div>€ {tenant.monthlyRent.toLocaleString()}</div>
            </div>
            <div className="sm:col-span-3">
              <button onClick={removeTenant} className="border rounded px-2 py-1 text-xs text-red-700">Remove tenant & contract</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No tenant assigned</div>
        )}
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Maintenance</h2>
          <button className="border rounded px-2 py-1 text-sm" onClick={() => setMaintFormOpen((s) => !s)}>{maintFormOpen ? "Close" : "Add"} maintenance</button>
        </div>
        {maintFormOpen && (
          <form action={submitMaintenance} className="grid gap-2 border rounded p-3 text-sm">
            <div className="grid sm:grid-cols-5 gap-2">
              <input type="date" name="date" className="border rounded px-2 py-1" />
              <input name="category" placeholder="Category" className="border rounded px-2 py-1" />
              <input name="description" placeholder="Description" className="border rounded px-2 py-1" />
              <input type="number" name="cost" placeholder="Cost (€)" className="border rounded px-2 py-1" min={0} />
              <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" name="paid" /> Paid</label>
            </div>
            <div>
              <button type="submit" className="border rounded px-3 py-1 bg-black text-white">Add</button>
            </div>
          </form>
        )}
        <div className="flex gap-4 text-sm">
          <div className="border rounded-lg p-3">Total: € {totalMaintenance.toLocaleString()}</div>
          <div className="border rounded-lg p-3">Unpaid: € {unpaid.toLocaleString()}</div>
        </div>
        <ul className="grid gap-2">
          {maintenanceList.map((m) => (
            <li key={m.id} className="border rounded-lg p-3 grid gap-2 text-sm">
              {editingMaintenanceId === m.id ? (
                <form action={submitEditMaintenance} className="grid sm:grid-cols-6 gap-2 items-center">
                  <input type="hidden" name="mid" value={m.id} />
                  <input type="date" name="date" defaultValue={m.date} className="border rounded px-2 py-1" />
                  <input name="category" defaultValue={m.category} className="border rounded px-2 py-1" />
                  <input name="description" defaultValue={m.description} className="border rounded px-2 py-1 sm:col-span-2" />
                  <input type="number" name="cost" defaultValue={m.cost} className="border rounded px-2 py-1" />
                  <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" name="paid" defaultChecked={m.paid} /> Paid</label>
                  <div className="sm:col-span-6 flex gap-2">
                    <button type="submit" className="border rounded px-2 py-1 text-xs bg-black text-white">Save</button>
                    <button type="button" onClick={() => setEditingMaintenanceId(null)} className="border rounded px-2 py-1 text-xs">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{m.category}</div>
                    <div className="text-gray-500">{m.date} · {m.description}</div>
                  </div>
                  <div className="text-right grid gap-1">
                    <div>€ {m.cost.toLocaleString()}</div>
                    <div className="flex gap-2 justify-end">
                      <button className={`text-xs px-2 py-1 border rounded ${m.paid ? "text-green-700" : "text-red-700"}`} onClick={() => togglePaid(m.id)}>
                        {m.paid ? "Paid" : "Mark paid"}
                      </button>
                      <button onClick={() => setEditingMaintenanceId(m.id)} className="text-xs px-2 py-1 border rounded">Edit</button>
                      <button onClick={() => setConfirm({ open: true, type: "maintenance", id: m.id, label: `${m.category} · ${m.date}` })} className="text-xs px-2 py-1 border rounded text-red-700">Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl font-medium">Calendar</h2>
        <ul className="grid gap-2">
          {property.calendar.map((e) => (
            <li key={e.id} className="border rounded-lg p-3 text-sm flex items-center justify-between">
              <div>
                <div className="font-medium">{e.title}</div>
                <div className="text-gray-500">{e.date}{e.notes ? ` · ${e.notes}` : ""}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Documents</h2>
          <button className="border rounded px-2 py-1 text-sm" onClick={() => setDocFormOpen((s) => !s)}>
            {docFormOpen ? "Close" : "Add"} document
          </button>
        </div>
        
        {docFormOpen && (
          <form action={submitDocument} className="grid gap-2 border rounded p-3 text-sm">
            <div className="grid sm:grid-cols-3 gap-2">
              <input name="name" placeholder="Document name" className="border rounded px-2 py-1" required />
              <select name="type" className="border rounded px-2 py-1" required>
                <option value="">Select type</option>
                <option value="ownership">Ownership Certificate</option>
                <option value="energy_cert">Energy Certificate</option>
                <option value="insurance">Insurance Policy</option>
                <option value="inspection">Inspection Report</option>
                <option value="contract">Contract</option>
                <option value="other">Other</option>
              </select>
              <input type="file" name="file" className="border rounded px-2 py-1" required />
            </div>
            <textarea name="description" placeholder="Description (optional)" className="border rounded px-2 py-1" rows={2} />
            <div>
              <button type="submit" className="border rounded px-3 py-1 bg-black text-white">Upload</button>
            </div>
          </form>
        )}

        <ul className="grid gap-2">
          {documents.map((doc) => (
            <li key={doc.id} className="border rounded-lg p-3 text-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                  📄
                </div>
                <div>
                  <div className="font-medium">{doc.name}</div>
                  <div className="text-gray-500">
                    {doc.type.replace('_', ' ')} · {formatFileSize(doc.fileSize)} · {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                  {doc.description && (
                    <div className="text-gray-400 text-xs">{doc.description}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={doc.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border rounded px-2 py-1 text-xs hover:bg-gray-50"
                >
                  View
                </a>
                <button
                  onClick={() => setConfirm({ open: true, type: "document", id: doc.id, label: doc.name })}
                  className="border rounded px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
          {documents.length === 0 && (
            <li className="text-sm text-gray-500 text-center py-4">No documents uploaded yet</li>
          )}
        </ul>
      </section>

      <ConfirmDialog
        open={confirm.open}
        title={
          confirm.type === "tenant" ? "Remove tenant & contract?" :
          confirm.type === "document" ? "Delete document?" :
          "Delete maintenance?"
        }
        description={confirm.label}
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => {
          if (confirm.type === "maintenance" && confirm.id) {
            deleteMaintenance(confirm.id);
          }
          if (confirm.type === "tenant") {
            removeTenant();
          }
          if (confirm.type === "document" && confirm.id) {
            deleteDocument(confirm.id);
          }
          setConfirm({ open: false });
        }}
      />
      <UndoBanner
        open={undo.open}
        message={
          <span>
            {undo.type === "tenant" ? "Tenant removed." :
             undo.type === "document" ? "Document deleted." :
             "Maintenance deleted."}
          </span>
        }
        onUndo={() => {
          if (!propertyId) return;
          if (undo.type === "tenant" && undo.payload) {
            setTenant(propertyId, undo.payload);
          }
          if (undo.type === "maintenance" && undo.payload) {
            addMaintenance(propertyId, undo.payload);
          }
          if (undo.type === "document" && undo.payload) {
            setDocuments(prev => [undo.payload, ...prev]);
          }
          setUndo({ open: false, type: undefined, payload: undefined });
        }}
        onClose={() => setUndo({ open: false, type: undefined, payload: undefined })}
      />
    </div>
  );
}


