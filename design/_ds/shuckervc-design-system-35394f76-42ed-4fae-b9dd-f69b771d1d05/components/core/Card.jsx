import React from 'react';

/**
 * shuckerVC Card — clean white surface, soft warm shadow, generous radius.
 * `interactive` adds a lift on hover; `tone="ink"` flips to a dark feature card.
 */
export function Card({ children, tone = 'light', interactive = false, padding = 'lg', style = {}, ...rest }) {
  const pads = { none: 0, sm: 'var(--space-4)', md: 'var(--space-5)', lg: 'var(--space-6)' };
  const tones = {
    light: { background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    muted: { background: 'var(--surface-muted)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    ink: { background: 'var(--ink-900)', color: 'var(--text-inverse)', border: '1px solid var(--ink-900)' },
  };
  const onEnter = (e) => {
    if (!interactive) return;
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
  };
  const onLeave = (e) => {
    if (!interactive) return;
    e.currentTarget.style.transform = 'none';
    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
  };
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        borderRadius: 'var(--radius-lg)',
        padding: pads[padding],
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
        ...tones[tone],
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
