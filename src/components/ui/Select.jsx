import React from 'react';
import Icon from '@/components/ui/Icon';

/**
 * Reusable Select component matching Stitch design.
 */
export default function Select({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error,
  helperText,
  icon,
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  const selectId = id || name;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="font-label-md text-xs font-semibold text-on-surface flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3.5 text-outline pointer-events-none flex items-center">
            {typeof icon === 'string' ? <Icon name={icon} size={18} /> : icon}
          </span>
        )}

        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full appearance-none bg-surface-container-lowest/80 border rounded-xl py-2.5 pr-10 text-sm font-body-md text-on-surface transition-all duration-200 outline-none focus:ring-2 disabled:bg-surface-container-low disabled:cursor-not-allowed ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${
            error
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-outline-variant/40 focus:border-primary focus:ring-primary/20 hover:border-outline-variant'
          }`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-outline">
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>

        <span className="absolute right-3 text-outline pointer-events-none flex items-center">
          <Icon name="expand_more" size={20} />
        </span>
      </div>

      {error ? (
        <p className="text-xs text-error font-medium flex items-center gap-1 mt-0.5">
          <Icon name="error" size={14} />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-on-surface-variant font-normal mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
