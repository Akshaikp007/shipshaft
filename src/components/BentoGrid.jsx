"use client";

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

const HOW_IT_WORKS = [
  {
    step: '1. Book',
    desc: 'Schedule your shipment in seconds via our portal.',
    icon: 'edit_calendar',
  },
  {
    step: '2. Pay',
    desc: 'Transparent pricing with instant digital invoicing.',
    icon: 'payments',
  },
  {
    step: '3. Track',
    desc: 'Real-time telemetry with meter-level precision.',
    icon: 'query_stats',
  },
  {
    step: '4. Secure',
    desc: 'Cryptographic handoffs for guaranteed delivery.',
    icon: 'verified',
  },
];

export default function BentoGrid() {
  const [chartHeights, setChartHeights] = useState([40, 65, 30, 85, 95, 75, 55, 90, 60, 100]);

  useEffect(() => {
    const interval = setInterval(() => {
      setChartHeights([
        Math.floor(Math.random() * 60) + 40,
        Math.floor(Math.random() * 50) + 50,
        Math.floor(Math.random() * 70) + 30,
        Math.floor(Math.random() * 40) + 60,
        Math.floor(Math.random() * 30) + 70,
        Math.floor(Math.random() * 50) + 40,
        Math.floor(Math.random() * 60) + 40,
        Math.floor(Math.random() * 40) + 60,
        Math.floor(Math.random() * 50) + 50,
        Math.floor(Math.random() * 30) + 70,
      ]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const logs = [
    { id: 1, title: 'CARGO VERIFIED', time: 'JUST NOW', msg: 'Hub Ingestion Scan Verified', icon: 'check_circle', color: 'text-tertiary' },
    { id: 2, title: 'TELEMETRY PING', time: '2S AGO', msg: 'GPS Coordinate Telemetry Active', icon: 'satellite_alt', color: 'text-primary' },
    { id: 3, title: 'DISPATCH UPDATE', time: '14S AGO', msg: 'Consignment Transit Route Verified', icon: 'local_shipping', color: 'text-secondary' },
  ];

  return (
    <section className="py-20 px-6 md:px-10 max-w-6xl mx-auto" id="solutions">
      {/* Stitch Section: How It Works Trust Grid */}
      <div className="mb-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 font-bold tracking-tight">
            How It Works
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            The architecture of trust for modern supply chains. Built for precision, designed for scale.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((item, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-2xl p-6 flex flex-col gap-3 group hover:bg-surface-container-low transition-all duration-300 border border-outline-variant/30 shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                <Icon name={item.icon} size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-title-lg text-title-lg text-on-surface mb-1 font-semibold">{item.step}</h3>
                <p className="font-label-md text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Capabilities Bento Grid */}
      <div className="text-center mb-12">
        <h2 className="font-headline-lg text-headline-lg mb-3 text-on-surface font-bold tracking-tight">
          Next-Gen Logistics Intelligence
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          A multi-layered architecture designed to provide total visibility and control over global supply chains.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Large Card: AI Route Optimization */}
        <div className="md:col-span-8 glass-panel rounded-3xl p-8 md:p-10 flex flex-col justify-between min-h-[460px] border border-outline-variant/30 relative overflow-hidden group shadow-lg">
          <div className="relative z-10">
            <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
              <Icon name="route" size={28} className="text-primary" />
            </div>
            <h3 className="font-headline-md text-headline-md mb-2 text-on-surface font-bold">
              AI Route Optimization
            </h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg leading-relaxed">
              Our proprietary Pathfinder engine processes satellite telemetry and marine weather in real time, optimizing fuel consumption and delivery accuracy.
            </p>
          </div>

          <div className="mt-8 bg-surface-container-lowest/60 border border-outline-variant/20 rounded-2xl p-5 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-md font-bold text-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                LIVE SIMULATION
              </span>
              <span className="text-label-sm text-outline font-medium">v4.2 Engine</span>
            </div>
            <div className="h-28 bg-surface-container-low rounded-xl flex items-end justify-between px-3 pb-3 gap-2">
              {chartHeights.map((h, i) => (
                <div
                  key={i}
                  className="w-full bg-primary/40 rounded-t-md transition-all duration-700 ease-in-out hover:bg-primary"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Small Card: Real-time Intelligence */}
        <div className="md:col-span-4 glass-panel rounded-3xl p-8 border border-outline-variant/30 flex flex-col justify-between min-h-[460px] shadow-lg">
          <div>
            <div className="bg-tertiary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
              <Icon name="monitoring" size={28} className="text-tertiary" />
            </div>
            <h3 className="font-headline-md text-headline-md mb-2 text-on-surface font-bold">
              Real-time Intelligence
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              Every consignment, every dispatch, every second. Full-stack telemetry for complete operational visibility.
            </p>
          </div>

          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-surface-container-lowest/70 rounded-xl border border-outline-variant/20 flex items-center gap-3 transition-all duration-300"
              >
                <Icon name={log.icon} size={20} className={log.color} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] text-outline font-bold uppercase">{log.title}</p>
                    <span className="text-[10px] text-outline font-mono">{log.time}</span>
                  </div>
                  <p className="text-label-md font-medium text-on-surface truncate">{log.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row: Enterprise Analytics */}
        <div className="md:col-span-4 glass-panel rounded-3xl p-8 border border-outline-variant/30 min-h-[360px] flex flex-col justify-between shadow-lg">
          <div>
            <div className="bg-secondary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
              <Icon name="bar_chart_4_bars" size={28} className="text-secondary" />
            </div>
            <h3 className="font-headline-md text-headline-md mb-2 text-on-surface font-bold">
              Enterprise Analytics
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Deep dive into fleet performance metrics with automated anomaly detection and stakeholder reporting.
            </p>
          </div>
          <div className="w-full h-2 bg-outline-variant/20 rounded-full overflow-hidden mt-6">
            <div className="w-3/4 h-full bg-secondary transition-all duration-1000 ease-out"></div>
          </div>
        </div>

        {/* Bottom Row: Smart Warehouse */}
        <div className="md:col-span-8 bg-on-surface text-surface rounded-3xl p-8 md:p-10 border border-on-surface/30 min-h-[360px] flex flex-col sm:flex-row items-center justify-between gap-8 overflow-hidden relative shadow-xl">
          <div className="relative z-10 max-w-sm">
            <div className="bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
              <Icon name="precision_manufacturing" size={28} className="text-white" />
            </div>
            <h3 className="font-headline-md text-headline-md mb-2 text-white font-bold">
              Smart Terminal Hubs
            </h3>
            <p className="font-body-md text-body-md text-outline-variant">
              Automated container sorting, crane scheduling, and predictive staging across 180+ global ports.
            </p>
          </div>

          <div className="relative z-10 w-full sm:w-1/2 h-44 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 rounded-2xl backdrop-blur-xl border border-white/10 flex items-center justify-center">
              <Icon name="grid_view" size={80} className="text-white/20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
