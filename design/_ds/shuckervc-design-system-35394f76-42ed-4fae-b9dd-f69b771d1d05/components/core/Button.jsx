import React from 'react';

/**
 * shuckerVC Button — geometric, confident, gold-forward.
 * Variants: primary (gold), secondary (ink outline), dark (ink fill), ghost.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft = null,
  iconRight = null,
  disabled = false,
  as = 'button',
  ...rest
}) {
  const sizes = {
    sm: { fontSize: '0.8125rem', padding: '0.5rem 0.875rem', gap: '0.4rem' },
    md: { fontSize: '0.9375rem', padding: '0.7rem 1.25rem', gap: '0.5rem' },
    lg: { fontSize: '1.0625rem', padding: '0.9rem 1.6rem', gap: '0.6rem' },
  };

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-semibold)',
    lineHeight: 1,
    borderRadius: 'var(--radius-pill)',
    border: '2px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'transform var(--dur-fast) var(--ease-out), background var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    ...sizes[size],
  };

  const variants = {
    primary: { background: 'var(--brand)', color: 'var(--text-on-brand)', borderColor: 'var(--brand)' },
    dark: { background: 'var(--ink-900)', color: 'var(--text-inverse)', borderColor: 'var(--ink-900)' },
    secondary: { background: 'transparent', color: 'var(--ink-900)', borderColor: 'var(--ink-900)' },
    ghost: { background: 'transparent', color: 'var(--ink-900)', borderColor: 'transparent' },
  };

  const onEnter = (e) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'translateY(-1px)';
    if (variant === 'primary') { e.currentTarget.style.background = 'var(--gold-500)'; e.currentTarget.style.boxShadow = 'var(--shadow-gold)'; }
    if (variant === 'dark') e.currentTarget.style.background = 'var(--ink-700)';
    if (variant === 'secondary') e.currentTarget.style.background = 'var(--gray-100)';
    if (variant === 'ghost') e.currentTarget.style.background = 'var(--gray-100)';
  };
  const onLeave = (e) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'none';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.background = variants[variant].background;
  };

  const Tag = as;
  return (
    <Tag
      style={{ ...base, ...variants[variant] }}
      disabled={as === 'button' ? disabled : undefined}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      {...rest}
    >
      {iconLeft && <span style={{ display: 'inline-flex' }}>{iconLeft}</span>}
      {children}
      {iconRight && <span style={{ display: 'inline-flex' }}>{iconRight}</span>}
    </Tag>
  );
}
