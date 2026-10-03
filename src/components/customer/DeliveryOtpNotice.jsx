'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

export default function DeliveryOtpNotice({ trackingNumber }) {
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/shipments/${trackingNumber}/delivery-otp/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.retryAfter) {
          setCooldown(data.retryAfter);
        }
        setFeedback({ type: 'error', message: data.error || 'Failed to resend OTP.' });
        return;
      }

      setCooldown(60);
      setFeedback({ type: 'success', message: 'A new delivery verification OTP has been sent to your email.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Network error requesting OTP resend.' });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="glass-panel border-2 border-primary/30 rounded-2xl p-6 bg-gradient-to-r from-primary/5 via-surface-container to-tertiary/5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-md">
          <Icon name="mark_email_read" size={26} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-title-md text-base font-bold text-on-surface">
              Delivery OTP Sent
            </h3>
            <span className="font-label-sm text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
              Email Dispatch
            </span>
          </div>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant max-w-xl">
            Check your registered email address for the delivery verification code. Please provide this 6-digit code to the authorized courier upon arrival.
          </p>
          {feedback && (
            <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${feedback.type === 'error' ? 'text-error' : 'text-tertiary'}`}>
              <Icon name={feedback.type === 'error' ? 'error' : 'check_circle'} size={14} />
              <span>{feedback.message}</span>
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1.5 self-stretch md:self-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          isLoading={isResending}
          disabled={cooldown > 0}
          icon={<Icon name="refresh" size={16} />}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
        </Button>
        <span className="text-[11px] text-on-surface-variant/80 font-medium">
          {cooldown > 0 ? 'Cooldown active' : 'Sent to registered account email'}
        </span>
      </div>
    </div>
  );
}
