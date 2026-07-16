import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/utils/format";

interface LimitCardProps {
  label: string;
  annexLabel: string;
  used: number;
  limit: number;
}

export function LimitCard({ label, annexLabel, used, limit }: LimitCardProps) {
  const colors = useColors();
  const percentage = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const isWarning = percentage >= 80;
  const isOver = percentage >= 100;

  const barColor = isOver
    ? colors.destructive
    : isWarning
    ? colors.warning
    : colors.success;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isWarning ? `${barColor}60` : colors.border,
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Text style={[styles.annex, { color: colors.gold }]}>{annexLabel}</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        </View>
        <Text style={[styles.percentage, { color: barColor }]}>
          {limit > 0 ? `${Math.round(percentage)}%` : "—"}
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.bar,
            {
              width: `${Math.min(100, percentage)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      <View style={styles.values}>
        <Text style={[styles.used, { color: colors.text }]}>{formatCurrency(used)}</Text>
        <Text style={[styles.limit, { color: colors.textMuted }]}>
          de {limit > 0 ? formatCurrency(limit) : "—"}
        </Text>
      </View>

      {isWarning && (
        <Text style={[styles.warning, { color: barColor }]}>
          {isOver ? "Limite atingido!" : `⚠ Próximo do limite`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  labelRow: {
    gap: 2,
    flex: 1,
  },
  annex: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  percentage: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 3,
  },
  values: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  used: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  limit: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  warning: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
