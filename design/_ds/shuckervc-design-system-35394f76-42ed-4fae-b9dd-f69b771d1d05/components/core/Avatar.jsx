import React from 'react';

/**
 * shuckerVC Avatar — round portrait with optional gold ring; falls back to initials.
 */
export function Avatar({ src, name = '', size = 56, ring = false, style = {}, ...rest }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--gray-100)',
        color: 'var(--ink-700)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        fontSize: size * 0.36,
        boxShadow: ring ? '0 0 0 3px var(--white), 0 0 0 5px var(--gold-400)' : 'none',
        ...style,
      }}
      {...rest}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
