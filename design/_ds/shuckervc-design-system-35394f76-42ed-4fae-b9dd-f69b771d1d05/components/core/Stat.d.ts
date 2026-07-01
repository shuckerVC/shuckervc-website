import React from 'react';

/**
 * Large display metric — Alice numeral + sans label. For fund stats & KPIs.
 * @startingPoint section="Core" subtitle="Display metric — big serif number + label" viewport="700x150"
 */
export interface StatProps {
  value: React.ReactNode;
  label: React.ReactNode;
  tone?: 'ink' | 'gold' | 'inverse';
  align?: 'left' | 'center';
}

export function Stat(props: StatProps): JSX.Element;
