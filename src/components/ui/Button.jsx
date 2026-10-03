import React from 'react';

/**
 * Reusable Button component aligned with Stitch design tokens.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon = null,
  iconPosition = 'left',
  disabled = false,
  isLoading = false,
  type = 'button',
  onClick,
  ...props
}) {
  const variantStyles = {
    primary: 'bg-primary text-on-primary btn-premium shadow-lg hover:bg-primary-container',
    secondary: 'bg-surface-container-high text-on-surface hover:bg-surface-dim border border-outline-variant/30',
    outline: 'bg-white text-primary border border-primary-fixed hover:bg-surface-container shadow-sm',
    ghost: 'bg-transparent text-primary hover:bg-primary/10',
    danger: 'bg-error text-on-error hover:bg-error/90',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-label-sm font-semibold rounded-md',
    md: 'px-5 py-2.5 text-label-md font-semibold rounded-lg',
    lg: 'px-6 py-3.5 text-label-md font-bold rounded-xl',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      ) : icon && iconPosition === 'left' ? (
        icon
      ) : null}
      <span>{children}</span>
      {!isLoading && icon && iconPosition === 'right' ? icon : null}
    </button>
  );
}
