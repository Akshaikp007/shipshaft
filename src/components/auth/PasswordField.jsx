"use client";

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * Reusable PasswordField with eye toggle for visibility using high-fidelity Icon SVGs.
 */
export default function PasswordField({
  id = 'password',
  name = 'password',
  value,
  onChange,
  placeholder = '••••••••',
  required = true,
  label = 'Password',
  error = '',
  autoComplete = 'current-password',
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="block font-label-md text-label-md text-on-surface">
          {label}
        </label>
      )}
      <div
        className={`relative flex items-center rounded-lg border transition-colors duration-200 bg-surface-container-lowest/70 backdrop-blur-sm ${
          error
            ? 'border-error ring-1 ring-error'
            : 'border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary'
        }`}
      >
        <span className="absolute left-3 text-outline pointer-events-none select-none flex items-center">
          <Icon name="lock" size={20} className="text-outline" />
        </span>
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="w-full pl-10 pr-10 py-3 bg-transparent border-none rounded-lg font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-outline-variant"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 text-outline hover:text-on-surface transition-colors focus:outline-none flex items-center cursor-pointer"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <Icon
            name={showPassword ? 'visibility_off' : 'visibility'}
            size={20}
            className="text-outline hover:text-on-surface"
          />
        </button>
      </div>
      {error && (
        <p className="font-label-sm text-label-sm text-error flex items-center gap-1 mt-0.5 animate-fade-in">
          <Icon name="error" size={14} className="text-error" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
