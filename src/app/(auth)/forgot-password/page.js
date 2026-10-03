"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSubmittedEmail(email.trim());
      setIsSubmitted(true);
    }, 600);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setEmail('');
    setError('');
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 md:px-10">
      <div className="w-full max-w-[480px] mx-auto relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block font-display-hero text-headline-lg tracking-tighter text-on-surface hover:opacity-80 transition-opacity font-bold"
          >
            ShipShaft
          </Link>
          <p className="font-label-sm text-on-surface-variant mt-1 tracking-widest uppercase text-[10px] font-semibold">
            Logistics Intelligence
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass-panel rounded-xl shadow-lg p-8 md:p-10 relative overflow-hidden border border-outline-variant/30">
          {!isSubmitted ? (
            /* Recovery Form State */
            <div>
              <div className="mb-8 text-center flex flex-col items-center">
                <Icon name="lock_reset" size={48} className="text-primary mb-3" />
                <h1 className="font-headline-md text-headline-md text-on-surface mb-2 font-bold">
                  Recover your account
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="block font-label-md text-label-md text-on-surface">
                    Email Address
                  </label>
                  <div
                    className={`relative flex items-center rounded-lg border transition-colors bg-surface-container-lowest/70 backdrop-blur-sm ${
                      error
                        ? 'border-error ring-1 ring-error'
                        : 'border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary'
                    }`}
                  >
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none flex items-center">
                      <Icon name="mail" size={20} className="text-on-surface-variant" />
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="engineer@logistics.com"
                      autoComplete="email"
                      required
                      className="block w-full pl-10 pr-3 py-3 bg-transparent border-none rounded-lg text-on-surface focus:outline-none font-body-md text-body-md placeholder:text-outline-variant"
                    />
                  </div>
                  {error && (
                    <p className="font-label-sm text-label-sm text-error flex items-center gap-1 mt-0.5 animate-fade-in">
                      <Icon name="error" size={14} className="text-error" />
                      <span>{error}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-premium w-full bg-primary text-on-primary py-3.5 px-4 rounded-lg font-label-md text-label-md flex justify-center items-center gap-2 shadow-md cursor-pointer disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <Icon name="arrow_forward" size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-6">
                <Link
                  href="/login"
                  className="font-label-md text-label-md text-secondary hover:text-primary transition-colors inline-flex items-center gap-1.5"
                >
                  <Icon name="arrow_back" size={16} />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Success State */
            <div className="text-center py-2 animate-fade-in flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tertiary/10 text-tertiary mb-6">
                <Icon name="check_circle" size={36} className="text-tertiary" />
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-2 font-bold">
                Instructions Sent
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-6 leading-relaxed">
                If an account exists for <strong className="text-on-surface font-semibold">{submittedEmail}</strong>, you will receive password reset instructions shortly.
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm mb-6">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>

              <button
                type="button"
                onClick={handleReset}
                className="btn-premium w-full bg-surface text-primary border border-outline-variant py-3 px-4 rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer mb-6"
              >
                Try another email
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="font-label-md text-label-md text-secondary hover:text-primary transition-colors inline-flex items-center gap-1.5"
                >
                  <Icon name="arrow_back" size={16} />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Subtle Footer */}
        <div className="text-center mt-6">
          <p className="font-label-sm text-label-sm text-on-surface-variant/60">
            Secure SSL Encrypted Connection
          </p>
        </div>
      </div>
    </main>
  );
}
