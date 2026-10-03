'use client';

import React, { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';

export default function CustomerLiveTrackingMap({ trackingNumber, initialStatus }) {
  const [location, setLocation] = useState(null);
  const [trackingActive, setTrackingActive] = useState(initialStatus === 'OUT_FOR_DELIVERY');
  const [locationFresh, setLocationFresh] = useState(false);
  const [shipmentStatus, setShipmentStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const isMountedRef = useRef(true);

  // Setup polling while shipment is OUT_FOR_DELIVERY
  useEffect(() => {
    let ignore = false;

    async function loadLocation() {
      if (!trackingNumber) return;
      try {
        const res = await fetch(`/api/shipments/${trackingNumber}/location`);
        if (!res.ok) return;

        const data = await res.json();
        if (ignore || !data.success) return;

        setTrackingActive(Boolean(data.trackingActive));
        setLocationFresh(Boolean(data.locationFresh));
        if (data.shipmentStatus) setShipmentStatus(data.shipmentStatus);

        if (data.location) {
          setLocation(data.location);
          const diff = Math.max(
            0,
            Math.floor((Date.now() - new Date(data.location.recordedAt).getTime()) / 1000)
          );
          setSecondsAgo(diff);
        } else {
          setLocation(null);
        }
      } catch (err) {
        console.error('[Customer fetch location error]:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadLocation();

    // Poll every 12 seconds if OUT_FOR_DELIVERY and not DELIVERED
    const interval = setInterval(() => {
      if (shipmentStatus === 'DELIVERED') {
        clearInterval(interval);
        return;
      }
      loadLocation();
    }, 12000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [trackingNumber, shipmentStatus]);

  // Keep the "X seconds ago" elapsed counter updated every second
  useEffect(() => {
    if (!location?.recordedAt) return;

    const timer = setInterval(() => {
      const diff = Math.max(
        0,
        Math.floor((Date.now() - new Date(location.recordedAt).getTime()) / 1000)
      );
      setSecondsAgo(diff);
    }, 1000);

    return () => clearInterval(timer);
  }, [location]);

  // Initialize or update Leaflet map when location is present
  useEffect(() => {
    if (!location || typeof window === 'undefined' || !mapContainerRef.current) return;

    let isSubscribed = true;

    // Dynamically import Leaflet to support Next.js SSR
    import('leaflet').then((L) => {
      if (!isSubscribed || !mapContainerRef.current) return;

      const { latitude, longitude, accuracy } = location;

      // Custom delivery courier marker icon with pulse wave
      const courierIcon = L.divIcon({
        className: 'shipshaft-courier-marker',
        html: `
          <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background-color: rgba(0, 74, 198, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background: #004ac6; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (!mapInstanceRef.current) {
        // Initialize Map
        const map = L.map(mapContainerRef.current, {
          center: [latitude, longitude],
          zoom: 15,
          zoomControl: true,
          attributionControl: false,
        });

        // OpenStreetMap Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        // Marker
        const marker = L.marker([latitude, longitude], { icon: courierIcon }).addTo(map);
        markerRef.current = marker;

        // Accuracy Circle
        if (accuracy && accuracy > 0) {
          const circle = L.circle([latitude, longitude], {
            radius: accuracy,
            color: '#004ac6',
            fillColor: '#004ac6',
            fillOpacity: 0.12,
            weight: 1.5,
          }).addTo(map);
          circleRef.current = circle;
        }

        mapInstanceRef.current = map;
      } else {
        // Update existing marker and accuracy circle
        const map = mapInstanceRef.current;
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        }
        if (circleRef.current) {
          circleRef.current.setLatLng([latitude, longitude]);
          if (accuracy) circleRef.current.setRadius(accuracy);
        }
        map.panTo([latitude, longitude], { animate: true, duration: 1 });
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [location]);

  // Clean up Leaflet on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (shipmentStatus !== 'OUT_FOR_DELIVERY') {
    return null;
  }

  return (
    <div className="glass-panel border border-primary/30 rounded-2xl overflow-hidden shadow-lg bg-white/95 flex flex-col transition-all">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-primary/10 via-surface-container-low to-primary/5 border-b border-outline-variant/20 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-sm">
            <Icon name="radar" size={20} />
          </div>
          <div>
            <h3 className="font-label-md text-xs sm:text-sm font-bold text-on-surface uppercase tracking-wider">
              Live Delivery Tracking
            </h3>
            <p className="text-[11px] text-on-surface-variant font-medium">
              Real-time delivery agent location
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        {location ? (
          locationFresh && trackingActive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>● Live</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Icon name="history" size={14} />
              <span>Location update unavailable</span>
            </span>
          )
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-outline animate-pulse"></span>
            <span>Awaiting Signal</span>
          </span>
        )}
      </div>

      {/* Map Container / Waiting State */}
      <div className="relative w-full h-64 sm:h-72 bg-surface-container-lowest">
        {location ? (
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-surface-container-lowest to-surface-container/30">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 animate-pulse">
              <Icon name="location_searching" size={28} />
            </div>
            <h4 className="font-title-md text-sm font-bold text-on-surface">
              Waiting for the delivery agent&apos;s location...
            </h4>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
              Live coordinates will appear here once the assigned delivery agent initiates live transit.
            </p>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && !location && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Icon name="sync" size={16} className="animate-spin" />
              <span>Connecting to telemetry...</span>
            </div>
          </div>
        )}
      </div>

      {/* Telemetry Footer Info */}
      {location && (
        <div className="px-5 py-3 bg-surface-container-lowest border-t border-outline-variant/15 flex items-center justify-between text-xs text-on-surface-variant flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Icon name="schedule" size={14} className="text-outline" />
            <span>
              Last updated:{' '}
              <strong className="text-on-surface font-semibold">
                {secondsAgo < 5 ? 'Just now' : `${secondsAgo} seconds ago`}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Icon name="my_location" size={14} className="text-outline" />
            <span>
              Accuracy:{' '}
              <strong className="text-on-surface font-semibold">
                {location.accuracy ? `±${Math.round(location.accuracy)} meters` : 'Standard'}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
