'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

export default function NotificationsClient({ initialNotifications = [] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isUnread: false }))
    );
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  const filtered = notifications.filter((item) => {
    if (selectedCategory === 'All') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="space-y-stack-lg">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
            Notifications
          </h1>
          <p className="text-on-surface-variant font-body-md mt-1">
            Stay updated on your shipments and account.
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-primary font-label-md text-label-md font-semibold hover:bg-primary/20 transition-colors flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full w-fit"
        >
          <Icon name="done_all" size={18} />
          <span>Mark all as read</span>
        </button>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* Notifications Feed (8 cols) */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-stack-sm">
          {filtered.length === 0 ? (
            <div className="glass-panel border border-white/40 rounded-xl p-12 text-center text-on-surface-variant font-medium">
              {notifications.length === 0 ? 'No notifications.' : 'No notifications in this category.'}
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`bg-glass-fill backdrop-blur-xl border border-white/30 rounded-xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${
                  item.isUnread ? 'bg-white/70' : 'opacity-80 hover:opacity-100 bg-white/40'
                }`}
              >
                {/* Unread Accent Bar */}
                {item.isUnread && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                )}

                <div className="flex items-start gap-4">
                  {/* Avatar Icon */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full ${item.iconBg} flex items-center justify-center ${item.iconColor} shadow-sm`}
                    >
                      <Icon name={item.icon} size={22} />
                    </div>
                    {item.isUnread && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-surface"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                        {item.title}
                      </h2>
                      <span className="text-label-sm text-xs text-outline shrink-0">
                        {item.timestamp}
                      </span>
                    </div>

                    <p className="text-on-surface-variant font-body-md text-sm mb-3">
                      {item.description}
                    </p>

                    {item.actionText && item.actionHref && (
                      <Link
                        href={item.actionHref}
                        className="text-primary font-label-md text-sm font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <span>{item.actionText}</span>
                        <Icon name="arrow_forward" size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Side Panel (4 cols) */}
        <div className="col-span-1 lg:col-span-4 hidden lg:flex flex-col gap-stack-md">
          {/* Category Filter */}
          <div className="glass-panel border border-white/40 rounded-xl p-6 shadow-md">
            <h3 className="font-title-lg text-title-lg text-on-surface mb-4 font-bold">
              Filter Notifications
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { label: 'All Updates', val: 'All' },
                { label: 'Shipment Status', val: 'Shipment Status' },
                { label: 'Billing & Payments', val: 'Billing & Payments' },
                { label: 'Account Alerts', val: 'Account Alerts' },
              ].map((opt) => (
                <label
                  key={opt.val}
                  onClick={() => setSelectedCategory(opt.val)}
                  className="flex items-center gap-3 p-2.5 hover:bg-white/50 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="notif_category"
                    checked={selectedCategory === opt.val}
                    onChange={() => setSelectedCategory(opt.val)}
                    className="text-primary focus:ring-primary h-4 w-4"
                  />
                  <span
                    className={`font-body-md text-sm ${
                      selectedCategory === opt.val
                        ? 'text-primary font-bold'
                        : 'text-on-surface'
                    }`}
                  >
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Quick Settings Banner */}
          <div className="bg-surface-container rounded-xl p-6 border border-white/30 text-center relative overflow-hidden shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary">
              <Icon name="tune" size={24} />
            </div>
            <h4 className="font-title-lg text-title-lg text-on-surface mb-1.5 font-bold">
              Notification Settings
            </h4>
            <p className="font-body-md text-on-surface-variant mb-4 text-xs">
              Control how and when you receive updates across email, SMS, and in-app alerts.
            </p>
            <Link
              href="/settings"
              className="w-full py-2.5 bg-white text-on-surface border border-outline-variant/40 rounded-xl font-label-md text-sm font-semibold hover:bg-surface-container transition-all block shadow-sm"
            >
              Manage Preferences
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
