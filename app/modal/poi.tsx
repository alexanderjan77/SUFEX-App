import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CurrencyInput } from "@/components/CurrencyInput";
import { DatePickerField } from "@/components/DatePickerField";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const MAX_VIGENCIA_DAYS = 90;

function parseMaskedDate(s: string): Date | null {
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

function vigenciaDaysDiff(start: string, end: string): number | null {
  const d1 = parseMaskedDate(start);
  const d2 = parseMaskedDate(end);
  if (!d1 || !d2) return null;
  const diffMs = d2.getTime() - d1.getTime();
  return Math.round(diffMs / 86400000) + 1;
}

export default function POIModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { poi, savePOI } = useApp();

  const [poiNumber, setPoiNumber] = useState(poi.poiNumber);
  const [seiNumber, setSeiNumber] = useState(poi.seiNumber ?? "");
  const [supridoName, setSupridoName] = useState(poi.supridoName);
  const [valorSolicitado, setValorSolicitado] = useState(poi.valorSolicitado ?? 0);
  const [vigenciaStart, setVigenciaStart] = useState(poi.vigenciaStart ?? poi.vigenciaDate ?? "");
  const [vigenciaEnd, setVigenciaEnd] = useState(poi.vigenciaEnd ?? "");
  const [limitePJ, setLimitePJ] = useState(poi.limitePJ);
  const [limitePF, setLimitePF] = useState(poi.limitePF);
  const [limiteConsumo, setLimiteConsumo] = useState(poi.limiteConsumo);
  const [limitePermanente, setLimitePermanente] = useState(poi.limitePermanente);
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const vigenciaDays = vigenciaDaysDiff(vigenciaStart, vigenciaEnd);
  const vigenciaExceeds90 = vigenciaDays !== null && vigenciaDays > MAX_VIGENCIA_DAYS;
  const vigenciaInvertida = vigenciaDays !== null && vigenciaDays <= 0;

  const naturesTotal = limitePJ + limitePF + limiteConsumo + limitePermanente;
  const naturesMismatch = Math.abs(naturesTotal - (valorSolicitado ?? 0)) > 0.001;

  const requiredMissing =
    !seiNumber.trim() ||
    !poiNumber.trim() ||
    !supridoName.trim() ||
    !(valorSolicitado > 0) ||
    !vigenciaStart.trim() ||
    !vigenciaEnd.trim();

  const handleSave = async () => {
    if (requiredMissing) {
      Alert.alert(
        "Campos obrigatórios",
        "Preencha todos os campos obrigatórios (*): Processo SEI, Número do POI, Servidor Suprido, Valor Solicitado, Início e Fim da Vigência.",
      );
      return;
    }
    if (naturesMismatch) {
      Alert.alert(
        "Valores não conferem",
        `A soma das previsões por natureza de despesa (${naturesTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}) deve ser igual ao Valor Solicitado (${(valorSolicitado ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}).`,
      );
      return;
    }
    if (vigenciaExceeds90) {
      Alert.alert(
        "Período de vigência inválido",
        `O período de aplicação do SUFEX (vigência do POI) não pode exceder ${MAX_VIGENCIA_DAYS} dias. O período informado tem ${vigenciaDays} dias.`,
      );
      return;
    }
    if (vigenciaInvertida) {
      Alert.alert(
        "Período de vigência inválido",
        "A data de fim da vigência deve ser posterior à data de início.",
      );
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    await savePOI({
      ...poi,
      poiNumber,
      seiNumber,
      supridoName,
      valorSolicitado,
      vigenciaStart,
      vigenciaEnd,
      limitePJ,
      limitePF,
      limiteConsumo,
      limitePermanente,
    });
    setSaving(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.navyDeep }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 6, backgroundColor: colors.navyPrimary },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Dados da Solicitação</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || requiredMissing || vigenciaExceeds90 || vigenciaInvertida || naturesMismatch}
          style={[
            styles.saveBtn,
            { backgroundColor: requiredMissing || vigenciaExceeds90 || vigenciaInvertida || naturesMismatch ? colors.border : colors.gold },
          ]}
        >
          <Text
            style={[
              styles.saveBtnText,
              { color: requiredMissing || vigenciaExceeds90 || vigenciaInvertida || naturesMismatch ? colors.textMuted : colors.navyDeep },
            ]}
          >
            {saving ? "..." : "Salvar"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Identificação ── */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            IDENTIFICAÇÃO DA OPERAÇÃO
          </Text>

          <Field
            label="Processo SEI"
            required
            value={seiNumber}
            onChange={setSeiNumber}
            placeholder="Ex: 08650.000001/2025-01"
            colors={colors}
          />
          <Field
            label="Número do POI"
            required
            value={poiNumber}
            onChange={setPoiNumber}
            placeholder="Ex: POI/2025/001"
            colors={colors}
          />
          <Field
            label="Servidor Suprido"
            required
            value={supridoName}
            onChange={setSupridoName}
            placeholder="Nome completo"
            colors={colors}
          />
          <CurrencyInput
            label="Valor Solicitado *"
            value={valorSolicitado}
            onChange={setValorSolicitado}
          />

          {/* Vigência: duas datas */}
          <View style={styles.vigenciaRow}>
            <View style={styles.vigenciaHalf}>
              <DatePickerField
                label="Início da Vigência *"
                value={vigenciaStart}
                onChange={setVigenciaStart}
                floatBg={colors.surface}
              />
            </View>
            <View style={styles.vigenciaHalf}>
              <DatePickerField
                label="Fim da Vigência *"
                value={vigenciaEnd}
                onChange={setVigenciaEnd}
                floatBg={colors.surface}
              />
            </View>
          </View>

          {(vigenciaExceeds90 || vigenciaInvertida) && (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={13} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {vigenciaExceeds90
                  ? `O período de vigência não pode exceder ${MAX_VIGENCIA_DAYS} dias (informado: ${vigenciaDays} dias).`
                  : "A data de fim deve ser posterior à data de início."}
              </Text>
            </View>
          )}

          {vigenciaDays !== null && !vigenciaExceeds90 && !vigenciaInvertida && (
            <Text style={[styles.vigenciaHint, { color: colors.textMuted }]}>
              Período de aplicação: {vigenciaDays} dia{vigenciaDays === 1 ? "" : "s"} (máx. {MAX_VIGENCIA_DAYS})
            </Text>
          )}
        </View>

        {/* ── Previsões por Natureza ── */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            PREVISÕES DE NATUREZA DE DESPESA
          </Text>

          <CurrencyInput
            label="Pessoa Jurídica (Anexo B)"
            value={limitePJ}
            onChange={setLimitePJ}
          />
          <CurrencyInput
            label="Pessoa Física (Anexo C)"
            value={limitePF}
            onChange={setLimitePF}
          />
          <CurrencyInput
            label="Material de Consumo (Anexo D)"
            value={limiteConsumo}
            onChange={setLimiteConsumo}
          />
          <CurrencyInput
            label="Material Permanente (Anexo G)"
            value={limitePermanente}
            onChange={setLimitePermanente}
          />

          <View
            style={[
              styles.totalRow,
              { borderTopColor: colors.border },
            ]}
          >
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total previsto</Text>
            <Text
              style={[
                styles.totalValue,
                { color: naturesMismatch ? colors.destructive : colors.gold },
              ]}
            >
              {naturesTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </Text>
          </View>

          {naturesMismatch && (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={13} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                A soma das previsões por natureza deve ser igual ao Valor Solicitado (
                {(valorSolicitado ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                ).
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, required, value, onChange, placeholder, colors }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
  placeholder: string; colors: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
        {label}{required && <Text style={{ color: "#EF4444" }}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.fieldInput,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceLight },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },

  content: { padding: 16, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 14 },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  vigenciaRow: { flexDirection: "row", gap: 10 },
  vigenciaHalf: { flex: 1 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: -4 },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  vigenciaHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: -4 },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: -4,
  },
  totalLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  totalValue: { fontSize: 15, fontFamily: "Inter_700Bold" },

  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});
