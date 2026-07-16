import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { TransactionNature } from "@/types";
import { formatCurrencyInput, parseCurrencyInput } from "@/utils/format";

interface ExtractedData {
  numeroNota: string;
  dataEmissao: string;
  fornecedor: string;
  valorTotal: string;
}

function extractWithRegex(text: string): ExtractedData {
  const valueMatch = text.match(/(?:total|valor|r\$)\s*:?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/i);
  const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})/);
  const docMatch = text.match(/(?:nf|nota|nfe|cupom|doc)\s*[:\s#]?\s*(\d{3,})/i);

  return {
    numeroNota: docMatch?.[1] ?? "",
    dataEmissao: dateMatch?.[1] ?? "",
    fornecedor: "",
    valorTotal: valueMatch?.[1] ?? "",
  };
}

if (Platform.OS === "web") {
  // Web fallback — camera not supported
}

export default function CameraScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ nature?: TransactionNature }>();
  const { addTransaction } = useApp();

  const [permission, requestPermission] = Platform.OS !== "web"
    ? useCameraPermissions()
    : [{ granted: false }, async () => {}];

  const cameraRef = useRef<CameraView>(null);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [description, setDescription] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [amountStr, setAmountStr] = useState("R$ 0,00");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setExtracting(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) return;
      setCapturedUri(photo.uri);

      const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      let data: ExtractedData;

      if (geminiKey) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `Analise esta nota fiscal/cupom fiscal e extraia os dados estruturados. Retorne APENAS um JSON válido com este formato exato:
{"numeroNota":"string","dataEmissao":"string no formato dd/MM/yyyy","fornecedor":"string","valorTotal":"string com o valor numérico"}
Não adicione texto fora do JSON.`,
                      },
                      {
                        inline_data: {
                          mime_type: "image/jpeg",
                          data: photo.base64 ?? "",
                        },
                      },
                    ],
                  },
                ],
              }),
            }
          );
          const json = await response.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          const match = text.match(/\{[\s\S]*\}/);
          data = match ? JSON.parse(match[0]) : extractWithRegex("");
        } catch {
          data = extractWithRegex("");
        }
      } else {
        data = extractWithRegex("");
      }

      setExtracted(data);
      if (data.fornecedor) setBeneficiary(data.fornecedor);
      if (data.numeroNota) setDocNumber(data.numeroNota);
      if (data.dataEmissao) setDescription(`Despesa em ${data.dataEmissao}`);
      if (data.valorTotal) {
        const cleaned = data.valorTotal.replace(",", ".").replace(/[^\d.]/g, "");
        const val = parseFloat(cleaned) || 0;
        setAmountStr(formatCurrencyInput(val));
      }
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const val = parseCurrencyInput(amountStr);
    await addTransaction({
      type: "EXPENSE",
      amount: val,
      nature: params.nature,
      description: description || "Despesa escaneada",
      beneficiary: beneficiary || undefined,
      documentNumber: docNumber || undefined,
      isDificilComprovacao: false,
      invoicePhotoPath: capturedUri ?? undefined,
    });
    router.back();
    router.back();
  };

  // Web fallback
  if (Platform.OS === "web") {
    return (
      <View style={[styles.root, { backgroundColor: colors.navyDeep }]}>
        <View style={[styles.header, { paddingTop: topPad + 6, backgroundColor: colors.navyPrimary }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <Feather name="x" size={24} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Escanear Nota Fiscal</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContent}>
          <Feather name="smartphone" size={60} color={colors.textMuted} />
          <Text style={[styles.webMsg, { color: colors.textMuted }]}>
            Câmera disponível apenas no dispositivo móvel
          </Text>
          <Text style={[styles.webHint, { color: colors.textMuted }]}>
            Acesse o app via Expo Go para usar a câmera
          </Text>
        </View>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.navyDeep }]}>
        <View style={[styles.header, { paddingTop: topPad + 6, backgroundColor: colors.navyPrimary }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <Feather name="x" size={24} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Câmera</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContent}>
          <Feather name="camera-off" size={48} color={colors.textMuted} />
          <Text style={[styles.permMsg, { color: colors.textMuted }]}>
            Permissão de câmera necessária
          </Text>
          <TouchableOpacity
            onPress={requestPermission as any}
            style={[styles.permBtn, { backgroundColor: colors.gold }]}
          >
            <Text style={[styles.permBtnText, { color: colors.navyDeep }]}>Permitir Câmera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.navyDeep }]}>
      <View style={[styles.header, { paddingTop: topPad + 6, backgroundColor: colors.navyPrimary }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Escanear Nota Fiscal</Text>
        {capturedUri ? (
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.gold }]}>
            <Text style={[styles.saveBtnText, { color: colors.navyDeep }]}>Salvar</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {!capturedUri ? (
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back">
            <View style={styles.overlay}>
              <View style={[styles.scanFrame, { borderColor: colors.gold }]} />
              <Text style={[styles.scanHint, { color: colors.gold }]}>
                Posicione a nota dentro do quadro
              </Text>
            </View>
          </CameraView>
          <View style={[styles.captureBar, { backgroundColor: colors.navyPrimary, paddingBottom: bottomPad + 20 }]}>
            <TouchableOpacity onPress={handleCapture} style={[styles.captureBtn, { borderColor: colors.gold }]}>
              <View style={[styles.captureBtnInner, { backgroundColor: colors.gold }]} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.reviewContent, { paddingBottom: bottomPad + 24 }]}>
          <Image source={{ uri: capturedUri }} style={styles.preview} resizeMode="contain" />

          {extracting ? (
            <View style={styles.extractingRow}>
              <ActivityIndicator color={colors.gold} />
              <Text style={[styles.extractingText, { color: colors.gold }]}>
                Extraindo dados da nota...
              </Text>
            </View>
          ) : (
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.textMuted }]}>DADOS EXTRAÍDOS</Text>

              <FormField label="Fornecedor" value={beneficiary} onChange={setBeneficiary} colors={colors} />
              <FormField label="N° Documento" value={docNumber} onChange={setDocNumber} colors={colors} />
              <FormField label="Descrição" value={description} onChange={setDescription} colors={colors} />
              <FormField
                label="Valor Total"
                value={amountStr}
                onChange={setAmountStr}
                colors={colors}
                keyboardType="numeric"
              />

              <TouchableOpacity onPress={() => { setCapturedUri(null); setExtracted(null); }}>
                <Text style={[styles.retakeText, { color: colors.textMuted }]}>Tirar nova foto</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function FormField({ label, value, onChange, colors, keyboardType }: any) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceLight }]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? "default"}
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
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  scanFrame: {
    width: 260,
    height: 180,
    borderWidth: 2,
    borderRadius: 8,
    borderStyle: "dashed",
  },
  scanHint: { fontSize: 13, fontFamily: "Inter_500Medium" },
  captureBar: { alignItems: "center", paddingTop: 20 },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtnInner: { width: 54, height: 54, borderRadius: 27 },
  reviewContent: { padding: 16, gap: 12 },
  preview: { width: "100%", height: 220, borderRadius: 12 },
  extractingRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center", padding: 16 },
  extractingText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  formTitle: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.8 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  fieldInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, fontFamily: "Inter_400Regular" },
  retakeText: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center", marginTop: 4 },
  centerContent: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  webMsg: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  webHint: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  permMsg: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  permBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  permBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
