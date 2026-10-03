import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: "ShipShaft | Precision Logistics Intelligence",
  description: "Redefining global logistics through atmospheric telemetry and precision intelligence.",
};

export default function PublicLayout({ children }) {
  return (
    <div className="mesh-bg text-on-background font-body-md overflow-x-hidden selection:bg-primary-fixed selection:text-primary min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  );
}
