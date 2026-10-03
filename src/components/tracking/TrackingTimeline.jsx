import React from 'react';
import Icon from '@/components/ui/Icon';

/**
 * TrackingTimeline renders the actual vertical logistics milestones
 * derived from database TrackingEvent records.
 */
export default function TrackingTimeline({ steps = [] }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-6 shadow-lg h-full border border-outline-variant/30 flex flex-col items-center justify-center text-center py-12">
        <Icon name="history" size={32} className="text-outline mb-2" />
        <h3 className="font-title-lg text-title-lg text-on-surface font-semibold mb-1">
          No Tracking History
        </h3>
        <p className="font-body-md text-xs text-on-surface-variant max-w-xs">
          Tracking milestones will appear as the consignment moves through regional logistics hubs.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-6 shadow-lg h-full border border-outline-variant/30">
      <h3 className="font-title-lg text-title-lg text-on-surface mb-6 border-b border-outline-variant/30 pb-2 font-semibold flex items-center gap-2">
        <Icon name="timeline" size={20} className="text-primary" />
        <span>Shipment Milestones</span>
      </h3>

      <div className="flex flex-col gap-0 pl-2">
        {steps.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isUpcoming = step.status === 'upcoming';

          const nodeClasses = [
            'timeline-node',
            'flex gap-4',
            idx < steps.length - 1 ? 'pb-6' : '',
            isCompleted ? 'completed' : '',
            isCurrent ? 'current' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={step.id || idx} className={nodeClasses}>
              {/* Node Icon Circle */}
              <div className="relative z-10 flex-shrink-0">
                {isCompleted && (
                  <div className="w-10 h-10 rounded-full bg-surface-container-high border-2 border-primary flex items-center justify-center text-primary">
                    <Icon name={step.icon || 'check'} size={18} />
                  </div>
                )}

                {isCurrent && (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,53,148,0.5)] pulse-ring">
                    <Icon name={step.icon || 'local_shipping'} size={18} />
                  </div>
                )}

                {isUpcoming && (
                  <div className="w-10 h-10 rounded-full bg-surface-container border-2 border-outline-variant flex items-center justify-center text-outline">
                    <Icon name={step.icon || 'warehouse'} size={18} />
                  </div>
                )}
              </div>

              {/* Node Content */}
              <div className={`pt-1.5 flex-1 ${isUpcoming ? 'opacity-60' : ''}`}>
                <p
                  className={`font-label-md text-label-md font-semibold ${
                    isCurrent ? 'text-primary font-bold text-base' : 'text-on-surface'
                  }`}
                >
                  {step.title}
                </p>
                <p className="font-label-sm text-label-sm text-outline">{step.timestamp}</p>

                {step.description && (
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1 text-sm leading-relaxed">
                    {step.description}
                  </p>
                )}

                {step.location && (
                  <div className="bg-surface-container-lowest/80 rounded-md p-2 mt-2 border border-outline-variant/20 inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <Icon name="location_on" size={14} className="text-primary" />
                    <span>{step.location}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
