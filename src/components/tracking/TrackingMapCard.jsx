import React from 'react';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';

const TELEMETRY_VISUAL_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDaJTKSsn0wNmnc1f0e-8ywkXlCfo-kgn24Bh6R2XtuyxX1QL7WK2_QY-WRg6cAXz19BbPyFo8a2dIbXPaxz7Qz3_sihXVa7uMDfSKmZltw8fS199NNiUslCBOMyT9y0CKBRrynBhaTJKrmd4kf2pUEvpyNYgh-2oeRsCuRj-fztJhdS1e4BNPD_TpxehGe3ihq8PlfFqC38Cofoo6IibKF57CR4cj5Hndb7MMl4DKa5FKStJuOyRAQ0w';

/**
 * Visual telemetry corridor card showing live transit network activity.
 */
export default function TrackingMapCard({ statusLabel, location }) {
  return (
    <div className="glass-panel rounded-xl h-64 shadow-lg overflow-hidden relative flex items-center justify-center border border-outline-variant/30">
      <Image
        src={TELEMETRY_VISUAL_URL}
        alt="Logistics telemetry route visualization"
        fill
        className="object-cover opacity-80 mix-blend-multiply"
        sizes="(max-width: 1024px) 100vw, 600px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-surface/90 to-transparent"></div>

      <div className="relative z-10 text-center p-4 flex flex-col items-center">
        <Icon name="satellite_alt" size={40} className="text-primary mb-2 opacity-60" />
        <p className="font-label-md text-label-md text-on-surface font-semibold">
          Active Logistics Route
        </p>
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
          {statusLabel ? `Current Status: ${statusLabel}` : 'Live Transit Monitoring'}
        </p>
        {location && (
          <p className="font-label-sm text-label-sm text-primary mt-1 font-medium flex items-center gap-1">
            <Icon name="place" size={14} />
            <span>{location}</span>
          </p>
        )}
      </div>
    </div>
  );
}
