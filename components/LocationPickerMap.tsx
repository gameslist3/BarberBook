"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect } from 'react';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker 
        position={position} 
        draggable={true}
        eventHandlers={{
            dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                setPosition(position);
            }
        }}
    />
  );
}

export default function LocationPickerMap({ 
    initialLat, 
    initialLng, 
    onChange 
}: { 
    initialLat: number | null, 
    initialLng: number | null, 
    onChange: (lat: number, lng: number) => void 
}) {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLat && initialLng ? new L.LatLng(initialLat, initialLng) : null
  );

  const handlePositionChange = (pos: L.LatLng) => {
      setPosition(pos);
      onChange(pos.lat, pos.lng);
  };

  const defaultCenter: [number, number] = [40.7128, -74.0060]; // NYC fallback
  const center: [number, number] = position ? [position.lat, position.lng] : defaultCenter;

  return (
    <MapContainer 
        center={center} 
        zoom={position ? 15 : 12} 
        scrollWheelZoom={true}
        style={{ touchAction: 'none' }}
        className="h-full w-full rounded-xl z-0 relative shadow-sm border border-gray-200"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker position={position} setPosition={handlePositionChange} />
    </MapContainer>
  );
}
