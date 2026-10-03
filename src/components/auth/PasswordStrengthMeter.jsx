import React from 'react';
import Icon from '@/components/ui/Icon';

/**
 * Calculates password strength score (0-4) and requirement fulfillment.
 */
export function calculateStrength(password = '') {
  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);

  let score = 0;
  if (hasLength) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;
  if (hasUpperLower) score++;

  let label = 'Awaiting Input';
  let color = 'bg-outline/20';

  if (password.length > 0) {
    if (score <= 1) {
      label = 'Weak';
      color = 'bg-error';
    } else if (score === 2) {
      label = 'Fair';
      color = 'bg-[#f59e0b]';
    } else if (score === 3) {
      label = 'Good';
      color = 'bg-primary';
    } else {
      label = 'Strong';
      color = 'bg-tertiary';
    }
  }

  return {
    score,
    label,
    color,
    checks: {
      hasLength,
      hasNumber,
      hasSpecial,
    },
  };
}

export default function PasswordStrengthMeter({ password = '', showRequirements = false }) {
  const { score, label, color, checks } = calculateStrength(password);

  return (
    <div className="space-y-2 mt-2">
      <div className="flex justify-between items-center">
        <span className="font-label-sm text-label-sm text-on-surface-variant">Security Rating</span>
        <span className="font-label-sm text-label-sm text-on-surface font-semibold">{label}</span>
      </div>

      {/* 4 segments */}
      <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden flex gap-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full flex-1 rounded-full transition-all duration-300 ${
              score >= step ? color : 'bg-surface-container-high'
            }`}
          />
        ))}
      </div>

      {/* Checklist items */}
      {showRequirements && (
        <ul className="font-label-sm text-label-sm space-y-1.5 pt-1">
          <li className={`flex items-center gap-2 transition-colors ${checks.hasLength ? 'text-tertiary' : 'text-on-surface-variant/60'}`}>
            <Icon
              name={checks.hasLength ? 'check_circle' : 'radio_button_unchecked'}
              size={14}
              className={checks.hasLength ? 'text-tertiary' : 'text-outline'}
            />
            <span>At least 8 characters</span>
          </li>
          <li className={`flex items-center gap-2 transition-colors ${checks.hasNumber ? 'text-tertiary' : 'text-on-surface-variant/60'}`}>
            <Icon
              name={checks.hasNumber ? 'check_circle' : 'radio_button_unchecked'}
              size={14}
              className={checks.hasNumber ? 'text-tertiary' : 'text-outline'}
            />
            <span>One numerical digit</span>
          </li>
          <li className={`flex items-center gap-2 transition-colors ${checks.hasSpecial ? 'text-tertiary' : 'text-on-surface-variant/60'}`}>
            <Icon
              name={checks.hasSpecial ? 'check_circle' : 'radio_button_unchecked'}
              size={14}
              className={checks.hasSpecial ? 'text-tertiary' : 'text-outline'}
            />
            <span>One special character</span>
          </li>
        </ul>
      )}
    </div>
  );
}
