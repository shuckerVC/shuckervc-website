import React from 'react';

/**
 * shuckerVC Badge / pill label — for stage tags, sectors, statuses.
 */
export function Badge({ children, variant = 'gold', size = 'md', ...rest }) {
  const sizes = {
    sm: { fontSize: '0.6875rem', padding: '0.2rem 0.55rem' },
    md: { fontSize: '0.75rem', padding: '0.3rem 0.7rem' },
  };
  const variants = {
    gold: { background: 'var(--gold-300)', color: 'var(--ink-900)' },
    goldSoft: { background: 'var(--gold-100)', color: 'var(--gold-600)' },
    ink: { background: 'var(--ink-900)', color: 'var(--white)' },
    outline: { background: 'transparent', color: 'var(--ink-900)', boxShadow: 'inset 0 0 0 1.5px var(--border-strong)' },
    teal: { background: 'rgba(0,180,155,0.14)', color: 'var(--teal-600)' },
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--weight-semibold)',
        letterSpacing: '0.03em',
        borderRadius: 'var(--radius-pill)',
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        ...sizes[size],
        ...variants[variant],
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
