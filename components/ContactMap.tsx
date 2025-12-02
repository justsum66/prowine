"use client";

import { useState } from "react";
import { useLoadScript, GoogleMap, Marker } from "@react-google-maps/api";
import { Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/LoadingSpinner";
import { createButtonProps } from "@/lib/utils/button-props";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const companyLocation = {
  lat: 24.9833,
  lng: 121.5397, // 新北市新店區中興路二段192號9樓
};

const warehouseLocation = {
  lat: 25.0689,
  lng: 121.6397, // 新北市汐止區新台五路一段102號4樓
};

export default function ContactMap() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  if (loadError) {
    return (
      <div className="bg-neutral-100 rounded-lg p-8 text-center">
        <p className="text-neutral-600">無法載入地圖</p>
        <p className="text-sm text-neutral-500 mt-2">
          公司：新北市新店區中興路二段192號9樓
        </p>
        <p className="text-sm text-neutral-500">
          倉庫：新北市汐止區新台五路一段102號4樓
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-neutral-100 rounded-lg p-8 flex items-center justify-center h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden ${isFullscreen ? "hidden" : ""}`}>
        <div className="p-4 border-b border-neutral-200 bg-primary-50 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900">公司位置</h3>
          {/* 手機版全屏按鈕 */}
          <button
            {...createButtonProps(
              () => setIsFullscreen(true),
              {
                className: "md:hidden p-2 text-neutral-600 hover:text-primary-600 transition-colors",
                "aria-label": "全屏顯示地圖",
              }
            )}
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={12}
          center={companyLocation}
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
          <Marker position={companyLocation} label="公司" />
          <Marker position={warehouseLocation} label="倉庫" />
        </GoogleMap>
        <div className="p-4 bg-neutral-50 border-t border-neutral-200">
          <div className="text-sm text-neutral-600 space-y-1">
            <p>
              <span className="font-semibold">公司：</span>
              新北市新店區中興路二段192號9樓
            </p>
            <p>
              <span className="font-semibold">倉庫：</span>
              新北市汐止區新台五路一段102號4樓
            </p>
          </div>
        </div>
      </div>

      {/* 全屏地圖 - 手機版 */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-white"
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-neutral-200 bg-primary-50 flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900">公司位置</h3>
                <button
                  {...createButtonProps(
                    () => setIsFullscreen(false),
                    {
                      className: "p-2 text-neutral-600 hover:text-primary-600 transition-colors",
                      "aria-label": "關閉全屏",
                    }
                  )}
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 relative">
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  zoom={12}
                  center={companyLocation}
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
                  <Marker position={companyLocation} label="公司" />
                  <Marker position={warehouseLocation} label="倉庫" />
                </GoogleMap>
              </div>
              <div className="p-4 bg-neutral-50 border-t border-neutral-200">
                <div className="text-sm text-neutral-600 space-y-1">
                  <p>
                    <span className="font-semibold">公司：</span>
                    新北市新店區中興路二段192號9樓
                  </p>
                  <p>
                    <span className="font-semibold">倉庫：</span>
                    新北市汐止區新台五路一段102號4樓
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

