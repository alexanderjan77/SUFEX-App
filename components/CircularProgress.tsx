import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  valueLabel?: string;
  color?: string;
}

export function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 8,
  label,
  valueLabel,
  color,
}: CircularProgressProps) {
  const colors = useColors();
  const clamp = Math.min(100, Math.max(0, percentage));
  const progressColor = color ?? (clamp >= 80 ? colors.destructive : clamp >= 60 ? colors.warning : colors.gold);
  const trackColor = colors.border;
  const center = size / 2;

  const rightRotation = clamp <= 50 ? (clamp / 50) * 180 - 180 : 0;
  const leftRotation = clamp > 50 ? ((clamp - 50) / 50) * 180 : 180;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { width: size, height: size }]}>
        <View
          style={[
            styles.track,
            {
              width: size,
              height: size,
              borderRadius: center,
              borderWidth: strokeWidth,
              borderColor: trackColor,
            },
          ]}
        />
        <View
          style={[
            styles.halfContainer,
            { width: size, height: size, borderRadius: center },
          ]}
        >
          <View
            style={[
              styles.halfClip,
              { width: center, height: size, left: center },
            ]}
          >
            <View
              style={[
                styles.halfCircle,
                {
                  width: size,
                  height: size,
                  borderRadius: center,
                  borderWidth: strokeWidth,
                  borderColor: progressColor,
                  borderLeftColor: "transparent",
                  borderBottomColor: "transparent",
                  transform: [{ rotate: `${rightRotation}deg` }],
                },
              ]}
            />
          </View>
          <View
            style={[
              styles.halfClip,
              { width: center, height: size, right: center },
            ]}
          >
            <View
              style={[
                styles.halfCircle,
                {
                  width: size,
                  height: size,
                  borderRadius: center,
                  borderWidth: strokeWidth,
                  borderColor: clamp > 50 ? progressColor : "transparent",
                  borderRightColor: "transparent",
                  borderTopColor: "transparent",
                  transform: [{ rotate: `${leftRotation}deg` }],
                },
              ]}
            />
          </View>
        </View>
        <View style={[styles.innerText, { width: size - strokeWidth * 2 }]}>
          <Text style={[styles.percentText, { fontSize: size * 0.18, color: progressColor }]}>
            {Math.round(clamp)}%
          </Text>
          {valueLabel ? (
            <Text style={[styles.valueLabel, { fontSize: size * 0.1, color: colors.textSecondary }]} numberOfLines={1}>
              {valueLabel}
            </Text>
          ) : null}
        </View>
      </View>
      {label ? (
        <Text style={[styles.label, { color: colors.textMuted, fontSize: 10, marginTop: 4 }]} numberOfLines={2}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    position: "absolute",
  },
  halfContainer: {
    position: "absolute",
    overflow: "hidden",
  },
  halfClip: {
    position: "absolute",
    overflow: "hidden",
    top: 0,
  },
  halfCircle: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  innerText: {
    alignItems: "center",
    justifyContent: "center",
  },
  percentText: {
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  valueLabel: {
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 2,
  },
  label: {
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    maxWidth: 80,
  },
});
