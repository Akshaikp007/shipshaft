"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';

const REGISTER_VISUAL_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAVY6fWwMo-zOVz9NX3P4WMDhnjLY9m2DQ_YzPX8g7CCvV5FDWUuvCyOuiz5MKm7D0WhCq8ZZm7imSp14fVnkKvF-cs7Aytp3H5fp0osEstko6vm-9cJVQdY8hx6s6ScgzdIuc4KT1wlwfuFINVsVv1qddUIgBH74IMu8Z7e3mdv35wHOhMVgbUZFk9CE3h7hD3xgZqug57OQlIuwkepqK4meapwOfN74hV-yWGJgEkQtfZQix1PHaQkg';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength calculation
  const getStrength = (val) => {
    if (!val) return 0;
    let s = 0;
    if (val.length > 5) s += 1;
    if (val.length > 8) s += 1;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) s += 1;
    if (/[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val)) s += 1;
    return s;
  };

  const strength = getStrength(password);
  const strengthLabels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthText = strengthLabels[strength] || 'Weak';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    setServerError('');
    setSuccessMessage('');

    if (!fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) newErrors.email = 'Valid work email is required.';
    if (!phone.trim()) newErrors.phone = 'Phone number is required.';
    if (!password || password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsLoading(false);
        setServerError(data.error || 'Registration failed. Please check your information.');
        return;
      }

      setSuccessMessage('Account registered successfully! Redirecting to your dashboard...');
      setTimeout(() => {
        router.push(data.redirectTo || '/dashboard');
        router.refresh();
      }, 500);
    } catch {
      setIsLoading(false);
      setServerError('Unable to connect to the registration service. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-body-md text-body-md text-on-surface relative">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 px-6 py-6 md:px-10 md:py-8 flex justify-between items-center pointer-events-none">
        <Link
          href="/"
          className="font-display-hero text-title-lg tracking-tighter text-on-surface pointer-events-auto hover:opacity-80 transition-opacity"
        >
          ShipShaft
        </Link>
        <Link
          href="/login"
          className="font-label-md text-label-md text-primary hover:opacity-80 transition-opacity pointer-events-auto flex items-center gap-2 font-semibold"
        >
          <span>Sign In</span>
          <Icon name="arrow_forward" size={16} />
        </Link>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center px-6 py-28 md:px-10 md:py-24 min-h-screen">
        <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Visual / Branding Side (Hidden on Mobile) */}
          <div className="hidden md:flex flex-col justify-end h-full relative rounded-xl overflow-hidden bg-white/40 backdrop-blur-xl border border-white/40 p-8 min-h-[600px] shadow-lg">
            <div className="absolute inset-0 z-0">
              <Image
                src={REGISTER_VISUAL_URL}
                alt="High-tech autonomous logistics drone"
                fill
                className="object-cover opacity-50 mix-blend-luminosity"
                sizes="500px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,74,198,0.12)] to-[rgba(79,219,200,0.12)]"></div>
            </div>

            <div className="relative z-10 text-on-surface flex flex-col gap-4 pb-2">
              <div className="w-12 h-12 rounded-lg bg-primary text-white flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
                <Icon name="precision_manufacturing" size={24} />
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface max-w-sm font-bold tracking-tight">
                Precision in motion.
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-sm">
                Join the network driving next-generation logistics intelligence.
              </p>
            </div>
          </div>

          {/* Form Side */}
          <div className="flex flex-col justify-center w-full max-w-md mx-auto">
            <div className="mb-6">
              <h1 className="font-headline-md text-headline-md mb-1 text-on-surface font-bold">
                Create Account
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Register as an enterprise customer to access your logistics dashboard.
              </p>
            </div>

            {successMessage && (
              <div className="mb-6 p-4 rounded-lg bg-tertiary/10 border border-tertiary/30 text-tertiary flex items-center gap-2 text-label-md">
                <Icon name="check_circle" size={18} className="text-tertiary" />
                <span>{successMessage}</span>
              </div>
            )}

            {serverError && (
              <div className="mb-6 p-4 rounded-lg bg-error-container/40 border border-error/30 text-error flex items-center gap-2 text-label-md">
                <Icon name="error" size={18} className="text-error" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              {/* Full Name Field */}
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="fullName">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none flex items-center">
                    <Icon name="person" size={20} className="text-outline" />
                  </span>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={fullName}
                    disabled={isLoading}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors({ ...errors, fullName: null });
                      if (serverError) setServerError('');
                    }}
                    placeholder="Jane Doe"
                    required
                    className={`w-full bg-surface-container-lowest/80 border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-on-surface font-body-md text-body-md placeholder-outline/50 shadow-sm ${
                      errors.fullName ? 'border-error ring-1 ring-error' : 'border-outline-variant/50'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="font-label-sm text-label-sm text-error flex items-center gap-1 mt-0.5">
                    <Icon name="error" size={14} className="text-error" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              {/* Work Email Field */}
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="email">
                  Work Email
                </label>
                <div className="relative">
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
                      if (errors.email) setErrors({ ...errors, email: null });
                      if (serverError) setServerError('');
                    }}
                    placeholder="jane@company.com"
                    required
                    className={`w-full bg-surface-container-lowest/80 border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-on-surface font-body-md text-body-md placeholder-outline/50 shadow-sm ${
                      errors.email ? 'border-error ring-1 ring-error' : 'border-outline-variant/50'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="font-label-sm text-label-sm text-error flex items-center gap-1 mt-0.5">
                    <Icon name="error" size={14} className="text-error" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Phone Number Field */}
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="phone">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none flex items-center">
                    <Icon name="call" size={20} className="text-outline" />
                  </span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    disabled={isLoading}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors({ ...errors, phone: null });
                      if (serverError) setServerError('');
                    }}
                    placeholder="+91 98470 00000"
                    required
                    className={`w-full bg-surface-container-lowest/80 border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-on-surface font-body-md text-body-md placeholder-outline/50 shadow-sm ${
                      errors.phone ? 'border-error ring-1 ring-error' : 'border-outline-variant/50'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="font-label-sm text-label-sm text-error flex items-center gap-1 mt-0.5">
                    <Icon name="error" size={14} className="text-error" />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="password">
                  Password
                </label>
                <div className="relative">
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
                      if (errors.password) setErrors({ ...errors, password: null });
                      if (serverError) setServerError('');
                    }}
                    placeholder="••••••••"
                    required
                    className={`w-full bg-surface-container-lowest/80 border rounded-lg pl-10 pr-10 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-on-surface font-body-md text-body-md placeholder-outline/50 shadow-sm ${
                      errors.password ? 'border-error ring-1 ring-error' : 'border-outline-variant/50'
                    }`}
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

                {/* Password Strength Indicator */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-grow flex gap-1 h-1.5">
                    <div
                      className={`flex-1 rounded-full transition-colors duration-300 ${
                        strength >= 1
                          ? strength === 1
                            ? 'bg-error'
                            : strength === 2
                            ? 'bg-[#f59e0b]'
                            : 'bg-tertiary'
                          : 'bg-surface-container-high'
                      }`}
                    ></div>
                    <div
                      className={`flex-1 rounded-full transition-colors duration-300 ${
                        strength >= 2
                          ? strength === 2
                            ? 'bg-[#f59e0b]'
                            : 'bg-tertiary'
                          : 'bg-surface-container-high'
                      }`}
                    ></div>
                    <div
                      className={`flex-1 rounded-full transition-colors duration-300 ${
                        strength >= 3 ? 'bg-tertiary' : 'bg-surface-container-high'
                      }`}
                    ></div>
                    <div
                      className={`flex-1 rounded-full transition-colors duration-300 ${
                        strength >= 4 ? 'bg-tertiary' : 'bg-surface-container-high'
                      }`}
                    ></div>
                  </div>
                  <span
                    className={`font-label-sm text-label-sm w-16 text-right font-medium ${
                      strength === 1
                        ? 'text-error'
                        : strength === 2
                        ? 'text-[#f59e0b]'
                        : strength >= 3
                        ? 'text-tertiary'
                        : 'text-outline-variant'
                    }`}
                  >
                    {password ? strengthText : 'Weak'}
                  </span>
                </div>

                {errors.password && (
                  <p className="font-label-sm text-label-sm text-error flex items-center gap-1 mt-0.5">
                    <Icon name="error" size={14} className="text-error" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none flex items-center">
                    <Icon name="lock" size={20} className="text-outline" />
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    disabled={isLoading}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                      if (serverError) setServerError('');
                    }}
                    placeholder="••••••••"
                    required
                    className={`w-full bg-surface-container-lowest/80 border rounded-lg pl-10 pr-10 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-on-surface font-body-md text-body-md placeholder-outline/50 shadow-sm ${
                      errors.confirmPassword ? 'border-error ring-1 ring-error' : 'border-outline-variant/50'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors focus:outline-none flex items-center cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} size={20} className="text-outline" />
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="font-label-sm text-label-sm text-error flex items-center gap-1 mt-0.5">
                    <Icon name="error" size={14} className="text-error" />
                    <span>{errors.confirmPassword}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-premium w-full bg-primary text-on-primary font-label-md text-label-md py-3.5 rounded-lg mt-2 flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <Icon name="arrow_forward" size={18} />
                  </>
                )}
              </button>

              <p className="font-label-sm text-label-sm text-outline text-center mt-2">
                By registering, you agree to our{' '}
                <a className="text-primary hover:underline underline-offset-2" href="#">
                  Terms
                </a>{' '}
                and{' '}
                <a className="text-primary hover:underline underline-offset-2" href="#">
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
