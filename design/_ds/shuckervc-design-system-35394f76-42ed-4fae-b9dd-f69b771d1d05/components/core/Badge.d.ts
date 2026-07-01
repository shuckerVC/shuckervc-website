import React from 'react';

export type BadgeVariant = 'gold' | 'goldSoft' | 'ink' | 'outline' | 'teal';

/**
 * Small pill label for stages ("Pre-seed"), sectors, or statuses.
 * @startingPoint section="Core" subtitle="Pill labels for stage, sector & status" viewport="700x130"
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export function Badge(props: BadgeProps): JSX.Element;
