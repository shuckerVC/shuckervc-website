import React from 'react';

/**
 * Section eyebrow / overline — uppercase, wide-tracked, with a short rule.
 * @startingPoint section="Core" subtitle="Uppercase section label with rule" viewport="700x110"
 */
export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  color?: 'gold' | 'ink' | 'muted' | 'inverse';
}

export function Eyebrow(props: EyebrowProps): JSX.Element;
