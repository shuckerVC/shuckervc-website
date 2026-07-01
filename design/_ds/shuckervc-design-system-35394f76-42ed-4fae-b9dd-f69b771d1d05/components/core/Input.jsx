import React from 'react';

/**
 * shuckerVC Input — clean field with warm hairline border and gold focus ring.
 */
export function Input({ label, hint, type = 'text', invalid = false, id, style = {}, ...rest }) {
  const fieldId = id || (label ? 'in-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontFamily: 'var(--font-sans)', ...style }}>
      {label && (
        <label htmlFor={fieldId} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {label}
        </label>
      )}
      <input
        id={fieldId}
        type={type}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.9375rem',
          color: 'var(--text-primary)',
          background: 'var(--white)',
          padding: '0.65rem 0.85rem',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid ' + (invalid ? 'var(--danger)' : focus ? 'var(--gold-500)' : 'var(--border-strong)'),
          boxShadow: focus ? '0 0 0 3px rgba(255,192,9,0.18)' : 'none',
          outline: 'none',
          transition: 'border-color var(--dur-base), box-shadow var(--dur-base)',
        }}
        {...rest}
      />
      {hint && (
        <span style={{ fontSize: '0.75rem', color: invalid ? 'var(--danger)' : 'var(--text-secondary)' }}>{hint}</span>
      )}
    </div>
  );
}
