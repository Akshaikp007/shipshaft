import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-surface py-24 border-t border-outline-variant/20 text-left">
      <div className="max-w-container-max mx-auto px-edge-margin-mobile md:px-edge-margin-desktop">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12">
          
          {/* Logo & Description */}
          <div className="col-span-2">
            <span className="font-display-hero text-headline-md text-on-surface mb-8 block select-none">
              ShipShaft
            </span>
            <p className="text-on-surface-variant max-w-xs mb-8 leading-relaxed font-body-md">
              Redefining global logistics through atmospheric data and precision intelligence.
            </p>
            <div className="flex gap-4">
              <a 
                className="w-12 h-12 rounded-xl border border-outline-variant flex items-center justify-center hover:text-primary transition-colors hover:border-primary" 
                href="#"
              >
                <span className="material-symbols-outlined">share</span>
              </a>
              <a 
                className="w-12 h-12 rounded-xl border border-outline-variant flex items-center justify-center hover:text-primary transition-colors hover:border-primary" 
                href="#"
              >
                <span className="material-symbols-outlined">rss_feed</span>
              </a>
            </div>
          </div>

          {/* Links: Platform */}
          <div>
            <p className="font-bold text-on-surface mb-6 font-title-lg">Platform</p>
            <ul className="space-y-4 text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors font-body-md" href="#">Overview</a></li>
              <li><a className="hover:text-primary transition-colors font-body-md" href="#">Tracking</a></li>
              <li><a className="hover:text-primary transition-colors font-body-md" href="#">Analytics</a></li>
              <li><a className="hover:text-primary transition-colors font-body-md" href="#">Security</a></li>
            </ul>
          </div>

          {/* Links: Company */}
          <div>
            <p className="font-bold text-on-surface mb-6 font-title-lg">Company</p>
            <ul className="space-y-4 text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors font-body-md" href="#">About</a></li>
              <li><a className="hover:text-primary transition-colors font-body-md" href="#">Careers</a></li>
              <li><a className="hover:text-primary transition-colors font-body-md" href="#">Press</a></li>
              <li><a className="hover:text-primary transition-colors font-body-md" href="#">Contact</a></li>
            </ul>
          </div>

          {/* Links: Resources */}
          <div>
            <p className="font-bold text-on-surface mb-6 font-title-lg">Resources</p>
            <ul className="space-y-4 text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors font-body-md" href="#">Docs</a></li>
              <li><a className="hover:text-primary transition-colors font-body-md" href="#">API Reference</a></li>
              <li><a className="hover:text-primary transition-colors font-body-md" href="#">Status</a></li>
              <li><a className="hover:text-primary transition-colors font-body-md" href="#">Support</a></li>
            </ul>
          </div>

          {/* Links: Legal */}
          <div>
            <p className="font-bold text-on-surface mb-6 font-title-lg">Legal</p>
            <ul className="space-y-4 text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors font-body-md" href="#">Privacy</a></li>
              <li><a className="hover:text-primary transition-colors font-body-md" href="#">Terms</a></li>
              <li><a className="hover:text-primary transition-colors font-body-md" href="#">GDPR</a></li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-20 pt-8 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-on-surface-variant text-sm font-body-md">
            © 2026 ShipShaft Logistics Intelligence. Precision in motion.
          </p>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span className="text-xs text-outline font-medium">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
