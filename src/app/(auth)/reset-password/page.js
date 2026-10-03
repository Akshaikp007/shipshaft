"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import PasswordField from '@/components/auth/PasswordField';
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter';
import Icon from '@/components/ui/Icon';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    let valid = true;

    setPasswordError('');
    setConfirmError('');

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      valid = false;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      valid = false;
    }

    if (!valid) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 700);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 md:px-10">
      <div className="w-full max-w-md animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block font-display-hero text-headline-lg tracking-tighter text-on-surface hover:opacity-80 transition-opacity font-bold"
          >
            ShipShaft
          </Link>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Precision Logistics Intelligence
          </p>
        </div>

        {/* Reset Password Glass Card */}
        <div className="glass-panel rounded-xl shadow-xl p-8 md:p-10 relative overflow-hidden border border-outline-variant/30">
          {!isSuccess ? (
            /* Reset Form */
            <div>
              <div className="mb-6">
                <h1 className="font-headline-md text-headline-md text-on-surface mb-2 font-bold">
                  Secure Password Reset
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Enter your new credential requirements below to regain access to your operational hub.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* New Password */}
                <div>
                  <PasswordField
                    id="new-password"
                    name="new-password"
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Enter new password"
                    error={passwordError}
                    autoComplete="new-password"
                  />
                  <PasswordStrengthMeter password={newPassword} showRequirements={true} />
                </div>

                {/* Confirm Password */}
                <div>
                  <PasswordField
                    id="confirm-password"
                    name="confirm-password"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmError) setConfirmError('');
                    }}
                    placeholder="Confirm new password"
                    error={confirmError}
                    autoComplete="new-password"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-premium w-full bg-primary text-white font-title-lg text-title-lg py-3.5 rounded-lg shadow-lg flex justify-center items-center gap-2 cursor-pointer disabled:opacity-75"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Updating Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Execute Reset</span>
                        <Icon name="arrow_forward" size={20} />
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1.5"
                  >
                    <Icon name="arrow_back" size={16} />
                    <span>Return to Telemetry Sign-In</span>
                  </Link>
                </div>
              </form>
            </div>
          ) : (
            /* Success State: Protocol Complete */
            <div className="text-center py-4 animate-fade-in flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tertiary/10 text-tertiary mb-6">
                <Icon name="check_circle" size={36} className="text-tertiary" />
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-2 font-bold">
                Protocol Complete
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-8 leading-relaxed">
                Your security credentials have been successfully updated. You can now access your logistics dashboard with your new password.
              </p>
              <Link
                href="/login"
                className="btn-premium w-full inline-block bg-primary text-white font-title-lg text-title-lg py-3.5 rounded-lg shadow-lg text-center"
              >
                Initialize Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
