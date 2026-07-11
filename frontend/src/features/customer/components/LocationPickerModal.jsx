import React, { useCallback, useState, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Dialog, Transition } from "@headlessui/react";
import { Button } from "@/features/restaurant/components/ui/button";
import { Crosshair, MapPin, Loader2 } from "lucide-react";
import { Fragment } from "react";

const containerStyle = {
  width: "100%",
  height: "400px",  
};

const defaultCenter = {
  lat: 23.8103,
  lng: 90.4125,
};

function LocationPickerModal({ isOpen, onClose, onSelect, initialLocation }) {
  const [selected, setSelected] = useState(initialLocation || defaultCenter);
  const [map, setMap] = useState(null);
  const [loadingCurrent, setLoadingCurrent] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const handleClick = useCallback((e) => {
    setSelected({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }, []);

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingCurrent(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSelected(coords);
        if (map) map.panTo(coords);
        setLoadingCurrent(false);
      },
      () => {
        alert("Unable to retrieve your location.");
        setLoadingCurrent(false);
      }
    );
  };

  useEffect(() => {
    if (initialLocation) setSelected(initialLocation);
  }, [initialLocation]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

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
              <Dialog.Panel className="w-full max-w-3xl rounded-xl bg-white shadow-xl overflow-hidden border border-gray-200">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-100">
                  <Dialog.Title className="text-lg font-semibold text-gray-800">
                    <MapPin className="inline-block w-5 h-5 mr-2 text-blue-600" />
                    Select Restaurant Location
                  </Dialog.Title>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUseCurrentLocation}
                    className="flex items-center gap-2 bg-white border hover:bg-blue-50 text-blue-600"
                  >
                    {loadingCurrent ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Crosshair className="h-4 w-4" />
                    )}
                    Use My Location
                  </Button>
                </div>

                {/* Map */}
                <div className="p-4">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={containerStyle}
                      center={selected}
                      zoom={14}
                      onClick={handleClick}
                      onLoad={(mapInstance) => setMap(mapInstance)}
                      options={{
                        streetViewControl: false,
                        fullscreenControl: false,
                        mapTypeControl: false,
                      }}
                    >
                      <Marker position={selected} />
                    </GoogleMap>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      Loading map...
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-100">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleConfirm}
                  >
                    Confirm Location
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default React.memo(LocationPickerModal);
