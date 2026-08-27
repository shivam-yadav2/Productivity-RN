import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface LogoProps {
  size?: number;
  /** Glyph fill color. */
  color?: string;
  /** Fill for the counter (the hole in the bowl) — set this to whatever the mark sits on. */
  backdropColor?: string;
}

/**
 * The app's "P" monogram as a vector, matching assets/icon.png exactly (see
 * scripts/generate-logo.js). Rendered via SVG rather than the PNG so it can be
 * recolored for light/dark contexts instead of carrying a baked-in background.
 */
export const Logo: React.FC<LogoProps> = ({ size = 20, color = '#FFFFFF', backdropColor = '#18181B' }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={32} y={24} width={14} height={52} rx={7} fill={color} />
    <Rect x={32} y={24} width={40} height={34} rx={17} fill={color} />
    <Rect x={46} y={32} width={16} height={18} rx={9} fill={backdropColor} />
  </Svg>
);
