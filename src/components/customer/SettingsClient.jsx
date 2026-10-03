'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';

export default function SettingsClient({ initialUser }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [savedFeedback, setSavedFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form state
  const [profile, setProfile] = useState({
    name: initialUser?.name || '',
    email: initialUser?.email || '',
    phone: initialUser?.phone || '',
  });

  // Notification toggles
  const [prefs, setPrefs] = useState({
    shipmentUpdates: true,
    deliveryAlerts: true,
    marketingEmails: false,
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedFeedback('');
    try {
      const res = await fetch('/api/auth/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSavedFeedback('Profile updated successfully.');
      } else {
        setSavedFeedback(data.error || 'Failed to update profile.');
      }
    } catch {
      setSavedFeedback('Network error while saving profile.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSavedFeedback(''), 4000);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-stack-lg">
      <header className="mb-stack-lg">
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
          Settings
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Manage your account preferences and security.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* Left Tabs (3 cols) */}
        <div className="lg:col-span-3">
          <div className="glass-panel border border-white/40 rounded-xl p-3 flex flex-col gap-1.5 sticky top-24 shadow-sm">
            {[
              { id: 'profile', label: 'Profile', icon: 'person' },
              { id: 'security', label: 'Security', icon: 'security' },
              { id: 'notifications', label: 'Notifications', icon: 'notifications_active' },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg font-label-md text-sm transition-all ${
                    isSelected
                      ? 'bg-surface text-primary font-bold shadow-sm'
                      : 'text-on-surface-variant hover:bg-white/40 hover:text-on-surface font-medium'
                  }`}
                >
                  <Icon
                    name={tab.icon}
                    size={18}
                    className={isSelected ? 'text-primary' : 'text-on-surface-variant'}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Area (9 cols) */}
        <div className="lg:col-span-9 space-y-stack-lg">
          {savedFeedback && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-primary font-label-md text-sm flex items-center gap-2">
              <Icon name="check_circle" size={18} />
              <span>{savedFeedback}</span>
            </div>
          )}

          {/* Profile Section */}
          {activeTab === 'profile' && (
            <section className="glass-panel border border-white/40 rounded-xl p-6 md:p-8 shadow-md">
              <h2 className="font-title-lg text-title-lg text-on-surface mb-6 border-b border-outline-variant/20 pb-4 font-bold">
                Profile Information
              </h2>

              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-bold text-2xl text-primary shrink-0 shadow-sm">
                  {(profile.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-title-md font-bold text-on-surface">{profile.name || 'ShipShaft User'}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">{profile.email}</p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                    {initialUser?.role || 'CUSTOMER'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="font-label-sm text-xs text-on-surface-variant font-semibold block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full bg-white/50 border border-outline-variant/40 rounded-lg px-4 py-2.5 font-body-md text-sm text-on-surface focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label-sm text-xs text-on-surface-variant font-semibold block">
                      Email Address (Account ID)
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      readOnly
                      disabled
                      title="Email address is tied to your account credentials."
                      className="w-full bg-slate-100/70 border border-outline-variant/30 rounded-lg px-4 py-2.5 font-body-md text-sm text-on-surface-variant cursor-not-allowed outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-label-sm text-xs text-on-surface-variant font-semibold block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full bg-white/50 border border-outline-variant/40 rounded-lg px-4 py-2.5 font-body-md text-sm text-on-surface focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="btn-premium px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label-md text-sm font-bold shadow-md hover:bg-primary-container transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Security Section */}
          {activeTab === 'security' && (
            <section className="glass-panel border border-white/40 rounded-xl p-6 md:p-8 shadow-md">
              <h2 className="font-title-lg text-title-lg text-on-surface mb-6 border-b border-outline-variant/20 pb-4 font-bold">
                Security
              </h2>

              <form onSubmit={handleSave} className="space-y-5 max-w-md">
                <div className="space-y-1.5">
                  <label className="font-label-sm text-xs text-on-surface-variant font-semibold block">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-white/50 border border-outline-variant/40 rounded-lg px-4 py-2.5 font-body-md text-sm text-on-surface focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-label-sm text-xs text-on-surface-variant font-semibold block">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="New password"
                    className="w-full bg-white/50 border border-outline-variant/40 rounded-lg px-4 py-2.5 font-body-md text-sm text-on-surface focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-label-sm text-xs text-on-surface-variant font-semibold block">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full bg-white/50 border border-outline-variant/40 rounded-lg px-4 py-2.5 font-body-md text-sm text-on-surface focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="pt-3">
                  <button
                    type="submit"
                    className="btn-premium px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label-md text-sm font-bold shadow-md hover:bg-primary-container transition-all"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Notifications Section */}
          {activeTab === 'notifications' && (
            <section className="glass-panel border border-white/40 rounded-xl p-6 md:p-8 shadow-md">
              <h2 className="font-title-lg text-title-lg text-on-surface mb-6 border-b border-outline-variant/20 pb-4 font-bold">
                Notification Preferences
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/40 rounded-xl border border-outline-variant/20">
                  <div>
                    <h3 className="font-title-lg text-sm text-on-surface font-semibold">
                      Shipment updates
                    </h3>
                    <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                      Receive alerts when shipment status changes across transit hubs.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.shipmentUpdates}
                      onChange={(e) =>
                        setPrefs({ ...prefs, shipmentUpdates: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-outline-variant/40 rounded-full peer peer-checked:bg-primary transition-colors relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:w-5 after:h-5 after:rounded-full after:transition-transform peer-checked:after:translate-x-4"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/40 rounded-xl border border-outline-variant/20">
                  <div>
                    <h3 className="font-title-lg text-sm text-on-surface font-semibold">
                      Delivery alerts
                    </h3>
                    <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                      Get notified instantly upon successful delivery and signature receipt.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.deliveryAlerts}
                      onChange={(e) =>
                        setPrefs({ ...prefs, deliveryAlerts: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-outline-variant/40 rounded-full peer peer-checked:bg-primary transition-colors relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:w-5 after:h-5 after:rounded-full after:transition-transform peer-checked:after:translate-x-4"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/40 rounded-xl border border-outline-variant/20">
                  <div>
                    <h3 className="font-title-lg text-sm text-on-surface font-semibold">
                      Marketing emails
                    </h3>
                    <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                      Receive news, enterprise freight rate discounts, and feature updates.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.marketingEmails}
                      onChange={(e) =>
                        setPrefs({ ...prefs, marketingEmails: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-outline-variant/40 rounded-full peer peer-checked:bg-primary transition-colors relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:w-5 after:h-5 after:rounded-full after:transition-transform peer-checked:after:translate-x-4"></div>
                  </label>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
