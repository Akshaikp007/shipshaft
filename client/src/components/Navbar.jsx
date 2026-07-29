import React, { useState } from 'react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-xl border-b border-outline-variant/20">
      <nav className="flex items-center justify-between px-edge-margin-mobile md:px-edge-margin-desktop py-5 max-w-container-max mx-auto w-full">
        <div className="flex items-center gap-12">
          <span className="font-display-hero text-title-lg tracking-tighter text-on-surface select-none cursor-pointer">
            ShipShaft
          </span>
          <div className="hidden md:flex items-center gap-10">
            <a className="text-primary font-semibold py-1 font-body-md text-body-md" href="#">Platform</a>
            <a className="text-on-surface-variant hover:text-on-surface transition-all duration-200 font-body-md text-body-md" href="#">Solutions</a>
            <a className="text-on-surface-variant hover:text-on-surface transition-all duration-200 font-body-md text-body-md" href="#">Developers</a>
            <a className="text-on-surface-variant hover:text-on-surface transition-all duration-200 font-body-md text-body-md" href="#">Pricing</a>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="hidden md:block px-4 py-2 font-medium text-on-surface hover:opacity-80 transition-all btn-premium">
            Login
          </button>
          <button className="bg-primary text-white px-7 py-3 rounded-full font-semibold shadow-xl shadow-primary/20 hover:bg-primary-container transition-all btn-premium">
            Get Started
          </button>
          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-outline-variant/20 shadow-xl transition-all duration-300 ease-in-out">
          <div className="flex flex-col p-6 gap-4 font-body-md text-body-md">
            <a className="text-primary font-semibold py-2" href="#" onClick={() => setMobileMenuOpen(false)}>Platform</a>
            <a className="text-on-surface-variant hover:text-on-surface transition-all duration-200 py-2" href="#" onClick={() => setMobileMenuOpen(false)}>Solutions</a>
            <a className="text-on-surface-variant hover:text-on-surface transition-all duration-200 py-2" href="#" onClick={() => setMobileMenuOpen(false)}>Developers</a>
            <a className="text-on-surface-variant hover:text-on-surface transition-all duration-200 py-2" href="#" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <div className="h-px bg-outline-variant/20 my-2"></div>
            <button className="w-full text-center py-3 font-medium text-on-surface hover:bg-surface-container-low rounded-xl transition-all" onClick={() => setMobileMenuOpen(false)}>
              Login
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
