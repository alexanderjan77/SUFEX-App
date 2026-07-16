import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { FundTransaction, NATURE_LABELS } from "@/types";
import {
  formatCurrency,
  formatCurrencyCSV,
  formatCSVValue,
  formatDate,
} from "@/utils/format";
import { ANNEXES, PLACEHOLDER_ANNEXES } from "@/utils/report";

function buildCSV(transactions: FundTransaction[], poi: any): string {
  const sep = ";";
  const header = [
    "Tipo",
    "Data",
    "Descrição",
    "Beneficiário",
    "Natureza",
    "N° Documento",
    "Valor (R$)",
    "Difícil Comprovação",
  ].join(sep);

  const rows = transactions.map((t) =>
    [
      formatCSVValue(t.type === "WITHDRAWAL" ? "SAQUE" : "DESPESA"),
      formatCSVValue(formatDate(t.timestamp)),
      formatCSVValue(t.description),
      formatCSVValue(t.beneficiary),
      formatCSVValue(t.nature ? NATURE_LABELS[t.nature] : ""),
      formatCSVValue(t.documentNumber),
      formatCurrencyCSV(t.amount),
      formatCSVValue(t.isDificilComprovacao ? "SIM" : "NÃO"),
    ].join(sep)
  );

  const metaLines = [
    `Processo SEI;${formatCSVValue(poi.seiNumber)}`,
    `POI;${formatCSVValue(poi.poiNumber)}`,
    `Servidor Suprido;${formatCSVValue(poi.supridoName)}`,
    `Vigência;${formatCSVValue([poi.vigenciaStart, poi.vigenciaEnd].filter(Boolean).join(" a ") || "")}`,
    ``,
  ];

  return metaLines.join("\n") + header + "\n" + rows.join("\n");
}

export default function RelatoriosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, poi, totalWithdrawals, totalExpenses, availableBalance } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const devolver = Math.max(0, totalWithdrawals - totalExpenses);

  const handleExportCSV = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const csv = buildCSV(transactions, poi);
    if (Platform.OS === "web") {
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sufex_${poi.poiNumber || "relatorio"}.csv`;
      a.click();
      return;
    }
    try {
      const path = FileSystem.documentDirectory + `sufex_${poi.poiNumber || "relatorio"}.csv`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: "text/csv", dialogTitle: "Exportar Planilha CSV" });
    } catch {
      Alert.alert("Erro", "Não foi possível exportar a planilha.");
    }
  };

  const handleExportPDF = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "web") {
      Alert.alert("Info", "Exportação de PDF disponível apenas no dispositivo móvel.");
      return;
    }
    router.push("/modal/relatorio-dados");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navyDeep }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 10, paddingBottom: bottomPad + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Relatório de Receitas/Despesas (SUFEX)</Text>

        {/* Form header — mirrors printed form fields */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Dados do SUFEX</Text>
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.formHeaderRow}>
            <FormField label="Autorização de Suprimento de Fundos nº" value={poi.poiNumber || "—"} colors={colors} flex={1.3} />
            <FormField label="Processo nº" value={poi.seiNumber || "—"} colors={colors} flex={1} />
          </View>
          <View style={[styles.formDivider, { backgroundColor: colors.border }]} />
          <View style={styles.formHeaderRow}>
            <FormField label="Valor Solicitado" value={formatCurrency(poi.valorSolicitado || 0)} colors={colors} flex={1} />
            <FormField label="Número do REMI" value={poi.remiNumber || "—"} colors={colors} flex={1} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.completeLink, { borderColor: colors.gold }]}
          onPress={() => router.push("/modal/relatorio-dados")}
          activeOpacity={0.7}
        >
          <Feather name="edit-3" size={13} color={colors.gold} />
          <Text style={[styles.completeLinkText, { color: colors.gold }]}>Completar dados do relatório</Text>
        </TouchableOpacity>

        {/* Saques Realizados — mirrors printed form rows (Data / Valor / Comprovante no SEI nº) */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Saques Realizados</Text>
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {transactions.filter((t) => t.type === "WITHDRAWAL").length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhum saque registrado</Text>
          ) : (
            transactions
              .filter((t) => t.type === "WITHDRAWAL")
              .map((t, idx, arr) => (
                <View key={t.id}>
                  <View style={styles.saqueRow}>
                    <FormField label="Data" value={formatDate(t.timestamp)} colors={colors} flex={0.8} compact />
                    <FormField label="Valor (R$)" value={formatCurrency(t.amount)} colors={colors} flex={1} compact />
                    <FormField label="Comprovante no SEI nº" value={t.documentNumber || "—"} colors={colors} flex={1.1} compact />
                  </View>
                  {idx < arr.length - 1 && <View style={[styles.formDivider, { backgroundColor: colors.border }]} />}
                </View>
              ))
          )}
          <View style={[styles.formDivider, { backgroundColor: colors.border }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textMuted }]}>TOTAL SACADO</Text>
            <Text style={[styles.totalValue, { color: colors.success }]}>{formatCurrency(totalWithdrawals)}</Text>
          </View>
        </View>

        {/* Despesas Efetuadas — lettered annex breakdown matching the printed form (A-J) */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Despesas Efetuadas</Text>
        <View style={[styles.despesasGroupCard, { borderColor: colors.border }]}>
        {ANNEXES.map(({ nature, letter, formTitle, annex }) => {
          const items = transactions.filter((t) => t.type === "EXPENSE" && t.nature === nature);
          const total = items.reduce((s, t) => s + t.amount, 0);
          return (
            <View key={nature}>
              <Text style={[styles.annexSubTitle, { color: colors.textSecondary }]}>
                {letter} - {formTitle}
              </Text>
              <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {items.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>—</Text>
                ) : (
                  <>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableHeaderCell, { color: colors.textMuted, flex: 0.7 }]}>Data</Text>
                      <Text style={[styles.tableHeaderCell, { color: colors.textMuted, flex: 0.9 }]}>SEI nº</Text>
                      <Text style={[styles.tableHeaderCell, { color: colors.textMuted, flex: 1.6 }]}>Descrição</Text>
                      <Text style={[styles.tableHeaderCell, { color: colors.textMuted, flex: 1, textAlign: "right" }]}>Valor (R$)</Text>
                    </View>
                    {items.map((t) => (
                      <View key={t.id} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { color: colors.text, flex: 0.7 }]} numberOfLines={1}>{formatDate(t.timestamp)}</Text>
                        <Text style={[styles.tableCell, { color: colors.text, flex: 0.9 }]} numberOfLines={1}>{t.documentNumber || "—"}</Text>
                        <Text style={[styles.tableCell, { color: colors.text, flex: 1.6 }]} numberOfLines={1}>{t.description || "—"}</Text>
                        <Text style={[styles.tableCell, { color: colors.text, flex: 1, textAlign: "right" }]}>{formatCurrency(t.amount)}</Text>
                      </View>
                    ))}
                  </>
                )}
                <View style={[styles.formDivider, { backgroundColor: colors.border }]} />
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.textMuted }]}>TOTAL {annex.toUpperCase()}</Text>
                  <Text style={[styles.totalValue, { color: total > 0 ? colors.gold : colors.textMuted }]}>{formatCurrency(total)}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Placeholder annexes matching printed form (E, F, H, I) — no transaction nature tracked yet */}
        {PLACEHOLDER_ANNEXES.map(({ letter, formTitle }) => (
          <View key={letter}>
            <Text style={[styles.annexSubTitle, { color: colors.textSecondary }]}>
              {letter} - {formTitle}
            </Text>
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>—</Text>
              <View style={[styles.formDivider, { backgroundColor: colors.border }]} />
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textMuted }]}>TOTAL ANEXO {letter}</Text>
                <Text style={[styles.totalValue, { color: colors.textMuted }]}>{formatCurrency(0)}</Text>
              </View>
            </View>
          </View>
        ))}

          <View style={[styles.formDivider, { backgroundColor: colors.border }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textMuted }]}>TOTAL DESPESAS EFETUADAS</Text>
            <Text style={[styles.totalValue, { color: colors.gold }]}>{formatCurrency(totalExpenses)}</Text>
          </View>
        </View>

        {/* Resumo Financeiro */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Resumo Financeiro</Text>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <SummaryItem label="Total Sacado" value={totalWithdrawals} color={colors.success} colors={colors} />
            <SummaryItem label="Total Despesas" value={totalExpenses} color={colors.destructive} colors={colors} />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <SummaryItem label="Saldo em Conta" value={availableBalance} color={availableBalance >= 0 ? colors.success : colors.destructive} colors={colors} />
            <SummaryItem label="Valor a Devolver (GRU)" value={devolver} color={colors.warning} colors={colors} />
          </View>
        </View>

        {/* GRU Box */}
        {devolver > 0 && (
          <View style={[styles.gruCard, { backgroundColor: "rgba(245,158,11,0.1)", borderColor: "#F59E0B" }]}>
            <View style={styles.gruHeader}>
              <Feather name="alert-triangle" size={16} color="#F59E0B" />
              <Text style={[styles.gruTitle, { color: "#F59E0B" }]}>Valor a Devolver via GRU</Text>
            </View>
            <Text style={[styles.gruValue, { color: "#FBBF24" }]}>{formatCurrency(devolver)}</Text>

            <View style={[styles.gruDivider, { backgroundColor: "rgba(245,158,11,0.25)" }]} />

            <Text style={[styles.gruSubtitle, { color: "#8BA3C7" }]}>Dados para recolhimento (preserva sigilo da identidade)</Text>

            <View style={styles.gruDataGrid}>
              <GruRow label="UG" value="200258" />
              <GruRow label="Gestão" value="00001" />
              <GruRow label="CNPJ Favorecido" value="00.394.494/0164-82" />
              <GruRow label="Favorecido" value="DINT/PRF" />
            </View>
          </View>
        )}

        {/* Export Button */}
        <TouchableOpacity
          style={[styles.exportBtn, { backgroundColor: colors.gold }]}
          onPress={handleExportPDF}
          activeOpacity={0.7}
        >
          <Feather name="file-text" size={20} color={colors.navyDeep} />
          <Text style={[styles.exportLabelDark, { color: colors.navyDeep }]}>Exportar PDF</Text>
        </TouchableOpacity>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function GruRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={gruRowStyles.row}>
      <Text style={gruRowStyles.label}>{label}</Text>
      <Text style={gruRowStyles.value}>{value}</Text>
    </View>
  );
}
const gruRowStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 3 },
  label: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#6B85A8" },
  value: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#FBBF24" },
});

function SummaryItem({ label, value, color, colors }: any) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{formatCurrency(value)}</Text>
    </View>
  );
}

function FormField({ label, value, colors, flex, compact }: {
  label: string; value: string; colors: any; flex?: number; compact?: boolean;
}) {
  return (
    <View style={{ flex: flex ?? 1, gap: compact ? 2 : 4 }}>
      <Text
        style={[styles.formFieldLabel, { color: colors.textMuted }]}
        numberOfLines={compact ? 1 : 2}
      >
        {label}
      </Text>
      <Text style={[styles.formFieldValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 10 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -4 },
  summaryCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.8 },
  summaryRow: { flexDirection: "row", gap: 8 },
  summaryItem: { flex: 1, gap: 2 },
  summaryLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  summaryValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  divider: { height: 1 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 6 },
  annexSubTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  despesasGroupCard: { borderRadius: 14, borderWidth: 1, padding: 10, gap: 8 },
  annexCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  annexHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  annexBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  annexBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  annexTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  annexStats: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  annexCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  annexTotal: { fontSize: 15, fontFamily: "Inter_700Bold" },
  gruCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 8 },
  gruHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  gruTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },
  gruValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  gruDivider: { height: 1 },
  gruSubtitle: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  gruDataGrid: { gap: 2, marginTop: 2 },
  exportBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingVertical: 14, marginTop: 6 },
  exportLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  exportLabelDark: { fontSize: 15, fontFamily: "Inter_700Bold" },

  completeLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 9,
    marginTop: -2,
  },
  completeLinkText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  formCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 10 },
  formHeaderRow: { flexDirection: "row", gap: 12 },
  formDivider: { height: 1 },
  formFieldLabel: { fontSize: 9.5, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.4 },
  formFieldValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  saqueRow: { flexDirection: "row", gap: 10 },
  emptyText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 10.5, fontFamily: "Inter_700Bold", letterSpacing: 0.4 },
  totalValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  tableHeaderRow: { flexDirection: "row", paddingBottom: 4 },
  tableHeaderCell: { fontSize: 9.5, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.3 },
  tableRow: { flexDirection: "row", paddingVertical: 5 },
  tableCell: { fontSize: 12, fontFamily: "Inter_400Regular", paddingRight: 4 },
});
