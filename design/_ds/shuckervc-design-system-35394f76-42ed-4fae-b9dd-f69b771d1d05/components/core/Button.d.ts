import React from 'react';

export type ButtonVariant = 'primary' | 'dark' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Primary call-to-action button in the shuckerVC style — pill-shaped,
 * gold-forward, geometric sans label. Use `primary` for the main action,
 * `dark` on light sections, `secondary`/`ghost` for lower emphasis.
 *
 * @startingPoint section="Core" subtitle="Pill button — gold, ink, outline & ghost" viewport="700x160"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button label / content */
  children?: React.ReactNode;
  /** Visual emphasis */
  variant?: ButtonVariant;
  /** Size */
  size?: ButtonSize;
  /** Icon node rendered before the label */
  iconLeft?: React.ReactNode;
  /** Icon node rendered after the label */
  iconRight?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Render as a different element, e.g. 'a' */
  as?: 'button' | 'a';
}

export function Button(props: ButtonProps): JSX.Element;
