'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TrackingStatusCard from '@/components/tracking/TrackingStatusCard';
import TrackingMapCard from '@/components/tracking/TrackingMapCard';
import TrackingTimeline from '@/components/tracking/TrackingTimeline';
import Icon from '@/components/ui/Icon';

function TrackContent() {
  const searchParams = useSearchParams();
  const queryNumber = searchParams?.get('number');

  const [searchInput, setSearchInput] = useState(queryNumber || '');
  const [activeShipment, setActiveShipment] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchTracking = async (numberToSearch) => {
    const target = (numberToSearch || searchInput).trim().toUpperCase();
    if (!target) {
      setError('Please enter a valid tracking number.');
      setActiveShipment(null);
      return;
    }

    setIsLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const res = await fetch(`/api/track/${encodeURIComponent(target)}`);
      const data = await res.json();

      if (res.ok && data.success && data.shipment) {
        setActiveShipment(data.shipment);
        setError('');
      } else {
        setActiveShipment(null);
        setError(data.error || 'Shipment not found. Please verify the tracking number and try again.');
      }
    } catch (err) {
      console.error('Tracking lookup error:', err);
      setActiveShipment(null);
      setError('Network error searching for shipment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If query parameter provided on load, search automatically
  useEffect(() => {
    if (!queryNumber || !queryNumber.trim()) return;
    let ignore = false;
    const num = queryNumber.trim().toUpperCase();
    fetch(`/api/track/${encodeURIComponent(num)}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ignore) return;
        if (ok && data.success && data.shipment) {
          setActiveShipment(data.shipment);
          setError('');
        } else {
          setActiveShipment(null);
          setError(data.error || 'Shipment not found. Please verify the tracking number and try again.');
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Tracking lookup error:', err);
          setActiveShipment(null);
          setError('Network error searching for shipment. Please try again.');
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [queryNumber]);

  const onSubmit = (e) => {
    e.preventDefault();
    fetchTracking(searchInput);
  };

  return (
    <div className="pt-28 pb-20 px-6 md:px-10 max-w-6xl mx-auto w-full flex flex-col items-center">
      {/* Hero Search Section */}
      <div className="w-full max-w-3xl text-center mb-10">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-3 font-bold tracking-tight">
          Track Your Shipment
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-xl mx-auto">
          Enter your ShipShaft tracking number for live database transit milestones and status updates.
        </p>

        <form
          onSubmit={onSubmit}
          className="flex flex-col md:flex-row gap-2 justify-center w-full max-w-2xl mx-auto glass-panel p-2 rounded-xl shadow-lg relative z-10 border border-outline-variant/30"
        >
          <div className="relative flex-grow">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none flex items-center">
              <Icon name="search" size={20} className="text-outline" />
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter tracking number (e.g. SHP-ABCD1234)"
              className="w-full bg-surface-container-lowest/50 border border-outline-variant/40 rounded-lg py-3 pl-12 pr-4 font-body-md text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all backdrop-blur-sm placeholder:text-outline font-mono uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-premium bg-primary text-white font-title-lg text-title-lg px-8 py-3 rounded-lg shadow-md whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Querying...</span>
              </>
            ) : (
              'Track Consignment'
            )}
          </button>
        </form>

        {/* Error State Banner */}
        {error && (
          <div className="mt-4 glass-panel border border-error/30 bg-error-container/20 rounded-lg p-4 flex items-center justify-center gap-2 text-error animate-fade-in max-w-2xl mx-auto">
            <Icon name="error" size={20} className="text-error shrink-0" />
            <span className="font-label-md text-label-md font-medium">{error}</span>
          </div>
        )}
      </div>

      {/* Initial Guidance State */}
      {!hasSearched && !isLoading && !activeShipment && (
        <div className="w-full max-w-2xl text-center py-12 glass-panel border border-outline-variant/20 rounded-2xl bg-white/60 p-8 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Icon name="local_shipping" size={24} />
          </div>
          <h2 className="font-title-lg text-base font-bold text-on-surface mb-1">
            Authoritative Logistics Tracking
          </h2>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            All shipment tracking numbers are generated securely upon booking. Enter your consignment number to view verified status, origins, and transit events.
          </p>
        </div>
      )}

      {/* Tracking Results */}
      {activeShipment && (
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Left Column: Status Details & Map Card */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <TrackingStatusCard shipment={activeShipment} />
            <TrackingMapCard
              statusLabel={activeShipment.statusLabel}
              location={activeShipment.destination?.city}
            />
          </div>

          {/* Right Column: Timeline Journey */}
          <div className="lg:col-span-5">
            <TrackingTimeline steps={activeShipment.steps} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-24">
          <div className="flex flex-col items-center gap-3">
            <span className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></span>
            <p className="font-label-md text-label-md text-on-surface-variant">Loading tracking system...</p>
          </div>
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
