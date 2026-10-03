import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-outline-variant/30 py-16 mt-16 text-left">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 md:gap-12">
          {/* Logo & Description */}
          <div className="col-span-2 lg:col-span-2 flex flex-col gap-3">
            <Link
              href="/"
              className="font-display-hero text-headline-md tracking-tighter text-on-surface flex items-center gap-2 font-bold select-none hover:opacity-90 transition-opacity"
            >
              <Icon name="deployed_code" size={24} className="text-primary" />
              <span>ShipShaft</span>
            </Link>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mt-1 leading-relaxed">
              Precision in motion. The standard for enterprise logistics intelligence.
            </p>
            <div className="flex gap-3 mt-3">
              <a
                className="w-10 h-10 rounded-xl border border-outline-variant/40 flex items-center justify-center text-outline hover:text-primary hover:border-primary transition-colors"
                href="#"
                aria-label="Share"
              >
                <Icon name="share" size={18} />
              </a>
              <a
                className="w-10 h-10 rounded-xl border border-outline-variant/40 flex items-center justify-center text-outline hover:text-primary hover:border-primary transition-colors"
                href="#"
                aria-label="RSS Feed"
              >
                <Icon name="rss_feed" size={18} />
              </a>
            </div>
          </div>

          {/* Links: Product */}
          <div className="flex flex-col gap-3">
            <h4 className="font-label-md text-label-md text-on-surface font-semibold mb-1">Product</h4>
            <Link className="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors" href="/#solutions">
              Platform
            </Link>
            <Link className="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors" href="/track">
              Tracking
            </Link>
            <Link className="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors" href="/#solutions">
              Solutions
            </Link>
            <a className="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
              Pricing
            </a>
          </div>

          {/* Links: Resources */}
          <div className="flex flex-col gap-3">
            <h4 className="font-label-md text-label-md text-on-surface font-semibold mb-1">Resources</h4>
            <a className="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
              Developers
            </a>
            <a className="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
              Documentation
            </a>
            <a className="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
              Status
            </a>
            <a className="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
              Support
            </a>
          </div>

          {/* Links: Legal */}
          <div className="flex flex-col gap-3">
            <h4 className="font-label-md text-label-md text-on-surface font-semibold mb-1">Legal</h4>
            <a className="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
              Privacy Policy
            </a>
            <a className="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
              Terms of Service
            </a>
            <a className="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
              GDPR Compliance
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            © 2026 ShipShaft Logistics Intelligence. Precision in motion.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span className="text-xs text-outline font-medium">All telemetry systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
