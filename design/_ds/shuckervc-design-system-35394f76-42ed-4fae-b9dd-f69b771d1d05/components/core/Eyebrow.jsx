import React from 'react';

/**
 * shuckerVC Eyebrow — uppercase, gold, wide-tracked section label.
 * Often sits above an Alice display heading.
 */
export function Eyebrow({ children, color = 'gold', style = {}, ...rest }) {
  const colors = { gold: 'var(--gold-600)', ink: 'var(--ink-900)', muted: 'var(--text-secondary)', inverse: 'var(--gold-400)' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: 'var(--tracking-caps)',
        textTransform: 'uppercase',
        color: colors[color],
        ...style,
      }}
      {...rest}
    >
      <span style={{ width: 22, height: 2, background: 'currentColor', borderRadius: 2 }} />
      {children}
    </span>
  );
}
