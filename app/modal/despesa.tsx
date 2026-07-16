import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import { FundTransaction, TransactionNature } from "@/types";
import { formatCurrency } from "@/utils/format";

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`;
}

function parseDateDMY(s: string): Date | null {
  if (!s || s.replace(/\D/g, "").length < 6) return null;
  const parts = s.split("/");
  if (parts.length < 3) return null;
  const yearRaw = parseInt(parts[2], 10);
  const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
  const d = new Date(year, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

type NatureBtn = { key: TransactionNature; label: string };

const NATURE_BTNS: NatureBtn[] = [
  { key: "PESSOA_JURIDICA",     label: "Pessoa\nJurídica" },
  { key: "PESSOA_FISICA",       label: "Pessoa\nFísica" },
  { key: "MATERIAL_CONSUMO",    label: "Material de\nConsumo" },
  { key: "MATERIAL_PERMANENTE", label: "Material\nPermanente" },
  { key: "GRATIFICACAO_FONTE",  label: "Gratificação\nde Fonte" },
  { key: "DIFICIL_COMPROVACAO", label: "Difícil\nComprovação" },
];

type OperationalNature = "PESSOA_JURIDICA" | "PESSOA_FISICA" | "MATERIAL_CONSUMO" | "MATERIAL_PERMANENTE";

const NATURE_LIMIT_INFO: Record<OperationalNature, { limitKey: "limitePJ" | "limitePF" | "limiteConsumo" | "limitePermanente"; label: string }> = {
  PESSOA_JURIDICA:     { limitKey: "limitePJ",        label: "Pessoa Jurídica" },
  PESSOA_FISICA:       { limitKey: "limitePF",        label: "Pessoa Física" },
  MATERIAL_CONSUMO:    { limitKey: "limiteConsumo",   label: "Material de Consumo" },
  MATERIAL_PERMANENTE: { limitKey: "limitePermanente",label: "Material Permanente" },
};

// ── Section label ──────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <View style={sectionStyles.wrapper}>
      <Text style={sectionStyles.text}>{label}</Text>
      <View style={sectionStyles.line} />
    </View>
  );
}
const sectionStyles = StyleSheet.create({
  wrapper: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8, marginTop: 4 },
  text: { color: "#4A6080", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2, textTransform: "uppercase" },
  line: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
});

// ── Main modal ────────────────────────────────────────────────────────────────
export default function DespesaModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const { addTransaction, updateTransaction, transactions, poi, expensesByNature } = useApp();

  const existing: FundTransaction | undefined = params.id
    ? transactions.find((t) => t.id === params.id)
    : undefined;

  const [amountStr, setAmountStr] = useState(() =>
    existing?.amount
      ? existing.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "",
  );
  const [date, setDate] = useState(todayStr);
  const [description, setDescription] = useState(existing?.description ?? "");
  const [beneficiary, setBeneficiary] = useState(existing?.beneficiary ?? "");
  const [documentNumber, setDocumentNumber] = useState(existing?.documentNumber ?? "");
  const [nature, setNature] = useState<TransactionNature | undefined>(existing?.nature);
  const [isDificil, setIsDificil] = useState(existing?.isDificilComprovacao ?? false);
  const [abaterNature, setAbaterNature] = useState<"PESSOA_FISICA" | "PESSOA_JURIDICA" | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const amountValue =
    parseFloat(amountStr.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

  const needsAbater = isDificil || nature === "GRATIFICACAO_FONTE";
  const isValid =
    amountValue > 0 &&
    description.trim().length > 0 &&
    (!!nature || isDificil) &&
    (!needsAbater || !!abaterNature);

  const getUsedAmount = (natureKey: OperationalNature) =>
    transactions.reduce((sum, t) => {
      if (existing && t.id === existing.id) return sum;
      if (t.type !== "EXPENSE") return sum;
      if (t.nature === natureKey) return sum + t.amount;
      if (
        (natureKey === "PESSOA_FISICA" || natureKey === "PESSOA_JURIDICA") &&
        t.abaterNature === natureKey
      ) {
        return sum + t.amount;
      }
      return sum;
    }, 0);

  const handleAmountChange = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (!digits) { setAmountStr(""); return; }
    const val = parseInt(digits, 10) / 100;
    setAmountStr(val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
  };

  const handleNaturePress = (key: TransactionNature) => {
    Haptics.selectionAsync();
    if (key === "DIFICIL_COMPROVACAO") {
      const next = !isDificil;
      setIsDificil(next);
      setNature(next ? "DIFICIL_COMPROVACAO" : undefined);
      if (!next) setAbaterNature(undefined);
    } else if (key === "GRATIFICACAO_FONTE") {
      const already = nature === "GRATIFICACAO_FONTE";
      setNature(already ? undefined : "GRATIFICACAO_FONTE");
      setIsDificil(false);
      if (already) setAbaterNature(undefined);
    } else {
      setNature(key);
      setIsDificil(false);
      setAbaterNature(undefined);
    }
  };

  const executeSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    const data = {
      type: "EXPENSE" as const,
      amount: amountValue,
      nature: nature!,
      description: description.trim() || "Despesa",
      beneficiary: beneficiary.trim() || undefined,
      documentNumber: documentNumber.trim() || undefined,
      isDificilComprovacao: isDificil,
      abaterNature: needsAbater ? abaterNature : undefined,
    };
    if (existing) {
      await updateTransaction({ ...existing, ...data });
    } else {
      await addTransaction(data);
    }
    setSaving(false);
    router.back();
  };

  const handleSave = () => {
    if (!isValid) return;

    // ── Trava de data de emissão ──
    const expenseDate = parseDateDMY(date);
    if (expenseDate) {
      const vigEnd   = parseDateDMY(poi.vigenciaEnd   ?? "");
      const vigStart = parseDateDMY(poi.vigenciaStart ?? "");
      const limit90  = vigStart ? new Date(vigStart.getTime() + 90 * 86_400_000) : null;
      const dec15    = new Date(expenseDate.getFullYear(), 11, 15);
      dec15.setHours(0, 0, 0, 0);

      type Limite = { date: Date; label: string };
      const candidatos: Limite[] = [{ date: dec15, label: "15/12 do exercício financeiro" }];
      if (vigEnd)   candidatos.push({ date: vigEnd,   label: `fim da vigência do POI (${poi.vigenciaEnd})` });
      if (limit90)  candidatos.push({ date: limit90,  label: `90 dias de aplicação (${limit90.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })})` });

      const limiteFinal = candidatos.reduce((min, l) => (l.date < min.date ? l : min));

      if (expenseDate > limiteFinal.date) {
        Alert.alert(
          "Lançamento Bloqueado — Data Inválida",
          `A data da despesa (${date}) ultrapassa o limite de ${limiteFinal.label}.\n\nSomente despesas realizadas dentro do período de aplicação permitido podem ser registradas.`,
          [{ text: "Corrigir Data", style: "default" }],
        );
        return;
      }
    }

    // ── Trava Grupo J — difícil comprovação (MPI-12) ──
    if (isDificil) {
      const jaLancado = expensesByNature["DIFICIL_COMPROVACAO"] ?? 0;
      const novoTotal = jaLancado + amountValue;
      const totalLimites =
        (poi.limitePJ ?? 0) + (poi.limitePF ?? 0) +
        (poi.limiteConsumo ?? 0) + (poi.limitePermanente ?? 0);
      const limite30pct = totalLimites * 0.3;
      const ultrapassaTeto = novoTotal > 1500;
      const ultrapassaPct = totalLimites > 0 && novoTotal > limite30pct;
      if (ultrapassaTeto || ultrapassaPct) {
        const motivo = ultrapassaTeto
          ? "o teto de R$ 1.500,00"
          : `30% do suprimento (${formatCurrency(limite30pct)})`;
        Alert.alert(
          "Lançamento Bloqueado — Difícil Comprovação",
          `Este lançamento elevaria o total de difícil comprovação para ${formatCurrency(novoTotal)}, ultrapassando ${motivo}.\n\nBloqueado conforme MPI-12, Anexo J.`,
          [{ text: "Entendido", style: "default" }],
        );
        return;
      }
    }

    // ── Verificação de saldo por natureza (limites operacionais do POI) ──
    const targetNature: OperationalNature | undefined = needsAbater
      ? abaterNature
      : nature && nature in NATURE_LIMIT_INFO
        ? (nature as OperationalNature)
        : undefined;

    if (targetNature) {
      const info = NATURE_LIMIT_INFO[targetNature];
      const limite = poi[info.limitKey] ?? 0;
      const jaUsado = getUsedAmount(targetNature);
      const novoTotal = jaUsado + amountValue;
      if (limite > 0 && novoTotal > limite) {
        Alert.alert(
          "Saldo Insuficiente",
          `Este lançamento elevaria o total de ${info.label} para ${formatCurrency(novoTotal)}, ultrapassando o limite operacional definido no POI (${formatCurrency(limite)}).`,
          [{ text: "Entendido", style: "default" }],
        );
        return;
      }
    }

    // ── Trava de saldo sacado ──
    const totalSacado = transactions
      .filter((t) => t.type === "WITHDRAWAL")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDespesasAtuais = transactions
      .filter((t) => t.type === "EXPENSE" && (!existing || t.id !== existing.id))
      .reduce((sum, t) => sum + t.amount, 0);
    const novoTotalDespesas = totalDespesasAtuais + amountValue;
    if (totalSacado > 0 && novoTotalDespesas > totalSacado) {
      const saldoDisponivel = Math.max(0, totalSacado - totalDespesasAtuais);
      Alert.alert(
        "Saldo Insuficiente",
        `Este lançamento elevaria o total de despesas para ${formatCurrency(novoTotalDespesas)}, ultrapassando o total sacado de ${formatCurrency(totalSacado)}.\n\nSaldo disponível: ${formatCurrency(saldoDisponivel)}.`,
        [{ text: "Entendido", style: "default" }],
      );
      return;
    }

    executeSave();
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: "rgba(0,0,0,0.65)" }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => router.back()} />

      <View style={[styles.sheet, { paddingBottom: bottomPad + 16 }]}>
        {/* Handle */}
        <View style={styles.handleWrapper}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={[styles.title, { color: colors.gold }]}>
            {existing ? "Editar Despesa" : "Nova Despesa"}
          </Text>
          {Platform.OS !== "web" && (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/camera",
                  params: nature ? { nature } : {},
                })
              }
              style={styles.cameraBtn}
              activeOpacity={0.75}
            >
              <Feather name="camera" size={13} color="#8BA3C7" />
              <Text style={styles.cameraBtnText}>Ler Nota Fiscal</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* ── SEÇÃO 1: Valor & Data ── */}
          <SectionLabel label="Valor & Data" />

          <FloatingLabelInput
            label="Valor da Despesa *"
            placeholder="R$ 0,00"
            value={amountStr}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
            autoFocus={!existing}
          />

          <View style={{ height: 8 }} />
          <View style={styles.dateFieldWrapper}>
            <DatePickerField
              label="Data da Despesa *"
              value={date}
              onChange={setDate}
              floatBg="#1E2E52"
            />
          </View>

          {/* ── SEÇÃO 2: Identificação ── */}
          <SectionLabel label="Identificação" />

          <FloatingLabelInput
            label="Descrição / Item *"
            icon="file-text"
            placeholder="Ex: Material de Escritório"
            value={description}
            onChangeText={setDescription}
          />

          <FloatingLabelInput
            label="Credor / Beneficiário"
            icon="user"
            placeholder="Nome do fornecedor ou prestador"
            value={beneficiary}
            onChangeText={setBeneficiary}
          />

          <FloatingLabelInput
            label="Nº Nota / Recibo"
            icon="hash"
            placeholder="Número do documento fiscal"
            value={documentNumber}
            onChangeText={setDocumentNumber}
            keyboardType="numeric"
          />

          {/* ── SEÇÃO 3: Natureza ── */}
          <SectionLabel label="Natureza da Despesa *" />

          <View style={styles.natGrid}>
            {NATURE_BTNS.map((btn) => {
              const isSelected =
                btn.key === "DIFICIL_COMPROVACAO"
                  ? isDificil
                  : nature === btn.key && !isDificil;
              return (
                <TouchableOpacity
                  key={btn.key}
                  onPress={() => handleNaturePress(btn.key as TransactionNature)}
                  style={[
                    styles.natBtn,
                    {
                      borderColor: isSelected ? colors.gold : "rgba(255,255,255,0.09)",
                      backgroundColor: isSelected
                        ? `${colors.gold}18`
                        : "rgba(255,255,255,0.03)",
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.natBtnText,
                      { color: isSelected ? colors.gold : "#8BA3C7" },
                    ]}
                    numberOfLines={2}
                  >
                    {btn.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Dica contextual ── */}
          {nature === "PESSOA_JURIDICA" && (
            <TipBanner tip="Grupo B — Destinado à prestação de serviços por empresas (exceto TIC), como fretes, locação de imóveis e equipamentos, e telefonia que não inclua pacotes de dados." />
          )}
          {nature === "PESSOA_FISICA" && (
            <TipBanner tip="Grupo C — Refere-se a serviços eventuais prestados por pessoas físicas sem vínculo empregatício e locação de imóveis diretamente com o proprietário." />
          )}
          {nature === "MATERIAL_CONSUMO" && (
            <TipBanner tip="Grupo D — Inclui combustíveis, material de expediente, limpeza e manutenção de veículos utilizados em ações de inteligência." />
          )}
          {nature === "MATERIAL_PERMANENTE" && (
            <TipBanner tip="Grupo G — Equipamentos com durabilidade superior a dois anos, como notebooks, celulares e câmeras." />
          )}
          {nature === "GRATIFICACAO_FONTE" && (
            <TipBanner tip="Grupo A — Abrange pagamentos a fontes, colaboradores e colaboradores eventuais, incluindo bonificação, locomoção, hospedagem e alimentação." />
          )}
          {isDificil && (
            <TipBanner tip={"Grupo J — Gastos em que é impossível obter comprovante fiscal, como o pagamento de vigias de carro (\"flanelinhas\")."} />
          )}

          {/* Abater natureza — exibido para Gratificação de Fonte e Difícil Comprovação */}
          {needsAbater && (
            <View style={styles.abaterSection}>
              <Text style={styles.abaterLabel}>Abater em qual natureza?</Text>
              <View style={styles.abaterRow}>
                {(["PESSOA_FISICA", "PESSOA_JURIDICA"] as const).map((k) => {
                  const selected = abaterNature === k;
                  return (
                    <TouchableOpacity
                      key={k}
                      onPress={() => { Haptics.selectionAsync(); setAbaterNature(k); }}
                      style={[
                        styles.abaterBtn,
                        {
                          borderColor: selected ? colors.gold : "rgba(255,255,255,0.12)",
                          backgroundColor: selected ? `${colors.gold}20` : "transparent",
                        },
                      ]}
                    >
                      <Text style={[styles.abaterBtnText, { color: selected ? colors.gold : "#8BA3C7" }]}>
                        {k === "PESSOA_FISICA" ? "Pessoa Física (PF)" : "Pessoa Jurídica (PJ)"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Action buttons ── */}
          <View style={[styles.btnRow, { borderTopColor: "rgba(255,255,255,0.07)" }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.cancelBtn}
              hitSlop={8}
            >
              <Text style={[styles.cancelText, { color: "#6B85A8" }]}>Cancelar</Text>
            </TouchableOpacity>

            {isValid ? (
              <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                <LinearGradient
                  colors={["#F59E0B", "#FBBF24", "#FCD34D"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.saveBtn, styles.saveBtnActive]}
                >
                  <Text style={[styles.saveBtnText, { color: "#0B1329" }]}>
                    {saving ? "Salvando…" : "Salvar"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={[styles.saveBtn, styles.saveBtnDisabled]}>
                <Text style={[styles.saveBtnText, { color: "#4A6080" }]}>Salvar</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const INPUT_BG = "rgba(255,255,255,0.05)";
const INPUT_BORDER = "rgba(255,255,255,0.1)";
const SHEET_BG = "#1E2E52";

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1 },

  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 0,
    maxHeight: "92%",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.55,
    shadowRadius: 40,
    elevation: 24,
  },

  handleWrapper: { alignItems: "center", paddingTop: 12, paddingBottom: 6 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)" },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginBottom: 8,
  },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  cameraBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  cameraBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#8BA3C7" },

  scroll: { flexGrow: 0 },

  // Inputs
  inputBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 10,
    backgroundColor: INPUT_BG,
    borderColor: INPUT_BORDER,
  },
  textInput: { fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  dateFieldWrapper: { marginBottom: 10 },

  // Nature grid
  natGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  natBtn: {
    width: "47%",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  natBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },

  // Abater
  abaterSection: {
    backgroundColor: "rgba(251,191,36,0.06)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.2)",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 10,
  },
  abaterLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#8BA3C7" },
  abaterRow: { flexDirection: "row", gap: 8 },
  abaterBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  abaterBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "center" },

  // Button row
  btnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    alignItems: "center",
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 4,
    borderTopWidth: 1,
  },
  cancelBtn: { paddingVertical: 11, paddingHorizontal: 8 },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  saveBtn: { borderRadius: 14, paddingHorizontal: 32, paddingVertical: 12 },
  saveBtnActive: {
    shadowColor: "#FBBF24",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
