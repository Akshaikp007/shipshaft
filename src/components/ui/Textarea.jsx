import React from 'react';
import Icon from '@/components/ui/Icon';

/**
 * Reusable Textarea component with optional label, rows, helper text, and error states.
 */
export default function Textarea({
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  const textareaId = id || name;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="font-label-md text-xs font-semibold text-on-surface flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
      )}

      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={`w-full bg-surface-container-lowest/80 border rounded-xl py-2.5 px-3.5 text-sm font-body-md text-on-surface placeholder:text-outline transition-all duration-200 outline-none focus:ring-2 disabled:bg-surface-container-low disabled:cursor-not-allowed resize-y ${
          error
            ? 'border-error focus:border-error focus:ring-error/20 text-error'
            : 'border-outline-variant/40 focus:border-primary focus:ring-primary/20 hover:border-outline-variant'
        }`}
        {...props}
      />

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
