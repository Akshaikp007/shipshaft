import React, { useState } from 'react';
import ThreeNetwork from './ThreeNetwork';

export default function Hero() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  const handleTrack = (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setIsSearching(true);
    setSearchResult(null);

    // Simulate API search
    setTimeout(() => {
      setIsSearching(false);
      if (trackingNumber.toUpperCase().startsWith('SS')) {
        setSearchResult({
          status: 'In Transit',
          location: 'En route to London (LHR Hub)',
          eta: 'August 1st, 2026',
          success: true,
        });
      } else {
        setSearchResult({
          status: 'Not Found',
          location: 'Unknown tracking number',
          success: false,
        });
      }
    }, 1500);
  };

  const handleTagClick = (tag) => {
    setTrackingNumber(tag);
    setSearchResult(null);
  };

  return (
    <section className="relative px-edge-margin-mobile md:px-edge-margin-desktop pt-20 pb-stack-xl max-w-container-max mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* Left Content */}
        <div className="lg:col-span-6 z-10 text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 text-primary rounded-full mb-8 border border-primary/10 select-none">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span className="font-label-md text-label-md tracking-wider uppercase">
              Logistics Intelligence v2.4
            </span>
          </div>
          
          <h1 className="font-display-hero text-display-hero-mobile md:text-display-hero mb-8 text-on-surface leading-none">
            Deliver <span className="text-gradient">Smarter.</span>
            <br />
            Orchestrate Faster.
          </h1>
          
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-12 max-w-xl leading-relaxed">
            The world's most advanced logistics intelligence platform. Real-time telemetry, AI-driven routing, and enterprise-grade shipment management in one unified interface.
          </p>
          
          <div className="flex flex-wrap gap-5">
            <button className="bg-primary text-white px-10 py-5 rounded-[16px] font-bold flex items-center gap-2 shadow-2xl shadow-primary/30 hover:bg-primary-container transition-all btn-premium cursor-pointer">
              Book Shipment
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <button className="bg-white border border-outline-variant text-on-surface px-10 py-5 rounded-[16px] font-bold hover:bg-surface-container-low transition-all btn-premium cursor-pointer">
              View Demo
            </button>
          </div>

          {/* Floating Tracking Hub */}
          <div className="mt-20 glass-panel p-8 rounded-[32px] tracking-hub-float relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10">
              <h3 className="font-title-lg text-title-lg mb-6 flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-primary">track_changes</span>
                Tracking Hub
              </h3>
              
              <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    value={trackingNumber}
                    onChange={(e) => {
                      setTrackingNumber(e.target.value);
                      if (searchResult) setSearchResult(null);
                    }}
                    className="w-full bg-white/50 border border-outline-variant/30 rounded-xl px-5 py-4 focus:ring-primary focus:border-primary placeholder:text-outline text-on-surface font-body-md"
                    placeholder="Enter tracking number (e.g., SS202600241)"
                    type="text"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-primary text-white px-8 py-4 rounded-xl font-bold relative overflow-hidden group/btn btn-premium flex items-center justify-center gap-2 min-w-[160px] cursor-pointer disabled:opacity-75"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isSearching ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Tracking...
                      </>
                    ) : (
                      'Track Package'
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
                </button>
              </form>

              {/* Simulated Search Results */}
              {searchResult && (
                <div className={`mt-6 p-4 rounded-xl border ${searchResult.success ? 'bg-tertiary/10 border-tertiary/20 text-on-tertiary-fixed' : 'bg-error/10 border-error/20 text-on-error-container'} animate-fade-in`}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">
                      {searchResult.success ? 'check_circle' : 'error'}
                    </span>
                    <div>
                      <p className="font-semibold">{searchResult.status}</p>
                      <p className="text-sm opacity-90">{searchResult.location}</p>
                      {searchResult.eta && (
                        <p className="text-xs mt-1 opacity-75">Estimated Arrival: {searchResult.eta}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-label-md text-outline font-label-md">Recently Tracked:</span>
                <span
                  onClick={() => handleTagClick('SS202600241')}
                  className="px-3 py-1 bg-surface-container-high rounded-full text-label-sm text-primary font-semibold cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  SS202600241
                </span>
                <span
                  onClick={() => handleTagClick('NY-88219')}
                  className="px-3 py-1 bg-surface-container-high rounded-full text-label-sm text-primary font-semibold cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  NY-88219
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content: 3D Visualization */}
        <div className="lg:col-span-6 relative h-[600px] rounded-[40px] overflow-hidden bg-white/30 border border-white/50">
          <ThreeNetwork />
        </div>
      </div>
    </section>
  );
}
