"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { MapPin } from 'lucide-react';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icon using purple/violet colors
const shopIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:36px;height:36px;background:#7C3AED;border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(124,58,237,0.4);border:2px solid white;transform:rotate(0);">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

const selectedShopIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:44px;height:44px;background:#7C3AED;border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(124,58,237,0.5);border:3px solid white;transform:rotate(0);">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="#7C3AED" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -24],
});

function MapController({ selectedShopId, shops }: { selectedShopId: string | null; shops: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedShopId || shops.length === 0) return;
    const shop = shops.find(s => s.id === selectedShopId);
    if (!shop) return;

    // Try to parse coordinates from googleMapLink
    const coordMatch = shop.googleMapLink?.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      map.flyTo([lat, lng], 16, { duration: 1 });
    }
  }, [selectedShopId, shops, map]);

  return null;
}

interface ExploreMapProps {
  shops: any[];
  selectedShopId: string | null;
  defaultQuery?: string;
}

export default function ExploreMap({ shops, selectedShopId, defaultQuery = "barber shops near me" }: ExploreMapProps) {
  // Default center - use first shop's location if available, otherwise NYC
  let defaultCenter: [number, number] = [40.7128, -74.0060];
  let defaultZoom = 12;

  // Try to get center from selected shop or first shop
  const targetShop = selectedShopId ? shops.find(s => s.id === selectedShopId) : shops[0];
  if (targetShop?.googleMapLink) {
    const coordMatch = targetShop.googleMapLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      defaultCenter = [parseFloat(coordMatch[1]), parseFloat(coordMatch[2])];
      defaultZoom = selectedShopId ? 16 : 13;
    }
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      scrollWheelZoom={true}
      className="h-full w-full z-0 relative"
      doubleClickZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController selectedShopId={selectedShopId} shops={shops} />

      {/* Shop Markers */}
      {shops.map((shop) => {
        const coordMatch = shop.googleMapLink?.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (!coordMatch) return null;

        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        const isSelected = shop.id === selectedShopId;

        return (
          <Marker
            key={shop.id}
            position={[lat, lng]}
            icon={isSelected ? selectedShopIcon : shopIcon}
          >
            <Popup>
              <div className="text-center min-w-[140px]">
                <p className="font-bold text-gray-900 dark:text-white text-sm"><span className="notranslate">{shop.shopName}</span></p>
                {shop.address && (
                  <p className="text-xs text-gray-500 mt-0.5">{shop.address}</p>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-violet-600 hover:text-violet-800"
                >
                  <MapPin size={12} />
                  Get Directions
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
