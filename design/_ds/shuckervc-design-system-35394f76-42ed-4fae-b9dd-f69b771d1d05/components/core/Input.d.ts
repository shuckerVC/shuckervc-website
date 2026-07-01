import React from 'react';

/**
 * Text input with label, hint and gold focus ring.
 * @startingPoint section="Core" subtitle="Labeled text field with gold focus ring" viewport="700x150"
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  invalid?: boolean;
}

export function Input(props: InputProps): JSX.Element;
