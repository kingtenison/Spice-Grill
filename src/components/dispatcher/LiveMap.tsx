"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface LiveMapProps {
  customerLocation: Location | null;
  dispatcherLocation: Location | null;
  onNavigate?: () => void;
}

export default function LiveMap({ customerLocation, dispatcherLocation, onNavigate }: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const dispatcherMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let L: any;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      
      try {
        L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        if (!isMounted) return;

        // Custom marker icons using vibrant CSS styles
        const customerIcon = L.divIcon({
          html: `<div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 bg-red-500 rounded-full opacity-35 animate-ping"></div>
            <div class="relative w-7 h-7 bg-red-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>`,
          className: 'custom-customer-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const dispatcherIcon = L.divIcon({
          html: `<div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 bg-blue-500 rounded-full opacity-35 animate-pulse"></div>
            <div class="relative w-7 h-7 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            </div>
          </div>`,
          className: 'custom-dispatcher-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const defaultLat = customerLocation?.lat || 46.8772; // default Moorhead MN
        const defaultLng = customerLocation?.lng || -96.7898;

        // Initialize Map
        if (!mapRef.current) {
          mapRef.current = L.map(mapContainerRef.current, {
            zoomControl: true,
            attributionControl: false
          }).setView([defaultLat, defaultLng], 14);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
          }).addTo(mapRef.current);
        }

        const map = mapRef.current;

        // Update / Add Customer Marker
        if (customerLocation) {
          const custLatLng = [customerLocation.lat, customerLocation.lng] as [number, number];
          if (customerMarkerRef.current) {
            customerMarkerRef.current.setLatLng(custLatLng);
          } else {
            customerMarkerRef.current = L.marker(custLatLng, { icon: customerIcon })
              .addTo(map)
              .bindPopup(`<b>Destination:</b><br/>${customerLocation.address}`);
          }
        }

        // Update / Add Dispatcher Marker
        if (dispatcherLocation) {
          const dispLatLng = [dispatcherLocation.lat, dispatcherLocation.lng] as [number, number];
          if (dispatcherMarkerRef.current) {
            dispatcherMarkerRef.current.setLatLng(dispLatLng);
          } else {
            dispatcherMarkerRef.current = L.marker(dispLatLng, { icon: dispatcherIcon })
              .addTo(map)
              .bindPopup('<b>Your Current Location</b>');
          }
        } else if (dispatcherMarkerRef.current) {
          map.removeLayer(dispatcherMarkerRef.current);
          dispatcherMarkerRef.current = null;
        }

        // Draw connecting polyline path
        if (customerLocation && dispatcherLocation) {
          const pathPoints = [
            [customerLocation.lat, customerLocation.lng],
            [dispatcherLocation.lat, dispatcherLocation.lng]
          ] as [number, number][];

          if (routeLineRef.current) {
            routeLineRef.current.setLatLngs(pathPoints);
          } else {
            routeLineRef.current = L.polyline(pathPoints, {
              color: '#3b82f6',
              weight: 3,
              dashArray: '5, 8',
              opacity: 0.8
            }).addTo(map);
          }

          // Fit both markers in view
          const bounds = L.latLngBounds(pathPoints);
          map.fitBounds(bounds, { padding: [40, 40] });
        } else if (customerLocation) {
          map.setView([customerLocation.lat, customerLocation.lng], 15);
        }
      } catch (err) {
        console.error("Error loading Leaflet:", err);
        setMapError(true);
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [customerLocation, dispatcherLocation]);

  // Clean up Leaflet map instance on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        customerMarkerRef.current = null;
        dispatcherMarkerRef.current = null;
        routeLineRef.current = null;
      }
    };
  }, []);

  const openInMaps = () => {
    if (customerLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${customerLocation.lat},${customerLocation.lng}`;
      window.open(url, '_blank');
    }
  };

  if (mapError) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 text-center">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">Map unavailable</p>
        <button
          onClick={openInMaps}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <Navigation className="w-4 h-4" />
          Open in Google Maps
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            Live Routing
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Real-time GPS tracking</p>
        </div>
        <button
          onClick={openInMaps}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm shadow-blue-500/10"
        >
          <Navigation className="w-4 h-4" />
          Navigate
        </button>
      </div>
      
      <div className="relative">
        <div ref={mapContainerRef} className="w-full h-[320px] bg-gray-50 z-0" />
      </div>

      {customerLocation && (
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm">Delivery Address</p>
              <p className="text-sm text-gray-600 truncate">{customerLocation.address}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
