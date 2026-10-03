import React from 'react';

export const metadata = {
  title: "ShipShaft | Secure Authentication",
  description: "Access your ShipShaft precision logistics dashboard and operational telemetry.",
};

export default function AuthLayout({ children }) {
  return (
    <div className="mesh-bg min-h-screen text-on-surface antialiased flex flex-col justify-between selection:bg-primary-fixed selection:text-primary relative overflow-x-hidden">
      {/* Ambient background blur elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-primary/5 rounded-full filter blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-tertiary/5 rounded-full filter blur-[120px]"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
