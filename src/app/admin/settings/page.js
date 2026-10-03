'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Toast from '@/components/ui/Toast';

export default function AdminSettingsPage() {
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('IST');
  const [requireOtp, setRequireOtp] = useState(true);
  const [requirePhotoPod, setRequirePhotoPod] = useState(true);
  const [gpsInterval, setGpsInterval] = useState('30s');
  const [webhookUrl, setWebhookUrl] = useState('https://telemetry.shipshaft.com/v1/events');
  const [dailyDigest, setDailyDigest] = useState(true);
  const [exceptionAlerts, setExceptionAlerts] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setToastMessage('Platform administration configurations updated successfully!');
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="font-headline-md text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
          Platform Administration Settings
        </h1>
        <p className="font-body-md text-xs md:text-sm text-on-surface-variant mt-1">
          Configure global logistics parameters, security protocols, API telemetry, and courier compliance.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logistics & Localization */}
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-6 bg-white/95 shadow-sm space-y-4">
          <h2 className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
            <Icon name="public" size={18} className="text-primary" />
            <span>Logistics Parameters & Regional Localization</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Platform Base Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={[
                { value: 'INR', label: 'Indian Rupee (INR - ₹)' },
                { value: 'USD', label: 'US Dollar (USD - $)' },
                { value: 'EUR', label: 'Euro (EUR - €)' },
                { value: 'GBP', label: 'British Pound (GBP - £)' },
              ]}
            />
            <Select
              label="Standard Operations Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={[
                { value: 'IST', label: 'Asia/Kolkata (IST - UTC+05:30)' },
                { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
                { value: 'EST', label: 'America/New_York (EST/EDT)' },
                { value: 'GMT', label: 'Europe/London (GMT/BST)' },
              ]}
            />
            <Input
              label="Default Express SLA Buffer"
              defaultValue="48 Hours"
              icon="schedule"
              helperText="Target delivery window for standard surface waybills"
            />
            <Input
              label="Auto-Dispatch Geofence Radius"
              defaultValue="7.5 km"
              icon="radar"
              helperText="Maximum distance to auto-assign nearest active driver"
            />
          </div>
        </div>

        {/* Courier Compliance & Verification Protocol */}
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-6 bg-white/95 shadow-sm space-y-4">
          <h2 className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
            <Icon name="verified_user" size={18} className="text-primary" />
            <span>Doorstep Custody & Handover Compliance</span>
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer border border-outline-variant/15">
              <div>
                <span className="font-label-md text-xs font-bold text-on-surface block">
                  Mandatory 6-Digit Recipient OTP Verification
                </span>
                <span className="text-[11px] text-on-surface-variant block">
                  Drivers cannot complete doorstep delivery without entering the secret email OTP sent to the recipient.
                </span>
              </div>
              <input
                type="checkbox"
                checked={requireOtp}
                onChange={(e) => setRequireOtp(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer border border-outline-variant/15">
              <div>
                <span className="font-label-md text-xs font-bold text-on-surface block">
                  Proof of Delivery (POD) Photo Capture
                </span>
                <span className="text-[11px] text-on-surface-variant block">
                  Enforce camera photo of package placement at customer doorstep.
                </span>
              </div>
              <input
                type="checkbox"
                checked={requirePhotoPod}
                onChange={(e) => setRequirePhotoPod(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
            </label>

            <div className="pt-2">
              <Select
                label="Driver Telemetry GPS Ping Frequency"
                value={gpsInterval}
                onChange={(e) => setGpsInterval(e.target.value)}
                options={[
                  { value: '15s', label: '15 Seconds (High Precision Air Express)' },
                  { value: '30s', label: '30 Seconds (Standard Fleet Default)' },
                  { value: '60s', label: '60 Seconds (Interstate Heavy Haul)' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* API Telemetry & Webhooks */}
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-6 bg-white/95 shadow-sm space-y-4">
          <h2 className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
            <Icon name="webhook" size={18} className="text-primary" />
            <span>Developer Webhooks & API Integration</span>
          </h2>

          <div className="space-y-4">
            <Input
              label="Production Event Webhook Endpoint"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              icon="link"
              helperText="Receives live webhook payloads for waybill status changes"
            />

            <div>
              <label className="font-label-md text-xs font-semibold text-on-surface block mb-1.5">
                Primary API Integration Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="shpf_live_99201481a8b3c4d5e6f7a8b9c0"
                  className="flex-1 bg-surface-container-low font-mono text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface select-all"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setToastMessage('API Secret Key copied to clipboard!')}
                  icon={<Icon name="content_copy" size={16} />}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Alerts & Digest */}
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-6 bg-white/95 shadow-sm space-y-4">
          <h2 className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
            <Icon name="mail" size={18} className="text-primary" />
            <span>Executive Notification Channels</span>
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer border border-outline-variant/15">
              <div>
                <span className="font-label-md text-xs font-bold text-on-surface block">
                  Daily Executive SLA Summary Email
                </span>
                <span className="text-[11px] text-on-surface-variant block">
                  Receive 08:00 AM briefing detailing volume, SLA violations, and hub capacities.
                </span>
              </div>
              <input
                type="checkbox"
                checked={dailyDigest}
                onChange={(e) => setDailyDigest(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer border border-outline-variant/15">
              <div>
                <span className="font-label-md text-xs font-bold text-on-surface block">
                  Real-Time Alert SMS to Duty Manager
                </span>
                <span className="text-[11px] text-on-surface-variant block">
                  Trigger automated SMS alert whenever delivery anomaly or operational delays are flagged.
                </span>
              </div>
              <input
                type="checkbox"
                checked={exceptionAlerts}
                onChange={(e) => setExceptionAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
            </label>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="md" icon={<Icon name="save" size={18} />}>
            Save Platform Configurations
          </Button>
        </div>
      </form>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={Boolean(toastMessage)}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
