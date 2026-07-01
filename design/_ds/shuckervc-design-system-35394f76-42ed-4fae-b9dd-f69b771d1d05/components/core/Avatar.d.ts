import React from 'react';

/**
 * Round avatar with optional gold ring; renders an image or initials fallback.
 * @startingPoint section="Core" subtitle="Round portrait with gold ring or initials" viewport="700x130"
 */
export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name?: string;
  size?: number;
  ring?: boolean;
}

export function Avatar(props: AvatarProps): JSX.Element;
