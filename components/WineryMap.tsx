"use client";

import { useState } from "react";
import { useLoadScript, GoogleMap, Marker } from "@react-google-maps/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { MapPin, Navigation } from "lucide-react";

interface WineryMapProps {
  region?: string;
  country?: string;
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

// 產區座標映射（簡化版）
const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Napa Valley": { lat: 38.2975, lng: -122.2869 },
  "Bordeaux": { lat: 44.8378, lng: -0.5792 },
  "Burgundy": { lat: 47.0525, lng: 4.8378 },
  "Tuscany": { lat: 43.7714, lng: 11.2542 },
  "Rioja": { lat: 42.4656, lng: -2.4456 },
  "Barossa Valley": { lat: -34.5417, lng: 138.9619 },
};

const mapContainerStyle = {
  width: "100%",
  height: "500px",
};

const defaultCenter = {
  lat: 38.2975,
  lng: -122.2869,
};

export default function WineryMap({
  region,
  country,
  name,
  address,
  lat,
  lng,
}: WineryMapProps) {
  const [mapCenter, setMapCenter] = useState(
    lat && lng
      ? { lat, lng }
      : region && REGION_COORDINATES[region]
      ? REGION_COORDINATES[region]
      : defaultCenter
  );

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  if (loadError) {
    // 降級方案：顯示靜態地圖或搜尋連結
    const searchQuery = encodeURIComponent(
      `${name || ""} ${region || ""} ${country || ""}`.trim()
    );
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;

    return (
      <div className="bg-neutral-100 rounded-lg p-8 text-center">
        <MapPin className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">
          {name || "酒莊位置"}
        </h3>
        {region && (
          <p className="text-neutral-600 mb-4">
            {region}
            {country && `, ${country}`}
          </p>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Navigation className="w-5 h-5" />
          在 Google Maps 中查看
        </a>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-neutral-100 rounded-lg p-8 flex items-center justify-center h-[500px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden">
      <div className="p-6 border-b border-neutral-200">
        <h3 className="text-xl font-serif font-semibold text-neutral-900">
          {name || "酒莊位置"}
        </h3>
        <p className="text-neutral-600 mt-1">
          {region}
          {country && `, ${country}`}
        </p>
      </div>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={10}
        center={mapCenter}
        options={{
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        }}
      >
        <Marker position={mapCenter} />
      </GoogleMap>
    </div>
  );
}
