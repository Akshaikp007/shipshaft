"use client";

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';

const NODES = [
  { id: 1, label: 'Booked', icon: 'inventory_2' },
  { id: 2, label: 'Dispatched', icon: 'local_shipping' },
  { id: 3, label: 'In Transit', icon: 'location_on' },
  { id: 4, label: 'Final Delivery', icon: 'home' },
];

export default function Pipeline() {
  const [activeStep, setActiveStep] = useState(2); // 0-indexed, default is In Transit (index 2)

  const progressWidth = `${(activeStep / (NODES.length - 1)) * 100}%`;

  return (
    <section className="py-20 px-6 md:px-10 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
        {/* Left Column: Description */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4 text-left">
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
            The Journey,<br />Demystified.
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-lg leading-relaxed">
            Our high-fidelity tracking interface provides granular detail at every node. From dispatch to delivery, experience total operational clarity.
          </p>

          <ul className="flex flex-col gap-3 mt-2">
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
                <Icon name="check" size={14} className="text-tertiary" />
              </span>
              <span className="font-body-md text-body-md text-on-surface font-medium">Granular Timestamping</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
                <Icon name="check" size={14} className="text-tertiary" />
              </span>
              <span className="font-body-md text-body-md text-on-surface font-medium">Predictive ETA Modeling</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
                <Icon name="check" size={14} className="text-tertiary" />
              </span>
              <span className="font-body-md text-body-md text-on-surface font-medium">Cryptographic Chain of Custody</span>
            </li>
          </ul>
        </div>

        {/* Right Column: Tracking Preview Card matching Stitch */}
        <div className="w-full lg:w-1/2">
          <div className="glass-panel rounded-2xl p-8 shadow-xl border border-outline-variant/30">
            <div className="flex justify-between items-start border-b border-outline-variant/30 pb-4 mb-6">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  Tracking ID
                </p>
                <p className="font-title-lg text-title-lg text-on-surface font-mono font-bold">
                  SHFT-9928-XQ-04
                </p>
              </div>
              <div className="bg-surface-container-high px-3 py-1 rounded-full border border-primary/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary inline-block pulse-ring"></span>
                <span className="font-label-sm text-label-sm text-primary font-semibold">
                  {NODES[activeStep].label}
                </span>
              </div>
            </div>

            {/* Interactive Pipeline Bar */}
            <div className="relative py-6">
              {/* Background Connecting Line */}
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-outline-variant/30 -translate-y-1/2 z-0"></div>
              {/* Active Progress Line */}
              <div
                className="absolute top-1/2 left-4 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: progressWidth }}
              ></div>

              <div className="flex justify-between relative z-10">
                {NODES.map((node, idx) => {
                  const isPast = idx < activeStep;
                  const isCurrent = idx === activeStep;
                  const isUpcoming = idx > activeStep;

                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setActiveStep(idx)}
                      className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
                    >
                      {/* Completed Node */}
                      {isPast && (
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white ring-4 ring-surface shadow-sm">
                          <Icon name={node.icon} size={16} />
                        </div>
                      )}

                      {/* Current Active Node */}
                      {isCurrent && (
                        <div className="w-9 h-9 rounded-full bg-surface border-2 border-primary flex items-center justify-center text-primary ring-4 ring-surface relative shadow-md">
                          <span className="absolute inset-0 rounded-full border-2 border-primary pulse-ring"></span>
                          <Icon name={node.icon} size={16} className="text-primary" />
                        </div>
                      )}

                      {/* Upcoming Pending Node */}
                      {isUpcoming && (
                        <div className="w-9 h-9 rounded-full bg-surface border-2 border-outline-variant flex items-center justify-center text-outline ring-4 ring-surface opacity-60 group-hover:opacity-100 transition-opacity">
                          <Icon name={node.icon} size={16} className="text-outline" />
                        </div>
                      )}

                      <span
                        className={`font-label-sm text-label-sm hidden sm:block ${
                          isCurrent
                            ? 'text-primary font-bold'
                            : isPast
                            ? 'text-on-surface font-medium'
                            : 'text-on-surface-variant opacity-60'
                        }`}
                      >
                        {node.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
