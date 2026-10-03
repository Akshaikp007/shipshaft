'use client';

import React, { useState, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

/**
 * Production OTP Verification Modal for Delivery Handover.
 * Strictly communicates with POST /api/shipments/[id]/verify-otp.
 * Never displays or prefills plaintext OTPs.
 */
export default function OTPVerificationModal({
  isOpen,
  onClose,
  onVerify,
  shipmentId,
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...digits];
    pasted.split('').forEach((char, idx) => {
      if (idx < 6) newDigits[idx] = char;
    });
    setDigits(newDigits);
    const nextIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleSubmit = async () => {
    const fullOtp = digits.join('');
    if (fullOtp.length < 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const res = await fetch(`/api/shipments/${shipmentId}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp: fullOtp }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Verification failed. Please try again.');
        if (typeof data.attemptsRemaining === 'number') {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        setIsVerifying(false);
        return;
      }

      setIsSuccess(true);
      setIsVerifying(false);

      setTimeout(() => {
        onVerify?.(data);
        setIsSuccess(false);
        setDigits(['', '', '', '', '', '']);
      }, 900);
    } catch (err) {
      setError(err.message || 'Network error verifying OTP.');
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    if (isVerifying) return;
    setError('');
    setAttemptsRemaining(null);
    setDigits(['', '', '', '', '', '']);
    onClose?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delivery Verification"
      subtitle={`Shipment #${shipmentId}`}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={handleClose} disabled={isVerifying}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isVerifying}
            disabled={digits.join('').length < 6 || isSuccess}
          >
            Verify OTP
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
          <Icon name="verified_user" size={28} />
        </div>

        <h3 className="font-title-md text-base font-bold text-on-surface mb-1">
          Delivery Verification
        </h3>
        <p className="font-body-md text-xs text-on-surface-variant max-w-sm mb-5">
          Ask the customer for the OTP sent to their registered email address.
        </p>

        {/* 6-digit OTP Inputs */}
        <div className="flex gap-2 sm:gap-3 justify-center my-2" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              disabled={isVerifying || isSuccess}
              className={`w-10 sm:w-12 h-12 sm:h-14 text-center font-mono font-bold text-lg rounded-xl border bg-surface-container-lowest transition-all focus:outline-none focus:ring-2 ${
                error
                  ? 'border-error text-error focus:ring-error/20'
                  : isSuccess
                  ? 'border-tertiary bg-tertiary/10 text-tertiary'
                  : digit
                  ? 'border-primary text-primary focus:ring-primary/20'
                  : 'border-outline-variant/40 focus:border-primary'
              }`}
            />
          ))}
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs flex flex-col items-center gap-1 animate-fade-in w-full">
            <div className="flex items-center gap-1.5 font-semibold">
              <Icon name="error" size={16} />
              <span>{error}</span>
            </div>
            {attemptsRemaining !== null && (
              <span className="text-[11px] text-on-surface-variant font-medium">
                Remaining attempts: <strong className="font-mono text-error">{attemptsRemaining}</strong> / 5
              </span>
            )}
          </div>
        )}

        {/* Success Feedback */}
        {isSuccess && (
          <div className="mt-3 p-3 rounded-xl bg-tertiary-container/30 border border-tertiary/40 text-tertiary text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Icon name="check_circle" size={18} />
            <span>Delivery handover confirmed! Marked DELIVERED.</span>
          </div>
        )}

        <div className="mt-5 text-[11px] text-on-surface-variant bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/20 w-full text-center">
          <Icon name="security" size={14} className="inline mr-1 text-primary align-middle" />
          Code is strictly verified on the server against customer registered email.
        </div>
      </div>
    </Modal>
  );
}
