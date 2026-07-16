import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
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

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { buildHTML } from "@/utils/report";

export default function RelatorioDadosModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { poi, savePOI, transactions, totalWithdrawals, totalExpenses } = useApp();

  const [remiNumber, setRemiNumber] = useState(poi.remiNumber ?? "");
  const [superintendenciaUf, setSuperintendenciaUf] = useState(poi.superintendenciaUf ?? "");
  const [supridoMatricula, setSupridoMatricula] = useState(poi.supridoMatricula ?? "");
  const [solicitanteName, setSolicitanteName] = useState(poi.solicitanteName ?? "");
  const [solicitanteMatricula, setSolicitanteMatricula] = useState(poi.solicitanteMatricula ?? "");
  const [solicitanteCargo, setSolicitanteCargo] = useState(poi.solicitanteCargo ?? "");
  const [gruSeiNumber, setGruSeiNumber] = useState(poi.gruSeiNumber ?? "");
  const [generating, setGenerating] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleGenerate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updatedPoi = {
      ...poi,
      remiNumber,
      superintendenciaUf,
      supridoMatricula,
      solicitanteName,
      solicitanteMatricula,
      solicitanteCargo,
      gruSeiNumber,
    };
    setGenerating(true);
    try {
      await savePOI(updatedPoi);
      if (Platform.OS === "web") {
        Alert.alert("Info", "Exportação de PDF disponível apenas no dispositivo móvel.");
        return;
      }
      const html = buildHTML(transactions, updatedPoi, totalWithdrawals, totalExpenses);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Exportar PDF" });
      router.back();
    } catch {
      Alert.alert("Erro", "Não foi possível gerar o PDF.");
    } finally {
      setGenerating(false);
    }
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Completar Relatório</Text>
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={generating}
          style={[styles.saveBtn, { backgroundColor: colors.gold }]}
        >
          <Text style={[styles.saveBtnText, { color: colors.navyDeep }]}>
            {generating ? "..." : "Gerar PDF"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Estes campos aparecem no PDF gerado. São opcionais — o relatório é gerado
          normalmente mesmo se ficarem em branco.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>CABEÇALHO</Text>

          <Field
            label="Superintendência (UF)"
            value={superintendenciaUf}
            onChange={setSuperintendenciaUf}
            placeholder="Ex: MG"
            colors={colors}
            autoCapitalize="characters"
          />
          <Field
            label="Número do REMI"
            value={remiNumber}
            onChange={setRemiNumber}
            placeholder="Ex: REMI/2026/001"
            colors={colors}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ENCERRAMENTO</Text>

          <Field
            label="Comprovante no SEI nº (GRU)"
            value={gruSeiNumber}
            onChange={setGruSeiNumber}
            placeholder="Nº do comprovante de recolhimento"
            colors={colors}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>APROVAÇÕES</Text>

          <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Suprido</Text>
          <Field
            label="Matrícula do Suprido"
            value={supridoMatricula}
            onChange={setSupridoMatricula}
            placeholder="Nº de matrícula"
            colors={colors}
          />

          <Text style={[styles.subLabel, { color: colors.textSecondary, marginTop: 6 }]}>Solicitante</Text>
          <Field
            label="Nome completo"
            value={solicitanteName}
            onChange={setSolicitanteName}
            placeholder="Nome completo do solicitante"
            colors={colors}
          />
          <Field
            label="Matrícula"
            value={solicitanteMatricula}
            onChange={setSolicitanteMatricula}
            placeholder="Nº de matrícula"
            colors={colors}
          />
          <Field
            label="Cargo"
            value={solicitanteCargo}
            onChange={setSolicitanteCargo}
            placeholder="Ex: Delegado da PRF"
            colors={colors}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, colors, autoCapitalize }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; colors: any; autoCapitalize?: "characters" | "words" | "none" | "sentences";
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceLight },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize={autoCapitalize}
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
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 2 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 14 },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  subLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

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
