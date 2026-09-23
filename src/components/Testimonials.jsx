import React from 'react';

export default function Testimonials() {
  return (
    <section className="py-stack-xl px-edge-margin-mobile md:px-edge-margin-desktop max-w-container-max mx-auto text-left">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        {/* Quote Block */}
        <div>
          <h2 className="font-headline-lg text-headline-lg mb-8 leading-tight text-on-surface">
            Innovating for the world's most complex fleets.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-12 italic leading-relaxed">
            "Switching to ShipShaft reduced our delivery discrepancies by 42% in the first quarter. Their API is by far the most stable we've integrated with in years."
          </p>
          <div className="flex items-center gap-5">
            <img
              alt="Sarah Jenkins"
              className="w-16 h-16 rounded-full object-cover shadow-xl"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeMAYn6LxLcq5biOxnp1FhnKUYZsnUOCxbZjkpDb0eRYCTHicgRRJO9_ZZK0ERxaKLRqCKo06CGZ2NM8TiZKvHcYAQO8-ZRUyMJERuT_4TaHVTUA2ok3oapwqCztV6AihhcM-7LOAEckoAKBEPXrTz9y-sHtDGEhfo2LXtVzy_NXsLL-jayvT5CTdJ_10kqlictuGaeOxZrGiuDuyzKIkplSnruySa2mYsU3xaodUldo7G0k1cuSVIhA"
            />
            <div>
              <p className="font-bold text-lg text-on-surface">Sarah Jenkins</p>
              <p className="text-on-surface-variant text-sm">VP of Logistics, Global Retail Corp</p>
            </div>
          </div>
        </div>

        {/* Stats Highlight Panel */}
        <div className="relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-tertiary/10 rounded-full blur-3xl"></div>
          
          <div className="glass-panel p-10 rounded-[40px] relative z-10 hover:shadow-2xl transition-shadow duration-300">
            <p className="text-[64px] leading-none text-primary font-extrabold mb-6 animate-pulse">42%</p>
            <p className="text-title-lg font-bold mb-4 text-on-surface">Efficiency Uplift</p>
            <p className="text-on-surface-variant leading-relaxed font-body-md">
              Across our entire European fleet, ShipShaft provided visibility we previously thought was technically impossible at this scale.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
