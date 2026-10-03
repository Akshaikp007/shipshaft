import React from 'react';
import Icon from '@/components/ui/Icon';

/**
 * Reusable Input component with optional label, leading/trailing icons, error text, and helper text.
 */
export default function Input({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  disabled = false,
  required = false,
  className = '',
  autoComplete,
  ...props
}) {
  const inputId = id || name;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="font-label-md text-xs font-semibold text-on-surface flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {icon && iconPosition === 'left' && (
          <span className="absolute left-3.5 text-outline pointer-events-none flex items-center">
            {typeof icon === 'string' ? <Icon name={icon} size={18} /> : icon}
          </span>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full bg-surface-container-lowest/80 border rounded-xl py-2.5 text-sm font-body-md text-on-surface placeholder:text-outline transition-all duration-200 outline-none focus:ring-2 disabled:bg-surface-container-low disabled:cursor-not-allowed ${
            icon && iconPosition === 'left' ? 'pl-10' : 'pl-3.5'
          } ${icon && iconPosition === 'right' ? 'pr-10' : 'pr-3.5'} ${
            error
              ? 'border-error focus:border-error focus:ring-error/20 text-error'
              : 'border-outline-variant/40 focus:border-primary focus:ring-primary/20 hover:border-outline-variant'
          }`}
          {...props}
        />

        {icon && iconPosition === 'right' && (
          <span className="absolute right-3.5 text-outline pointer-events-none flex items-center">
            {typeof icon === 'string' ? <Icon name={icon} size={18} /> : icon}
          </span>
        )}
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
