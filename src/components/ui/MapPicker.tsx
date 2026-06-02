import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker as LeafletMarker, Circle as LeafletCircle, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface MapPickerProps {
  lat: number;
  lng: number;
  onPositionChange: (pos: { lat: number; lng: number }) => void;
  radiusKm?: number;
  height?: string;
  className?: string;
  zoom?: number;
}

// Custom branded icon
const customIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png", // Fallback to default but we could use brand logo
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapController = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

const LocationMarker = ({ position, setPosition }: { position: [number, number]; setPosition: (pos: { lat: number; lng: number }) => void }) => {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return (
    <LeafletMarker
      position={position}
      draggable={true}
      icon={customIcon}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition({ lat: pos.lat, lng: pos.lng });
        },
      }}
    />
  );
};

export const MapPicker: React.FC<MapPickerProps> = ({
  lat,
  lng,
  onPositionChange,
  radiusKm,
  height = "300px",
  className = "",
  zoom = 13,
}) => {
  return (
    <div className={`overflow-hidden rounded-xl border border-border relative z-0 ${className}`} style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController lat={lat} lng={lng} />
        <LocationMarker position={[lat, lng]} setPosition={onPositionChange} />
        {radiusKm !== undefined && (
          <LeafletCircle
            center={[lat, lng]}
            radius={radiusKm * 1000}
            pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.1, color: '#3b82f6', weight: 1 }}
          />
        )}
      </MapContainer>
    </div>
  );
};
