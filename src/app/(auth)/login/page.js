"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/Icon';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    let valid = true;

    setEmailError('');
    setPasswordError('');
    setServerError('');
    setLoginMessage('');

    if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    }

    if (!valid) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsLoading(false);
        setServerError(data.error || 'Invalid email or password.');
        return;
      }

      setLoginMessage('Authenticated successfully. Redirecting to workspace...');
      const destination = redirectParam || data.redirectTo || '/dashboard';
      setTimeout(() => {
        router.push(destination);
        router.refresh();
      }, 400);
    } catch {
      setIsLoading(false);
      setServerError('Unable to connect to the authentication service. Please check your network.');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 md:px-10">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block font-display-hero text-headline-lg tracking-tighter text-on-surface hover:opacity-90 transition-opacity font-bold"
          >
            ShipShaft
          </Link>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Precision Logistics Intelligence
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-xl shadow-lg p-8 relative overflow-hidden border border-outline-variant/30">
          {/* Decorative blur element */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>

          <h2 className="font-headline-md text-title-lg text-on-surface mb-6 font-semibold">
            Sign In
          </h2>

          {loginMessage && (
            <div className="mb-5 p-3 rounded-lg bg-tertiary/10 border border-tertiary/20 text-tertiary flex items-center gap-2 text-label-md">
              <Icon name="check_circle" size={18} className="text-tertiary" />
              <span>{loginMessage}</span>
            </div>
          )}

          {serverError && (
            <div className="mb-5 p-3 rounded-lg bg-error-container/40 border border-error/30 text-error flex items-center gap-2 text-label-md">
              <Icon name="error" size={18} className="text-error" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div
                className={`relative flex items-center rounded-lg border transition-colors duration-200 bg-surface-container-lowest/50 ${
                  emailError || serverError
                    ? 'border-error ring-1 ring-error'
                    : 'border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary'
                }`}
              >
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none flex items-center">
                  <Icon name="mail" size={20} className="text-outline" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                    if (serverError) setServerError('');
                  }}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-transparent border-none rounded-lg font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-outline-variant disabled:opacity-60"
                />
              </div>
              {emailError && (
                <p className="font-label-sm text-label-sm text-error mt-1 flex items-center gap-1">
                  <Icon name="error" size={14} className="text-error" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-label-md text-label-md text-on-surface" htmlFor="password">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div
                className={`relative flex items-center rounded-lg border transition-colors duration-200 bg-surface-container-lowest/50 ${
                  passwordError || serverError
                    ? 'border-error ring-1 ring-error'
                    : 'border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary'
                }`}
              >
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none flex items-center">
                  <Icon name="lock" size={20} className="text-outline" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  disabled={isLoading}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                    if (serverError) setServerError('');
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-transparent border-none rounded-lg font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-outline-variant disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors focus:outline-none flex items-center cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} className="text-outline" />
                </button>
              </div>
              {passwordError && (
                <p className="font-label-sm text-label-sm text-error mt-1 flex items-center gap-1">
                  <Icon name="error" size={14} className="text-error" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-on-primary py-3 px-4 rounded-lg font-label-md text-title-lg hover:bg-primary-container hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 shadow-md cursor-pointer disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <Icon name="arrow_forward" size={20} />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center border-t border-outline-variant/30 pt-4">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-primary font-medium hover:underline decoration-primary/30 underline-offset-4 transition-all"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
