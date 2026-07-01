import React from 'react';

export type CardTone = 'light' | 'muted' | 'ink';

/**
 * Surface container — white by default with a soft warm shadow and large
 * radius. Use `tone="ink"` for dark feature cards, `interactive` for hover lift.
 * @startingPoint section="Core" subtitle="Content surface — light, muted & ink tones" viewport="700x240"
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  tone?: CardTone;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card(props: CardProps): JSX.Element;
