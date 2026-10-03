"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm transition-all duration-300">
      <nav className="flex items-center justify-between px-6 py-4 md:px-10 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-display-hero text-title-lg tracking-tighter text-on-surface flex items-center gap-2 select-none hover:opacity-90 transition-opacity font-bold"
          >
            <Icon name="deployed_code" size={24} className="text-primary" />
            <span>ShipShaft</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link className="text-primary font-semibold border-b-2 border-primary pb-0.5 text-sm" href="/">
              Home
            </Link>
            <Link
              className="text-on-surface-variant hover:text-on-surface transition-colors duration-200 text-sm font-medium"
              href="/track"
            >
              Track Shipment
            </Link>
            <Link
              className="text-on-surface-variant hover:text-on-surface transition-colors duration-200 text-sm font-medium"
              href="/#solutions"
            >
              Solutions
            </Link>
            <Link
              className="text-on-surface-variant hover:text-on-surface transition-colors duration-200 text-sm font-medium"
              href="/#faq"
            >
              FAQ
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-on-surface-variant hover:text-on-surface transition-colors font-label-md text-sm hidden md:block font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="bg-primary text-on-primary px-6 py-2 rounded-lg font-label-md text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-md shadow-primary/20 btn-premium font-semibold"
          >
            Create Account
          </Link>
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-surface/95 backdrop-blur-xl border-b border-outline-variant/20 shadow-xl transition-all duration-300 ease-in-out animate-fade-in">
          <div className="flex flex-col p-6 gap-4 font-body-md text-body-md">
            <Link className="text-primary font-semibold py-2" href="/" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link
              className="text-on-surface-variant hover:text-on-surface transition-colors py-2 font-medium"
              href="/track"
              onClick={() => setMobileMenuOpen(false)}
            >
              Track Shipment
            </Link>
            <Link
              className="text-on-surface-variant hover:text-on-surface transition-colors py-2 font-medium"
              href="/#solutions"
              onClick={() => setMobileMenuOpen(false)}
            >
              Solutions
            </Link>
            <Link
              className="text-on-surface-variant hover:text-on-surface transition-colors py-2 font-medium"
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <div className="h-px bg-outline-variant/20 my-2"></div>
            <Link
              href="/login"
              className="w-full text-center py-2.5 font-medium text-on-surface hover:bg-surface-container-low rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="w-full text-center py-2.5 font-semibold bg-primary text-white rounded-lg transition-all shadow-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Create Account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
