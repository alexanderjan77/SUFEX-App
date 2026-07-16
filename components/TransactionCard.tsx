import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { FundTransaction, NATURE_ANNEX, NATURE_LABELS } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";

interface TransactionCardProps {
  transaction: FundTransaction;
  onEdit?: (t: FundTransaction) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function TransactionCard({
  transaction,
  onEdit,
  onDelete,
  compact = false,
}: TransactionCardProps) {
  const colors = useColors();
  const isWithdrawal = transaction.type === "WITHDRAWAL";

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Excluir registro",
      "Deseja remover este lançamento permanentemente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => onDelete?.(transaction.id),
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderLeftColor: isWithdrawal ? colors.primary : colors.gold,
          borderLeftWidth: 3,
        },
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isWithdrawal
                ? `${colors.primary}20`
                : `${colors.gold}20`,
            },
          ]}
        >
          <Feather
            name={isWithdrawal ? "arrow-down-circle" : "arrow-up-circle"}
            size={20}
            color={isWithdrawal ? colors.primary : colors.gold}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.description, { color: colors.text }]}
              numberOfLines={1}
            >
              {transaction.description || (isWithdrawal ? "Saque" : "Despesa")}
            </Text>
            <Text
              style={[
                styles.amount,
                {
                  color: isWithdrawal ? colors.success : colors.destructive,
                },
              ]}
            >
              {isWithdrawal ? "+" : "-"} {formatCurrency(transaction.amount)}
            </Text>
          </View>

          {!compact && (
            <View style={styles.metaRow}>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {formatDate(transaction.timestamp)}
              </Text>
              {transaction.nature && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: `${colors.gold}22` },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: colors.gold }]}>
                    {NATURE_ANNEX[transaction.nature]} ·{" "}
                    {NATURE_LABELS[transaction.nature]}
                  </Text>
                </View>
              )}
            </View>
          )}

          {!compact && transaction.beneficiary ? (
            <Text
              style={[styles.beneficiary, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {transaction.beneficiary}
            </Text>
          ) : null}
        </View>

        {!compact && (onEdit || onDelete) && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity onPress={() => onEdit(transaction)} hitSlop={8}>
                <Feather name="edit-2" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={handleDelete} hitSlop={8}>
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  meta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  beneficiary: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingLeft: 8,
  },
});
