import React from 'react';

/**
 * shuckerVC Stat — a big Alice number with a sans label, for metrics
 * like "$8M fund", "3.08 DPI", "$500K checks".
 */
export function Stat({ value, label, tone = 'ink', align = 'left' }) {
  const valueColor = tone === 'gold' ? 'var(--gold-600)' : tone === 'inverse' ? 'var(--gold-400)' : 'var(--ink-900)';
  const labelColor = tone === 'inverse' ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: align, alignItems: align === 'center' ? 'center' : 'flex-start' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.25rem, 4vw, 3.25rem)', lineHeight: 1, letterSpacing: '-0.02em', color: valueColor }}>
        {value}
      </span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.02em', color: labelColor }}>
        {label}
      </span>
    </div>
  );
}
