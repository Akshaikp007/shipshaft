import React, { useState } from 'react';

const PIPELINE_STEPS = [
  { id: 1, label: 'Booked', time: 'T+0h', icon: 'edit_calendar' },
  { id: 2, label: 'Scheduled', time: 'T+2h', icon: 'schedule' },
  { id: 3, label: 'Origin Hub', time: 'T+6h', icon: 'warehouse' },
  { id: 4, label: 'In Transit', time: 'ACTIVE', icon: 'local_shipping' },
  { id: 5, label: 'Dest. Hub', time: 'Est. 24h', icon: 'apartment' },
  { id: 6, label: 'Out for Delivery', time: 'Est. 36h', icon: 'moped' },
  { id: 7, label: 'Delivered', time: 'Est. 42h', icon: 'verified' },
];

export default function Pipeline() {
  const [activeIndex, setActiveIndex] = useState(3); // Start with 'In Transit' active (index 3)

  const progressPercentage = (activeIndex / (PIPELINE_STEPS.length - 1)) * 100;

  return (
    <section className="py-stack-xl px-edge-margin-mobile md:px-edge-margin-desktop max-w-container-max mx-auto overflow-hidden">
      <div className="text-center mb-24">
        <h2 className="font-headline-lg text-headline-lg mb-6 text-on-surface">The Logistics Pipeline</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          A seamless end-to-end journey powered by precision data. Click on any step to preview progress.
        </p>
      </div>

      <div className="relative py-20 px-10">
        {/* SVG Pipeline Line */}
        <svg className="absolute top-1/2 left-0 w-full h-2 -translate-y-1/2" style={{ zIndex: 0 }}>
          <line
            stroke="#E2E8F0"
            strokeLinecap="round"
            strokeWidth="4"
            x1="0"
            x2="100%"
            y1="4"
            y2="4"
          />
          <line
            className="pipeline-flow transition-all duration-700 ease-in-out"
            stroke="#004ac6"
            strokeLinecap="round"
            strokeWidth="4"
            x1="0"
            x2={`${progressPercentage}%`}
            y1="4"
            y2="4"
          />
        </svg>

        <div className="flex flex-col md:flex-row justify-between items-center relative z-10 gap-16 md:gap-4">
          {PIPELINE_STEPS.map((step, idx) => {
            const isActive = idx === activeIndex;
            const isCompleted = idx < activeIndex;

            return (
              <div
                key={step.id}
                onClick={() => setActiveIndex(idx)}
                className={`flex flex-col items-center group cursor-pointer transition-all duration-300 ${
                  isActive ? 'scale-125' : isCompleted ? 'opacity-90' : 'opacity-50'
                }`}
              >
                {isActive ? (
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,74,198,0.4)] relative">
                    <span className="material-symbols-outlined text-white">{step.icon}</span>
                    <div className="absolute inset-0 rounded-full animate-ping bg-primary/20"></div>
                  </div>
                ) : (
                  <div className={`w-16 h-16 rounded-full bg-white border-2 flex items-center justify-center mb-6 transition-all shadow-lg ${
                    isCompleted 
                      ? 'border-primary text-primary group-hover:border-primary-container' 
                      : 'border-outline-variant text-outline group-hover:border-primary'
                  }`}>
                    <span className={`material-symbols-outlined ${isCompleted ? 'text-primary' : 'text-outline group-hover:text-primary'}`}>
                      {step.icon}
                    </span>
                  </div>
                )}
                
                <p className={`font-bold mb-1 ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                  {step.label}
                </p>
                <p className={`text-[11px] font-bold tracking-widest ${isActive ? 'text-primary' : 'text-outline uppercase'}`}>
                  {step.time}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
