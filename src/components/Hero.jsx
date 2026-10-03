"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThreeNetwork from './ThreeNetwork';
import Icon from '@/components/ui/Icon';

export default function Hero() {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleTrack = (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    router.push(`/track?number=${encodeURIComponent(trackingNumber.trim().toUpperCase())}`);
  };

  return (
    <section className="relative px-6 md:px-10 pt-28 pb-16 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Content */}
        <div className="lg:col-span-6 z-10 text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-surface-container-high text-on-surface px-3 py-1 rounded-full w-fit mb-6 border border-primary/10 select-none">
            <span className="w-2 h-2 rounded-full bg-primary pulse-ring"></span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
              Intelligence Logistics Network
            </span>
          </div>

          <h1 className="font-display-hero-mobile md:font-display-hero text-display-hero-mobile md:text-display-hero text-on-surface mb-6 font-extrabold tracking-tight leading-none">
            Move smarter. <br />
            <span className="text-gradient">Deliver with confidence.</span>
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-8 leading-relaxed">
            Precision logistics intelligence for modern enterprise. Gain absolute visibility over your global network with real-time telemetry, secure verification, and uncompromised transparency.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="bg-primary text-on-primary px-8 py-3 rounded-xl font-label-md text-label-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 shadow-md shadow-primary/20 btn-premium font-semibold flex items-center gap-2 cursor-pointer"
            >
              <span>Book a Shipment</span>
              <Icon name="arrow_forward" size={18} />
            </Link>
            <Link
              href="/track"
              className="bg-surface text-on-surface border border-outline-variant px-8 py-3 rounded-xl font-label-md text-label-md hover:bg-surface-container-low active:scale-[0.98] transition-all duration-200 flex items-center gap-2 font-semibold cursor-pointer"
            >
              <Icon name="location_searching" size={18} className="text-primary" />
              <span>Track Shipment</span>
            </Link>
          </div>

          {/* Floating Tracking Hub Box */}
          <div className="mt-12 glass-panel p-6 rounded-2xl tracking-hub-float relative overflow-hidden group border border-outline-variant/30">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

            <div className="relative z-10">
              <h3 className="font-title-lg text-title-lg mb-4 flex items-center gap-2 text-on-surface font-semibold">
                <Icon name="track_changes" size={20} className="text-primary" />
                <span>Quick Tracking Hub</span>
              </h3>

              <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none flex items-center">
                    <Icon name="search" size={18} className="text-outline" />
                  </span>
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full bg-surface-container-lowest/70 border border-outline-variant/30 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-outline text-on-surface font-body-md text-sm"
                    placeholder="Enter tracking number (e.g. TRK-ABC123XYZ)"
                    type="text"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-3 rounded-xl font-semibold btn-premium flex items-center justify-center gap-2 cursor-pointer shadow-md whitespace-nowrap"
                >
                  <span>Track</span>
                  <Icon name="arrow_forward" size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right 3D Visualization */}
        <div className="lg:col-span-6 relative h-[450px] lg:h-[580px] w-full rounded-2xl overflow-hidden glass-panel border border-outline-variant/30 shadow-xl flex items-center justify-center bg-surface-container-lowest">
          <ThreeNetwork />

          {/* Floating Data Card matching Stitch */}
          <div className="absolute top-6 right-6 bg-surface/90 backdrop-blur-md border border-outline-variant/30 rounded-xl p-4 shadow-xl flex items-center gap-3 animate-bounce-subtle select-none">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
              <Icon name="flight_takeoff" size={20} className="text-white" />
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">Live Telemetry</p>
              <p className="font-title-lg text-title-lg text-on-surface font-bold">NYC → LON</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
