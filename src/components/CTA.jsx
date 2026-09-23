import React from 'react';

export default function CTA() {
  return (
    <section className="px-edge-margin-mobile md:px-edge-margin-desktop py-stack-xl max-w-container-max mx-auto">
      <div className="bg-primary rounded-[50px] p-16 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-primary/40">
        
        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-10">
          <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
            <path d="M0 0 L100 100 M100 0 L0 100" stroke="white" strokeWidth="0.5"></path>
          </svg>
        </div>
        
        <div className="relative z-10">
          <h2 className="font-display-hero text-display-hero-mobile md:text-display-hero text-white mb-10 font-extrabold tracking-tight">
            Move with absolute precision.
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            <button className="bg-white text-primary px-12 py-6 rounded-2xl font-bold text-lg transition-all btn-premium shadow-xl cursor-pointer">
              Start Free Trial
            </button>
            <button className="bg-primary-container text-white px-12 py-6 rounded-2xl font-bold text-lg border border-white/20 transition-all btn-premium cursor-pointer">
              Speak with Solutions
            </button>
          </div>
        </div>
        
      </div>
    </section>
  );
}
