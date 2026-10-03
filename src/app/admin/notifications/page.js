'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import NotificationItem from '@/components/ui/NotificationItem';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Toast from '@/components/ui/Toast';

export default function AdminNotificationsPage() {
  const [filter, setFilter] = useState('ALL');
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL_AGENTS');
  const [alerts, setAlerts] = useState([]);

  const loadAlerts = async () => {
    try {
      const res = await fetch('/api/notifications?all=true');
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) {
          setAlerts(
            data.notifications.map((n) => ({
              id: n._id || n.id,
              title: n.title,
              message: n.message,
              type:
                n.type === 'STATUS_UPDATE' || n.type === 'OUT_FOR_DELIVERY'
                  ? 'delivery'
                  : n.type === 'PAYMENT'
                  ? 'payment'
                  : n.type === 'ALERT'
                  ? 'alert'
                  : 'system',
              timestamp: new Date(n.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              read: Boolean(n.read),
              link: n.trackingNumber ? `/admin/shipments/${n.trackingNumber}` : null,
              linkText: n.trackingNumber ? `View Consignment #${n.trackingNumber}` : null,
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch('/api/notifications?all=true')
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.notifications) {
          setAlerts(
            data.notifications.map((n) => ({
              id: n._id || n.id,
              type: (n.type || 'system').toLowerCase(),
              title: n.title,
              message: n.message,
              time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: n.read,
              link: n.trackingNumber ? `/admin/shipments/${n.trackingNumber}` : null,
              linkText: n.trackingNumber ? `View Consignment #${n.trackingNumber}` : null,
            }))
          );
        }
      })
      .catch((err) => console.error('Failed to load notifications:', err));
    return () => {
      ignore = true;
    };
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'UNREAD') return !a.read;
    if (filter === 'CRITICAL') return a.type === 'alert';
    if (filter === 'SYSTEM') return a.type === 'system';
    return true;
  });

  const handleMarkAllRead = async () => {
    setAlerts(alerts.map((a) => ({ ...a, read: true })));
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setToastMessage('All operational alerts marked as read.');
    } catch {
      setToastMessage('Error updating notifications.');
    }
  };

  const handleMarkAsRead = async (id) => {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, read: true } : a)));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Ignore background error
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      setToastMessage('Please enter announcement title and message.');
      return;
    }

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[BROADCAST] ${broadcastTitle}`,
          message: broadcastMessage,
          type: 'ALERT',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsBroadcastOpen(false);
        setToastMessage('Broadcast alert transmitted to operational feed!');
        setBroadcastTitle('');
        setBroadcastMessage('');
        loadAlerts();
      } else {
        setToastMessage(data.error || 'Failed to transmit broadcast.');
      }
    } catch {
      setToastMessage('Network error broadcasting alert.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Operational Alerts & Notifications
          </h1>
          <p className="font-body-md text-xs md:text-sm text-on-surface-variant mt-1">
            Real-time telemetry advisories, exception alerts, and fleet broadcast channel.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllRead}
            icon={<Icon name="done_all" size={16} />}
          >
            Mark All Read
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsBroadcastOpen(true)}
            icon={<Icon name="campaign" size={16} />}
          >
            Broadcast Alert
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: 'All Alerts' },
          { id: 'UNREAD', label: 'Unread Only' },
          { id: 'CRITICAL', label: 'Critical Exceptions' },
          { id: 'SYSTEM', label: 'System & Storage' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === tab.id
                ? 'bg-primary text-on-primary shadow-sm font-bold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="glass-panel border border-outline-variant/30 rounded-2xl p-12 text-center text-on-surface-variant font-medium">
            No notifications.
          </div>
        ) : (
          filteredAlerts.map((item) => (
            <NotificationItem
              key={item.id}
              notification={item}
              onMarkAsRead={handleMarkAsRead}
            />
          ))
        )}
      </div>

      {/* Broadcast Alert Modal */}
      <Modal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        title="Broadcast Fleet Advisory"
        subtitle="Transmit high-priority alert to drivers and hub terminal managers."
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsBroadcastOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleBroadcast}>
              Transmit Advisory
            </Button>
          </>
        }
      >
        <form onSubmit={handleBroadcast} className="space-y-4">
          <Input
            label="Advisory Headline"
            placeholder="e.g. Route Weather Advisory or System Maintenance"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            icon="warning"
            required
          />
          <Select
            label="Target Recipient Channel"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            icon="group"
            options={[
              { value: 'ALL_AGENTS', label: 'All Active Delivery Agents' },
              { value: 'HUB_MANAGERS', label: 'Hub Operations Managers' },
              { value: 'ALL_USERS', label: 'Global Platform Broadcast' },
            ]}
          />
          <Textarea
            label="Detailed Operational Message"
            placeholder="Provide guidance on bypass routes, SLA buffers, or safety procedures..."
            rows={4}
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            required
          />
        </form>
      </Modal>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={Boolean(toastMessage)}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
