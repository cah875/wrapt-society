// Full-screen molecular/hexagonal texture rendered at ~5% opacity behind
// every screen. Pure SVG — no images, fully offline.

import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Polygon, G } from 'react-native-svg';
import { colors } from '../theme/colors';

const HEX_SIZE = 34; // radius
const OPACITY = 0.05;

function hexPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

export default function HexBackground() {
  const { width, height } = useWindowDimensions();

  const hexW = HEX_SIZE * Math.sqrt(3);
  const hexV = HEX_SIZE * 1.5;
  const cols = Math.ceil(width / hexW) + 1;
  const rows = Math.ceil(height / hexV) + 1;

  const hexes: React.ReactNode[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * hexW + (row % 2 === 0 ? 0 : hexW / 2);
      const cy = row * hexV;
      hexes.push(
        <Polygon
          key={`${row}-${col}`}
          points={hexPoints(cx, cy, HEX_SIZE)}
          fill="none"
          stroke={colors.primaryAccent}
          strokeWidth={1}
        />,
      );
    }
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} opacity={OPACITY}>
        <G>{hexes}</G>
      </Svg>
    </View>
  );
}
