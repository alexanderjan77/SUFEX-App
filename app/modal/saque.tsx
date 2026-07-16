import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DatePickerField } from "@/components/DatePickerField";
import { FloatingLabelInput } from "@/components/FloatingLabelInput";
import { TipBanner } from "@/components/TipBanner";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/utils/format";

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`;
}

export default function SaqueModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addTransaction, totalWithdrawals, poi, transactions } = useApp();

  const [amountStr, setAmountStr] = useState("");
  const [date, setDate] = useState(todayStr);
  const [saving, setSaving] = useState(false);

  const totalLimits =
    (poi.limitePJ ?? 0) +
    (poi.limitePF ?? 0) +
    (poi.limiteConsumo ?? 0) +
    (poi.limitePermanente ?? 0);
  const dispSaque = Math.max(0, totalLimits - totalWithdrawals);

  const amountValue =
    parseFloat(amountStr.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
  const exceedsLimit = amountValue > 0 && amountValue > dispSaque;
  const isValid = amountValue > 0 && !exceedsLimit;

  const handleAmountChange = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (!digits) { setAmountStr(""); return; }
    const val = parseInt(digits, 10) / 100;
    setAmountStr(val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
  };

  const handleSave = async () => {
    if (!isValid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    const saqueNum = transactions.filter((t) => t.type === "WITHDRAWAL").length + 1;
    await addTransaction({
      type: "WITHDRAWAL",
      amount: amountValue,
      description: `Saque ${String(saqueNum).padStart(2, "0")}`,
      isDificilComprovacao: false,
    });
    setSaving(false);
    router.back();
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: "rgba(0,0,0,0.65)" }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => router.back()} />

      <View style={[styles.sheet, { backgroundColor: "#1E2E52", paddingBottom: bottomPad + 16 }]}>
        {/* Handle */}
        <View style={styles.handleWrapper}>
          <View style={styles.handle} />
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <Text style={[styles.title, { color: colors.gold }]}>
            Receber Suprimento (Saque)
          </Text>
          <View style={{ height: 8 }} />

          {/* Stats */}
          <View style={[styles.statsBox, { backgroundColor: "rgba(11,19,41,0.6)", borderColor: "rgba(255,255,255,0.08)" }]}>
            <StatRow label="Total Autorizado:" value={formatCurrency(totalLimits)} colors={colors} />
            <StatRow label="Saques Realizados:" value={formatCurrency(totalWithdrawals)} colors={colors} />
            <StatRow
              label="Disponível para Saque:"
              value={formatCurrency(dispSaque)}
              colors={colors}
              highlight
            />
          </View>

          {/* Amount */}
          <View style={{ height: 8 }} />
          <FloatingLabelInput
            label="Valor do Saque"
            placeholder="R$ 0,00"
            value={amountStr}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
            autoFocus
            error={exceedsLimit}
          />
          {exceedsLimit && (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={13} color="#EF4444" />
              <Text style={styles.errorText}>
                Valor excede o limite disponível ({formatCurrency(dispSaque)})
              </Text>
            </View>
          )}

          {/* Dica — exibida apenas antes do primeiro saque */}
          {transactions.filter((t) => t.type === "WITHDRAWAL").length === 0 && (
            <TipBanner tip="Realize o saque preferencialmente próximo à data de uso. O valor sacado deve ser comprovado integralmente ao final da missão." />
          )}

          {/* Date picker */}
          <View style={styles.dateWrapper}>
            <DatePickerField
              label="Data do Saque"
              value={date}
              onChange={setDate}
              floatBg="#1E2E52"
            />
          </View>

          {/* Buttons */}
          <View style={[styles.btnRow, { borderTopColor: "rgba(255,255,255,0.07)" }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn} hitSlop={8}>
              <Text style={[styles.cancelText, { color: "#6B85A8" }]}>Cancelar</Text>
            </TouchableOpacity>

            {isValid ? (
              <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                <LinearGradient
                  colors={["#F59E0B", "#FBBF24", "#FCD34D"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.confirmBtn, styles.confirmBtnActive]}
                >
                  <Text style={[styles.confirmText, { color: "#0B1329" }]}>
                    {saving ? "Registrando…" : "Registrar"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={[styles.confirmBtn, styles.confirmBtnDisabled]}>
                <Text style={[styles.confirmText, { color: "#4A6080" }]}>Registrar</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function StatRow({ label, value, colors, highlight }: {
  label: string; value: string; colors: any; highlight?: boolean;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: highlight ? colors.gold : colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 0,
    maxHeight: "88%",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.55,
    shadowRadius: 40,
    elevation: 24,
    gap: 12,
  },
  handleWrapper: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)" },

  title: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  statsBox: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 13, fontFamily: "Inter_700Bold" },

  dateWrapper: { marginTop: 14 },

  btnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    alignItems: "center",
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  cancelBtn: { paddingVertical: 11, paddingHorizontal: 8 },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  confirmBtn: { borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  confirmBtnActive: {
    shadowColor: "#FBBF24",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  confirmText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: -4 },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#EF4444", flex: 1 },
});
