import React, { useState, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { MapPin, Navigation } from "lucide-react";
import socketService from "@/services/socketService";

const containerStyle = {
  width: "100%",
  height: "500px",
};

export default function LiveTrackingModal({
  isOpen,
  onClose,
  orderId,
  dropoffLocation,
}) {
  const [riderLocation, setRiderLocation] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    if (isOpen && orderId) {
      // Join order room
      socketService.emit("join_room", orderId.toString());

      const handleLocationUpdate = (data) => {
        const { latitude, longitude } = data;
        const newLoc = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
        setRiderLocation(newLoc);
        
        // Optionally pan map to new location
        // if (map) map.panTo(newLoc);
      };

      socketService.on("rider_location_update", handleLocationUpdate);

      return () => {
        socketService.off("rider_location_update", handleLocationUpdate);
        socketService.emit("leave_room", orderId.toString());
      };
    }
  }, [isOpen, orderId]);

  // Center map between rider and dropoff if both exist
  const getCenter = () => {
    if (riderLocation && dropoffLocation) {
      return {
        lat: (riderLocation.lat + dropoffLocation.lat) / 2,
        lng: (riderLocation.lng + dropoffLocation.lng) / 2,
      };
    }
    if (riderLocation) return riderLocation;
    if (dropoffLocation) return dropoffLocation;
    return { lat: 23.8103, lng: 90.4125 }; // Default to Dhaka
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="transition-all duration-300 ease-out"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="transition-all duration-200 ease-in"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
                  <Dialog.Title className="text-xl font-bold text-gray-900 flex items-center">
                    <Navigation className="w-6 h-6 mr-3 text-pink-500" />
                    Live Order Tracking
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>

                <div className="relative w-full h-[500px] bg-gray-100">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={containerStyle}
                      center={getCenter()}
                      zoom={14}
                      options={{
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                      }}
                    >
                      {/* Rider Location */}
                      {riderLocation && (
                        <Marker
                          position={riderLocation}
                          label={{
                            text: "🏍️",
                            fontSize: "24px",
                          }}
                          title="Rider"
                        />
                      )}

                      {/* Dropoff Location */}
                      {dropoffLocation && (
                        <Marker
                          position={dropoffLocation}
                          label={{
                            text: "🏠",
                            fontSize: "20px",
                          }}
                          title="Delivery Address"
                        />
                      )}
                    </GoogleMap>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Loading Map...
                    </div>
                  )}

                  {!riderLocation && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-medium text-gray-600 animate-pulse">
                      Waiting for Rider GPS...
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
