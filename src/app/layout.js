import "./globals.css";

export const metadata = {
  title: "ShipShaft | Precision Logistics Intelligence",
  description: "Redefining global logistics through atmospheric data and precision intelligence.",
  icons: {
    icon: "/favicon.svg",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
