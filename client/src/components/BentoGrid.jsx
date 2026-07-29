import React, { useState, useEffect } from 'react';

const INITIAL_LOGS = [
  { id: 1, type: 'package', title: 'Shipment #2841', msg: 'Landed at LHR Hub', time: 'Just now' },
  { id: 2, type: 'distance', title: 'Route Calc', msg: 'Re-optimized: +4m', time: '2m ago' },
  { id: 3, type: 'monitoring', title: 'Vehicle v308', msg: 'Battery: 98% Normal', time: '5m ago' },
];

const LOG_MESSAGES = [
  { type: 'package', title: 'Shipment #5122', msg: 'Sorted at JFK Terminal', time: 'Just now' },
  { type: 'distance', title: 'Route Calc', msg: 'New optimal path found: -12m', time: 'Just now' },
  { type: 'monitoring', title: 'IoT Sensor #99', msg: 'Temp stable: 4.2°C', time: 'Just now' },
  { type: 'package', title: 'Shipment #1105', msg: 'Out for delivery: Paris', time: 'Just now' },
];

export default function BentoGrid() {
  // Live simulation heights
  const [chartHeights, setChartHeights] = useState([50, 75, 100, 66, 83]);
  // Live telemetry logs
  const [logs, setLogs] = useState(INITIAL_LOGS);

  // Animate route optimizer chart
  useEffect(() => {
    const interval = setInterval(() => {
      setChartHeights([
        Math.floor(Math.random() * 60) + 30,
        Math.floor(Math.random() * 50) + 40,
        Math.floor(Math.random() * 40) + 60,
        Math.floor(Math.random() * 50) + 30,
        Math.floor(Math.random() * 30) + 70,
      ]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Telemetry stream logs simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const randomLog = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
      const newLog = {
        id: Date.now(),
        ...randomLog
      };
      setLogs(prev => [newLog, ...prev.slice(0, 2)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-stack-xl px-edge-margin-mobile md:px-edge-margin-desktop max-w-container-max mx-auto text-left">
      <div className="mb-20">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">
          Enterprise Logistics Ecosystem
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          A multi-layered architecture designed to provide total visibility and control over global supply chains.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Large Card: AI Route Optimization */}
        <div className="md:col-span-8 glass-panel rounded-[40px] p-12 flex flex-col justify-between min-h-[500px] border border-outline-variant/30 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="bg-primary/10 w-16 h-16 rounded-[20px] flex items-center justify-center mb-10">
              <span className="material-symbols-outlined text-primary text-3xl">route</span>
            </div>
            <h3 className="font-headline-md text-headline-md mb-4 text-on-surface">AI Route Optimization</h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
              Our proprietary 'Pathfinder' AI processes millions of data points to find the most efficient route, reducing fuel costs and delivery times by up to 30%.
            </p>
          </div>
          
          <div className="mt-12 bg-white/40 border border-outline-variant/20 rounded-3xl p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-label-md font-bold text-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                LIVE SIMULATION
              </span>
              <span className="text-label-sm text-outline font-medium">v4.2 Engine</span>
            </div>
            <div className="h-32 bg-surface-container-low rounded-xl flex items-end justify-between px-4 pb-4 gap-2">
              {chartHeights.map((h, i) => (
                <div 
                  key={i} 
                  className="w-full bg-primary/40 rounded-t-lg transition-all duration-700 ease-in-out" 
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Small Card: Real-time Intelligence */}
        <div className="md:col-span-4 glass-panel rounded-[40px] p-10 border border-outline-variant/30 flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="bg-tertiary/10 w-16 h-16 rounded-[20px] flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-tertiary text-3xl">monitoring</span>
            </div>
            <h3 className="font-headline-md text-headline-md mb-4 text-on-surface">Real-time Intelligence</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-8">
              Every package, every vehicle, every second. Full-stack telemetry for total operational awareness.
            </p>
          </div>
          
          <div className="space-y-4">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="p-4 bg-white/60 rounded-2xl border border-outline-variant/20 flex items-center gap-4 animate-fade-in transition-all duration-300"
              >
                <span className={`material-symbols-outlined ${log.type === 'package' ? 'text-tertiary' : log.type === 'distance' ? 'text-primary' : 'text-secondary-container'}`}>
                  {log.type}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-[12px] text-outline font-bold uppercase">{log.title}</p>
                    <span className="text-[10px] text-outline">{log.time}</span>
                  </div>
                  <p className="text-label-md font-medium text-on-surface">{log.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row: Enterprise Analytics */}
        <div className="md:col-span-4 glass-panel rounded-[40px] p-10 border border-outline-variant/30 min-h-[400px] flex flex-col justify-between">
          <div>
            <div className="bg-secondary/10 w-16 h-16 rounded-[20px] flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-secondary text-3xl">bar_chart_4_bars</span>
            </div>
            <h3 className="font-headline-md text-headline-md mb-4 text-on-surface">Enterprise Analytics</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Deep-dive into performance metrics with custom reporting and automated stakeholder alerts.
            </p>
          </div>
          <div className="w-full h-2 bg-outline-variant/20 rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-secondary transition-all duration-1000 ease-out"></div>
          </div>
        </div>

        {/* Bottom Row: Smart Warehouse */}
        <div className="md:col-span-8 bg-on-surface text-surface rounded-[40px] p-12 border border-on-surface/30 min-h-[400px] flex items-center justify-between gap-10 overflow-hidden relative">
          <div className="relative z-10 max-w-sm">
            <div className="bg-white/10 w-16 h-16 rounded-[20px] flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-white text-3xl">precision_manufacturing</span>
            </div>
            <h3 className="font-headline-md text-headline-md mb-4 text-white">Smart Warehouse</h3>
            <p className="font-body-md text-body-md text-outline-variant">
              Automated inventory tracking and predictive stocking using IoT-enabled shelf systems.
            </p>
            <button className="mt-8 px-6 py-3 border border-white/20 rounded-xl text-label-md font-bold hover:bg-white/10 transition-colors btn-premium cursor-pointer text-white">
              Learn More
            </button>
          </div>
          
          <div className="hidden lg:block relative z-10 w-1/2 h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-3xl backdrop-blur-xl border border-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[120px] text-white/20">grid_view</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
