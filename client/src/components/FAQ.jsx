import React, { useState } from 'react';

const FAQ_ITEMS = [
  {
    id: 1,
    question: 'How secure is the tracking telemetry?',
    answer: 'ShipShaft utilizes AES-256 bit encryption for all data at rest and TLS 1.3 for data in transit. We are fully SOC2 Type II compliant and provide granular audit logs for all enterprise access.',
  },
  {
    id: 2,
    question: 'Integration with legacy ERP systems?',
    answer: 'Our RESTful API is designed for deep integration with SAP, Oracle, and Microsoft Dynamics. We offer pre-built connectors and SDKs in 8 major languages.',
  },
  {
    id: 3,
    question: 'What happens during telemetry network outages?',
    answer: 'Our edge logistics tracking nodes cache telemetry points locally when disconnected and sync automatically once a cell or satellite connection is re-established, ensuring zero data loss.',
  },
  {
    id: 4,
    question: 'Can we configure custom geo-fences and notifications?',
    answer: 'Yes, our API and dashboard support real-time webhook alerts. You can draw custom polygons on our telemetry map to receive instant notifications on arrival, delay, or route deviation.',
  },
];

export default function FAQ() {
  const [openIds, setOpenIds] = useState([1]); // Initialize first item as open

  const toggleItem = (id) => {
    if (openIds.includes(id)) {
      setOpenIds(openIds.filter(x => x !== id));
    } else {
      setOpenIds([...openIds, id]);
    }
  };

  return (
    <section className="py-stack-xl bg-surface-container-low/30 text-left">
      <div className="px-edge-margin-mobile md:px-edge-margin-desktop max-w-4xl mx-auto">
        <h2 className="font-headline-lg text-headline-lg text-center mb-16 text-on-surface">
          Intelligence FAQ
        </h2>
        
        <div className="space-y-4">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openIds.includes(item.id);
            
            return (
              <div 
                key={item.id}
                className="glass-panel rounded-3xl overflow-hidden border border-outline-variant/30 transition-all duration-300"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="flex justify-between items-center w-full p-8 text-left font-title-lg text-title-lg text-on-surface cursor-pointer select-none focus:outline-none"
                >
                  <span className="font-semibold text-lg">{item.question}</span>
                  <span className={`material-symbols-outlined transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-outline'}`}>
                    expand_more
                  </span>
                </button>
                
                <div 
                  className={`transition-all duration-300 overflow-hidden ${
                    isOpen ? 'max-h-40 border-t border-outline-variant/10' : 'max-h-0'
                  }`}
                >
                  <div className="p-8 text-on-surface-variant font-body-md leading-relaxed">
                    {item.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
