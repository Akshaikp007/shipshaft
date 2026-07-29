import React, { useState, useEffect } from 'react';

export default function StatsBar() {
  const [globalNodes, setGlobalNodes] = useState(14294);
  const [parcelsInFlight, setParcelsInFlight] = useState(4281);

  // Simulate real-time stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setGlobalNodes(prev => prev + (Math.random() > 0.5 ? 1 : -1));
      setParcelsInFlight(prev => prev + (Math.random() > 0.55 ? 2 : -2));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-12 bg-white border-y border-outline-variant/10 overflow-hidden">
      <div className="max-w-container-max mx-auto px-edge-margin-mobile md:px-edge-margin-desktop">
        <div className="flex flex-nowrap items-center gap-16 overflow-x-auto scrollbar-hide py-4">
          
          {/* Stat 1 */}
          <div className="flex items-center gap-4 whitespace-nowrap min-w-fit text-left">
            <div className="w-3 h-3 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_rgba(0,96,86,0.5)]"></div>
            <div>
              <span className="text-on-surface-variant font-label-md mr-2">Global Nodes:</span>
              <span className="font-bold text-on-surface text-lg">
                {globalNodes.toLocaleString()}
              </span>
              <span className="text-tertiary text-sm ml-1 font-semibold">(+12%)</span>
            </div>
          </div>
          
          <div className="h-8 w-px bg-outline-variant/30 hidden md:block"></div>
          
          {/* Stat 2 */}
          <div className="flex items-center gap-4 whitespace-nowrap min-w-fit text-left">
            <span className="material-symbols-outlined text-primary">verified</span>
            <div>
              <span className="text-on-surface-variant font-label-md mr-2">Delivery Success:</span>
              <span className="font-bold text-on-surface text-lg">99.7%</span>
            </div>
          </div>
          
          <div className="h-8 w-px bg-outline-variant/30 hidden md:block"></div>
          
          {/* Stat 3 */}
          <div className="flex items-center gap-4 whitespace-nowrap min-w-fit text-left">
            <span className="material-symbols-outlined text-secondary">schedule</span>
            <div>
              <span className="text-on-surface-variant font-label-md mr-2">Avg. Transit:</span>
              <span className="font-bold text-on-surface text-lg">2.3 Days</span>
            </div>
          </div>
          
          <div className="h-8 w-px bg-outline-variant/30 hidden md:block"></div>
          
          {/* Stat 4 */}
          <div className="flex items-center gap-4 whitespace-nowrap min-w-fit text-left">
            <span className="material-symbols-outlined text-primary-container">rocket_launch</span>
            <div>
              <span className="text-on-surface-variant font-label-md mr-2">Parcels In-Flight:</span>
              <span className="font-bold text-on-surface text-lg">
                {parcelsInFlight.toLocaleString()}
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
