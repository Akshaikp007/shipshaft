'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

export default function AgentLiveGpsTracker({ shipmentId, status }) {
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [accuracy, setAccuracy] = useState(null);
  const [coords, setCoords] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const watchIdRef = useRef(null);
  const lastSentTimeRef = useRef(0);
  const isDelivered = status === 'DELIVERED';
  const isOutForDelivery = status === 'OUT_FOR_DELIVERY';
  const isTrackingActive = isTracking && isOutForDelivery && !isDelivered;

  // Helper to send location update to backend API
  const sendLocationUpdate = useCallback(
    async (lat, lng, acc, recordedAt) => {
      if (!shipmentId || isDelivered) return;
      setIsSending(true);
      try {
        const res = await fetch(`/api/agent/deliveries/${shipmentId}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            accuracy: acc,
            recordedAt: recordedAt || new Date().toISOString(),
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to submit GPS update.');
        }

        setLastUpdated(new Date());
        setErrorMessage('');
      } catch (err) {
        console.error('[Agent GPS send error]:', err);
        setErrorMessage(
          err.message && err.message.includes('OUT_FOR_DELIVERY')
            ? err.message
            : 'Location update could not be sent. Retrying...'
        );
      } finally {
        setIsSending(false);
      }
    },
    [shipmentId, isDelivered]
  );

  // Stop watching device position
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Start watching device position
  const startTracking = useCallback(() => {
    setErrorMessage('');
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    try {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null;

          setCoords({ lat, lng });
          setAccuracy(acc);

          // Throttle: Send at most once every 10-15 seconds
          const now = Date.now();
          if (now - lastSentTimeRef.current >= 10000 || lastSentTimeRef.current === 0) {
            lastSentTimeRef.current = now;
            sendLocationUpdate(lat, lng, acc, new Date(pos.timestamp).toISOString());
          }
        },
        (err) => {
          console.warn('[Geolocation Watch Error]:', err);
          let msg = 'GPS temporarily unavailable.';
          if (err.code === 1) {
            msg = 'Location permission was denied. Enable location permission to start live tracking.';
            stopTracking();
          } else if (err.code === 2) {
            msg = 'Your device could not determine its current location.';
          } else if (err.code === 3) {
            msg = 'Location request timed out. Retrying...';
          }
          setErrorMessage(msg);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );

      watchIdRef.current = id;
      setIsTracking(true);
    } catch (err) {
      console.error('[Start GPS error]:', err);
      setErrorMessage('Failed to start GPS tracking: ' + err.message);
    }
  }, [sendLocationUpdate, stopTracking]);

  // Automatically halt tracking if delivery is finalized or status changes away from OUT_FOR_DELIVERY
  useEffect(() => {
    if (isDelivered || !isOutForDelivery) {
      if (watchIdRef.current !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
  }, [isDelivered, isOutForDelivery]);

  // Clean up watcher on component unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Timer interval to keep the "X seconds ago" indicator fresh
  useEffect(() => {
    if (!lastUpdated) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
      setSecondsAgo(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  if (!isOutForDelivery && !isDelivered) {
    return null;
  }

  return (
    <div className="glass-panel border border-primary/25 rounded-2xl p-6 bg-white/95 shadow-sm space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-outline-variant/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Icon name="near_me" size={20} />
          </div>
          <div>
            <h3 className="font-label-md text-sm font-bold text-on-surface uppercase tracking-wider">
              Live Delivery GPS Telemetry
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              Broadcast real-time position to recipient during active transit
            </p>
          </div>
        </div>

        {/* Live Tracking State Badge */}
        {isDelivered ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-tertiary/10 text-tertiary border border-tertiary/20">
            <Icon name="check_circle" size={14} />
            <span>Tracking Inactive (Delivered)</span>
          </span>
        ) : isTrackingActive ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>GPS Tracking Active</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-outline"></span>
            <span>GPS Tracking Paused</span>
          </span>
        )}
      </div>

      {/* Tracking Metrics & Actions */}
      {!isDelivered && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-body-md flex-1">
            <div>
              <span className="text-on-surface-variant block text-[11px]">Last Sync</span>
              <span className="font-bold text-on-surface">
                {lastUpdated ? `${secondsAgo}s ago` : 'No updates yet'}
              </span>
            </div>

            <div>
              <span className="text-on-surface-variant block text-[11px]">GPS Accuracy</span>
              <span className="font-bold text-on-surface">
                {accuracy !== null ? `±${accuracy} m` : 'Calculating...'}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-on-surface-variant block text-[11px]">Coordinates</span>
              <span className="font-mono text-[11px] text-on-surface truncate block">
                {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Waiting for fix'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isTrackingActive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={stopTracking}
                icon={<Icon name="pause_circle" size={18} />}
                className="text-error border-error/40 hover:bg-error/5"
              >
                Stop Tracking
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={startTracking}
                icon={<Icon name="play_arrow" size={18} />}
              >
                Start Live Tracking
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Error / Warning Alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs flex items-start gap-2">
          <Icon name="warning" size={16} className="shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Active Sync Indicator */}
      {isSending && (
        <p className="text-[11px] text-primary flex items-center gap-1.5 font-medium animate-pulse">
          <Icon name="sync" size={14} className="animate-spin" />
          <span>Transmitting telemetry to logistics network...</span>
        </p>
      )}
    </div>
  );
}
