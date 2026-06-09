// Vertical U-100 insulin syringe rendered with react-native-svg.
// The teal fill rises from the bottom of the barrel to the target unit line,
// with a red dashed marker and a "Draw to X units" label.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Rect,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Polygon,
  Text as SvgText,
} from 'react-native-svg';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';

interface Props {
  targetUnits: number;
  maxUnits?: number;
}

// Layout constants (in SVG user units).
const WIDTH = 130;
const HEIGHT = 320;
const BARREL_X = 46;
const BARREL_W = 38;
const BARREL_TOP = 40; // y at the top (100 units)
const BARREL_BOTTOM = 250; // y at the bottom (0 units)
const BARREL_H = BARREL_BOTTOM - BARREL_TOP;

export default function SyringeVisual({ targetUnits, maxUnits = 100 }: Props) {
  const safeTarget = isFinite(targetUnits) ? Math.max(0, targetUnits) : 0;
  const overflow = safeTarget > maxUnits;
  const clamped = Math.min(safeTarget, maxUnits);

  // Map a unit value (0..maxUnits) to a y coordinate on the barrel.
  const unitToY = (u: number) =>
    BARREL_BOTTOM - (u / maxUnits) * BARREL_H;

  const fillY = unitToY(clamped);
  const fillHeight = BARREL_BOTTOM - fillY;

  // Tick marks every 10 units; labels at 0/25/50/75/100 (scaled to maxUnits).
  const ticks: number[] = [];
  for (let u = 0; u <= maxUnits; u += 10) ticks.push(u);
  const labelUnits = [0, 25, 50, 75, 100].map((p) => (p / 100) * maxUnits);

  return (
    <View style={styles.container}>
      <Svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Defs>
          <LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primaryAccent} stopOpacity="0.95" />
            <Stop offset="1" stopColor="#0AA88A" stopOpacity="0.95" />
          </LinearGradient>
        </Defs>

        {/* Plunger rod + thumb rest at top */}
        <Rect
          x={BARREL_X + BARREL_W / 2 - 3}
          y={6}
          width={6}
          height={BARREL_TOP - 6}
          fill={colors.textSecondary}
        />
        <Rect
          x={BARREL_X - 10}
          y={2}
          width={BARREL_W + 20}
          height={8}
          rx={3}
          fill={colors.textSecondary}
        />

        {/* Barrel outline */}
        <Rect
          x={BARREL_X}
          y={BARREL_TOP}
          width={BARREL_W}
          height={BARREL_H}
          rx={6}
          fill={colors.background}
          stroke={colors.border}
          strokeWidth={2}
        />

        {/* Liquid fill */}
        {fillHeight > 0 && (
          <Rect
            x={BARREL_X + 2}
            y={fillY}
            width={BARREL_W - 4}
            height={fillHeight}
            rx={4}
            fill="url(#fillGrad)"
          />
        )}

        {/* Tick marks + labels */}
        {ticks.map((u) => {
          const y = unitToY(u);
          const isLabelled = labelUnits.some((l) => Math.abs(l - u) < 0.5);
          return (
            <React.Fragment key={`tick-${u}`}>
              <Line
                x1={BARREL_X + BARREL_W}
                y1={y}
                x2={BARREL_X + BARREL_W + (isLabelled ? 10 : 6)}
                y2={y}
                stroke={colors.textSecondary}
                strokeWidth={isLabelled ? 1.5 : 1}
              />
              {isLabelled && (
                <SvgText
                  x={BARREL_X + BARREL_W + 13}
                  y={y + 3}
                  fontSize={9}
                  fill={colors.textSecondary}
                >
                  {Math.round(u)}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}

        {/* Needle hub + needle at bottom */}
        <Polygon
          points={`${BARREL_X},${BARREL_BOTTOM} ${BARREL_X + BARREL_W},${BARREL_BOTTOM} ${
            BARREL_X + BARREL_W / 2 + 5
          },${BARREL_BOTTOM + 14} ${BARREL_X + BARREL_W / 2 - 5},${BARREL_BOTTOM + 14}`}
          fill={colors.textSecondary}
        />
        <Line
          x1={BARREL_X + BARREL_W / 2}
          y1={BARREL_BOTTOM + 14}
          x2={BARREL_X + BARREL_W / 2}
          y2={HEIGHT - 4}
          stroke={colors.textSecondary}
          strokeWidth={2}
        />

        {/* Target dashed line */}
        {!overflow && (
          <Line
            x1={BARREL_X - 12}
            y1={fillY}
            x2={BARREL_X + BARREL_W + 4}
            y2={fillY}
            stroke={colors.danger}
            strokeWidth={2}
            strokeDasharray="5,4"
          />
        )}
      </Svg>

      {overflow ? (
        <View style={styles.overflowBox}>
          <Text style={styles.overflowText}>
            {safeTarget.toFixed(1)} units exceeds one syringe.
          </Text>
          <Text style={styles.overflowSub}>
            Requires {Math.ceil(safeTarget / maxUnits)} syringes — consider a
            higher concentration.
          </Text>
        </View>
      ) : (
        <Text style={styles.drawLabel}>
          Draw to {safeTarget.toFixed(1)} units
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  drawLabel: {
    marginTop: 8,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.danger,
  },
  overflowBox: {
    marginTop: 8,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  overflowText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
  overflowSub: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});
