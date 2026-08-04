'use client';

/**
 * Icon.tsx
 * -----------------------------------------------------------------------------
 * The single icon primitive. Every icon in the app renders through this.
 *
 *   <Icon name="analytics" />                  decorative, 20px, inherits color
 *   <Icon name="streak" size="sm" />           16px
 *   <Icon name="logout" label="Sign out" />    exposed to screen readers
 *
 * Contract:
 *  - Colour is ALWAYS currentColor. Set it on the parent, never on the icon.
 *    This is what kills the rainbow: an icon physically cannot be multicoloured.
 *  - Decorative by default (aria-hidden). Passing `label` opts into role="img".
 *  - Unknown names render a fallback and warn in development instead of
 *    throwing a white screen in production.
 *
 * `name` is typed against the registry, so a typo is a compile error rather
 * than a fallback glyph nobody notices in review.
 */

import { forwardRef } from 'react';
import type { SVGProps } from 'react';
import {
  FALLBACK_ICON,
  ICON_REGISTRY,
  ICON_SIZES,
  STROKE_FOR_SIZE,
  type IconName,
  type IconSize,
} from './icon-registry';
import './icons.css';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'name' | 'color'> {
  /** Semantic name from the registry — not a Lucide component name. */
  name: IconName;
  /** Scale step, or an explicit pixel number when a layout genuinely needs one. */
  size?: IconSize | number;
  /** Overrides the size-derived optical stroke. Rarely needed. */
  strokeWidth?: number;
  /** Supplying this exposes the icon to screen readers as role="img". */
  label?: string;
}

const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { name, size = 'md', strokeWidth, label, className = '', ...rest },
  ref
) {
  const Glyph = ICON_REGISTRY[name] ?? FALLBACK_ICON;

  if (process.env.NODE_ENV !== 'production' && !ICON_REGISTRY[name]) {
    console.warn(
      `[design-system] Unknown icon "${name}". Add it to icon-registry.ts or fix the name.`
    );
  }

  const px = typeof size === 'number' ? size : ICON_SIZES[size] ?? ICON_SIZES.md;
  const stroke = strokeWidth ?? STROKE_FOR_SIZE[px] ?? 1.75;

  const a11y = label
    ? ({ role: 'img', 'aria-label': label } as const)
    : ({ 'aria-hidden': true, focusable: 'false' } as const);

  return (
    <Glyph
      ref={ref}
      className={`ds-icon ${className}`.trim()}
      width={px}
      height={px}
      strokeWidth={stroke}
      color="currentColor"
      data-icon={name}
      {...a11y}
      {...rest}
    />
  );
});

export default Icon;
