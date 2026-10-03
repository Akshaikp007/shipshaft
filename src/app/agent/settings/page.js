'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Toast from '@/components/ui/Toast';

export default function AgentSettingsPage() {
  const [agentData, setAgentData] = useState({
    name: 'Loading...',
    email: '',
    id: '',
    branchName: '',
    vehicleType: '',
    vehicleNumber: '',
  });
  const [availability, setAvailability] = useState('AVAILABLE');
  const [phone, setPhone] = useState('');
  const [navApp, setNavApp] = useState('google_maps');
  const [autoAccept, setAutoAccept] = useState(true);
  const [audioAlerts, setAudioAlerts] = useState(true);
  const [batteryOptimization, setBatteryOptimization] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAgentProfile() {
      try {
        const res = await fetch('/api/agent/availability');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setAvailability(data.availability || 'AVAILABLE');
            setPhone(data.phone || '');
            setAgentData({
              name: data.name || 'Delivery Agent',
              email: data.email || '',
              id: data.employeeId || 'AGT',
              branchName: data.branchName || 'Unassigned Hub',
              vehicleType: data.vehicleType || 'Company Fleet',
              vehicleNumber: data.vehicleNumber || 'N/A',
            });
          }
        }
      } catch (err) {
        console.error('Failed to load agent availability:', err);
      }
    }
    loadAgentProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/agent/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage(`Operational status updated: ${availability}!`);
      } else {
        setToastMessage(data.error || 'Failed to update availability.');
      }
    } catch {
      setToastMessage('Network error updating availability.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="font-headline-md text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
          Agent Settings & Operations
        </h1>
        <p className="font-body-md text-xs md:text-sm text-on-surface-variant mt-1">
          Manage your personal driver profile, equipment telemetry, and dispatch preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Details Card */}
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-6 bg-white/95 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-outline-variant/20 pb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-bold text-2xl text-primary shadow-md">
              {(agentData.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-headline-md text-lg font-bold text-on-surface">
                {agentData.name}
              </h2>
              <p className="font-mono text-xs text-primary font-semibold">
                ID: {agentData.id} • {agentData.branchName}
              </p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                Active Courier
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={agentData.name}
              disabled
              icon="badge"
              helperText="Managed by Hub Operations Admin"
            />
            <Input
              label="Work Email"
              value={agentData.email}
              disabled
              icon="mail"
              helperText="Official company communications"
            />
            <Input
              label="Contact Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon="call"
              required
            />
            <Input
              label="Assigned Branch Hub"
              value={agentData.branchName}
              disabled
              icon="near_me"
            />
          </div>
        </div>

        {/* Operational Availability Card */}
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-6 bg-white/95 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <h2 className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2">
              <Icon name="toggle_on" size={20} className="text-primary" />
              <span>Operational Availability Status</span>
            </h2>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                availability === 'AVAILABLE'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : availability === 'BUSY'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {availability}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Determines whether the automated assignment engine dispatches new customer consignments to your active queue.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: 'AVAILABLE', label: 'Available (On Duty)', desc: 'Ready to receive new deliveries', icon: 'check_circle' },
              { value: 'BUSY', label: 'Busy (In Transit)', desc: 'Capacity temporarily reached', icon: 'local_shipping' },
              { value: 'OFFLINE', label: 'Offline (Off Duty)', desc: 'Exclude from assignment engine', icon: 'do_not_disturb_on' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAvailability(opt.value)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  availability === opt.value
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                    : 'border-outline-variant/30 hover:border-outline-variant/60 bg-white/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    name={opt.icon}
                    size={18}
                    className={availability === opt.value ? 'text-primary' : 'text-on-surface-variant'}
                  />
                  <span className="font-bold text-xs text-on-surface">{opt.label}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Assigned Vehicle Telemetry Card */}
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-6 bg-white/95 shadow-sm space-y-4">
          <h2 className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
            <Icon name="directions_car" size={18} className="text-primary" />
            <span>Assigned Fleet Vehicle & Telemetry</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-surface-container-low/70 border border-outline-variant/20">
              <span className="text-on-surface-variant block">Vehicle Model</span>
              <span className="font-bold text-on-surface text-sm">{agentData.vehicleType || 'Company Fleet'}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low/70 border border-outline-variant/20">
              <span className="text-on-surface-variant block">Registration Plate</span>
              <span className="font-mono font-bold text-on-surface text-sm">{agentData.vehicleNumber || 'N/A'}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low/70 border border-outline-variant/20">
              <span className="text-on-surface-variant block">Safety Inspection</span>
              <span className="font-bold text-tertiary text-sm">Certified & Verified</span>
            </div>
          </div>
        </div>

        {/* Dispatch & Navigation Preferences */}
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-6 bg-white/95 shadow-sm space-y-5">
          <h2 className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
            <Icon name="tune" size={18} className="text-primary" />
            <span>Operational Dispatch Preferences</span>
          </h2>

          <div className="space-y-4">
            <Select
              label="Default Turn-by-Turn Navigation App"
              value={navApp}
              onChange={(e) => setNavApp(e.target.value)}
              icon="map"
              options={[
                { value: 'google_maps', label: 'Google Maps (Recommended)' },
                { value: 'waze', label: 'Waze Traffic Intelligence' },
                { value: 'apple_maps', label: 'Apple Maps' },
              ]}
            />

            {/* Toggle Switches */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer border border-outline-variant/15">
                <div>
                  <span className="font-label-md text-xs font-bold text-on-surface block">
                    Auto-Queue Next Priority Stop
                  </span>
                  <span className="text-[11px] text-on-surface-variant block">
                    Automatically load next package directions immediately after OTP verification.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoAccept}
                  onChange={(e) => setAutoAccept(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer border border-outline-variant/15">
                <div>
                  <span className="font-label-md text-xs font-bold text-on-surface block">
                    High Volume Barcode Chime
                  </span>
                  <span className="text-[11px] text-on-surface-variant block">
                    Play audio sound alert upon successful camera QR scan.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={audioAlerts}
                  onChange={(e) => setAudioAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer border border-outline-variant/15">
                <div>
                  <span className="font-label-md text-xs font-bold text-on-surface block">
                    GPS Battery Saver Mode
                  </span>
                  <span className="text-[11px] text-on-surface-variant block">
                    Reduce telemetry transmission frequency when battery drops below 20%.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={batteryOptimization}
                  onChange={(e) => setBatteryOptimization(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            icon={<Icon name="save" size={18} />}
          >
            {loading ? 'Saving Preferences...' : 'Save Agent Preferences'}
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
