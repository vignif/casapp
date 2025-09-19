"use client";
import { Property } from "../lib/types";
import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { FaHome, FaHouseUser, FaHouseDamage } from "react-icons/fa";
import L from "leaflet";
import ReactDOMServer from "react-dom/server";

// Dynamic import to avoid SSR issues with react-leaflet
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

type Props = {
  properties: Property[];
};

// Preloaded coordinates for Italian cities
const cityCoordinates: Record<string, [number, number]> = {
  Rome: [41.9028, 12.4964],
  Milan: [45.4642, 9.19],
  Naples: [40.8518, 14.2681],
  Turin: [45.0703, 7.6869],
  Florence: [43.7696, 11.2558],
  Bologna: [44.4949, 11.3426],
  Genoa: [44.4056, 8.9463],
  Venice: [45.4408, 12.3155],
  Verona: [45.4384, 10.9916],
  Bari: [41.1177, 16.8719],
};

// Fallback hash-based generator
const generateFallbackCoords = (city: string): [number, number] => {
  const hash = city.split("").reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return [
    42.0 + (Math.abs(hash) % 100) / 1000,
    12.0 + (Math.abs(hash >> 8) % 100) / 100,
  ];
};

// Fetch coords from Nominatim API
const fetchCoordinates = async (property: Property): Promise<[number, number] | null> => {
  try {
    const cacheKey = `coords-${property.city}-${property.address}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    const query = `${property.address}, ${property.city}, Italy`;

    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
      headers: { "User-Agent": "real-estate-app/1.0", "Accept-Language": "en-US,en;q=0.9" }
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      localStorage.setItem(cacheKey, JSON.stringify(coords));
      return coords;
    }

    // Fallback to city
    const cityRes = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(property.city)}&country=Italy&format=json&limit=1`, {
      headers: { "User-Agent": "real-estate-app/1.0", "Accept-Language": "en-US,en;q=0.9" }
    });

    const cityData = await cityRes.json();
    if (cityData.length > 0) {
      const coords: [number, number] = [parseFloat(cityData[0].lat), parseFloat(cityData[0].lon)];
      localStorage.setItem(cacheKey, JSON.stringify(coords));
      return coords;
    }

  } catch (err) {
    console.error("Error fetching coordinates for", property.city, err);
  }

  return null;
};

// Create custom divIcon
const createCustomIcon = (icon: React.ReactElement, color: string) => {
  const iconHtml = ReactDOMServer.renderToStaticMarkup(icon);
  return L.divIcon({
    className: "custom-icon",
    html: `<div style="color: ${color}; font-size: 24px;">${iconHtml}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export default function PropertyMap({ properties }: Props) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [coordinates, setCoordinates] = useState<Record<string, [number, number]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [icons, setIcons] = useState<Record<string, any>>({});

  // Initialize icons
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIcons({
        occupied: createCustomIcon(<FaHouseUser />, "#22c55e"),
        vacant: createCustomIcon(<FaHouseDamage />, "#ef4444"),
        default: createCustomIcon(<FaHome />, "#3b82f6"),
      });
    }
  }, []);

  // Load coordinates for all properties
  useEffect(() => {
    const loadCoords = async () => {
      setIsLoading(true);
      const coordsMap: Record<string, [number, number]> = {};

      Object.assign(coordsMap, cityCoordinates);

      for (const prop of properties) {
        const cacheKey = `${prop.city}-${prop.address}`;
        if (!coordsMap[cacheKey]) {
          const coords = await fetchCoordinates(prop);
          coordsMap[cacheKey] = coords ?? generateFallbackCoords(prop.city);
        }
      }

      setCoordinates(coordsMap);
      setIsLoading(false);
    };

    loadCoords();
  }, [properties]);

  const getPropertyCoordinates = (property: Property): [number, number] => {
    const cacheKey = `${property.city}-${property.address}`;
    return coordinates[cacheKey] || cityCoordinates[property.city] || generateFallbackCoords(property.city);
  };

  const getPropertyIcon = (property: Property) => {
    if (!icons) return null;
    return property.tenant ? icons.occupied || icons.default : icons.vacant || icons.default;
  };

  const handlePropertyClick = useCallback((property: Property) => {
    setSelectedProperty(property);
  }, []);

  // Map center
  const center: [number, number] = properties.length > 0 && !isLoading
    ? (properties.reduce<[number, number]>((acc, prop) => {
        const coords = getPropertyCoordinates(prop);
        return [acc[0] + coords[0], acc[1] + coords[1]];
      }, [0, 0]).map(sum => sum / properties.length) as [number, number])
    : [41.9028, 12.4964];

  if (isLoading) {
    return (
      <div className="w-full h-64 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 border rounded-lg overflow-hidden bg-gray-50 relative">
      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4 shadow-lg">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{selectedProperty.name}</h3>
              <button onClick={() => setSelectedProperty(null)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="space-y-2 text-sm">
              <div><strong>Location:</strong> {selectedProperty.address}, {selectedProperty.city}</div>
              <div><strong>Type:</strong> {selectedProperty.propertyType}</div>
              <div><strong>Size:</strong> {selectedProperty.sizeSqm} m²</div>
              {selectedProperty.value && <div><strong>Value:</strong> €{selectedProperty.value.toLocaleString()}</div>}
              {selectedProperty.tenant ? (
                <div className="mt-3 p-2 bg-green-50 rounded">
                  <div><strong>Tenant:</strong> {selectedProperty.tenant.tenantName}</div>
                  <div><strong>Rent:</strong> €{selectedProperty.tenant.monthlyRent.toLocaleString()}/month</div>
                  <div><strong>Contract:</strong> {selectedProperty.tenant.startDate} → {selectedProperty.tenant.endDate || "Open"}</div>
                </div>
              ) : (
                <div className="mt-3 p-2 bg-red-50 rounded text-red-700"><strong>Vacant</strong></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-white border rounded p-2 text-xs shadow-sm">
        <div className="font-semibold mb-1">Legend</div>
        <div className="flex items-center gap-2 mb-1">
          <FaHouseUser className="text-green-500" /> <span>Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <FaHouseDamage className="text-red-500" /> <span>Vacant</span>
        </div>
      </div>

      <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }} className="z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {properties.map((property) => {
          const coords = getPropertyCoordinates(property);
          const icon = getPropertyIcon(property);
          const hasTenant = !!property.tenant;
          const performance = property.value ? ((property.tenant?.monthlyRent ?? 0) * 12 / property.value) * 100 : 0;

          return (
            <Marker key={property.id} position={coords} icon={icon}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm mb-2">{property.name}</h3>
                  <div className="text-xs space-y-1">
                    <div><strong>Location:</strong> {property.city}</div>
                    <div><strong>Type:</strong> {property.propertyType}</div>
                    <div><strong>Size:</strong> {property.sizeSqm} m²</div>
                    {property.value && <div><strong>Value:</strong> €{property.value.toLocaleString()}</div>}
                    {hasTenant ? (
                      <div className="mt-2 p-1 bg-green-50 rounded text-xs">
                        <div><strong>Tenant:</strong> {property.tenant?.tenantName}</div>
                        <div><strong>Rent:</strong> €{property.tenant?.monthlyRent?.toLocaleString()}/month</div>
                        {performance > 0 && <div><strong>Yield:</strong> {performance.toFixed(1)}%</div>}
                      </div>
                    ) : (
                      <div className="mt-2 p-1 bg-red-50 rounded text-xs text-red-700"><strong>Vacant</strong></div>
                    )}
                  </div>
                  <button onClick={() => handlePropertyClick(property)} className="mt-2 w-full text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">View Details</button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <style jsx global>{`
        .custom-icon {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
}
